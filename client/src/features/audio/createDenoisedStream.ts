import { RnnoiseWorkletNode, loadRnnoise } from '@sapphi-red/web-noise-suppressor';
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url';
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url';
import rnnoiseSimdWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url';

let audioContext: AudioContext | null = null;
let rnnoiseNode: RnnoiseWorkletNode | null = null;

export async function createDenoisedStream(
  rawStream: MediaStream,
): Promise<MediaStream> {
  // Создаём AudioContext на 48kHz (RNNoise требует эту частоту)
  if (!audioContext) {
    audioContext = new AudioContext({ sampleRate: 48000 });
  }

  // Загружаем WASM (с поддержкой SIMD, если доступно)
  const wasmBinary = await loadRnnoise({
    url: rnnoiseWasmPath,
    simdUrl: rnnoiseSimdWasmPath,
  });

  // Регистрируем worklet-модуль в контексте
  await audioContext.audioWorklet.addModule(rnnoiseWorkletPath);

  // Создаём source из сырого потока
  const source = audioContext.createMediaStreamSource(rawStream);

  // Создаём RNNoise-ноду
  rnnoiseNode = new RnnoiseWorkletNode(audioContext, {
    wasmBinary,
    maxChannels: 1, // моно для голоса
  });

  // Создаём GainNode с бустом
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 2; // 1.5 = +50% громкости

  // Создаём destination, из которого получим очищенный MediaStream
  const destination = audioContext.createMediaStreamDestination();

  // Собираем граф: source → rnnoise → gain → destination
  source.connect(rnnoiseNode);
  rnnoiseNode.connect(gainNode);
  gainNode.connect(destination);

  // Возвращаем очищенный поток
  return destination.stream;
}

export function destroyDenoisedStream() {
  rnnoiseNode?.destroy();
  rnnoiseNode = null;
  audioContext?.close();
  audioContext = null;
}
