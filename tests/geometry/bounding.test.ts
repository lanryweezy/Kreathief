import { describe, it, expect } from 'vitest';
import { Point } from '../../geometry/bezier';
import { boundingBox, boundingBoxUnion, pointInBox, boxesOverlap, boxContains, BBox } from '../../geometry/bounding';

describe('boundingBox', () => {
  it('empty → zero-size box', () => {
    expect(boundingBox([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('single point → zero-size box at that point', () => {
    expect(boundingBox([{ x: 5, y: 10 }])).toEqual({ x: 5, y: 10, width: 0, height: 0 });
  });

  it('multiple points → correct min/max', () => {
    const box = boundingBox([{ x: 1, y: 2 }, { x: 5, y: 8 }, { x: -3, y: 0 }]);
    expect(box).toEqual({ x: -3, y: 0, width: 8, height: 8 });
  });
});

describe('boundingBoxUnion', () => {
  it('combines non-overlapping boxes', () => {
    const u = boundingBoxUnion({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 });
    expect(u).toEqual({ x: 0, y: 0, width: 30, height: 30 });
  });

  it('returns outer when one contains the other', () => {
    const outer: BBox = { x: 0, y: 0, width: 20, height: 20 };
    expect(boundingBoxUnion(outer, { x: 5, y: 5, width: 5, height: 5 })).toEqual(outer);
  });
});

describe('pointInBox', () => {
  const box: BBox = { x: 0, y: 0, width: 10, height: 10 };
  it('inside → true', () => expect(pointInBox({ x: 5, y: 5 }, box)).toBe(true));
  it('outside → false', () => expect(pointInBox({ x: 15, y: 15 }, box)).toBe(false));
  it('on edge → true', () => expect(pointInBox({ x: 0, y: 0 }, box)).toBe(true));
  it('padding extends range', () => {
    expect(pointInBox({ x: -5, y: 5 }, box, 6)).toBe(true);
    expect(pointInBox({ x: -5, y: 5 }, box, 4)).toBe(false);
  });
});

describe('boxesOverlap', () => {
  it('overlapping → true', () => {
    expect(boxesOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
  });
  it('separated → false', () => {
    expect(boxesOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 })).toBe(false);
  });
  it('touching edges → false', () => {
    expect(boxesOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });
});

describe('boxContains', () => {
  it('outer contains inner → true', () => {
    expect(boxContains({ x: 0, y: 0, width: 20, height: 20 }, { x: 5, y: 5, width: 5, height: 5 })).toBe(true);
  });
  it('inner extends beyond → false', () => {
    expect(boxContains({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(false);
  });
  it('equal boxes → true', () => {
    const b: BBox = { x: 0, y: 0, width: 10, height: 10 };
    expect(boxContains(b, b)).toBe(true);
  });
});
