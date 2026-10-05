import { useEffect, useRef, useState } from 'react';

export function useLocalAudioLevel(
  stream: MediaStream | null,
  threshold = 0.05,
  intervalMs = 250,
) {
  const [level, setLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalized = avg / 255;
      // квантуем до 5%, чтобы не дёргать рендер на float-шуме
      const quantized = Math.round(normalized * 20) / 20;

      setLevel((prev) => (prev === quantized ? prev : quantized));
      setIsSpeaking((prev) => {
        const next = quantized > threshold;
        return prev === next ? prev : next;
      });

      timeoutRef.current = window.setTimeout(update, intervalMs);
    };

    update();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [stream, threshold, intervalMs]);

  return { level, isSpeaking };
}
