export interface Point {
  x: number;
  y: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function pointOnCurve(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

export function splitCurve(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): [Point, Point, Point, Point, Point, Point, Point, Point] {
  const a = { x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) };
  const b = { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
  const c = { x: lerp(p2.x, p3.x, t), y: lerp(p2.y, p3.y, t) };
  const d = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
  const e = { x: lerp(b.x, c.x, t), y: lerp(b.y, c.y, t) };
  const f = { x: lerp(d.x, e.x, t), y: lerp(d.y, e.y, t) };

  return [p0, a, d, f, f, e, c, p3];
}

export function curveLength(p0: Point, p1: Point, p2: Point, p3: Point, segments = 32): number {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= segments; i++) {
    const curr = pointOnCurve(p0, p1, p2, p3, i / segments);
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    length += Math.sqrt(dx * dx + dy * dy);
    prev = curr;
  }
  return length;
}
