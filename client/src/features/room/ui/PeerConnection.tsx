import { useEffect, useRef } from 'react';

import { type Peer } from '@/stores/signaling.store';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { usePeerAudioLevel } from '@/hooks/usePeerAudioLevel';

import { PeerItem } from './PeerItem';

interface Props {
  peer: Peer;
}

export function PeerConnection({ peer }: Props) {
  const { remoteStream, pc } = usePeerConnection(peer);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { level, isSpeaking } = usePeerAudioLevel(pc, false, { threshold: 0.05 });

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
      <PeerItem peer={peer} isSpeaking={isSpeaking} level={level} />
      {/* для отладки: */}
      {/* <span className="text-xs">{peer.displayName}: {connectionState}</span> */}
    </>
  );
}
