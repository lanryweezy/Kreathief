import { describe, it, expect } from 'vitest';
import { parsePathData, cleanPathData, countAnchors } from '../../geometry/simplify';
import { Point } from '../../geometry/bezier';

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
    // "L 1 1 2 2" is two linetos.
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
    // A rectangle should reduce to its 4 corners.
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
    expect(countAnchors(cleaned)).toBe(2); // M0 0 -> L40 0
  });

  it('does NOT increase anchors on an already-clean curve path', () => {
    const clean = 'M50 6 C74 34 86 58 50 94 C14 58 26 34 50 6 Z';
    const out = cleanPathData(clean);
    expect(countAnchors(out)).toBeLessThanOrEqual(countAnchors(clean));
    // Curve control points survive.
    expect(out).toMatch(/C/);
  });

  it('passes arcs through untouched (no corruption, flags intact)', () => {
    const d = 'M0 0 A10 10 0 0 1 20 0';
    const out = cleanPathData(d);
    expect(out).toContain('A');
    expect(out).not.toMatch(/NaN|undefined/);
    // large-arc (0) and sweep (1) flags preserved.
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
