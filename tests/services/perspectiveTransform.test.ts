import { describe, it, expect } from 'vitest';
import { lerpPoint, Point } from '../../services/perspectiveTransform';

describe('lerpPoint', () => {
  it('should interpolate correctly at t=0', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 10, y: 10 };
    const result = lerpPoint(p1, p2, 0);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('should interpolate correctly at t=1', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 10, y: 10 };
    const result = lerpPoint(p1, p2, 1);
    expect(result).toEqual({ x: 10, y: 10 });
  });

  it('should interpolate correctly at t=0.5', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 10, y: 10 };
    const result = lerpPoint(p1, p2, 0.5);
    expect(result).toEqual({ x: 5, y: 5 });
  });

  it('should handle negative coordinates', () => {
    const p1: Point = { x: -10, y: -20 };
    const p2: Point = { x: 10, y: 20 };
    const result = lerpPoint(p1, p2, 0.5);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('should extrapolate for t > 1', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 10, y: 10 };
    const result = lerpPoint(p1, p2, 2);
    expect(result).toEqual({ x: 20, y: 20 });
  });

  it('should extrapolate for t < 0', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 10, y: 10 };
    const result = lerpPoint(p1, p2, -1);
    expect(result).toEqual({ x: -10, y: -10 });
  });

  it('should handle identical points', () => {
    const p1: Point = { x: 5, y: 5 };
    const p2: Point = { x: 5, y: 5 };
    const result = lerpPoint(p1, p2, 0.7);
    expect(result).toEqual({ x: 5, y: 5 });
  });

  it('should handle floating point coordinates', () => {
    const p1: Point = { x: 1.5, y: 2.5 };
    const p2: Point = { x: 4.5, y: 8.5 };
    const result = lerpPoint(p1, p2, 0.5);
    expect(result).toEqual({ x: 3.0, y: 5.5 });
  });
});
