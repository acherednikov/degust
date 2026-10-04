import { usePeerVolumesStore } from '@/stores/peer-volumes.store';
import { Slider } from '@/components/shared/slider';

interface Props {
  userId: string;
}

export function PeerVolumeSlider({ userId }: Props) {
  const volume = usePeerVolumesStore((s) => s.volumes[userId]) ?? 1;
  const setVolume = usePeerVolumesStore((s) => s.setVolume);

  return (
    <div className="flex items-center gap-2 w-32">
      <span className="text-xs text-gray-400">{Math.round(volume * 100)}%</span>
      <Slider
        value={volume * 100}
        onValueChange={(value) => {
          const volume = value as number;
          setVolume(userId, volume / 100);
        }}
        min={0}
        max={100}
        step={10}
        className="flex-1"
      />
    </div>
  );
}
