/**
 * HeavyService
 * Management layer for the Heavy Web Worker.
 * Handles vectorization, enhancement, and palette extraction.
 */

import { WorkerServiceBase } from '../utils/workerServiceBase';

class HeavyService extends WorkerServiceBase {
  constructor() {
    super('Heavy Worker');
  }

  protected createWorker(): Worker {
    return new Worker(new URL('../workers/heavy.worker.ts', import.meta.url), { type: 'module' });
  }

  public async vectorize(imageUrl: string, options: any = {}): Promise<string> {
    return this.postMessage('VECTORIZE', { imageUrl, options });
  }

  public async removeBackground(imageUrl: string): Promise<string> {
    return this.postMessage('REMOVE_BACKGROUND', { imageUrl });
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

  public async applyFilters(imageSrc: string, filters: any): Promise<string> {
    return this.postMessage('APPLY_FILTERS', { imageSrc, filters });
  }

  public async generateGrain(width: number, height: number, noise: number, scale: number): Promise<string> {
    return this.postMessage('GENERATE_GRAIN', { width, height, noise, scale });
  }
}

export const heavyService = new HeavyService();
