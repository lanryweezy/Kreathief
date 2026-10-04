import { Artboard, Layer } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface SpatialPin {
  id: string;
  artboardId: string;
  x: number;
  y: number;
  targetLayerId?: string;
  targetLayerName?: string;
  targetLayerType?: string;
  nearbyLayerIds: string[];
  zoneSummary: string;
  createdAt: number;
}

export interface SpatialActionSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

/**
 * Calculates human-readable zone quadrant for a given point on an artboard.
 */
export function resolveSpatialZone(x: number, y: number, width: number, height: number): string {
  const horizontal = x < width * 0.33 ? 'left' : x > width * 0.66 ? 'right' : 'center';
  const vertical = y < height * 0.25 ? 'top header' : y < height * 0.75 ? 'center hero' : 'bottom CTA';
  return `${vertical} (${horizontal})`;
}

/**
 * Resolves full spatial intelligence around a coordinate on the active artboard.
 */
export function resolveSpatialContext(
  point: { x: number; y: number },
  artboard: Artboard,
  radius: number = 140
): SpatialPin {
  const { x, y } = point;
  const layers = artboard.layers || [];

  // Hit-test in reverse (topmost layer first in standard z-order stack)
  let targetLayer: Layer | undefined;
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (l.visible === false || l.locked) continue;
    const lx = l.x ?? 0;
    const ly = l.y ?? 0;
    const lw = l.width ?? 0;
    const lh = l.height ?? 0;
    if (x >= lx && x <= lx + lw && y >= ly && y <= ly + lh) {
      targetLayer = l;
      break;
    }
  }

  // Find nearby layers within Euclidean radius from center
  const nearbyLayerIds: string[] = [];
  layers.forEach((l) => {
    if (targetLayer && l.id === targetLayer.id) return;
    const lx = (l.x ?? 0) + (l.width ?? 0) / 2;
    const ly = (l.y ?? 0) + (l.height ?? 0) / 2;
    const dist = Math.hypot(x - lx, y - ly);
    if (dist <= radius) {
      nearbyLayerIds.push(l.id);
    }
  });

  const zoneSummary = resolveSpatialZone(x, y, artboard.width, artboard.height);

  return {
    id: uuidv4().slice(0, 8),
    artboardId: artboard.id,
    x: Math.round(x),
    y: Math.round(y),
    targetLayerId: targetLayer?.id,
    targetLayerName: targetLayer?.name || targetLayer?.type,
    targetLayerType: targetLayer?.type,
    nearbyLayerIds,
    zoneSummary,
    createdAt: Date.now(),
  };
}

/**
 * Builds an LLM-parsable spatial prompt prefix that injects exact coordinates and element hierarchies.
 */
export function buildSpatialPromptContext(pin: SpatialPin, artboard: Artboard): string {
  const target = pin.targetLayerId
    ? artboard.layers.find((l) => l.id === pin.targetLayerId)
    : undefined;
  const nearby = pin.nearbyLayerIds
    .map((id) => artboard.layers.find((l) => l.id === id)?.name || id)
    .filter(Boolean);

  let summary = `[SPATIAL PIN CONTEXT]: Location (${pin.x}px, ${pin.y}px) in "${pin.zoneSummary}" of artboard (${artboard.width}x${artboard.height}). `;
  if (target) {
    summary += `Target element under pin: "${target.name || target.type}" [${target.type}] at (${target.x}, ${target.y}) size ${target.width}x${target.height}. `;
    if (target.type === 'text') {
      summary += `Content: "${(target as any).text}", Font: ${(target as any).fontFamily}, Size: ${(target as any).fontSize}px. `;
    } else if ((target as any).fill) {
      summary += `Fill: ${(target as any).fill}. `;
    }
  } else {
    summary += `Pin is dropped in empty canvas space. `;
  }

  if (nearby.length > 0) {
    summary += `Nearby contextual elements: ${nearby.slice(0, 4).join(', ')}.`;
  }
  return summary;
}

/**
 * Suggests contextual 1-click actions depending on the element under the pin.
 */
export function suggestSpatialActions(pin: SpatialPin, artboard: Artboard): SpatialActionSuggestion[] {
  const target = pin.targetLayerId
    ? artboard.layers.find((l) => l.id === pin.targetLayerId)
    : undefined;

  if (target?.type === 'text') {
    return [
      { id: 'punchier', label: '⚡ Punchier Copy', prompt: 'Make this text copy punchier, more engaging, and high-converting' },
      { id: 'contrast', label: '🎨 Fix Contrast', prompt: 'Adjust text color to guarantee WCAG AAA contrast against background' },
      { id: 'badge', label: '🏷️ Add Pill Badge', prompt: `Add a vibrant pill badge beside this text at (${pin.x + 80}, ${pin.y})` },
      { id: 'font_scale', label: '📐 Hero Scale (+25%)', prompt: 'Scale this headline font size up by 25% and center-align' },
    ];
  }

  if (target?.type === 'image') {
    return [
      { id: 'rmbg', label: '✂️ Cutout Subject (Bria)', prompt: 'Remove background from this image leaving crisp transparent cutout' },
      { id: 'upscale', label: '💎 4K Clarity Upscale', prompt: 'Upscale and sharpen this image with neural texture restoration' },
      { id: 'vectorize', label: '⚡ Trace to SVG Vector', prompt: 'Convert this raster artwork into clean, scalable SVG vector paths' },
      { id: 'shadow', label: '🌑 Add Soft Depth Shadow', prompt: 'Add an aesthetic diffused drop shadow to lift this image' },
    ];
  }

  if (target?.type === 'rectangle' || (target?.type as string) === 'circle' || (target?.type as string) === 'ellipse' || target?.type === 'path') {
    return [
      { id: 'glassmorphism', label: '🔮 Frosted Glassmorphism', prompt: 'Style this shape with frosted glass backdrop blur, white border glow, and subtle shadow' },
      { id: 'gradient', label: '🌈 Mesh Gradient Fill', prompt: 'Apply a modern chromatic gradient fill to this vector element' },
      { id: 'glow', label: '✨ Neon Outer Glow', prompt: 'Add vibrant electric neon glow and soften stroke edges' },
    ];
  }

  // Empty canvas
  return [
    { id: 'add_cta', label: '🔘 Insert CTA Button Here', prompt: `Insert a sleek rounded CTA button ("Get Started ➔") right at (${pin.x}, ${pin.y})` },
    { id: 'add_badge', label: '🏷️ Insert Highlight Pill', prompt: `Insert a glowing pill badge ("NEW RELEASE") at (${pin.x}, ${pin.y})` },
    { id: 'add_subhead', label: '📝 Insert Supporting Text', prompt: `Insert clean body subtitle text at (${pin.x}, ${pin.y})` },
    { id: 'add_shape', label: '📦 Insert Glass Card', prompt: `Insert a modern frosted container card centered at (${pin.x}, ${pin.y})` },
  ];
}
