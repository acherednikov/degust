import { useEffect, useRef } from 'react';

import { type Peer } from '@/stores/signaling.store';
import { usePeerVolumesStore } from '@/stores/peer-volumes.store';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { usePeerAudioLevel } from '@/hooks/usePeerAudioLevel';

import { PeerItem } from './PeerItem';
import { usePeerConnectionQuality } from '../hooks/usePeerConnectionQuality';

interface Props {
  peer: Peer;
}

export function PeerConnection({ peer }: Props) {
  const { remoteStream, pc } = usePeerConnection(peer);
  const { level, isSpeaking } = usePeerAudioLevel(pc, { threshold: 0.05 });
  const volume = usePeerVolumesStore((s) => s.volumes[peer.userId]) ?? 1;
  const { quality } = usePeerConnectionQuality(pc);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (volume !== undefined) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (remoteStream) {
      audio.srcObject = remoteStream;
      audio.play().catch((err) => console.warn('[audio] play failed', err));
    } else {
      // стрим пропал (cleanup pc) — отвязываем от audio
      audio.srcObject = null;
    }
  }, [remoteStream]);

  useEffect(() => {
    // на размонтировании отписываем audio
    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} autoPlay />
      <PeerItem peer={peer} isSpeaking={isSpeaking} level={level} quality={quality} />
      {/* для отладки: */}
      {/* <span className="text-xs">{peer.displayName}: {connectionState}</span> */}
    </>
  );
}
