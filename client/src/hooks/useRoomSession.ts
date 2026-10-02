import { useEffect, useRef } from 'react';
import { useParams } from '@tanstack/react-router';

import { useSignalingStore } from '@/stores/signaling.store';
import { useLocalMediaStore } from '@/stores/local-media.store';

export function useRoomSession() {
  const { roomId } = useParams({ from: '/room/$roomId' });

  const stream = useLocalMediaStore((s) => s.stream);
  const permission = useLocalMediaStore((s) => s.permission);
  const requesting = useLocalMediaStore((s) => s.requesting);
  const enabled = useLocalMediaStore((s) => s.enabled);
  const requestMedia = useLocalMediaStore((s) => s.requestMedia);

  const connected = useSignalingStore((s) => s.connected);
  const toggleMute = useSignalingStore((s) => s.toggleMute);

  // Защита от повторного запроса на каждый ре-рендер
  const requestedRef = useRef(false);

  useEffect(() => {
    // Сброс флага при выходе из комнаты — чтобы следующее вхождение снова запросило
    if (!roomId) {
      requestedRef.current = false;
      return;
    }

    // Не дёргаем getUserMedia, пока сокет не подключён
    if (!connected) return;

    // Уже есть поток — не нужно
    if (stream) return;

    // Уже запросили — не спамим (важно для StrictMode и повторных рендеров)
    if (requestedRef.current) return;

    // Пользователь отказался — не мучаем его снова автоматически
    if (permission === 'denied') return;

    // Запрос уже в процессе
    if (requesting) return;

    requestedRef.current = true;

    requestMedia()
      .catch((err) => {
        console.warn('[session] requestMedia failed', err);
      })
      .finally(() => {
        toggleMute(!enabled);
      });
  }, [roomId, connected, stream, permission, requesting, enabled, requestMedia, toggleMute]);
}
