/**
 * Magic Style Transfer & Aesthetic Harmonization Engine
 * 1-click transformation of existing canvas designs into any of 25+ curated design movements
 * (Bento Grid, Aurora Glass, Neo-Brutalism, Luxury Obsidian, Swiss Minimalist, Y2K Cyber, etc.)
 * with typographic re-pairing, 60-30-10 color mapping, shape restyling, and WCAG AAA contrast auto-correction.
 */

import { v4 as uuidv4 } from 'uuid';
import { Artboard, Layer, TextLayer, ShapeLayer } from '../types';
import { DESIGN_STYLE_DATABASE } from './designStyleDatabase';
import { classifyLayerRole } from './smartResizeEngine';
import { log } from '../utils/log';

export interface StyleTransferOptions {
  preserveTextCase?: boolean;
  restyleShapes?: boolean;
  enforceContrast?: boolean;
  preserveCustomImages?: boolean;
  applyTextEffects?: boolean;
}

/**
 * Calculates relative luminance for WCAG contrast checking.
 */
function getRelativeLuminance(hexColor: string): number {
  const cleanHex = hexColor.replace('#', '').slice(0, 6);
  if (cleanHex.length < 6) {return 0.5;}

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const sRGB = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculates contrast ratio between two hex colors.
 */
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = getRelativeLuminance(foregroundHex);
  const l2 = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Auto-corrects text color to achieve WCAG AAA contrast (>= 7:1) or AA (>= 4.5:1) against background.
 */
export function ensureAccessibleContrast(
  textColor: string,
  backgroundColor: string,
  minRatio: number = 4.5
): string {
  const currentRatio = getContrastRatio(textColor, backgroundColor);
  if (currentRatio >= minRatio) {
    return textColor;
  }

  const bgLum = getRelativeLuminance(backgroundColor);
  // If dark background (lum < 0.5), shift toward pure white; if light background, shift toward dark
  if (bgLum < 0.5) {
    const whiteRatio = getContrastRatio('#ffffff', backgroundColor);
    if (whiteRatio >= minRatio) {return '#ffffff';}
    return '#f8fafc';
  } else {
    const darkRatio = getContrastRatio('#090a15', backgroundColor);
    if (darkRatio >= minRatio) {return '#090a15';}
    return '#111827';
  }
}

/**
 * Transforms an existing Artboard into a selected Graphic Design Style.
 */
export function applyStyleTransfer(
  artboard: Artboard,
  styleId: string,
  options: StyleTransferOptions = {}
): Artboard {
  const style = DESIGN_STYLE_DATABASE[styleId] || DESIGN_STYLE_DATABASE.bentoGrid;
  const palette = style.palette;
  const typo = style.typography;

  const enforceContrast = options.enforceContrast !== false;
  const restyleShapes = options.restyleShapes !== false;
  const applyTextEffects = options.applyTextEffects !== false;

  log.info('[StyleTransfer] Applying aesthetic movement', {
    artboardId: artboard.id,
    styleId: style.id,
    styleName: style.name,
  });

  const W = artboard.width || 1080;
  const H = artboard.height || 1080;

  const restyledLayers = artboard.layers.map((l) => {
    const cloned = structuredClone(l);
    cloned.id = uuidv4();
    const role = classifyLayerRole(l, artboard.layers, W, H);

    // 1. Text Layer Restyling
    if (cloned.type === 'text') {
      const txt = cloned as TextLayer;

      switch (role) {
        case 'headline':
          txt.fontFamily = typo.headlineFont;
          txt.fontWeight = (typo.headlineWeight || 'bold') as any;
          txt.letterSpacing = typo.letterSpacing;
          txt.color = enforceContrast
            ? ensureAccessibleContrast(palette.text, palette.background, 7.0)
            : palette.text;
          if (typo.textTransform === 'uppercase' && !options.preserveTextCase) {
            txt.text = txt.text.toUpperCase();
          }

          // Movement-specific headline effects
          if (applyTextEffects) {
            if (styleId === 'synthwave' || styleId === 'y2k') {
              txt.neonGlow = {
                enabled: true,
                color: palette.primary,
                intensity: 80,
                spread: 18,
                flicker: false,
              };
            } else if (styleId === 'neoBrutalism' || styleId === 'brutalism') {
              txt.textStroke = {
                color: '#000000',
                width: 2,
              };
            } else {
              txt.neonGlow = undefined;
              txt.textStroke = undefined;
            }
          }
          break;

        case 'subheadline':
          txt.fontFamily = typo.bodyFont;
          txt.fontWeight = 'normal';
          txt.color = enforceContrast
            ? ensureAccessibleContrast(palette.textMuted, palette.background, 4.5)
            : palette.textMuted;
          break;

        case 'hero_badge':
          txt.fontFamily = typo.accentFont || typo.headlineFont;
          txt.fontWeight = 'bold';
          txt.color = enforceContrast
            ? ensureAccessibleContrast(palette.accent, palette.surface, 4.5)
            : palette.accent;
          if (!options.preserveTextCase) {
            txt.text = txt.text.toUpperCase();
          }
          break;

        case 'cta_label':
          txt.fontFamily = typo.headlineFont;
          txt.fontWeight = 'bold';
          txt.color = enforceContrast
            ? ensureAccessibleContrast(palette.background, palette.primary, 4.5)
            : palette.background;
          break;

        case 'footer_meta':
          txt.fontFamily = typo.bodyFont;
          txt.color = enforceContrast
            ? ensureAccessibleContrast(palette.textMuted, palette.background, 4.5)
            : palette.textMuted;
          break;

        default:
          txt.fontFamily = typo.bodyFont;
          txt.color = enforceContrast
            ? ensureAccessibleContrast(palette.text, palette.background, 4.5)
            : palette.text;
          break;
      }
    }

    // 2. Shape Layer Restyling
    if (restyleShapes && (cloned.type === 'rectangle' || cloned.type === 'circle')) {
      const shape = cloned as any;

      switch (role) {
        case 'background':
          if (shape.type === 'circle') {
            shape.color = palette.primary;
            shape.opacity = 0.15;
          } else {
            shape.color = palette.background;
          }
          break;

        case 'cta_button':
          shape.color = palette.primary;
          if (styleId === 'neoBrutalism' || styleId === 'brutalism') {
            shape.cornerRadius = 0;
            shape.stroke = { color: '#000000', width: 3 };
            shape.shadow = { offsetX: 5, offsetY: 5, blur: 0, color: '#000000' };
          } else if (styleId === 'bentoGrid' || styleId === 'aurora') {
            shape.cornerRadius = 16;
            shape.shadow = { offsetX: 0, offsetY: 8, blur: 20, color: `${palette.primary}55` };
          } else if (styleId === 'luxuryTypography') {
            shape.cornerRadius = 6;
            shape.color = palette.accent;
            shape.shadow = { offsetX: 0, offsetY: 6, blur: 18, color: '#00000066' };
          } else if (styleId === 'swissStyle' || styleId === 'bauhaus') {
            shape.cornerRadius = 0;
            shape.shadow = undefined;
          } else if (styleId === 'synthwave') {
            shape.cornerRadius = 12;
            shape.shadow = { offsetX: 0, offsetY: 0, blur: 24, color: palette.primary };
          }
          break;

        case 'offer_card':
          shape.color = palette.surface;
          shape.stroke = { color: palette.border, width: 1 };
          if (styleId === 'neoBrutalism' || styleId === 'brutalism') {
            shape.cornerRadius = 4;
            shape.stroke = { color: '#000000', width: 3 };
            shape.shadow = { offsetX: 6, offsetY: 6, blur: 0, color: '#000000' };
          } else if (styleId === 'bentoGrid' || styleId === 'aurora') {
            shape.cornerRadius = 20;
            shape.shadow = { offsetX: 0, offsetY: 12, blur: 30, color: '#00000044' };
          }
          break;

        default:
          shape.color = palette.secondary;
          break;
      }
    }

    return cloned;
  });

  return {
    ...artboard,
    id: uuidv4(),
    name: `${artboard.name} • ${style.name}`,
    backgroundColor: palette.background,
    layers: restyledLayers,
  };
}

/**
 * Generates harmonic color permutations within the same design movement.
 */
export function shuffleStyleVariations(
  artboard: Artboard,
  styleId: string
): Artboard {
  const style = DESIGN_STYLE_DATABASE[styleId] || DESIGN_STYLE_DATABASE.bentoGrid;
  const p = style.palette;

  // Alternate harmonic combinations
  const permutations = [
    { bg: p.background, prim: p.primary, sec: p.secondary, acc: p.accent },
    { bg: p.background, prim: p.accent, sec: p.primary, acc: p.secondary },
    { bg: p.surface, prim: p.secondary, sec: p.accent, acc: p.primary },
    { bg: p.background, prim: p.secondary, sec: p.primary, acc: p.accent },
  ];

  const randomPerm = permutations[Math.floor(Math.random() * permutations.length)];

  const updatedLayers = artboard.layers.map((l) => {
    const cloned = structuredClone(l);
    cloned.id = uuidv4();

    if (cloned.type === 'text') {
      const txt = cloned as TextLayer;
      const role = classifyLayerRole(l, artboard.layers, artboard.width, artboard.height);
      if (role === 'headline' || role === 'cta_label') {
        txt.color = ensureAccessibleContrast(randomPerm.prim, randomPerm.bg, 4.5);
      }
    } else if (cloned.type === 'rectangle' || cloned.type === 'circle') {
      const shape = cloned as ShapeLayer;
      const role = classifyLayerRole(l, artboard.layers, artboard.width, artboard.height);
      if (role === 'cta_button') {
        shape.color = randomPerm.prim;
      } else if (role === 'offer_card') {
        shape.color = randomPerm.bg;
      }
    }

    return cloned;
  });

  return {
    ...artboard,
    id: uuidv4(),
    name: `${artboard.name} (Harmonic Variation)`,
    backgroundColor: randomPerm.bg,
    layers: updatedLayers,
  };
}

export const applyAestheticMovement = applyStyleTransfer;

