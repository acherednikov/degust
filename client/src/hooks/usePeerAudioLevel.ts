import { useEffect, useRef, useState } from 'react';

interface AudioLevelResult {
  level: number;       // 0–1, нормализованный уровень громкости
  isSpeaking: boolean; // превышает ли уровень порог
}

export function usePeerAudioLevel(
  pc: RTCPeerConnection | null,
  options?: { threshold?: number; intervalMs?: number },
): AudioLevelResult {
  const threshold = options?.threshold ?? 0.05;
  const intervalMs = options?.intervalMs ?? 200;

  const [level, setLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!pc) return;

    const poll = async () => {
      try {
        const stats = await pc.getStats();
        let audioLevel = 0;

        stats.forEach((report) => {
          // Локальный микрофон: media-source
          // if (isLocal && report.type === 'media-source' && report.kind === 'audio') {
          //   audioLevel = report.audioLevel ?? 0;
          // }
          // Удалённый поток: inbound-rtp
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            audioLevel = report.audioLevel ?? 0;
          }
        });

        // audioLevel уже нормализован в 0–1, делить на 255 не нужно
        setLevel(audioLevel);
        setIsSpeaking(audioLevel > threshold);
      } catch {
        // getStats падает при закрытии соединения — игнорируем
      }

      timeoutRef.current = window.setTimeout(poll, intervalMs);
    };

    poll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pc, threshold, intervalMs]);

  return { level, isSpeaking };
}