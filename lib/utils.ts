// Mason: shared utilities extracted from duplicate implementations
// in canvasEngine.ts and exportService.ts. Single source of truth
// for color conversion and fill resolution.
import { surface } from './tokens';

/**
 * Convert a hex color to rgba string with alpha.
 * Used by canvas engine (shadow/glow) and export service (SVG filters).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

/**
 * Resolve a DesignNode's fill to a solid color string.
 * If fill is a string, returns it directly.
 * If fill is a GradientFill or null, returns the provided default.
 * Used in 14 places across the codebase — was previously copy-pasted.
 */
export function resolveFillColor(
  fill: string | { type: string; stops: any[] } | null | undefined,
  fallback: string = surface[3],
): string {
  return typeof fill === 'string' ? fill : fallback;
}
