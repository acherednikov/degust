import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../config';

const TOKEN_KEY = 'voice-chat.token';

export interface AuthUser {
  displayName: string;
}

interface LoginResponse {
  access_token: string;
}

interface JwtPayload {
  sub: string;
  name: string;
  exp: number;
  iat: number;
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

function isExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // При монтировании — читаем токен из localStorage и валидируем
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    const payload = decodeJwt(stored);
    if (!payload || isExpired(payload)) {
      localStorage.removeItem(TOKEN_KEY);
      setLoading(false);
      return;
    }

    setToken(stored);
    setUser({ displayName: payload.name });
    setLoading(false);
  }, []);

  const login = useCallback(async (displayName: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message ?? 'Login failed');
    }

    const data: LoginResponse = await res.json();
    const payload = decodeJwt(data.access_token);

    if (!payload) throw new Error('Invalid token received');

    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser({ displayName: payload.name });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, loading, login, logout };
}
