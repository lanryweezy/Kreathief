import { describe, it, expect } from 'vitest';
import { MatrixMath } from '../../../utils/matrixMath';

describe('MatrixMath', () => {
  describe('multiply', () => {
    it('returns the product of two matrices when multiplied', () => {
      const m1 = [1, 0, 0, 1, 10, 20];
      const m2 = [2, 0, 0, 2, 5, 5];

      const result = MatrixMath.multiply(m1, m2);

      expect(result).toEqual([2, 0, 0, 2, 15, 25]);
    });
  });

  describe('rotate', () => {
    it('returns a correct rotation matrix when given degrees', () => {
      const degrees = 90;

      const result = MatrixMath.rotate(degrees);

      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(1);
      expect(result[2]).toBeCloseTo(-1);
      expect(result[3]).toBeCloseTo(0);
      expect(result[4]).toBe(0);
      expect(result[5]).toBe(0);
    });
  });

  describe('scale', () => {
    it('returns a scaling matrix when given x and y scale factors', () => {
      const sx = 2;
      const sy = 3;

      const result = MatrixMath.scale(sx, sy);

      expect(result).toEqual([2, 0, 0, 3, 0, 0]);
    });
  });

  describe('translate', () => {
    it('returns a translation matrix when given x and y translation values', () => {
      const tx = 15;
      const ty = 25;

      const result = MatrixMath.translate(tx, ty);

      expect(result).toEqual([1, 0, 0, 1, 15, 25]);
    });
  });

  describe('transformPoint', () => {
    it('returns a transformed point when given a point and a transformation matrix', () => {
      const point = { x: 10, y: 20 };
      const matrix = [2, 0, 0, 2, 5, 10];

      const result = MatrixMath.transformPoint(point, matrix);

      expect(result).toEqual({ x: 25, y: 50 });
    });
  });
});
