import { describe, it, expect } from 'vitest';
import { offsetPath, strokeToPath } from '../../geometry/offset';
import { VectorPath } from '../../types';

describe('offsetPath', () => {
  it('returns original path if less than 2 points', () => {
    const path: VectorPath = { points: [{ id: 'p1', x: 0, y: 0, type: 'sharp' }], isClosed: false };
    expect(offsetPath(path, 10)).toEqual(path);
  });

  it('offsets a horizontal line perpendicular to direction', () => {
    const path: VectorPath = {
      points: [
        { id: 'p1', x: 0, y: 0, type: 'sharp' },
        { id: 'p2', x: 100, y: 0, type: 'sharp' },
      ],
      isClosed: false,
    };
    const offset = offsetPath(path, 10);
    expect(offset.points.length).toBe(2);
    // For a line going +X (0,0 -> 100,0), tangent is (1,0), normal is (0,1)
    expect(offset.points[0].y).toBeCloseTo(10, 1);
    expect(offset.points[1].y).toBeCloseTo(10, 1);
  });
});

describe('strokeToPath', () => {
  it('returns original path if fewer than 2 points or zero strokeWidth', () => {
    const path: VectorPath = { points: [{ id: 'p1', x: 0, y: 0, type: 'sharp' }], isClosed: false };
    expect(strokeToPath(path, 10)).toEqual(path);
    const line: VectorPath = {
      points: [
        { id: 'p1', x: 0, y: 0, type: 'sharp' },
        { id: 'p2', x: 10, y: 10, type: 'sharp' },
      ],
      isClosed: false,
    };
    expect(strokeToPath(line, 0)).toEqual(line);
  });

  it('converts a line into a closed 4-point rectangle', () => {
    const path: VectorPath = {
      points: [
        { id: 'p1', x: 0, y: 0, type: 'sharp' },
        { id: 'p2', x: 100, y: 0, type: 'sharp' },
      ],
      isClosed: false,
    };
    const stroked = strokeToPath(path, 20);
    expect(stroked.isClosed).toBe(true);
    expect(stroked.points.length).toBe(4);
  });
});
