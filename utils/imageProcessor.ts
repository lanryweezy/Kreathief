
import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";

/**
 * Removes the background from an image using AI.
 * @param imageUrl The URL of the image to process.
 * @returns A promise that resolves to a Blob URL of the processed image (PNG with transparency).
 */
export async function removeBackground(imageUrl: string): Promise<string> {
    try {
        // imgly returns a Blob
        const blob = await imglyRemoveBackground(imageUrl);
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Failed to remove background:", error);
        throw error;
    }
}
