import type { ConnectionQuality } from '../hooks/usePeerConnectionQuality';

interface Props {
  quality: ConnectionQuality;
}

const COLORS: Record<ConnectionQuality, string> = {
  excellent: 'bg-green-500',
  good: 'bg-lime-500',
  fair: 'bg-yellow-500',
  poor: 'bg-red-500',
};

// Сколько полосок заполнено для каждого качества
const BARS: Record<ConnectionQuality, number> = {
  excellent: 3,
  good: 2,
  fair: 1,
  poor: 0,
};

export function ConnectionQualityIndicator({ quality }: Props) {
  const filled = BARS[quality];

  return (
    <div className="flex items-end gap-[2px] h-3" title={`Quality: ${quality}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-md h-full ${
            i <= filled && quality !== 'poor' ? COLORS[quality] : 'bg-gray-300'
          }`}
          // style={{ height: `${(i + 1) * 33}%` }}
        />
      ))}
    </div>
  );
}
