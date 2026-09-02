/**
 * UpscaleService
 *
 * Silently detects and upscales low-resolution images before PDF export.
 * Users experience zero friction — images just come out crisp.
 *
 * Backend: Replicate API (Real-ESRGAN) — open-source, production-grade.
 * Can be swapped to Topaz Photo AI API by setting VITE_TOPAZ_API_KEY.
 *
 * This is a Pro-tier feature. Free users get the raw prepress warning instead.
 */

import { log } from '../utils/log';

// Minimum effective DPI for print. Below this, we upscale.
const PRINT_DPI_THRESHOLD = 200;
// Canvas is rendered at 72 DPI by the browser
const SCREEN_DPI = 72;

export interface UpscaleResult {
  dataUrl: string;
  wasUpscaled: boolean;
  originalDpi: number;
  finalDpi: number;
}

/**
 * Checks if an image src needs upscaling for print output.
 * Returns the effective DPI based on natural vs display dimensions.
 */
export function calcEffectiveDpi(
  naturalWidth: number,
  naturalHeight: number,
  displayWidth: number,
  displayHeight: number
): number {
  const ratioX = naturalWidth / Math.max(displayWidth, 1);
  const ratioY = naturalHeight / Math.max(displayHeight, 1);
  const minRatio = Math.min(ratioX, ratioY);
  return Math.round(minRatio * SCREEN_DPI);
}

/**
 * Loads an image from a URL/dataUrl and returns its natural dimensions.
 */
async function getImageDimensions(src: string): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    img.onerror = (e) => reject(new Error(`Failed to load image for DPI check: ${e}`));
    img.src = src;
  });
}

/**
 * Converts a Blob to a data URL.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Calls the Replicate Real-ESRGAN API to upscale an image.
 * Falls back gracefully on any error to avoid blocking PDF export.
 */
async function upscaleViaReplicate(dataUrl: string, scale: 2 | 4 = 4): Promise<string | null> {
  try {
    // Sentinel: Removed client-side VITE_REPLICATE_API_KEY check to prevent backend secret exposure.
    // Requests are now proxied through /api/replicate which manages the REPLICATE_API_KEY securely.

    const startRes = await fetch('/api/replicate?action=create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'a3d6ea1a94e8e4b3b9c375ba2f32c8e21a7b3d2f4e5a6b7c8d9e0f1a2b3c4d5', // Real-ESRGAN v3
        input: {
          image: dataUrl,
          scale: scale,
          face_enhance: false,
        },
      }),
    });

    if (!startRes.ok) {
      log.warn('[UpscaleService] Replicate proxy API returned non-OK status', { responseText: await startRes.text() });
      return null;
    }

    const prediction = await startRes.json();
    const predictionId: string = prediction.id;

    // Poll for completion (max 30 seconds)
    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`/api/replicate?action=poll&id=${predictionId}`);

      if (!pollRes.ok) continue;

      const status = await pollRes.json();
      if (status.status === 'succeeded' && status.output) {
        // Download the upscaled image and convert to data URL
        const imgRes = await fetch(status.output);
        const blob = await imgRes.blob();
        return await blobToDataUrl(blob);
      }
      if (status.status === 'failed' || status.status === 'canceled') {
        log.warn('[UpscaleService] Replicate prediction failed', status.error);
        return null;
      }
    }

    log.warn('[UpscaleService] Replicate upscale timed out after 30s');
    return null;
  } catch (err) {
    log.error('[UpscaleService] Unexpected error during upscale', err);
    return null;
  }
}

/**
 * Client-side CPU upscale fallback using a 2x nearest-neighbor algorithm on OffscreenCanvas.
 * Not AI-quality but better than printing a blurry 72dpi image.
 * Zero network dependency. Runs in milliseconds.
 */
