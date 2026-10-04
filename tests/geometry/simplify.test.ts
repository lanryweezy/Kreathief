import { describe, it, expect } from 'vitest';
import {
  parsePathData,
  cleanPathData,
  countAnchors,
  simplifyPath,
  smoothPath,
  flattenPath,
  reversePath,
  splitPath,
  removeSmallSegments,
} from '../../geometry/simplify';
import { Point } from '../../geometry/bezier';
import { VectorPath } from '../../types';

const allPoints = (d: string): Point[] =>
  parsePathData(d).flatMap((s) => s.pts);

const bbox = (d: string) => {
  const pts = allPoints(d);
  if (!pts.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
};

describe('parsePathData', () => {
  it('normalizes absolute line/move/close', () => {
    const d = 'M 10 10 L 30 10 L 30 30 Z';
    const b = bbox(d);
    expect(b).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 30 });
  });

  it('resolves relative m/l/h/v to absolute coordinates', () => {
    const d = 'm10 10 l20 0 l0 20 z';
    const b = bbox(d);
    expect(b).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 30 });
  });

  it('expands implicit repeated coordinate pairs', () => {
    const pts = allPoints('M0 0 L1 1 2 2');
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
  });
});

describe('cleanPathData', () => {
  it('drops collinear vertices down to the true corners', () => {
    const dirty = 'M0 0 L10 0 L20 0 L30 0 L30 10 L20 10 L10 10 L0 10 L0 5 L0 0 Z';
    const before = countAnchors(dirty);
    const cleaned = cleanPathData(dirty);
    const after = countAnchors(cleaned);
    expect(after).toBeLessThan(before);
    expect(after).toBe(4);
    expect(cleaned).toContain('Z');
  });

  it('preserves the bounding box while reducing nodes', () => {
    const dirty = 'M0 0 L15 0 L30 0 L30 15 L30 30 L15 30 L0 30 L0 15 Z';
    const cleaned = cleanPathData(dirty);
    expect(bbox(cleaned)).toEqual(bbox(dirty));
  });

  it('merges duplicate coincident anchors', () => {
    const cleaned = cleanPathData('M0 0 L30 0 L30 0 L30 0 L30 30 L0 30 Z');
    expect(countAnchors(cleaned)).toBe(4);
  });

  it('rounds oversized coordinate precision to sub-pixel', () => {
    const cleaned = cleanPathData('M0.1234567 0 L10.9876543 0.00001 L10 10 Z', { decimals: 2 });
    expect(cleaned).not.toMatch(/\.\d{3,}/);
    expect(cleaned).toContain('10.99');
  });

  it('RDP collapses jitter along an otherwise-straight edge', () => {
    const noisy = 'M0 0 L10 0.3 L20 -0.2 L30 0.15 L40 0';
    const cleaned = cleanPathData(noisy, { simplifyTolerance: 1 });
    expect(countAnchors(cleaned)).toBe(2);
  });

  it('does NOT increase anchors on an already-clean curve path', () => {
    const clean = 'M50 6 C74 34 86 58 50 94 C14 58 26 34 50 6 Z';
    const out = cleanPathData(clean);
    expect(countAnchors(out)).toBeLessThanOrEqual(countAnchors(clean));
    expect(out).toMatch(/C/);
  });

  it('passes arcs through untouched (no corruption, flags intact)', () => {
    const d = 'M0 0 A10 10 0 0 1 20 0';
    const out = cleanPathData(d);
    expect(out).toContain('A');
    expect(out).not.toMatch(/NaN|undefined/);
    expect(out).toMatch(/A\s*10\s*10\s*0\s*0\s*1\s*20\s*0/);
  });

  it('is idempotent on already-clean output', () => {
    const once = cleanPathData('M0 0 L10 0 L10 10 L0 10 Z');
    const twice = cleanPathData(once);
    expect(twice).toBe(once);
  });

  it('never emits NaN/undefined tokens on messy input', () => {
    const messy = 'M0 0 l10 0 10 0 h10 v10 l-20 0 Z';
    const out = cleanPathData(messy);
    expect(out).not.toMatch(/NaN|undefined/);
  });
});

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
        { id: 'p1', x: 0.5, y: 0.5, type: 'sharp' },
        { id: 'p2', x: 10, y: 10, type: 'sharp' },
      ],
      isClosed: false,
    };
    const filtered = removeSmallSegments(path, 2);
    expect(filtered.points.map((p) => p.id)).toEqual(['p0', 'p2']);
  });
});
