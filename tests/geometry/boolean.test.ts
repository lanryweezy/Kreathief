import { describe, it, expect } from 'vitest';
import { union, subtract, intersect, exclude } from '../../geometry/boolean';
import { VectorPath } from '../../types';

describe('boolean operations', () => {
  const square1: VectorPath = {
    points: [
      { id: '1', x: 0, y: 0, type: 'sharp' },
      { id: '2', x: 100, y: 0, type: 'sharp' },
      { id: '3', x: 100, y: 100, type: 'sharp' },
      { id: '4', x: 0, y: 100, type: 'sharp' },
    ],
    isClosed: true,
  };

  const square2: VectorPath = {
    points: [
      { id: '5', x: 50, y: 50, type: 'sharp' },
      { id: '6', x: 150, y: 50, type: 'sharp' },
      { id: '7', x: 150, y: 150, type: 'sharp' },
      { id: '8', x: 50, y: 150, type: 'sharp' },
    ],
    isClosed: true,
  };

  it('unites two overlapping squares into a single shape', () => {
    const result = union(square1, square2);
    expect(result.points.length).toBeGreaterThanOrEqual(4);
    expect(result.isClosed).toBe(true);
  });

  it('subtracts one shape from another', () => {
    const result = subtract(square1, square2);
    expect(result.points.length).toBeGreaterThan(0);
    expect(result.isClosed).toBe(true);
  });

  it('intersects two shapes', () => {
    const result = intersect(square1, square2);
    expect(result.points.length).toBeGreaterThan(0);
    expect(result.isClosed).toBe(true);
  });

  it('excludes overlapping area of two shapes', () => {
    const result = exclude(square1, square2);
    expect(result.points.length).toBeGreaterThan(0);
  });
});
