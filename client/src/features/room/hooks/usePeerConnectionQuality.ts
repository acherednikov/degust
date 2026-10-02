import { useEffect, useState } from 'react';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

interface QualityMetrics {
  packetLossPercent: number;
  jitterMs: number;
  rttMs: number;
  quality: ConnectionQuality;
}

const INITIAL: QualityMetrics = {
  packetLossPercent: 0,
  jitterMs: 0,
  rttMs: 0,
  quality: 'excellent',
};

function calculateQuality(
  packetLossPercent: number,
  jitterMs: number,
  rttMs: number,
): ConnectionQuality {
  // Пороги подобраны под голосовой чат
  if (packetLossPercent > 10 || jitterMs > 100 || rttMs > 500) return 'poor';
  if (packetLossPercent > 5 || jitterMs > 50 || rttMs > 300) return 'fair';
  if (packetLossPercent > 2 || jitterMs > 30 || rttMs > 150) return 'good';
  return 'excellent';
}

export function usePeerConnectionQuality(
  pc: RTCPeerConnection | null,
  intervalMs = 2000,
): QualityMetrics {
  const [metrics, setMetrics] = useState<QualityMetrics>(INITIAL);

  useEffect(() => {
    if (!pc) return;

    let lastPacketsLost = 0;
    let lastPacketsReceived = 0;
    let timeoutId: number;

    const poll = async () => {
      try {
        const stats = await pc.getStats();
        let packetsLost = 0;
        let packetsReceived = 0;
        let jitter = 0;
        let rtt = 0;

        stats.forEach((report) => {
          // Входящий аудиопоток от пира
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            packetsLost = report.packetsLost ?? 0;
            packetsReceived = report.packetsReceived ?? 0;
            jitter = report.jitter ?? 0;
          }

          // RTT из удалённого отчёта
          if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
            rtt = report.roundTripTime ?? 0;
          }
        });

        // Дельта потерь за интервал → процент
        const deltaLost = packetsLost - lastPacketsLost;
        const deltaReceived = packetsReceived - lastPacketsReceived;
        const deltaTotal = deltaLost + deltaReceived;
        const packetLossPercent =
          deltaTotal > 0 ? (deltaLost / deltaTotal) * 100 : 0;

        lastPacketsLost = packetsLost;
        lastPacketsReceived = packetsReceived;

        const jitterMs = jitter * 1000;
        const rttMs = rtt * 1000;

        setMetrics({
          packetLossPercent: Math.max(0, packetLossPercent),
          jitterMs,
          rttMs,
          quality: calculateQuality(
            Math.max(0, packetLossPercent),
            jitterMs,
            rttMs,
          ),
        });
      } catch {
        // getStats падает при закрытии pc
      }

      timeoutId = window.setTimeout(poll, intervalMs);
    };

    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pc, intervalMs]);

  return metrics;
}
