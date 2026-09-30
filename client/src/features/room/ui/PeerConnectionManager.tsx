import { useSignalingStore } from '@/stores/signaling.store';
import { PeerConnection } from './PeerConnection';

export function PeerConnectionManager() {
  const peers = useSignalingStore((s) => s.peers);

  return (
    <>
      {peers.map((peer) => (
        <PeerConnection key={peer.socketId} peer={peer} />
      ))}
    </>
  );
}
