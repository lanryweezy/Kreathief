/**
 * Design Composition Engine
 * Synthesizes production-grade graphic design compositions by combining
 * high-resolution hero photography, contrast scrims, typography lockups,
 * and decorative graphic elements.
 */

import { Layer, Gradient } from '../types';
import { ArtboardDesignResult } from './aiDesignDirector';
import { resolveHeroPhoto } from './visualAssetDirector';
import { estimateTextDimensions } from '../utils/designPolish';
import { v4 as uuidv4 } from 'uuid';

export interface CompositionOptions {
  archetype: string;
  width: number;
  height: number;
  prompt: string;
  brandKit?: import('../types').BrandKit | null;
}

// Context-aware specs for card templates (replaces generic hardcoded text)
export const ARCHETYPE_SPECS: Record<string, string> = {
  food: '★ 4.9 Rating · Authentic Naija Recipe · Fresh & Hot Daily',
  event: '★ Live Performance · VIP Passes Available · Doors Open 6PM',
  fitness: '★ High-Intensity Training · Certified Elite Coaches · 24/7 Access',
  saas: '★ 99.99% Uptime SLA · Enterprise Security · Real-time Analytics',
  fashion: '★ Limited Edition Drop · Premium Quality Fabric · Global Delivery',
  cyberpunk: '★ Tokyo Neo-Noir Streetwear · Limited Edition · 100% Cotton',
  luxury: '★ Handcrafted Masterpiece · Rare Ingredients · Artisanal Edition',
  africanMarket: '★ 100% Authentic Lagos Flavors · Premium Recipe · Served Fresh',
  education: '★ Industry-Accredited Curriculum · Hands-On Projects · Mentorship',
  realEstate: '★ Prime Metropolitan Location · Architectural Excellence · Private Tour',
  ecommerce: '★ Verified Customer Favorite · Fast Global Shipping · 30-Day Guarantee',
  editorial: '★ Curated Exhibition · Limited Edition Catalogue · Exclusive Access',
};

