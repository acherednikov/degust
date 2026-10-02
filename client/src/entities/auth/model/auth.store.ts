import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AuthUser } from './types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;

  login: (displayName: string, token: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: async (displayName: string, token: string) => {
        set({
          token,
          user: { displayName },
        });
        // useSignalingStore.getState().connect(token);
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
