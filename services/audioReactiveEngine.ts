/**
 * Audio Reactive Engine
 * Analyzes audio buffers to detect peaks and beats for synchronizing WebGL motion graphics.
 */

export interface BeatData {
  timeSec: number;
  intensity: number; // 0.0 to 1.0
}

export class AudioReactiveEngine {
  private audioContext: AudioContext;

  constructor() {
    // OfflineAudioContext can be used for fast processing, or standard AudioContext
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Fetches an audio file, decodes it, and calculates transient beat markers.
   */
  public async analyzeTrack(url: string): Promise<{ buffer: AudioBuffer; beats: BeatData[] }> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    const beats = this.detectPeaks(audioBuffer);
    return { buffer: audioBuffer, beats };
  }

  /**
   * Extremely fast heuristic peak detection for bass/kick drum transients.
   */
  private detectPeaks(buffer: AudioBuffer): BeatData[] {
    const channelData = buffer.getChannelData(0); // Analyze left channel for speed
    const sampleRate = buffer.sampleRate;
    const beats: BeatData[] = [];
    
    // We chop the audio into 100ms chunks to find local maximums (beats)
    const chunkSize = Math.floor(sampleRate * 0.1); 
    const threshold = 0.8; // Normalized amplitude threshold for a "heavy" beat

    let i = 0;
    while (i < channelData.length) {
      let chunkMax = 0;
      let maxIndex = 0;
      
      // Find the peak in this chunk
      for (let j = 0; j < chunkSize && i + j < channelData.length; j++) {
        const amp = Math.abs(channelData[i + j]);
        if (amp > chunkMax) {
          chunkMax = amp;
          maxIndex = i + j;
        }
      }
      
      // If the peak exceeds our threshold, register it as a beat
      if (chunkMax > threshold) {
        beats.push({
          timeSec: maxIndex / sampleRate,
          intensity: chunkMax,
        });
        // Skip ahead by 300ms to avoid detecting the same bass decay multiple times (debouncing)
        i += Math.floor(sampleRate * 0.3);
      } else {
        i += chunkSize;
      }
    }

    return beats;
  }

  /**
   * Calculates the current reactive multiplier (0 to 1) for a specific time based on proximity to beats.
   * Creates an exponential decay envelope after a beat hits.
   */
  public getBeatMultiplier(timeSec: number, beats: BeatData[]): number {
    let activeMultiplier = 0;
    
    for (const beat of beats) {
      const timeSinceBeat = timeSec - beat.timeSec;
      
      // If the beat just happened within the last 400ms
      if (timeSinceBeat >= 0 && timeSinceBeat < 0.4) {
        // Exponential decay: e^(-10 * x)
        const decay = Math.exp(-10 * timeSinceBeat);
        const bump = decay * beat.intensity;
        if (bump > activeMultiplier) {
          activeMultiplier = bump;
        }
      }
    }
    
    return activeMultiplier;
  }
}
