import { Point } from './bezier';

export function lineLineIntersect(
  a1: Point, a2: Point, b1: Point, b2: Point,
): Point | null {
  const d1x = a2.x - a1.x;
  const d1y = a2.y - a1.y;
  const d2x = b2.x - b1.x;
  const d2y = b2.y - b1.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;

  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;

  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a1.x + t * d1x, y: a1.y + t * d1y };
}

export function curveLineIntersect(
  p0: Point, p1: Point, p2: Point, p3: Point,
  a: Point, b: Point,
  segments = 24,
): Point[] {
  const results: Point[] = [];
  let prev = p0;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    const u2 = u * u;
    const u3 = u2 * u;
    const t2 = t * t;
    const t3 = t2 * t;
    const curr: Point = {
      x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
      y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
    };
    const hit = lineLineIntersect(prev, curr, a, b);
    if (hit) results.push(hit);
    prev = curr;
  }
  return results;
}
