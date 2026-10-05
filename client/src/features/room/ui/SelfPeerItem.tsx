import { useLocalMediaStore } from '@/stores/local-media.store';
import { useLocalAudioLevel } from '@/hooks/useLocalAudioLevel';
import { useAuth } from '@/features/auth/model/useAuth';

import { PeerItem } from './PeerItem';

export function SelfPeerItem() {
  const { user } = useAuth();
  const stream = useLocalMediaStore((s) => s.stream);
  const enabled = useLocalMediaStore((s) => s.enabled);
  const { level, isSpeaking } = useLocalAudioLevel(stream);

  if (!user) return null;

  return (
    <PeerItem
      isSelf
      peer={{
        userId: user.id,
        displayName: user.displayName,
        muted: !enabled,
      }}
      isSpeaking={isSpeaking}
      level={level}
      quality="excellent"
    />
  );
}
