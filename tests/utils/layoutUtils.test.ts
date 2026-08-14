import { describe, it, expect } from 'vitest';
import {
  alignLayers,
  distributeLayers,
  tidyUpLayers,
  resolveConstraints,
  resolveSemanticConstraints,
} from '../../utils/layoutUtils';
import type { Layer } from '../../types';

function makeLayer(overrides: Partial<Layer> & { id: string }): Layer {
  return {
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    color: '#000',
    cornerRadius: 0,
    ...overrides,
  } as Layer;
}

const canvasSize = { width: 1000, height: 800 };

describe('layoutUtils', () => {
  describe('alignLayers', () => {
    it('returns empty array if no layers', () => {
      expect(alignLayers([], 'left', canvasSize)).toEqual([]);
    });

    describe('single layer (aligns to canvas)', () => {
      const layers = [makeLayer({ id: '1', x: 50, y: 50, width: 100, height: 100 })];

      it('aligns left', () => {
        const result = alignLayers(layers, 'left', canvasSize);
        expect(result[0].changes).toEqual({ x: 0, y: 50 });
      });

      it('aligns h-center', () => {
        const result = alignLayers(layers, 'h-center', canvasSize);
        expect(result[0].changes).toEqual({ x: 450, y: 50 }); // (1000 - 100) / 2
      });

      it('aligns right', () => {
        const result = alignLayers(layers, 'right', canvasSize);
        expect(result[0].changes).toEqual({ x: 900, y: 50 }); // 1000 - 100
      });

      it('aligns top', () => {
        const result = alignLayers(layers, 'top', canvasSize);
        expect(result[0].changes).toEqual({ x: 50, y: 0 });
      });

      it('aligns v-center', () => {
        const result = alignLayers(layers, 'v-center', canvasSize);
        expect(result[0].changes).toEqual({ x: 50, y: 350 }); // (800 - 100) / 2
      });

      it('aligns bottom', () => {
        const result = alignLayers(layers, 'bottom', canvasSize);
        expect(result[0].changes).toEqual({ x: 50, y: 700 }); // 800 - 100
      });
    });

    describe('multiple layers (aligns to bounding box)', () => {
      const layers = [
        makeLayer({ id: '1', x: 10, y: 10, width: 50, height: 50 }),
        makeLayer({ id: '2', x: 100, y: 100, width: 100, height: 100 }), // bounding box: x: 10 to 200, y: 10 to 200
      ];

      it('aligns left', () => {
        const result = alignLayers(layers, 'left', canvasSize);
        expect(result[0].changes.x).toBe(10);
        expect(result[1].changes.x).toBe(10);
      });

      it('aligns h-center', () => {
        const result = alignLayers(layers, 'h-center', canvasSize);
        // bounding box x is 10, width is 190. Center is 10 + (190 - layerWidth) / 2
        expect(result[0].changes.x).toBe(10 + (190 - 50) / 2); // 80
        expect(result[1].changes.x).toBe(10 + (190 - 100) / 2); // 55
      });

      it('aligns right', () => {
        const result = alignLayers(layers, 'right', canvasSize);
        expect(result[0].changes.x).toBe(200 - 50); // 150
        expect(result[1].changes.x).toBe(200 - 100); // 100
      });

      it('aligns top', () => {
        const result = alignLayers(layers, 'top', canvasSize);
        expect(result[0].changes.y).toBe(10);
        expect(result[1].changes.y).toBe(10);
      });

      it('aligns v-center', () => {
        const result = alignLayers(layers, 'v-center', canvasSize);
        expect(result[0].changes.y).toBe(10 + (190 - 50) / 2); // 80
        expect(result[1].changes.y).toBe(10 + (190 - 100) / 2); // 55
      });

      it('aligns bottom', () => {
        const result = alignLayers(layers, 'bottom', canvasSize);
        expect(result[0].changes.y).toBe(200 - 50); // 150
        expect(result[1].changes.y).toBe(200 - 100); // 100
      });
    });

    describe('multiple layers with forceCanvas=true (aligns to canvas)', () => {
      const layers = [
        makeLayer({ id: '1', x: 10, y: 10, width: 50, height: 50 }),
        makeLayer({ id: '2', x: 100, y: 100, width: 100, height: 100 }),
      ];

      it('aligns left', () => {
        const result = alignLayers(layers, 'left', canvasSize, true);
        expect(result[0].changes.x).toBe(0);
        expect(result[1].changes.x).toBe(0);
      });
    });
  });

  describe('distributeLayers', () => {
    it('returns empty array if less than 3 layers', () => {
      const layers = [makeLayer({ id: '1' }), makeLayer({ id: '2' })];
      expect(distributeLayers(layers, 'h-spacing')).toEqual([]);
    });

    it('distributes h-spacing', () => {
      const layers = [
        makeLayer({ id: '1', x: 0, width: 50 }),
        makeLayer({ id: '2', x: 100, width: 50 }),
        makeLayer({ id: '3', x: 300, width: 50 }), // Span: 0 to 350. Total content width: 150. Gap: (350 - 150) / 2 = 100.
      ];
      const result = distributeLayers(layers, 'h-spacing');
      // middle element should be moved
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
      expect(result[0].changes.x).toBe(150); // 0 + 50 (width) + 100 (gap)
    });

    it('distributes v-spacing', () => {
      const layers = [
        makeLayer({ id: '1', y: 0, height: 50 }),
        makeLayer({ id: '2', y: 100, height: 50 }),
        makeLayer({ id: '3', y: 300, height: 50 }),
      ];
      const result = distributeLayers(layers, 'v-spacing');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
      expect(result[0].changes.y).toBe(150);
    });

    it('distributes h-center', () => {
      const layers = [
        makeLayer({ id: '1', x: 0, width: 100 }), // center 50
        makeLayer({ id: '2', x: 150, width: 100 }), // center 200
        makeLayer({ id: '3', x: 500, width: 100 }), // center 550. Span: 550 - 50 = 500. Interval: 250.
      ];
      const result = distributeLayers(layers, 'h-center');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
      // target center is 50 + 250 = 300. new x = 300 - 50 = 250
      expect(result[0].changes.x).toBe(250);
    });

    it('distributes v-center', () => {
      const layers = [
        makeLayer({ id: '1', y: 0, height: 100 }),
        makeLayer({ id: '2', y: 150, height: 100 }),
        makeLayer({ id: '3', y: 500, height: 100 }),
      ];
      const result = distributeLayers(layers, 'v-center');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
      expect(result[0].changes.y).toBe(250);
    });
  });

  describe('tidyUpLayers', () => {
    it('returns empty array if less than 2 layers', () => {
      expect(tidyUpLayers([makeLayer({ id: '1' })])).toEqual([]);
    });

    it('arranges layers in a grid', () => {
      const layers = [
        makeLayer({ id: '4', x: 300, y: 100, width: 100, height: 100 }),
        makeLayer({ id: '1', x: 0, y: 0, width: 100, height: 100 }),
        makeLayer({ id: '2', x: 200, y: 0, width: 100, height: 100 }),
        makeLayer({ id: '3', x: 0, y: 100, width: 100, height: 100 }),
      ];
      const result = tidyUpLayers(layers);

      expect(result.length).toBe(4);
      // It should sort them by position: 1, 2, 3, 4
      expect(result.map((r) => r.id)).toEqual(['1', '2', '3', '4']);

      // The grid logic depends on aspect ratio and column count.
      // Bounds: x: 0 to 400, y: 0 to 200. width=400, height=200. Aspect ratio = 2.
      // cols = ceil(sqrt(4 * 2)) = ceil(2.82) = 3.
      // 4 layers in 3 cols -> 2 rows.
      expect(result[0].changes.x).toBe(0);
      expect(result[0].changes.y).toBe(0);
      expect(result[1].changes.x).toBeGreaterThan(0);
      expect(result[1].changes.y).toBe(0);
      expect(result[3].changes.x).toBe(0); // Second row starts at colIndex 0
      expect(result[3].changes.y).toBeGreaterThan(0);
    });
  });

  describe('resolveConstraints', () => {
    it('handles defaults when constraints are not provided', () => {
      const result = resolveConstraints({ x: 10, y: 20, width: 50, height: 50 }, canvasSize);
      expect(result).toEqual({ x: 20, y: 20 }); // start defaults to 20
    });

    it('resolves center horizontal and vertical', () => {
      const result = resolveConstraints({
        width: 100,
        height: 100,
        constraints: { horizontal: 'center', vertical: 'center' }
      }, canvasSize);
      expect(result).toEqual({ x: 450, y: 350 });
    });

    it('resolves start and end', () => {
      const result = resolveConstraints({
        width: 100,
        height: 100,
        constraints: { horizontal: 'end', vertical: 'start' }
      }, canvasSize);
      expect(result).toEqual({ x: 880, y: 20 }); // canvas.width - width - 20, 20
    });

    it('resolves scale constraints to canvas size', () => {
      const result = resolveConstraints({
        constraints: { horizontal: 'scale', vertical: 'scale' }
      }, canvasSize);
      expect(result).toEqual({ x: 0, y: 0, width: 1000, height: 800 });
    });
  });

  describe('resolveSemanticConstraints', () => {
    it('maps empty array to start/start', () => {
      expect(resolveSemanticConstraints([])).toEqual({ horizontal: 'start', vertical: 'start' });
    });

    it('maps center-h to horizontal: center', () => {
      expect(resolveSemanticConstraints(['center-h'])).toEqual({ horizontal: 'center', vertical: 'start' });
    });

    it('maps pin-right and pin-bottom to end/end', () => {
      expect(resolveSemanticConstraints(['pin-right', 'pin-bottom'])).toEqual({ horizontal: 'end', vertical: 'end' });
    });

    it('maps fill to scale/scale', () => {
      expect(resolveSemanticConstraints(['fill'])).toEqual({ horizontal: 'scale', vertical: 'scale' });
    });
  });
});
