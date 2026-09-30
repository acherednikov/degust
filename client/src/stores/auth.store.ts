import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { API_URL } from '../config';
import { useSignalingStore } from './signaling.store';

export interface AuthUser {
  userId: string;
  displayName: string;
}

interface JwtPayload {
  sub: string;
  name: string;
  exp: number;
  iat: number;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (userId: string, displayName: string) => Promise<void>;
  logout: () => void;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: async (userId, displayName) => {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, displayName }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message ?? 'Login failed');
        }

        const data: { access_token: string } = await res.json();
        const payload = decodeJwt(data.access_token);

        if (!payload) throw new Error('Invalid token received');

        set({
          token: data.access_token,
          user: { userId: payload.sub, displayName: payload.name },
        });

        useSignalingStore.getState().connect(data.access_token);
      },

      logout: () => {
        // useSignalingStore.getState().disconnect();
        set({ token: null, user: null });
      },
    }),
    {
      name: 'voice-chat.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
