import { Layer, Gradient } from '../types';
import { ArtboardDesignResult } from '../services/aiDesignDirector';
import { hexToHSL, hslToHex } from './colorHarmony';

export function snapToGrid(value: number, gridSize: number = 4): number {
  return Math.round(value / gridSize) * gridSize;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b);
}

function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * WCAG AA auto-fixer: rewrites text colors that fall below the 4.5:1 contrast
 * ratio against their effective backdrop (nearest enclosing filled shape, or
 * the provided artboard background). Picks the higher-contrast candidate.
 */
export function enforceWcagContrast(layers: Layer[], background: string = '#090a0f', minRatio = 4.5): Layer[] {
  const SOLID_SHAPES = new Set(['rectangle', 'circle', 'svg', 'path']);
  const LIGHT = '#f8fafc';
  const DARK = '#090a0f';

  return layers.map((layer) => {
    if (layer.type !== 'text') return layer;
    const tl = layer as any;
    const textColor = typeof tl.color === 'string' ? tl.color : null;
    const textRgb = textColor ? hexToRgb(textColor) : null;
    if (!textRgb) return layer;

    // Effective backdrop: last (topmost) solid shape fully containing the text
    let bg = background;
    for (const other of layers) {
      if (other === layer || !SOLID_SHAPES.has(other.type as string)) continue;
      const o = other as any;
      const fill = typeof o.fill === 'string' ? o.fill : typeof o.color === 'string' ? o.color : null;
      if (!fill || !fill.startsWith('#')) continue;
      if (
        tl.x >= o.x && tl.y >= o.y &&
        tl.x + (tl.width || 0) <= o.x + (o.width || 0) &&
        tl.y + (tl.height || 0) <= o.y + (o.height || 0)
      ) {
        bg = fill;
      }
    }
    const bgRgb = hexToRgb(bg);
    if (!bgRgb) return layer;

    if (contrastRatio(textRgb, bgRgb) >= minRatio) return layer;
    const lightScore = contrastRatio(hexToRgb(LIGHT)!, bgRgb);
    const darkScore = contrastRatio(hexToRgb(DARK)!, bgRgb);
    return { ...layer, color: lightScore >= darkScore ? LIGHT : DARK } as Layer;
  });
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

export function fixOverlappingText(layers: Layer[], canvasHeight: number): Layer[] {
  const textLayers = layers.filter(l => l.type === 'text').sort((a, b) => a.y - b.y);
  const otherLayers = layers.filter(l => l.type !== 'text');

  for (let i = 0; i < textLayers.length - 1; i++) {
    const current = textLayers[i];
    const next = textLayers[i + 1];
    const currentBottom = current.y + (current.height || (current as any).fontSize || 16);

    if (next.y < currentBottom + 8) {
      (next as any).y = currentBottom + 12; // 12px gap between text blocks
    }
  }

  return [...otherLayers, ...textLayers];
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

    // 2. Enforce WCAG AA text contrast against the effective backdrop
    layers = enforceWcagContrast(layers, polishedResult.backgroundColor || '#090a0f');

    // 3. Enforce typography hierarchy
    layers = enforceTypographyHierarchy(layers);
    // 4. Add missing shadows to interactive elements
    layers = addMissingShadows(layers);
    // 5. Fix overlapping text
    layers = fixOverlappingText(layers, polishedResult.height || 1080);

    // 6. Ensure text defaults
    layers = layers.map(layer => {
      if (layer.type === 'text') {
        const tl = layer as any;
        return {
          ...layer,
          fontFamily: tl.fontFamily || 'Inter',
          textAlign: tl.textAlign || 'left',
        } as Layer;
      }
      return layer;
    });

    polishedResult.layers = layers;
  }

  // 7. Ensure subtle background gradient
  polishedResult = ensureBackgroundGradient(polishedResult);

  return polishedResult;
}
