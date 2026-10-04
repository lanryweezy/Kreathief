import { Layer } from '../types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Checks if two axis-aligned rectangles intersect.
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Merges two rectangles into a single bounding box that encloses both.
 */
export function unionRects(a: Rect | null, b: Rect): Rect {
  if (!a) {
    return { ...b };
  }
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Dirty Region Tracker for 60 FPS Canvas rendering.
 * Tracks modified bounding boxes across interaction frames to avoid invalidating
 * or recalculating unchanged parts of the canvas.
 */
export class DirtyRegionTracker {
  private currentRegion: Rect | null = null;
  private dirtyLayerIds = new Set<string>();

  /**
   * Add a dirty rectangle to the tracker.
   */
  markDirty(rect: Rect, layerId?: string): void {
    if (rect.width <= 0 || rect.height <= 0) return;
    this.currentRegion = unionRects(this.currentRegion, rect);
    if (layerId) {
      this.dirtyLayerIds.add(layerId);
    }
  }

  /**
   * Mark a layer dirty, including both its previous bounding box and current bounding box.
   */
  markLayerDirty(layer: Layer, previousBounds?: Rect): void {
    const currentBounds: Rect = {
      x: layer.x ?? 0,
      y: layer.y ?? 0,
      width: layer.width ?? 1,
      height: layer.height ?? 1,
    };
    this.markDirty(currentBounds, layer.id);
    if (previousBounds) {
      this.markDirty(previousBounds, layer.id);
    }
  }

  /**
   * Returns the current accumulated dirty region bounding box.
   */
  getDirtyRegion(): Rect | null {
    return this.currentRegion;
  }

  /**
   * Checks if a rectangle intersects with the current dirty region.
   * If there is no dirty region, returns true (clean state / initial render).
   */
  intersects(rect: Rect): boolean {
    if (!this.currentRegion) {
      return true;
    }
    return rectsIntersect(this.currentRegion, rect);
  }

  /**
   * Checks if a specific layer is dirty or intersects the dirty region.
   */
  isLayerDirty(layer: Layer): boolean {
    if (!this.currentRegion) return false;
    if (this.dirtyLayerIds.has(layer.id)) return true;
    const bounds: Rect = {
      x: layer.x ?? 0,
      y: layer.y ?? 0,
      width: layer.width ?? 1,
      height: layer.height ?? 1,
    };
    return this.intersects(bounds);
  }

  /**
   * Clears the dirty region (called at end of render cycle).
   */
  clear(): void {
    this.currentRegion = null;
    this.dirtyLayerIds.clear();
  }

  /**
   * Returns set of layer IDs that were marked dirty.
   */
  getDirtyLayerIds(): ReadonlySet<string> {
    return this.dirtyLayerIds;
  }
}

// Global singleton instance for canvas render loop
export const dirtyRegionTracker = new DirtyRegionTracker();
