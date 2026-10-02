import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

import { SOCKET_URL } from '@/config';

export interface Peer {
  socketId: string;
  userId: string;
  displayName: string;
  muted: boolean;
}

export interface IncomingIce {
  fromSocketId: string;
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

interface SignalingState {
  socket: Socket | null;
  connected: boolean;
  roomId: string | null;
  wasInRoom: boolean;
  selfSocketId: string | null;
  peers: Peer[];

  connect: (token: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  toggleMute: (muted: boolean) => void;

  sendOffer: (targetSocketId: string, sdp: string) => void;
  sendAnswer: (targetSocketId: string, sdp: string) => void;
  sendIce: (targetSocketId: string, payload: Omit<IncomingIce, 'fromSocketId'>) => void;
}

export const useSignalingStore = create<SignalingState>((set, get) => ({
  socket: null,
  connected: false,
  roomId: null,
  wasInRoom: false,
  selfSocketId: null,
  peers: [],

  connect: (token) => {
    if (get().socket) return;
    if (!token) {
      console.warn('No token, cannot connect');
      return;
    }

    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on('connect', () => {
      set({ connected: true, selfSocketId: socket.id ?? null });

      // Reconnect: если были в комнате — возвращаемся
      const { wasInRoom, roomId } = get();
      if (wasInRoom && roomId) {
        console.log('[signaling] reconnected, rejoining room', roomId);
        socket.emit('join-room', { roomId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[signaling] disconnected:', reason);
      // НЕ сбрасываем roomId/peers/wasInRoom — нужны для восстановления
      set({ connected: false, selfSocketId: null });
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log('[signaling] reconnect attempt', attempt);
    });

    socket.io.on('reconnect_failed', () => {
      console.error('[signaling] reconnect failed');
    });

    socket.on('room-joined', ({ selfSocketId, peers }) => {
      set({ selfSocketId, peers });
    });

    socket.on('peer-joined', (peer: Peer) => {
      set((state) => ({
        peers: [
          ...state.peers.filter(
            (p) => p.socketId !== peer.socketId && p.userId !== peer.userId,
          ),
          peer,
        ],
      }));
    });

    socket.on('peer-left', ({ socketId }) => {
      set((state) => ({
        peers: state.peers.filter((p) => p.socketId !== socketId),
      }));
    });

    socket.on('peer-muted', ({ socketId, muted }) => {
      set((state) => ({
        peers: state.peers.map((p) =>
          p.socketId === socketId ? { ...p, muted } : p,
        ),
      }));
    });

    socket.on('exception', (err) => {
      console.error('[signaling] exception:', err);
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({
      socket: null,
      connected: false,
      roomId: null,
      wasInRoom: false,
      peers: [],
      selfSocketId: null,
    });
  },

  joinRoom: (roomId) => {
    const socket = get().socket;
    if (!socket) return;
    set({ roomId, wasInRoom: true });
    socket.emit('join-room', { roomId });
  },

  leaveRoom: () => {
    const socket = get().socket;
    if (socket) socket.emit('leave-room');
    set({ roomId: null, wasInRoom: false, peers: [] });
  },

  toggleMute: (muted) => {
    get().socket?.emit('toggle-mute', { muted });
  },

  sendOffer: (targetSocketId, sdp) => {
    get().socket?.emit('offer', { targetSocketId, sdp });
  },

  sendAnswer: (targetSocketId, sdp) => {
    get().socket?.emit('answer', { targetSocketId, sdp });
  },

  sendIce: (targetSocketId, payload) => {
    get().socket?.emit('ice-candidate', { targetSocketId, ...payload });
  },
}));
