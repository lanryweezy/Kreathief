import { Layer, Gradient } from '../types';
import { ArtboardDesignResult } from '../services/aiDesignDirector';
import { hexToHSL, hslToHex } from './colorHarmony';
import { applyAutoLayout } from './autoLayout';

export function snapToGrid(value: number, gridSize: number = 4): number {
  return Math.round(value / gridSize) * gridSize;
}

export function enforceTypographyHierarchy(layers: Layer[]): Layer[] {
  const textLayers = layers.filter((l): l is Layer & { type: 'text' } => l.type === 'text');
  if (textLayers.length === 0) return layers;

  const maxFontSizeLayer = textLayers.reduce((max, layer) => {
    const maxFs = (max as any).fontSize || 0;
    const layerFs = (layer as any).fontSize || 0;
    return layerFs > maxFs ? layer : max;
  }, textLayers[0]);
  const maxFs = (maxFontSizeLayer as any).fontSize || 16;

  return layers.map(layer => {
    if (layer.id === maxFontSizeLayer.id) {
      const fw = (layer as any).fontWeight;
      const fwNum = fw ? parseInt(String(fw)) : 0;
      return { ...layer, fontWeight: fwNum >= 700 ? fw : '700' } as Layer;
    }
    if (layer.type === 'text' && ((layer as any).fontSize || 0) >= maxFs && layer.id !== maxFontSizeLayer.id) {
      return { ...layer, fontSize: Math.max(8, maxFs - 4) } as Layer;
    }
    return layer;
  });
}

export function addMissingShadows(layers: Layer[]): Layer[] {
  return layers.map(layer => {
    const name = (layer.name || '').toLowerCase();
    if (['button', 'card', 'badge', 'pill'].some(kw => name.includes(kw))) {
      if (!(layer as any).shadow) {
        return {
          ...layer,
          shadow: {
            color: 'rgba(0,0,0,0.15)',
            offsetX: 0,
            offsetY: 4,
            blur: 12,
          },
        } as Layer;
      }
    }
    return layer;
  });
}

// Cached offscreen context for fast, accurate text measurement
let textMeasureCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
function getMeasureContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
  if (textMeasureCtx) return textMeasureCtx;
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(1, 1);
      textMeasureCtx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    } else if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      textMeasureCtx = canvas.getContext('2d');
    }
  } catch (e) {
    console.warn('Failed to initialize text measurement canvas', e);
  }
  return textMeasureCtx;
}

export function estimateTextDimensions(
  text: string,
  fontSize: number,
  maxWidth: number,
  lineHeightMultiplier: number = 1.2,
  letterSpacing: number = 0,
  fontFamily: string = 'system-ui',
  fontWeight: string | number = 400
): { lines: number; height: number; width: number } {
  if (!text) return { lines: 1, height: Math.ceil(fontSize * lineHeightMultiplier), width: 0 };
  const clean = text.trim();
  if (clean.length === 0) return { lines: 1, height: Math.ceil(fontSize * lineHeightMultiplier), width: 0 };

  const ctx = getMeasureContext();
  let maxLineWidth = 0;
  let lines = 1;

  if (ctx) {
    // Precise canvas-based measurement (works in Web Worker via OffscreenCanvas)
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    
    // Fallback letter spacing if canvas API doesn't support it natively
    const effectiveLetterSpacing = Math.max(0, letterSpacing);
    const words = clean.split(/\s+/);
    
    let currentLineWidth = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // measureText provides exact pixel width for the word
      const wordWidth = ctx.measureText(word).width + (word.length * effectiveLetterSpacing);
      const spaceWidth = ctx.measureText(' ').width + effectiveLetterSpacing;
      
      if (currentLineWidth + wordWidth > maxWidth && currentLineWidth > 0) {
        // Wrap to next line
        lines++;
        maxLineWidth = Math.max(maxLineWidth, currentLineWidth - spaceWidth);
        currentLineWidth = wordWidth + spaceWidth;
      } else {
        currentLineWidth += wordWidth + spaceWidth;
      }
    }
    maxLineWidth = Math.max(maxLineWidth, currentLineWidth - (ctx.measureText(' ').width + effectiveLetterSpacing));
  } else {
    // Fallback to naive character counting if Canvas is unavailable
    const effectiveLetterSpacing = Math.max(0, letterSpacing);
    const charWidth = Math.max(1, fontSize * 0.54 + effectiveLetterSpacing);
    const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
    const words = clean.split(/\s+/);

    let lineLen = 0;
    for (const w of words) {
      if (lineLen + w.length > maxCharsPerLine && lineLen > 0) {
        lines++;
        lineLen = w.length + 1;
      } else {
        lineLen += w.length + 1;
      }
    }
    maxLineWidth = Math.min(maxWidth, lineLen * charWidth);
  }

  return {
    lines,
    height: Math.ceil(lines * fontSize * lineHeightMultiplier),
    width: Math.ceil(maxLineWidth)
  };
}

