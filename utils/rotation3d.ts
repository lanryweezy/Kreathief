/**
 * 3D Rotation Engine with AI Auto-Fill
 *
 * When a user rotates a 2D image in 3D space, this engine:
 * 1. Applies perspective transform to the image
 * 2. Detects empty/transparent pixels created by the rotation
 * 3. Generates a mask of the empty regions
 * 4. Returns the transformed image + mask for AI inpainting
 */

export interface Rotation3DResult {
  transformedCanvas: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  emptyPixelCount: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  hasEmptyPixels: boolean;
}

export interface Rotation3DParams {
  image: HTMLImageElement | HTMLCanvasElement;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  perspective: number;
  centerX: number;
  centerY: number;
}

/**
 * Apply 3D perspective transform using CSS 3D transforms on an offscreen element.
 * This is much faster than the pixel-by-pixel approach.
 */
export function applyRotation3D(params: Rotation3DParams): Rotation3DResult {
  const { image, rotateX, rotateY, rotateZ, perspective, centerX, centerY } = params;

  const srcWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const srcHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;

  // Calculate bounding box of rotated image using corner projection
  const radX = (rotateX * Math.PI) / 180;
  const radY = (rotateY * Math.PI) / 180;
  const radZ = (rotateZ * Math.PI) / 180;

  const corners = [
    { x: -srcWidth / 2, y: -srcHeight / 2, z: 0 },
    { x: srcWidth / 2, y: -srcHeight / 2, z: 0 },
    { x: srcWidth / 2, y: srcHeight / 2, z: 0 },
    { x: -srcWidth / 2, y: srcHeight / 2, z: 0 },
  ];

  const projected = corners.map((c) => project3D(c, radX, radY, radZ, perspective));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < projected.length; i++) {
    const p = projected[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const outWidth = Math.ceil(maxX - minX) + 8;
  const outHeight = Math.ceil(maxY - minY) + 8;
  const offsetX = -minX + 4;
  const offsetY = -minY + 4;

  // Use CSS 3D transforms for fast rendering
  const transformedCanvas = renderWithCSS3D(
    image,
    srcWidth,
    srcHeight,
    outWidth,
    outHeight,
    offsetX + centerX,
    offsetY + centerY,
    rotateX,
    rotateY,
    rotateZ,
    perspective
  );

  // Create mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = outWidth;
  maskCanvas.height = outHeight;
  const mCtx = maskCanvas.getContext('2d')!;
  mCtx.fillStyle = '#ffffff';
  mCtx.fillRect(0, 0, outWidth, outHeight);

  // Detect empty pixels
  const tCtx = transformedCanvas.getContext('2d')!;
  const imageData = tCtx.getImageData(0, 0, outWidth, outHeight);
  const maskData = mCtx.getImageData(0, 0, outWidth, outHeight);
  let emptyCount = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] < 10) {
      emptyCount++;
    } else {
      maskData.data[i] = 0;
      maskData.data[i + 1] = 0;
      maskData.data[i + 2] = 0;
      maskData.data[i + 3] = 255;
    }
  }

  mCtx.putImageData(maskData, 0, 0);

  const bbox = findContentBoundingBox(imageData, outWidth, outHeight);
  const totalPixels = outWidth * outHeight;
  const emptyRatio = emptyCount / totalPixels;

  return {
    transformedCanvas,
    maskCanvas,
    emptyPixelCount: emptyCount,
    boundingBox: bbox,
    hasEmptyPixels: emptyRatio > 0.02,
  };
}

/**
 * Render image with CSS 3D transforms into a canvas.
 * Uses an offscreen DOM element with perspective transform, then captures with html2canvas-style approach.
 */
