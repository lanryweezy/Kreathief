// Mockup Color Engine — Substrate Recoloring via Luminance Masking
// Technique: Extract highlight/shadow map from product photo, composite onto user-chosen color
// This is how Kittl and Yellow Images achieve realistic garment recoloring.

export interface SubstrateColorSwatch {
  id: string;
  name: string;
  hex: string;
  category: 'apparel' | 'packaging' | 'device' | 'paper';
}

// Curated brand-accurate apparel and packaging color swatches
export const APPAREL_COLOR_SWATCHES: SubstrateColorSwatch[] = [
  { id: 'vintage_black', name: 'Vintage Black', hex: '#1a1a1a', category: 'apparel' },
  { id: 'washed_charcoal', name: 'Washed Charcoal', hex: '#3d3d3d', category: 'apparel' },
  { id: 'ash_grey', name: 'Ash Grey', hex: '#9e9e9e', category: 'apparel' },
  { id: 'vintage_white', name: 'Vintage White', hex: '#f5f0e8', category: 'apparel' },
  { id: 'cream', name: 'Cream', hex: '#fdf6e2', category: 'apparel' },
  { id: 'navy', name: 'Navy', hex: '#1a2744', category: 'apparel' },
  { id: 'forest_green', name: 'Forest Green', hex: '#2d5a27', category: 'apparel' },
  { id: 'sage', name: 'Sage Green', hex: '#8aab7e', category: 'apparel' },
  { id: 'terracotta', name: 'Terracotta', hex: '#c1603f', category: 'apparel' },
  { id: 'dusty_rose', name: 'Dusty Rose', hex: '#c9848e', category: 'apparel' },
  { id: 'burgundy', name: 'Burgundy', hex: '#6b1f2a', category: 'apparel' },
  { id: 'slate_blue', name: 'Slate Blue', hex: '#5b7fa6', category: 'apparel' },
  { id: 'sand', name: 'Sand', hex: '#c4a882', category: 'apparel' },
  { id: 'lavender', name: 'Lavender', hex: '#b8a9d9', category: 'apparel' },
];

export const PACKAGING_COLOR_SWATCHES: SubstrateColorSwatch[] = [
  { id: 'kraft_brown', name: 'Kraft Brown', hex: '#8b6340', category: 'packaging' },
  { id: 'matte_black', name: 'Matte Black', hex: '#1c1c1c', category: 'packaging' },
  { id: 'frosted_white', name: 'Frosted White', hex: '#f0eeea', category: 'packaging' },
  { id: 'copper', name: 'Copper Foil', hex: '#b87333', category: 'packaging' },
  { id: 'emerald', name: 'Emerald', hex: '#1a5c3e', category: 'packaging' },
  { id: 'silver_foil', name: 'Silver Foil', hex: '#b0b8c1', category: 'packaging' },
];

export const ALL_COLOR_SWATCHES: SubstrateColorSwatch[] = [
  ...APPAREL_COLOR_SWATCHES,
  ...PACKAGING_COLOR_SWATCHES,
];

/**
 * Hex color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

/**
 * Recolor a product substrate image to a target color while preserving
 * all natural shadows, highlights, and texture (luminance masking technique).
 *
 * Algorithm:
 * 1. For each pixel in the background image, compute its luminance (perceived brightness).
 * 2. Map that luminance onto the target color via linear interpolation:
 *    - Shadows (dark areas) pull toward a darkened version of the target color
 *    - Highlights (bright areas) pull toward a lightened version
 * 3. Blend using a configurable strength so subtle textures survive.
 *
 * @param ctx OffscreenCanvasRenderingContext2D to draw onto
 * @param bgBitmap The product background ImageBitmap
 * @param targetHex Target hex color (e.g. "#2d5a27" for forest green)
 * @param strength 0-1 how strongly to apply the recolor (default 0.85)
 */
export function recolorSubstrate(
  ctx: OffscreenCanvasRenderingContext2D,
  bgBitmap: ImageBitmap,
  targetHex: string,
  strength = 0.85
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Draw original image
  ctx.drawImage(bgBitmap, 0, 0, width, height);

  // Read pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const target = hexToRgb(targetHex);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 10) continue; // Skip fully transparent pixels

    // Compute perceived luminance (ITU-R BT.709 coefficients)
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const lumNorm = lum / 255; // 0..1

    // Map luminance onto target color:
    // - lumNorm=0 (black) => very dark version of target color
    // - lumNorm=0.5 (mid) => target color itself
    // - lumNorm=1 (white) => very bright version of target color
    const shadowFactor = lumNorm * 2.0; // emphasize shadows
    const recoloredR = Math.round(target.r * shadowFactor);
    const recoloredG = Math.round(target.g * shadowFactor);
    const recoloredB = Math.round(target.b * shadowFactor);

    // Blend between original and recolored
    data[i]     = Math.min(255, Math.round(r * (1 - strength) + recoloredR * strength));
    data[i + 1] = Math.min(255, Math.round(g * (1 - strength) + recoloredG * strength));
    data[i + 2] = Math.min(255, Math.round(b * (1 - strength) + recoloredB * strength));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Get a swatch by its ID
 */
export function getSwatchById(id: string): SubstrateColorSwatch | undefined {
  return ALL_COLOR_SWATCHES.find((s) => s.id === id);
}
