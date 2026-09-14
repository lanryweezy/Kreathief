import paper from 'paper/dist/paper-core';
import { VectorPath, VectorPoint } from '../types';
import { VectorUtils } from '../utils/vectorUtils';
import { log } from '../utils/log';

let paperInitialized = false;

function initPaper() {
  if (!paperInitialized) {
    paper.setup(new paper.Size(1, 1));
    paperInitialized = true;
  }
}

/**
 * Simplify path by reducing number of points while maintaining shape
 */
export function simplifyPath(path: VectorPath, tolerance: number = 2.5): VectorPath {
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

    paperPath.simplify(tolerance);

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
        log.warn('[PathOps] Failed to cleanup paper path', { error: e });
      }
    }, 0);

    return {
      points: simplifiedPoints,
      isClosed: path.isClosed,
    };
  } catch (error) {
    log.error('Path simplification failed', error);
    return path;
  }
}

/**
 * Smooth a path by adjusting handles for better curves
 */
export function smoothPath(path: VectorPath, factor: number = 0.5): VectorPath {
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
export function flattenPath(path: VectorPath): VectorPath {
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
export function reversePath(path: VectorPath): VectorPath {
  const reversedPoints = [...path.points].reverse().map((point) => ({
    ...point,
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
export function splitPath(path: VectorPath, pointIndex: number): [VectorPath, VectorPath] {
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
export function removeSmallSegments(path: VectorPath, threshold: number = 2): VectorPath {
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
