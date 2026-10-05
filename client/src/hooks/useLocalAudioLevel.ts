import { useEffect, useRef, useState } from 'react';

export function useLocalAudioLevel(
  stream: MediaStream | null,
  threshold = 0.05,
  intervalMs = 250,
) {
  const [level, setLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Держим актуальные значения в ref, чтобы не пересоздавать AudioContext
  const thresholdRef = useRef(threshold);
  const intervalRef = useRef(intervalMs);
  thresholdRef.current = threshold;
  intervalRef.current = intervalMs;

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    // Safari: AudioContext может быть suspended до user gesture
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const dataArray = new Uint8Array(analyser.fftSize);

    const update = () => {
      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalized = Math.min(rms * 4, 1);
      // Квантуем до 5%, чтобы не дёргать рендер на float-шуме
      const quantized = Math.round(normalized * 20) / 20;

      setLevel((prev) => (prev === quantized ? prev : quantized));

      const speaking = quantized > thresholdRef.current;
      setIsSpeaking((prev) => (prev === speaking ? prev : speaking));

      timeoutRef.current = window.setTimeout(update, intervalRef.current);
    };

    update();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      source.disconnect();
      audioContext.close().catch(() => {});
    };
  }, [stream]);

  return { level, isSpeaking };
}
