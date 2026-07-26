import { log } from '../utils/log';

/**
 * Call AI inpainting API directly using base64 image and mask data.
 */
export async function aiInpaintBase64(
  imageDataUrl: string,
  maskDataUrl: string,
  prompt: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'inpaint',
        image: imageDataUrl,
        mask: maskDataUrl,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI inpaint failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.image || result.url) {
      return result.image || result.url;
    }
    return null;
  } catch (err) {
    log.warn('[InpaintService] AI inpaint request failed', { error: err });
    return null;
  }
}

/**
 * Call AI inpainting API to fill empty regions for canvases.
 */
export async function aiInpaint(
  transformedCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  rotateX: number,
  rotateY: number
): Promise<HTMLCanvasElement | null> {
  const imageDataUrl = transformedCanvas.toDataURL('image/png');
  const maskDataUrl = maskCanvas.toDataURL('image/png');

  // Determine which edges need filling based on rotation direction
  const emptyRegion =
    Math.abs(rotateY) > Math.abs(rotateX) ? (rotateY > 0 ? 'right' : 'left') : rotateX > 0 ? 'bottom' : 'top';

  const prompt = `Fill in the transparent areas of this image that became visible after a ${Math.round(Math.sqrt(rotateX * rotateX + rotateY * rotateY))}-degree 3D rotation. The empty ${emptyRegion} areas should be filled with content that matches the style, lighting, colors, and context of the original image. Make it look natural and continuous.`;

  const imgUrl = await aiInpaintBase64(imageDataUrl, maskDataUrl, prompt);

  if (imgUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = transformedCanvas.width;
        canvas.height = transformedCanvas.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      };
      img.onerror = () => resolve(null);
      img.src = imgUrl;
    });
  }
  return null;
}

/**
 * Remove an object from an image based on a mask, automatically filling the background.
 */
export async function aiRemoveObject(
  imageSrc: string,
  maskPath: string,
  width: number,
  height: number
): Promise<string | null> {
  return new Promise((resolve) => {
    // 1. Draw original image to get its data URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = width;
      imgCanvas.height = height;
      const imgCtx = imgCanvas.getContext('2d')!;
      imgCtx.drawImage(img, 0, 0, width, height);
      const imageDataUrl = imgCanvas.toDataURL('image/png');

      // 2. Draw mask to get its data URL
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d')!;
      // Fill background black
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, width, height);
      // Fill path white
      const p = new Path2D(maskPath);
      maskCtx.fillStyle = 'white';
      maskCtx.fill(p);
      const maskDataUrl = maskCanvas.toDataURL('image/png');

      // 3. Call inpainting
      const prompt =
        'Remove the object highlighted by the mask perfectly. Seamlessly fill in the background using the surrounding textures, colors, and lighting. Make it look like the object was never there.';
      const resultUrl = await aiInpaintBase64(imageDataUrl, maskDataUrl, prompt);
      resolve(resultUrl);
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}
