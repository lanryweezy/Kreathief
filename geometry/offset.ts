import { VectorPath, VectorPoint } from '../types';
import { VectorUtils } from '../utils/vectorUtils';

/**
 * Offset (expand/contract) a path by a given distance
 * Moves each point perpendicular to the path direction
 */
export function offsetPath(path: VectorPath, distance: number): VectorPath {
  if (path.points.length < 2) return path;

  const offsetPoints: VectorPoint[] = [];

  for (let i = 0; i < path.points.length; i++) {
    const point = path.points[i];
    if (!point) continue;

    let normalX = 0;
    let normalY = 0;
    let count = 0;

    // Calculate normal from previous segment
    if (i > 0) {
      const prev = path.points[i - 1];
      if (prev) {
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          normalX += -dy / len;
          normalY += dx / len;
          count++;
        }
      }
    }

    // Calculate normal from next segment
    if (i < path.points.length - 1) {
      const next = path.points[i + 1];
      if (next) {
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          normalX += -dy / len;
          normalY += dx / len;
          count++;
        }
      }
    }

    // For closed paths, wrap around
    if (path.isClosed) {
      if (i === 0 && path.points.length > 2) {
        const last = path.points[path.points.length - 1];
        const first = path.points[0];
        if (last && first) {
          const dx = first.x - last.x;
          const dy = first.y - last.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0 && count < 2) {
            normalX += -dy / len;
            normalY += dx / len;
            count++;
          }
        }
      }
      if (i === path.points.length - 1 && path.points.length > 2) {
        const secondLast = path.points[path.points.length - 2];
        const last = path.points[path.points.length - 1];
        if (secondLast && last) {
          const dx = last.x - secondLast.x;
          const dy = last.y - secondLast.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0 && count < 2) {
            normalX += -dy / len;
            normalY += dx / len;
            count++;
          }
        }
      }
    }

    // Average the normals
    if (count > 0) {
      normalX /= count;
      normalY /= count;
      // Normalize
      const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);
      if (normalLen > 0) {
        normalX /= normalLen;
        normalY /= normalLen;
      }
    }

    // Apply offset along the normal
    const newPoint = VectorUtils.createPoint(point.x + normalX * distance, point.y + normalY * distance, point.type);

    // Preserve handles (adjusted by offset)
    if (point.handleIn) {
      newPoint.handleIn = { x: point.handleIn.x, y: point.handleIn.y };
    }
    if (point.handleOut) {
      newPoint.handleOut = { x: point.handleOut.x, y: point.handleOut.y };
    }
    if (point.isMove) {
      newPoint.isMove = true;
    }

    offsetPoints.push(newPoint);
  }

  return {
    points: offsetPoints,
    isClosed: path.isClosed,
  };
}

/**
 * Convert stroke to outline (expand stroke into a filled path)
 * Creates a polygon along the stroke path oriented in the stroke direction
 */
export function strokeToPath(path: VectorPath, strokeWidth: number): VectorPath {
  if (path.points.length < 2 || strokeWidth <= 0) return path;

  const halfWidth = strokeWidth / 2;
  const leftPoints: VectorPoint[] = [];
  const rightPoints: VectorPoint[] = [];

  for (let i = 0; i < path.points.length; i++) {
    const point = path.points[i];
    if (!point) continue;

    let tangentX = 0;
    let tangentY = 0;

    if (i < path.points.length - 1) {
      const next = path.points[i + 1];
      if (next) {
        tangentX = next.x - point.x;
        tangentY = next.y - point.y;
      }
    } else if (i > 0) {
      const prev = path.points[i - 1];
      if (prev) {
        tangentX = point.x - prev.x;
        tangentY = point.y - prev.y;
      }
    }

    const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (tangentLen > 0) {
      tangentX /= tangentLen;
      tangentY /= tangentLen;
    }

    const normalX = -tangentY;
    const normalY = tangentX;

    const leftPoint = VectorUtils.createPoint(point.x + normalX * halfWidth, point.y + normalY * halfWidth, 'sharp');
    const rightPoint = VectorUtils.createPoint(point.x - normalX * halfWidth, point.y - normalY * halfWidth, 'sharp');

    leftPoints.push(leftPoint);
    rightPoints.push(rightPoint);
  }

  const combinedPoints = [...leftPoints, ...rightPoints.reverse()];

  return {
    points: combinedPoints,
    isClosed: true,
  };
}
