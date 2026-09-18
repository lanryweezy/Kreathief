import { DesignNode } from '../../types/design';
import { log } from '../../utils/log';

export interface OffscreenExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  scale: number;
  quality: number;
  background: boolean;
  backgroundColor?: string;
}

/**
 * Pure OffscreenCanvas rasterizer designed to run inside Web Workers.
 * This completely decouples rendering from the React DOM tree.
 */
export async function renderToOffscreenCanvas(
  width: number,
  height: number,
  nodes: DesignNode[],
  options: OffscreenExportOptions
): Promise<Blob | null> {
  try {
    // 1. Initialize purely offscreen environment (No DOM access required)
    const canvas = new OffscreenCanvas(width * options.scale, height * options.scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from OffscreenCanvas');
    }

    // 2. Scale context for high-DPI export
    ctx.scale(options.scale, options.scale);

    // 3. Render Background
    if (options.background) {
      ctx.fillStyle = options.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // 4. Iterate and render AST nodes

    for (const node of nodes) {
      if (!node.visible) {
        continue;
      }

      ctx.save();

      // Apply transforms
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      const rotation = node.rotation || 0;

      ctx.translate(x, y);
      if (rotation) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      ctx.globalAlpha = node.opacity !== undefined ? node.opacity : 1;

      // Note: Full mapping requires exact node types, this is the foundational geometry layer
      if (node.type === 'rect') {
        const w = node.dimensions?.width || 100;
        const h = node.dimensions?.height || 100;

        // Handle Fill
        if (typeof node.fill === 'string') {
          ctx.fillStyle = node.fill;
          ctx.fillRect(0, 0, w, h);
        } else if (node.fill && typeof node.fill === 'object') {
          const fillColor = (node.fill as any).color || (node.fill as any).stops?.[0]?.color;
          if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, w, h);
          }
        }

        // Handle Stroke
        if (node.stroke) {
          ctx.lineWidth = typeof node.strokeWidth === 'number' ? node.strokeWidth : 1;
          ctx.strokeStyle = typeof node.stroke === 'string' ? node.stroke : (node.stroke as any).color || '#000';
          ctx.strokeRect(0, 0, w, h);
        }
      } else if (node.type === 'ellipse') {
        const w = node.dimensions?.width || 100;
        const h = node.dimensions?.height || 100;
        const rx = w / 2;
        const ry = h / 2;

        ctx.beginPath();
        ctx.ellipse(rx, ry, rx, ry, 0, 0, 2 * Math.PI);

        if (typeof node.fill === 'string') {
          ctx.fillStyle = node.fill;
          ctx.fill();
        } else if (node.fill && typeof node.fill === 'object') {
          const fillColor = (node.fill as any).color || (node.fill as any).stops?.[0]?.color;
          if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
          }
        }

        if (node.stroke) {
          ctx.lineWidth = typeof node.strokeWidth === 'number' ? node.strokeWidth : 1;
          ctx.strokeStyle = typeof node.stroke === 'string' ? node.stroke : (node.stroke as any).color || '#000';
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // 5. Generate final Blob without freezing the main thread
    let type = 'image/png';
    if (options.format === 'jpeg') {
      type = 'image/jpeg';
    }
    if (options.format === 'webp') {
      type = 'image/webp';
    }

    const blob = await canvas.convertToBlob({
      type,
      quality: options.quality,
    });

    return blob;
  } catch (err) {
    log.error('OffscreenCanvas rasterization failed:', err);
    throw err;
  }
}
