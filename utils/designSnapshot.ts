/**
 * Design Snapshot — flattens a Layer[] stack to a downscaled JPEG data URL.
 *
 * This is the AI critic's eyes: a deliberately simplified re-implementation
 * of the canvas painter (rects, ellipses, paths, gradients, text, images)
 * good enough for a VLM to judge hierarchy, spacing, contrast and composition
 * without mounting the live editor DOM.
 */
import { Layer, TextLayer, Gradient } from '../types';
import { renderMultilineText } from './textRendering';
import { fontManager } from '../services/fontManager';

const BLENDABLE: Record<string, GlobalCompositeOperation> = {
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
};

function loadImage(src: string, timeoutMs = 5000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

function toCanvasGradient(ctx: CanvasRenderingContext2D, grad: Gradient, w: number, h: number): CanvasGradient | null {
  if (!grad || !Array.isArray(grad.colors) || grad.colors.length === 0) return null;
  const norm = (p: number) => (p > 1 ? p / 100 : p);
  let canvasGrad: CanvasGradient;
  if (grad.type === 'radial') {
    canvasGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
  } else {
    const angleRad = ((grad.angle ?? 180) * Math.PI) / 180;
    const len = Math.abs(w * Math.cos(angleRad)) + Math.abs(h * Math.sin(angleRad));
    const cx = w / 2;
    const cy = h / 2;
    const dx = (Math.cos(angleRad) * len) / 2;
    const dy = (Math.sin(angleRad) * len) / 2;
    canvasGrad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  }
  for (const stop of grad.colors) {
    try {
      canvasGrad.addColorStop(Math.max(0, Math.min(1, norm(stop.position))), stop.color);
    } catch (_e) {
      /* invalid stop — skip */
    }
  }
  return canvasGrad;
}

function traceShapePath(ctx: CanvasRenderingContext2D, type: string, w: number, h: number, radius: number) {
  ctx.beginPath();
  if (type === 'circle' || type === 'ellipse') {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (type === 'triangle') {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
  } else if (w > 0 && h > 0 && radius > 0 && typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(0, 0, w, h, Math.min(radius, w / 2, h / 2));
  } else {
    ctx.rect(0, 0, w, h);
  }
}

async function drawLayer(ctx: CanvasRenderingContext2D, layer: Layer) {
  const anyLayer = layer as any;
  const w = anyLayer.width || 0;
  const h = anyLayer.height || 0;
  if (w <= 0 || h <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, anyLayer.opacity ?? 1));
  const blend = BLENDABLE[anyLayer.blendMode as string];
  if (blend) ctx.globalCompositeOperation = blend;

  // Pivot transform: translate to center, rotate, draw from top-left origin.
  ctx.translate((anyLayer.x || 0) + w / 2, (anyLayer.y || 0) + h / 2);
  const rotation = (Number(anyLayer.rotation) || 0) * (Math.PI / 180);
  if (rotation) ctx.rotate(rotation);
  ctx.translate(-w / 2, -h / 2);

  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    try {
      renderMultilineText(ctx, textLayer);
    } catch (_e) {
      ctx.fillStyle = textLayer.color || '#000';
      ctx.font = `${textLayer.fontSize || 24}px sans-serif`;
      ctx.fillText(String(textLayer.text || '').slice(0, 80), 0, 0);
    }
  } else if (layer.type === 'image') {
    const img = await loadImage(anyLayer.src || '');
    if (img) {
      ctx.save();
      if (anyLayer.flipX || anyLayer.flipY) {
        ctx.translate(anyLayer.flipX ? w : 0, anyLayer.flipY ? h : 0);
        ctx.scale(anyLayer.flipX ? -1 : 1, anyLayer.flipY ? -1 : 1);
      }
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    } else {
      // Visible "asset missing" placeholder so the critic can flag it.
      ctx.fillStyle = 'rgba(120,120,130,0.35)';
      ctx.fillRect(0, 0, w, h);
    }
  } else if (layer.type === 'path' && anyLayer.pathData) {
    try {
      const path = new Path2D(anyLayer.pathData);
      const fill = anyLayer.gradient ? toCanvasGradient(ctx, anyLayer.gradient, w, h) : anyLayer.color;
      if (fill) {
        ctx.fillStyle = fill as string | CanvasGradient;
        ctx.fill(path);
      }
    } catch (_e) {
      /* unparseable path — skip */
    }
  } else {
    // Shapes: rectangle / circle / everything else as rounded box.
    const radius = typeof anyLayer.cornerRadius === 'number' ? anyLayer.cornerRadius : 0;
    traceShapePath(ctx, layer.type, w, h, radius);
    const gradient = anyLayer.gradient || anyLayer.backgroundGradient;
    const fill = gradient ? toCanvasGradient(ctx, gradient, w, h) : anyLayer.fill || anyLayer.color;
    if (fill) {
      ctx.fillStyle = fill as string | CanvasGradient;
      ctx.fill();
    }
    const stroke = anyLayer.stroke;
    if (stroke && typeof stroke.width === 'number' && stroke.width > 0 && stroke.color) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Render a layer stack to a JPEG data URL (longest edge ≈ maxSide px).
 * Async because images must decode before painting.
 */
export async function renderLayersToDataUrl(
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number,
  options: { maxSide?: number; background?: string } = {}
): Promise<string> {
  const maxSide = options.maxSide ?? 640;
  const scale = Math.min(1, maxSide / Math.max(canvasWidth, canvasHeight, 1));
  const outW = Math.max(1, Math.round(canvasWidth * scale));
  const outH = Math.max(1, Math.round(canvasHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('[DesignSnapshot] 2D context unavailable');
  }

  ctx.fillStyle = options.background || '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  // Preflight web fonts to ensure canvas snapshot text uses exact loaded typography
  try {
    await fontManager.loadFontsForLayers(layers);
    await (document as any).fonts?.ready;
  } catch (_e) {}

  const ordered = [...layers]
    .filter((l) => (l as any).visible !== false)
    .sort((a, b) => ((a as any).zIndex ?? 0) - ((b as any).zIndex ?? 0));

  ctx.scale(scale, scale);
  for (const layer of ordered) {
    try {
      await drawLayer(ctx, layer);
    } catch (_e) {
      /* one bad layer must not lose the whole snapshot */
    }
  }

  return canvas.toDataURL('image/jpeg', 0.82);
}
