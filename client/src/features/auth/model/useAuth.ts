import { useCallback, useEffect } from 'react';

import { useSignalingStore } from '@/stores/signaling.store';

import { useAuthStore } from '@/entities/auth/model/auth.store';
import { login as loginRequest } from "../api/login";
import { decodeJwt } from '../lib/decodeJwt';

const TOKEN_KEY = 'voice-chat.token';

export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  const connect = useSignalingStore((s) => s.connect);

  // При монтировании — читаем токен из localStorage и валидируем
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      return;
    }

    const payload = decodeJwt(storedToken);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }

    storeLogin(payload.name, storedToken);
    connect(storedToken);
  }, []);

  const login = useCallback(async (displayName: string) => {
    try {
      const { data } = await loginRequest(displayName);

      localStorage.setItem(TOKEN_KEY, data.access_token);

      storeLogin(displayName, data.access_token);
      connect(data.access_token);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    storeLogout();
  }, []);

  return { token, user, login, logout };
}
