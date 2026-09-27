/**
 * AI Contextual Auto-Layout & Smart Resizing Matrix Engine
 * Intelligent semantic content classification, responsive cross-aspect-ratio reflow,
 * optical font scaling, safe-zone preservation, and multi-format canvas transformations.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Artboard,
  Layer,
  TextLayer,
  SemanticLayerRole,
  SmartResizeOptions,
  AutoBalanceOptions,
  SmartResizePreset,
} from '../types';
import { log } from '../utils/log';

export const SMART_RESIZE_PRESETS: SmartResizePreset[] = [
  {
    id: 'feed_1_1',
    name: 'Instagram / Square Feed',
    category: 'Social',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
  },
  {
    id: 'story_9_16',
    name: 'Story / Reels / TikTok',
    category: 'Social',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
  },
  {
    id: 'banner_16_9',
    name: 'Web Banner / Display',
    category: 'Display',
    width: 1200,
    height: 630,
    aspectRatio: '16:9',
  },
  {
    id: 'poster_4_5',
    name: 'Marketing Poster / Portrait',
    category: 'Print',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
  },
  {
    id: 'youtube_thumb',
    name: 'YouTube Thumbnail / Video',
    category: 'Video',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
  },
  {
    id: 'dribbble_shot',
    name: 'Dribbble Showcase',
    category: 'Display',
    width: 1600,
    height: 1200,
    aspectRatio: '4:3',
  },
  {
    id: 'pinterest_pin',
    name: 'Pinterest Tall Pin',
    category: 'Social',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3',
  },
  {
    id: 'twitter_header',
    name: 'Twitter / X Header',
    category: 'Display',
    width: 1500,
    height: 500,
    aspectRatio: '3:1',
  },
];

type AspectRatioCategory = 'square' | 'tall_vertical' | 'wide_horizontal';

export function getAspectRatioCategory(width: number, height: number): AspectRatioCategory {
  const ratio = width / Math.max(1, height);
  if (ratio > 1.15) {
    return 'wide_horizontal';
  }
  if (ratio < 0.85) {
    return 'tall_vertical';
  }
  return 'square';
}

/**
 * Classifies a layer into its semantic role within the design composition.
 */
