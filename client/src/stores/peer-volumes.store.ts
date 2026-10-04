import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PeerVolumesState {
  volumes: Record<string, number>;   // 0..1
  setVolume: (userId: string, volume: number) => void;
  getVolume: (userId: string) => number;
  clearVolume: (userId: string) => void;
}

export const usePeerVolumesStore = create<PeerVolumesState>()(
  persist(
    (set, get) => ({
      volumes: {},

      setVolume: (userId, volume) =>
        set((state) => ({
          volumes: { ...state.volumes, [userId]: Math.max(0, Math.min(1, volume)) },
        })),

      getVolume: (userId) => get().volumes[userId],

      clearVolume: (userId) =>
        set((state) => {
          const { [userId]: _, ...rest } = state.volumes;
          return { volumes: rest };
        }),
    }),
    {
      name: 'voice-chat.peer-volumes',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
