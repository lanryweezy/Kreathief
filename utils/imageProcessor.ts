import { heavyService } from '../services/heavyService';
import { removeBackgroundOnDevice } from '../services/onDeviceAI';
import { log } from './log';

/**
 * Removes the background from an image using local WASM AI model via Web Worker.
 * If the worker times out or fails (e.g. offline/ONNX download failure), automatically falls back
 * to the on-device canvas edge-detection algorithm so it never hangs or leaves the UI stuck.
 * @param imageUrl The URL or Base64 string of the image to process.
 * @returns A promise that resolves to a strict Base64 data URL string representing the PNG with transparency.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    return await heavyService.removeBackground(imageUrl);
  } catch (error) {
    log.warn('Failed to remove background via worker (or timed out), falling back to on-device algorithm:', error);
    try {
      const res = await removeBackgroundOnDevice(imageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = res.imageData.width;
      canvas.height = res.imageData.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(res.imageData, 0, 0);
        return canvas.toDataURL('image/png');
      }
    } catch (fallbackErr) {
      log.error('On-device background removal fallback also failed:', fallbackErr);
    }
    throw error;
  }
}
