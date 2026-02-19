export interface Point {
  x: number;
  y: number;
}

export class BezierMath {
  /**
   * Calculates a point on a cubic Bezier curve at parameter t
   */
  static getPointOnCubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
  }

  /**
   * Splits a cubic Bezier curve into two curves at parameter t
   */
  static splitCubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number) {
    const p01 = { x: (p1.x - p0.x) * t + p0.x, y: (p1.y - p0.y) * t + p0.y };
    const p12 = { x: (p2.x - p1.x) * t + p1.x, y: (p2.y - p1.y) * t + p1.y };
    const p23 = { x: (p3.x - p2.x) * t + p2.x, y: (p3.y - p2.y) * t + p2.y };
    const p012 = { x: (p12.x - p01.x) * t + p01.x, y: (p12.y - p01.y) * t + p01.y };
    const p123 = { x: (p23.x - p12.x) * t + p12.x, y: (p23.y - p12.y) * t + p12.y };
    const p0123 = { x: (p123.x - p012.x) * t + p012.x, y: (p123.y - p012.y) * t + p012.y };

    return {
      left: [p0, p01, p012, p0123] as [Point, Point, Point, Point],
      right: [p0123, p123, p23, p3] as [Point, Point, Point, Point],
    };
  }

  /**
   * Finds the closest t on a cubic Bezier curve to a given point
   */
  static getClosestT(p0: Point, p1: Point, p2: Point, p3: Point, point: Point): { t: number; dist: number } {
    const SCANS = 20;
    let bestT = 0;
    let minMsg = Infinity;

    // Coarse scan
    for (let i = 0; i <= SCANS; i++) {
      const t = i / SCANS;
      const p = this.getPointOnCubic(p0, p1, p2, p3, t);
      const dist = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
      if (dist < minMsg) {
        minMsg = dist;
        bestT = t;
      }
    }

    // Refine around bestT
    const start = Math.max(0, bestT - 0.05);
    const end = Math.min(1, bestT + 0.05);
    const STEPS = 10;

    for (let i = 0; i <= STEPS; i++) {
      const t = start + (end - start) * (i / STEPS);
      const p = this.getPointOnCubic(p0, p1, p2, p3, t);
      const dist = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
      if (dist < minMsg) {
        minMsg = dist;
        bestT = t;
      }
    }

    return { t: bestT, dist: Math.sqrt(minMsg) };
  }
}
