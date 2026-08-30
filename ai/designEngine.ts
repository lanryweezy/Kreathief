import type { Artboard, Layer, TextLayer, ShapeLayer } from '../types';

export interface DesignAnalysis {
  score: number;
  suggestions: string[];
  layout: { score: number; alignment: number; spacing: number; balance: number };
  typography: { score: number; consistency: number; hierarchy: number };
  color: { score: number; palette: string[]; contrast: number; harmony: number };
}

export interface LayoutVariant {
  name: string;
  description: string;
  layers: Layer[];
}

type DesignIntent = 'premium' | 'apple' | 'colorful' | 'minimal' | string;
type Platform = 'Instagram Post' | 'Instagram Story' | 'YouTube Thumbnail' | 'Business Card';

const PLATFORM_SIZES: Record<Platform, { width: number; height: number }> = {
  'Instagram Post': { width: 1080, height: 1080 },
  'Instagram Story': { width: 1080, height: 1920 },
  'YouTube Thumbnail': { width: 1280, height: 720 },
  'Business Card': { width: 1050, height: 600 },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function isTextLayer(l: Layer): l is TextLayer {
  return l.type === 'text';
}

function isShapeLayer(l: Layer): l is ShapeLayer {
  return [
    'rectangle',
    'circle',
    'triangle',
    'star',
    'hexagon',
    'diamond',
    'arrow',
    'heart',
    'speech_bubble',
    'ribbon',
    'shield',
    'banner',
    'pentagon',
    'octagon',
    'plus',
    'star_4',
    'star_8',
    'path',
  ].includes(l.type);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l };
  return {
    h: ((max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6) * 360,
    s: l > 0.5 ? d / (2 - max - min) : d / (max + min),
    l,
  };
}

// ⚡ Bolt Optimization: Replace flatMap with imperative loop to prevent intermediate O(N) array allocations
function getAllLayers(artboards: Artboard[], layers: Layer[]): Layer[] {
  const allLayers: Layer[] = [];
  for (let i = 0; i < artboards.length; i++) {
    const aLayers = artboards[i].layers;
    for (let j = 0; j < aLayers.length; j++) {
      allLayers.push(aLayers[j]);
    }
  }
  for (let k = 0; k < layers.length; k++) {
    allLayers.push(layers[k]);
  }
  return allLayers;
}

function getColors(layers: Layer[]): string[] {
  return Array.from(
    new Set(layers.map((l) => (isTextLayer(l) || isShapeLayer(l) ? (l as any).color : null)).filter(Boolean))
  );
}

function getFonts(layers: Layer[]): string[] {
  return Array.from(new Set(layers.filter(isTextLayer).map((t) => t.fontFamily)));
}

export function analyzeDesign(artboards: Artboard[], layers: Layer[]): DesignAnalysis {
  const all = getAllLayers(artboards, layers);
  const textLayers = all.filter(isTextLayer);
  const colors = getColors(all),
    fonts = getFonts(all);
  const fontSizes = textLayers.map((t) => t.fontSize);

  let hasHierarchy = true;
  if (fontSizes.length > 1) {
    let minFontSize = fontSizes[0];
    let maxFontSize = fontSizes[0];
    for (let i = 1; i < fontSizes.length; i++) {
      if (fontSizes[i] < minFontSize) minFontSize = fontSizes[i];
      if (fontSizes[i] > maxFontSize) maxFontSize = fontSizes[i];
    }
    hasHierarchy = maxFontSize / minFontSize > 1.5;
  }

  const alignment = textLayers.length > 0 ? (new Set(textLayers.map((t) => t.textAlign)).size === 1 ? 100 : 60) : 100;
  const avgSpacing =
    all.length > 1
      ? all.reduce((a, l, i) => (i === 0 ? 0 : a + Math.abs(l.y - (all[i - 1].y + all[i - 1].height))), 0) /
        (all.length - 1)
      : 0;
  const spacing = clamp(100 - Math.abs(avgSpacing - 20) * 2, 0, 100);
  const balance =
    all.length > 0
      ? clamp(
          100 -
            Math.abs(all.reduce((a, l) => a + l.x + l.width / 2, 0) / all.length - (artboards[0]?.width || 500) / 2) *
              0.5,
          0,
          100
        )
      : 100;
  const contrast =
    all.length > 1 && colors.length > 1
      ? clamp(
          ((Math.max(hexToHsl(colors[0]).l, hexToHsl(colors[1]).l) + 0.05) /
            (Math.min(hexToHsl(colors[0]).l, hexToHsl(colors[1]).l) + 0.05)) *
            25,
          0,
          100
        )
      : 100;
  const suggestions: string[] = [];
  if (fonts.length > 3) suggestions.push('Reduce font families to max 3');
  if (!hasHierarchy) suggestions.push('Add font size variation for hierarchy');
  if (colors.length > 5) suggestions.push('Limit palette to 5 colors');
  if (spacing < 50) suggestions.push('Increase spacing between elements');
  if (alignment < 80) suggestions.push('Align text elements');
  
  const layoutScore = Math.round((alignment + spacing + balance) / 3);
  const typeScore = Math.round((fonts.length <= 3 ? 100 : 50) + (hasHierarchy ? 100 : 40)) / 2;
  const colorScore = Math.round((contrast + (colors.length <= 5 ? 90 : 50)) / 2);
  const score = Math.round((layoutScore + typeScore + colorScore) / 3);
  
  return {
    score,
    suggestions,
    layout: {
      score: layoutScore,
      alignment,
      spacing: Math.round(spacing),
      balance: Math.round(balance),
    },
    typography: {
      score: typeScore,
      consistency: fonts.length <= 3 ? 100 : 50,
      hierarchy: hasHierarchy ? 100 : 40,
    },
    color: {
      score: colorScore,
      palette: colors,
      contrast: Math.round(contrast),
      harmony: colors.length <= 5 ? 90 : 50,
    },
  };
}

export function applyDesignIntent(intent: DesignIntent, artboards: Artboard[], layers: Layer[]): Layer[] {
  const norm = intent.toLowerCase();
  return getAllLayers(artboards, layers).map((layer) => {
    const l = { ...layer };
    if (norm.includes('premium') || norm.includes('luxury')) {
      if (isTextLayer(l)) {
        l.fontFamily = 'Playfair Display, Georgia, serif';
        l.letterSpacing = 2;
        l.lineHeight = Math.max(l.lineHeight, 1.6);
      }
      if (isShapeLayer(l))
        l.shadow = {
          color: 'rgba(0,0,0,0.15)',
          blur: 20,
          offsetX: 0,
          offsetY: 4,
        };
      l.opacity = clamp(l.opacity + 0.05, 0, 1);
    }
    if (norm.includes('apple') || norm.includes('clean')) {
      if (isTextLayer(l)) {
        l.fontFamily = '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif';
        l.fontWeight = '400';
        l.color = '#1d1d1f';
      }
      if (isShapeLayer(l)) {
        l.shadow = {
          color: 'rgba(0,0,0,0.08)',
          blur: 12,
          offsetX: 0,
          offsetY: 2,
        };
        l.cornerRadius = l.cornerRadius || 12;
      }
      l.opacity = 1;
    }
    if (norm.includes('color') || norm.includes('vibrant')) {
      const applyHsl = (c: string, sMul: number, lAdd = 0) => {
        const h = hexToHsl(c);
        return `hsl(${h.h},${clamp(h.s * sMul, 0, 1)},${clamp(h.l + lAdd, 0, 1)})`;
      };
      if (isTextLayer(l)) l.color = applyHsl(l.color, 1.4);
      if (isShapeLayer(l)) l.color = applyHsl(l.color, 1.3, 0.05);
    }
    if (norm.includes('minimal') || norm.includes('simple')) {
      if (isShapeLayer(l)) {
        l.shadow = undefined;
        l.stroke = undefined;
      }
      l.opacity = clamp(l.opacity - 0.1, 0.3, 1);
    }
    return l;
  });
}

export function generateLayoutVariants(artboards: Artboard[], layers: Layer[]): LayoutVariant[] {
  const ab = artboards[0] || { width: 800, height: 600 };
  const all = getAllLayers(artboards, layers);
  const makePositions = (fn: (l: Layer, i: number) => { x: number; y: number }) =>
    all.map((layer, i) => ({ ...layer, ...fn(layer, i) }));
  const centered = makePositions((l, i) => {
    const totalH = all.reduce((a, c) => a + c.height + 20, -20);
    return {
      x: (ab.width - l.width) / 2,
      y: (ab.height - totalH) / 2 + i * (l.height + 20),
    };
  });
  const asymmetric = makePositions((l, i) => ({
    x: i % 2 === 0 ? ab.width * 0.1 : ab.width * 0.45,
    y: ab.height * 0.15 + i * (l.height + 30),
    rotation: i % 3 === 0 ? (i % 2 === 0 ? 1 : -1) * 3 : l.rotation,
  }));
  const grid = makePositions((l, i) => {
    const cols = Math.ceil(Math.sqrt(all.length)),
      cellW = ab.width / cols,
      cellH = ab.height / Math.ceil(all.length / cols);
    return {
      x: (i % cols) * cellW + (cellW - l.width) / 2,
      y: Math.floor(i / cols) * cellH + (cellH - l.height) / 2,
    };
  });
  return [
    {
      name: 'Centered & Balanced',
      description: 'Symmetrical centered layout',
      layers: centered,
    },
    {
      name: 'Asymmetric & Dynamic',
      description: 'Off-center with varied angles',
      layers: asymmetric,
    },
    {
      name: 'Grid-Based & Structured',
      description: 'Organized grid placement',
      layers: grid,
    },
  ];
}

export function optimizeForPlatform(artboards: Artboard[], targetPlatform: Platform): Artboard[] {
  const target = PLATFORM_SIZES[targetPlatform];
  if (!target) return artboards;
  const srcW = artboards[0]?.width || 800,
    srcH = artboards[0]?.height || 600;
  const scale = Math.min(target.width, target.height) / Math.min(srcW, srcH);
  return artboards.map((ab) => ({
    ...ab,
    width: target.width,
    height: target.height,
    layers: ab.layers.map((layer) => {
      const l = {
        ...layer,
        width: layer.width * scale,
        height: layer.height * scale,
        x: (layer.x / ab.width) * target.width,
        y: (layer.y / ab.height) * target.height,
      };
      if (isTextLayer(l)) {
        l.fontSize *= scale;
        if (targetPlatform === 'YouTube Thumbnail') {
          l.fontSize = Math.max(l.fontSize, 24);
          l.fontWeight = '700';
        }
        if (targetPlatform === 'Business Card') l.fontSize = Math.min(l.fontSize, 12);
      }
      return l;
    }),
  }));
}
