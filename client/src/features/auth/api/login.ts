import { API_URL } from "@/config";

import type { LoginResponse } from "@/entities/auth/model/types";

import { decodeJwt } from "../lib/decodeJwt";

export const login = async (displayName: string): Promise<LoginResponse> => {
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
  console.log('> ! data !', data);
  const payload = decodeJwt(data.access_token);

  if (!payload) throw new Error('Invalid token received');

  return data;
}
