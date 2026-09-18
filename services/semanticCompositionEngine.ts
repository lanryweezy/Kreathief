/**
 * Semantic Composition Engine
 *
 * Implements slot-based semantic layout (header, hero_zone, message_block, action_footer)
 * with fluid responsive math, rich vector accents (starbursts, ribbons, blobs),
 * and the Hybrid "Hero Visual Cutout + Vector Copy" pipeline.
 */

import { Layer, Gradient } from '../types';
import { ArtboardDesignResult } from './aiDesignDirector';
import { resolveHeroPhoto } from './visualAssetDirector';
import { getHeroCutout, prewarmHeroCutout } from './heroCutoutPipeline';
import { estimateTextDimensions } from '../utils/designPolish';
import { recommendPairingForStyle } from './typographyPairingEngine';
import { v4 as uuidv4 } from 'uuid';

// Curated vector path data for badges, flourishes, and decorative accents
export const VECTOR_ACCENTS = {
  BURST_16: {
    pathData:
      'M 50,0 L 58,15 L 75,7 L 78,25 L 95,25 L 90,42 L 100,56 L 88,68 L 92,85 L 75,88 L 70,100 L 54,93 L 42,100 L 35,88 L 18,88 L 20,70 L 5,60 L 15,45 L 8,28 L 25,25 L 28,8 L 45,15 Z',
    viewBox: '0 0 100 100',
  },
  BURST_12: {
    pathData: 'M 50,0 L 60,30 L 90,20 L 75,50 L 100,75 L 70,80 L 50,100 L 30,80 L 0,75 L 25,50 L 10,20 L 40,30 Z',
    viewBox: '0 0 100 100',
  },
  ROSETTE: {
    pathData: 'M 50,5 A 45,45 0 0,1 95,50 A 45,45 0 0,1 50,95 A 45,45 0 0,1 5,50 A 45,45 0 0,1 50,5 Z',
    viewBox: '0 0 100 100',
  },
  FLUID_BLOB: {
    pathData: 'M 50,5 C 75,5 95,25 90,50 C 85,75 70,95 45,95 C 20,95 5,75 10,45 C 15,15 25,5 50,5 Z',
    viewBox: '0 0 100 100',
  },
  WAVE_DIVIDER: {
    pathData: 'M 0,50 Q 25,20 50,50 T 100,50',
    viewBox: '0 0 100 100',
  },
  RIBBON: {
    pathData: 'M 0,25 H 100 L 85,50 L 100,75 H 0 L 15,50 Z',
    viewBox: '0 0 100 100',
  },
};

export type HeroPlacementMode = 'split-right' | 'split-left' | 'center-stage' | 'full-bleed';

export interface SemanticLayoutOptions {
  prompt: string;
  width: number;
  height: number;
  archetype?: string;
  heroPlacement?: HeroPlacementMode;
  heroImageUrl?: string;
  brandKit?: import('../types').BrandKit | null;
  enableCutout?: boolean;
}

const PALETTES: Record<
  string,
  { primary: string; accent: string; bgDark: string; bgLight: string; textMuted: string }
> = {
  saas: { primary: '#38bdf8', accent: '#6366f1', bgDark: '#0b0f19', bgLight: '#1e293b', textMuted: '#94a3b8' },
  editorial: { primary: '#ffffff', accent: '#d97706', bgDark: '#0f0f11', bgLight: '#262626', textMuted: '#a3a3a3' },
  fitness: { primary: '#ff3344', accent: '#a3ff12', bgDark: '#09090f', bgLight: '#181829', textMuted: '#94a3b8' },
  cyberpunk: { primary: '#00f0ff', accent: '#ff007f', bgDark: '#080512', bgLight: '#1a0933', textMuted: '#a78bfa' },
  luxury: { primary: '#f5d061', accent: '#e6ca65', bgDark: '#0a0703', bgLight: '#1c1508', textMuted: '#c5b89a' },
  fashion: { primary: '#ffffff', accent: '#ff2d55', bgDark: '#0a0a0a', bgLight: '#1f1f23', textMuted: '#71717a' },
  event: { primary: '#00f0ff', accent: '#ff007f', bgDark: '#090214', bgLight: '#1c0736', textMuted: '#c084fc' },
  food: { primary: '#ff6b00', accent: '#f59e0b', bgDark: '#1a0a00', bgLight: '#2d1200', textMuted: '#d4956a' },
};

