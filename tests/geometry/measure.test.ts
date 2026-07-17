import { describe, it, expect } from 'vitest';
import { Point } from '../../geometry/bezier';
import { pathLength, bezierPathLength, pathArea, centroid, Segment } from '../../geometry/measure';

describe('pathLength', () => {
  it('straight line = euclidean distance', () => {
    expect(
      pathLength([
        {
          points: [
            { x: 0, y: 0 },
            { x: 3, y: 4 },
          ],
        },
      ])
    ).toBeCloseTo(5);
  });

  it('single-point segment = 0', () => {
    expect(pathLength([{ points: [{ x: 5, y: 5 }] }])).toBe(0);
  });

  it('sums multiple segments', () => {
    const segs: Segment[] = [
      {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      },
      {
        points: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
        ],
      },
    ];
    expect(pathLength(segs)).toBeCloseTo(2);
  });

  it('closed segment adds closing distance', () => {
    const seg: Segment = {
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 4 },
      ],
      closed: true,
    };
    expect(pathLength([seg])).toBeCloseTo(3 + 4 + 5);
  });
});

describe('bezierPathLength', () => {
  it('fewer than 2 points → 0', () => expect(bezierPathLength([{ x: 0, y: 0 }])).toBe(0));

  it('2 points → euclidean distance', () => {
    expect(
      bezierPathLength([
        { x: 0, y: 0 },
        { x: 3, y: 4 },
      ])
    ).toBeCloseTo(5, 0);
  });

  it('closed > open path', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 4 },
    ];
    expect(bezierPathLength(pts, true)).toBeGreaterThan(bezierPathLength(pts, false));
  });
});

describe('pathArea', () => {
  it('fewer than 3 points → 0', () => {
    expect(
      pathArea([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ])
    ).toBe(0);
  });

  it('square area', () => {
    expect(
      pathArea([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 4 },
        { x: 0, y: 4 },
      ])
    ).toBeCloseTo(16);
  });

  it('triangle (shoelace)', () => {
    expect(
      pathArea([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 0, y: 3 },
      ])
    ).toBeCloseTo(6);
  });

  it('positive regardless of winding', () => {
    expect(
      pathArea([
        { x: 0, y: 0 },
        { x: 0, y: 4 },
        { x: 4, y: 4 },
        { x: 4, y: 0 },
      ])
    ).toBeCloseTo(16);
  });
});

describe('centroid', () => {
  it('empty → (0,0)', () => expect(centroid([])).toEqual({ x: 0, y: 0 }));
  it('single point → that point', () => expect(centroid([{ x: 3, y: 7 }])).toEqual({ x: 3, y: 7 }));
  it('symmetric shape → center', () => {
    const c = centroid([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ]);
    expect(c).toEqual({ x: 2, y: 2 });
  });
});
