import { create } from 'zustand';

interface LocalMediaState {
  stream: MediaStream | null;
  audioTrack: MediaStreamTrack | null;
  enabled: boolean;      // микрофон включён (не muted)
  permission: 'unknown' | 'granted' | 'denied' | 'error';
  error: string | null;
  requesting: boolean;

  requestMedia: () => Promise<MediaStream | null>;
  setEnabled: (enabled: boolean) => void;
  stop: () => void;
}

export const useLocalMediaStore = create<LocalMediaState>((set, get) => ({
  stream: null,
  audioTrack: null,
  enabled: true,
  permission: 'unknown',
  error: null,
  requesting: false,

  requestMedia: async () => {
    // Уже есть — возвращаем существующий (идемпотентность, как с сокетом)
    const existing = get().stream;
    if (existing) return existing;

    if (get().requesting) return null;
    set({ requesting: true, error: null });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const audioTrack = stream.getAudioTracks()[0] ?? null;

      set({
        stream,
        audioTrack,
        enabled: audioTrack?.enabled ?? false,
        permission: 'granted',
        requesting: false,
      });

      return stream;
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Доступ к микрофону запрещён'
          : err instanceof Error
            ? err.message
            : 'Не удалось получить доступ к микрофону';

      set({
        permission: 'denied',
        error: message,
        requesting: false,
      });

      return null;
    }
  },

  setEnabled: (enabled) => {
    const track = get().audioTrack;
    if (!track) return;
    track.enabled = enabled;
    set({ enabled });
  },

  stop: () => {
    const stream = get().stream;
    stream?.getTracks().forEach((t) => t.stop());
    set({
      stream: null,
      audioTrack: null,
      enabled: true,
      permission: 'unknown',
      error: null,
    });
  },
}));