function hasHorizontalOverlap(a: { x: number; width?: number }, b: { x: number; width?: number }): boolean {
  const aLeft = a.x;
  const aRight = a.x + (a.width || 100);
  const bLeft = b.x;
  const bRight = b.x + (b.width || 100);
  return Math.min(aRight, bRight) - Math.max(aLeft, bLeft) > 20;
}

export function fixOverlappingText(layers: Layer[], canvasHeight: number): Layer[] {
  // 1. Separate background/decorative layers from foreground content stack
  // Foreground content: eyebrow tags, headlines, subtitles, key specs, CTA buttons, and CTA text
  const isForegroundContent = (l: Layer) => {
    const name = (l.name || '').toLowerCase();
    return (
      l.type === 'text' ||
      name.includes('button') ||
      name.includes('cta') ||
      name.includes('badge') ||
      name.includes('pill')
    );
  };

  // Find all foreground content items and sort by Y position
  const foreground = layers.filter(isForegroundContent).sort((a, b) => a.y - b.y);
  if (foreground.length < 2) return layers;

  // Track modified positions by layer ID
  const yOverrides = new Map<string, { y: number; height: number }>();

  for (let i = 0; i < foreground.length; i++) {
    const current = foreground[i];
    const currOverride = yOverrides.get(current.id);
    const currY = currOverride ? currOverride.y : current.y;

    // Estimate real height
    let currH = current.height || 40;
    if (current.type === 'text') {
      const tl = current as any;
      const fs = tl.fontSize || 24;
      const lh = tl.lineHeight || 1.15;
      const ls = typeof tl.letterSpacing === 'number' ? tl.letterSpacing : 0;
      const maxW = tl.width || 800;
      const estimated = estimateTextDimensions(tl.text || '', fs, maxW, lh, ls);
      currH = Math.max(currH, estimated.height);
    }
    yOverrides.set(current.id, { y: currY, height: currH });

    if (i < foreground.length - 1) {
      const next = foreground[i + 1];
      const nextOverride = yOverrides.get(next.id);
      const nextY = nextOverride ? nextOverride.y : next.y;

      const currentBottom = currY + currH;

      // Pair button/badge/pill containers with their text overlay
      const isCurrentBtn = current.type !== 'text' && ((current.name || '').toLowerCase().includes('btn') || (current.name || '').toLowerCase().includes('button'));
      const isNextCtaText = next.type === 'text' && ((next.name || '').toLowerCase().includes('cta') || (next.name || '').toLowerCase().includes('btn') || (next.name || '').toLowerCase().includes('button'));

      const isCurrentPill = current.type !== 'text' && ((current.name || '').toLowerCase().includes('pill') || (current.name || '').toLowerCase().includes('badge'));
      const isNextPillText = next.type === 'text' && ((next.name || '').toLowerCase().includes('pill') || (next.name || '').toLowerCase().includes('badge'));

      if ((isCurrentBtn && isNextCtaText) || (isCurrentPill && isNextPillText)) {
        // Center text label vertically inside its container shape
        const textH = (next as any).fontSize || 16;
        yOverrides.set(next.id, {
          y: currY + Math.max(0, Math.round((currH - textH) / 2)),
          height: textH,
        });
      } else if (hasHorizontalOverlap(current, next)) {
        // Only push down elements that share horizontal space
        const minGap = 20; // Generous 20px breathing gap between distinct stacked elements
        if (nextY < currentBottom + minGap) {
          const pushedY = currentBottom + minGap;
          let nextH = next.height || 40;
          if (next.type === 'text') {
            const tl = next as any;
            const fs = tl.fontSize || 24;
            const lh = tl.lineHeight || 1.15;
            const ls = typeof tl.letterSpacing === 'number' ? tl.letterSpacing : 0;
            const maxW = tl.width || 800;
            const estimated = estimateTextDimensions(tl.text || '', fs, maxW, lh, ls);
            nextH = Math.max(nextH, estimated.height);
          }
          yOverrides.set(next.id, { y: pushedY, height: nextH });
        }
      }
    }
  }

  // 2. Check if total stack overflows canvas height; if so, scale and compress
  const maxAllowedY = canvasHeight - 40;
  let maxBottom = 0;
  for (const [, override] of yOverrides) {
    const bottom = override.y + override.height;
    if (bottom > maxBottom) maxBottom = bottom;
  }

  let compressionShift = 0;
  if (maxBottom > maxAllowedY) {
    const overflow = maxBottom - maxAllowedY;
    compressionShift = Math.min(overflow, 60);
  }

  // 3. Apply position overrides while strictly preserving original layer order
  return layers.map((layer) => {
    const override = yOverrides.get(layer.id);
    if (!override) return layer;

    const adjustedY = snapToGrid(Math.max(20, override.y - compressionShift));
    return {
      ...layer,
      y: adjustedY,
      height: snapToGrid(override.height),
    } as Layer;
  });
}