export function classifyLayerRole(
  layer: Layer,
  allLayers: Layer[],
  artboardWidth: number,
  artboardHeight: number
): SemanticLayerRole {
  const name = (layer.name || '').toLowerCase();
  const area = (layer.width || 0) * (layer.height || 0);
  const artboardArea = artboardWidth * artboardHeight;
  const coverageRatio = area / Math.max(1, artboardArea);

  // 1. Background Layers
  if (
    (layer as any).isBackground ||
    name.includes('background') ||
    name.includes('backdrop') ||
    name.includes('ambient glow') ||
    name.includes('gradient bg') ||
    coverageRatio >= 0.7
  ) {
    return 'background';
  }

  // 2. CTA Button Containers
  if (
    (layer.type === 'rectangle' || layer.type === 'circle') &&
    !name.includes('badge') &&
    !name.includes('tag') &&
    (name.includes('button') ||
      name.includes('cta') ||
      name.includes('pill') ||
      ((layer.height || 0) >= 36 && (layer.height || 0) <= 90 && (layer.width || 0) >= 120 && (layer.width || 0) <= 500))
  ) {
    // Check if there is text directly overlapping or labeled CTA
    const hasCtaText = allLayers.some((other) => {
      if (other.type !== 'text' || other.id === layer.id) {return false;}
      const t = (other as TextLayer).text?.toLowerCase() || '';
      const isActionWord =
        t.includes('shop') ||
        t.includes('buy') ||
        t.includes('get') ||
        t.includes('join') ||
        t.includes('claim') ||
        t.includes('reserve') ||
        t.includes('explore') ||
        t.includes('start') ||
        t.includes('now') ||
        t.includes('→');
      const overlaps =
        other.x >= layer.x - 20 &&
        other.x + (other.width || 0) <= layer.x + (layer.width || 0) + 20 &&
        other.y >= layer.y - 15 &&
        other.y + (other.height || 0) <= layer.y + (layer.height || 0) + 15;
      return isActionWord || overlaps;
    });

    if (hasCtaText || name.includes('cta') || name.includes('button')) {
      return 'cta_button';
    }
  }

  // 3. Text Layers
  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    const t = (textLayer.text || '').toLowerCase();
    const fontSize = textLayer.fontSize || 24;

    // CTA Label
    if (
      name.includes('cta') ||
      name.includes('button text') ||
      t.includes('shop now') ||
      t.includes('buy now') ||
      t.includes('get started') ||
      t.includes('claim offer') ||
      t.includes('explore collection') ||
      t.endsWith('→') ||
      t.endsWith('>')
    ) {
      return 'cta_label';
    }

    // Hero Badge / Tag (e.g., "✦ SPECIAL OFFER", "NEW DROP", "OFFICIAL RELEASE")
    if (
      name.includes('badge') ||
      name.includes('tag') ||
      name.includes('pill') ||
      t.startsWith('✦') ||
      t.startsWith('•') ||
      t.includes('offer •') ||
      t.includes('discount •') ||
      t.includes('collection drop') ||
      (fontSize <= 24 && (t.includes('new') || t.includes('special') || t.includes('limited') || t.includes('exclusive')))
    ) {
      return 'hero_badge';
    }

    // Footer / Promo Code / Legal
    if (
      name.includes('footer') ||
      name.includes('legal') ||
      name.includes('promo') ||
      t.includes('code:') ||
      t.includes('use code') ||
      t.includes('www.') ||
      t.includes('.com') ||
      t.includes('©') ||
      t.includes('terms')
    ) {
      return 'footer_meta';
    }

    // Headline vs Subheadline
    // Find highest font size among text layers
    const allTextLayers = allLayers.filter((l) => l.type === 'text') as TextLayer[];
    const maxFontSize = Math.max(...allTextLayers.map((l) => l.fontSize || 24), 24);

    if (name.includes('subheadline') || name.includes('subtitle') || name.includes('description') || name.includes('body')) {
      return 'subheadline';
    }

    if (fontSize >= maxFontSize - 8 || name.includes('headline') || (name.includes('title') && !name.includes('subtitle'))) {
      return 'headline';
    }

    return 'subheadline';
  }

  // 4. Media / Focal Assets (Images, illustrations, large SVG graphics)
  if (layer.type === 'image' || name.includes('product') || name.includes('hero') || name.includes('illustration')) {
    return 'media_focal';
  }

  // 5. Offer Cards & Containers
  if (name.includes('card') || name.includes('offer box') || name.includes('container')) {
    return 'offer_card';
  }

  // Default decorative
  return 'decorative';
}

/**
 * Computes non-linear optical font scaling to preserve readability and balance.
 */
export function calculateOpticalFontSize(
  baseFontSize: number,
  sourceWidth: number,
  targetWidth: number,
  sourceHeight: number,
  targetHeight: number,
  role: SemanticLayerRole
): number {
  const scaleW = targetWidth / Math.max(1, sourceWidth);
  const scaleH = targetHeight / Math.max(1, sourceHeight);
  const minDimRatio = Math.min(scaleW, scaleH);
  const maxDimRatio = Math.max(scaleW, scaleH);
  const harmonicScale = (2 * minDimRatio * maxDimRatio) / Math.max(0.01, minDimRatio + maxDimRatio);

  let exponent = 0.65;
  let minFont = 12;
  let maxFont = 160;

  switch (role) {
    case 'headline':
      exponent = 0.72;
      minFont = 26;
      maxFont = 180;
      break;
    case 'subheadline':
      exponent = 0.6;
      minFont = 14;
      maxFont = 44;
      break;
    case 'hero_badge':
      exponent = 0.5;
      minFont = 11;
      maxFont = 24;
      break;
    case 'cta_label':
      exponent = 0.55;
      minFont = 13;
      maxFont = 28;
      break;
    case 'footer_meta':
      exponent = 0.45;
      minFont = 10;
      maxFont = 20;
      break;
    default:
      exponent = 0.6;
      break;
  }

  const scaled = Math.round(baseFontSize * Math.pow(harmonicScale, exponent));
  return Math.min(maxFont, Math.max(minFont, scaled));
}

/**
 * Smart Resizes an Artboard to any target dimensions with semantic reflow and optical hierarchy preservation.
 */
