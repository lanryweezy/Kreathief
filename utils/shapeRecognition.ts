/**
 * Shape Recognition Utility
 *
 * Detects geometric shapes from freehand drawn points.
 * Used for shape-snapping: when a user draws a rough shape and holds,
 * this classifier determines if it's a circle, rectangle, triangle, or line.
 */

interface Point {
  x: number;
  y: number;
}

interface ShapeResult {
  type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'none';
  confidence: number;
  /** SVG path data for the recognized perfect shape */
  pathData: string;
  /** Bounding box of the recognized shape */
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * Douglas-Peucker simplification to find dominant corners.
 */
function rdpSimplifyForCorners(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) {
    return points;
  }

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplifyForCorners(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplifyForCorners(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLenSq = dx * dx + dy * dy;

  if (lineLenSq === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  return num / Math.sqrt(lineLenSq);
}

/**
 * Compute the bounding box of a set of points.
 */
function getBounds(points: Point[]): { x: number; y: number; width: number; height: number; cx: number; cy: number } {
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
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

/**
 * Check if the path is roughly closed (start ≈ end).
 */
function isClosed(points: Point[], threshold: number): boolean {
  if (points.length < 3) {
    return false;
  }
  const start = points[0];
  const end = points[points.length - 1];
  return Math.hypot(end.x - start.x, end.y - start.y) < threshold;
}

/**
 * Detect if the drawn points form a straight line.
 */
function detectLine(points: Point[]): { confidence: number; pathData: string; bounds: ReturnType<typeof getBounds> } {
  if (points.length < 2) {
    return { confidence: 0, pathData: '', bounds: getBounds(points) };
  }

  const start = points[0];
  const end = points[points.length - 1];
  const lineLen = Math.hypot(end.x - start.x, end.y - start.y);

  if (lineLen < 10) {
    return { confidence: 0, pathData: '', bounds: getBounds(points) };
  }

  // Calculate max perpendicular distance from the start→end line
  let maxDev = 0;
  for (const p of points) {
    const dev = perpendicularDistance(p, start, end);
    maxDev = Math.max(maxDev, dev);
  }

  // Confidence: lower deviation = higher confidence
  const deviationRatio = maxDev / lineLen;
  const confidence = Math.max(0, 1 - deviationRatio * 5);

  const bounds = getBounds([start, end]);
  const pathData = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;

  return { confidence, pathData, bounds };
}

/**
 * Detect if the drawn points form a circle/ellipse.
 */
function detectCircle(points: Point[]): { confidence: number; pathData: string; bounds: ReturnType<typeof getBounds> } {
  if (points.length < 8) {
    return { confidence: 0, pathData: '', bounds: getBounds(points) };
  }

  const bounds = getBounds(points);
  const cx = bounds.cx;
  const cy = bounds.cy;
  const rx = bounds.width / 2;
  const ry = bounds.height / 2;

  if (rx < 5 || ry < 5) {
    return { confidence: 0, pathData: '', bounds };
  }

  // Calculate mean deviation from the fitted ellipse
  let totalDev = 0;
  for (const p of points) {
    const normX = (p.x - cx) / rx;
    const normY = (p.y - cy) / ry;
    const distFromEllipse = Math.abs(Math.sqrt(normX * normX + normY * normY) - 1);
    totalDev += distFromEllipse;
  }

  const meanDev = totalDev / points.length;
  // Confidence: lower deviation from ellipse = higher confidence
  const confidence = Math.max(0, 1 - meanDev * 3);

  // Generate SVG ellipse path using two arcs
  const pathData =
    `M ${(cx - rx).toFixed(2)} ${cy.toFixed(2)} ` +
    `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 1 ${(cx + rx).toFixed(2)} ${cy.toFixed(2)} ` +
    `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 1 ${(cx - rx).toFixed(2)} ${cy.toFixed(2)} Z`;

  return { confidence, pathData, bounds };
}

/**
 * Detect if the drawn points form a rectangle.
 */
function detectRectangle(points: Point[]): {
  confidence: number;
  pathData: string;
  bounds: ReturnType<typeof getBounds>;
} {
  if (points.length < 8) {
    return { confidence: 0, pathData: '', bounds: getBounds(points) };
  }

  const bounds = getBounds(points);
  if (bounds.width < 10 || bounds.height < 10) {
    return { confidence: 0, pathData: '', bounds };
  }

  // Use Douglas-Peucker to find dominant corners
  const epsilon = Math.max(bounds.width, bounds.height) * 0.08;
  const simplified = rdpSimplifyForCorners(points, epsilon);

  // For a rectangle, we expect 4-5 dominant points (corners + possible repeat of start)
  if (simplified.length < 4 || simplified.length > 6) {
    // Fall back to bounding box fit assessment
    let totalDistToBounds = 0;
    for (const p of points) {
      // Distance from point to nearest edge of bounding box
      const dLeft = Math.abs(p.x - bounds.x);
      const dRight = Math.abs(p.x - (bounds.x + bounds.width));
      const dTop = Math.abs(p.y - bounds.y);
      const dBottom = Math.abs(p.y - (bounds.y + bounds.height));
      totalDistToBounds += Math.min(dLeft, dRight, dTop, dBottom);
    }
    const meanDist = totalDistToBounds / points.length;
    const confidence = Math.max(0, 1 - (meanDist / Math.max(bounds.width, bounds.height)) * 4);

    const { x, y, width, height } = bounds;
    const pathData = `M ${x.toFixed(2)} ${y.toFixed(2)} L ${(x + width).toFixed(2)} ${y.toFixed(2)} L ${(x + width).toFixed(2)} ${(y + height).toFixed(2)} L ${x.toFixed(2)} ${(y + height).toFixed(2)} Z`;

    return { confidence: confidence * 0.85, pathData, bounds };
  }

  // Check that corners are roughly at 90° angles
  const corners = simplified.slice(0, 4);
  let angleDeviation = 0;
  for (let i = 0; i < corners.length; i++) {
    const prev = corners[(i + corners.length - 1) % corners.length];
    const curr = corners[i];
    const next = corners[(i + 1) % corners.length];
    const angle = Math.abs(Math.atan2(next.y - curr.y, next.x - curr.x) - Math.atan2(prev.y - curr.y, prev.x - curr.x));
    const normalizedAngle = Math.abs(angle % Math.PI);
    angleDeviation += Math.abs(normalizedAngle - Math.PI / 2);
  }
  const avgAngleDev = angleDeviation / corners.length;
  const confidence = Math.max(0, 1 - avgAngleDev * 2);

  const { x, y, width, height } = bounds;
  const pathData = `M ${x.toFixed(2)} ${y.toFixed(2)} L ${(x + width).toFixed(2)} ${y.toFixed(2)} L ${(x + width).toFixed(2)} ${(y + height).toFixed(2)} L ${x.toFixed(2)} ${(y + height).toFixed(2)} Z`;

  return { confidence, pathData, bounds };
}

/**
 * Detect if the drawn points form a triangle.
 */
function detectTriangle(points: Point[]): {
  confidence: number;
  pathData: string;
  bounds: ReturnType<typeof getBounds>;
} {
  if (points.length < 6) {
    return { confidence: 0, pathData: '', bounds: getBounds(points) };
  }

  const bounds = getBounds(points);
  if (bounds.width < 10 || bounds.height < 10) {
    return { confidence: 0, pathData: '', bounds };
  }

  // Use Douglas-Peucker to find 3 dominant corners
  const epsilon = Math.max(bounds.width, bounds.height) * 0.12;
  const simplified = rdpSimplifyForCorners(points, epsilon);

  if (simplified.length < 3 || simplified.length > 5) {
    return { confidence: 0, pathData: '', bounds };
  }

  // Take the 3 most spread-out points as triangle vertices
  const corners = simplified.slice(0, 3);

  // Calculate how well the original points fit along the triangle edges
  let totalDist = 0;
  for (const p of points) {
    let minDist = Infinity;
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      const dist = pointToSegmentDist(p, a, b);
      minDist = Math.min(minDist, dist);
    }
    totalDist += minDist;
  }
  const meanDist = totalDist / points.length;
  const diag = Math.hypot(bounds.width, bounds.height);
  const confidence = Math.max(0, 1 - (meanDist / diag) * 8);

  const pathData = `M ${corners[0].x.toFixed(2)} ${corners[0].y.toFixed(2)} L ${corners[1].x.toFixed(2)} ${corners[1].y.toFixed(2)} L ${corners[2].x.toFixed(2)} ${corners[2].y.toFixed(2)} Z`;

  return { confidence, pathData, bounds };
}

function pointToSegmentDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Main shape recognition entry point.
 * Analyzes drawn points and returns the best matching geometric shape.
 *
 * @param points - Array of {x, y} coordinates from freehand drawing
 * @param closureThreshold - Distance threshold for considering the path closed
 * @returns ShapeResult with the recognized shape type, confidence, and perfect SVG path
 */
export function recognizeShape(points: Point[], closureThreshold = 30): ShapeResult {
  if (points.length < 3) {
    return { type: 'none', confidence: 0, pathData: '', bounds: { x: 0, y: 0, width: 0, height: 0 } };
  }

  const bounds = getBounds(points);
  const closed = isClosed(points, closureThreshold);

  // Always try line detection (doesn't require closure)
  const lineResult = detectLine(points);

  // Only try closed shapes if the path is approximately closed
  let circleResult = { confidence: 0, pathData: '', bounds };
  let rectResult = { confidence: 0, pathData: '', bounds };
  let triResult = { confidence: 0, pathData: '', bounds };

  if (closed) {
    circleResult = detectCircle(points);
    rectResult = detectRectangle(points);
    triResult = detectTriangle(points);
  }

  // Pick the best match above the confidence threshold (0.65)
  const candidates: { type: ShapeResult['type']; confidence: number; pathData: string; bounds: typeof bounds }[] = [
    { type: 'line', ...lineResult },
    { type: 'circle', ...circleResult },
    { type: 'rectangle', ...rectResult },
    { type: 'triangle', ...triResult },
  ];

  candidates.sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0];
  if (best.confidence >= 0.65) {
    return {
      type: best.type,
      confidence: best.confidence,
      pathData: best.pathData,
      bounds: { x: best.bounds.x, y: best.bounds.y, width: best.bounds.width, height: best.bounds.height },
    };
  }

  return {
    type: 'none',
    confidence: 0,
    pathData: '',
    bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
  };
}
