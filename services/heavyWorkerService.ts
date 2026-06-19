import { CanvasFilters } from '../types';

class HeavyWorkerService {
  private worker: Worker | null = null;
  private callbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('../workers/heavy.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = this.handleMessage.bind(this);
    }
  }

  private handleMessage(e: MessageEvent) {
    const { type, id, payload, error } = e.data;
    const callback = this.callbacks.get(id);
    if (!callback) {
      return;
    }

    if (type === 'SUCCESS') {
      callback.resolve(payload);
    } else {
      callback.reject(new Error(error || 'Worker task failed'));
    }
    this.callbacks.delete(id);
  }

  private postTask<T>(type: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      this.callbacks.set(id, { resolve, reject });
      this.worker?.postMessage({ type, id, payload });
    });
  }

  async removeBackground(imageUrl: string): Promise<string> {
    return this.postTask('REMOVE_BACKGROUND', { imageUrl });
  }

  async vectorize(imageUrl: string, options: any = {}): Promise<string> {
    return this.postTask('VECTORIZE', { imageUrl, options });
  }

  async algorithmicEnhance(imageSrc: string): Promise<string> {
    return this.postTask('ENHANCE', { imageSrc });
  }

  async extractPalette(imageSrc: string, colorCount: number = 5): Promise<string[]> {
    return this.postTask('EXTRACT_PALETTE', { imageSrc, colorCount });
  }

  async traceSVG(imageSrc: string, colors: number = 2): Promise<any[]> {
    return this.postTask('TRACE_SVG', { imageSrc, colors });
  }

  async applyFilters(imageSrc: string, filters: CanvasFilters): Promise<string> {
    return this.postTask('APPLY_FILTERS', { imageSrc, filters });
  }

  async generateGrain(width: number, height: number, noise: number, scale: number): Promise<string> {
    return this.postTask('GENERATE_GRAIN', { width, height, noise, scale });
  }
}

export const heavyWorkerService = new HeavyWorkerService();
