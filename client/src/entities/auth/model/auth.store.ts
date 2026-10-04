import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { LoginResponse, User } from './types';

interface AuthState {
  token: string | null;
  user: User | null;

  login: (data: LoginResponse) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: async (data: LoginResponse) => {
        set({
          token: data.access_token,
          user: data.user,
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
