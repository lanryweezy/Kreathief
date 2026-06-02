/**
 * Mask Worker Service
 * Management layer for the Mask Web Worker.
 * Handles hit-testing and mask generation.
 */

import { Layer } from '../types';

class MaskWorkerService {
  private worker: Worker | null = null;
  private callbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

  private initializeWorker() {
    if (this.worker || typeof window === 'undefined') {
      return;
    }

    try {
      this.worker = new Worker(new URL('../workers/mask.worker.ts', import.meta.url), { type: 'module' });

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
        console.error('Mask Worker Error:', e);
        this.worker = null;
      };
    } catch (err) {
      console.error('Failed to initialize Mask Worker:', err);
    }
  }

  private postMessage(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.initializeWorker();

      if (!this.worker) {
        reject(new Error('Mask Worker could not be initialized.'));
        return;
      }
      const id = crypto.randomUUID();
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, payload });
    });
  }

  public async hitTest(x: number, y: number, layer: Layer): Promise<boolean> {
    return this.postMessage('HIT_TEST', { x, y, layer });
  }

  public async hitTestAll(x: number, y: number, layers: Layer[]): Promise<string | null> {
    return this.postMessage('HIT_TEST_ALL', { x, y, layers });
  }

  public async generateMask(layer: Layer): Promise<string | undefined> {
    return this.postMessage('GENERATE_MASK', { layer });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const maskWorkerService = new MaskWorkerService();
