import { Layer } from '../types';

class PsdService {
  private worker: Worker | null = null;
  private callbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('../workers/psd.worker.ts', import.meta.url), { type: 'module' });

      this.worker.onmessage = (e) => {
        const { type, id, payload, error } = e.data;
        const callback = this.callbacks.get(id);

        if (callback) {
          if (type === 'SUCCESS') {
            callback.resolve(payload);
          } else {
            callback.reject(new Error(error));
          }
          this.callbacks.delete(id);
        }
      };

      this.worker.onerror = (_e) => {
        // console.error("PSD Worker Error", e);
      };
    }
  }

  private postMessage(type: string, payload: any, transfer?: Transferable[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }
      const id = crypto.randomUUID();
      this.callbacks.set(id, { resolve, reject });

      if (transfer) {
        this.worker.postMessage({ type, payload, id }, transfer);
      } else {
        this.worker.postMessage({ type, payload, id });
      }
    });
  }

  public async parsePsdToLayers(buffer: ArrayBuffer): Promise<Layer[]> {
    // Transfer the buffer to the worker for high performance
    return this.postMessage('PARSE', { buffer }, [buffer]);
  }

  public async exportLayersToPsd(width: number, height: number, layers: Layer[]): Promise<Blob> {
    return this.postMessage('EXPORT', { width, height, layers });
  }

  public terminate() {
    this.worker?.terminate();
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
