/**
 * HeavyService
 * Management layer for the Heavy Web Worker.
 * Handles vectorization, enhancement, and palette extraction.
 */

import { log } from '../utils/log';

class HeavyService {
  private worker: Worker | null = null;
  private callbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

  private initializeWorker() {
    if (this.worker || typeof window === 'undefined') {
      return;
    }

    try {
      this.worker = new Worker(new URL('../workers/heavy.worker.ts', import.meta.url), { type: 'module' });

      this.worker.onmessage = (e) => {
        const { type, id, payload, error } = e.data;
        const callback = this.callbacks.get(id);

        if (callback) {
          if (type === 'SUCCESS') {
            callback.resolve(payload);
          } else {
            callback.reject(new Error(error || 'Worker task failed'));
          }
          this.callbacks.delete(id);
        }
      };

      this.worker.onerror = (e) => {
        log.error('Heavy Worker Error:', e);
        // Do not block main thread, just log and allow service to try again later if needed
        this.worker = null;
      };
    } catch (err) {
      log.error('Failed to initialize Heavy Worker:', err);
    }
  }

  constructor() {
    // Lazy initialization now
  }

  private postMessage(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.initializeWorker();

      if (!this.worker) {
        reject(
          new Error('Heavy Worker could not be initialized. This might be due to your browser or a network issue.')
        );
        return;
      }
      const id = Math.random().toString(36).substring(7);
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, payload });
    });
  }

  public async vectorize(imageUrl: string, options: any = {}): Promise<string> {
    return this.postMessage('VECTORIZE', { imageUrl, options });
  }

  public async algorithmicEnhance(imageSrc: string): Promise<string> {
    return this.postMessage('ENHANCE', { imageSrc });
  }

  public async extractPalette(imageSrc: string, colorCount: number = 5): Promise<string[]> {
    return this.postMessage('EXTRACT_PALETTE', { imageSrc, colorCount });
  }

  public async traceImageToSVG(imageSrc: string, colors: number = 2, cornerThreshold: number = 45): Promise<any[]> {
    return this.postMessage('TRACE_SVG', { imageSrc, colors, cornerThreshold });
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}

export const heavyService = new HeavyService();
