import { Button } from '@/components/shared/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { MicPermission } from '@/components/shared/MicPermission';

import { useAuth } from '@/hooks/useAuth';
import { useRoomSession } from '@/hooks/useRoomSession';
import { useSignalingStore } from '@/stores/signaling.store';
// import { useLocalMediaStore } from '@/stores/local-media.store';

import { PeerConnectionManager } from './PeerConnectionManager';
// import { useLocalAudioLevel } from '@/hooks/useLocalAudioLevel';
// import { PeerItem } from './PeerItem';

export function RoomView() {
  const { user } = useAuth();

  useRoomSession();

  const {
    connected,
    joinRoom,
    leaveRoom,
    roomId,
    peers,
    selfSocketId,
  } = useSignalingStore();

  // const localStream = useLocalMediaStore((s) => s.stream);
  // const { level, isSpeaking } = useLocalAudioLevel(localStream);

  const handleJoin = () => {
    console.log('[RoomView] join clicked, connected =', connected);
    if (!connected) {
      alert('Соединение ещё не установлено');
      return;
    }
    const id = prompt('Room ID:', 'test-room');
    if (id) joinRoom(id);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <span className={connected ? 'text-green-600' : 'text-red-600'}>
          ● {connected ? 'Connected' : 'Disconnected'}
        </span>
        {selfSocketId && <span className="text-xs text-gray-500">you: {selfSocketId}</span>}
      </div>

      {!roomId ? (
        <Button onClick={handleJoin} disabled={!connected}>
          Войти в комнату
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span>Комната: <b>{roomId}</b></span>
            <Button variant="outline" size="sm" onClick={leaveRoom}>
              Выйти
            </Button>
          </div>

          {/* {user && <PeerItem
            peer={{ displayName: user.displayName, muted: !localStream?.getAudioTracks()[0]?.enabled }}
            isSpeaking={isSpeaking}
            level={level}
          />} */}

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
      )}
    </div>
  );
}
