import { API_URL } from '@/config';
import { useAuthStore } from '@/stores/auth.store';

export interface RoomSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRooms(): Promise<RoomSummary[]> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
