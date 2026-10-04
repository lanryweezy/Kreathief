import { VectorPath } from '../types';
import { VectorUtils } from '../utils/vectorUtils';
import {
  union,
  subtract,
  intersect,
  exclude,
  offsetPath,
  strokeToPath,
  simplifyPath,
  smoothPath,
  flattenPath,
  reversePath,
  splitPath,
  removeSmallSegments,
} from '../geometry';

export class PathOperationsService {
  /**
   * Simplify path by reducing number of points while maintaining shape
   */
  static simplifyPath(path: VectorPath, tolerance: number = 2.5): VectorPath {
    return simplifyPath(path, tolerance);
  }

  /**
   * Offset (expand/contract) a path by a given distance
   */
  static offsetPath(path: VectorPath, distance: number): VectorPath {
    return offsetPath(path, distance);
  }

  /**
   * Convert stroke to outline (expand stroke into a filled path)
   */
  static strokeToPath(path: VectorPath, strokeWidth: number): VectorPath {
    return strokeToPath(path, strokeWidth);
  }

  /**
   * Smooth a path by adjusting handles for better curves
   */
  static smoothPath(path: VectorPath, factor: number = 0.5): VectorPath {
    return smoothPath(path, factor);
  }

  /**
   * Flatten a path (convert all curves to straight lines)
   */
  static flattenPath(path: VectorPath): VectorPath {
    return flattenPath(path);
  }

  /**
   * Reverse path direction
   */
  static reversePath(path: VectorPath): VectorPath {
    return reversePath(path);
  }

  /**
   * Split a path at a specific point index
   */
  static splitPath(path: VectorPath, pointIndex: number): [VectorPath, VectorPath] {
    return splitPath(path, pointIndex);
  }

  /**
   * Remove small segments below threshold
   */
  static removeSmallSegments(path: VectorPath, threshold: number = 2): VectorPath {
    return removeSmallSegments(path, threshold);
  }

  /**
   * Apply corner rounding to all corners in path
   */
  static applyCornerRounding(path: VectorPath, radius: number): VectorPath {
    return VectorUtils.applyCornerRounding(path, radius);
  }

  /**
   * Calculate path length
   */
  static getPathLength(path: VectorPath): number {
    if (path.points.length < 2) return 0;

    let length = 0;

    const bezierLength = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number }
    ) => {
      const chord = Math.sqrt((p3.x - p0.x) ** 2 + (p3.y - p0.y) ** 2);
      const tangentLen =
        Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2) + Math.sqrt((p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2);
      return (1.5 * (chord + tangentLen)) / 2;
    };

    for (let i = 1; i < path.points.length; i++) {
      const prev = path.points[i - 1];
      const curr = path.points[i];

      if (prev && curr) {
        const p0 = { x: prev.x, y: prev.y };
        const p3 = { x: curr.x, y: curr.y };

        const hasHandles =
          (prev.handleOut && (prev.handleOut.x !== 0 || prev.handleOut.y !== 0)) ||
          (curr.handleIn && (curr.handleIn.x !== 0 || curr.handleIn.y !== 0));

        if (hasHandles) {
          const p1 = prev.handleOut ? { x: prev.x + prev.handleOut.x, y: prev.y + prev.handleOut.y } : p0;
          const p2 = curr.handleIn ? { x: curr.x + curr.handleIn.x, y: curr.y + curr.handleIn.y } : p3;
          length += bezierLength(p0, p1, p2, p3);
        } else {
          const dx = p3.x - p0.x;
          const dy = p3.y - p0.y;
          length += Math.sqrt(dx * dx + dy * dy);
        }
      }
    }

    if (path.isClosed && path.points.length > 0) {
      const first = path.points[0];
      const last = path.points[path.points.length - 1];
      if (first && last) {
        const p0 = { x: last.x, y: last.y };
        const p3 = { x: first.x, y: first.y };

        const hasHandles =
          (last.handleOut && (last.handleOut.x !== 0 || last.handleOut.y !== 0)) ||
          (first.handleIn && (first.handleIn.x !== 0 || first.handleIn.y !== 0));

        if (hasHandles) {
          const p1 = last.handleOut ? { x: last.x + last.handleOut.x, y: last.y + last.handleOut.y } : p0;
          const p2 = first.handleIn ? { x: first.x + first.handleIn.x, y: first.y + first.handleIn.y } : p3;
          length += bezierLength(p0, p1, p2, p3);
        } else {
          const dx = p3.x - p0.x;
          const dy = p3.y - p0.y;
          length += Math.sqrt(dx * dx + dy * dy);
        }
      }
    }

    return length;
  }

  /**
   * Boolean union: combine two paths into one
   */
  static union(path1: VectorPath, path2: VectorPath): VectorPath {
    return union(path1, path2);
  }

  /**
   * Boolean subtract: cut path2 from path1
   */
  static subtract(path1: VectorPath, path2: VectorPath): VectorPath {
    return subtract(path1, path2);
  }

  /**
   * Boolean intersect: keep only overlapping area
   */
  static intersect(path1: VectorPath, path2: VectorPath): VectorPath {
    return intersect(path1, path2);
  }

  /**
   * Boolean exclude: remove overlapping area
   */
  static exclude(path1: VectorPath, path2: VectorPath): VectorPath {
    return exclude(path1, path2);
  }

  /**
   * Get point at specific distance along path
   */
  static getPointAtDistance(path: VectorPath, distance: number): { x: number; y: number } | null {
    if (path.points.length < 2) return null;

    let accumulatedDistance = 0;

    for (let i = 1; i < path.points.length; i++) {
      const prev = path.points[i - 1];
      const curr = path.points[i];

      if (!prev || !curr) continue;

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (accumulatedDistance + segmentLength >= distance) {
        const t = (distance - accumulatedDistance) / segmentLength;
        return {
          x: prev.x + dx * t,
          y: prev.y + dy * t,
        };
      }

      accumulatedDistance += segmentLength;
    }

    const lastPoint = path.points[path.points.length - 1];
    return lastPoint ? { x: lastPoint.x, y: lastPoint.y } : null;
  }
}

export const pathOperationsService = PathOperationsService;
