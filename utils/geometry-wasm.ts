/**
 * Rust/WASM Geometry & Snapping Engine
 * Dynamic import with JS fallbacks for when WASM isn't available (CI, Vercel build).
 */

export interface Point {
  x: number;
  y: number;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

let wasmMod: any = null;
let loadAttempted = false;

async function loadWasm() {
  if (loadAttempted) return;
  loadAttempted = true;
  wasmMod = null;
}

export async function initEngine(): Promise<void> {
  await loadWasm();
}

// ─── JS Fallbacks ──────────────────────────────────────────────

function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function jsBoundingBox(points: Point[]): BBox {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function flattenPoints(points: Point[]): Float64Array {
  const flat = new Float64Array(points.length * 2);
  for (let i = 0; i < points.length; i++) {
    flat[i * 2] = points[i].x;
    flat[i * 2 + 1] = points[i].y;
  }
  return flat;
}

// ─── Geometry functions (WASM with JS fallback) ────────────────

export function pointOnCurve(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  if (wasmMod) {
    const r = wasmMod.point_on_curve(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, t);
    return { x: r.x, y: r.y };
  }
  return cubicBezier(p0, p1, p2, p3, t);
}

export function curveLength(p0: Point, p1: Point, p2: Point, p3: Point, segments = 32): number {
  if (wasmMod) {
    return wasmMod.curve_length(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, segments);
  }
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= segments; i++) {
    const cur = cubicBezier(p0, p1, p2, p3, i / segments);
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    len += Math.sqrt(dx * dx + dy * dy);
    prev = cur;
  }
  return len;
}

export function splitCurve(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): [Point, Point, Point, Point, Point, Point, Point, Point] {
  if (wasmMod) {
    const r = wasmMod.split_curve(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, t);
    return [
      { x: r[0], y: r[1] },
      { x: r[2], y: r[3] },
      { x: r[4], y: r[5] },
      { x: r[6], y: r[7] },
      { x: r[8], y: r[9] },
      { x: r[10], y: r[11] },
      { x: r[12], y: r[13] },
      { x: r[14], y: r[15] },
    ];
  }
  const q0 = cubicBezier(p0, p1, p2, p3, t);
  return [
    p0,
    { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 },
    { x: (q0.x + p2.x) / 2, y: (q0.y + p2.y) / 2 },
    q0,
    q0,
    { x: (q0.x + p2.x) / 2, y: (q0.y + p2.y) / 2 },
    { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 },
    p3,
  ];
}

export function boundingBox(points: Point[]): BBox {
  if (wasmMod) {
    return wasmMod.bounding_box(flattenPoints(points));
  }
  return jsBoundingBox(points);
}

export function boundingBoxUnion(a: BBox, b: BBox): BBox {
  if (wasmMod) return wasmMod.bounding_box_union(a, b);
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

export function pointInBox(p: Point, box: BBox, padding = 0): boolean {
  if (wasmMod) return wasmMod.point_in_box(p.x, p.y, box.x, box.y, box.width, box.height, padding);
  return (
    p.x >= box.x - padding &&
    p.x <= box.x + box.width + padding &&
    p.y >= box.y - padding &&
    p.y <= box.y + box.height + padding
  );
}

export function boxesOverlap(a: BBox, b: BBox): boolean {
  if (wasmMod) return wasmMod.boxes_overlap(a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height);
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function lineLineIntersect(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  if (wasmMod) {
    const r = wasmMod.line_line_intersect(a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y);
    return r.length === 2 ? { x: r[0], y: r[1] } : null;
  }
  const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
  if (Math.abs(d) < 1e-10) return null;
  const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
  const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a1.x + t * (a2.x - a1.x), y: a1.y + t * (a2.y - a1.y) };
}

export function curveLineIntersect(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  a: Point,
  b: Point,
  segments = 24
): Point[] {
  if (wasmMod) {
    const r = wasmMod.curve_line_intersect(
      p0.x,
      p0.y,
      p1.x,
      p1.y,
      p2.x,
      p2.y,
      p3.x,
      p3.y,
      a.x,
      a.y,
      b.x,
      b.y,
      segments
    );
    const pts: Point[] = [];
    for (let i = 0; i < r.length; i += 2) pts.push({ x: r[i], y: r[i + 1] });
    return pts;
  }
  const pts: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const c0 = cubicBezier(p0, p1, p2, p3, t0);
    const c1 = cubicBezier(p0, p1, p2, p3, t1);
    const hit = lineLineIntersect(c0, c1, a, b);
    if (hit) pts.push(hit);
  }
  return pts;
}

export function pathLength(segments: { points: Point[]; closed?: boolean }[]): number {
  if (wasmMod) {
    let total = 0;
    for (const seg of segments) total += wasmMod.path_length(flattenPoints(seg.points), seg.closed || false);
    return total;
  }
  let total = 0;
  for (const seg of segments) {
    for (let i = 1; i < seg.points.length; i++) {
      const dx = seg.points[i].x - seg.points[i - 1].x;
      const dy = seg.points[i].y - seg.points[i - 1].y;
      total += Math.sqrt(dx * dx + dy * dy);
    }
  }
  return total;
}

export function pathArea(points: Point[]): number {
  if (wasmMod) return wasmMod.path_area(flattenPoints(points));
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function centroid(points: Point[]): Point {
  if (wasmMod) {
    const r = wasmMod.centroid(flattenPoints(points));
    return { x: r[0], y: r[1] };
  }
  let cx = 0,
    cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / points.length, y: cy / points.length };
}

// ─── Snapping Oracle ───────────────────────────────────────────

export interface SnapLine {
  type: 'vertical' | 'horizontal';
  value: number;
  origin: number;
  extent: number;
}

export interface SnapResult {
  x: number | null;
  y: number | null;
  lines: SnapLine[];
}

interface LayerLike {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  locked?: boolean;
  visible?: boolean;
  groupId?: string;
}

interface ArtboardLike {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

let oracle: any = null;

export function calculateSnaps(
  movingLayers: LayerLike[],
  allLayers: LayerLike[],
  activeArtboard: ArtboardLike,
  threshold = 5,
  _zoom = 1
): SnapResult {
  const result: SnapResult = { x: null, y: null, lines: [] };
  if (movingLayers.length === 0) return result;

  if (!wasmMod) return result;

  if (!oracle) oracle = new wasmMod.SnappingOracle();

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const l of movingLayers) {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x + (l.width || 0));
    maxY = Math.max(maxY, l.y + (l.height || 0));
  }

