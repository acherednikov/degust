import { useEffect } from 'react';

import { useLocalMediaStore } from '@/stores/local-media.store';

export function useLocalMedia() {
  const { stream, enabled, permission, error, requesting, requestMedia, setEnabled, stop } =
    useLocalMediaStore();

  useEffect(() => {
    // Запрашиваем только когда пользователь уже в комнате — не на логине
    return () => {
      // Не останавливаем здесь: StrictMode убьёт поток при первом unmount
    };
  }, []);

  const toggleMute = () => setEnabled(!enabled);

  return {
    stream,
    enabled,
    permission,
    error,
    requesting,
    requestMedia,
    toggleMute,
    stop,
  };
}
