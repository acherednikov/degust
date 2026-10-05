import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/shared/item';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { PeerVolumeSlider } from './PeerVolumeSlider';
import { SignalBars } from './SignalBars';
import type { Peer } from '@/stores/signaling.store';
import type { ConnectionQuality } from '../hooks/usePeerConnectionQuality';

interface Props {
  peer: Pick<Peer, 'userId' | 'displayName' | 'muted'>;
  isSpeaking: boolean;
  level: number;
  quality: ConnectionQuality;
  isSelf?: boolean;
}

const QUALITY_LABEL: Record<ConnectionQuality, string> = {
  excellent: 'Отличное соединение',
  good: 'Хорошее соединение',
  fair: 'Среднее соединение',
  poor: 'Плохое соединение',
};

// const LEVEL_LABEL = (level: number) => {
//   if (level < 0.02) return 'Тишина';
//   if (level < 0.1) return 'Тихий голос';
//   if (level < 0.3) return 'Обычный голос';
//   return 'Громкий голос';
// };

export function PeerItem({ peer, isSpeaking, level, quality, isSelf = false }: Props) {
  return (
    <Item
      variant={isSpeaking ? 'muted' : 'default'}
      className={`
        border border-gray-300 rounded-lg
        ${isSpeaking
          ? 'ring-1 ring-green-500/40 bg-green-500/10 transition-colors'
          : 'transition-colors'}
        ${isSelf ? 'bg-gray-100' : ''}
      `}
    >
      <ItemMedia variant="image" className="flex align-center">
        <SignalBars level={level} />
      </ItemMedia>

      <ItemContent>
        <ItemTitle>
          {peer.displayName}
          {isSelf && <span className="text-xs text-gray-400">(вы)</span>}
          {peer.muted && <span className="text-xs text-gray-400">🔇</span>}
        </ItemTitle>
        {!isSelf && <ItemDescription>
          <div className="flex items-center gap-2">
            <ConnectionQualityIndicator quality={quality} />
            <p>{QUALITY_LABEL[quality]}</p>
          </div>
        </ItemDescription>}
      </ItemContent>

      {!isSelf && <ItemActions>
        <PeerVolumeSlider userId={peer.userId} />
      </ItemActions>}
    </Item>
  );
}
