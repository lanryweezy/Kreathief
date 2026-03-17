import paper from 'paper/dist/paper-core';
import { VectorPath } from '../types';
import { VectorUtils } from './vectorUtils';

let paperInitialized = false;

function initPaper() {
  if (!paperInitialized) {
    // Size doesn't matter for pure vector math
    paper.setup(new paper.Size(1, 1));
    paperInitialized = true;
  }
}

export class BooleanOperations {
  /**
   * Run a Paper.js boolean operation
   */
  private static runBoolean(pathA: VectorPath, pathB: VectorPath, operation: 'unite' | 'subtract' | 'intersect' | 'exclude'): VectorPath {
    initPaper();
    
    // Import SVG data into Paper.js
    const svgA = `<svg><path d="${VectorUtils.serializePath(pathA)}" /></svg>`;
    const svgB = `<svg><path d="${VectorUtils.serializePath(pathB)}" /></svg>`;
    
    const groupA = paper.project.importSVG(svgA) as paper.Group;
    const groupB = paper.project.importSVG(svgB) as paper.Group;
    
    // Extract paths from groups
    const itemA = groupA.children[0] as paper.PathItem;
    const itemB = groupB.children[0] as paper.PathItem;
    
    if (!itemA || !itemB) {
      if (groupA) {groupA.remove();}
      if (groupB) {groupB.remove();}
      return pathA;
    }
    
    // Perform operation
    const result = itemA[operation](itemB);
    
    // Convert resulting PathItem to SVG path data string
    const resultSvgString = result.exportSVG({ asString: true }) as string;
    
    // Clean up memory
    groupA.remove();
    groupB.remove();
    itemA.remove();
    itemB.remove();
    result.remove();
    
    // Extract 'd' attribute using a simple regex since it's an isolated shape
    const match = resultSvgString.match(/d="([^"]+)"/);
    if (!match || !match[1]) {
      return pathA; 
    }
    
    // Parse it back to our unified VectorPath format (now with sub-path support via isMove)
    return VectorUtils.parsePath(match[1]);
  }

  static union(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'unite');
  }

  static subtract(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'subtract');
  }

  static intersect(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'intersect');
  }

  static exclude(pathA: VectorPath, pathB: VectorPath): VectorPath {
    return this.runBoolean(pathA, pathB, 'exclude');
  }

  /**
   * Flattens a Bézier path into a series of line segments with adaptive sampling
   */
  static flatten(path: VectorPath, _tolerance = 1.0): { x: number; y: number }[] {
    if (path.points.length === 0) {return [];}
    const flattened: { x: number; y: number }[] = [];

    for (let i = 0; i < path.points.length; i++) {
      const p1 = path.points[i];
      const p2 = path.points[(i + 1) % path.points.length];

      if (i === path.points.length - 1 && !path.isClosed) {
        flattened.push({ x: p1.x, y: p1.y });
        break;
      }

      if (p1.handleOut || p2.handleIn) {
        const cp1 = p1.handleOut ? { x: p1.x + p1.handleOut.x, y: p1.y + p1.handleOut.y } : { x: p1.x, y: p1.y };
        const cp2 = p2.handleIn ? { x: p2.x + p2.handleIn.x, y: p2.y + p2.handleIn.y } : { x: p2.x, y: p2.y };
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const steps = Math.max(10, Math.min(50, Math.floor(dist / 5)));

        for (let t = 0; t < steps; t++) {
          const ratio = t / steps;
          const x = this.cubicBezier(p1.x, cp1.x, cp2.x, p2.x, ratio);
          const y = this.cubicBezier(p1.y, cp1.y, cp2.y, p2.y, ratio);
          flattened.push({ x, y });
        }
      } else {
        flattened.push({ x: p1.x, y: p1.y });
      }
    }
    return flattened;
  }

  private static cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  static isPointInPath(point: { x: number; y: number }, path: VectorPath): boolean {
    const poly = this.flatten(path);
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) {inside = !inside;}
    }
    return inside;
  }
}
