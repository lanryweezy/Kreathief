import { describe, it, expect } from 'vitest';
import { Point } from '../../geometry/bezier';
import { lineLineIntersect, curveLineIntersect } from '../../geometry/intersections';

describe('lineLineIntersect', () => {
  it('crossing lines → intersection point', () => {
    const hit = lineLineIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 });
    expect(hit).not.toBeNull();
    expect(hit!.x).toBeCloseTo(5);
    expect(hit!.y).toBeCloseTo(5);
  });

  it('parallel lines → null', () => {
    expect(lineLineIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBeNull();
  });

  it('collinear lines → null', () => {
    expect(lineLineIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, { x: 15, y: 0 })).toBeNull();
  });

  it('intersection outside segment bounds → null', () => {
    expect(lineLineIntersect({ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 5, y: 0 }, { x: 5, y: 10 })).toBeNull();
  });

  it('shared endpoint → intersection', () => {
    const hit = lineLineIntersect({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 5, y: 5 }, { x: 10, y: 0 });
    expect(hit).not.toBeNull();
    expect(hit!.x).toBeCloseTo(5);
  });
});

describe('curveLineIntersect', () => {
  const curve = { p0: { x: 0, y: 0 }, p1: { x: 10, y: 30 }, p2: { x: 30, y: 30 }, p3: { x: 40, y: 0 } };

  it('returns hits where curve crosses horizontal line', () => {
    const hits = curveLineIntersect(curve.p0, curve.p1, curve.p2, curve.p3, { x: 0, y: 15 }, { x: 40, y: 15 });
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty when line is below curve', () => {
    const hits = curveLineIntersect(curve.p0, curve.p1, curve.p2, curve.p3, { x: 0, y: -10 }, { x: 40, y: -10 });
    expect(hits.length).toBe(0);
  });

  it('hit points lie on the line', () => {
    const hits = curveLineIntersect(curve.p0, curve.p1, curve.p2, curve.p3, { x: 0, y: 25 }, { x: 40, y: 25 });
    for (const h of hits) expect(h.y).toBeCloseTo(25, 0);
  });
});
