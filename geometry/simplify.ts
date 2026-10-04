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

/* ========================================================================= */
/* SVG Path Data (d string) Simplification Engine                            */
/* ========================================================================= */

export interface CleanOptions {
  /** Round coordinates to N decimal places (default 2, 0.01px precision). */
  decimals?: number;
  /** Deduplicate consecutive anchors closer than this distance (default 0.01). */
  dedupeEpsilon?: number;
  /** Drop intermediate vertices if distance to baseline < tolerance (default 0.1). */
  collinearTolerance?: number;
  /** If > 0, run Ramer-Douglas-Peucker on straight line runs with this tolerance. */
  simplifyTolerance?: number;
}

interface Point {
  x: number;
  y: number;
}

interface AbsSegment {
  cmd: string;
  pts: Point[];
}

const num = (v: number, decimals: number): string => {
  const rounded = Number(v.toFixed(decimals));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const pairs = (arr: number[]): Point[] => {
  const out: Point[] = [];
  for (let i = 0; i < arr.length - 1; i += 2) {
    out.push({ x: arr[i], y: arr[i + 1] });
  }
  return out;
};

/**
 * Parse an SVG path `d` string into absolute-coordinate segments (M, L, C, Q, Z).
 * Relative commands (m, l, h, v, c, s, q, t) are converted to absolute.
 * Arc (`A`/`a`) commands are left unparsed to avoid distortion.
 */
export function parsePathData(d: string): AbsSegment[] {
  const segments: AbsSegment[] = [];
  const re = /([a-df-z])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let token: RegExpExecArray | null;
  let cmd = '';
  let args: number[] = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  const flush = () => {
    if (!cmd) return;
    const upper = cmd.toUpperCase();
    const abs = cmd === upper;

    if (upper === 'Z') {
      segments.push({ cmd: 'Z', pts: [] });
      cx = sx;
      cy = sy;
      return;
    }
    if (upper === 'M' || upper === 'L') {
      for (let i = 0; i + 1 < args.length; i += 2) {
        const x = abs ? args[i] : args[i] + cx;
        const y = abs ? args[i + 1] : args[i + 1] + cy;
        const c = upper === 'M' && i === 0 ? 'M' : 'L';
        segments.push({ cmd: c, pts: [{ x, y }] });
        cx = x;
        cy = y;
        if (c === 'M') {
          sx = x;
          sy = y;
        }
      }
      return;
    }
    if (upper === 'H' || upper === 'V') {
      for (let i = 0; i < args.length; i++) {
        const x = upper === 'H' ? (abs ? args[i] : args[i] + cx) : cx;
        const y = upper === 'V' ? (abs ? args[i] : args[i] + cy) : cy;
        segments.push({ cmd: 'L', pts: [{ x, y }] });
        cx = x;
        cy = y;
      }
      return;
    }
    if (upper === 'C') {
      for (let i = 0; i + 5 < args.length; i += 6) {
        const grp = args.slice(i, i + 6);
        const pts = abs ? pairs(grp) : pairs(grp).map((p) => ({ x: p.x + cx, y: p.y + cy }));
        segments.push({ cmd: 'C', pts });
        cx = pts[2].x;
        cy = pts[2].y;
      }
      return;
    }
    if (upper === 'S' || upper === 'Q' || upper === 'T') {
      const stride = upper === 'Q' ? 4 : upper === 'S' ? 4 : 2;
      for (let i = 0; i + stride - 1 < args.length; i += stride) {
        const grp = args.slice(i, i + stride);
        const pts = abs ? pairs(grp) : pairs(grp).map((p) => ({ x: p.x + cx, y: p.y + cy }));
        if (upper === 'Q') {
          segments.push({ cmd: 'Q', pts });
        } else if (upper === 'S') {
          segments.push({ cmd: 'C', pts: [pts[0], pts[0], pts[1]] });
        } else {
          segments.push({ cmd: 'L', pts });
        }
        cx = pts[pts.length - 1].x;
        cy = pts[pts.length - 1].y;
      }
      return;
    }
    if (upper === 'A') {
      return;
    }
  };

  while ((token = re.exec(d)) !== null) {
    if (token[1]) {
      flush();
      cmd = token[1];
      args = [];
    } else if (token[2] !== undefined) {
      const v = Number(token[2]);
      if (!Number.isNaN(v)) args.push(v);
    }
  }
  flush();
  return segments;
}

const dist = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y);

