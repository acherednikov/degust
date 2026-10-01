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
  const [pcInstance, setPcInstance] = useState<RTCPeerConnection | null>(null);

  const selfSocketId = useSignalingStore((s) => s.selfSocketId);
  const socket = useSignalingStore((s) => s.socket);
  const sendOffer = useSignalingStore((s) => s.sendOffer);
  const sendAnswer = useSignalingStore((s) => s.sendAnswer);
  const sendIce = useSignalingStore((s) => s.sendIce);
  const localStream = useLocalMediaStore((s) => s.stream);

  // ─────────────────────────────────────────────────────────────
  // Эффект №1: создание pc + сигналинг
  // Не зависит от localStream — pc живёт независимо от микрофона.
  // ─────────────────────────────────────────────────────────────

  const isInitiatorRef = useRef(false);

  useEffect(() => {
    if (!socket || !selfSocketId) return;

    const isInitiator = selfSocketId < peer.socketId;
    isInitiatorRef.current = isInitiator;

    console.log('[pc] create', { selfSocketId, peerSocketId: peer.socketId, isInitiator });

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    setPcInstance(pc);

    // Локальный ICE → на сервер
    pc.onicecandidate = (event) => {
      if (!event.candidate?.candidate) return;
      sendIce(peer.socketId, {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid ?? undefined,
        sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
      });
    };

    pc.onconnectionstatechange = () => {
      console.log('[pc] connectionState', pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

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
      try {
        await pc.addIceCandidate({
          candidate: payload.candidate,
          sdpMid: payload.sdpMid,
          sdpMLineIndex: payload.sdpMLineIndex,
        });
      } catch (err) {
        console.warn('[pc] addIceCandidate failed', err);
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIce);

    // Cleanup
    return () => {
      console.log('[pc] cleanup', peer.socketId);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIce);
      pc.close();
      pcRef.current = null;
      setPcInstance(null);
      pendingIceRef.current = [];
      setRemoteStream(null);
      setConnectionState('closed');
    };
  }, [socket, selfSocketId, peer.socketId, sendAnswer, sendIce]);

  // ─────────────────────────────────────────────────────────────
  // Эффект №2: добавление локального трека + оффер
  // Срабатывает, когда появится localStream (или изменится).
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const pc = pcRef.current;
    if (!pc) return;
    if (!localStream) return;

    // Удаляем старые senders (защита от повторного добавления)
    pc.getSenders().forEach((sender) => {
      if (sender.track) pc.removeTrack(sender);
    });

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Если мы инициатор и ещё не отправляли оффер — отправляем
    if (isInitiatorRef.current && pc.signalingState === 'stable') {
      (async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendOffer(peer.socketId, offer.sdp!);
        } catch (err) {
          console.warn('[pc] createOffer failed', err);
        }
      })();
    }
  }, [localStream, peer.socketId, sendOffer]);

  return { connectionState, remoteStream, pc: pcInstance };
}

async function drainPendingIce(
  pc: RTCPeerConnection,
  ref: React.RefObject<PendingIce[]>,
) {
  if (!pc.remoteDescription) return;
  const queue = ref.current;
  ref.current = [];
  for (const c of queue) {
    if (!c.candidate) continue;
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
