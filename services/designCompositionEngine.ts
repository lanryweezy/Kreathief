/**
 * Design Composition Engine
 * Synthesizes production-grade graphic design compositions by combining
 * high-resolution hero photography, contrast scrims, typography lockups,
 * and decorative graphic elements.
 */

import { Layer, Gradient } from '../types';
import { ArtboardDesignResult } from './aiDesignDirector';
import { resolveHeroPhoto } from './visualAssetDirector';
import { v4 as uuidv4 } from 'uuid';

export interface CompositionOptions {
  archetype: string;
  width: number;
  height: number;
  prompt: string;
}

// Color palettes for composition styling
const ARCHETYPE_PALETTES: Record<string, { primary: string; accent: string; bgDark: string; bgLight: string; textMuted: string }> = {
  fitness: { primary: '#ff3344', accent: '#a3ff12', bgDark: '#0b0b14', bgLight: '#181829', textMuted: '#94a3b8' },
  realEstate: { primary: '#c8a87c', accent: '#3b82f6', bgDark: '#1a3c34', bgLight: '#f5f0eb', textMuted: '#a3b899' },
  fashion: { primary: '#ffffff', accent: '#ff2d55', bgDark: '#09090b', bgLight: '#18181b', textMuted: '#71717a' },
  event: { primary: '#00f0ff', accent: '#ff007f', bgDark: '#090214', bgLight: '#16042a', textMuted: '#a78bfa' },
  education: { primary: '#4f46e5', accent: '#d97706', bgDark: '#0f172a', bgLight: '#f8fafc', textMuted: '#64748b' },
  ecommerce: { primary: '#dc2626', accent: '#fbbf24', bgDark: '#0b0f19', bgLight: '#1e293b', textMuted: '#94a3b8' },
  saas: { primary: '#38bdf8', accent: '#6366f1', bgDark: '#0f172a', bgLight: '#1e293b', textMuted: '#94a3b8' },
  cyberpunk: { primary: '#00f0ff', accent: '#ff007f', bgDark: '#090a0f', bgLight: '#180829', textMuted: '#94a3b8' },
  food: { primary: '#ff6b00', accent: '#e85d04', bgDark: '#1a0a00', bgLight: '#2d1200', textMuted: '#d4956a' },
  luxury: { primary: '#d4af37', accent: '#e6ca65', bgDark: '#0a0703', bgLight: '#1c1508', textMuted: '#a89878' },
  africanMarket: { primary: '#f59e0b', accent: '#10b981', bgDark: '#0d1b2a', bgLight: '#1b2838', textMuted: '#fcd34d' },
  editorial: { primary: '#ffffff', accent: '#000000', bgDark: '#111111', bgLight: '#f4f4f5', textMuted: '#71717a' },
};

/**
 * Composition Style 1: 50/50 Hero Split
 * Left or Top: Framed high-res hero photography with soft elevation
 * Right or Bottom: Typography lockup, pill tag, proof badge, and CTA
 */
