import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useSignalingStore } from '@/stores/signaling.store';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';

export function Lobby() {
  const navigate = useNavigate();
  const connected = useSignalingStore((s) => s.connected);
  const [roomId, setRoomId] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roomId.trim();
    if (!trimmed || !connected) return;
    navigate({ to: '/room/$roomId', params: { roomId: trimmed } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Лобби</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="space-y-2">
          <Input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <Button type="submit" disabled={!connected || !roomId.trim()} className="w-full">
            Войти в комнату
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
