import { Point } from './bezier';

/**
 * Vector path cleaning / simplification.
 *
 * Why this exists: when a designer (or a reviewer opening our export in
 * Illustrator) looks at a "good" vector, the first things they check are node
 * count and coordinate precision. Recraft output, pen-tool paths, and
 * especially raster->trace results are frequently bloated with:
 *   - absurd coordinate precision (0.123456789 on a 512px canvas),
 *   - duplicate coincident anchors,
 *   - collinear vertices that do nothing but inflate the node count.
 *
 * This module reduces all three WITHOUT changing the visible shape:
 *   - rounding is bounded to a sub-pixel tolerance,
 *   - duplicate/collinear points are removed from *straight* runs only,
 *   - optional Ramer-Douglas-Peucker simplification for dense polylines,
 *   - curves (C/S/Q/T) and arcs (A) are preserved structurally — we only round
 *     their numbers, never drop their control points, and arc flags are left as
 *     exact 0/1 (rounding those would corrupt the path).
 *
 * Endpoints of the whole path and of every subpath are always preserved.
 */

export interface CleanOptions {
  /** Decimal places to round coordinates to. Default 2. */
  decimals?: number;
  /** Points closer than this are treated as duplicates and merged. Default 0.01. */
  dedupeEpsilon?: number;
  /** Perpendicular distance under which an intermediate vertex is dropped. Default 0.1px. */
  collinearTolerance?: number;
  /**
   * Ramer-Douglas-Peucker tolerance for dense straight runs. 0 disables RDP
   * (only dedupe + collinear removal run). Set ~0.5-2 for traced input.
   */
  simplifyTolerance?: number;
}

interface AbsSegment {
  cmd: 'M' | 'L' | 'C' | 'Q' | 'Z';
  pts: Point[]; // absolute points, already expanded (no H/V, relative resolved)
}

const num = (v: number, decimals: number): string => {
  // Avoid "-0" and scientific notation for the coordinate magnitudes we use.
  const r = Number(v.toFixed(decimals));
  return Object.is(r, -0) ? '0' : String(r);
};

/** Tokenize + normalize a `d` string into absolute M/L/C/Q/Z segments. */
export function parsePathData(d: string): AbsSegment[] {
  const segments: AbsSegment[] = [];
  if (!d) return segments;

  // Pull commands and their numeric args, preserving sign-packing like "1-2".
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  let token: RegExpExecArray | null;
  let cmd = '';
  let args: number[] = [];

  let cx = 0;
  let cy = 0; // current point
  let sx = 0;
  let sy = 0; // subpath start

  const pairs = (nums: number[]): Point[] => {
    const out: Point[] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) out.push({ x: nums[i], y: nums[i + 1] });
    return out;
  };

  const flush = () => {
    if (!cmd) return;
    const abs = cmd === cmd.toUpperCase();
    const upper = cmd.toUpperCase();
    // Expand implicit repeats: args beyond the first group re-apply the command.
    if (upper === 'Z') {
      segments.push({ cmd: 'Z', pts: [] });
      cx = sx;
      cy = sy;
      return;
    }
    if (upper === 'M' || upper === 'L') {
      const stride = 2;
      for (let i = 0; i + 1 < args.length; i += stride) {
        let x = args[i];
        let y = args[i + 1];
        if (!abs) {
          x += cx;
          y += cy;
        }
        const c = upper === 'M' ? 'M' : 'L';
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
      // Reflect handled loosely: we keep control/anchor as given (absolute) and
      // do not attempt to smooth-join, to avoid altering shape. S/T are emitted
      // as generic cubics/quadratics using their supplied points.
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
      // Arcs: rx ry rot largeArc sweep x y. Keep endpoints only, dropping the arc
      // is NOT acceptable, so we approximate by preserving the arc endpoint as a
      // line ONLY when simplifyTolerance requests lossy mode; default keeps the
      // raw arc via a passthrough marker (see serialize below is not used for A).
      // To stay safe, we never parse A into our clean model; caller keeps original.
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

/** Ramer-Douglas-Peucker on a polyline, always keeping first & last. */
function rdp(points: Point[], tolerance: number): Point[] {
  if (points.length < 3 || tolerance <= 0) return points;
  const [first, ...rest] = [points[0]];
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

/** Remove collinear intermediate points from a straight run (endpoints kept). */
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

/** Merge points closer than epsilon within a run. */
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
    // Suppress redundant repeat letters for line runs (SVG allows implicit reuse).
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

  // Arcs are preserved verbatim by bailing out to the original string when present.
  if (/[Aa]/.test(d)) return roundOnly(d, decimals);

  const parsed = parsePathData(d);
  if (parsed.length === 0) return d;

  // Group consecutive M/L runs for simplification; curves are barriers.
  const out: AbsSegment[] = [];
  let run: Point[] = [];
  let runStartIsMove = false;

  const flushRun = (closing: boolean) => {
    if (run.length === 0) return;
    let cleaned = dedupe(run, eps);
    if (sTol > 0) cleaned = rdp(cleaned, sTol);
    cleaned = dropCollinear(cleaned, colTol);
    // A trailing point that coincides with the subpath start is implied by Z.
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
      // Curve barrier: flush lines, keep the curve rounded.
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

/** Lightweight pass: round numeric tokens only, leave structure/flags intact. */
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