function assembleLayers(
  options: SemanticLayoutOptions,
  heroSrc: string,
  isTransparentCutout: boolean
): ArtboardDesignResult {
  const {
    prompt,
    width,
    height,
    archetype = 'saas',
    heroPlacement = width >= height ? 'split-right' : 'split-left',
    brandKit,
  } = options;

  let pal = PALETTES[archetype] || PALETTES.saas;
  const pairing = recommendPairingForStyle(archetype);
  let fontHeading = pairing.heading || 'Outfit';
  let fontBody = pairing.body || 'Inter';

  if (brandKit) {
    pal = {
      primary: brandKit.colors[2] || brandKit.colors[0] || pal.primary,
      accent: brandKit.colors[1] || pal.accent,
      bgDark: brandKit.colors[0] || pal.bgDark,
      bgLight: brandKit.colors[3] || pal.bgLight,
      textMuted: brandKit.colors[1] || pal.textMuted,
    };
    if (brandKit.fonts.length > 0) {
      fontHeading = brandKit.fonts[0];
    }
    if (brandKit.fonts.length > 1) {
      fontBody = brandKit.fonts[1];
    }
  }

  const isLandscape = width >= height;
  const padX = Math.round(width * 0.07);
  const padY = Math.round(height * 0.07);

  // Compute Semantic Slots
  let copyX: number;
  let copyWidth: number;
  let heroX: number;
  let heroY: number;
  let heroWidth: number;
  let heroHeight: number;

  if (isLandscape) {
    if (heroPlacement === 'split-left') {
      heroX = padX;
      heroY = padY;
      heroWidth = Math.round(width * 0.42);
      heroHeight = height - padY * 2;
      copyX = Math.round(width * 0.52);
      copyWidth = Math.round(width * 0.41);
    } else {
      // split-right
      copyX = padX;
      copyWidth = Math.round(width * 0.44);
      heroX = Math.round(width * 0.52);
      heroY = padY;
      heroWidth = Math.round(width * 0.41);
      heroHeight = height - padY * 2;
    }
  } else {
    // Portrait / Square
    heroX = padX;
    heroY = Math.round(height * 0.08);
    heroWidth = width - padX * 2;
    heroHeight = Math.round(height * 0.44);
    copyX = padX;
    copyWidth = width - padX * 2;
  }

  // Typography Dimensions Calculation
  const headline = prompt.trim().toUpperCase().slice(0, 36) || 'DESIGN THE FUTURE';
  const hlFontSize = isLandscape
    ? Math.max(36, Math.min(68, Math.round(width * 0.048)))
    : Math.max(32, Math.min(54, Math.round(width * 0.065)));
  const hlLineHeight = 1.08;
  const hlDim = estimateTextDimensions(headline, hlFontSize, copyWidth, hlLineHeight, -0.5, fontHeading, 900);

  const subhead = `Experience next-generation visual design engineered with automated hierarchy and production-grade precision.`;
  const subFontSize = isLandscape ? Math.max(14, Math.round(width * 0.015)) : Math.max(13, Math.round(width * 0.022));
  const subDim = estimateTextDimensions(subhead, subFontSize, copyWidth, 1.45, 0, fontBody, 400);

  const startY = isLandscape ? Math.round(height * 0.18) : heroY + heroHeight + Math.round(height * 0.04);
  const eyebrowY = startY;
  const eyebrowHeight = 32;
  const headlineY = eyebrowY + eyebrowHeight + 16;
  const subheadY = headlineY + hlDim.height + 16;
  const actionY = subheadY + subDim.height + 24;

  const layers: Layer[] = [];

  // Layer 0: Background Canvas with Deep Atmospheric Gradient
  const bgGradient: Gradient = {
    type: 'linear',
    angle: 145,
    colors: [
      { color: pal.bgDark, position: 0 },
      { color: pal.bgLight, position: 0.7 },
      { color: pal.bgDark, position: 1 },
    ],
  };

  layers.push({
    id: `bg_${uuidv4().slice(0, 8)}`,
    type: 'rectangle',
    name: 'Canvas Background',
    x: 0,
    y: 0,
    width,
    height,
    color: pal.bgDark,
    opacity: 1,
    locked: true,
    visible: true,
    rotation: 0,
    gradient: bgGradient,
  } as any);

  // Layer 1: Ambient Backdrop Glow / Fluid Vector Blob
  layers.push({
    id: `glow_${uuidv4().slice(0, 8)}`,
    type: 'circle',
    name: 'Atmospheric Glow',
    x: heroX + Math.round(heroWidth * 0.1),
    y: heroY + Math.round(heroHeight * 0.1),
    width: Math.round(heroWidth * 0.85),
    height: Math.round(heroHeight * 0.85),
    color: pal.accent,
    opacity: 0.22,
    locked: false,
    visible: true,
    rotation: 0,
    blendMode: 'screen',
  } as any);

  // Layer 2: Decorative Fluid Blob Accent
  layers.push({
    id: `blob_${uuidv4().slice(0, 8)}`,
    type: 'path',
    name: 'Fluid Graphic Blob',
    x: isLandscape ? heroX - 40 : heroX + 20,
    y: heroY + 20,
    width: Math.round(heroWidth * 0.9),
    height: Math.round(heroHeight * 0.9),
    pathData: VECTOR_ACCENTS.FLUID_BLOB.pathData,
    viewBox: VECTOR_ACCENTS.FLUID_BLOB.viewBox,
    color: pal.primary,
    opacity: 0.12,
    locked: false,
    visible: true,
    rotation: 25,
  } as any);

  // Layer 3: Hero Subject (Cutout or Framed Photography)
  if (isTransparentCutout) {
    layers.push({
      id: `hero_cutout_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: 'Hero Subject Cutout',
      src: heroSrc,
      x: heroX,
      y: heroY,
      width: heroWidth,
      height: heroHeight,
      rotation: 0,
      opacity: 1,
      shadow: { color: 'rgba(0, 0, 0, 0.55)', blur: 32, offsetX: 0, offsetY: 12 },
      locked: false,
      visible: true,
    } as any);
  } else {
    // Elegant framed photography with corner radius and subtle border
    layers.push({
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: 'Hero Photograph',
      src: heroSrc,
      x: heroX,
      y: heroY,
      width: heroWidth,
      height: heroHeight,
      rotation: 0,
      opacity: 1,
      cornerRadius: 20,
      shadow: { color: 'rgba(0, 0, 0, 0.45)', blur: 28, offsetX: 0, offsetY: 8 },
      locked: false,
      visible: true,
    } as any);

    // Frame border
    layers.push({
      id: `frame_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Hero Frame Scrim',
      x: heroX,
      y: heroY,
      width: heroWidth,
      height: heroHeight,
      rotation: 0,
      opacity: 0.25,
      color: 'transparent',
      stroke: { color: pal.accent, width: 1.5 },
      cornerRadius: 20,
      locked: false,
      visible: true,
    } as any);
  }

  // Layer 4: Header Zone — Category Eyebrow Pill + Icon
  const eyebrowWidth = Math.min(220, Math.round(copyWidth * 0.5));
  layers.push({
    id: `eyebrow_pill_${uuidv4().slice(0, 8)}`,
    type: 'rectangle',
    name: 'Eyebrow Pill Frame',
    x: copyX,
    y: eyebrowY,
    width: eyebrowWidth,
    height: eyebrowHeight,
    color: 'rgba(255, 255, 255, 0.08)',
    cornerRadius: 16,
    stroke: { color: 'rgba(255, 255, 255, 0.18)', width: 1 },
    locked: false,
    visible: true,
    rotation: 0,
  } as any);

  layers.push({
    id: `eyebrow_txt_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: 'Eyebrow Label',
    text: `✦ ${archetype.toUpperCase()}`,
    x: copyX + 16,
    y: eyebrowY + 8,
    width: eyebrowWidth - 32,
    height: 18,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontBody,
    color: pal.primary,
    letterSpacing: 2,
    textAlign: 'left',
    textTransform: 'uppercase',
    locked: false,
    visible: true,
    rotation: 0,
  } as any);

  // Layer 5: Message Block — Display Headline
  layers.push({
    id: `headline_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: 'Primary Headline',
    text: headline,
    x: copyX,
    y: headlineY,
    width: copyWidth,
    height: hlDim.height,
    fontSize: hlFontSize,
    fontWeight: '900',
    fontFamily: fontHeading,
    color: '#ffffff',
    letterSpacing: -1,
    lineHeight: hlLineHeight,
    textAlign: 'left',
    textShadow: { color: 'rgba(0, 0, 0, 0.5)', blur: 20, offsetX: 0, offsetY: 4 },
    locked: false,
    visible: true,
    rotation: 0,
  } as any);

  // Layer 6: Message Block — Subtitle
  layers.push({
    id: `subhead_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: 'Descriptive Subtitle',
    text: subhead,
    x: copyX,
    y: subheadY,
    width: copyWidth,
    height: subDim.height,
    fontSize: subFontSize,
    fontWeight: '400',
    fontFamily: fontBody,
    color: pal.textMuted,
    lineHeight: 1.45,
    textAlign: 'left',
    locked: false,
    visible: true,
    rotation: 0,
  } as any);

  // Layer 7: Action Footer — High-Contrast CTA Button
  const btnWidth = Math.min(240, Math.round(copyWidth * 0.58));
  const btnHeight = 52;
  layers.push({
    id: `cta_btn_${uuidv4().slice(0, 8)}`,
    type: 'rectangle',
    name: 'CTA Button Background',
    x: copyX,
    y: actionY,
    width: btnWidth,
    height: btnHeight,
    color: pal.primary,
    cornerRadius: 12,
    shadow: { color: 'rgba(0, 0, 0, 0.35)', blur: 16, offsetX: 0, offsetY: 6 },
    locked: false,
    visible: true,
    rotation: 0,
  } as any);

  layers.push({
    id: `cta_txt_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: 'CTA Button Text',
    text: 'EXPLORE NOW →',
    x: copyX + 16,
    y: actionY + 18,
    width: btnWidth - 32,
    height: 18,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: fontBody,
    color: pal.bgDark,
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    locked: false,
    visible: true,
    rotation: 0,
  } as any);

  // Layer 8: Floating 16-Point Burst Sticker
  const stickerSize = Math.max(54, Math.round(width * 0.065));
  const stickerX = isLandscape ? heroX + heroWidth - Math.round(stickerSize * 0.6) : width - padX - stickerSize;
  const stickerY = isLandscape
    ? heroY - Math.round(stickerSize * 0.4)
    : heroY + heroHeight - Math.round(stickerSize * 0.6);

  layers.push({
    id: `burst_sticker_${uuidv4().slice(0, 8)}`,
    type: 'path',
    name: '16-Point Burst Badge',
    x: stickerX,
    y: stickerY,
    width: stickerSize,
    height: stickerSize,
    pathData: VECTOR_ACCENTS.BURST_16.pathData,
    viewBox: VECTOR_ACCENTS.BURST_16.viewBox,
    color: pal.accent,
    shadow: { color: 'rgba(0, 0, 0, 0.4)', blur: 14, offsetX: 0, offsetY: 4 },
    locked: false,
    visible: true,
    rotation: -8,
  } as any);

  layers.push({
    id: `burst_txt_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: 'Burst Badge Text',
    text: 'NEW',
    x: stickerX,
    y: stickerY + Math.round(stickerSize * 0.36),
    width: stickerSize,
    height: 16,
    fontSize: Math.max(10, Math.round(stickerSize * 0.22)),
    fontWeight: '900',
    fontFamily: fontHeading,
    color: '#ffffff',
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    locked: false,
    visible: true,
    rotation: -8,
  } as any);

  return {
    title: `${archetype.toUpperCase()} Visual Campaign`,
    description: prompt,
    width,
    height,
    backgroundColor: pal.bgDark,
    backgroundGradient: bgGradient,
    layers,
  };
}

/**
 * Synchronous version of semantic composition: uses high-resolution photographic asset
 * immediately and pre-warms background removal in worker cache for subsequent exports.
 */
export function buildSemanticHybridCompositionSync(options: SemanticLayoutOptions): ArtboardDesignResult {
  const resolvedPhoto = resolveHeroPhoto(options.archetype || 'saas', options.prompt);
  const heroUrl = options.heroImageUrl || resolvedPhoto.url;
  prewarmHeroCutout(heroUrl);
  return assembleLayers(options, heroUrl, false);
}

/**
 * Asynchronous version: attempts to isolate the hero subject into a transparent PNG cutout
 * using @imgly/background-removal via heavyService, falling back gracefully to framed photography.
 */
export async function buildSemanticHybridComposition(options: SemanticLayoutOptions): Promise<ArtboardDesignResult> {
  const { prompt, archetype = 'saas', enableCutout = true } = options;

  const resolvedPhoto = resolveHeroPhoto(archetype, prompt);
  const heroUrl = options.heroImageUrl || resolvedPhoto.url;
  let heroSrc = heroUrl;
  let isTransparentCutout = false;

  if (enableCutout) {
    const cutoutRes = await getHeroCutout(heroUrl, { preferCutout: true, timeoutMs: 8000 });
    heroSrc = cutoutRes.src;
    isTransparentCutout = cutoutRes.isCutout;
  }

  return assembleLayers(options, heroSrc, isTransparentCutout);
}
