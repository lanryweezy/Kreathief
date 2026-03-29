import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { log } from './log';

/**
 * Removes the background from an image using local WASM AI model.
 * @param imageUrl The URL or Base64 string of the image to process.
 * @returns A promise that resolves to a strict Base64 data URL string representing the PNG with transparency.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    const blob = await imglyRemoveBackground(imageUrl);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    log.error('Failed to remove background:', error);
    throw error;
  }
}