function rdp(points: Point[], tolerance: number): Point[] {
  if (points.length < 3 || tolerance <= 0) return points;
  const [first] = [points[0]];
  const last = points[points.length - 1];
  let maxDist = -1;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > tolerance) {
    const left = rdp(points.slice(0, index + 1), tolerance);
    const right = rdp(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function perpDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function dropCollinear(pts: Point[], tol: number): Point[] {
  if (pts.length < 3) return pts;
  const out: Point[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const baseLen = Math.max(dist(a, c), 1e-6);
    const height = Math.abs(cross) / baseLen;
    if (height > tol) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function dedupe(pts: Point[], eps: number): Point[] {
  if (pts.length === 0) return pts;
  const out: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (dist(out[out.length - 1], pts[i]) > eps) out.push(pts[i]);
  }
  return out;
}

function serialize(segments: AbsSegment[], decimals: number): string {
  const parts: string[] = [];
  let lastCmd = '';
  for (const s of segments) {
    const body = s.pts.map((p) => `${num(p.x, decimals)} ${num(p.y, decimals)}`).join(' ');
    if (s.cmd === 'Z') {
      parts.push('Z');
      lastCmd = 'Z';
      continue;
    }
    const prefix = s.cmd === 'L' && lastCmd === 'L' ? '' : s.cmd;
    if (body) parts.push(`${prefix}${prefix ? ' ' : ''}${body}`);
    lastCmd = s.cmd;
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Clean an SVG path `d` string. Returns a new string with reduced node count and
 * coordinate precision, geometrically equivalent within the given tolerances.
 * Arc (`A`) commands are passed through untouched (never lossy-collapsed).
 */
export function cleanPathData(d: string, options: CleanOptions = {}): string {
  const decimals = options.decimals ?? 2;
  const eps = options.dedupeEpsilon ?? 0.01;
  const colTol = options.collinearTolerance ?? 0.1;
  const sTol = options.simplifyTolerance ?? 0;

  if (/[Aa]/.test(d)) return roundOnly(d, decimals);

  const parsed = parsePathData(d);
  if (parsed.length === 0) return d;

  const out: AbsSegment[] = [];
  let run: Point[] = [];
  let runStartIsMove = false;

  const flushRun = (closing: boolean) => {
    if (run.length === 0) return;
    let cleaned = dedupe(run, eps);
    if (sTol > 0) cleaned = rdp(cleaned, sTol);
    cleaned = dropCollinear(cleaned, colTol);
    if (closing && cleaned.length > 2 && dist(cleaned[0], cleaned[cleaned.length - 1]) <= Math.max(eps, colTol)) {
      cleaned = cleaned.slice(0, -1);
    }
    if (runStartIsMove && cleaned.length > 0) {
      out.push({ cmd: 'M', pts: [cleaned[0]] });
      for (let i = 1; i < cleaned.length; i++) out.push({ cmd: 'L', pts: [cleaned[i]] });
    } else {
      for (let i = runStartIsMove ? 1 : 0; i < cleaned.length; i++) out.push({ cmd: 'L', pts: [cleaned[i]] });
    }
    run = [];
    runStartIsMove = false;
  };

  for (const s of parsed) {
    if (s.cmd === 'M' || s.cmd === 'L') {
      if (s.cmd === 'M' && run.length > 0) flushRun(false);
      if (s.cmd === 'M') {
        runStartIsMove = true;
        run = [...run, ...s.pts];
      } else {
        run = [...run, ...s.pts];
      }
    } else if (s.cmd === 'Z') {
      flushRun(true);
      out.push({ cmd: 'Z', pts: [] });
    } else {
      flushRun(false);
      out.push({ cmd: s.cmd, pts: s.pts.map((p) => ({ x: round(p.x, decimals), y: round(p.y, decimals) })) });
    }
  }
  flushRun(false);

  return serialize(out, decimals);
}

function round(v: number, decimals: number): number {
  return Number(v.toFixed(decimals));
}

function roundOnly(d: string, decimals: number): string {
  return d.replace(/-?\d*\.?\d+/g, (m) => {
    const v = Number(m);
    if (Number.isNaN(v)) return m;
    return num(v, decimals);
  });
}

/** Count anchor-ish points (M/L/C/Q endpoints) for metrics/tests. */
export function countAnchors(d: string): number {
  const parsed = parsePathData(d);
  let n = 0;
  for (const s of parsed) n += s.cmd === 'M' || s.cmd === 'L' ? 1 : s.pts.length ? 1 : 0;
  return n;
}
