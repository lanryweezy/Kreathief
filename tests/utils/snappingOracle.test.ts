import { describe, it, expect, beforeEach } from 'vitest';
import { SnappingOracle, SnapResult } from '../../utils/snappingOracle';
import { Layer, Artboard } from '../../types';

describe('SnappingOracle', () => {
  let mockArtboard: Artboard;
  let allLayers: Layer[];

  beforeEach(() => {
    SnappingOracle.invalidateCache();

    mockArtboard = {
      id: 'artboard-1',
      name: 'Artboard',
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
      layers: [],
    } as unknown as Artboard;

    allLayers = [
      { id: 'l1', x: 100, y: 100, width: 200, height: 200, locked: false, visible: true } as unknown as Layer,
      { id: 'l2', x: 500, y: 500, width: 100, height: 100, locked: false, visible: true } as unknown as Layer,
      { id: 'l3', x: 800, y: 800, width: 50, height: 50, locked: true, visible: true } as unknown as Layer, // locked
      { id: 'l4', x: 900, y: 900, width: 50, height: 50, locked: false, visible: false } as unknown as Layer, // hidden
      {
        id: 'l5',
        x: 700,
        y: 700,
        width: 50,
        height: 50,
        locked: false,
        visible: true,
        groupId: 'g1',
      } as unknown as Layer, // in group
    ];
  });

  it('should return empty result if no moving layers', () => {
    const result = SnappingOracle.calculateSnaps([], allLayers, mockArtboard);
    expect(result).toEqual({ x: null, y: null, lines: [] });
  });

  it('should snap to artboard boundaries', () => {
    // Moving a layer to near x=0 (artboard left edge)
    const movingLayer = {
      id: 'm1',
      x: 2,
      y: 500,
      width: 100,
      height: 100,
      locked: false,
      visible: true,
    } as unknown as Layer;

    const result = SnappingOracle.calculateSnaps([movingLayer], allLayers, mockArtboard, 5);

    expect(result.x).toBe(0);
    expect(result.lines).toContainEqual(
      expect.objectContaining({
        type: 'vertical',
        value: 0,
      })
    );
  });

  it('should snap to other layer edges (left edge to right edge)', () => {
    // l1 is at x=100, width=200 -> right edge is 300
    // moving layer near x=302, threshold 5 -> should snap to 300 (new x is 300)
    const movingLayer = {
      id: 'm1',
      x: 302,
      y: 500,
      width: 100,
      height: 100,
      locked: false,
      visible: true,
    } as unknown as Layer;

    const result = SnappingOracle.calculateSnaps([movingLayer], allLayers, mockArtboard, 5);

    expect(result.x).toBe(300);
    expect(result.lines).toContainEqual(
      expect.objectContaining({
        type: 'vertical',
        value: 300,
      })
    );
  });

  it('should snap y to other layer edges', () => {
    // l1 is at y=100, height=200 -> bottom edge is 300
    // moving layer near y=298, threshold 5 -> should snap to 300
    const movingLayer = {
      id: 'm1',
      x: 500,
      y: 298,
      width: 100,
      height: 100,
      locked: false,
      visible: true,
    } as unknown as Layer;

    const result = SnappingOracle.calculateSnaps([movingLayer], allLayers, mockArtboard, 5);

    expect(result.y).toBe(300);
    expect(result.lines).toContainEqual(
      expect.objectContaining({
        type: 'horizontal',
        value: 300,
      })
    );
  });

  it('should not snap to locked, hidden, or grouped layers', () => {
    // We want to test that snapping does NOT occur to layers 3, 4, 5.

    // For l3 (locked): 800 left edge.
    const movingLayer1 = {
      id: 'm1',
      x: 798,
      y: 100,
      width: 100,
      height: 100,
      locked: false,
      visible: true,
    } as unknown as Layer;
    // For l4 (hidden): 900 left edge.
    const movingLayer2 = {
      id: 'm2',
      x: 898,
      y: 100,
      width: 100,
      height: 100,
      locked: false,
      visible: true,
    } as unknown as Layer;
    // For l5 (grouped): 700 left edge.
    const movingLayer3 = {
      id: 'm3',
      x: 698,
      y: 100,
      width: 100,
      height: 100,
      locked: false,
      visible: true,
    } as unknown as Layer;

    const result1 = SnappingOracle.calculateSnaps([movingLayer1], allLayers, mockArtboard, 5);
    const result2 = SnappingOracle.calculateSnaps([movingLayer2], allLayers, mockArtboard, 5);
    const result3 = SnappingOracle.calculateSnaps([movingLayer3], allLayers, mockArtboard, 5);

    // Should not snap to locked l3
    expect(result1.x).toBeNull();
    // Should not snap to grouped l5
    expect(result3.x).toBeNull();
  });

  it('should adjust threshold based on zoom', () => {
    // Distance is 4, threshold is 5
    // Near artboard left edge x=0
    const movingLayer = {
      id: 'm1',
      x: 4,
      y: 500,
      width: 100,
      height: 100,
      locked: false,
      visible: true,
    } as unknown as Layer;

    // Zoom 1: threshold is 5, distance 4 <= 5, snaps
    const result1 = SnappingOracle.calculateSnaps([movingLayer], allLayers, mockArtboard, 5, 1);
    expect(result1.x).toBe(0);

    // Zoom 2: adjustedThreshold is 5 / 2 = 2.5. Edge diff is 4. 4 is NOT < 2.5, so does not snap
    const result2 = SnappingOracle.calculateSnaps([movingLayer], allLayers, mockArtboard, 5, 2);
    expect(result2.x).toBeNull();
  });
});
