import { describe, it, expect } from 'vitest';
import { MatrixMath } from '../../../services/MatrixMath';

describe('MatrixMath', () => {
  describe('multiply', () => {
    it('returns the product of two matrices when multiplied', () => {
      const m1 = { a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 };
      const m2 = { a: 2, b: 0, c: 0, d: 2, e: 5, f: 5 };

      const result = MatrixMath.multiply(m1, m2);

      expect(result).toEqual({ a: 2, b: 0, c: 0, d: 2, e: 15, f: 25 });
    });
  });

  describe('rotate', () => {
    it('returns a correct rotation matrix when given radians', () => {
      const angleRad = (90 * Math.PI) / 180;

      const result = MatrixMath.rotate(MatrixMath.identity(), angleRad);

      expect(result.a).toBeCloseTo(0);
      expect(result.b).toBeCloseTo(1);
      expect(result.c).toBeCloseTo(-1);
      expect(result.d).toBeCloseTo(0);
      expect(result.e).toBe(0);
      expect(result.f).toBe(0);
    });
  });

  describe('scale', () => {
    it('returns a scaling matrix when given x and y scale factors', () => {
      const sx = 2;
      const sy = 3;

      const result = MatrixMath.scale(MatrixMath.identity(), sx, sy);

      expect(result).toEqual({ a: 2, b: 0, c: 0, d: 3, e: 0, f: 0 });
    });
  });

  describe('translate', () => {
    it('returns a translation matrix when given x and y translation values', () => {
      const tx = 15;
      const ty = 25;

      const result = MatrixMath.translate(MatrixMath.identity(), tx, ty);

      expect(result).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 15, f: 25 });
    });
  });

  describe('applyToPoint', () => {
    it('returns a transformed point when given a point and a transformation matrix', () => {
      const m = { a: 2, b: 0, c: 0, d: 2, e: 5, f: 10 };

      const result = MatrixMath.applyToPoint(m, 10, 20);

      expect(result).toEqual({ x: 25, y: 50 });
    });
  });
});
