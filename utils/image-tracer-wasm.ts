/**
 * Rust/WASM Image Tracing & Pixel Operations
 * Drop-in replacement for imagetracerjs + heavy.worker pixel ops.
 */
import {
  trace_image_to_svg as _traceImageToSvg,
  quantize_image as _quantizeImage,
  trace_mask_to_svg as _traceMaskToSvg,
  enhance_pixels as _enhancePixels,
  extract_palette as _extractPalette,
  generate_grain as _generateGrain,
} from '../rust-engine/pkg/kreathief_engine';

/**
 * Trace RGBA pixel data to SVG path strings grouped by color.
 * Replaces imagetracerjs — uses Rust contour tracing + Douglas-Peucker.
 *
 * @param rgba - Raw RGBA pixel data [r,g,b,a, r,g,b,a, ...]
 * @param width - Image width
 * @param height - Image height
 * @param numColors - Palette size (2-16)
 * @returns Array of { path, color } objects
 */
export function traceImageToSvg(
  rgba: Uint8Array,
  width: number,
  height: number,
  numColors: number = 2
): Array<{ path: string; color: string }> {
  const result = _traceImageToSvg(rgba, width, height, numColors);
  if (!result) return [];

  const paths: Array<{ path: string; color: string }> = [];
  const parts = result.split('|');
  for (let i = 0; i < parts.length - 1; i += 2) {
    const color = parts[i];
    const path = parts[i + 1];
    if (color && path) {
      paths.push({ color, path });
    }
  }
  return paths;
}

/**
 * Histogram stretching + auto white balance. Modifies pixels in-place.
 */
export function enhancePixels(rgba: Uint8ClampedArray | Uint8Array): void {
  _enhancePixels(rgba as Uint8Array);
}

/**
 * Extract dominant palette colors from RGBA pixels.
 * @returns Array of hex color strings
 */
export function extractPalette(
  rgba: Uint8Array,
  numColors: number = 5,
  sampleStep: number = 3
): string[] {
  const raw = _extractPalette(rgba, numColors, sampleStep);
  const colors: string[] = [];
  for (let i = 0; i < raw.length; i += 3) {
    const r = raw[i].toString(16).padStart(2, '0');
    const g = raw[i + 1].toString(16).padStart(2, '0');
    const b = raw[i + 2].toString(16).padStart(2, '0');
    colors.push(`#${r}${g}${b}`);
  }
  return colors;
}

/**
 * Generate procedural grain texture as RGBA data.
 */
export function generateGrain(
  width: number,
  height: number,
  noise: number,
  scale: number
): Uint8Array {
  return _generateGrain(width, height, noise, scale);
}
