import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeometryOracle } from '../../utils/geometryOracle';
import { Layer, TextLayer, ShapeLayer } from '../../types';

describe('GeometryOracle', () => {
  describe('measureText', () => {
    it('returns basic text metrics based on jsdom canvas or fallbacks', () => {
      const layer = {
        type: 'text',
        text: 'Hello World',
        fontSize: 20,
        fontFamily: 'Arial',
        fontStyle: 'normal',
        fontWeight: 'normal',
        width: 100,
        height: 20,
      } as TextLayer;

      const result = GeometryOracle.measureText(layer);

      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('ascent');
      expect(result).toHaveProperty('descent');

      expect(result.height).toBeCloseTo(result.ascent + result.descent);
    });
  });

  describe('measurePath', () => {
    let mockPath: any;

    beforeEach(() => {
      mockPath = {
        setAttribute: vi.fn(),
        getTotalLength: vi.fn().mockReturnValue(100),
        getPointAtLength: vi.fn((dist) => ({ x: dist, y: dist })),
      };

      vi.spyOn(document, 'createElementNS').mockReturnValue(mockPath as any);

      // Reset the SVGPathElement cached in GeometryOracle
      (GeometryOracle as any).svgPath = null;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('measures path and provides point at distance', () => {
      const result = GeometryOracle.measurePath('M 0 0 L 100 100');

      expect(result.totalLength).toBe(100);
      expect(mockPath.getTotalLength).toHaveBeenCalled();

      const point = result.getPointAt(50);
      expect(point.x).toBe(50);
      expect(point.y).toBe(50);
      expect(point).toHaveProperty('angle');
    });

    it('samples angles correctly at distance', () => {
      const result = GeometryOracle.measurePath('M 0 0 L 100 100');

      let point = result.getPointAt(50);
      expect(point).toBeDefined();

      point = result.getPointAt(100);
      expect(point).toBeDefined();

      point = result.getPointAt(0);
      expect(point).toBeDefined();
    });

    it('handles invalid path data gracefully', () => {
      mockPath.getTotalLength = vi.fn().mockImplementation(() => {
        throw new Error('Invalid path');
      });

      const result = GeometryOracle.measurePath('INVALID PATH');

      expect(result.totalLength).toBe(0);
      const point = result.getPointAt(50);
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });
  });

  describe('getTransformationBounds', () => {
    it('calculates bounds for an unrotated layer', () => {
      const layer = {
        type: 'shape',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
      } as ShapeLayer;

      const bounds = GeometryOracle.getTransformationBounds(layer);

      expect(bounds.x).toBeCloseTo(10);
      expect(bounds.y).toBeCloseTo(20);
      expect(bounds.width).toBeCloseTo(100);
      expect(bounds.height).toBeCloseTo(50);
    });

    it('calculates bounds for a layer rotated 90 degrees', () => {
      const layer = {
        type: 'shape',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 90,
      } as ShapeLayer;

      const bounds = GeometryOracle.getTransformationBounds(layer);

      expect(bounds.width).toBeCloseTo(50);
      expect(bounds.height).toBeCloseTo(100);

      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      expect(centerX).toBeCloseTo(10 + 100 / 2);
      expect(centerY).toBeCloseTo(20 + 50 / 2);
    });

    it('calculates bounds for a layer with skew', () => {
      const layer = {
        type: 'shape',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        skewX: 45,
      } as unknown as ShapeLayer;

      const bounds = GeometryOracle.getTransformationBounds(layer);

      expect(bounds.width).toBeGreaterThan(100);
    });

    it('uses fontSize as height for text layers without height', () => {
      const layer = {
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        rotation: 0,
        fontSize: 30,
      } as unknown as TextLayer;

      const bounds = GeometryOracle.getTransformationBounds(layer);

      expect(bounds.height).toBeCloseTo(30);
    });
  });

  describe('getGroupBounds', () => {
    it('returns 0 bounds for empty array', () => {
      const bounds = GeometryOracle.getGroupBounds([]);
      expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('calculates combined bounds for multiple layers', () => {
      const layer1 = { type: 'shape', x: 10, y: 10, width: 50, height: 50, rotation: 0 } as ShapeLayer;
      const layer2 = { type: 'shape', x: 40, y: 50, width: 50, height: 50, rotation: 0 } as ShapeLayer;

      const bounds = GeometryOracle.getGroupBounds([layer1, layer2]);

      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(10);
      expect(bounds.width).toBe(80);
      expect(bounds.height).toBe(90);
    });
  });
});
