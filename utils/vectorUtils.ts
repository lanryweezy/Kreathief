import { VectorPath, VectorPoint, PointType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { BezierMath, Point } from './bezierMath';

export class VectorUtils {
  static lastPathData: string = '';

  /**
   * Serializes a VectorPath into an SVG path data string ('d')
   */
  static serializePath(path: VectorPath): string {
    if (path.points.length === 0) {
      return '';
    }

    let d = '';
    path.points.forEach((point, i) => {
      if (i === 0 || point.isMove) {
        if (i !== 0 && path.isClosed) {
           d += ' Z ';
        }
        d += `M ${point.x} ${point.y}`;
      } else {
        const prev = path.points[i - 1];
        if (!prev) {
          return;
        }

        if (prev.handleOut || point.handleIn) {
          const cp1x = prev.handleOut ? prev.x + prev.handleOut.x : prev.x;
          const cp1y = prev.handleOut ? prev.y + prev.handleOut.y : prev.y;
          const cp2x = point.handleIn ? point.x + point.handleIn.x : point.x;
          const cp2y = point.handleIn ? point.y + point.handleIn.y : point.y;
          d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
        } else {
          d += ` L ${point.x} ${point.y}`;
        }
      }
    });

    if (path.isClosed) {
      const last = path.points[path.points.length - 1];
      const first = path.points[0];
      if (last && first) {
        if (last.handleOut || first.handleIn) {
          const cp1x = last.handleOut ? last.x + last.handleOut.x : last.x;
          const cp1y = last.handleOut ? last.y + last.handleOut.y : last.y;
          const cp2x = first.handleIn ? first.x + first.handleIn.x : first.x;
          const cp2y = first.handleIn ? first.y + first.handleIn.y : first.y;
          // Only draw close curve if first point is not a move, or if we strictly want it
          d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y}`;
        }
        d += ' Z';
      }
    }

    VectorUtils.lastPathData = d;
    return d;
  }

  /**
   * Basic SVG path parser to structured VectorPath
   */
  static parsePath(d: string): VectorPath {
    const points: VectorPoint[] = [];
    const commands = d.match(/([MLCQZmlcqz])[^MLCQZmlcqz]*/g) || [];

    let currentX = 0;
    let currentY = 0;

    commands.forEach((cmdStr) => {
      const type = cmdStr[0];
      if (!type) {
        return;
      }
      const args = (
        cmdStr
          .substring(1)
          .trim()
          .split(/[\s,]+/)
          .map(Number) || []
      ).filter((n) => !isNaN(n));

      switch (type.toUpperCase()) {
        case 'M':
          if (args[0] !== undefined && args[1] !== undefined) {
            currentX = args[0];
            currentY = args[1];
            const pt = this.createPoint(currentX, currentY);
            if (points.length > 0) {pt.isMove = true;}
            points.push(pt);
          }
          break;
        case 'L':
          if (args[0] !== undefined && args[1] !== undefined) {
            currentX = args[0];
            currentY = args[1];
            points.push(this.createPoint(currentX, currentY));
          }
          break;
        case 'C':
          if (points.length > 0 && args.length >= 6) {
            const prev = points[points.length - 1];
            if (
              prev &&
              args[0] !== undefined &&
              args[1] !== undefined &&
              args[4] !== undefined &&
              args[5] !== undefined &&
              args[2] !== undefined &&
              args[3] !== undefined
            ) {
              prev.handleOut = { x: args[0] - prev.x, y: args[1] - prev.y };
              currentX = args[4];
              currentY = args[5];
              const next = this.createPoint(currentX, currentY);
              next.handleIn = { x: args[2] - currentX, y: args[3] - currentY };
              points.push(next);
            }
          }
          break;
      }
    });

    return {
      points,
      isClosed: d.toUpperCase().includes('Z'),
    };
  }

  static createPoint(x: number, y: number, type: PointType = 'sharp'): VectorPoint {
    return {
      id: uuidv4(),
      x,
      y,
      type,
    };
  }

  static alignHandles(point: VectorPoint, movedHandle: 'in' | 'out'): VectorPoint {
    if (point.type === 'sharp') {
      return point;
    }

    const source = movedHandle === 'in' ? point.handleIn : point.handleOut;
    if (!source) {
      return point;
    }

    const targetKey = movedHandle === 'in' ? 'handleOut' : 'handleIn';
    const target = point[targetKey];
    if (!target) {
      return point;
    }

    const angle = Math.atan2(source.y, source.x);
    const dist = Math.sqrt(target.x ** 2 + target.y ** 2);

    if (point.type === 'symmetric') {
      point[targetKey] = {
        x: -source.x,
        y: -source.y,
      };
    } else if (point.type === 'smooth') {
      point[targetKey] = {
        x: -Math.cos(angle) * dist,
        y: -Math.sin(angle) * dist,
      };
    }

    return point;
  }

  static getBounds(path: VectorPath): { x: number; y: number; width: number; height: number } {
    if (path.points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    path.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);

      if (p.handleIn) {
        minX = Math.min(minX, p.x + p.handleIn.x);
        minY = Math.min(minY, p.y + p.handleIn.y);
        maxX = Math.max(maxX, p.x + p.handleIn.x);
        maxY = Math.max(maxY, p.y + p.handleIn.y);
      }
      if (p.handleOut) {
        minX = Math.min(minX, p.x + p.handleOut.x);
        minY = Math.min(minY, p.y + p.handleOut.y);
        maxX = Math.max(maxX, p.x + p.handleOut.x);
        maxY = Math.max(maxY, p.y + p.handleOut.y);
      }
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  static applyCornerRounding(path: VectorPath, globalRadius: number): VectorPath {
    if (path.points.length < 2 || globalRadius <= 0) {
      return path;
    }

    const newPoints: VectorPoint[] = [];
    const n = path.points.length;

    for (let i = 0; i < n; i++) {
      const curr = path.points[i];
      if (!curr) {
        continue;
      }
      const prev = path.points[(i - 1 + n) % n];
      const next = path.points[(i + 1) % n];
      if (!prev || !next) {
        continue;
      }

      if (curr.handleIn || curr.handleOut) {
        newPoints.push(curr);
        continue;
      }

      const radius = curr.cornerRadius !== undefined ? curr.cornerRadius : globalRadius;
      if (radius <= 0) {
        newPoints.push(curr);
        continue;
      }

      const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };
      const d1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const d2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      const n1 = { x: v1.x / d1, y: v1.y / d1 };
      const n2 = { x: v2.x / d2, y: v2.y / d2 };

      const angle = Math.acos(n1.x * n2.x + n1.y * n2.y);
      const maxRadius = Math.min(d1, d2) / 2;
      const r = Math.min(radius, maxRadius);

      const offset = r / Math.tan(angle / 2);

      const p1 = { x: curr.x + n1.x * offset, y: curr.y + n1.y * offset };
      const p2 = { x: curr.x + n2.x * offset, y: curr.y + n2.y * offset };

      const pt1 = this.createPoint(p1.x, p1.y, 'smooth');
      const pt2 = this.createPoint(p2.x, p2.y, 'smooth');

      const cpLen = r * 0.55228;
      pt1.handleOut = { x: -n1.x * cpLen, y: -n1.y * cpLen };
      pt2.handleIn = { x: -n2.x * cpLen, y: -n2.y * cpLen };

      newPoints.push(pt1, pt2);
    }

    return {
      points: newPoints,
      isClosed: path.isClosed,
    };
  }

  static insertPointToPath(path: VectorPath, x: number, y: number, threshold: number = 10): VectorPath | null {
    if (path.points.length < 2) {
      return null;
    }

    let bestDist = Infinity;
    let bestSegmentIndex = -1;
    let bestT = 0;
    const target: Point = { x, y };

    for (let i = 1; i < path.points.length; i++) {
      const p0 = path.points[i - 1];
      const p3 = path.points[i];
      if (!p0 || !p3) {
        continue;
      }

      const p1: Point = p0.handleOut ? { x: p0.x + p0.handleOut.x, y: p0.y + p0.handleOut.y } : p0;
      const p2: Point = p3.handleIn ? { x: p3.x + p3.handleIn.x, y: p3.y + p3.handleIn.y } : p3;

      const { t, dist } = BezierMath.getClosestT(p0, p1, p2, p3, target);

      if (dist < bestDist) {
        bestDist = dist;
        bestSegmentIndex = i;
        bestT = t;
      }
    }

    if (path.isClosed) {
      const p0 = path.points[path.points.length - 1];
      const p3 = path.points[0];
      if (p0 && p3) {
        const p1: Point = p0.handleOut ? { x: p0.x + p0.handleOut.x, y: p0.y + p0.handleOut.y } : p0;
        const p2: Point = p3.handleIn ? { x: p3.x + p3.handleIn.x, y: p3.y + p3.handleIn.y } : p3;

        const { t, dist } = BezierMath.getClosestT(p0, p1, p2, p3, target);
        if (dist < bestDist) {
          bestDist = dist;
          bestSegmentIndex = path.points.length;
          bestT = t;
        }
      }
    }

    if (bestDist > threshold) {
      return null;
    }

    const newPoints = [...path.points];
    const pStartIdx = bestSegmentIndex === path.points.length ? path.points.length - 1 : bestSegmentIndex - 1;
    const pEndIdx = bestSegmentIndex === path.points.length ? 0 : bestSegmentIndex;

    const p0 = newPoints[pStartIdx];
    const p3 = newPoints[pEndIdx];
    if (!p0 || !p3) {
      return null;
    }

    const p1: Point = p0.handleOut ? { x: p0.x + p0.handleOut.x, y: p0.y + p0.handleOut.y } : p0;
    const p2: Point = p3.handleIn ? { x: p3.x + p3.handleIn.x, y: p3.y + p3.handleIn.y } : p3;

    const { left, right } = BezierMath.splitCubic(p0, p1, p2, p3, bestT);

    const splitPoint = left[3];
    const newPoint: VectorPoint = this.createPoint(splitPoint.x, splitPoint.y, 'smooth');

    newPoint.handleIn = { x: left[2].x - splitPoint.x, y: left[2].y - splitPoint.y };
    newPoint.handleOut = { x: right[1].x - splitPoint.x, y: right[1].y - splitPoint.y };

    const updatedP0 = { ...p0, handleOut: { x: left[1].x - p0.x, y: left[1].y - p0.y } };
    const updatedP3 = { ...p3, handleIn: { x: right[2].x - p3.x, y: right[2].y - p3.y } };

    if (bestSegmentIndex !== path.points.length) {
      newPoints[pStartIdx] = updatedP0;
      newPoints[pEndIdx] = updatedP3;
      newPoints.splice(bestSegmentIndex, 0, newPoint);
    } else {
      newPoints[pStartIdx] = updatedP0;
      newPoints[0] = updatedP3;
      newPoints.push(newPoint);
    }

    return {
      ...path,
      points: newPoints,
    };
  }
}
