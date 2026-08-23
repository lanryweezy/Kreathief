/**
 * Smart Animate & Match & Move Interpolation Engine
 * Calculates layer matching and property interpolation vectors between artboards
 */

import { Layer, Artboard } from '../../types';

export interface SmartAnimatePair {
  fromLayer: Layer;
  toLayer: Layer;
  matchType: 'id' | 'name';
  deltas: {
    dx: number;
    dy: number;
    scaleX: number;
    scaleY: number;
    dRotation: number;
    fromOpacity: number;
    toOpacity: number;
    fromColor?: string;
    toColor?: string;
  };
}

export interface SmartAnimateResult {
  matched: SmartAnimatePair[];
  entering: Layer[];
  exiting: Layer[];
}

export interface SmartAnimateOptions {
  duration?: number; // milliseconds
  easing?: 'ease' | 'ease-in-out' | 'ease-out' | 'cubic-bezier(0.2, 0.8, 0.2, 1)' | 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  matchByName?: boolean;
}

/**
 * Computes matching layers and spatial/visual deltas between two artboards.
 */
export function computeSmartAnimatePairs(
  fromArtboard: Artboard,
  toArtboard: Artboard,
  options: { matchByName?: boolean } = {}
): SmartAnimateResult {
  const matchByName = options.matchByName ?? true;
  const fromLayers = fromArtboard.layers || [];
  const toLayers = toArtboard.layers || [];

  const matched: SmartAnimatePair[] = [];
  const matchedFromIds = new Set<string>();
  const matchedToIds = new Set<string>();

  // 1. Match by exact ID
  for (const f of fromLayers) {
    const target = toLayers.find((t) => t.id === f.id);
    if (target) {
      matchedFromIds.add(f.id);
      matchedToIds.add(target.id);
      matched.push(buildPair(f, target, 'id'));
    }
  }

  // 2. Match remaining layers by name (if enabled and same layer type)
  if (matchByName) {
    for (const f of fromLayers) {
      if (matchedFromIds.has(f.id) || !f.name) {
        continue;
      }
      const fName = f.name.toLowerCase();
      const target = toLayers.find(
        (t) => !matchedToIds.has(t.id) && t.name && t.name.toLowerCase() === fName && t.type === f.type
      );
      if (target) {
        matchedFromIds.add(f.id);
        matchedToIds.add(target.id);
        matched.push(buildPair(f, target, 'name'));
      }
    }
  }

  const exiting = fromLayers.filter((f) => !matchedFromIds.has(f.id));
  const entering = toLayers.filter((t) => !matchedToIds.has(t.id));

  return { matched, entering, exiting };
}

function buildPair(from: Layer, to: Layer, matchType: 'id' | 'name'): SmartAnimatePair {
  const fromW = Math.max(1, (from as any).width || 100);
  const fromH = Math.max(1, (from as any).height || 100);
  const toW = Math.max(1, (to as any).width || 100);
  const toH = Math.max(1, (to as any).height || 100);

  const fromColor = (from as any).color || (from as any).fill;
  const toColor = (to as any).color || (to as any).fill;

  return {
    fromLayer: from,
    toLayer: to,
    matchType,
    deltas: {
      dx: to.x - from.x,
      dy: to.y - from.y,
      scaleX: toW / fromW,
      scaleY: toH / fromH,
      dRotation: (to.rotation || 0) - (from.rotation || 0),
      fromOpacity: from.opacity ?? 1,
      toOpacity: to.opacity ?? 1,
      fromColor: typeof fromColor === 'string' ? fromColor : undefined,
      toColor: typeof toColor === 'string' ? toColor : undefined,
    },
  };
}

/**
 * Executes a high-performance Web Animations API (WAAPI) transition for matched elements.
 */
export function playSmartAnimate(
  elementsMap: Map<string, HTMLElement>,
  pairs: SmartAnimatePair[],
  options: SmartAnimateOptions = {}
): Animation[] {
  const duration = options.duration || 600;
  const easing = options.easing || 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const animations: Animation[] = [];

  for (const pair of pairs) {
    const el = elementsMap.get(pair.fromLayer.id) || elementsMap.get(pair.toLayer.id);
    if (!el || typeof el.animate !== 'function') {
      continue;
    }

    const { dx, dy, scaleX, scaleY, dRotation, fromOpacity, toOpacity } = pair.deltas;

    const keyframes = [
      {
        transform: 'translate(0px, 0px) scale(1, 1) rotate(0deg)',
        opacity: fromOpacity,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY}) rotate(${dRotation}deg)`,
        opacity: toOpacity,
      },
    ];

    try {
      const anim = el.animate(keyframes, {
        duration,
        easing,
        fill: 'forwards',
      });
      animations.push(anim);
    } catch {
      // Fallback gracefully if element is detached
    }
  }

  return animations;
}
