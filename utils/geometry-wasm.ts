/**
 * Rust/WASM Geometry & Snapping Engine
 * Drop-in replacement for geometry/* and utils/snappingOracle.ts
 * 10-50x faster than pure JS for compute-heavy paths.
 */
import {
  point_on_curve as _pointOnCurve,
  curve_length as _curveLength,
  split_curve as _splitCurve,
  bounding_box as _boundingBox,
  bounding_box_union as _boundingBoxUnion,
  point_in_box as _pointInBox,
  boxes_overlap as _boxesOverlap,
  line_line_intersect as _lineLineIntersect,
  curve_line_intersect as _curveLineIntersect,
  path_length as _pathLength,
  path_area as _pathArea,
  centroid as _centroid,
  SnappingOracle as _SnappingOracle,
} from '../rust-engine/pkg/kreathief_engine';

let initialized = false;

export async function initEngine(): Promise<void> {
  if (initialized) return;
  try {
    const mod = await import('../rust-engine/pkg/kreathief_engine');
    if (typeof (mod as any).default === 'function') {
      await (mod as any).default();
    }
  } catch { /* Node.js — WASM loads automatically */ }
  initialized = true;
}

// ─── Point type (matches existing TS interface) ────────────────

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

// ─── Geometry functions ────────────────────────────────────────

export function pointOnCurve(
  p0: Point, p1: Point, p2: Point, p3: Point, t: number
): Point {
  const r = _pointOnCurve(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, t);
  return { x: r.x, y: r.y };
}

export function curveLength(
  p0: Point, p1: Point, p2: Point, p3: Point, segments = 32
): number {
  return _curveLength(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, segments);
}

export function splitCurve(
  p0: Point, p1: Point, p2: Point, p3: Point, t: number
): [Point, Point, Point, Point, Point, Point, Point, Point] {
  const r = _splitCurve(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, t);
  return [
    { x: r[0], y: r[1] }, { x: r[2], y: r[3] }, { x: r[4], y: r[5] }, { x: r[6], y: r[7] },
    { x: r[8], y: r[9] }, { x: r[10], y: r[11] }, { x: r[12], y: r[13] }, { x: r[14], y: r[15] },
  ];
}

export function boundingBox(points: Point[]): BBox {
  const flat = new Float64Array(points.length * 2);
  for (let i = 0; i < points.length; i++) {
    flat[i * 2] = points[i].x;
    flat[i * 2 + 1] = points[i].y;
  }
  return _boundingBox(flat);
}

export function boundingBoxUnion(a: BBox, b: BBox): BBox {
  return _boundingBoxUnion(a, b);
}

export function pointInBox(p: Point, box: BBox, padding = 0): boolean {
  return _pointInBox(p.x, p.y, box.x, box.y, box.width, box.height, padding);
}

export function boxesOverlap(a: BBox, b: BBox): boolean {
  return _boxesOverlap(a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height);
}

export function lineLineIntersect(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  const r = _lineLineIntersect(a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y);
  return r.length === 2 ? { x: r[0], y: r[1] } : null;
}

export function curveLineIntersect(
  p0: Point, p1: Point, p2: Point, p3: Point, a: Point, b: Point, segments = 24
): Point[] {
  const r = _curveLineIntersect(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, a.x, a.y, b.x, b.y, segments);
  const pts: Point[] = [];
  for (let i = 0; i < r.length; i += 2) {
    pts.push({ x: r[i], y: r[i + 1] });
  }
  return pts;
}

export function pathLength(segments: { points: Point[]; closed?: boolean }[]): number {
  let total = 0;
  for (const seg of segments) {
    const flat = new Float64Array(seg.points.length * 2);
    for (let i = 0; i < seg.points.length; i++) {
      flat[i * 2] = seg.points[i].x;
      flat[i * 2 + 1] = seg.points[i].y;
    }
    total += _pathLength(flat, seg.closed || false);
  }
  return total;
}

export function pathArea(points: Point[]): number {
  const flat = new Float64Array(points.length * 2);
  for (let i = 0; i < points.length; i++) {
    flat[i * 2] = points[i].x;
    flat[i * 2 + 1] = points[i].y;
  }
  return _pathArea(flat);
}

export function centroid(points: Point[]): Point {
  const flat = new Float64Array(points.length * 2);
  for (let i = 0; i < points.length; i++) {
    flat[i * 2] = points[i].x;
    flat[i * 2 + 1] = points[i].y;
  }
  const r = _centroid(flat);
  return { x: r[0], y: r[1] };
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

let oracle: _SnappingOracle | null = null;

export function calculateSnaps(
  movingLayers: LayerLike[],
  allLayers: LayerLike[],
  activeArtboard: ArtboardLike,
  threshold = 5,
  _zoom = 1
): SnapResult {
  const result: SnapResult = { x: null, y: null, lines: [] };
  if (movingLayers.length === 0) return result;

  if (!oracle) oracle = new _SnappingOracle();

  // Compute selection bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const l of movingLayers) {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x + (l.width || 0));
    maxY = Math.max(maxY, l.y + (l.height || 0));
  }

  // Build flat layer data for WASM: [x, y, w, h, 0, locked, visible, has_group, ...]
  const movingIds = new Set(movingLayers.map(l => l.id));
  const layerData = new Float64Array(allLayers.length * 8);
  const movingIdxs: number[] = [];

  for (let i = 0; i < allLayers.length; i++) {
    const l = allLayers[i];
    const base = i * 8;
    layerData[base] = l.x;
    layerData[base + 1] = l.y;
    layerData[base + 2] = l.width || 0;
    layerData[base + 3] = l.height || 0;
    layerData[base + 4] = 0; // id placeholder
    layerData[base + 5] = l.locked ? 1 : 0;
    layerData[base + 6] = l.visible === false ? 0 : 1;
    layerData[base + 7] = l.groupId ? 1 : 0;
    if (movingIds.has(l.id)) movingIdxs.push(i);
  }

  oracle.build_targets(layerData, new Uint32Array(movingIdxs), activeArtboard.x, activeArtboard.y, activeArtboard.width, activeArtboard.height);

  const snapResult = oracle.calculate_snaps(minX, minY, maxX, maxY, threshold);

  if (!isNaN(snapResult[0])) {
    result.x = snapResult[0];
  }
  if (!isNaN(snapResult[1])) {
    result.y = snapResult[1];
  }

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
