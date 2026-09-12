// Mockup Displacement Engine
// Technique 1: Wrinkle/fabric displacement via luminance vector field (Kittl / Artboard Studio approach)
// Technique 2: Cylindrical UV projection for cans/bottles/mugs (correct 180° wrap-around)

export interface DisplacementConfig {
  intensity: number;   // how many pixels to displace (0 = off, 12 = apparel, 4 = pouch)
  useCylindrical: boolean;
  cylindricalRadius?: number; // virtual radius in px
  cylindricalCenterX?: number; // 0..1 normalized
}

/** Default displacement configs keyed by substrateType */
export const DISPLACEMENT_PROFILES: Record<string, DisplacementConfig> = {
  fabric:      { intensity: 12, useCylindrical: false },
  paper:       { intensity: 5,  useCylindrical: false },
  cylindrical: { intensity: 0,  useCylindrical: true, cylindricalRadius: 60, cylindricalCenterX: 0.5 },
  glass:       { intensity: 2,  useCylindrical: true, cylindricalRadius: 50, cylindricalCenterX: 0.5 },
  device:      { intensity: 0,  useCylindrical: false },
  flat:        { intensity: 0,  useCylindrical: false },
};

/**
 * Apply luminance-based fabric wrinkle displacement to a design bitmap.
 *
 * Algorithm:
 * 1. Read each pixel of the background (bgData) to extract its luminance as a displacement vector.
 * 2. For each pixel of the design, compute where to sample from by offsetting
 *    based on the background's local luminance gradient.
 * 3. Write the displaced design pixels to the output.
 *
 * This simulates how graphic text and shapes visually conform to fabric folds and wrinkles.
 */
export function applyDisplacementMap(
  ctx: OffscreenCanvasRenderingContext2D,
  designCanvas: OffscreenCanvas,
  bgData: ImageData,
  config: DisplacementConfig,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (config.intensity === 0) return;

  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;
  const intensity = config.intensity;

  // Get design pixel data
  const designCtx = designCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  const designData = designCtx.getImageData(0, 0, designCanvas.width, designCanvas.height);
  const src = designData.data;

  // Output buffer - only covers the bounding box
  const bx = Math.max(0, Math.floor(x));
  const by = Math.max(0, Math.floor(y));
  const bw = Math.min(canvasW - bx, Math.ceil(w));
  const bh = Math.min(canvasH - by, Math.ceil(h));
  const outData = ctx.createImageData(bw, bh);
  const dst = outData.data;
  const bg = bgData.data;

  const dw = designCanvas.width;
  const dh = designCanvas.height;

  for (let py = 0; py < bh; py++) {
    for (let px = 0; px < bw; px++) {
      const screenX = bx + px;
      const screenY = by + py;

      // Clamp to canvas bounds
      if (screenX < 0 || screenX >= canvasW || screenY < 0 || screenY >= canvasH) continue;

      // Sample background luminance at this screen position
      const bgIdx = (screenY * canvasW + screenX) * 4;
      const bgR = bg[bgIdx];
      const bgG = bg[bgIdx + 1];
      const bgB = bg[bgIdx + 2];

      // Compute luminance gradient as displacement vector
      // Use red channel for X displacement, green for Y (common technique)
      const dispX = (bgR / 255.0 - 0.5) * intensity;
      const dispY = (bgG / 255.0 - 0.5) * intensity;

      // Map screen position to design UV space
      const u = (screenX - x) / w;
      const v = (screenY - y) / h;

      // Apply displacement in UV space
      const srcU = u + dispX / w;
      const srcV = v + dispY / h;

      // Convert to source pixel coordinates
      const sx = srcU * dw;
      const sy = srcV * dh;

      if (sx < 0 || sx >= dw - 1 || sy < 0 || sy >= dh - 1) continue;

      // Bilinear interpolation
      const sx0 = Math.floor(sx);
      const sy0 = Math.floor(sy);
      const dx = sx - sx0;
      const dy = sy - sy0;

      const i00 = (sy0 * dw + sx0) * 4;
      const i10 = (sy0 * dw + sx0 + 1) * 4;
      const i01 = ((sy0 + 1) * dw + sx0) * 4;
      const i11 = ((sy0 + 1) * dw + sx0 + 1) * 4;

      const outIdx = (py * bw + px) * 4;

      for (let c = 0; c < 4; c++) {
        dst[outIdx + c] =
          src[i00 + c] * (1 - dx) * (1 - dy) +
          src[i10 + c] * dx * (1 - dy) +
          src[i01 + c] * (1 - dx) * dy +
          src[i11 + c] * dx * dy;
      }
    }
  }

  ctx.putImageData(outData, bx, by);
}

