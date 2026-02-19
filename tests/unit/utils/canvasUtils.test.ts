import { describe, it, expect } from 'vitest';
import {
  buildFilterString,
  isTextLayer,
  isShapeLayer,
  isImageLayer,
  generateLayerId,
  cloneLayer,
  getLayersBoundingBox,
  isValidLayer,
} from '../../../utils/canvasUtils';
import { CanvasFilters } from '../../../types';

describe('canvasUtils', () => {
  describe('buildFilterString', () => {
    it('should return none when all filters are default', () => {
      const filters: CanvasFilters = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hueRotate: 0,
        opacity: 1,
        vignette: 0,
      };
      expect(buildFilterString(filters)).toBe('none');
    });

    it('should build a filter string for non-default values', () => {
      const filters: CanvasFilters = {
        brightness: 120,
        contrast: 80,
        saturation: 100,
        grayscale: 50,
        sepia: 0,
        blur: 5,
        hueRotate: 90,
        opacity: 1,
        vignette: 0,
      };
      const result = buildFilterString(filters);
      expect(result).toContain('brightness(120%)');
      expect(result).toContain('contrast(80%)');
      expect(result).toContain('grayscale(50%)');
      expect(result).toContain('blur(5px)');
      expect(result).toContain('hue-rotate(90deg)');
    });
  });

  describe('layer type guards', () => {
    const textLayer = { type: 'text' } as any;
    const shapeLayer = { type: 'rectangle' } as any;
    const imageLayer = { type: 'image' } as any;

    it('should identify text layers', () => {
      expect(isTextLayer(textLayer)).toBe(true);
      expect(isTextLayer(shapeLayer)).toBe(false);
    });

    it('should identify shape layers', () => {
      expect(isShapeLayer(shapeLayer)).toBe(true);
      expect(isShapeLayer(textLayer)).toBe(false);
    });

    it('should identify image layers', () => {
      expect(isImageLayer(imageLayer)).toBe(true);
      expect(isImageLayer(textLayer)).toBe(false);
    });
  });

  describe('generateLayerId', () => {
    it('should generate a unique id with the given prefix', () => {
      const id = generateLayerId('test');
      expect(id).toMatch(/^test_\d+_[a-z0-9]+$/);
    });
  });

  describe('cloneLayer', () => {
    it('should clone a layer with a new id and offset position', () => {
      const layer: any = {
        id: '1',
        type: 'rectangle',
        x: 100,
        y: 100,
        name: 'Original',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      };
      const cloned = cloneLayer(layer, 50);
      expect(cloned.id).not.toBe(layer.id);
      expect(cloned.x).toBe(150);
      expect(cloned.y).toBe(150);
      expect(cloned.name).toBe('Original Copy');
    });
  });

  describe('getLayersBoundingBox', () => {
    it('should calculate the bounding box of multiple layers', () => {
      const layers: any[] = [
        { x: 10, y: 10, width: 100, height: 100 },
        { x: 50, y: 50, width: 200, height: 50 },
      ];
      const box = getLayersBoundingBox(layers);
      expect(box.x).toBe(10);
      expect(box.y).toBe(10);
      expect(box.width).toBe(240); // 250 - 10
      expect(box.height).toBe(100); // 110 - 10
    });

    it('should return zeros for empty array', () => {
      expect(getLayersBoundingBox([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });

  describe('isValidLayer', () => {
    it('should return true for valid layers', () => {
      const layer = {
        id: '1',
        type: 'text',
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      };
      expect(isValidLayer(layer)).toBe(true);
    });

    it('should return false for invalid layers', () => {
      expect(isValidLayer(null)).toBe(false);
      expect(isValidLayer({})).toBe(false);
      expect(isValidLayer({ id: '1' })).toBe(false);
    });
  });
});
