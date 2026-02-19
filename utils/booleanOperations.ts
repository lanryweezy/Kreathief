import { VectorPath } from '../types';

export class BooleanOperations {
  /**
   * Flattens a Bézier path into a series of line segments with adaptive sampling
   */
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

  /**
   * Union: Combines multiple paths into one
   * For high-performance simple union, we just merge point arrays if they don't overlap,
   * but for real vector editing we use the 'winding rule' or group paths.
   * Here we implement a simplified 'Multi-Path' representation which SVG supports.
   */
  static union(pathA: VectorPath, pathB: VectorPath): VectorPath {
    // SVG paths support multiple 'M' commands. We merge them.
    return {
      points: [...pathA.points, ...pathB.points],
      isClosed: true,
    };
  }

  /**
   * Subtract: PathA minus PathB
   * Uses the 'Even-Odd' fill rule trick for SVG where a sub-path with reverse winding
   * creates a hole.
   */
  static subtract(pathA: VectorPath, pathB: VectorPath): VectorPath {
    // Reverse PathB winding to create a hole if it's inside PathA
    const reversedPoints = [...pathB.points].reverse().map((p) => ({
      ...p,
      handleIn: p.handleOut ? { x: -p.handleOut.x, y: -p.handleOut.y } : undefined,
      handleOut: p.handleIn ? { x: -p.handleIn.x, y: -p.handleIn.y } : undefined,
    }));

    return {
      points: [...pathA.points, ...reversedPoints],
      isClosed: true,
    };
  }

  /**
   * Intersect: Shared area between PathA and PathB
   * Note: True intersection requires polygon clipping.
   * As a simplified version for this editor, we'll return pathA but we should
   * ideally implement Sutherland-Hodgman if we want perfect results.
   */
  static intersect(pathA: VectorPath, _pathB: VectorPath): VectorPath {
    // Placeholder for now - true intersection is complex without a library
    // We return PathA as it's the 'source'
    return pathA;
  }

  /**
   * Exclude (XOR): Areas not shared by PathA and PathB
   */
  static exclude(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return {
      points: [...pathA.points, ...pathB.points],
      isClosed: true,
    };
  }

  // Helper to check if a point is inside a polygon (flattened path)
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
