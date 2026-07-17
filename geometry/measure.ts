import { Point } from './bezier';
import { BBox, boundingBox } from './bounding';

export interface Segment {
  points: Point[];
  closed?: boolean;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function pathLength(segments: Segment[]): number {
  let total = 0;
  for (const seg of segments) {
    const pts = seg.points;
    for (let i = 0; i < pts.length - 1; i++) total += dist(pts[i], pts[i + 1]);
    if (seg.closed && pts.length > 2) total += dist(pts[pts.length - 1], pts[0]);
  }
  return total;
}

export function bezierPathLength(points: Point[], closed = false, steps = 24): number {
  if (points.length < 2) return 0;
  let length = 0,
    prev = points[0];
  const walk = (a: Point, b: Point) => {
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const pt = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
      length += dist(prev, pt);
      prev = pt;
    }
  };
  for (let i = 1; i < points.length; i++) walk(points[i - 1], points[i]);
  if (closed) walk(points[points.length - 1], points[0]);
  return length;
}

export function pathArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function centroid(points: Point[]): Point {
  if (!points.length) return { x: 0, y: 0 };
  let sx = 0,
    sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}
