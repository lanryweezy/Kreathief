/**
 * Audio Beat Sync Engine
 * Extracts tempo (BPM) and transient beat peaks using the Web Audio API
 */

export interface BeatSyncAnalysis {
  bpm: number;
  beatIntervalSeconds: number;
  beatTimestamps: number[];
}

/**
 * Analyzes an AudioBuffer or ArrayBuffer to detect tempo (BPM) and beat peaks.
 */
export async function analyzeAudioBeatSync(audioSource: AudioBuffer | ArrayBuffer): Promise<BeatSyncAnalysis> {
  let audioBuffer: AudioBuffer;

  if (audioSource instanceof ArrayBuffer) {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
      audioBuffer = await audioCtx.decodeAudioData(audioSource);
    } finally {
      if (audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    }
  } else {
    audioBuffer = audioSource;
  }

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Compute energy in short window buckets (approx 20ms)
  const windowSize = Math.floor(sampleRate * 0.02);
  const totalWindows = Math.floor(channelData.length / windowSize);
  const energyProfile: number[] = new Float32Array(totalWindows) as any;

  for (let i = 0; i < totalWindows; i++) {
    let sum = 0;
    const start = i * windowSize;
    for (let j = 0; j < windowSize; j++) {
      const sample = channelData[start + j];
      sum += sample * sample;
    }
    energyProfile[i] = sum;
  }

  // Peak detection with dynamic threshold
  const beatTimestamps: number[] = [];
  const minPeakDistanceWindows = Math.floor(0.25 / 0.02); // at most ~240 BPM

  let localAvg = 0;
  for (let i = 0; i < Math.min(50, totalWindows); i++) {
    localAvg += energyProfile[i];
  }
  localAvg /= Math.min(50, totalWindows);

  for (let i = 1; i < totalWindows - 1; i++) {
    const prev = energyProfile[i - 1];
    const curr = energyProfile[i];
    const next = energyProfile[i + 1];

    if (curr > prev && curr > next && curr > localAvg * 1.6) {
      const timeInSeconds = (i * windowSize) / sampleRate;
      const lastBeat = beatTimestamps[beatTimestamps.length - 1];

      if (!lastBeat || timeInSeconds - lastBeat > 0.22) {
        beatTimestamps.push(timeInSeconds);
      }
    }

    // Exponential moving average update
    localAvg = 0.95 * localAvg + 0.05 * curr;
  }

  // Calculate BPM from average interval between peaks
  let bpm = 120; // default fallback
  if (beatTimestamps.length > 3) {
    const intervals: number[] = [];
    for (let i = 1; i < beatTimestamps.length; i++) {
      intervals.push(beatTimestamps[i] - beatTimestamps[i - 1]);
    }
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    if (medianInterval > 0.2 && medianInterval < 2.0) {
      bpm = Math.round(60 / medianInterval);
      // Normalize to standard range 70 - 180 BPM
      while (bpm < 70) {
        bpm *= 2;
      }
      while (bpm > 180) {
        bpm /= 2;
      }
    }
  }

  const beatIntervalSeconds = 60 / bpm;

  return {
    bpm,
    beatIntervalSeconds,
    beatTimestamps,
  };
}

/**
 * Quantizes stagger delays across layers to musical beat subdivisions (1/1, 1/2, 1/4, 1/8 note).
 */
export function generateBeatSyncedDelays(
  layerCount: number,
  bpm: number,
  subdivision: 'whole' | 'half' | 'quarter' | 'eighth' = 'quarter'
): number[] {
  const beatSec = 60 / Math.max(40, bpm);
  let stepSec = beatSec;

  switch (subdivision) {
    case 'whole':
      stepSec = beatSec * 4;
      break;
    case 'half':
      stepSec = beatSec * 2;
      break;
    case 'quarter':
      stepSec = beatSec;
      break;
    case 'eighth':
      stepSec = beatSec / 2;
      break;
  }

  const delays: number[] = [];
  for (let i = 0; i < layerCount; i++) {
    delays.push(parseFloat((i * stepSec).toFixed(3)));
  }

  return delays;
}
