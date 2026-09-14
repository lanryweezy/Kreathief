import { describe, it, expect, beforeEach } from 'vitest';
import {
  DirtyRegionTracker,
  rectsIntersect,
  unionRects,
  dirtyRegionTracker,
} from '../../utils/dirtyRegion';
import { Layer } from '../../types';

const makeMockLayer = (id: string, x: number, y: number, width: number, height: number): Layer => ({
  id,
  type: 'shape',
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  locked: false,
  visible: true,
} as Layer);

describe('DirtyRegionTracker', () => {
  let tracker: DirtyRegionTracker;

  beforeEach(() => {
    tracker = new DirtyRegionTracker();
  });

  it('correctly calculates rectangle intersection', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    const c = { x: 200, y: 200, width: 50, height: 50 };

    expect(rectsIntersect(a, b)).toBe(true);
    expect(rectsIntersect(a, c)).toBe(false);
    expect(rectsIntersect(b, c)).toBe(false);
  });

  it('unions rectangles into an encompassing bounding box', () => {
    const r1 = { x: 10, y: 10, width: 50, height: 50 };
    const r2 = { x: 100, y: 80, width: 40, height: 60 };

    const union = unionRects(r1, r2);
    expect(union.x).toBe(10);
    expect(union.y).toBe(10);
    expect(union.width).toBe(130); // 140 - 10
    expect(union.height).toBe(130); // 140 - 10
  });

  it('tracks dirty regions and flags overlapping layers', () => {
    const layerA = makeMockLayer('layer-a', 0, 0, 50, 50);
    const layerB = makeMockLayer('layer-b', 200, 200, 50, 50);
    const layerC = makeMockLayer('layer-c', 40, 40, 50, 50);

    tracker.markLayerDirty(layerA);

    expect(tracker.isLayerDirty(layerA)).toBe(true);
    expect(tracker.isLayerDirty(layerC)).toBe(true); // Overlaps with layerA (0..50)
    expect(tracker.isLayerDirty(layerB)).toBe(false); // Far away (200..250)
  });

  it('handles previous and new bounds during motion/resizing', () => {
    const movedLayer = makeMockLayer('moving', 150, 150, 50, 50);
    const previousBounds = { x: 10, y: 10, width: 50, height: 50 };

    tracker.markLayerDirty(movedLayer, previousBounds);

    const dirtyRegion = tracker.getDirtyRegion()!;
    expect(dirtyRegion.x).toBe(10);
    expect(dirtyRegion.y).toBe(10);
    expect(dirtyRegion.width).toBe(190); // 200 - 10
    expect(dirtyRegion.height).toBe(190); // 200 - 10

    // Clearing resets the region
    tracker.clear();
    expect(tracker.getDirtyRegion()).toBeNull();
  });
});
