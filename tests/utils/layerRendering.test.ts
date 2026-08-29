import { describe, it, expect, vi } from 'vitest';
import {
  getAnimationStyle,
  getLayerClipPath,
  getShapeDefaultColor,
  getLayerAspectRatio,
  isPointInLayer,
  getLayerVisibleBounds,
  applyShapePolygonToContext,
} from '../../utils/layerRendering';
import { Layer, ShapeLayer, AnimationSettings } from '../../types';

describe('layerRendering', () => {
  describe('getAnimationStyle', () => {
    it('returns empty object when animation settings are undefined', () => {
      expect(getAnimationStyle(undefined)).toEqual({});
    });

    it('returns empty object when animation type is "none"', () => {
      expect(getAnimationStyle({ type: 'none', duration: 1, delay: 0, easing: 'linear', iterationCount: 1 })).toEqual(
        {}
      );
    });

    it('returns animation styles correctly for valid settings', () => {
      const anim: AnimationSettings = {
        type: 'fade-in',
        duration: 2.5,
        delay: 0.5,
        easing: 'ease-in-out',
        iterationCount: 3,
      };

      expect(getAnimationStyle(anim)).toEqual({
        animationName: 'fade-in',
        animationDuration: '2.5s',
        animationDelay: '0.5s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 3,
        animationFillMode: 'both',
      });
    });

    it('handles infinite iteration count', () => {
      const anim: AnimationSettings = {
        type: 'slide-in',
        duration: 1,
        delay: 0,
        easing: 'linear',
        iterationCount: 'infinite',
      };

      expect(getAnimationStyle(anim)).toEqual({
        animationName: 'slide-in',
        animationDuration: '1s',
        animationDelay: '0s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationFillMode: 'both',
      });
    });
  });

  describe('getLayerClipPath', () => {
    it('returns path from shapeLayer when type is "path" and pathData exists', () => {
      const layer = { type: 'path', pathData: 'M0,0 L10,10 Z' } as ShapeLayer;
      expect(getLayerClipPath(layer)).toBe("path('M0,0 L10,10 Z')");
    });

    it('returns undefined when type is "path" but pathData is missing', () => {
      const layer = { type: 'path' } as ShapeLayer;
      expect(getLayerClipPath(layer)).toBeUndefined();
    });

    it('returns predefined shape definition when type is a known shape', () => {
      const layer = { type: 'triangle' } as Layer;
      expect(getLayerClipPath(layer)).toBe('polygon(50% 0%, 0% 100%, 100% 100%)');
    });

    it('returns undefined for unknown shape types', () => {
      const layer = { type: 'unknown_shape' } as unknown as Layer;
      expect(getLayerClipPath(layer)).toBeUndefined();
    });
  });

  describe('getShapeDefaultColor', () => {
    it('returns default color for a known shape type', () => {
      expect(getShapeDefaultColor('triangle')).toBe('#6366f1');
    });

    it('returns fallback color for unknown shape types', () => {
      expect(getShapeDefaultColor('unknown_shape' as any)).toBe('#00c4cc');
    });
  });

  describe('getLayerAspectRatio', () => {
    it('returns 1 if width or height are missing from layer', () => {
      expect(getLayerAspectRatio({ type: 'text' } as any)).toBe(1);
    });

    it('returns 1 if height is 0', () => {
      expect(getLayerAspectRatio({ width: 100, height: 0 } as any)).toBe(1);
    });

    it('returns calculated aspect ratio (width / height)', () => {
      expect(getLayerAspectRatio({ width: 160, height: 90 } as any)).toBe(160 / 90);
      expect(getLayerAspectRatio({ width: 100, height: 100 } as any)).toBe(1);
    });
  });

  describe('isPointInLayer', () => {
    it('returns false if layer does not have width or height', () => {
      expect(isPointInLayer(5, 5, { type: 'text', x: 0, y: 0 } as any)).toBe(false);
    });

    it('returns true when point is inside the layer bounds', () => {
      const layer = { x: 10, y: 20, width: 50, height: 30 } as any;
      expect(isPointInLayer(10, 20, layer)).toBe(true); // top-left
      expect(isPointInLayer(60, 50, layer)).toBe(true); // bottom-right
      expect(isPointInLayer(35, 35, layer)).toBe(true); // center
    });

    it('returns false when point is outside the layer bounds', () => {
      const layer = { x: 10, y: 20, width: 50, height: 30 } as any;
      expect(isPointInLayer(9, 20, layer)).toBe(false); // left
      expect(isPointInLayer(61, 20, layer)).toBe(false); // right
      expect(isPointInLayer(10, 19, layer)).toBe(false); // top
      expect(isPointInLayer(10, 51, layer)).toBe(false); // bottom
    });
  });

  describe('getLayerVisibleBounds', () => {
    it('returns bounds correctly ignoring rotation', () => {
      const layer = { x: 15, y: 25, width: 100, height: 200 } as any;
      expect(getLayerVisibleBounds(layer)).toEqual({
        x: 15,
        y: 25,
        width: 100,
        height: 200,
      });
    });

    it('handles missing width and height by defaulting to 0', () => {
      const layer = { x: 15, y: 25 } as any;
      expect(getLayerVisibleBounds(layer)).toEqual({
        x: 15,
        y: 25,
        width: 0,
        height: 0,
      });
    });
  });

  describe('applyShapePolygonToContext', () => {
    it('returns false if definition is missing or invalid', () => {
      const ctx = { beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn() } as any;
      expect(applyShapePolygonToContext(ctx, '', 100, 100)).toBe(false);
      expect(applyShapePolygonToContext(ctx, 'circle(50%)', 100, 100)).toBe(false);
    });

    it('returns false if no points can be parsed', () => {
      const ctx = { beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn() } as any;
      expect(applyShapePolygonToContext(ctx, 'polygon(invalid format)', 100, 100)).toBe(false);
    });

    it('draws polygon path correctly on canvas context', () => {
      const ctx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
      } as any;

      // A simple 3-point polygon (e.g. triangle)
      const def = 'polygon(50% 0%, 0% 100%, 100% 100%)';
      const width = 100;
      const height = 100;

      const result = applyShapePolygonToContext(ctx, def, width, height);

      expect(result).toBe(true);
      expect(ctx.beginPath).toHaveBeenCalledOnce();

      // hw = 50, hh = 50
      // 1st point: 50% of 100 = 50. x = 50 - 50 = 0. y = 0 - 50 = -50.
      expect(ctx.moveTo).toHaveBeenCalledWith(0, -50);

      // 2nd point: 0% of 100 = 0. x = 0 - 50 = -50. y = 100 - 50 = 50.
      expect(ctx.lineTo).toHaveBeenCalledWith(-50, 50);

      // 3rd point: 100% of 100 = 100. x = 100 - 50 = 50. y = 100 - 50 = 50.
      expect(ctx.lineTo).toHaveBeenCalledWith(50, 50);

      expect(ctx.closePath).toHaveBeenCalledOnce();
    });
  });
});