function renderWithCSS3D(
  image: HTMLImageElement | HTMLCanvasElement,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
  cx: number,
  cy: number,
  rotX: number,
  rotY: number,
  rotZ: number,
  perspective: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, outW, outH);

  // Use 2D canvas affine transform approximation for perspective
  // This is faster than DOM-based CSS 3D and avoids html2canvas dependency
  const radX = (rotX * Math.PI) / 180;
  const radY = (rotY * Math.PI) / 180;
  const radZ = (rotZ * Math.PI) / 180;

  // For moderate rotations, use bilinear interpolation with projected corners
  const p0 = project3D({ x: -srcW / 2, y: -srcH / 2, z: 0 }, radX, radY, radZ, perspective);
  const p1 = project3D({ x: srcW / 2, y: -srcH / 2, z: 0 }, radX, radY, radZ, perspective);
  const p2 = project3D({ x: srcW / 2, y: srcH / 2, z: 0 }, radX, radY, radZ, perspective);
  const p3 = project3D({ x: -srcW / 2, y: srcH / 2, z: 0 }, radX, radY, radZ, perspective);

  ctx.save();
  ctx.translate(cx, cy);

  // Use subdivision for better quality — split into grid cells
  const subdivisions = Math.max(4, Math.min(16, Math.ceil(Math.max(Math.abs(rotX), Math.abs(rotY)) / 15)));
  const cellW = srcW / subdivisions;
  const cellH = srcH / subdivisions;

  for (let row = 0; row < subdivisions; row++) {
    for (let col = 0; col < subdivisions; col++) {
      const sx = col * cellW;
      const sy = row * cellH;
      const sw = cellW;
      const sh = cellH;

      // Project 4 corners of this cell
      const c0 = project3D({ x: sx - srcW / 2, y: sy - srcH / 2, z: 0 }, radX, radY, radZ, perspective);
      const c1 = project3D({ x: sx + sw - srcW / 2, y: sy - srcH / 2, z: 0 }, radX, radY, radZ, perspective);
      const c2 = project3D({ x: sx + sw - srcW / 2, y: sy + sh - srcH / 2, z: 0 }, radX, radY, radZ, perspective);
      const c3 = project3D({ x: sx - srcW / 2, y: sy + sh - srcH / 2, z: 0 }, radX, radY, radZ, perspective);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c0.x, c0.y);
      ctx.lineTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.lineTo(c3.x, c3.y);
      ctx.closePath();
      ctx.clip();

      // Map source quad to projected quad using affine transform
      ctx.setTransform(c1.x - c0.x, c1.y - c0.y, c3.x - c0.x, c3.y - c0.y, c0.x, c0.y);
      ctx.drawImage(image instanceof HTMLCanvasElement ? image : image, sx, sy, sw, sh, 0, 0, 1, 1);
      ctx.restore();
    }
  }

  ctx.restore();
  return canvas;
}

function project3D(
  point: { x: number; y: number; z: number },
  radX: number,
  radY: number,
  radZ: number,
  perspective: number
): { x: number; y: number } {
  let { x, y, z } = point;

  const cosX = Math.cos(radX),
    sinX = Math.sin(radX);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;
  y = y1;
  z = z1;

  const cosY = Math.cos(radY),
    sinY = Math.sin(radY);
  const x1 = x * cosY + z * sinY;
  const z2 = -x * sinY + z * cosY;
  x = x1;
  z = z2;

  const cosZ = Math.cos(radZ),
    sinZ = Math.sin(radZ);
  const x2 = x * cosZ - y * sinZ;
  const y2 = x * sinZ + y * cosZ;
  x = x2;
  y = y2;

  const scale = perspective / (perspective + z);
  return { x: x * scale, y: y * scale };
}

function findContentBoundingBox(
  imageData: ImageData,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 4;
      if (imageData.data[i + 3] > 10) {
        minX = Math.min(minX, col);
        minY = Math.min(minY, row);
        maxX = Math.max(maxX, col);
        maxY = Math.max(maxY, row);
      }
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Canvas-based edge-cloning fill — fast fallback when AI is unavailable.
 */
export function fillEmptyRegionsCanvas(
  transformedCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  iterations: number = 40
): HTMLCanvasElement {
  const w = transformedCanvas.width;
  const h = transformedCanvas.height;
  const result = document.createElement('canvas');
  result.width = w;
  result.height = h;
  const ctx = result.getContext('2d')!;
  ctx.drawImage(transformedCanvas, 0, 0);

  const tCtx = transformedCanvas.getContext('2d')!;
  const mCtx = maskCanvas.getContext('2d')!;
  const resultData = ctx.getImageData(0, 0, w, h);
  const maskData = mCtx.getImageData(0, 0, w, h);

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  for (let iter = 0; iter < iterations; iter++) {
    const toFill: { idx: number; r: number; g: number; b: number }[] = [];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        if (maskData.data[idx] > 128) {
          let rSum = 0,
            gSum = 0,
            bSum = 0,
            count = 0;
          for (const [dx, dy] of dirs) {
            const nIdx = ((y + dy) * w + (x + dx)) * 4;
            if (maskData.data[nIdx] < 128 || resultData.data[nIdx + 3] > 10) {
              rSum += resultData.data[nIdx];
              gSum += resultData.data[nIdx + 1];
              bSum += resultData.data[nIdx + 2];
              count++;
            }
          }
          if (count > 0) {
            toFill.push({ idx, r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) });
          }
        }
      }
    }

    if (toFill.length === 0) {
      break;
    }
    for (const f of toFill) {
      resultData.data[f.idx] = f.r;
      resultData.data[f.idx + 1] = f.g;
      resultData.data[f.idx + 2] = f.b;
      resultData.data[f.idx + 3] = 255;
    }
  }

  ctx.putImageData(resultData, 0, 0);
  return result;
}
