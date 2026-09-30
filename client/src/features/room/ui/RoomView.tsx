import { createContext, use } from 'react';

import { Button } from '@/components/shared/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { MicPermission } from '@/components/shared/MicPermission';

import { useAuth, type AuthUser } from '@/hooks/useAuth';
import { useRoomSession } from '@/hooks/useRoomSession';
import { useSignalingStore, type Peer } from '@/stores/signaling.store';

import { PeerConnectionManager } from './PeerConnectionManager';

interface RoomViewState {
  connected: boolean;
  roomId: string | null;
  selfSocketId: string | null;
  peers: Peer[];
  user: AuthUser | null;
}

interface RoomViewActions {
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- reserved for future refs / derived meta
interface RoomViewMeta {}

interface RoomViewContextValue {
  state: RoomViewState;
  actions: RoomViewActions;
  meta: RoomViewMeta;
}

const RoomViewContext = createContext<RoomViewContextValue | null>(null);

/**
 * Поднимает стейт из auth / signaling сторов в провайдер.
 * Только этот компонент знает, откуда берутся данные.
 */
function RoomViewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  useRoomSession();

  const connected = useSignalingStore((s) => s.connected);
  const joinRoom = useSignalingStore((s) => s.joinRoom);
  const leaveRoom = useSignalingStore((s) => s.leaveRoom);
  const roomId = useSignalingStore((s) => s.roomId);
  const peers = useSignalingStore((s) => s.peers);
  const selfSocketId = useSignalingStore((s) => s.selfSocketId);

  const value: RoomViewContextValue = {
    state: { connected, roomId, selfSocketId, peers, user },
    actions: { joinRoom, leaveRoom },
    meta: {},
  };

  return (
    <RoomViewContext value={value}>
      {children}
    </RoomViewContext>
  );
}

function useRoomViewContext(): RoomViewContextValue {
  const ctx = use(RoomViewContext);
  if (!ctx) {
    throw new Error('RoomView subcomponents must be used within <RoomView.Provider>');
  }
  return ctx;
}

function RoomViewFrame({ children }: { children: React.ReactNode }) {
  return <div className="p-6 space-y-4">{children}</div>;
}

function RoomViewStatus() {
  const { state } = useRoomViewContext();
  const { connected, selfSocketId } = state;

  return (
    <div className="flex items-center gap-4">
      <span className={connected ? 'text-green-600' : 'text-red-600'}>
        ● {connected ? 'Connected' : 'Disconnected'}
      </span>
      {selfSocketId && <span className="text-xs text-gray-500">you: {selfSocketId}</span>}
    </div>
  );
}

function RoomViewLobby() {
  const { state, actions } = useRoomViewContext();
  const { connected } = state;

  const handleJoin = () => {
    console.log('[RoomView] join clicked, connected =', connected);
    if (!connected) {
      alert('Соединение ещё не установлено');
      return;
    }
    const id = prompt('Room ID:', 'test-room');
    if (id) actions.joinRoom(id);
  };

  return (
    <Button onClick={handleJoin} disabled={!connected}>
      Войти в комнату
    </Button>
  );
}

function RoomViewRoomHeader() {
  const { state, actions } = useRoomViewContext();
  const { roomId } = state;

  if (!roomId) return null;

  return (
    <div className="flex items-center gap-2">
      <span>Комната: <b>{roomId}</b></span>
      <Button variant="outline" size="sm" onClick={actions.leaveRoom}>
        Выйти
      </Button>
    </div>
  );
}

function RoomViewMediaControls() {
  const { state } = useRoomViewContext();
  if (!state.roomId) return null;

  return (
    <div className="space-y-4">
      <MicPermission />
      <PeerConnectionManager />
    </div>
  );
}

function RoomViewParticipants() {
  const { state } = useRoomViewContext();
  const { peers, user, roomId } = state;

  if (!roomId) return null;

  return (
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
  );
}

/**
 * Явный вариант: пользователь находится в комнате.
 * Компонует все подкомпоненты нужные для этого состояния.
 */
function RoomViewJoined() {
  return (
    <div className="space-y-4">
      <RoomViewRoomHeader />
      <RoomViewMediaControls />
      <RoomViewParticipants />
    </div>
  );
}

/**
 * Явный вариант: пользователь вне комнаты (лобби).
 */
function RoomViewLobbyVariant() {
  return <RoomViewLobby />;
}

/**
 * Вариант, автоматически выбирающий Lobby или Joined
 * в зависимости от того, есть ли у пользователя roomId.
 */
function RoomViewAuto() {
  const { state } = useRoomViewContext();
  return state.roomId ? <RoomViewJoined /> : <RoomViewLobbyVariant />;
}

export function RoomView() {
  return (
    <RoomViewProvider>
      <RoomViewFrame>
        <RoomViewStatus />
        <RoomViewAuto />
      </RoomViewFrame>
    </RoomViewProvider>
  );
}

export const Room = {
  Provider: RoomViewProvider,
  Frame: RoomViewFrame,
  Status: RoomViewStatus,
  Lobby: RoomViewLobbyVariant,
  Joined: RoomViewJoined,
  RoomHeader: RoomViewRoomHeader,
  MediaControls: RoomViewMediaControls,
  Participants: RoomViewParticipants,
  Auto: RoomViewAuto,
} as const;

