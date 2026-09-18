/**
 * Hero Cutout Pipeline
 * Isolates hero subject imagery into transparent PNGs using @imgly/background-removal
 * via heavyService with LRU caching and resilient fallback.
 */

import { heavyService } from './heavyService';
import { log } from '../utils/log';

// In-memory cache for processed cutouts to avoid redundant WASM/ONNX compute
const cutoutCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

export interface HeroCutoutResult {
  src: string;
  isCutout: boolean;
  aspectRatio?: number;
}

/**
 * Process an image URL through background removal to produce a transparent cutout.
 * If processing fails or is unsupported in the current environment, returns the original image.
 */
export async function getHeroCutout(
  imageUrl: string,
  options: { preferCutout?: boolean; timeoutMs?: number } = {}
): Promise<HeroCutoutResult> {
  const { preferCutout = true, timeoutMs = 15000 } = options;

  if (!imageUrl || !preferCutout) {
    return { src: imageUrl, isCutout: false };
  }

  // Check cache
  if (cutoutCache.has(imageUrl)) {
    return { src: cutoutCache.get(imageUrl)!, isCutout: true };
  }

  try {
    // If it's already a transparent PNG data URI, cache and return
    if (imageUrl.startsWith('data:image/png') || imageUrl.startsWith('data:image/svg+xml')) {
      return { src: imageUrl, isCutout: true };
    }

    // Wrap worker call in a timeout race to prevent stalling the design pipeline
    const removePromise = heavyService.removeBackground(imageUrl);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Background removal timed out')), timeoutMs)
    );

    const cutoutDataUrl = await Promise.race([removePromise, timeoutPromise]);

    if (cutoutDataUrl && typeof cutoutDataUrl === 'string' && cutoutDataUrl.length > 50) {
      if (cutoutCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cutoutCache.keys().next().value;
        if (oldestKey) {
          cutoutCache.delete(oldestKey);
        }
      }
      cutoutCache.set(imageUrl, cutoutDataUrl);
      return { src: cutoutDataUrl, isCutout: true };
    }
  } catch (err: any) {
    log.warn('[HeroCutoutPipeline] Background removal unavailable or failed, using original photo with scrim', {
      url: imageUrl.substring(0, 80),
      reason: err?.message || String(err),
    });
  }

  return { src: imageUrl, isCutout: false };
}

/**
 * Pre-warms the cutout cache for an image URL asynchronously in the background.
 */
export function prewarmHeroCutout(imageUrl: string): void {
  if (!imageUrl || cutoutCache.has(imageUrl)) {
    return;
  }
  getHeroCutout(imageUrl).catch(() => {
    // Ignore prewarm failures
  });
}

/**
 * Clear the cutout cache (useful for testing or low-memory situations)
 */
export function clearCutoutCache(): void {
  cutoutCache.clear();
}
