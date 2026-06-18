interface CornerPoints {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
}

interface MockupWorkerData {
  bgBitmap: ImageBitmap;
  designBitmap: ImageBitmap;
  placement: any;
  cornerPoints?: CornerPoints;
  shadowIntensity: number;
  reflectionIntensity: number;
  lightingBrightness: number;
  lightingContrast: number;
}

self.onmessage = async (e: MessageEvent<MockupWorkerData>) => {
  try {
    const {
      bgBitmap,
      designBitmap,
      placement,
      cornerPoints,
      shadowIntensity,
      reflectionIntensity,
      lightingBrightness,
      lightingContrast,
    } = e.data;

    const width = bgBitmap.width;
    const height = bgBitmap.height;

    // Create main offscreen canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D;
    if (!ctx) {
      throw new Error('Could not get 2d context in worker');
    }

    // Draw background
    ctx.drawImage(bgBitmap, 0, 0);

    // Draw ambient shadow under product (simplified for worker)
    const shadowGradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      10,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.6
    );
    shadowGradient.addColorStop(0, 'rgba(0,0,0,0.0)');
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // Determine dimensions and coordinates
    const { top, left, width: pWidth, rotate, skewX, skewY, opacity, blendMode, useCornerPinning } = placement;

    const x = (left / 100) * width;
    const y = (top / 100) * height;
    const w = (pWidth / 100) * width;
    const aspect = designBitmap.width / designBitmap.height;
    const h = w / aspect;

    if (useCornerPinning && cornerPoints) {
      // Pinning logic using bilinear interpolation pixel-by-pixel warp
      const designCanvas = new OffscreenCanvas(designBitmap.width, designBitmap.height);
      const designCtx = designCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      designCtx.drawImage(designBitmap, 0, 0);

      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode;
      ctx.filter = `brightness(${lightingBrightness}%) contrast(${lightingContrast}%)`;

      warpImageToCornersWorker(ctx, designCanvas, cornerPoints);
    } else {
      // Standard transform
      const centerX = x + w / 2;
      const centerY = y + h / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.transform(1, (skewY * Math.PI) / 180, (skewX * Math.PI) / 180, 1, 0, 0);
      ctx.translate(-centerX, -centerY);

      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode;
      ctx.filter = `brightness(${lightingBrightness}%) contrast(${lightingContrast}%)`;

      ctx.drawImage(designBitmap, x, y, w, h);
    }

    ctx.filter = 'none';

    // Advanced AO and Reflections
    // ... we simplify this in the worker for performance but keep core logic
    if (reflectionIntensity > 0) {
      const refCanvas = new OffscreenCanvas(width, height);
      const rctx = refCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      const cx = (placement.left / 100) * width + w / 2;
      const cy = (placement.top / 100) * height + h / 2;
      const r = w * 0.75;
      const g = rctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0.0)');
      rctx.fillStyle = g;
      rctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = reflectionIntensity;
      ctx.drawImage(refCanvas, 0, 0);
    }

    ctx.restore();

    // Convert to Blob for easy transfer back to main thread
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });

    // Send back the generated blob URL
    self.postMessage({ type: 'SUCCESS', payload: blob });

    // Cleanup memory
    bgBitmap.close();
    designBitmap.close();
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message });
  }
};

const warpImageToCornersWorker = (
  ctx: OffscreenCanvasRenderingContext2D,
  imageCanvas: OffscreenCanvas,
  corners: CornerPoints
) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const imgWidth = imageCanvas.width;
  const imgHeight = imageCanvas.height;

  // Draw image to get pixel data
  const tempCtx = imageCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  const imageData = tempCtx.getImageData(0, 0, imgWidth, imgHeight);
  const srcData = imageData.data;

  // We only want to process the bounding box of the corners to save massive amounts of processing time
  const minX = Math.floor(Math.min(corners.topLeft.x, corners.bottomLeft.x));
  const maxX = Math.ceil(Math.max(corners.topRight.x, corners.bottomRight.x));
  const minY = Math.floor(Math.min(corners.topLeft.y, corners.topRight.y));
  const maxY = Math.ceil(Math.max(corners.bottomLeft.y, corners.bottomRight.y));

  // Create an output image data ONLY for the bounding box
  const boxWidth = Math.max(1, maxX - minX);
  const boxHeight = Math.max(1, maxY - minY);
  const outputImageData = ctx.createImageData(boxWidth, boxHeight);
  const destData = outputImageData.data;

  for (let py = 0; py < boxHeight; py++) {
    for (let px = 0; px < boxWidth; px++) {
      const screenX = minX + px;
      const screenY = minY + py;

      const src = getBilinearCoordinateWorker(screenX, screenY, corners, width, height, imgWidth, imgHeight);

      if (src.x >= 0 && src.x < imgWidth - 1 && src.y >= 0 && src.y < imgHeight - 1) {
        const x0 = Math.floor(src.x);
        const y0 = Math.floor(src.y);
        const dx = src.x - x0;
        const dy = src.y - y0;

        const idx00 = (y0 * imgWidth + x0) * 4;
        const idx10 = (y0 * imgWidth + x0 + 1) * 4;
        const idx01 = ((y0 + 1) * imgWidth + x0) * 4;
        const idx11 = ((y0 + 1) * imgWidth + x0 + 1) * 4;

        const destIdx = (py * boxWidth + px) * 4;

        for (let c = 0; c < 3; c++) {
          destData[destIdx + c] =
            srcData[idx00 + c] * (1 - dx) * (1 - dy) +
            srcData[idx10 + c] * dx * (1 - dy) +
            srcData[idx01 + c] * (1 - dx) * dy +
            srcData[idx11 + c] * dx * dy;
        }

        destData[destIdx + 3] =
          srcData[idx00 + 3] * (1 - dx) * (1 - dy) +
          srcData[idx10 + 3] * dx * (1 - dy) +
          srcData[idx01 + 3] * (1 - dx) * dy +
          srcData[idx11 + 3] * dx * dy;
      }
    }
  }

  // Draw the bounding box exactly where it belongs
  ctx.putImageData(outputImageData, minX, minY);
};

const getBilinearCoordinateWorker = (
  x: number,
  y: number,
  corners: CornerPoints,
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } => {
  // Simple inverse bilinear mapping approximation
  // For highly robust perspective, homography matrices are better, but this matches original logic
  const u = x / canvasWidth;
  const v = y / canvasHeight;

  const leftX = corners.topLeft.x + (corners.bottomLeft.x - corners.topLeft.x) * v;
  const leftY = corners.topLeft.y + (corners.bottomLeft.y - corners.topLeft.y) * v;
  const rightX = corners.topRight.x + (corners.bottomRight.x - corners.topRight.x) * v;
  const rightY = corners.topRight.y + (corners.bottomRight.y - corners.topRight.y) * v;

  const targetX = leftX + (rightX - leftX) * u;
  const targetY = leftY + (rightY - leftY) * u;

  return {
    x: (targetX / canvasWidth) * imageWidth,
    y: (targetY / canvasHeight) * imageHeight,
  };
};
