import { GeometryOracle } from './geometryOracle';

// FIX: Add stroke smoothing implementation
export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export class StrokeSmoother {
  private points: StrokePoint[] = [];
  private smoothedPointsHistory: StrokePoint[] = [];
  private smoothing: number;
  private lastOutput: StrokePoint | null = null;

  constructor(smoothing: number = 50) {
    this.smoothing = smoothing / 100;
  }

  /**
   * Add a point and return smoothed coordinates
   * Uses weighted averaging for stabilization
   */
  addPoint(x: number, y: number, pressure?: number): StrokePoint | null {
    const newPoint: StrokePoint = { x, y, pressure };
    this.points.push(newPoint);

    // Need at least 3 points for smoothing
    if (this.points.length < 3) {
      this.lastOutput = newPoint;
      this.smoothedPointsHistory.push(newPoint);
      return newPoint;
    }

    const smoothFactor = this.smoothing;
    const lastPoint = this.points[this.points.length - 2];
    const secondLastPoint = this.points[this.points.length - 3];

    if (!lastPoint || !secondLastPoint) {
      this.lastOutput = newPoint;
      this.smoothedPointsHistory.push(newPoint);
      return newPoint;
    }

    // FIX: Implement weighted averaging with velocity-based adjustment
    const dx1 = x - lastPoint.x;
    const dy1 = y - lastPoint.y;
    const dx2 = lastPoint.x - secondLastPoint.x;
    const dy2 = lastPoint.y - secondLastPoint.y;

    // Calculate velocity
    const velocity = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const prevVelocity = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    // Adjust smoothing based on velocity change (less smoothing for fast movements)
    const velocityRatio = prevVelocity > 0 ? velocity / prevVelocity : 1;
    const adjustedSmoothFactor = Math.max(0.1, smoothFactor * (1 - Math.min(velocityRatio - 1, 0.5)));

    const smoothedX = x * (1 - adjustedSmoothFactor) + lastPoint.x * adjustedSmoothFactor;
    const smoothedY = y * (1 - adjustedSmoothFactor) + lastPoint.y * adjustedSmoothFactor;

    this.lastOutput = { x: smoothedX, y: smoothedY, pressure };
    this.smoothedPointsHistory.push(this.lastOutput);
    return this.lastOutput;
  }

  /**
   * Add a point and return a high-density array of Catmull-Rom interpolated points
   * to eliminate angular step gaps during fast hand strokes or trackpad drawing.
   */
  addPointWithCatmullRom(x: number, y: number, pressure?: number, maxStep: number = 2.0): StrokePoint[] {
    const target = this.addPoint(x, y, pressure);
    if (!target) {
      return [];
    }

    const n = this.smoothedPointsHistory.length;
    if (n < 2) {
      return [target];
    }

    const p1 = this.smoothedPointsHistory[n - 2];
    const p2 = target;

    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (dist <= maxStep) {
      return [p2];
    }

    // Determine p0 (before p1) and p3 (after p2) for Catmull-Rom spline evaluation
    const p0 =
      n >= 3 ? this.smoothedPointsHistory[n - 3] : { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y, pressure: p1.pressure };
    const p3 = { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y, pressure: p2.pressure };

    const steps = Math.ceil(dist / maxStep);
    const interpolated: StrokePoint[] = [];

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;

      const ix =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const iy =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      const pStart = p1.pressure ?? 0.5;
      const pEnd = p2.pressure ?? 0.5;
      const ip = pStart + (pEnd - pStart) * t;

      interpolated.push({ x: ix, y: iy, pressure: ip });
    }

    return interpolated;
  }

  /**
   * Reset the smoother for a new stroke
   */
  reset() {
    this.points = [];
    this.smoothedPointsHistory = [];
    this.lastOutput = null;
  }

  /**
   * Get the last smoothed point
   */
  getLastOutput(): StrokePoint | null {
    return this.lastOutput;
  }
}

// FIX: Add pressure-sensitive stroke width calculation
export function calculateStrokeWidth(
  baseWidth: number,
  pressure: number = 0.5,
  taperStart: number = 0.1,
  taperEnd: number = 0.9,
  minFactor: number = 0.3,
  maxFactor: number = 1.2
): number {
  // Apply pressure with tapering at ends
  const t = Math.max(0, Math.min(1, pressure));
  const pressureFactor = taperStart + t * (taperEnd - taperStart);

  // Clamp to reasonable range
  const clampedFactor = Math.max(minFactor, Math.min(maxFactor, pressureFactor));

  return baseWidth * clampedFactor;
}

// Builds an outline polygon path approximating a variable-width stroke along a center path.
// widthFn receives t in [0,1] along path and returns absolute width in px at that point.
const outlineCache = new Map<string, string>();

export function buildVariableStrokeOutline(pathData: string, widthFn: (t: number) => number, samples = 64): string {
  const key = (() => {
    // Attempt to stringify widthFn by sampling a few points
    const probe = [0, 0.25, 0.5, 0.75, 1].map((t) => widthFn(t).toFixed(2)).join(',');
    return `${pathData}::${samples}::${probe}`;
  })();
  if (outlineCache.has(key)) {
    return outlineCache.get(key)!;
  }
  const m = GeometryOracle.measurePath(pathData);
  const total = m.totalLength;
  if (!total || samples < 2) {
    return '';
  }

  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const d = t * total;
    const p = m.getPointAt(d);
    const w = Math.max(0, widthFn(t));
    // normal vector (perpendicular to tangent)
    const nx = -Math.sin(p.angle);
    const ny = Math.cos(p.angle);
    const hx = (nx * w) / 2;
    const hy = (ny * w) / 2;
    left.push({ x: p.x + hx, y: p.y + hy });
    right.push({ x: p.x - hx, y: p.y - hy });
  }

  // Build path string: left points forward, right points backward
  const pts = [...left, ...right.reverse()];
  if (pts.length === 0) {
    return '';
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  d += ' Z';
  outlineCache.set(key, d);
  return d;
}

export function profileWidthFn(profile: 'uniform' | 'taper-start' | 'taper-end' | 'taper-both', baseWidth: number) {
  return (t: number) => {
    switch (profile) {
      case 'taper-start':
        return baseWidth * (0.2 + 0.8 * t); // small at start, full at end
      case 'taper-end':
        return baseWidth * (0.2 + 0.8 * (1 - t)); // full at start, small at end
      case 'taper-both':
        return baseWidth * (0.2 + 0.8 * (1 - Math.abs(0.5 - t) * 2)); // small at both ends
      case 'uniform':
      default:
        return baseWidth;
    }
  };
}