/**
 * Cylindrical UV projection for bottles, cans, mugs, and jars.
 *
 * Maps the flat design texture onto a cylinder using:
 *   x' = radius * sin(u * PI)    - horizontal compression at edges
 *   shade = cos(u * PI) * 0.5 + 0.5  - natural edge darkening
 *
 * This creates authentic 180 degree wrap-around label placement.
 */
export function applyCylindricalWrap(
  ctx: OffscreenCanvasRenderingContext2D,
  designCanvas: OffscreenCanvas,
  config: DisplacementConfig,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (!config.useCylindrical) return;

  const designCtx = designCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  const designData = designCtx.getImageData(0, 0, designCanvas.width, designCanvas.height);
  const src = designData.data;
  const dw = designCanvas.width;
  const dh = designCanvas.height;

  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  const bx = Math.max(0, Math.floor(x));
  const by = Math.max(0, Math.floor(y));
  const bw = Math.min(canvasW - bx, Math.ceil(w));
  const bh = Math.min(canvasH - by, Math.ceil(h));
  const outData = ctx.createImageData(bw, bh);
  const dst = outData.data;

  for (let py = 0; py < bh; py++) {
    for (let px = 0; px < bw; px++) {
      // Normalized position on the cylinder face (0..1)
      const u = px / bw;
      const v = py / bh;

      // Cylindrical horizontal compression:
      // At center (u=0.5): no compression. At edges: max compression.
      const angle = u * Math.PI; // 0..PI across the label width
      const sinA = Math.sin(angle);

      // Map compressed u back to design u-space
      const srcU = (1 - Math.cos(angle)) / 2; // 0..1, nonlinear mapping

      // Vertical stays linear
      const srcX = srcU * dw;
      const srcY = v * dh;

      if (srcX < 0 || srcX >= dw - 1 || srcY < 0 || srcY >= dh - 1) continue;

      // Natural cylindrical edge shading: center=bright, edges=dark
      const shade = sinA; // 0..1, max at center

      // Bilinear sample from design
      const sx0 = Math.floor(srcX);
      const sy0 = Math.floor(srcY);
      const dx = srcX - sx0;
      const dy = srcY - sy0;

      const i00 = (sy0 * dw + sx0) * 4;
      const i10 = (sy0 * dw + sx0 + 1) * 4;
      const i01 = ((sy0 + 1) * dw + sx0) * 4;
      const i11 = ((sy0 + 1) * dw + sx0 + 1) * 4;

      const outIdx = (py * bw + px) * 4;

      for (let c = 0; c < 3; c++) {
        const interp =
          src[i00 + c] * (1 - dx) * (1 - dy) +
          src[i10 + c] * dx * (1 - dy) +
          src[i01 + c] * (1 - dx) * dy +
          src[i11 + c] * dx * dy;
        dst[outIdx + c] = Math.round(interp * shade);
      }
      // Alpha channel - interpolate without shading
      dst[outIdx + 3] =
        src[i00 + 3] * (1 - dx) * (1 - dy) +
        src[i10 + 3] * dx * (1 - dy) +
        src[i01 + 3] * (1 - dx) * dy +
        src[i11 + 3] * dx * dy;
    }
  }

  ctx.putImageData(outData, bx, by);
}
