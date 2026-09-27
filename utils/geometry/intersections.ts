import { Point } from '../../geometry/bezier';

/**
 * Basic Line Segment
 */
export interface Segment {
  p1: Point;
  p2: Point;
}

/**
 * Determines if two line segments intersect and returns the intersection point.
 * Uses standard cross-product vector math.
 */
export function getIntersection(s1: Segment, s2: Segment): Point | null {
  const { p1, p2 } = s1;
  const { p1: p3, p2: p4 } = s2;

  const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  
  if (denominator === 0) return null; // Parallel or collinear

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

  // Is the intersection along the segments?
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y)
    };
  }

  return null;
}

/**
 * Naive self-intersection remover for AI-generated paths (O(n^2)).
 * Detects "bowties" in simple polygons and untangles them by inserting the intersection node 
 * and clipping the redundant loops. Crucial for vinyl plotters and laser cutters.
 */
export function removeSelfIntersections(points: Point[]): Point[] {
  if (points.length < 4) return points;
  
  let cleanPoints: Point[] = [points[0]];
  let skipUntil = -1;

  for (let i = 0; i < points.length - 1; i++) {
    if (i < skipUntil) continue;
    
    const currentSeg: Segment = { p1: points[i], p2: points[i + 1] };
    let intersectionFound = false;

    // Check against all future segments (not adjacent)
    for (let j = i + 2; j < points.length - 1; j++) {
      const futureSeg: Segment = { p1: points[j], p2: points[j + 1] };
      const intersect = getIntersection(currentSeg, futureSeg);
      
      if (intersect) {
        // We found a bowtie! 
        // 1. Add current point
        cleanPoints.push(points[i]);
        // 2. Add the mathematical intersection point
        cleanPoints.push(intersect);
        // 3. Skip the entire loop (delete the bowtie)
        skipUntil = j + 1;
        intersectionFound = true;
        break;
      }
    }
    
    if (!intersectionFound && i >= skipUntil) {
      cleanPoints.push(points[i + 1]);
    }
  }

  return cleanPoints;
}
