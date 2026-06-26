import { describe, it, expect } from 'vitest';
import { Point, pointOnCurve, splitCurve, curveLength } from '../../geometry/bezier';

const p0: Point = { x: 0, y: 0 };
const p1: Point = { x: 10, y: 20 };
const p2: Point = { x: 30, y: 20 };
const p3: Point = { x: 40, y: 0 };

describe('pointOnCurve', () => {
  it('returns p0 at t=0', () => {
    const pt = pointOnCurve(p0, p1, p2, p3, 0);
    expect(pt).toEqual({ x: p0.x, y: p0.y });
  });

  it('returns p3 at t=1', () => {
    const pt = pointOnCurve(p0, p1, p2, p3, 1);
    expect(pt).toEqual({ x: p3.x, y: p3.y });
  });

  it('returns a valid midpoint at t=0.5', () => {
    const pt = pointOnCurve(p0, p1, p2, p3, 0.5);
    expect(pt.x).toBeGreaterThan(p0.x);
    expect(pt.x).toBeLessThan(p3.x);
  });

  it('handles straight line (collinear control points)', () => {
    const a: Point = { x: 0, y: 0 }, b: Point = { x: 5, y: 5 };
    const c: Point = { x: 10, y: 10 }, d: Point = { x: 15, y: 15 };
    expect(pointOnCurve(a, b, c, d, 0.5)).toEqual({ x: 7.5, y: 7.5 });
  });
});

describe('splitCurve', () => {
  it('returns 8 points (2 curves)', () => {
    expect(splitCurve(p0, p1, p2, p3, 0.5).length).toBe(8);
  });

  it('first curve starts at p0, second ends at p3', () => {
    const r = splitCurve(p0, p1, p2, p3, 0.5);
    expect(r[0]).toEqual(p0);
    expect(r[7]).toEqual(p3);
  });

  it('split point is shared', () => {
    const r = splitCurve(p0, p1, p2, p3, 0.5);
    expect(r[3]).toEqual(r[4]);
  });

  it('split at t=0 yields degenerate first curve', () => {
    const r = splitCurve(p0, p1, p2, p3, 0);
    expect(r[0]).toEqual(p0);
    expect(r[3]).toEqual(p0);
  });
});

describe('curveLength', () => {
  it('returns > 0 for non-trivial curve', () => {
    expect(curveLength(p0, p1, p2, p3)).toBeGreaterThan(0);
  });

  it('matches straight-line distance for collinear points', () => {
    const a: Point = { x: 0, y: 0 }, b: Point = { x: 5, y: 0 };
    const c: Point = { x: 10, y: 0 }, d: Point = { x: 15, y: 0 };
    expect(curveLength(a, b, c, d)).toBeCloseTo(15, 0);
  });

  it('returns 0 for zero-length curve', () => {
    const z: Point = { x: 5, y: 5 };
    expect(curveLength(z, z, z, z)).toBeCloseTo(0);
  });

  it('curved path > straight distance', () => {
    const straight = Math.hypot(p3.x - p0.x, p3.y - p0.y);
    expect(curveLength(p0, p1, p2, p3)).toBeGreaterThan(straight);
  });
});