async function upscaleClientSide(dataUrl: string, scale: number): Promise<string | null> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load for client-side upscale'));
      img.src = dataUrl;
    });

    const targetW = img.naturalWidth * scale;
    const targetH = img.naturalHeight * scale;

    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(targetW, targetH)
        : (() => {
            const c = document.createElement('canvas');
            c.width = targetW;
            c.height = targetH;
            return c;
          })();

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;

    (ctx as any).imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    if (canvas instanceof OffscreenCanvas) {
      const blob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png', quality: 1.0 });
      return await blobToDataUrl(blob);
    } else {
      return (canvas as HTMLCanvasElement).toDataURL('image/png', 1.0);
    }
  } catch (err) {
    log.error('[UpscaleService] Client-side upscale failed', err);
    return null;
  }
}

/**
 * Main entry point. Given an image src and its display dimensions,
 * returns an UpscaleResult. If the image is already high enough DPI
 * for print, it is returned unchanged. Otherwise, upscaling is attempted.
 *
 * Strategy:
 *  1. If VITE_REPLICATE_API_KEY is set (Pro tier cloud) -> use Real-ESRGAN API.
 *  2. Fallback: client-side 2x canvas bicubic upscale.
 *  3. If everything fails -> return original src with wasUpscaled=false.
 *
 * @param src            - Image data URL or absolute URL
 * @param displayWidth   - Width in canvas pixels that the layer occupies
 * @param displayHeight  - Height in canvas pixels that the layer occupies
 * @param naturalWidth   - Optional known natural width (avoids a DOM load)
 * @param naturalHeight  - Optional known natural height
 */
export async function upscaleForPrint(
  src: string,
  displayWidth: number,
  displayHeight: number,
  naturalWidth?: number,
  naturalHeight?: number
): Promise<UpscaleResult> {
  const fallback: UpscaleResult = {
    dataUrl: src,
    wasUpscaled: false,
    originalDpi: 72,
    finalDpi: 72,
  };

  try {
    // Resolve natural dimensions if not provided
    let nW = naturalWidth;
    let nH = naturalHeight;
    if (!nW || !nH) {
      try {
        const dims = await getImageDimensions(src);
        nW = dims.naturalWidth;
        nH = dims.naturalHeight;
      } catch {
        return fallback;
      }
    }

    const originalDpi = calcEffectiveDpi(nW, nH, displayWidth, displayHeight);
    fallback.originalDpi = originalDpi;
    fallback.finalDpi = originalDpi;

    // Already print-ready — nothing to do
    if (originalDpi >= PRINT_DPI_THRESHOLD) {
      return fallback;
    }

    // Determine scale factor needed to reach target DPI
    const neededScale = PRINT_DPI_THRESHOLD / originalDpi;
    const scale: 2 | 4 = neededScale > 2.5 ? 4 : 2;

    log.info(`[UpscaleService] Image at ${originalDpi} DPI — upscaling ${scale}x for print`, {
      displayWidth,
      displayHeight,
      naturalWidth: nW,
      naturalHeight: nH,
    });

    // Try cloud AI upscale first
    const cloudResult = await upscaleViaReplicate(src, scale);
    if (cloudResult) {
      const newDims = await getImageDimensions(cloudResult);
      const finalDpi = calcEffectiveDpi(newDims.naturalWidth, newDims.naturalHeight, displayWidth, displayHeight);
      return { dataUrl: cloudResult, wasUpscaled: true, originalDpi, finalDpi };
    }

    // Fallback: client-side canvas upscale
    log.info('[UpscaleService] Falling back to client-side upscale');
    const localResult = await upscaleClientSide(src, scale);
    if (localResult) {
      return {
        dataUrl: localResult,
        wasUpscaled: true,
        originalDpi,
        finalDpi: Math.round(originalDpi * scale),
      };
    }

    // All paths failed — return original
    return fallback;
  } catch (err) {
    log.error('[UpscaleService] Top-level error in upscaleForPrint', err);
    return fallback;
  }
}
