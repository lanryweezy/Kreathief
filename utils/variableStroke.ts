import { GeometryOracle } from './geometryOracle';

// Builds an outline polygon path approximating a variable-width stroke along a center path.
// widthFn receives t in [0,1] along path and returns absolute width in px at that point.
const outlineCache = new Map<string, string>();

export function buildVariableStrokeOutline(pathData: string, widthFn: (t: number) => number, samples = 64): string {
  const key = (() => {
    // Attempt to stringify widthFn by sampling a few points
    const probe = [0, 0.25, 0.5, 0.75, 1].map((t) => widthFn(t).toFixed(2)).join(',');
    return `${pathData}::${samples}::${probe}`;
  })();
  if (outlineCache.has(key)) return outlineCache.get(key)!;
  const m = GeometryOracle.measurePath(pathData);
  const total = m.totalLength;
  if (!total || samples < 2) return '';

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
  if (pts.length === 0) return '';
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