export function ensureBackgroundGradient(result: ArtboardDesignResult): ArtboardDesignResult {
  if (result.backgroundColor && !result.backgroundGradient) {
    const baseHSL = hexToHSL(result.backgroundColor);
    const darkerHex = hslToHex(baseHSL.h, Math.min(100, baseHSL.s + 5), Math.max(0, baseHSL.l - 8));
    result.backgroundGradient = {
      type: 'linear',
      angle: 160,
      colors: [
        { color: result.backgroundColor, position: 0 },
        { color: darkerHex, position: 1 },
      ],
    };
  }
  return result;
}

export function snapCornerRadius(value: number): number {
  const allowed = [0, 4, 8, 12, 16, 24, 32, 999];
  return allowed.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
}

export function polishDesignOutput(result: ArtboardDesignResult): ArtboardDesignResult {
  let polishedResult = { ...result };

  if (polishedResult.layers) {
    let layers = [...polishedResult.layers];

    // 1. Snap coordinates to 4px grid & clamp opacity
    layers = layers.map(layer => {
      const rawType = (layer as any).type;
      const normalizedType = rawType === 'rect' ? 'rectangle' : rawType === 'ellipse' ? 'circle' : rawType;
      const layerColor = (layer as any).color || (layer as any).fill || '#3b82f6';

      const patched: any = {
        ...layer,
        type: normalizedType,
        color: layerColor,
        fill: layerColor,
        x: snapToGrid(layer.x),
        y: snapToGrid(layer.y),
        width: layer.width ? snapToGrid(layer.width) : layer.width,
        height: layer.height ? snapToGrid(layer.height) : layer.height,
        opacity: layer.opacity !== undefined ? Math.max(0.01, Math.min(1, layer.opacity)) : 1,
      };
      // Snap corner radius if present
      const cr = (layer as any).cornerRadius;
      if (typeof cr === 'number') {
        patched.cornerRadius = snapCornerRadius(cr);
      } else if (cr && typeof cr === 'object') {
        patched.cornerRadius = {
          tl: snapCornerRadius(cr.tl || 0),
          tr: snapCornerRadius(cr.tr || 0),
          br: snapCornerRadius(cr.br || 0),
          bl: snapCornerRadius(cr.bl || 0),
        };
      }
      return patched as Layer;
    });

    // 2. Enforce typography hierarchy
    layers = enforceTypographyHierarchy(layers);
    // 3. Add missing shadows to interactive elements
    layers = addMissingShadows(layers);
    // 4. Handle Layouts (Auto-Layout vs fallback overlapping text fix)
    if (layers.some(l => !!l.autoLayout)) {
      layers = applyAutoLayout(layers);
    } else {
      layers = fixOverlappingText(layers, polishedResult.height || 1080);
    }

    // 5. Ensure final pass grid snapping (in case fixOverlappingText or applyAutoLayout lost snapping)
    layers = layers.map(layer => {
      layer = {
        ...layer,
        x: snapToGrid(layer.x),
        y: snapToGrid(layer.y),
        width: layer.width !== undefined ? snapToGrid(layer.width) : (layer.width as any),
        height: layer.height !== undefined ? snapToGrid(layer.height) : (layer.height as any),
      };

    // 6. Ensure text defaults
    // 5. Ensure text defaults and final grid alignment
    layers = layers.map(layer => {
      const base = {
        ...layer,
        x: snapToGrid(layer.x),
        y: snapToGrid(layer.y),
      };
      if (layer.type === 'text') {
        const tl = layer as any;
        return {
          ...base,
          fontFamily: tl.fontFamily || 'Inter',
          textAlign: tl.textAlign || 'left',
        } as Layer;
      }
      return base as Layer;
    });

    polishedResult.layers = layers;
  }

  // 6. Ensure subtle background gradient
  polishedResult = ensureBackgroundGradient(polishedResult);

  return polishedResult;
}
