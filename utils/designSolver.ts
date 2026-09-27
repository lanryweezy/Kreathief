/**
 * Design Solver — deterministic craft enforcement for AI-generated layers.
 *
 * The LLM decides aesthetics; this module guarantees production correctness
 * (KDAB dimensions 11, 12, 13): nothing off-canvas, nothing sub-pixel,
 * snap-to-grid, minimum type size, and text that is actually readable
 * against whatever sits beneath it (WCAG AA contrast repair).
 *
 * Pure function — no store, no DOM, safe for workers and tests.
 */
import { Layer, Gradient } from '../types';

export interface SolveFix {
  layerId: string;
  message: string;
}

export interface SolveResult {
  layers: Layer[];
  fixes: SolveFix[];
}

const GRID_SNAP_PX = 2;
const MIN_FONT_SIZE = 10;
const CONTRAST_TARGET = 4.5; // WCAG AA for body text

// ─── Color math ──────────────────────────────────────────────────────────────

function parseColor(color?: string): { r: number; g: number; b: number } | null {
  if (!color || typeof color !== 'string') return null;
  const c = color.trim().toLowerCase();
  if (c === 'transparent' || c === 'none') return null;
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const s = hex[1];
    const full = s.length === 3 ? s.split('').map((ch) => ch + ch).join('') : s;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const rgb = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  return null;
}

function relLuminance(r: number, g: number, b: number): number {
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const la = relLuminance(a.r, a.g, a.b);
  const lb = relLuminance(b.r, b.g, b.b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Midpoint stop color of a gradient, used as its effective backdrop color. */
function gradientMidColor(grad?: Gradient): string | undefined {
  if (!grad || !Array.isArray(grad.colors) || grad.colors.length === 0) return undefined;
  const sorted = [...grad.colors].sort((x, y) => x.position - y.position);
  return sorted[Math.floor((sorted.length - 1) / 2)]?.color;
}

function layerBaseColor(layer: Layer): string | undefined {
  const anyLayer = layer as any;
  if (anyLayer.gradient) return gradientMidColor(anyLayer.gradient);
  if (anyLayer.backgroundGradient) return gradientMidColor(anyLayer.backgroundGradient);
  if (typeof anyLayer.fill === 'string') return anyLayer.fill;
  if (typeof anyLayer.color === 'string' && layer.type !== 'text') return anyLayer.color;
  if (typeof anyLayer.backgroundColor === 'string') return anyLayer.backgroundColor;
  return undefined;
}

const isShape = (t: string) =>
  !['text', 'image', 'adjustment', 'group'].includes(t);

/**
 * Find the effective backdrop for a layer: the color of the nearest
 * lower-z layer that covers the target's center point; falls back to the
 * canvas background color.
 */
function findBackdropColor(
  ordered: Layer[],
  index: number,
  canvasBg: string
): { r: number; g: number; b: number } {
  const target = ordered[index];
  const cx = target.x + target.width / 2;
  const cy = target.y + target.height / 2;

  for (let i = index - 1; i >= 0; i--) {
    const cand = ordered[i];
    if (cand.visible === false) continue;
    if (!isShape(cand.type)) continue;
    if (cx >= cand.x && cx <= cand.x + cand.width && cy >= cand.y && cy <= cand.y + cand.height) {
      const parsed = parseColor(layerBaseColor(cand));
      if (parsed) return parsed;
    }
  }
  return parseColor(canvasBg) || { r: 255, g: 255, b: 255 };
}

function bestTextColor(
  backdrop: { r: number; g: number; b: number },
  candidates: string[]
): string | null {
  let best: string | null = null;
  let bestRatio = 0;
  for (const cand of candidates) {
    const parsed = parseColor(cand);
    if (!parsed) continue;
    const ratio = contrastRatio(parsed, backdrop);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = cand;
    }
  }
  return bestRatio >= CONTRAST_TARGET ? best : null;
}

// ─── Solver ──────────────────────────────────────────────────────────────────

export function solveDesignLayers(
  inputLayers: Layer[],
  canvas: { width: number; height: number; background?: string },
  preferredTextColors: string[] = ['#ffffff', '#0a0a0a', '#f4f4f5', '#111827']
): SolveResult {
  const fixes: SolveFix[] = [];
  const canvasBg = canvas.background || '#ffffff';
  const W = canvas.width;
  const H = canvas.height;

  // Work in paint order so backdrop lookup can walk backwards.
  const layers = [...inputLayers]
    .sort((a, b) => ((a as any).zIndex ?? 0) - ((b as any).zIndex ?? 0))
    .map((l) => ({ ...l }) as Layer);

  layers.forEach((layer, index) => {
    // 1. Size sanity: nothing zero-sized or larger than the canvas.
    const anyLayer = layer as any;
    if (!(anyLayer.width >= 4)) {
      anyLayer.width = 4;
      fixes.push({ layerId: layer.id, message: `${layer.name || 'Layer'} widened to minimum size` });
    }
    if (!(anyLayer.height >= 4)) {
      anyLayer.height = 4;
      fixes.push({ layerId: layer.id, message: `${layer.name || 'Layer'} heightened to minimum size` });
    }
    anyLayer.width = Math.min(anyLayer.width, W);
    anyLayer.height = Math.min(anyLayer.height, H);

    // 2. Position: snap to grid, then clamp so the layer cannot sit off-canvas.
    const snappedX = Math.round(anyLayer.x / GRID_SNAP_PX) * GRID_SNAP_PX;
    const snappedY = Math.round(anyLayer.y / GRID_SNAP_PX) * GRID_SNAP_PX;
    if (snappedX !== anyLayer.x || snappedY !== anyLayer.y) {
      fixes.push({ layerId: layer.id, message: `${layer.name || 'Layer'} snapped to ${GRID_SNAP_PX}px grid` });
    }
    anyLayer.x = Math.max(0, Math.min(snappedX, W - anyLayer.width));
    anyLayer.y = Math.max(0, Math.min(snappedY, H - anyLayer.height));

    // 3. Text: minimum size + guaranteed legibility against the real backdrop.
    if (layer.type === 'text') {
      const text = anyLayer;
      if (typeof text.fontSize === 'number' && text.fontSize < MIN_FONT_SIZE) {
        text.fontSize = MIN_FONT_SIZE;
        fixes.push({ layerId: layer.id, message: `${layer.name || 'Text'} raised to ${MIN_FONT_SIZE}px minimum` });
      }
      const textColor = parseColor(text.color);
      const backdrop = findBackdropColor(layers, index, canvasBg);
      if (textColor && contrastRatio(textColor, backdrop) < CONTRAST_TARGET) {
        const replacement = bestTextColor(backdrop, [text.color, ...preferredTextColors]);
        if (replacement && replacement !== text.color) {
          text.color = replacement;
          fixes.push({
            layerId: layer.id,
            message: `${layer.name || 'Text'} recolored to ${replacement} for ${CONTRAST_TARGET}:1 contrast`,
          });
        }
      }
    }
  });

  return { layers, fixes };
}
