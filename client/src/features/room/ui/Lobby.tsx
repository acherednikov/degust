import { type SubmitEvent, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useSignalingStore } from '@/stores/signaling.store';
import { useRooms } from '@/features/room/api/useRooms';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { SignalState } from '@/components/shared/SignalState';

export function Lobby() {
  const navigate = useNavigate();
  
  const connected = useSignalingStore((s) => s.connected);
  const selfSocketId = useSignalingStore((s) => s.selfSocketId);

  const { data: rooms, isLoading, error } = useRooms();

  const [roomId, setRoomId] = useState('');

  const goToRoom = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed || !connected) return;
    navigate({ to: '/room/$roomId', params: { roomId: trimmed } });
  };

  const handleJoin = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    goToRoom(roomId);
  };

  return (
    <div className="space-y-4">
      <SignalState connected={connected} selfSocketId={selfSocketId} />
      <Card>
        <CardHeader>
          <CardTitle>Новая комната</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-2">
            <Input
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={!connected || !roomId.trim()}>
              Войти в комнату
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Мои комнаты</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-gray-500">Загрузка...</p>}
          {error && <p className="text-sm text-red-500">Не удалось загрузить комнаты</p>}
          {!isLoading && rooms?.length === 0 && (
            <p className="text-sm text-gray-500">Пока нет комнат</p>
          )}
          <ul className="space-y-1">
            {rooms?.map((room) => (
              <li key={room.id}>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!connected}
                  onClick={() => goToRoom(room.name)}
                >
                  {room.name}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
