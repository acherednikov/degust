import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSignalingStore } from '@/stores/signaling.store';
import { Button } from '@/components/shared/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { MicPermission } from '@/components/shared/MicPermission';
import { useAuth } from '@/hooks/useAuth';
import { useRoomSession } from '@/hooks/useRoomSession';
import { PeerConnectionManager } from './PeerConnectionManager';

export function Room() {
  const { roomId } = useParams({ from: '/room/$roomId' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const connected = useSignalingStore((s) => s.connected);
  const joinRoom = useSignalingStore((s) => s.joinRoom);
  const leaveRoom = useSignalingStore((s) => s.leaveRoom);
  const peers = useSignalingStore((s) => s.peers);
  const selfSocketId = useSignalingStore((s) => s.selfSocketId);

  useRoomSession();

  // URL — единственный источник правды для roomId
  useEffect(() => {
    if (!connected) return;
    joinRoom(roomId);
    return () => leaveRoom();
  }, [connected, roomId, joinRoom, leaveRoom]);

  const handleLeave = () => {
    navigate({ to: '/' });  // без `from`, чтобы не привязываться к размонтируемому роуту
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <span className={connected ? 'text-green-600' : 'text-red-600'}>
          ● {connected ? 'Connected' : 'Disconnected'}
        </span>
        {selfSocketId && <span className="text-xs text-gray-500">you: {selfSocketId}</span>}
      </div>

      <div className="flex items-center gap-2">
        <span>Комната: <b>{roomId}</b></span>
        <Button variant="outline" size="sm" onClick={handleLeave}>
          Выйти
        </Button>
      </div>

      <div className="space-y-4">
        <MicPermission />
        <PeerConnectionManager />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Участники ({peers.length + 1})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            <li className="text-sm">
              {user?.displayName} <span className="text-gray-400">(вы)</span>
            </li>
            {peers.map((p) => (
              <li key={p.socketId} className="text-sm">
                {p.displayName} {p.muted && <span className="text-gray-400">🔇</span>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
