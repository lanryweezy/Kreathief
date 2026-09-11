import { Layer, Gradient } from '../types';
import { ArtboardDesignResult } from '../services/aiDesignDirector';
import { hexToHSL, hslToHex } from './colorHarmony';

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

    // 2. Enforce typography hierarchy
    layers = enforceTypographyHierarchy(layers);
    // 3. Add missing shadows to interactive elements
    layers = addMissingShadows(layers);
    // 4. Fix overlapping text
    layers = fixOverlappingText(layers, polishedResult.height || 1080);

    // 5. Ensure text defaults
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

  // 6. Ensure subtle background gradient
  polishedResult = ensureBackgroundGradient(polishedResult);

  return polishedResult;
}
