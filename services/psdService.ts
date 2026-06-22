import { Layer } from '../types';
import { WorkerServiceBase } from '../utils/workerServiceBase';

class PsdService extends WorkerServiceBase {
  constructor() {
    super('PSD Worker');
  }

  protected createWorker(): Worker {
    return new Worker(new URL('../workers/psd.worker.ts', import.meta.url), { type: 'module' });
  }

  public async parsePsdToLayers(buffer: ArrayBuffer): Promise<Layer[]> {
    // Transfer the buffer to the worker for high performance
    return this.postMessage('PARSE', { buffer }, [buffer]);
  }

  public async exportLayersToPsd(width: number, height: number, layers: Layer[]): Promise<Blob> {
    return this.postMessage('EXPORT', { width, height, layers });
  }
}

// Singleton export
export const psdService = new PsdService();

// Keep standalone functions for backward compatibility if needed,
// seamlessly proxying to the singleton
export async function parsePsdToLayers(buffer: ArrayBuffer): Promise<Layer[]> {
  return psdService.parsePsdToLayers(buffer);
}

export async function exportLayersToPsd(width: number, height: number, layers: Layer[]): Promise<Blob> {
  return psdService.exportLayersToPsd(width, height, layers);
}
