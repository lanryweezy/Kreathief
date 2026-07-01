import { describe, it, expect } from 'vitest';
import { alignLayers } from '../../../utils/layoutUtils';
import type { Layer, ShapeLayer } from '../../../types';

const createLayer = (id: string, x: number, y: number, width: number, height: number): Layer => {
  return {
    id,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    color: '#000',
    cornerRadius: 0
  } as ShapeLayer;
};

describe('alignLayers', () => {
  it('returns an empty array when no layers are provided', () => {
    const result = alignLayers([], 'left', { width: 1000, height: 1000 });

    expect(result).toEqual([]);
  });

  describe('alignment to canvas (single layer or forceCanvas)', () => {
    const canvasSize = { width: 1000, height: 1000 };

    it('aligns a single layer to the left edge of the canvas', () => {
      const layers = [createLayer('1', 100, 100, 200, 100)];

      const result = alignLayers(layers, 'left', canvasSize);

      expect(result).toEqual([{ id: '1', changes: { x: 0, y: 100 } }]);
    });

    it('aligns a single layer to the horizontal center of the canvas', () => {
      const layers = [createLayer('1', 100, 100, 200, 100)];

      const result = alignLayers(layers, 'h-center', canvasSize);

      expect(result).toEqual([{ id: '1', changes: { x: 400, y: 100 } }]);
    });

    it('aligns a single layer to the right edge of the canvas', () => {
      const layers = [createLayer('1', 100, 100, 200, 100)];

      const result = alignLayers(layers, 'right', canvasSize);

      expect(result).toEqual([{ id: '1', changes: { x: 800, y: 100 } }]);
    });

    it('aligns a single layer to the top edge of the canvas', () => {
      const layers = [createLayer('1', 100, 100, 200, 100)];

      const result = alignLayers(layers, 'top', canvasSize);

      expect(result).toEqual([{ id: '1', changes: { x: 100, y: 0 } }]);
    });

    it('aligns a single layer to the vertical center of the canvas', () => {
      const layers = [createLayer('1', 100, 100, 200, 100)];

      const result = alignLayers(layers, 'v-center', canvasSize);

      expect(result).toEqual([{ id: '1', changes: { x: 100, y: 450 } }]);
    });

    it('aligns a single layer to the bottom edge of the canvas', () => {
      const layers = [createLayer('1', 100, 100, 200, 100)];

      const result = alignLayers(layers, 'bottom', canvasSize);

      expect(result).toEqual([{ id: '1', changes: { x: 100, y: 900 } }]);
    });

    it('aligns multiple layers to the canvas when forceCanvas is set to true', () => {
      const layers = [
        createLayer('1', 10, 10, 50, 50),
        createLayer('2', 50, 50, 100, 100)
      ];

      const result = alignLayers(layers, 'left', canvasSize, true);

      expect(result).toEqual([
        { id: '1', changes: { x: 0, y: 10 } },
        { id: '2', changes: { x: 0, y: 50 } }
      ]);
    });
  });

  describe('alignment to selection bounds (multiple layers)', () => {
    const canvasSize = { width: 1000, height: 1000 };
    const layers = [
      createLayer('1', 100, 100, 100, 100),
      createLayer('2', 300, 200, 200, 50),
      createLayer('3', 150, 300, 50, 200) // bounds: x: 100-500, y: 100-500 (w: 400, h: 400)
    ];

    it('aligns multiple layers to the left edge of their bounding box', () => {
      const result = alignLayers(layers, 'left', canvasSize);

      expect(result).toEqual([
        { id: '1', changes: { x: 100, y: 100 } },
        { id: '2', changes: { x: 100, y: 200 } },
        { id: '3', changes: { x: 100, y: 300 } }
      ]);
    });

    it('aligns multiple layers to the horizontal center of their bounding box', () => {
      const result = alignLayers(layers, 'h-center', canvasSize);

      expect(result).toEqual([
        { id: '1', changes: { x: 250, y: 100 } },
        { id: '2', changes: { x: 200, y: 200 } },
        { id: '3', changes: { x: 275, y: 300 } }
      ]);
    });

    it('aligns multiple layers to the right edge of their bounding box', () => {
      const result = alignLayers(layers, 'right', canvasSize);

      expect(result).toEqual([
        { id: '1', changes: { x: 400, y: 100 } },
        { id: '2', changes: { x: 300, y: 200 } },
        { id: '3', changes: { x: 450, y: 300 } }
      ]);
    });

    it('aligns multiple layers to the top edge of their bounding box', () => {
      const result = alignLayers(layers, 'top', canvasSize);

      expect(result).toEqual([
        { id: '1', changes: { x: 100, y: 100 } },
        { id: '2', changes: { x: 300, y: 100 } },
        { id: '3', changes: { x: 150, y: 100 } }
      ]);
    });

    it('aligns multiple layers to the vertical center of their bounding box', () => {
      const result = alignLayers(layers, 'v-center', canvasSize);

      expect(result).toEqual([
        { id: '1', changes: { x: 100, y: 250 } },
        { id: '2', changes: { x: 300, y: 275 } },
        { id: '3', changes: { x: 150, y: 200 } }
      ]);
    });

    it('aligns multiple layers to the bottom edge of their bounding box', () => {
      const result = alignLayers(layers, 'bottom', canvasSize);

      expect(result).toEqual([
        { id: '1', changes: { x: 100, y: 400 } },
        { id: '2', changes: { x: 300, y: 450 } },
        { id: '3', changes: { x: 150, y: 300 } }
      ]);
    });
  });
});
