import { describe, it, expect } from 'vitest';
import {
  simplifyPath,
  smoothPath,
  flattenPath,
  reversePath,
  splitPath,
  removeSmallSegments,
} from '../../geometry/simplify';
import { VectorPath } from '../../types';

describe('simplifyPath', () => {
  it('returns original path if less than 3 points', () => {
    const path: VectorPath = {
      points: [
        { id: 'p1', x: 0, y: 0, type: 'sharp' },
        { id: 'p2', x: 10, y: 10, type: 'sharp' },
      ],
      isClosed: false,
    };
    expect(simplifyPath(path)).toEqual(path);
  });
});

describe('flattenPath', () => {
  it('removes all handles and sets type to sharp', () => {
    const path: VectorPath = {
      points: [
        {
          id: 'p1',
          x: 0,
          y: 0,
          type: 'smooth',
          handleIn: { x: -5, y: -5 },
          handleOut: { x: 5, y: 5 },
        },
        {
          id: 'p2',
          x: 50,
          y: 50,
          type: 'smooth',
          handleIn: { x: -10, y: 0 },
        },
      ],
      isClosed: false,
    };
    const flat = flattenPath(path);
    expect(flat.points[0].handleIn).toBeUndefined();
    expect(flat.points[0].handleOut).toBeUndefined();
    expect(flat.points[0].type).toBe('sharp');
    expect(flat.points[1].handleIn).toBeUndefined();
  });
});

describe('reversePath', () => {
  it('reverses order of points and swaps handleIn and handleOut', () => {
    const path: VectorPath = {
      points: [
        { id: 'p1', x: 0, y: 0, type: 'smooth', handleIn: { x: -2, y: -2 }, handleOut: { x: 3, y: 3 } },
        { id: 'p2', x: 100, y: 100, type: 'sharp' },
      ],
      isClosed: false,
    };
    const reversed = reversePath(path);
    expect(reversed.points[0].x).toBe(100);
    expect(reversed.points[1].x).toBe(0);
    expect(reversed.points[1].handleIn).toEqual({ x: 3, y: 3 });
    expect(reversed.points[1].handleOut).toEqual({ x: -2, y: -2 });
  });
});

describe('splitPath', () => {
  it('splits path at the given index into two paths', () => {
    const path: VectorPath = {
      points: [
        { id: 'p0', x: 0, y: 0, type: 'sharp' },
        { id: 'p1', x: 10, y: 10, type: 'sharp' },
        { id: 'p2', x: 20, y: 20, type: 'sharp' },
        { id: 'p3', x: 30, y: 30, type: 'sharp' },
      ],
      isClosed: false,
    };
    const [p1, p2] = splitPath(path, 2);
    expect(p1.points.map((p) => p.id)).toEqual(['p0', 'p1', 'p2']);
    expect(p2.points.map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('returns original and empty path when split index is out of bounds', () => {
    const path: VectorPath = {
      points: [
        { id: 'p0', x: 0, y: 0, type: 'sharp' },
        { id: 'p1', x: 10, y: 10, type: 'sharp' },
      ],
      isClosed: false,
    };
    const [p1, p2] = splitPath(path, 0);
    expect(p1).toEqual(path);
    expect(p2.points).toEqual([]);
  });
});

describe('removeSmallSegments', () => {
  it('filters out consecutive points closer than threshold', () => {
    const path: VectorPath = {
      points: [
        { id: 'p0', x: 0, y: 0, type: 'sharp' },
        { id: 'p1', x: 0.5, y: 0.5, type: 'sharp' }, // distance ~0.71 < 2
        { id: 'p2', x: 10, y: 10, type: 'sharp' },
      ],
      isClosed: false,
    };
    const filtered = removeSmallSegments(path, 2);
    expect(filtered.points.map((p) => p.id)).toEqual(['p0', 'p2']);
  });
});
