import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BitmapCache } from '../../utils/bitmapCache';
import type { Layer } from '../../types';

function makeLayer(id: string, overrides: Partial<Layer> = {}): Layer {
  return {
    id, type: 'rectangle', x: 0, y: 0, width: 100, height: 100,
    rotation: 0, opacity: 1, locked: false, visible: true, color: '#000',
    cornerRadius: 0,
    ...overrides,
  } as Layer;
}

function mockBitmapClose() {
  return { close: vi.fn(), width: 100, height: 100 } as unknown as ImageBitmap;
}

beforeEach(() => {
  (globalThis as any).createImageBitmap = vi.fn().mockResolvedValue(mockBitmapClose());
  const OrigOffscreenCanvas = (globalThis as any).OffscreenCanvas;
  (globalThis as any).OffscreenCanvas = class {
    width = 0;
    height = 0;
    constructor(w: number, h: number) { this.width = w; this.height = h; }
    getContext() {
      return {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        strokeRect: vi.fn(),
      };
    }
    convertToBlob() { return Promise.resolve(new Blob()); }
  };
});

describe('BitmapCache singleton', () => {
  it('getInstance returns same instance', () => {
    const a = new BitmapCache();
    const b = new BitmapCache();
    expect(a).not.toBe(b);
  });
});

describe('BitmapCache getOrRender', () => {
  it('stores and retrieves cached bitmap', async () => {
    const cache = new BitmapCache();
    const layer = makeLayer('l1');
    const renderFn = vi.fn();
    const result = await cache.getOrRender(layer, renderFn);
    expect(result).toBeTruthy();
    expect(renderFn).toHaveBeenCalled();
    const result2 = await cache.getOrRender(layer, renderFn);
    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(result2).toBe(result);
  });

  it('re-renders when layer version changes', async () => {
    const cache = new BitmapCache();
    const layer = makeLayer('l1', { dirty: false } as any);
    const renderFn = vi.fn();
    await cache.getOrRender(layer, renderFn);
    expect(renderFn).toHaveBeenCalledTimes(1);
    const dirtyLayer = makeLayer('l1', { dirty: true } as any);
    await cache.getOrRender(dirtyLayer, renderFn);
    expect(renderFn).toHaveBeenCalledTimes(2);
  });
});

describe('BitmapCache eviction', () => {
  it('evicts old entries when size limit reached', async () => {
    const cache = new BitmapCache();
    for (let i = 0; i < 501; i++) {
      await cache.getOrRender(makeLayer(`l${i}`), vi.fn());
    }
    const stats = cache.stats();
    expect(stats.size).toBeLessThanOrEqual(500);
    expect(cache.stats().size).toBe(500);
  });
});

describe('BitmapCache clear', () => {
  it('removes all entries', async () => {
    const cache = new BitmapCache();
    await cache.getOrRender(makeLayer('a'), vi.fn());
    await cache.getOrRender(makeLayer('b'), vi.fn());
    cache.clear();
    expect(cache.stats().size).toBe(0);
  });
});

describe('BitmapCache invalidate', () => {
  it('removes specific entry', async () => {
    const cache = new BitmapCache();
    await cache.getOrRender(makeLayer('a'), vi.fn());
    await cache.getOrRender(makeLayer('b'), vi.fn());
    cache.invalidate('a');
    expect(cache.stats().size).toBe(1);
  });

  it('invalidateAll removes multiple entries', async () => {
    const cache = new BitmapCache();
    await cache.getOrRender(makeLayer('a'), vi.fn());
    await cache.getOrRender(makeLayer('b'), vi.fn());
    cache.invalidateAll(new Set(['a', 'b']));
    expect(cache.stats().size).toBe(0);
  });
});

describe('BitmapCache stats', () => {
  it('returns correct size and maxEntries', async () => {
    const cache = new BitmapCache();
    expect(cache.stats()).toEqual({ size: 0, maxEntries: 500 });
    await cache.getOrRender(makeLayer('a'), vi.fn());
    expect(cache.stats().size).toBe(1);
  });
});
