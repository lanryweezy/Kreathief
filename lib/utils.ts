// Mason: shared utilities extracted from duplicate implementations
// in canvasEngine.ts and exportService.ts. Single source of truth
// for color conversion and fill resolution.
import { surface } from './tokens';

/**
 * Convert a hex color to rgba string with alpha.
 * Used by canvas engine (shadow/glow) and export service (SVG filters).
 */
export function hexToRgba(hex: string, alpha: number): string {
  // Bolt: Optimized from RegExp to Number('0x' + str) + bitwise ops. Avoids slow regex execution during frequent canvas renders.
  const cleanHex = hex.charCodeAt(0) === 35 ? hex.slice(1) : hex; // 35 is '#'
  if (cleanHex.length === 6) {
    const val = Number("0x" + cleanHex);
    if (!Number.isNaN(val)) {
      return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${alpha})`;
    }
  }
  return hex;
}

/**
 * Resolve a DesignNode's fill to a solid color string.
 * If fill is a string, returns it directly.
 * If fill is a GradientFill or null, returns the provided default.
 * Used in 14 places across the codebase — was previously copy-pasted.
 */
export function resolveFillColor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fill: string | { type: string; stops: any[] } | null | undefined,
  fallback: string = surface[3]
): string {
  return typeof fill === 'string' ? fill : fallback;
}
