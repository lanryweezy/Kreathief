/**
 * Non-destructive canvas placement.
 *
 * Rule: generated designs NEVER overwrite work that is already on the canvas.
 *  - Active artboard empty  → the design fills it (adopting the design's size).
 *  - Active artboard in use → the design lands on a NEW artboard placed to the
 *    right of everything that exists, and that artboard becomes active.
 *
 * Layer ids are re-minted on every placement so applying the same variant twice
 * (or next to its source) never produces colliding ids across artboards.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Artboard, Layer } from '../types';

export const ARTBOARD_GAP = 100;

export interface PlaceableDesign {
  name?: string;
  layers: Layer[];
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface PlacementResult {
  artboards: Artboard[];
  activeArtboardId: string;
  /** true when the design was added beside existing work instead of into an empty board */
  placedOnNewArtboard: boolean;
}

export function isArtboardOccupied(artboard?: Artboard | null): boolean {
  return Boolean(artboard && Array.isArray(artboard.layers) && artboard.layers.length > 0);
}

/** World-space x for a new artboard to the right of every existing one. */
export function nextArtboardX(artboards: Artboard[]): number {
  if (!artboards.length) {
    return 0;
  }
  const maxRight = Math.max(...artboards.map((a) => (Number(a.x) || 0) + (Number(a.width) || 1080)));
  return maxRight + ARTBOARD_GAP;
}

/** Deep-clone layers with fresh ids, remapping intra-design references. */
export function cloneLayersWithFreshIds(layers: Layer[]): Layer[] {
  const cloned = structuredClone(layers) as any[];
  const idMap = new Map<string, string>();
  for (const layer of cloned) {
    if (layer && typeof layer.id === 'string') {
      idMap.set(layer.id, `${String(layer.type || 'layer')}_${uuidv4().slice(0, 12)}`);
    }
  }
  const remap = (id: unknown) => (typeof id === 'string' && idMap.has(id) ? idMap.get(id) : id);
  for (const layer of cloned) {
    if (!layer) {
      continue;
    }
    layer.id = remap(layer.id);
    if (layer.groupId) layer.groupId = remap(layer.groupId);
    if (layer.maskLayerId) layer.maskLayerId = remap(layer.maskLayerId);
    if (layer.motionPathId) layer.motionPathId = remap(layer.motionPathId);
    if (Array.isArray(layer.children)) layer.children = layer.children.map(remap);
  }
  return cloned as Layer[];
}

/**
 * Place a single design without destroying existing canvas content.
 * Pure function — returns the next artboards array + active id.
 */
export function placeDesignNonDestructively(
  artboards: Artboard[],
  activeArtboardId: string | null | undefined,
  design: PlaceableDesign,
  fallbackSize: { width: number; height: number } = { width: 1080, height: 1080 }
): PlacementResult {
  const width = design.width || fallbackSize.width;
  const height = design.height || fallbackSize.height;
  const layers = cloneLayersWithFreshIds(design.layers || []);
  const activeIndex = artboards.findIndex((a) => a.id === activeArtboardId);
  const active = activeIndex >= 0 ? artboards[activeIndex] : undefined;

  if (active && !isArtboardOccupied(active)) {
    const filled: Artboard = {
      ...active,
      width,
      height,
      layers,
      ...(design.backgroundColor ? { backgroundColor: design.backgroundColor } : {}),
    };
    const next = artboards.slice();
    next[activeIndex] = filled;
    return { artboards: next, activeArtboardId: filled.id, placedOnNewArtboard: false };
  }

  const board: Artboard = {
    id: uuidv4(),
    name: design.name || `AI Design ${artboards.length + 1}`,
    x: nextArtboardX(artboards),
    y: active ? Number(active.y) || 0 : 0,
    width,
    height,
    layers,
    ...(design.backgroundColor ? { backgroundColor: design.backgroundColor } : {}),
  };
  return { artboards: [...artboards, board], activeArtboardId: board.id, placedOnNewArtboard: true };
}

