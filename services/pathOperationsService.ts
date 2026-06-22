import { VectorPath, VectorPoint } from '../types';
import { VectorUtils } from '../utils/vectorUtils';
import paper from 'paper/dist/paper-core';

let paperInitialized = false;

function initPaper() {
  if (!paperInitialized) {
    paper.setup(new paper.Size(1, 1));
    paperInitialized = true;
  }
}

export class PathOperationsService {
  /**
   * Simplify path by reducing number of points while maintaining shape
   */
  static simplifyPath(path: VectorPath, tolerance: number = 2.5): VectorPath {
    if (path.points.length < 3) return path;

    initPaper();

    try {
      const paperPath = new paper.Path();

      path.points.forEach((point, i) => {
        if (i === 0 || point.isMove) {
          paperPath.moveTo(new paper.Point(point.x, point.y));
        } else {
          const prev = path.points[i - 1];
          if (prev && (prev.handleOut || point.handleIn)) {
            const cp1 = prev.handleOut
              ? new paper.Point(prev.x + prev.handleOut.x, prev.y + prev.handleOut.y)
              : new paper.Point(prev.x, prev.y);
            const cp2 = point.handleIn
              ? new paper.Point(point.x + point.handleIn.x, point.y + point.handleIn.y)
              : new paper.Point(point.x, point.y);
            paperPath.cubicCurveTo(cp1, cp2, new paper.Point(point.x, point.y));
          } else {
            paperPath.lineTo(new paper.Point(point.x, point.y));
          }
        }
      });

      if (path.isClosed) {
        paperPath.closed = true;
      }

      // Simplify
      paperPath.simplify(tolerance);

      // Convert back
      const simplifiedPoints: VectorPoint[] = paperPath.segments.map((segment) => {
        const pt = VectorUtils.createPoint(segment.point.x, segment.point.y);
        if (segment.handleIn.x !== 0 || segment.handleIn.y !== 0) {
          pt.handleIn = { x: segment.handleIn.x, y: segment.handleIn.y };
        }
        if (segment.handleOut.x !== 0 || segment.handleOut.y !== 0) {
          pt.handleOut = { x: segment.handleOut.x, y: segment.handleOut.y };
        }
        return pt;
      });

      setTimeout(() => {
        try {
          paperPath.remove();
        } catch (e) {
          // Cleanup error - ignore
        }
      }, 0);

      return {
        points: simplifiedPoints,
        isClosed: path.isClosed,
      };
    } catch (error) {
      console.error('Path simplification failed:', error);
      return path;
    }
  }

  /**
   * Offset (expand/contract) a path by a given distance
   */
  static offsetPath(path: VectorPath, distance: number): VectorPath {
    if (path.points.length < 2) return path;

    initPaper();

    try {
      const paperPath = new paper.Path();

      path.points.forEach((point, i) => {
        if (i === 0 || point.isMove) {
          paperPath.moveTo(new paper.Point(point.x, point.y));
        } else {
          paperPath.lineTo(new paper.Point(point.x, point.y));
        }
      });

      if (path.isClosed) {
        paperPath.closed = true;
      }

      // Offset using Paper.js translate
      const offsetPaths = paperPath.clone();
      offsetPaths.translate(new paper.Point(distance, 0));

      let resultPath = path;

      if (offsetPaths instanceof paper.Path) {
        const offsetPoints: VectorPoint[] = offsetPaths.segments.map((segment) => {
          const pt = VectorUtils.createPoint(segment.point.x, segment.point.y);
          if (segment.handleIn.x !== 0 || segment.handleIn.y !== 0) {
            pt.handleIn = { x: segment.handleIn.x, y: segment.handleIn.y };
          }
          if (segment.handleOut.x !== 0 || segment.handleOut.y !== 0) {
            pt.handleOut = { x: segment.handleOut.x, y: segment.handleOut.y };
          }
          return pt;
        });

        resultPath = {
          points: offsetPoints,
          isClosed: offsetPaths.closed,
        };
      }

      setTimeout(() => {
        try {
          paperPath.remove();
          if (offsetPaths && typeof (offsetPaths as any).remove === 'function') {
            (offsetPaths as any).remove();
          }
        } catch (e) {
          // Cleanup error - ignore
        }
      }, 0);

      return resultPath;
    } catch (error) {
      console.error('Path offset failed:', error);
      return path;
    }
  }

