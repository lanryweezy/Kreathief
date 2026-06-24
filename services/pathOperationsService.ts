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

function pathToPaperPath(path: VectorPath): paper.Path {
  initPaper();
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

  return paperPath;
}

function paperPathToVectorPath(paperPath: paper.Path): VectorPath {
  const points: VectorPoint[] = paperPath.segments.map((segment) => {
    const pt = VectorUtils.createPoint(segment.point.x, segment.point.y);
    if (segment.handleIn.x !== 0 || segment.handleIn.y !== 0) {
      pt.handleIn = { x: segment.handleIn.x, y: segment.handleIn.y };
    }
    if (segment.handleOut.x !== 0 || segment.handleOut.y !== 0) {
      pt.handleOut = { x: segment.handleOut.x, y: segment.handleOut.y };
    }
    return pt;
  });

  return {
    points,
    isClosed: paperPath.closed,
  };
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
   * Moves each point perpendicular to the path direction
   */
  static offsetPath(path: VectorPath, distance: number): VectorPath {
    if (path.points.length < 2) return path;

    const offsetPoints: VectorPoint[] = [];

    for (let i = 0; i < path.points.length; i++) {
      const point = path.points[i];
      if (!point) continue;

      let normalX = 0;
      let normalY = 0;
      let count = 0;

      // Calculate normal from previous segment
      if (i > 0) {
        const prev = path.points[i - 1];
        if (prev) {
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            normalX += -dy / len;
            normalY += dx / len;
            count++;
          }
        }
      }

      // Calculate normal from next segment
      if (i < path.points.length - 1) {
        const next = path.points[i + 1];
        if (next) {
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            normalX += -dy / len;
            normalY += dx / len;
            count++;
          }
        }
      }

      // For closed paths, wrap around
      if (path.isClosed) {
        if (i === 0 && path.points.length > 2) {
          const last = path.points[path.points.length - 1];
          const first = path.points[0];
          if (last && first) {
            const dx = first.x - last.x;
            const dy = first.y - last.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0 && count < 2) {
              normalX += -dy / len;
              normalY += dx / len;
              count++;
            }
          }
        }
        if (i === path.points.length - 1 && path.points.length > 2) {
          const secondLast = path.points[path.points.length - 2];
          const last = path.points[path.points.length - 1];
          if (secondLast && last) {
            const dx = last.x - secondLast.x;
            const dy = last.y - secondLast.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0 && count < 2) {
              normalX += -dy / len;
              normalY += dx / len;
              count++;
            }
          }
        }
      }

      // Average the normals
      if (count > 0) {
        normalX /= count;
        normalY /= count;
        // Normalize
        const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);
        if (normalLen > 0) {
          normalX /= normalLen;
          normalY /= normalLen;
        }
      }

      // Apply offset along the normal
      const newPoint = VectorUtils.createPoint(
        point.x + normalX * distance,
        point.y + normalY * distance,
        point.type
      );

      // Preserve handles (adjusted by offset)
      if (point.handleIn) {
        newPoint.handleIn = { x: point.handleIn.x, y: point.handleIn.y };
      }
      if (point.handleOut) {
        newPoint.handleOut = { x: point.handleOut.x, y: point.handleOut.y };
      }
      if (point.isMove) {
        newPoint.isMove = true;
      }

      offsetPoints.push(newPoint);
    }

    return {
      points: offsetPoints,
      isClosed: path.isClosed,
    };
  }

  /**
   * Convert stroke to outline (expand stroke into a filled path)
   * Creates a rectangle along the stroke path oriented in the stroke direction
   */
  static strokeToPath(path: VectorPath, strokeWidth: number): VectorPath {
    if (path.points.length < 2 || strokeWidth <= 0) return path;

    const halfWidth = strokeWidth / 2;
    const leftPoints: VectorPoint[] = [];
    const rightPoints: VectorPoint[] = [];

    // For each segment, calculate the perpendicular offset
    for (let i = 0; i < path.points.length; i++) {
      const point = path.points[i];
      if (!point) continue;

      let tangentX = 0;
      let tangentY = 0;

      // Calculate tangent at this point
      if (i < path.points.length - 1) {
        const next = path.points[i + 1];
        if (next) {
          tangentX = next.x - point.x;
          tangentY = next.y - point.y;
        }
      } else if (i > 0) {
        const prev = path.points[i - 1];
        if (prev) {
          tangentX = point.x - prev.x;
          tangentY = point.y - prev.y;
        }
      }

      // Normalize tangent
      const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      if (tangentLen > 0) {
        tangentX /= tangentLen;
        tangentY /= tangentLen;
      }

      // Calculate perpendicular normal
      const normalX = -tangentY;
      const normalY = tangentX;

      // Create left and right points offset by half width
      const leftPoint = VectorUtils.createPoint(
        point.x + normalX * halfWidth,
        point.y + normalY * halfWidth,
        'sharp'
      );
      const rightPoint = VectorUtils.createPoint(
        point.x - normalX * halfWidth,
        point.y - normalY * halfWidth,
        'sharp'
      );

      leftPoints.push(leftPoint);
      rightPoints.push(rightPoint);
    }

    // Combine: left side forward, then right side reversed to form closed shape
    const combinedPoints = [...leftPoints, ...rightPoints.reverse()];

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
        return point;
      }

      const prev = path.points[i - 1];
      const next = path.points[i + 1];
      if (!prev || !next) return point;

      const tangentX = (next.x - prev.x) * factor * 0.5;
      const tangentY = (next.y - prev.y) * factor * 0.5;

      const dist1 = Math.sqrt((point.x - prev.x) ** 2 + (point.y - prev.y) ** 2);
      const dist2 = Math.sqrt((next.x - point.x) ** 2 + (next.y - point.y) ** 2);

      const handleLength1 = dist1 * factor * 0.4;
      const handleLength2 = dist2 * factor * 0.4;
      const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      const scale1 = tangentLen > 0 ? handleLength1 / tangentLen : 0;
      const scale2 = tangentLen > 0 ? handleLength2 / tangentLen : 0;

      return {
        ...point,
        type: 'smooth' as const,
        handleIn: {
          x: -tangentX * scale1,
          y: -tangentY * scale1,
        },
        handleOut: {
          x: tangentX * scale2,
          y: tangentY * scale2,
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

    const bezierLength = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
      const chord = Math.sqrt((p3.x - p0.x) ** 2 + (p3.y - p0.y) ** 2);
      const tangentLen =
        Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2) +
        Math.sqrt((p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2);
      return 1.5 * (chord + tangentLen) / 2;
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
          const p1 = prev.handleOut
            ? { x: prev.x + prev.handleOut.x, y: prev.y + prev.handleOut.y }
            : p0;
          const p2 = curr.handleIn
            ? { x: curr.x + curr.handleIn.x, y: curr.y + curr.handleIn.y }
            : p3;
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
          const p1 = last.handleOut
            ? { x: last.x + last.handleOut.x, y: last.y + last.handleOut.y }
            : p0;
          const p2 = first.handleIn
            ? { x: first.x + first.handleIn.x, y: first.y + first.handleIn.y }
            : p3;
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
    try {
      initPaper();
      const paperPath1 = pathToPaperPath(path1);
      const paperPath2 = pathToPaperPath(path2);

      const result = paperPath1.unite(paperPath2) as paper.Path;

      paperPath1.remove();
      paperPath2.remove();

      return paperPathToVectorPath(result);
    } catch (error) {
      console.error('Boolean union failed:', error);
      return path1;
    }
  }

  /**
   * Boolean subtract: cut path2 from path1
   */
  static subtract(path1: VectorPath, path2: VectorPath): VectorPath {
    try {
      initPaper();
      const paperPath1 = pathToPaperPath(path1);
      const paperPath2 = pathToPaperPath(path2);

      const result = paperPath1.subtract(paperPath2) as paper.Path;

      paperPath1.remove();
      paperPath2.remove();

      return paperPathToVectorPath(result);
    } catch (error) {
      console.error('Boolean subtract failed:', error);
      return path1;
    }
  }

  /**
   * Boolean intersect: keep only overlapping area
   */
  static intersect(path1: VectorPath, path2: VectorPath): VectorPath {
    try {
      initPaper();
      const paperPath1 = pathToPaperPath(path1);
      const paperPath2 = pathToPaperPath(path2);

      const result = paperPath1.intersect(paperPath2) as paper.Path;

      paperPath1.remove();
      paperPath2.remove();

      return paperPathToVectorPath(result);
    } catch (error) {
      console.error('Boolean intersect failed:', error);
      return path1;
    }
  }

  /**
   * Boolean exclude: remove overlapping area
   */
  static exclude(path1: VectorPath, path2: VectorPath): VectorPath {
    try {
      initPaper();
      const paperPath1 = pathToPaperPath(path1);
      const paperPath2 = pathToPaperPath(path2);

      const result = paperPath1.exclude(paperPath2) as paper.Path;

      paperPath1.remove();
      paperPath2.remove();

      return paperPathToVectorPath(result);
    } catch (error) {
      console.error('Boolean exclude failed:', error);
      return path1;
    }
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
