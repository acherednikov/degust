import { useEffect, useRef, useState } from 'react';

import { ICE_SERVERS } from '@/config';
import { useSignalingStore, type Peer } from '@/stores/signaling.store';
import { useLocalMediaStore } from '@/stores/local-media.store';

interface PendingIce {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export function usePeerConnection(peer: Peer) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<PendingIce[]>([]);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const selfSocketId = useSignalingStore((s) => s.selfSocketId);
  const socket = useSignalingStore((s) => s.socket);
  const sendOffer = useSignalingStore((s) => s.sendOffer);
  const sendAnswer = useSignalingStore((s) => s.sendAnswer);
  const sendIce = useSignalingStore((s) => s.sendIce);
  const localStream = useLocalMediaStore((s) => s.stream);

  // Кто инициирует оффер: тот, у кого socketId лексикографически меньше.
  const isInitiator = !!selfSocketId && selfSocketId < peer.socketId;

  useEffect(() => {
    console.log('[pc] effect start', { selfSocketId, peerSocketId: peer.socketId, isInitiator, hasLocalStream: !!localStream });
    if (!socket || !localStream || !selfSocketId) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // 1. Добавляем локальные треки
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // 2. Локальный ICE → на сервер
    pc.onicecandidate = (event) => {
      // Firefox присылает { candidate: "" } в конце сбора — пропускаем
      if (!event.candidate || !event.candidate.candidate) return;

      if (event.candidate?.candidate) {
        console.log('[pc] onicecandidate', event.candidate);
        sendIce(peer.socketId, {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid ?? undefined,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
        });
      }
    };

    // pc.onicegatheringstatechange = () => {
    // console.log('[pc] iceGatheringState', pc.iceGatheringState);
    // };

    // pc.onsignalingstatechange = () => {
    //   console.log('[pc] signalingState', pc.signalingState);
    // };

    // 3. Состояние соединения
    pc.onconnectionstatechange = () => {
      console.log('[pc] connectionState', pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    // 4. Удалённый трек → играем
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    // 5. Слушаем события сигналинга для этого пира

    const handleOffer = async ({ fromSocketId, sdp }: { fromSocketId: string; sdp: string }) => {
      if (fromSocketId !== peer.socketId) return;
      try {
        await pc.setRemoteDescription({ type: 'offer', sdp });
      } catch (err) {
        console.error('[pc] setRemoteDescription(offer) failed', err);
        return;
      }
      await drainPendingIce(pc, pendingIceRef);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendAnswer(peer.socketId, answer.sdp!);
    };

    const handleAnswer = async ({ fromSocketId, sdp }: { fromSocketId: string; sdp: string }) => {
      if (fromSocketId !== peer.socketId) return;
      try {
        await pc.setRemoteDescription({ type: 'answer', sdp });
      } catch (err) {
        console.error('[pc] setRemoteDescription(answer) failed', err);
        return;
      }
      await drainPendingIce(pc, pendingIceRef);
    };

    const handleIce = async (payload: PendingIce & { fromSocketId: string }) => {
      if (payload.fromSocketId !== peer.socketId) return;
      if (!pc.remoteDescription) {
        pendingIceRef.current.push(payload);
        return;
      }
      await pc.addIceCandidate({
        candidate: payload.candidate,
        sdpMid: payload.sdpMid,
        sdpMLineIndex: payload.sdpMLineIndex,
      });
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIce);

    // 6. Если мы инициатор — создаём оффер
    if (isInitiator) {
      (async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendOffer(peer.socketId, offer.sdp!);
      })();
    }

    // 7. Cleanup
    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIce);
      pc.close();
      pcRef.current = null;
      pendingIceRef.current = [];
      setRemoteStream(null);
      setConnectionState('closed');
    };
  }, [
    socket,
    localStream,
    selfSocketId,
    peer.socketId,
    isInitiator,
    sendOffer,
    sendAnswer,
    sendIce,
  ]);

  return { connectionState, remoteStream };
}

async function drainPendingIce(
  pc: RTCPeerConnection,
  ref: React.RefObject<PendingIce[]>,
) {
  if (!pc.remoteDescription) return;   // ← страховка
  const queue = ref.current;
  ref.current = [];
  for (const c of queue) {
    if (!c.candidate) continue;        // ← пропускаем пустые
    try {
      await pc.addIceCandidate({
        candidate: c.candidate,
        sdpMid: c.sdpMid,
        sdpMLineIndex: c.sdpMLineIndex,
      });
    } catch (err) {
      console.warn('[webrtc] failed to add pending ice', err);
    }
  }
}