  /**
   * Convert stroke to outline (expand stroke into a filled path)
   */
  static strokeToPath(path: VectorPath, strokeWidth: number): VectorPath {
    if (path.points.length < 2 || strokeWidth <= 0) return path;

    // Create two parallel paths offset by strokeWidth/2
    const outerPath = this.offsetPath(path, strokeWidth / 2);
    const innerPath = this.offsetPath(path, -strokeWidth / 2);

    // Combine them into a single closed path
    const combinedPoints = [...outerPath.points, ...innerPath.points.reverse()];

    return {
      points: combinedPoints,
      isClosed: true,
    };
  }

  /**
   * Smooth a path by adjusting handles for better curves
   */
  static smoothPath(path: VectorPath, factor: number = 0.5): VectorPath {
    if (path.points.length < 3) return path;

    const smoothedPoints = path.points.map((point, i) => {
      if (i === 0 || i === path.points.length - 1) {
        return point; // Keep endpoints unchanged
      }

      const prev = path.points[i - 1];
      const next = path.points[i + 1];
      if (!prev || !next) return point;

      // Calculate smooth handles based on neighboring points
      const dx1 = point.x - prev.x;
      const dy1 = point.y - prev.y;
      const dx2 = next.x - point.x;
      const dy2 = next.y - point.y;

      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      // Average direction
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      const avgAngle = (angle1 + angle2) / 2;

      const handleLength1 = dist1 * factor * 0.4;
      const handleLength2 = dist2 * factor * 0.4;

      return {
        ...point,
        type: 'smooth' as const,
        handleIn: {
          x: -Math.cos(avgAngle) * handleLength1,
          y: -Math.sin(avgAngle) * handleLength1,
        },
        handleOut: {
          x: Math.cos(avgAngle) * handleLength2,
          y: Math.sin(avgAngle) * handleLength2,
        },
      };
    });

    return {
      ...path,
      points: smoothedPoints,
    };
  }

  /**
   * Flatten a path (convert all curves to straight lines)
   */
  static flattenPath(path: VectorPath): VectorPath {
    const flattenedPoints = path.points.map((point) => ({
      ...point,
      handleIn: undefined,
      handleOut: undefined,
      type: 'sharp' as const,
    }));

    return {
      ...path,
      points: flattenedPoints,
    };
  }

  /**
   * Reverse path direction
   */
  static reversePath(path: VectorPath): VectorPath {
    const reversedPoints = [...path.points].reverse().map((point) => ({
      ...point,
      // Swap handles
      handleIn: point.handleOut,
      handleOut: point.handleIn,
    }));

    return {
      ...path,
      points: reversedPoints,
    };
  }

  /**
   * Split a path at a specific point index
   */
  static splitPath(path: VectorPath, pointIndex: number): [VectorPath, VectorPath] {
    if (pointIndex < 1 || pointIndex >= path.points.length) {
      return [path, { points: [], isClosed: false }];
    }

    const firstPath: VectorPath = {
      points: path.points.slice(0, pointIndex + 1),
      isClosed: false,
    };

    const secondPath: VectorPath = {
      points: path.points.slice(pointIndex),
      isClosed: false,
    };

    return [firstPath, secondPath];
  }

  /**
   * Remove small segments below threshold
   */
  static removeSmallSegments(path: VectorPath, threshold: number = 2): VectorPath {
    if (path.points.length < 3) return path;

    const filteredPoints: VectorPoint[] = [path.points[0]!];

    for (let i = 1; i < path.points.length; i++) {
      const curr = path.points[i];
      const prev = filteredPoints[filteredPoints.length - 1];

      if (curr && prev) {
        const dist = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));

        if (dist >= threshold) {
          filteredPoints.push(curr);
        }
      }
    }

    return {
      ...path,
      points: filteredPoints,
    };
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

    for (let i = 1; i < path.points.length; i++) {
      const prev = path.points[i - 1];
      const curr = path.points[i];

      if (prev && curr) {
        // Simplified length calculation (not accounting for bezier curves)
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        length += Math.sqrt(dx * dx + dy * dy);
      }
    }

    if (path.isClosed && path.points.length > 0) {
      const first = path.points[0];
      const last = path.points[path.points.length - 1];
      if (first && last) {
        const dx = first.x - last.x;
        const dy = first.y - last.y;
        length += Math.sqrt(dx * dx + dy * dy);
      }
    }

    return length;
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
        // Point is on this segment
        const t = (distance - accumulatedDistance) / segmentLength;
        return {
          x: prev.x + dx * t,
          y: prev.y + dy * t,
        };
      }

      accumulatedDistance += segmentLength;
    }

    // Return last point if distance exceeds path length
    const lastPoint = path.points[path.points.length - 1];
    return lastPoint ? { x: lastPoint.x, y: lastPoint.y } : null;
  }
}

export const pathOperationsService = PathOperationsService;
