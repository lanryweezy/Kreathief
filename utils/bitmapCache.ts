import { Layer } from '../types';

/**
 * Bitmap cache for pre-rendering layers to OffscreenCanvas.
 * Dramatically improves performance by caching rendered layers as bitmaps
 * that can be drawn in a single canvas call instead of multiple DOM operations.
 */
export class BitmapCache {
  private cache = new Map<string, { bitmap: ImageBitmap; version: number }>();
  private maxEntries = 500;

  /**
   * Get a cached bitmap for a layer, or render and cache it.
   */
  async getOrRender(
    layer: Layer,
    renderFn: (ctx: CanvasRenderingContext2D, layer: Layer) => void
  ): Promise<ImageBitmap | null> {
    const key = layer.id;
    const version = (layer as any).dirty ? Date.now() : (layer as any).__cacheVersion || 0;

    const entry = this.cache.get(key);
    if (entry && entry.version === version) {
      return entry.bitmap;
    }

    // Render to offscreen canvas
    const w = Math.max(1, Math.min((layer as any).width || 100, 4096));
    const h = Math.max(1, Math.min((layer as any).height || 100, 4096));

    try {
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
      if (!ctx) return null;

      renderFn(ctx, layer);
      const bitmap = await createImageBitmap(canvas);

      // Evict old entries if at capacity
      if (this.cache.size >= this.maxEntries) {
        const oldest = this.cache.keys().next().value;
        if (oldest) {
          const old = this.cache.get(oldest);
          if (old) old.bitmap.close();
          this.cache.delete(oldest);
        }
      }

      // Close old bitmap if replacing
      if (entry) entry.bitmap.close();

      this.cache.set(key, { bitmap, version });
      return bitmap;
    } catch {
      return null;
    }
  }

  /**
   * Invalidate cache for a specific layer.
   */
  invalidate(layerId: string): void {
    const entry = this.cache.get(layerId);
    if (entry) {
      entry.bitmap.close();
      this.cache.delete(layerId);
    }
  }

  /**
   * Invalidate all layers in a set.
   */
  invalidateAll(layerIds: Set<string>): void {
    for (const id of layerIds) {
      this.invalidate(id);
    }
  }

  /**
   * Clear entire cache.
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      entry.bitmap.close();
    }
    this.cache.clear();
  }

  /**
   * Get cache stats.
   */
  stats(): { size: number; maxEntries: number } {
    return { size: this.cache.size, maxEntries: this.maxEntries };
  }
}

// Singleton instance
export const bitmapCache = new BitmapCache();
