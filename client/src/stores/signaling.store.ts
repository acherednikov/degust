import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

import { SOCKET_URL } from '@/config';

export interface Peer {
  socketId: string;
  userId: string;
  displayName: string;
  muted: boolean;
}

export interface IncomingOffer {
  fromSocketId: string;
  sdp: string;
}

export interface IncomingAnswer {
  fromSocketId: string;
  sdp: string;
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
  // roomId: null,
  selfSocketId: null,
  peers: [],

  connect: (token: string) => {
    // Уже есть живой сокет — не трогаем
    if (get().socket) return;

    if (!token) {
      console.warn('No token, cannot connect');
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      // transports: ['websocket'],
    });

    socket.on('connect', () => {
      set({ connected: true, selfSocketId: socket.id ?? null });
    });

    socket.on('disconnect', () => {
      set({ connected: false, peers: [], selfSocketId: null });
    });

    socket.on('room-joined', ({ selfSocketId, peers }) => {
      set({ selfSocketId, peers });
    });

    socket.on('peer-joined', (peer: Peer) => {
      set((state) => ({
        peers: [...state.peers.filter((p) => p.socketId !== peer.socketId), peer],
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
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, connected: false, peers: [], selfSocketId: null });
  },

  joinRoom: (roomId) => {
    const socket = get().socket;
    console.log('[joinRoom] called. roomId:', roomId, 'socket:', socket?.id, 'connected:', socket?.connected);
    if (!socket) return;
    socket.emit('join-room', { roomId });
  },

  leaveRoom: () => {
    const socket = get().socket;
    if (!socket) return;
    socket.emit('leave-room');
    set({ peers: [] });
  },

  toggleMute: (muted) => {
    const socket = get().socket;
    if (!socket) return;
    socket.emit('toggle-mute', { muted });
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
