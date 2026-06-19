import paper from 'paper/dist/paper-core';
import { VectorPath, VectorPoint } from '../types';
import { VectorUtils } from './vectorUtils';

let paperInitialized = false;

function initPaper() {
  if (!paperInitialized) {
    paper.setup(new paper.Size(1, 1));
    paperInitialized = true;
  }
}

export class BooleanOperations {
  /**
   * Converts our internal VectorPath to a Paper.js PathItem
   */
  private static vectorPathToPaper(path: VectorPath): paper.PathItem {
    initPaper();
    const paperPath = new paper.Path();

    path.points.forEach((point, i) => {
      if (i === 0 || point.isMove) {
        paperPath.moveTo(new paper.Point(point.x, point.y));
      } else {
        const prev = path.points[i - 1];
        if (prev && (prev.handleOut || point.handleIn)) {
          const cp1 = prev.handleOut ? new paper.Point(prev.x + prev.handleOut.x, prev.y + prev.handleOut.y) : new paper.Point(prev.x, prev.y);
          const cp2 = point.handleIn ? new paper.Point(point.x + point.handleIn.x, point.y + point.handleIn.y) : new paper.Point(point.x, point.y);
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

  /**
   * Converts a Paper.js PathItem back to our internal VectorPath
   */
  private static paperToVectorPath(pathItem: paper.PathItem): VectorPath {
    const points: VectorPoint[] = [];

    if (pathItem instanceof paper.Path) {
      pathItem.segments.forEach((segment) => {
        const pt = VectorUtils.createPoint(segment.point.x, segment.point.y);
        if (segment.handleIn.x !== 0 || segment.handleIn.y !== 0) {
          pt.handleIn = { x: segment.handleIn.x, y: segment.handleIn.y };
        }
        if (segment.handleOut.x !== 0 || segment.handleOut.y !== 0) {
          pt.handleOut = { x: segment.handleOut.x, y: segment.handleOut.y };
        }
        points.push(pt);
      });

      return {
        points,
        isClosed: pathItem.closed,
      };
    } else if (pathItem instanceof paper.CompoundPath) {
      // Handle compound paths (e.g. shapes with holes)
      // For now, we flatten or take the first child to maintain compatibility
      // with the single-path layer system, or use isMove for sub-paths.
      pathItem.children.forEach((child: any) => {
        if (child instanceof paper.Path) {
          child.segments.forEach((segment, i) => {
            const pt = VectorUtils.createPoint(segment.point.x, segment.point.y);
            if (i === 0 && points.length > 0) {
              pt.isMove = true;
            }
            if (segment.handleIn.x !== 0 || segment.handleIn.y !== 0) {
              pt.handleIn = { x: segment.handleIn.x, y: segment.handleIn.y };
            }
            if (segment.handleOut.x !== 0 || segment.handleOut.y !== 0) {
              pt.handleOut = { x: segment.handleOut.x, y: segment.handleOut.y };
            }
            points.push(pt);
          });
        }
      });
      return {
        points,
        isClosed: true,
      };
    }

    return { points: [], isClosed: false };
  }

  private static runBoolean(
    pathA: VectorPath,
    pathB: VectorPath,
    operation: 'unite' | 'subtract' | 'intersect' | 'exclude'
  ): VectorPath {
    const itemA = this.vectorPathToPaper(pathA);
    const itemB = this.vectorPathToPaper(pathB);

    // FIX: Use try-finally for guaranteed cleanup
    try {
      const result = itemA[operation](itemB);
      const vectorResult = this.paperToVectorPath(result);

      // FIX: Defer cleanup to avoid race conditions
      setTimeout(() => {
        try {
          itemA.remove();
          itemB.remove();
          result.remove();
        } catch (e) {
          // Items may already be removed
        }
      }, 0);

      return vectorResult;
    } catch (e) {
      // FIX: Ensure cleanup on error too
      setTimeout(() => {
        try {
          itemA.remove();
          itemB.remove();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }, 0);
      return pathA;
    }
  }

  static union(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'unite');
  }

  static subtract(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'subtract');
  }

  static intersect(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'intersect');
  }

  static exclude(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'exclude');
  }

  static flatten(path: VectorPath, _tolerance = 1.0): { x: number; y: number }[] {
    if (path.points.length === 0) {
      return [];
    }
    const flattened: { x: number; y: number }[] = [];

    for (let i = 0; i < path.points.length; i++) {
      const p1 = path.points[i];
      const p2 = path.points[(i + 1) % path.points.length];

      if (i === path.points.length - 1 && !path.isClosed) {
        flattened.push({ x: p1.x, y: p1.y });
        break;
      }

      if (p1.handleOut || p2.handleIn) {
        const cp1 = p1.handleOut ? { x: p1.x + p1.handleOut.x, y: p1.y + p1.handleOut.y } : { x: p1.x, y: p1.y };
        const cp2 = p2.handleIn ? { x: p2.x + p2.handleIn.x, y: p2.y + p2.handleIn.y } : { x: p2.x, y: p2.y };
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const steps = Math.max(10, Math.min(50, Math.floor(dist / 5)));

        for (let t = 0; t < steps; t++) {
          const ratio = t / steps;
          const x = this.cubicBezier(p1.x, cp1.x, cp2.x, p2.x, ratio);
          const y = this.cubicBezier(p1.y, cp1.y, cp2.y, p2.y, ratio);
          flattened.push({ x, y });
        }
      } else {
        flattened.push({ x: p1.x, y: p1.y });
      }
    }
    return flattened;
  }

  private static cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  static isPointInPath(point: { x: number; y: number }, path: VectorPath): boolean {
    const poly = this.flatten(path);
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x,
        yi = poly[i].y;
      const xj = poly[j].x,
        yj = poly[j].y;
      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }
}
