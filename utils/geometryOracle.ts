import { Layer, TextLayer } from '../types';
import { log } from './log';

export class GeometryOracle {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  private static getContext() {
    if (!this.ctx) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
    return this.ctx;
  }

  /**
   * Measures precise text dimensions including ascent/descent
   */
  static measureText(layer: TextLayer): { width: number; height: number; ascent: number; descent: number } {
    const ctx = this.getContext();
    if (!ctx) {
      return { width: layer.width, height: layer.fontSize, ascent: layer.fontSize, descent: 0 };
    }

    ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
    const metrics = ctx.measureText(layer.text);

    // In modern browsers, we have actualBoundingBoxAscent/Descent
    const ascent = metrics.actualBoundingBoxAscent || layer.fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || layer.fontSize * 0.2;
    const width = metrics.width;
    const height = ascent + descent;

    return { width, height, ascent, descent };
  }

  private static svgPath: SVGPathElement | null = null;

  private static getPathElement(): SVGPathElement {
    if (!this.svgPath && typeof document !== 'undefined') {
      this.svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    }
    return this.svgPath as SVGPathElement;
  }

  /**
   * Measures path length and provides point-at-distance calculation using invisible SVG element
   */
  static measurePath(pathData: string) {
    const path = this.getPathElement();
    if (!path) {
      return { totalLength: 0, getPointAt: (_d: number) => ({ x: 0, y: 0, angle: 0 }) };
    }

    path.setAttribute('d', pathData);
    let totalLength = 0;
    try {
      totalLength = path.getTotalLength();
    } catch (e) {
      log.error('Invalid path data for measurement', e);
      return { totalLength: 0, getPointAt: (_d: number) => ({ x: 0, y: 0, angle: 0 }) };
    }

    return {
      totalLength,
      getPointAt: (distance: number) => {
        const point = path.getPointAtLength(Math.max(0, Math.min(distance, totalLength)));
        // To get tangent angle, sample a tiny bit ahead
        // For very last point, sample a bit behind
        let nextPoint = point;
        if (distance < totalLength) {
          nextPoint = path.getPointAtLength(Math.max(0, Math.min(distance + 0.1, totalLength)));
        } else {
          const prevPoint = path.getPointAtLength(Math.max(0, distance - 0.1));
          const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
          return { x: point.x, y: point.y, angle };
        }

        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
        return { x: point.x, y: point.y, angle };
      },
    };
  }

  /**
   * Calculates the axis-aligned bounding box (AABB) of a layer after all transforms (rotation, scale, skew)
   */
  static getTransformationBounds(layer: Layer) {
    const { x, y, width, rotation } = layer;
    const height = (layer as any).height || (layer.type === 'text' ? layer.fontSize : 0);

    // 1. Get local corner points
    const p1 = { x: 0, y: 0 };
    const p2 = { x: width, y: 0 };
    const p3 = { x: width, y: height };
    const p4 = { x: 0, y: height };

    // 2. Build transformation matrix
    // Pivot is usually center for rotation in design tools, but Kreathief might use top-left.
    // Looking at Canvas.tsx, it uses 'left' and 'top' for position and 'rotate()' which defaults to center if origin is set.
    // However, the CSS 'transform' on the div with 'absolute' position usually rotates around center if 'transform-origin' isn't changed.
    // Looking at Canvas.tsx: origin-center is set on the container, but items don't explicitly set it.
    // Standard CSS transform-origin is 50% 50%.

    const centerX = width / 2;
    const centerY = height / 2;

    const corners = [p1, p2, p3, p4].map((p) => {
      // Translate to origin (relative to center)
      const rx = p.x - centerX;
      const ry = p.y - centerY;

      // Rotate
      const rad = (rotation * Math.PI) / 180;
      const tx = rx * Math.cos(rad) - ry * Math.sin(rad);
      const ty = rx * Math.sin(rad) + ry * Math.cos(rad);

      // Skew (if applicable)
      const skewXRad = (((layer as any).skewX || 0) * Math.PI) / 180;
      const skewYRad = (((layer as any).skewY || 0) * Math.PI) / 180;
      const finalX = tx + ty * Math.tan(skewXRad);
      const finalY = ty + tx * Math.tan(skewYRad);

      // Translate back and add layer x, y
      return {
        x: finalX + centerX + x,
        y: finalY + centerY + y,
      };
    });

    const minX = Math.min(...corners.map((c) => c.x));
    const minY = Math.min(...corners.map((c) => c.y));
    const maxX = Math.max(...corners.map((c) => c.x));
    const maxY = Math.max(...corners.map((c) => c.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      corners, // useful for custom handles
    };
  }

  /**
   * Static helper for group bounds
   */
  static getGroupBounds(layers: Layer[]) {
    if (layers.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // ⚡ Bolt Optimization: Calculate bounds in a single pass rather than multiple map/Math.min/max passes.
    // This reduces O(N) allocations and loop overhead by iterating through bounds only once.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < layers.length; i++) {
      const b = this.getTransformationBounds(layers[i]);
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
