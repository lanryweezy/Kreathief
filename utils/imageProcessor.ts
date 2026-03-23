import { heavyService } from '../services/heavyService';
import { log } from './log';

/**
 * Removes the background from an image using AI (via Web Worker).
 * @param imageUrl The URL of the image to process.
 * @returns A promise that resolves to a Blob URL of the processed image (PNG with transparency).
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    return await heavyService.removeBackground(imageUrl);
  } catch (error) {
    log.error('Failed to remove background:', error);
    throw error;
  }
}
