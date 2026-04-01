import { heavyService } from '../services/heavyService';
import { log } from './log';

/**
 * Removes the background from an image using local WASM AI model via Web Worker.
 * This offloads heavy computation from the main thread.
 * @param imageUrl The URL or Base64 string of the image to process.
 * @returns A promise that resolves to a strict Base64 data URL string representing the PNG with transparency.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    return await heavyService.removeBackground(imageUrl);
  } catch (error) {
    log.error('Failed to remove background via worker:', error);
    throw error;
  }
}
