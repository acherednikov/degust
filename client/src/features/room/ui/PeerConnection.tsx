import { useEffect, useRef } from 'react';

import { type Peer } from '@/stores/signaling.store';
import { usePeerConnection } from '@/hooks/usePeerConnection';

interface Props {
  peer: Peer;
}

export function PeerConnection({ peer }: Props) {
  const { remoteStream } = usePeerConnection(peer);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !remoteStream) return;
    audio.srcObject = remoteStream;
    audio.play().catch((err) => {
      console.warn('[audio] autoplay blocked', err);
    });
  }, [remoteStream]);

  return (
    <>
      <audio ref={audioRef} autoPlay />
      {/* для отладки: */}
      {/* <span className="text-xs">{peer.displayName}: {connectionState}</span> */}
    </>
  );
}
