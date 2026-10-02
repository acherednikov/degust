import { type Peer } from '@/stores/signaling.store';

import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import type { ConnectionQuality } from '../hooks/usePeerConnectionQuality';

interface Props {
  peer: Pick<Peer, 'displayName' | 'muted'>;
  isSpeaking: boolean;
  level: number;
  quality: ConnectionQuality;
}

export function PeerItem({ peer, isSpeaking, level, quality }: Props) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
        isSpeaking ? 'bg-green-500/15 ring-1 ring-green-500/40' : ''
      }`}
    >
      <ConnectionQualityIndicator quality={quality} />
      <span className="text-sm font-medium">{peer.displayName}</span>
      {peer.muted && <span className="text-xs text-gray-400">🔇</span>}
      <SignalBars level={level} />
    </div>
  );
}

function SignalBars({ level }: { level: number }) {
  const bars =
    level < 0.02 ? 0 :
    level < 0.1  ? 1 :
    level < 0.25 ? 2 :
    level < 0.5  ? 3 : 4;

  return (
    <div className="flex items-end gap-[2px] h-4 ml-auto">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-[3px] rounded-sm transition-all duration-150 ${
            i < bars ? 'bg-green-500' : 'bg-gray-300'
          }`}
          style={{ height: `${(i + 1) * 25}%` }}
        />
      ))}
    </div>
  );
}
