import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';

import { useSignalingStore } from '@/stores/signaling.store';
import { Button } from '@/components/shared/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { Spinner } from '@/components/shared/spinner';
import { MicPermission } from '@/components/shared/MicPermission';
import { SignalState } from '@/components/shared/SignalState';
import { useAuth } from '@/features/auth/model/useAuth';
import { useRoomSession } from '@/hooks/useRoomSession';

import { PeerConnectionManager } from './PeerConnectionManager';
import { useInvalidateRooms } from '../api/useRooms';

export function Room() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { roomId } = useParams({ from: '/room/$roomId' });
  const connected = useSignalingStore((s) => s.connected);
  const joinRoom = useSignalingStore((s) => s.joinRoom);
  const leaveRoom = useSignalingStore((s) => s.leaveRoom);
  const peers = useSignalingStore((s) => s.peers);
  const selfSocketId = useSignalingStore((s) => s.selfSocketId);

  useRoomSession();
  const invalidateRooms = useInvalidateRooms();

  // URL — единственный источник правды для roomId
  useEffect(() => {
    if (!connected) return;
    joinRoom(roomId);
    return () => leaveRoom();
  }, [connected, roomId, joinRoom, leaveRoom]);

  const handleLeave = () => {
    invalidateRooms();
    navigate({ to: '/' });  // без `from`, чтобы не привязываться к размонтируемому роуту
  };

  if (!connected) {
    return (
      <div className="p-6 justify-center items-center flex flex-col gap-y-2">
        <p className="text-sm text-gray-500">Подключение к серверу...</p>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <SignalState connected={connected} selfSocketId={selfSocketId} />

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
                {p.displayName}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