export function smartResizeArtboard(
  artboard: Artboard,
  targetWidth: number,
  targetHeight: number,
  options: SmartResizeOptions = {}
): Artboard {
  const oldW = artboard.width || 1080;
  const oldH = artboard.height || 1080;
  const newW = targetWidth;
  const newH = targetHeight;

  const srcCategory = getAspectRatioCategory(oldW, oldH);
  const dstCategory = getAspectRatioCategory(newW, newH);

  const safePadding = options.safeZonePadding ?? Math.round(Math.min(newW, newH) * 0.08);
  const preserveHierarchy = options.preserveHierarchy !== false;
  const reflowMultiColumn = options.reflowMultiColumn !== false;

  log.info('[SmartResize] Resizing artboard', {
    artboardId: artboard.id,
    from: `${oldW}x${oldH} (${srcCategory})`,
    to: `${newW}x${newH} (${dstCategory})`,
  });

  // Classify all layers
  const classifiedLayers = artboard.layers.map((l) => ({
    layer: l,
    role: classifyLayerRole(l, artboard.layers, oldW, oldH),
  }));

  // Find CTA button and label pairs for coordinated anchoring
  const ctaPairs: Array<{ button: Layer; label?: Layer }> = [];
  const handledIds = new Set<string>();

  for (const item of classifiedLayers) {
    if (item.role === 'cta_button') {
      const btn = item.layer;
      // Find nearest cta_label
      const matchingLabel = classifiedLayers.find(
        (other) =>
          other.role === 'cta_label' &&
          !handledIds.has(other.layer.id) &&
          Math.abs(other.layer.y - btn.y) < 60
      );
      ctaPairs.push({ button: btn, label: matchingLabel?.layer });
      handledIds.add(btn.id);
      if (matchingLabel) {handledIds.add(matchingLabel.layer.id);}
    }
  }

  const resizedLayers: Layer[] = [];

  // Determine layout transformation mode
  const isTransitionToWide = dstCategory === 'wide_horizontal' && srcCategory !== 'wide_horizontal';
  const isTransitionToTall = dstCategory === 'tall_vertical' && srcCategory === 'wide_horizontal';

  // Process and reposition layers
  for (const { layer: l, role } of classifiedLayers) {
    const cloned: Layer = structuredClone(l);
    cloned.id = uuidv4();

    // 1. Background Layers: full bleed or centered radial expansion
    if (role === 'background') {
      if (l.type === 'circle') {
        // Center-anchor ambient glow circle
        const scale = Math.max(newW / oldW, newH / oldH);
        const nw = Math.round((l.width || oldW) * scale);
        const nh = Math.round((l.height || oldH) * scale);
        cloned.width = nw;
        cloned.height = nh;
        cloned.x = Math.round(newW / 2 - nw / 2);
        cloned.y = Math.round(newH / 2 - nh / 2);
      } else {
        // Full width/height rectangle or image backdrop
        cloned.x = 0;
        cloned.y = 0;
        cloned.width = newW;
        cloned.height = newH;
      }
      resizedLayers.push(cloned);
      continue;
    }

    // 2. Optical Font Rescaling for Text Layers
    if (cloned.type === 'text') {
      const txtLayer = cloned as TextLayer;
      const oldFont = txtLayer.fontSize || 24;
      txtLayer.fontSize = calculateOpticalFontSize(oldFont, oldW, newW, oldH, newH, role);
    }

    // 3. Coordinate Reflow Mapping
    if (isTransitionToWide && reflowMultiColumn) {
      // WIDE LAYOUT (Dual-Column Reflow: Typography on Left, Media/Offers on Right)
      const leftColWidth = Math.round(newW * 0.48);
      const rightColStart = Math.round(newW * 0.54);
      const rightColWidth = newW - rightColStart - safePadding;

      switch (role) {
        case 'hero_badge':
          cloned.x = safePadding;
          cloned.y = safePadding + 20;
          if (cloned.width) {cloned.width = Math.min(cloned.width, leftColWidth);}
          break;

        case 'headline':
          cloned.x = safePadding;
          cloned.y = safePadding + 65;
          cloned.width = leftColWidth;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'left';}
          break;

        case 'subheadline':
          cloned.x = safePadding;
          cloned.y = Math.round(newH * 0.52);
          cloned.width = leftColWidth;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'left';}
          break;

        case 'cta_button': {
          cloned.x = safePadding;
          cloned.y = Math.round(newH * 0.72);
          cloned.width = Math.min(320, leftColWidth - 40);
          cloned.height = Math.max(48, Math.min(64, cloned.height || 54));
          break;
        }

        case 'cta_label': {
          // Find matching button to center text
          const pair = ctaPairs.find((p) => p.label?.id === l.id);
          if (pair) {
            cloned.x = safePadding + 10;
            cloned.y = Math.round(newH * 0.72) + 14;
            cloned.width = Math.min(300, leftColWidth - 60);
          } else {
            cloned.x = safePadding + 10;
            cloned.y = Math.round(newH * 0.72) + 14;
          }
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'center';}
          break;
        }

        case 'media_focal':
        case 'offer_card': {
          cloned.x = rightColStart;
          cloned.y = safePadding + 10;
          cloned.width = rightColWidth;
          cloned.height = newH - safePadding * 2 - 20;
          break;
        }

        case 'footer_meta':
          cloned.x = safePadding;
          cloned.y = newH - safePadding - 24;
          cloned.width = leftColWidth;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'left';}
          break;

        default: {
          // Proportionate positioning within right column
          const relX = l.x / oldW;
          const relY = l.y / oldH;
          cloned.x = Math.round(rightColStart + relX * rightColWidth * 0.8);
          cloned.y = Math.round(safePadding + relY * (newH - safePadding * 2));
          break;
        }
      }
    } else if (isTransitionToTall) {
      // TALL VERTICAL LAYOUT (Single-Column Vertical Stacking: Top to Bottom Flow)
      const contentWidth = newW - safePadding * 2;
      const centerX = Math.round(newW / 2);

      switch (role) {
        case 'hero_badge':
          cloned.x = safePadding;
          cloned.y = safePadding + 40;
          cloned.width = contentWidth;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'center';}
          break;

        case 'headline':
          cloned.x = safePadding;
          cloned.y = Math.round(newH * 0.16);
          cloned.width = contentWidth;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'center';}
          break;

        case 'subheadline':
          cloned.x = safePadding + 30;
          cloned.y = Math.round(newH * 0.32);
          cloned.width = contentWidth - 60;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'center';}
          break;

        case 'media_focal':
        case 'offer_card': {
          const cardH = Math.round(newH * 0.32);
          cloned.x = safePadding + 20;
          cloned.y = Math.round(newH * 0.44);
          cloned.width = contentWidth - 40;
          cloned.height = cardH;
          break;
        }

        case 'cta_button': {
          const btnW = Math.min(contentWidth - 60, 420);
          cloned.x = Math.round(centerX - btnW / 2);
          cloned.y = Math.round(newH * 0.82);
          cloned.width = btnW;
          cloned.height = Math.max(54, Math.min(76, cloned.height || 64));
          break;
        }

        case 'cta_label': {
          const btnW = Math.min(contentWidth - 60, 420);
          cloned.x = Math.round(centerX - (btnW - 20) / 2);
          cloned.y = Math.round(newH * 0.82) + 18;
          cloned.width = btnW - 20;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'center';}
          break;
        }

        case 'footer_meta':
          cloned.x = safePadding;
          cloned.y = newH - safePadding - 35;
          cloned.width = contentWidth;
          if ((cloned as TextLayer).textAlign) {(cloned as TextLayer).textAlign = 'center';}
          break;

        default: {
          const relX = l.x / oldW;
          const relY = l.y / oldH;
          cloned.x = Math.round(relX * newW);
          cloned.y = Math.round(relY * newH);
          break;
        }
      }
    } else {
      // ISOMORPHIC / PROPORTIONATE SCALING (Square to Square, 4:5 to 9:16, etc.)
      const scaleX = newW / oldW;
      const scaleY = newH / oldH;

      if (role === 'cta_button') {
        // Keep button aspect ratio intact without stretching vertically
        const btnW = Math.min(newW - safePadding * 2, Math.round((l.width || 300) * scaleX));
        const btnH = Math.max(48, Math.min(76, Math.round((l.height || 60) * Math.min(scaleX, scaleY))));
        cloned.width = btnW;
        cloned.height = btnH;
        cloned.x = Math.round(newW / 2 - btnW / 2);
        cloned.y = Math.round(newH - safePadding - btnH - 60);
      } else if (role === 'cta_label') {
        const btnW = Math.min(newW - safePadding * 2, Math.round((l.width || 280) * scaleX));
        const btnH = Math.max(48, Math.min(76, Math.round(60 * Math.min(scaleX, scaleY))));
        cloned.width = btnW - 20;
        cloned.x = Math.round(newW / 2 - (btnW - 20) / 2);
        cloned.y = Math.round(newH - safePadding - btnH - 60) + 16;
      } else {
        // Proportionate repositioning
        cloned.x = Math.round(l.x * scaleX);
        cloned.y = Math.round(l.y * scaleY);
        if (cloned.width) {cloned.width = Math.round(cloned.width * scaleX);}
        if (cloned.height) {cloned.height = Math.round(cloned.height * scaleY);}
      }
    }

    resizedLayers.push(cloned);
  }

  return {
    ...artboard,
    id: uuidv4(),
    name: `${artboard.name} (${newW}x${newH})`,
    width: newW,
    height: newH,
    layers: resizedLayers,
  };
}