  const movingIds = new Set(movingLayers.map((l) => l.id));
  const layerData = new Float64Array(allLayers.length * 8);
  const movingIdxs: number[] = [];

  for (let i = 0; i < allLayers.length; i++) {
    const l = allLayers[i];
    const base = i * 8;
    layerData[base] = l.x;
    layerData[base + 1] = l.y;
    layerData[base + 2] = l.width || 0;
    layerData[base + 3] = l.height || 0;
    layerData[base + 4] = 0;
    layerData[base + 5] = l.locked ? 1 : 0;
    layerData[base + 6] = l.visible === false ? 0 : 1;
    layerData[base + 7] = l.groupId ? 1 : 0;
    if (movingIds.has(l.id)) movingIdxs.push(i);
  }

  oracle.build_targets(
    layerData,
    new Uint32Array(movingIdxs),
    activeArtboard.x,
    activeArtboard.y,
    activeArtboard.width,
    activeArtboard.height
  );
  const snapResult = oracle.calculate_snaps(minX, minY, maxX, maxY, threshold);

  if (!isNaN(snapResult[0])) result.x = snapResult[0];
  if (!isNaN(snapResult[1])) result.y = snapResult[1];

  let offset = 2;
  if (!isNaN(snapResult[0]) && offset + 3 <= snapResult.length) {
    result.lines.push({
      type: 'vertical',
      value: snapResult[offset + 1],
      origin: snapResult[offset + 2],
      extent: snapResult[offset + 3],
    });
    offset += 4;
  }
  if (!isNaN(snapResult[1]) && offset + 3 <= snapResult.length) {
    result.lines.push({
      type: 'horizontal',
      value: snapResult[offset + 1],
      origin: snapResult[offset + 2],
      extent: snapResult[offset + 3],
    });
  }

  return result;
}

export function invalidateSnappingCache(): void {
  oracle = null;
}
