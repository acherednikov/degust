import { Button } from '@/components/shared/button';
import { useLocalMedia } from '@/hooks/useLocalMedia';

export function MicPermission() {
  const { permission, error, requesting, requestMedia, enabled, toggleMute, stream } =
    useLocalMedia();

  console.log('[mic] stream:', stream, 'tracks:', stream?.getAudioTracks().length);

  if (!stream) {
    return (
      <div className="flex items-center gap-3">
        <Button onClick={requestMedia} disabled={requesting}>
          {requesting ? 'Запрос...' : 'Включить микрофон'}
        </Button>
        {permission === 'denied' && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant={enabled ? 'default' : 'secondary'} onClick={toggleMute}>
        {enabled ? '🎙️ Микрофон вкл' : '🔇 Микрофон выкл'}
      </Button>
    </div>
  );
}
