/**
 * Mask Worker Service
 * Management layer for the Mask Web Worker.
 * Handles hit-testing and mask generation.
 */

import { Layer } from '../types';
import { WorkerServiceBase } from '../utils/workerServiceBase';

class MaskWorkerService extends WorkerServiceBase {
  constructor() {
    super('Mask Worker');
  }

  protected createWorker(): Worker {
    return new Worker(new URL('../workers/mask.worker.ts', import.meta.url), { type: 'module' });
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
}

export const maskWorkerService = new MaskWorkerService();