// Context-aware subheads
export const ARCHETYPE_SUBHEADS: Record<string, string> = {
  food: 'Indulge in authentic signature dishes, smoky firewood aromas, and unforgettable culinary heritage.',
  event: 'Experience high-energy live sound, world-class stage production, and an electric night crowd.',
  fitness: 'Transform your physical power with science-backed conditioning and relentless coaching.',
  saas: 'Automate complex mission-critical workflows with sub-second intelligence and unified observability.',
  fashion: 'Structured tailoring meets contemporary streetwear silhouettes for the modern style vanguard.',
  cyberpunk: 'Engineered for neon dystopia. Heavyweight dropped-shoulder construction with technical resilience.',
  luxury: 'A transcendent sensory journey crafted with obsessive precision for the most discerning connoisseurs.',
  africanMarket: 'Celebrate vibrant African creativity, rich cultural rhythm, and authentic entrepreneurship.',
  education: 'Master in-demand creative and technical skills through immersive cohort-driven curriculum.',
  realEstate: 'Discover world-class architectural sanctuaries framed by panoramic natural vistas.',
  ecommerce: 'Engineered for exceptional everyday performance with durable, aerospace-grade materials.',
  editorial: 'An unfiltered visual dialogue exploring the tension between minimalist form and cultural identity.',
};

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
  const { width, height, prompt, archetype, brandKit } = opts;
  
  let pal = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.fitness;
  let fontHeading = 'Outfit';
  let fontBody = 'Inter';

  if (brandKit) {
    pal = {
      primary: brandKit.colors[2] || brandKit.colors[0] || pal.primary,
      accent: brandKit.colors[1] || pal.accent,
      bgDark: brandKit.colors[0] || pal.bgDark,
      bgLight: brandKit.colors[3] || pal.bgLight,
      textMuted: brandKit.colors[1] || pal.textMuted,
    };
    if (brandKit.fonts.length > 0) fontHeading = brandKit.fonts[0];
    if (brandKit.fonts.length > 1) fontBody = brandKit.fonts[1];
  }

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

    // 5. Hero Content Stack (Auto Layout Group)
    ...(() => {
      const hlText = prompt.toUpperCase().slice(0, 32) || 'ELEVATE YOUR STANDARD';
      const hlFontSize = Math.max(28, Math.round(width * 0.062));
      const hlWidth = isLandscape ? width * 0.4 : width * 0.84;
      
      const subText = ARCHETYPE_SUBHEADS[archetype] || ARCHETYPE_SUBHEADS.editorial;
      const subFontSize = Math.max(13, Math.round(width * 0.024));
      
      const stackGroupId = `group_stack_${uuidv4().slice(0, 8)}`;
      const btnGroupId = `group_btn_${uuidv4().slice(0, 8)}`;
      
      return [
        {
          id: stackGroupId,
          type: 'group',
          name: 'Hero Text Stack',
          x: width * 0.08,
          y: isLandscape ? height * 0.14 : height * 0.54,
          width: hlWidth, // It will hug height automatically
          height: 200, 
          rotation: 0,
          opacity: 1,
          color: 'transparent',
          fill: 'transparent',
          locked: false,
          visible: true,
          autoLayout: {
            direction: 'col',
            padding: 0,
            spacing: 16,
            alignment: 'start',
            sizing: { width: 'fixed', height: 'hug' }
          }
        } as any,
        {
          id: `pill_${uuidv4().slice(0, 8)}`,
          type: 'group',
          name: 'Category Pill',
          groupId: stackGroupId,
          x: width * 0.08,
          y: isLandscape ? height * 0.14 : height * 0.54,
          width: 150,
          height: 32,
          rotation: 0,
          opacity: 1,
          color: 'rgba(255, 255, 255, 0.08)',
          fill: 'rgba(255, 255, 255, 0.08)',
          stroke: { color: pal.accent, width: 1 },
          cornerRadius: 999,
          locked: false,
          visible: true,
          autoLayout: {
            direction: 'row',
            padding: { top: 6, right: 16, bottom: 6, left: 16 },
            spacing: 0,
            alignment: 'center',
            sizing: { width: 'hug', height: 'hug' }
          }
        } as any,
        {
          id: `pill_text_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'Category Pill Text',
          groupId: `pill_${uuidv4().slice(0, 8)}`, // Will be fixed below by matching ID
          text: `★ ${archetype.toUpperCase()} SPOTLIGHT`,
          x: 0,
          y: 0,
          width: 150,
          height: 20,
          fontSize: Math.max(11, Math.round(width * 0.02)),
          fontWeight: '800',
          fontFamily: fontBody,
          color: pal.accent,
          letterSpacing: 2,
          textAlign: 'center',
          textTransform: 'uppercase',
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
        } as any,
        {
          id: `headline_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'Primary Headline',
          groupId: stackGroupId,
          text: hlText,
          x: width * 0.08,
          y: 0,
          width: hlWidth,
          height: 60,
          fontSize: hlFontSize,
          fontWeight: '900',
          fontFamily: fontHeading,
          color: '#ffffff',
          letterSpacing: -1,
          lineHeight: 1.1,
          textAlign: 'left',
          textTransform: 'uppercase',
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          autoLayout: {
            sizing: { width: 'fill', height: 'hug' }
          }
        } as any,
        {
          id: `sub_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'Subtitle Copy',
          groupId: stackGroupId,
          text: subText,
          x: width * 0.08,
          y: 0,
          width: hlWidth,
          height: 40,
          fontSize: subFontSize,
          fontWeight: '400',
          fontFamily: fontBody,
          color: pal.textMuted,
          lineHeight: 1.4,
          textAlign: 'left',
          rotation: 0,
          opacity: 0.9,
          locked: false,
          visible: true,
          autoLayout: {
            sizing: { width: 'fill', height: 'hug' }
          }
        } as any,
        {
          id: btnGroupId,
          type: 'group',
          name: 'CTA Button',
          groupId: stackGroupId,
          x: width * 0.08,
          y: 0,
          width: 200,
          height: 50,
          rotation: 0,
          opacity: 1,
          color: pal.primary,
          fill: pal.primary,
          cornerRadius: 12,
          shadow: { color: 'rgba(0, 0, 0, 0.35)', blur: 16, offsetX: 0, offsetY: 6 },
          locked: false,
          visible: true,
          autoLayout: {
            direction: 'row',
            padding: { top: 14, right: 32, bottom: 14, left: 32 },
            spacing: 0,
            alignment: 'center',
            sizing: { width: 'hug', height: 'hug' }
          }
        } as any,
        {
          id: `cta_text_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'CTA Text',
          groupId: btnGroupId,
          text: 'DISCOVER MORE →',
          x: width * 0.08,
          y: 0,
          width: 150,
          height: 20,
          fontSize: Math.max(13, Math.round(width * 0.024)),
          fontWeight: '800',
          fontFamily: fontHeading,
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
    })(),
  ];

  // Fix pill text reference
  const pillIdx = layers.findIndex(l => l.name === 'Category Pill');
  if (pillIdx > -1) {
    const pillId = layers[pillIdx].id;
    const pillTextIdx = layers.findIndex(l => l.name === 'Category Pill Text');
    if (pillTextIdx > -1) {
      layers[pillTextIdx].groupId = pillId;
    }
  }

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
  const { width, height, prompt, archetype, brandKit } = opts;
  
  let pal = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.fitness;
  let fontHeading = 'Space Grotesk';
  let fontBody = 'Inter';

  if (brandKit) {
    pal = {
      primary: brandKit.colors[2] || brandKit.colors[0] || pal.primary,
      accent: brandKit.colors[1] || pal.accent,
      bgDark: brandKit.colors[0] || pal.bgDark,
      bgLight: brandKit.colors[3] || pal.bgLight,
      textMuted: brandKit.colors[1] || pal.textMuted,
    };
    if (brandKit.fonts.length > 0) fontHeading = brandKit.fonts[0];
    if (brandKit.fonts.length > 1) fontBody = brandKit.fonts[1];
  }

  const photo = resolveHeroPhoto(archetype, prompt);
  const isLandscape = width >= height;

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
      fontFamily: typeof fontHeading !== "undefined" ? fontHeading : "Outfit",
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
      fontFamily: typeof fontBody !== "undefined" ? fontBody : "Inter",
      color: pal.primary,
      letterSpacing: 4,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 5. Dynamic Hero Headline
    (() => {
      const hlText = prompt.toUpperCase().slice(0, 32) || 'UNFORGETTABLE MOMENTS';
      const hlFontSize = Math.max(30, Math.round(width * 0.072));
      const hlWidth = isLandscape ? width * 0.44 : width * 0.84;
      const hlEst = estimateTextDimensions(hlText, hlFontSize, hlWidth, 1.08);
      const hlY = isLandscape ? height * 0.22 : height * 0.51;
      const hlHeight = hlEst.height;

      const subText = ARCHETYPE_SUBHEADS[archetype] || 'Experience visionary production, immersive audio, and unforgettable creative atmosphere.';
      const subFontSize = Math.max(13, Math.round(width * 0.025));
      const subWidth = isLandscape ? width * 0.40 : width * 0.70;
      const subEst = estimateTextDimensions(subText, subFontSize, subWidth, 1.35);
      const subY = hlY + hlHeight + 14;
      const subHeight = subEst.height;

      const btnY = subY + subHeight + 18;
      const btnH = 50;
      const btnTextY = btnY + Math.round((btnH - 18) / 2);

      return [
        {
          id: `headline_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'Main Headline',
          text: hlText,
          x: width * 0.08,
          y: hlY,
          width: hlWidth,
          height: hlHeight,
          fontSize: hlFontSize,
          fontWeight: '900',
          fontFamily: typeof fontHeading !== "undefined" ? fontHeading : "Outfit",
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
        {
          id: `sub_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'Supporting Subhead',
          text: subText,
          x: width * 0.08,
          y: subY,
          width: subWidth,
          height: subHeight,
          fontSize: subFontSize,
          fontWeight: '500',
          fontFamily: typeof fontBody !== "undefined" ? fontBody : "Inter",
          color: '#e2e8f0',
          lineHeight: 1.35,
          textAlign: 'left',
          rotation: 0,
          opacity: 0.95,
          locked: false,
          visible: true,
        } as any,
        {
          id: `cta_btn_${uuidv4().slice(0, 8)}`,
          type: 'rectangle',
          name: 'CTA Button',
          x: width * 0.08,
          y: btnY,
          width: isLandscape ? width * 0.28 : width * 0.44,
          height: btnH,
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
          y: btnTextY,
          width: isLandscape ? width * 0.28 : width * 0.44,
          height: 20,
          fontSize: Math.max(12, Math.round(width * 0.024)),
          fontWeight: '800',
          fontFamily: typeof fontHeading !== "undefined" ? fontHeading : "Outfit",
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
    })(),
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
  const { width, height, prompt, archetype, brandKit } = opts;
  
  let pal = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.saas;
  let fontHeading = 'Outfit';
  let fontBody = 'Inter';

  if (brandKit) {
    pal = {
      primary: brandKit.colors[2] || brandKit.colors[0] || pal.primary,
      accent: brandKit.colors[1] || pal.accent,
      bgDark: brandKit.colors[0] || pal.bgDark,
      bgLight: brandKit.colors[3] || pal.bgLight,
      textMuted: brandKit.colors[1] || pal.textMuted,
    };
    if (brandKit.fonts.length > 0) fontHeading = brandKit.fonts[0];
    if (brandKit.fonts.length > 1) fontBody = brandKit.fonts[1];
  }

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
      fontFamily: typeof fontBody !== "undefined" ? fontBody : "Inter",
      color: pal.primary,
      letterSpacing: 3,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 6. Dynamically stacked headline, specs, and CTA
    ...(() => {
      const titleText = prompt.slice(0, 36) || 'Modern Architectural Showcase';
      const titleFontSize = Math.max(26, Math.round(width * 0.056));
      const titleWidth = cardW * 0.88;
      const titleEst = estimateTextDimensions(titleText, titleFontSize, titleWidth, 1.15);
      const titleY = cardY + cardH * 0.58;
      const titleHeight = titleEst.height;

      const specsText = ARCHETYPE_SPECS[archetype] || ARCHETYPE_SPECS.editorial;
      const specsFontSize = Math.max(11, Math.round(width * 0.022));
      const specsEst = estimateTextDimensions(specsText, specsFontSize, cardW * 0.88, 1.3);
      const specsY = titleY + titleHeight + 14;
      const specsHeight = specsEst.height;

      const btnY = specsY + specsHeight + 16;
      const btnH = 46;
      const btnTextY = btnY + Math.round((btnH - 18) / 2);

      return [
        {
          id: `title_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'Curated Title',
          text: titleText,
          x: cardX + cardW * 0.06,
          y: titleY,
          width: titleWidth,
          height: titleHeight,
          fontSize: titleFontSize,
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
        {
          id: `stats_${uuidv4().slice(0, 8)}`,
          type: 'text',
          name: 'Key Specs',
          text: specsText,
          x: cardX + cardW * 0.06,
          y: specsY,
          width: cardW * 0.88,
          height: specsHeight,
          fontSize: specsFontSize,
          fontWeight: '500',
          fontFamily: typeof fontBody !== "undefined" ? fontBody : "Inter",
          color: pal.textMuted,
          textAlign: 'left',
          rotation: 0,
          opacity: 0.9,
          locked: false,
          visible: true,
        } as any,
        {
          id: `cta_btn_${uuidv4().slice(0, 8)}`,
          type: 'rectangle',
          name: 'Action Button',
          x: cardX + cardW * 0.06,
          y: btnY,
          width: cardW * 0.45,
          height: btnH,
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
          y: btnTextY,
          width: cardW * 0.45,
          height: 18,
          fontSize: Math.max(11, Math.round(width * 0.022)),
          fontWeight: '800',
          fontFamily: typeof fontHeading !== "undefined" ? fontHeading : "Outfit",
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
    })(),
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

