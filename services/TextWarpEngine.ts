import opentype from 'opentype.js';

export type WarpStyle = 'none' | 'arch' | 'flag' | 'rise' | 'wave' | 'bulge';

/**
 * TextWarpEngine applies Bezier envelope distortion to opentype.js font paths
 */
export class TextWarpEngine {
  /**
   * Generates a warped SVG path string for the given text.
   */
  static generateWarpedPath(
    text: string,
    font: opentype.Font,
    fontSize: number,
    warpStyle: WarpStyle,
    amount: number // -1 to 1
  ): string {
    if (!text || !font) {
      return '';
    }

    // Get the base path
    const path = font.getPath(text, 0, 0, fontSize);

    if (warpStyle === 'none' || amount === 0) {
      return path.toPathData(2);
    }

    // Get bounding box of the un-warped text
    const bbox = path.getBoundingBox();
    const width = bbox.x2 - bbox.x1;
    const height = bbox.y2 - bbox.y1;
    const midX = bbox.x1 + width / 2;
    const midY = bbox.y1 + height / 2;

    // Apply distortion to every command in the path
    const warpedPath = new opentype.Path();

    for (const cmd of path.commands) {
      if (cmd.type === 'M' || cmd.type === 'L') {
        const pt = this.warpPoint(cmd.x, cmd.y, bbox, warpStyle, amount, width, height, midX, midY);
        if (cmd.type === 'M') {
          warpedPath.moveTo(pt.x, pt.y);
        } else {
          warpedPath.lineTo(pt.x, pt.y);
        }
      } else if (cmd.type === 'Q') {
        const pt1 = this.warpPoint(cmd.x1, cmd.y1, bbox, warpStyle, amount, width, height, midX, midY);
        const pt2 = this.warpPoint(cmd.x, cmd.y, bbox, warpStyle, amount, width, height, midX, midY);
        warpedPath.quadraticCurveTo(pt1.x, pt1.y, pt2.x, pt2.y);
      } else if (cmd.type === 'C') {
        const pt1 = this.warpPoint(cmd.x1, cmd.y1, bbox, warpStyle, amount, width, height, midX, midY);
        const pt2 = this.warpPoint(cmd.x2, cmd.y2, bbox, warpStyle, amount, width, height, midX, midY);
        const pt3 = this.warpPoint(cmd.x, cmd.y, bbox, warpStyle, amount, width, height, midX, midY);
        warpedPath.curveTo(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y);
      } else if (cmd.type === 'Z') {
        warpedPath.closePath();
      }
    }

    return warpedPath.toPathData(2);
  }

  private static warpPoint(
    x: number,
    y: number,
    bbox: opentype.BoundingBox,
    style: WarpStyle,
    amount: number,
    width: number,
    height: number,
    midX: number,
    midY: number
  ): { x: number; y: number } {
    // Normalize coordinates from 0 to 1
    const nx = (x - bbox.x1) / width;
    const ny = (y - bbox.y1) / height; // 0 is top (usually y1 is negative for text), 1 is bottom

    let newX = x;
    let newY = y;

    // The amount of distortion in pixels
    const magnitude = height * amount;

    switch (style) {
      case 'arch': {
        // Parabola distortion: y offset is highest at center
        // equation: 4 * x * (1 - x) is a parabola that is 0 at x=0,1 and 1 at x=0.5
        const archOffset = 4 * nx * (1 - nx) * magnitude;
        newY = y - archOffset;
        break;
      }

      case 'flag': {
        // Sine wave across the width
        const flagOffset = Math.sin(nx * Math.PI * 2) * magnitude;
        newY = y + flagOffset;
        break;
      }

      case 'rise': {
        // Linear slope
        const riseOffset = nx * magnitude;
        newY = y - riseOffset + magnitude / 2; // Center the rise
        break;
      }

      case 'wave': {
        // Sine wave but also affects X
        const waveY = Math.sin(nx * Math.PI * 1.5) * magnitude;
        newY = y + waveY;
        break;
      }

      case 'bulge': {
        // Fish-eye like bulge in the center
        const distX = Math.abs(nx - 0.5) * 2; // 0 at center, 1 at edges
        const distY = Math.abs(ny - 0.5) * 2;
        const bulge = (1 - distX * distX) * (1 - distY * distY) * magnitude;

        // Push outwards from center
        if (nx < 0.5) {
          newX -= bulge * 0.5;
        } else {
          newX += bulge * 0.5;
        }

        if (ny < 0.5) {
          newY -= bulge * 0.5;
        } else {
          newY += bulge * 0.5;
        }

        break;
      }
    }

    return { x: newX, y: newY };
  }
}