/**
 * Auto-balances vertical rhythm, gap spacing, and horizontal alignment across layers.
 */
export function autoBalanceLayout(
  layers: Layer[],
  artboardWidth: number,
  artboardHeight: number,
  options: AutoBalanceOptions = {}
): Layer[] {
  const align = options.alignment || 'center';
  const rhythm = options.verticalRhythm || 'even';
  const padding = options.contentPadding ?? Math.round(Math.min(artboardWidth, artboardHeight) * 0.08);

  const nonBgLayers = layers.filter((l) => {
    const role = classifyLayerRole(l, layers, artboardWidth, artboardHeight);
    return role !== 'background';
  });

  if (nonBgLayers.length <= 1) {
    return layers;
  }

  // Sort layers vertically by Y position
  const sortedLayers = [...nonBgLayers].sort((a, b) => a.y - b.y);

  // Group text + button pairs together
  const availableH = artboardHeight - padding * 2;
  const totalContentHeight = sortedLayers.reduce((acc, l) => acc + (l.height || 40), 0);
  const totalGaps = sortedLayers.length - 1;

  let gapSize = Math.max(16, Math.round((availableH - totalContentHeight) / Math.max(1, totalGaps)));
  if (rhythm === 'compact') {
    gapSize = Math.min(24, gapSize);
  } else if (rhythm === 'golden_ratio') {
    gapSize = Math.round(gapSize * 1.2);
  }

  let currentY = padding + Math.max(0, Math.round((availableH - (totalContentHeight + gapSize * totalGaps)) / 2));

  const updatedLayerPositions = new Map<string, { x: number; y: number }>();

  for (const l of sortedLayers) {
    const lw = l.width || 200;
    let newX = l.x;

    if (align === 'center') {
      newX = Math.round(artboardWidth / 2 - lw / 2);
    } else if (align === 'left') {
      newX = padding;
    } else if (align === 'right') {
      newX = artboardWidth - padding - lw;
    }

    updatedLayerPositions.set(l.id, { x: newX, y: currentY });
    currentY += (l.height || 40) + gapSize;
  }

  return layers.map((l) => {
    const newPos = updatedLayerPositions.get(l.id);
    if (newPos) {
      return {
        ...l,
        x: newPos.x,
        y: newPos.y,
      };
    }
    return l;
  });
}

/**
 * Generates an omnichannel matrix of 4 standard synchronized artboards from 1 source artboard.
 */
export function generateSmartResizedMatrix(
  sourceArtboard: Artboard,
  targetPresetIds: string[] = ['feed_1_1', 'story_9_16', 'banner_16_9', 'poster_4_5'],
  options: SmartResizeOptions = {}
): Artboard[] {
  const presets = SMART_RESIZE_PRESETS.filter((p) => targetPresetIds.includes(p.id));
  const results: Artboard[] = [];

  let currentX = (sourceArtboard.x || 0) + sourceArtboard.width + 140;

  for (const preset of presets) {
    const resized = smartResizeArtboard(sourceArtboard, preset.width, preset.height, options);
    resized.name = `${sourceArtboard.name} • ${preset.name} (${preset.aspectRatio})`;
    resized.x = currentX;
    resized.y = 0;

    results.push(resized);
    currentX += preset.width + 140;
  }

  log.info('[SmartResizeMatrix] Generated multi-format matrix', {
    sourceArtboardId: sourceArtboard.id,
    matrixCount: results.length,
  });

  return results;
}
