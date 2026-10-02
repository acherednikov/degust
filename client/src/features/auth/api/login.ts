import { API_URL } from "@/config";

import type { JwtPayload } from "@/entities/auth/model/types";
import type { LoginResponse } from "./dto";
import { decodeJwt } from "../lib/decodeJwt";

export const login = async (displayName: string): Promise<{ data: LoginResponse, jwtPayload: JwtPayload }> => {
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

  return {
    data,
    jwtPayload: payload,
  }
}
