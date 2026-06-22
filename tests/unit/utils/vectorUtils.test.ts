import { describe, it, expect } from 'vitest';
import { VectorUtils } from '../../../utils/vectorUtils';
import { VectorPath, VectorPoint } from '../../../types';

describe('VectorUtils', () => {
  describe('validatePath', () => {
    it('returns false when path is null or undefined', () => {
      expect(VectorUtils.validatePath(null as any)).toBe(false);
      expect(VectorUtils.validatePath(undefined as any)).toBe(false);
    });

    it('returns false when path points are not an array', () => {
      expect(VectorUtils.validatePath({ points: {} } as any)).toBe(false);
    });

    it('returns false when path has no points', () => {
      expect(VectorUtils.validatePath({ points: [] } as any)).toBe(false);
    });

    it('returns false when a point is missing or has invalid coordinates', () => {
      const invalidPath: VectorPath = {
        points: [{ id: '1', x: NaN, y: 10, type: 'sharp' }],
        isClosed: false,
      };
      expect(VectorUtils.validatePath(invalidPath)).toBe(false);

      const invalidPath2: VectorPath = {
        points: [{ id: '1', x: 10, y: Infinity, type: 'sharp' }],
        isClosed: false,
      };
      expect(VectorUtils.validatePath(invalidPath2)).toBe(false);
    });

    it('returns false when a point handleIn has invalid coordinates', () => {
      const invalidPath: VectorPath = {
        points: [
          {
            id: '1',
            x: 10,
            y: 10,
            type: 'smooth',
            handleIn: { x: NaN, y: 0 },
          },
        ],
        isClosed: false,
      };
      expect(VectorUtils.validatePath(invalidPath)).toBe(false);
    });

    it('returns false when a point handleOut has invalid coordinates', () => {
      const invalidPath: VectorPath = {
        points: [
          {
            id: '1',
            x: 10,
            y: 10,
            type: 'smooth',
            handleOut: { x: 0, y: Infinity },
          },
        ],
        isClosed: false,
      };
      expect(VectorUtils.validatePath(invalidPath)).toBe(false);
    });

    it('returns true when path is valid', () => {
      const validPath: VectorPath = {
        points: [
          { id: '1', x: 10, y: 10, type: 'sharp' },
          {
            id: '2',
            x: 20,
            y: 20,
            type: 'smooth',
            handleIn: { x: -5, y: -5 },
            handleOut: { x: 5, y: 5 },
          },
        ],
        isClosed: true,
      };
      expect(VectorUtils.validatePath(validPath)).toBe(true);
    });
  });

  describe('serializePath', () => {
    it('returns empty string when path is invalid', () => {
      expect(VectorUtils.serializePath(null as any)).toBe('');
    });

    it('returns empty string when path has no points', () => {
      expect(VectorUtils.serializePath({ points: [], isClosed: false } as any)).toBe('');
    });

    it('serializes to SVG path data when valid VectorPath is provided', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'sharp' },
          { id: '2', x: 10, y: 0, type: 'sharp' },
          { id: '3', x: 10, y: 10, type: 'sharp' },
        ],
        isClosed: false,
      };
      expect(VectorUtils.serializePath(path)).toBe('M 0 0 L 10 0 L 10 10');
    });

    it('serializes closed paths correctly', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'sharp' },
          { id: '2', x: 10, y: 0, type: 'sharp' },
          { id: '3', x: 10, y: 10, type: 'sharp' },
        ],
        isClosed: true,
      };
      expect(VectorUtils.serializePath(path)).toBe('M 0 0 L 10 0 L 10 10 Z');
    });

    it('serializes paths with bezier curves correctly', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'smooth', handleOut: { x: 5, y: 0 } },
          { id: '2', x: 10, y: 10, type: 'smooth', handleIn: { x: -5, y: 0 } },
        ],
        isClosed: false,
      };
      expect(VectorUtils.serializePath(path)).toBe('M 0 0 C 5 0, 5 10, 10 10');
    });

    it('serializes multi-segment paths correctly', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'sharp' },
          { id: '2', x: 10, y: 0, type: 'sharp' },
          { id: '3', x: 20, y: 0, type: 'sharp', isMove: true },
          { id: '4', x: 30, y: 0, type: 'sharp' },
        ],
        isClosed: false,
      };
      expect(VectorUtils.serializePath(path)).toBe('M 0 0 L 10 0M 20 0 L 30 0');
    });
  });

  describe('createPoint', () => {
    it('creates a basic point', () => {
      const point = VectorUtils.createPoint(10, 20);
      expect(point.x).toBe(10);
      expect(point.y).toBe(20);
      expect(point.type).toBe('sharp');
      expect(point.id).toBeDefined();
    });

    it('creates a point with specific type', () => {
      const point = VectorUtils.createPoint(10, 20, 'smooth');
      expect(point.type).toBe('smooth');
    });
  });

  describe('parsePath', () => {
    it('returns path with no points for empty string', () => {
      const path = VectorUtils.parsePath('');
      expect(path.points.length).toBe(0);
      expect(path.isClosed).toBe(false);
    });

    it('parses absolute M and L commands', () => {
      const path = VectorUtils.parsePath('M 0 0 L 10 0 L 10 10');
      expect(path.points.length).toBe(3);
      expect(path.points[0].x).toBe(0);
      expect(path.points[0].y).toBe(0);
      expect(path.points[1].x).toBe(10);
      expect(path.points[1].y).toBe(0);
      expect(path.points[2].x).toBe(10);
      expect(path.points[2].y).toBe(10);
      expect(path.isClosed).toBe(false);
    });

    it('parses absolute C commands', () => {
      const path = VectorUtils.parsePath('M 0 0 C 5 0, 5 10, 10 10');
      expect(path.points.length).toBe(2);
      expect(path.points[0].x).toBe(0);
      expect(path.points[0].y).toBe(0);
      expect(path.points[0].handleOut).toEqual({ x: 5, y: 0 });
      expect(path.points[1].x).toBe(10);
      expect(path.points[1].y).toBe(10);
      expect(path.points[1].handleIn).toEqual({ x: -5, y: 0 });
    });

    it('parses absolute Q commands', () => {
      const path = VectorUtils.parsePath('M 0 0 Q 5 5 10 0');
      expect(path.points.length).toBe(2);
      expect(path.points[0].x).toBe(0);
      expect(path.points[0].y).toBe(0);
      expect(path.points[0].handleOut).toBeDefined();
      expect(path.points[1].x).toBe(10);
      expect(path.points[1].y).toBe(0);
      expect(path.points[1].handleIn).toBeDefined();
    });

    it('parses Z command to close path', () => {
      const path = VectorUtils.parsePath('M 0 0 L 10 0 Z');
      expect(path.isClosed).toBe(true);
    });

    it('handles relative m and l commands', () => {
      const path = VectorUtils.parsePath('m 10 10 l 5 5');
      expect(path.points.length).toBe(2);
      expect(path.points[0].x).toBe(10);
      expect(path.points[0].y).toBe(10);
      expect(path.points[1].x).toBe(15);
      expect(path.points[1].y).toBe(15);
    });

    it('handles relative c commands', () => {
      const path = VectorUtils.parsePath('M 10 10 c 5 0 5 10 10 10');
      expect(path.points.length).toBe(2);
      expect(path.points[0].x).toBe(10);
      expect(path.points[0].y).toBe(10);
      expect(path.points[0].handleOut).toEqual({ x: 5, y: 0 });
      expect(path.points[1].x).toBe(20);
      expect(path.points[1].y).toBe(20);
      expect(path.points[1].handleIn).toEqual({ x: -5, y: 0 });
    });

    it('handles relative q commands', () => {
      const path = VectorUtils.parsePath('M 10 10 q 5 5 10 0');
      expect(path.points.length).toBe(2);
      expect(path.points[0].x).toBe(10);
      expect(path.points[0].y).toBe(10);
      expect(path.points[0].handleOut).toBeDefined();
      expect(path.points[1].x).toBe(20);
      expect(path.points[1].y).toBe(10);
      expect(path.points[1].handleIn).toBeDefined();
    });
  });

  describe('alignHandles', () => {
    it('returns point unchanged if type is sharp', () => {
      const pt: VectorPoint = {
        id: '1',
        x: 0,
        y: 0,
        type: 'sharp',
        handleIn: { x: 10, y: 0 },
        handleOut: { x: -10, y: 0 },
      };
      const aligned = VectorUtils.alignHandles({ ...pt }, 'in');
      expect(aligned).toEqual(pt);
    });

    it('returns point unchanged if missing source handle', () => {
      const pt: VectorPoint = { id: '1', x: 0, y: 0, type: 'symmetric', handleOut: { x: -10, y: 0 } };
      const aligned = VectorUtils.alignHandles({ ...pt }, 'in');
      expect(aligned).toEqual(pt);
    });

    it('returns point unchanged if missing target handle', () => {
      const pt: VectorPoint = { id: '1', x: 0, y: 0, type: 'symmetric', handleIn: { x: 10, y: 0 } };
      const aligned = VectorUtils.alignHandles({ ...pt }, 'in');
      expect(aligned).toEqual(pt);
    });

    it('aligns handles symmetrically for symmetric point', () => {
      const pt: VectorPoint = {
        id: '1',
        x: 0,
        y: 0,
        type: 'symmetric',
        handleIn: { x: 10, y: 5 },
        handleOut: { x: -10, y: -10 },
      };
      const aligned = VectorUtils.alignHandles({ ...pt }, 'in');
      expect(aligned.handleOut).toEqual({ x: -10, y: -5 });

      const pt2: VectorPoint = {
        id: '1',
        x: 0,
        y: 0,
        type: 'symmetric',
        handleIn: { x: 10, y: 10 },
        handleOut: { x: -5, y: -10 },
      };
      const aligned2 = VectorUtils.alignHandles({ ...pt2 }, 'out');
      expect(aligned2.handleIn).toEqual({ x: 5, y: 10 });
    });

    it('aligns handles preserving length for smooth point', () => {
      const pt: VectorPoint = {
        id: '1',
        x: 0,
        y: 0,
        type: 'smooth',
        handleIn: { x: 10, y: 0 },
        handleOut: { x: 0, y: 5 },
      };
      const aligned = VectorUtils.alignHandles({ ...pt }, 'in');

      // Target handle (handleOut) length was 5. Angle of source is 0. So opposite angle is PI, dist is 5.
      expect(aligned.handleOut?.x).toBeCloseTo(-5);
      expect(aligned.handleOut?.y).toBeCloseTo(0);
    });
  });

  describe('getBounds', () => {
    it('returns zeroes for empty path', () => {
      const bounds = VectorUtils.getBounds({ points: [], isClosed: false });
      expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('calculates bounds correctly for paths without curves', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'sharp' },
          { id: '2', x: 10, y: 5, type: 'sharp' },
          { id: '3', x: -5, y: 10, type: 'sharp' },
        ],
        isClosed: false,
      };
      const bounds = VectorUtils.getBounds(path);
      expect(bounds).toEqual({ x: -5, y: 0, width: 15, height: 10 });
    });

    it('includes curve extremas in bounds calculation', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'smooth', handleOut: { x: 10, y: 0 } },
          { id: '2', x: 20, y: 0, type: 'smooth', handleIn: { x: -10, y: 0 } },
        ],
        isClosed: false,
      };
      const bounds = VectorUtils.getBounds(path);
      // P0=0, P1=10, P2=10, P3=20
      expect(bounds.x).toBeCloseTo(0);
      expect(bounds.y).toBeCloseTo(0);
      expect(bounds.width).toBeCloseTo(20);
      expect(bounds.height).toBeCloseTo(0);
    });
  });

  describe('applyCornerRounding', () => {
    it('returns unchanged path if it has less than 2 points', () => {
      const path: VectorPath = { points: [{ id: '1', x: 0, y: 0, type: 'sharp' }], isClosed: false };
      const rounded = VectorUtils.applyCornerRounding(path, 10);
      expect(rounded).toEqual(path);
    });

    it('returns unchanged path if global radius is 0 or less', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'sharp' },
          { id: '2', x: 10, y: 0, type: 'sharp' },
        ],
        isClosed: false,
      };
      const rounded = VectorUtils.applyCornerRounding(path, 0);
      expect(rounded).toEqual(path);
    });

    it('applies rounding to corners', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 10, type: 'sharp' },
          { id: '2', x: 0, y: 0, type: 'sharp' },
          { id: '3', x: 10, y: 0, type: 'sharp' },
        ],
        isClosed: true,
      };

      const rounded = VectorUtils.applyCornerRounding(path, 2);
      expect(rounded.points.length).toBeGreaterThan(path.points.length);
      expect(rounded.points.some((p) => p.handleIn || p.handleOut)).toBe(true);
    });
  });

  describe('insertPointToPath', () => {
    it('returns null if no matching segment found within threshold', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'sharp' },
          { id: '2', x: 100, y: 0, type: 'sharp' },
        ],
        isClosed: false,
      };
      const result = VectorUtils.insertPointToPath(path, 50, 50, 5);
      expect(result).toBeNull();
    });

    it('inserts point into line segment correctly', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'sharp' },
          { id: '2', x: 100, y: 0, type: 'sharp' },
        ],
        isClosed: false,
      };
      const result = VectorUtils.insertPointToPath(path, 50, 0, 5);
      expect(result).not.toBeNull();
      expect(result!.points.length).toBe(3);
      expect(result!.points[1].x).toBeCloseTo(50);
      expect(result!.points[1].y).toBeCloseTo(0);
    });

    it('inserts point into bezier segment correctly', () => {
      const path: VectorPath = {
        points: [
          { id: '1', x: 0, y: 0, type: 'smooth', handleOut: { x: 50, y: 0 } },
          { id: '2', x: 100, y: 0, type: 'smooth', handleIn: { x: -50, y: 0 } },
        ],
        isClosed: false,
      };
      const result = VectorUtils.insertPointToPath(path, 50, 0, 5);
      expect(result).not.toBeNull();
      expect(result!.points.length).toBe(3);
    });
  });

  describe('joinPaths', () => {
    it('returns empty path if both paths are empty', () => {
      const pathA: VectorPath = { points: [], isClosed: false };
      const pathB: VectorPath = { points: [], isClosed: false };
      const result = VectorUtils.joinPaths(pathA, pathB);
      expect(result.points.length).toBe(0);
    });

    it('returns pathA if pathB is empty', () => {
      const pathA: VectorPath = { points: [{ id: '1', x: 0, y: 0, type: 'sharp' }], isClosed: false };
      const pathB: VectorPath = { points: [], isClosed: false };
      const result = VectorUtils.joinPaths(pathA, pathB);
      expect(result).toEqual(pathA);
    });

    it('returns pathB if pathA is empty', () => {
      const pathA: VectorPath = { points: [], isClosed: false };
      const pathB: VectorPath = { points: [{ id: '1', x: 0, y: 0, type: 'sharp' }], isClosed: false };
      const result = VectorUtils.joinPaths(pathA, pathB);
      expect(result).toEqual(pathB);
    });

    it('joins paths successfully', () => {
      const pathA: VectorPath = { points: [{ id: '1', x: 0, y: 0, type: 'sharp' }], isClosed: false };
      const pathB: VectorPath = { points: [{ id: '2', x: 10, y: 0, type: 'sharp' }], isClosed: false };
      const result = VectorUtils.joinPaths(pathA, pathB);
      expect(result.points.length).toBe(2);
      expect(result.points[1].isMove).toBe(true);
    });
  });
});