export function buildHeroSplitComposition(opts: CompositionOptions): ArtboardDesignResult {
  const { width, height, prompt, archetype } = opts;
  const pal = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.fitness;
  const photo = resolveHeroPhoto(archetype, prompt);
  const isLandscape = width >= height;

  const layers: Layer[] = [
    // 1. Background base card
    {
      id: `bg_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Background Canvas',
      x: 0,
      y: 0,
      width,
      height,
      color: pal.bgDark,
      fill: pal.bgDark,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. Ambient background glow
    {
      id: `glow_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Ambient Glow',
      x: isLandscape ? width * 0.75 : width * 0.5,
      y: isLandscape ? height * 0.5 : height * 0.75,
      width: Math.min(width, height) * 0.8,
      height: Math.min(width, height) * 0.8,
      color: pal.accent,
      fill: pal.accent,
      opacity: 0.15,
      locked: false,
      visible: true,
      rotation: 0,
      blendMode: 'screen',
    } as any,

    // 3. Hero Photographic Image
    {
      id: `hero_img_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Hero Photo — ${photo.alt}`,
      src: photo.url,
      x: isLandscape ? width * 0.52 : width * 0.06,
      y: isLandscape ? height * 0.08 : height * 0.06,
      width: isLandscape ? width * 0.42 : width * 0.88,
      height: isLandscape ? height * 0.84 : height * 0.44,
      rotation: 0,
      opacity: 1,
      cornerRadius: 16,
      shadow: { color: 'rgba(0, 0, 0, 0.4)', blur: 24, offsetX: 0, offsetY: 8 },
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
    } as any,

    // 4. Subtle photo border frame
    {
      id: `frame_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Photo Frame Border',
      x: isLandscape ? width * 0.52 : width * 0.06,
      y: isLandscape ? height * 0.08 : height * 0.06,
      width: isLandscape ? width * 0.42 : width * 0.88,
      height: isLandscape ? height * 0.84 : height * 0.44,
      rotation: 0,
      opacity: 0.3,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: pal.accent, width: 1.5 },
      cornerRadius: 16,
      locked: false,
      visible: true,
    } as any,

    // 5. Eyebrow Category Pill
    {
      id: `pill_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Category Pill',
      x: width * 0.08,
      y: isLandscape ? height * 0.14 : height * 0.54,
      width: isLandscape ? width * 0.3 : width * 0.5,
      height: 32,
      rotation: 0,
      opacity: 1,
      color: 'rgba(255, 255, 255, 0.08)',
      fill: 'rgba(255, 255, 255, 0.08)',
      stroke: { color: pal.accent, width: 1 },
      cornerRadius: 999,
      locked: false,
      visible: true,
    } as any,
    {
      id: `pill_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Category Pill Text',
      text: `★ ${archetype.toUpperCase()} SPOTLIGHT`,
      x: width * 0.08,
      y: isLandscape ? height * 0.152 : height * 0.552,
      width: isLandscape ? width * 0.3 : width * 0.5,
      height: 20,
      fontSize: Math.max(11, Math.round(width * 0.02)),
      fontWeight: '800',
      fontFamily: 'Inter',
      color: pal.accent,
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 6. Two-Tone Bold Headline
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Primary Headline',
      text: prompt.toUpperCase().slice(0, 32) || 'ELEVATE YOUR STANDARD',
      x: width * 0.08,
      y: isLandscape ? height * 0.24 : height * 0.61,
      width: isLandscape ? width * 0.4 : width * 0.84,
      height: isLandscape ? 140 : 80,
      fontSize: Math.max(28, Math.round(width * 0.065)),
      fontWeight: '900',
      fontFamily: 'Outfit',
      color: '#ffffff',
      letterSpacing: -1,
      lineHeight: 1.1,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 7. Subtitle / Value Proposition
    {
      id: `sub_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Subtitle Copy',
      text: 'Precision crafted architecture, high-impact aesthetics, and uncompromising performance tailored for modern creators.',
      x: width * 0.08,
      y: isLandscape ? height * 0.52 : height * 0.74,
      width: isLandscape ? width * 0.38 : width * 0.84,
      height: 50,
      fontSize: Math.max(13, Math.round(width * 0.024)),
      fontWeight: '400',
      fontFamily: 'Inter',
      color: pal.textMuted,
      lineHeight: 1.5,
      textAlign: 'left',
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,

    // 8. CTA Button
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'CTA Button',
      x: width * 0.08,
      y: isLandscape ? height * 0.72 : height * 0.85,
      width: isLandscape ? width * 0.28 : width * 0.55,
      height: 54,
      rotation: 0,
      opacity: 1,
      color: pal.primary,
      fill: pal.primary,
      cornerRadius: 12,
      shadow: { color: 'rgba(0, 0, 0, 0.35)', blur: 16, offsetX: 0, offsetY: 6 },
      locked: false,
      visible: true,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'CTA Text',
      text: 'DISCOVER MORE →',
      x: width * 0.08,
      y: isLandscape ? height * 0.745 : height * 0.872,
      width: isLandscape ? width * 0.28 : width * 0.55,
      height: 24,
      fontSize: Math.max(13, Math.round(width * 0.026)),
      fontWeight: '800',
      fontFamily: 'Outfit',
      color: '#ffffff',
      letterSpacing: 1.5,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${photo.alt} (Hero Split)`,
    description: `50/50 dual-zone composition with high-definition photography and balanced typography.`,
    width,
    height,
    backgroundColor: pal.bgDark,
    backgroundGradient: {
      type: 'linear',
      angle: 145,
      colors: [
        { color: pal.bgDark, position: 0 },
        { color: pal.bgLight, position: 1 },
      ],
    },
    layers,
  };
}

/**
 * Composition Style 2: Full-Bleed Atmospheric Scrim
 * High-resolution full canvas photo + multi-stop contrast gradient overlay
 * + bold focal typography + floating dynamic discount/status badge
 */
export function buildFullBleedAtmosphericComposition(opts: CompositionOptions): ArtboardDesignResult {
  const { width, height, prompt, archetype } = opts;
  const pal = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.event;
  const photo = resolveHeroPhoto(archetype, prompt);

  const layers: Layer[] = [
    // 1. Full-Bleed Background Photo
    {
      id: `hero_bleed_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Full-Bleed Photo — ${photo.alt}`,
      src: photo.url,
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      opacity: 1,
      locked: true,
      visible: true,
      flipX: false,
      flipY: false,
    } as any,

    // 2. Multi-Stop Legibility Contrast Scrim (Darkens lower half for text)
    {
      id: `scrim_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Contrast Gradient Scrim',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      opacity: 0.9,
      color: 'transparent',
      fill: 'transparent',
      gradient: {
        type: 'linear',
        angle: 180,
        colors: [
          { color: 'rgba(5, 5, 12, 0.2)', position: 0 },
          { color: 'rgba(5, 5, 12, 0.65)', position: 0.45 },
          { color: 'rgba(5, 5, 12, 0.96)', position: 0.9 },
        ],
      },
      locked: false,
      visible: true,
    } as any,

    // 3. Floating Tilted Badge
    {
      id: `badge_bg_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Floating Status Badge',
      x: width * 0.72,
      y: height * 0.1,
      width: width * 0.22,
      height: 44,
      rotation: -5,
      opacity: 1,
      color: pal.accent,
      fill: pal.accent,
      cornerRadius: 10,
      shadow: { color: 'rgba(0, 0, 0, 0.5)', blur: 20, offsetX: 0, offsetY: 6 },
      locked: false,
      visible: true,
    } as any,
    {
      id: `badge_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Badge Text',
      text: 'LIMITED DROP',
      x: width * 0.72,
      y: height * 0.116,
      width: width * 0.22,
      height: 22,
      fontSize: Math.max(11, Math.round(width * 0.022)),
      fontWeight: '900',
      fontFamily: 'Outfit',
      color: '#090812',
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: -5,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 4. Accent category tag
    {
      id: `cat_tag_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Eyebrow Tag',
      text: `/// ${archetype.toUpperCase()} EDITION ///`,
      x: width * 0.08,
      y: height * 0.46,
      width: width * 0.84,
      height: 24,
      fontSize: Math.max(12, Math.round(width * 0.024)),
      fontWeight: '800',
      fontFamily: 'Inter',
      color: pal.primary,
      letterSpacing: 4,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 5. Massive Hero Headline
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Main Headline',
      text: prompt.toUpperCase().slice(0, 28) || 'UNFORGETTABLE MOMENTS',
      x: width * 0.08,
      y: height * 0.52,
      width: width * 0.84,
      height: 140,
      fontSize: Math.max(36, Math.round(width * 0.09)),
      fontWeight: '900',
      fontFamily: 'Outfit',
      color: '#ffffff',
      letterSpacing: -1,
      lineHeight: 1.05,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      textShadow: { color: 'rgba(0, 0, 0, 0.8)', blur: 20, offsetX: 0, offsetY: 6 },
    } as any,

    // 6. Subhead
    {
      id: `sub_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Supporting Subhead',
      text: 'Experience visionary production, immersive audio, and unforgettable creative atmosphere.',
      x: width * 0.08,
      y: height * 0.74,
      width: width * 0.65,
      height: 48,
      fontSize: Math.max(14, Math.round(width * 0.027)),
      fontWeight: '500',
      fontFamily: 'Inter',
      color: '#e2e8f0',
      lineHeight: 1.4,
      textAlign: 'left',
      rotation: 0,
      opacity: 0.95,
      locked: false,
      visible: true,
    } as any,

    // 7. Full-bleed CTA Button
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'CTA Button',
      x: width * 0.08,
      y: height * 0.84,
      width: width * 0.45,
      height: 56,
      rotation: 0,
      opacity: 1,
      color: pal.primary,
      fill: pal.primary,
      cornerRadius: 10,
      shadow: { color: 'rgba(0, 0, 0, 0.4)', blur: 20, offsetX: 0, offsetY: 6 },
      locked: false,
      visible: true,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'CTA Text',
      text: 'GET ACCESS NOW →',
      x: width * 0.08,
      y: height * 0.865,
      width: width * 0.45,
      height: 24,
      fontSize: Math.max(13, Math.round(width * 0.028)),
      fontWeight: '800',
      fontFamily: 'Outfit',
      color: '#ffffff',
      letterSpacing: 1.5,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${photo.alt} (Full-Bleed Scrim)`,
    description: `Cinematic full-canvas photographic poster with multi-stop contrast scrim.`,
    width,
    height,
    backgroundColor: '#05050c',
    layers,
  };
}

/**
 * Composition Style 3: Floating Glassmorphism Card
 * Mood backdrop photo + frosted glass card container + inset hero visual + refined serif/sans copy
 */
export function buildGlassCardComposition(opts: CompositionOptions): ArtboardDesignResult {
  const { width, height, prompt, archetype } = opts;
  const pal = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.luxury;
  const photo = resolveHeroPhoto(archetype, prompt);

  const cardW = width * 0.86;
  const cardH = height * 0.86;
  const cardX = width * 0.07;
  const cardY = height * 0.07;

  const layers: Layer[] = [
    // 1. Atmosphere base background
    {
      id: `bg_base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Dark Studio Base',
      x: 0,
      y: 0,
      width,
      height,
      color: pal.bgDark,
      fill: pal.bgDark,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. Radial atmospheric orb
    {
      id: `orb_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Ambient Orb',
      x: width * 0.5,
      y: height * 0.5,
      width: width * 0.8,
      height: width * 0.8,
      color: pal.primary,
      fill: pal.primary,
      opacity: 0.18,
      locked: false,
      visible: true,
      rotation: 0,
      blendMode: 'screen',
    } as any,

    // 3. Frosted Glass Container Card
    {
      id: `card_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Frosted Glass Card',
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      rotation: 0,
      opacity: 1,
      color: 'rgba(18, 16, 32, 0.85)',
      fill: 'rgba(18, 16, 32, 0.85)',
      stroke: { color: 'rgba(255, 255, 255, 0.15)', width: 1.5 },
      cornerRadius: 24,
      shadow: { color: 'rgba(0, 0, 0, 0.6)', blur: 36, offsetX: 0, offsetY: 16 },
      locked: false,
      visible: true,
    } as any,

    // 4. Inset Hero Photography Frame
    {
      id: `card_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Inset Photo — ${photo.alt}`,
      src: photo.url,
      x: cardX + cardW * 0.06,
      y: cardY + cardH * 0.06,
      width: cardW * 0.88,
      height: cardH * 0.46,
      rotation: 0,
      opacity: 1,
      cornerRadius: 16,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
    } as any,

    // 5. Eyebrow Tag
    {
      id: `tag_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Brand Eyebrow',
      text: `EXCLUSIVELY CURATED · ${archetype.toUpperCase()}`,
      x: cardX + cardW * 0.06,
      y: cardY + cardH * 0.56,
      width: cardW * 0.88,
      height: 22,
      fontSize: Math.max(11, Math.round(width * 0.022)),
      fontWeight: '700',
      fontFamily: 'Inter',
      color: pal.primary,
      letterSpacing: 3,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 6. Refined Headline
    {
      id: `title_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Curated Title',
      text: prompt.slice(0, 32) || 'Modern Architectural Showcase',
      x: cardX + cardW * 0.06,
      y: cardY + cardH * 0.62,
      width: cardW * 0.88,
      height: 70,
      fontSize: Math.max(28, Math.round(width * 0.062)),
      fontWeight: '700',
      fontFamily: 'Playfair Display',
      color: '#ffffff',
      letterSpacing: -0.5,
      lineHeight: 1.15,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 7. Stat / Rating line
    {
      id: `stats_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Key Specs',
      text: '★ 4.98 Rating · Verified Authentic · Bespoke Architecture',
      x: cardX + cardW * 0.06,
      y: cardY + cardH * 0.76,
      width: cardW * 0.88,
      height: 24,
      fontSize: Math.max(12, Math.round(width * 0.024)),
      fontWeight: '500',
      fontFamily: 'Inter',
      color: pal.textMuted,
      textAlign: 'left',
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,

    // 8. Elevated Action CTA Button
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Action Button',
      x: cardX + cardW * 0.06,
      y: cardY + cardH * 0.83,
      width: cardW * 0.45,
      height: 48,
      rotation: 0,
      opacity: 1,
      color: pal.primary,
      fill: pal.primary,
      cornerRadius: 10,
      shadow: { color: 'rgba(0, 0, 0, 0.4)', blur: 16, offsetX: 0, offsetY: 6 },
      locked: false,
      visible: true,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Action Button Text',
      text: 'RESERVE EXPERIENCE →',
      x: cardX + cardW * 0.06,
      y: cardY + cardH * 0.852,
      width: cardW * 0.45,
      height: 22,
      fontSize: Math.max(12, Math.round(width * 0.024)),
      fontWeight: '800',
      fontFamily: 'Outfit',
      color: '#090812',
      letterSpacing: 1.5,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${photo.alt} (Glassmorphism Frame)`,
    description: `Elevated glassmorphism card showcase with inset hero photograph.`,
    width,
    height,
    backgroundColor: pal.bgDark,
    layers,
  };
}

/**
 * Intelligent Composition Selector
 * Routes semantic archetypes to their optimal visual layout framework
 */
export function buildCompositionForArchetype(
  archetype: string,
  width: number,
  height: number,
  prompt: string,
  stylePreference?: 'heroSplit' | 'fullBleed' | 'glassCard'
): ArtboardDesignResult {
  if (stylePreference === 'heroSplit') {
    return buildHeroSplitComposition({ archetype, width, height, prompt });
  }
  if (stylePreference === 'fullBleed') {
    return buildFullBleedAtmosphericComposition({ archetype, width, height, prompt });
  }
  if (stylePreference === 'glassCard') {
    return buildGlassCardComposition({ archetype, width, height, prompt });
  }

  // Curated style mappings matching each category's strongest visual format
  const glassArchetypes = ['luxury', 'realEstate', 'editorial'];
  const fullBleedArchetypes = ['event', 'cyberpunk', 'food', 'fashion'];

  if (glassArchetypes.includes(archetype)) {
    return buildGlassCardComposition({ archetype, width, height, prompt });
  }
  if (fullBleedArchetypes.includes(archetype)) {
    return buildFullBleedAtmosphericComposition({ archetype, width, height, prompt });
  }
  return buildHeroSplitComposition({ archetype, width, height, prompt });
}

