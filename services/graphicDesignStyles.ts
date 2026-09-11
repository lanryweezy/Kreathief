/**
 * Graphic Design Styles Engine
 * Codifies the 11 iconic graphic design movements from Looka's Visual Guide:
 * 1. Modernism
 * 2. Bauhaus
 * 3. Minimalism
 * 4. Art Deco
 * 5. Pop Art
 * 6. Swiss Style (International Typographic Style)
 * 7. Psychedelic
 * 8. Postmodernism (Memphis)
 * 9. Brutalism
 * 10. Flat Design
 * 11. Contemporary
 */

import { Layer, ShapeLayer, TextLayer, ImageLayer, Gradient } from '../types';
import { ArtboardDesignResult } from './aiDesignDirector';
import { resolveHeroPhoto } from './visualAssetDirector';
import { v4 as uuidv4 } from 'uuid';

export type GraphicDesignStyleId =
  | 'modernism'
  | 'bauhaus'
  | 'minimalism'
  | 'artDeco'
  | 'popArt'
  | 'swissStyle'
  | 'psychedelic'
  | 'postmodernism'
  | 'brutalism'
  | 'flat'
  | 'contemporary';

export interface GraphicDesignStyleMeta {
  id: GraphicDesignStyleId;
  name: string;
  era: string;
  icon: string;
  tagline: string;
  description: string;
  badge: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  typography: {
    headlineFont: string;
    bodyFont: string;
    accentFont: string;
    headlineWeight: string;
    letterSpacing: number;
    textTransform: 'uppercase' | 'none' | 'lowercase';
  };
}

export const GRAPHIC_DESIGN_STYLES: Record<GraphicDesignStyleId, GraphicDesignStyleMeta> = {
  modernism: {
    id: 'modernism',
    name: 'Modernism',
    era: 'Early 20th Century',
    icon: '🏛️',
    tagline: 'Functionality, clarity, and simplified geometric form',
    description: 'Pioneered by Paul Rand and IBM. Pure sans-serif typography, structured grid systems, and bold primary contrasts.',
    badge: 'MODERNIST GRID',
    palette: {
      primary: '#0f172a',
      secondary: '#2563eb',
      accent: '#f59e0b',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#cbd5e1',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Inter',
      accentFont: 'Space Grotesk',
      headlineWeight: '800',
      letterSpacing: -0.5,
      textTransform: 'uppercase',
    },
  },
  bauhaus: {
    id: 'bauhaus',
    name: 'Bauhaus',
    era: '1919 – 1933',
    icon: '📐',
    tagline: 'Form follows function with radical primary geometry',
    description: 'Founded by Walter Gropius and Herbert Bayer. Pure red, yellow, blue, and black. Asymmetric balance and geometric clarity.',
    badge: 'FORM FOLLOWS FUNCTION',
    palette: {
      primary: '#e52421',
      secondary: '#004586',
      accent: '#f4c300',
      background: '#f4f1ea',
      surface: '#ffffff',
      text: '#111111',
      textMuted: '#444444',
      border: '#111111',
    },
    typography: {
      headlineFont: 'Space Grotesk',
      bodyFont: 'Inter',
      accentFont: 'Space Mono',
      headlineWeight: '900',
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
  },
  minimalism: {
    id: 'minimalism',
    name: 'Minimalism',
    era: '1960s – Present',
    icon: '🕊️',
    tagline: 'As little design as possible — Dieter Rams',
    description: 'Extreme negative space, restrained neutral monochrome, exquisite typography, and absolute focus on essential message.',
    badge: 'LESS BUT BETTER',
    palette: {
      primary: '#18181b',
      secondary: '#71717a',
      accent: '#a1a1aa',
      background: '#fafafa',
      surface: '#ffffff',
      text: '#18181b',
      textMuted: '#71717a',
      border: '#e4e4e7',
    },
    typography: {
      headlineFont: 'DM Sans',
      bodyFont: 'Inter',
      accentFont: 'DM Sans',
      headlineWeight: '700',
      letterSpacing: -0.5,
      textTransform: 'none',
    },
  },
  artDeco: {
    id: 'artDeco',
    name: 'Art Deco',
    era: '1920s – 1930s',
    icon: '🍸',
    tagline: 'Roaring twenties luxury, stepped geometry, and gold glamor',
    description: 'Symmetrical vertical lines, metallic gold accents, deep obsidian and emerald backgrounds, and decadent ornate elegance.',
    badge: 'GRAND METROPOLIS',
    palette: {
      primary: '#d4af37',
      secondary: '#f3e5ab',
      accent: '#10b981',
      background: '#0a0e14',
      surface: '#151d28',
      text: '#f8fafc',
      textMuted: '#cbd5e1',
      border: '#d4af37',
    },
    typography: {
      headlineFont: 'Cinzel',
      bodyFont: 'Playfair Display',
      accentFont: 'Cinzel',
      headlineWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  },
  popArt: {
    id: 'popArt',
    name: 'Pop Art',
    era: '1950s – 1960s',
    icon: '💥',
    tagline: 'Bold commercial irony, Ben-Day dots, and high contrast',
    description: 'Andy Warhol & Roy Lichtenstein aesthetic. Vibrant primary inks, thick black outlines, comic book dialogue boxes, and mass culture satire.',
    badge: 'POP CULTURE BOOM',
    palette: {
      primary: '#ffe500',
      secondary: '#ff0055',
      accent: '#00d2ff',
      background: '#ffffff',
      surface: '#ffe500',
      text: '#000000',
      textMuted: '#222222',
      border: '#000000',
    },
    typography: {
      headlineFont: 'Bebas Neue',
      bodyFont: 'Outfit',
      accentFont: 'Bebas Neue',
      headlineWeight: '900',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  },
  swissStyle: {
    id: 'swissStyle',
    name: 'Swiss Style',
    era: '1950s – International',
    icon: '🇨🇭',
    tagline: 'Mathematical grid precision, Helvetica clarity, and objective photography',
    description: 'Josef Müller-Brockmann and Armin Hofmann. Rigid multi-column asymmetric grid, flush-left typography, and structured graphic hierarchy.',
    badge: 'INTERNATIONAL TYPOGRAPHY',
    palette: {
      primary: '#d92b27',
      secondary: '#0f172a',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f1f5f9',
      text: '#09090b',
      textMuted: '#64748b',
      border: '#e2e8f0',
    },
    typography: {
      headlineFont: 'Inter',
      bodyFont: 'Inter',
      accentFont: 'Space Mono',
      headlineWeight: '800',
      letterSpacing: -0.8,
      textTransform: 'none',
    },
  },
  psychedelic: {
    id: 'psychedelic',
    name: 'Psychedelic',
    era: 'Late 1960s',
    icon: '🌀',
    tagline: 'Vibrant mind-bending color, swirling patterns, and surreal rhythm',
    description: 'San Francisco youth rebellion and rock posters. Saturated neon contrasts, concentric circular vibrations, and mind-expanding counter-culture art.',
    badge: 'ELECTRIC CONSCIOUSNESS',
    palette: {
      primary: '#ccff00',
      secondary: '#ff007f',
      accent: '#00f0ff',
      background: '#130026',
      surface: '#240046',
      text: '#ffffff',
      textMuted: '#e0aaff',
      border: '#ccff00',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Inter',
      accentFont: 'Outfit',
      headlineWeight: '900',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
  },
  postmodernism: {
    id: 'postmodernism',
    name: 'Postmodernism',
    era: '1980s Memphis Group',
    icon: '🎨',
    tagline: 'Playful rebellion, geometric confetti, and rule-breaking irony',
    description: 'Ettore Sottsass and Memphis Milano. Vibrant pastel combinations, squiggles, rotated geometric accents, and bold rejection of boring grids.',
    badge: 'MEMPHIS MILANO 1981',
    palette: {
      primary: '#ff6b8b',
      secondary: '#4ecdc4',
      accent: '#ffe66d',
      background: '#1a1829',
      surface: '#2b2742',
      text: '#ffffff',
      textMuted: '#c5b8e0',
      border: '#ffe66d',
    },
    typography: {
      headlineFont: 'Space Grotesk',
      bodyFont: 'DM Sans',
      accentFont: 'Space Mono',
      headlineWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  },
  brutalism: {
    id: 'brutalism',
    name: 'Brutalism',
    era: 'Mid-20th – Modern Web',
    icon: '⚡',
    tagline: 'Raw confrontation, stark contrast, and exposed structural grid',
    description: 'Bloomberg Businessweek and Balenciaga. Thick stark black borders, monospace labels, high-voltage neon accents, and intentional gritty anti-design.',
    badge: 'RAW ARCHITECTURE',
    palette: {
      primary: '#dfff00',
      secondary: '#00ff66',
      accent: '#ff2a2a',
      background: '#09090b',
      surface: '#18181b',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#ffffff',
    },
    typography: {
      headlineFont: 'Space Mono',
      bodyFont: 'Inter',
      accentFont: 'Space Mono',
      headlineWeight: '700',
      letterSpacing: -1,
      textTransform: 'uppercase',
    },
  },
  flat: {
    id: 'flat',
    name: 'Flat Design',
    era: '2010s – Digital Era',
    icon: '📱',
    tagline: 'Pure 2D clarity, vivid color blocks, and functional minimalism',
    description: 'Apple iOS 7 and Material Design foundation. Clean cards, zero artificial skeuomorphic bevels, crisp iconography, and supreme usability.',
    badge: '2D PURE DIGITAL',
    palette: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Inter',
      accentFont: 'Outfit',
      headlineWeight: '700',
      letterSpacing: -0.2,
      textTransform: 'none',
    },
  },
  contemporary: {
    id: 'contemporary',
    name: 'Contemporary',
    era: 'Present & 2025 Trends',
    icon: '✨',
    tagline: 'Bold experimental typography, high-fashion framing, and modern agency polish',
    description: 'Jessica Walsh (&Walsh) and Pentagram. Blending digital vectors, editorial photography, high-saturation accents, and sophisticated cultural consciousness.',
    badge: 'GLOBAL CONTEMPORARY',
    palette: {
      primary: '#ffffff',
      secondary: '#ff3366',
      accent: '#7928ca',
      background: '#08070d',
      surface: '#151322',
      text: '#ffffff',
      textMuted: '#a5a1b8',
      border: '#2a2640',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Inter',
      accentFont: 'Space Grotesk',
      headlineWeight: '900',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
  },
};

// ─── Semantic Style Classifier ───────────────────────────────────────────────

const STYLE_KEYWORDS: Record<GraphicDesignStyleId, string[]> = {
  bauhaus: ['bauhaus', 'gropius', 'herbert bayer', 'weimar', 'dessau', 'primary color', 'constructivist'],
  artDeco: ['art deco', 'deco', 'gatsby', 'roaring 20s', '1920', 'luxury gold', 'chrysler', 'ornate luxury', 'vintage luxury'],
  brutalism: ['brutalist', 'brutalism', 'raw', 'monochrome', 'anti-design', 'grunge', 'industrial', 'acid', 'balenciaga', 'techno'],
  swissStyle: ['swiss', 'swiss style', 'international typographic', 'helvetica', 'muller-brockmann', 'grid layout', 'rational'],
  popArt: ['pop art', 'warhol', 'lichtenstein', 'comic', 'ben-day', 'dots', 'halftone', 'campbell', 'vintage comic'],
  psychedelic: ['psychedelic', '60s', 'trippy', 'swirl', 'hippie', 'woodstock', 'hendrix', 'acid rock', 'counter culture'],
  postmodernism: ['postmodern', 'postmodernism', 'memphis', 'memphis group', 'sottsass', '80s', 'squiggles', 'confetti'],
  minimalism: ['minimal', 'minimalist', 'minimalism', 'clean', 'simple', 'whitespace', 'dieter rams', 'uncluttered', 'muji'],
  modernism: ['modernism', 'modernist', 'mid-century modern', 'paul rand', 'ibm', 'geometric modern'],
  flat: ['flat', 'flat design', 'material design', 'ios', 'app style', 'clean 2d', 'vector flat'],
  contemporary: ['contemporary', 'trendy', 'editorial modern', 'agency', 'pentagram', 'walsh', 'avant-garde', '2025'],
};

// classifyDesignMovement is defined later in this file (line ~1743) with regex-based matching.

// ─── Concrete Style Builders ────────────────────────────────────────────────

export interface StyleBuildOptions {
  width: number;
  height: number;
  prompt: string;
}

/**
 * 1. Bauhaus Movement Builder
 * Form Follows Function — Primary Red, Yellow, Blue, Asymmetric Geometry
 */
export function buildBauhausDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.bauhaus;
  const photo = resolveHeroPhoto('editorial', prompt);

  const layers: Layer[] = [
    // 1. Off-white canvas base
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bauhaus Canvas Base',
      x: 0,
      y: 0,
      width,
      height,
      color: s.palette.background,
      fill: s.palette.background,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. Bold Primary Red Geometric Block (Top Asymmetry)
    {
      id: `red_block_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bauhaus Red Block',
      x: width * 0.08,
      y: height * 0.06,
      width: width * 0.52,
      height: 18,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 3. Primary Yellow Pure Circle
    {
      id: `yellow_circle_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Bauhaus Yellow Circle',
      x: width * 0.62,
      y: height * 0.12,
      width: width * 0.28,
      height: width * 0.28,
      color: s.palette.accent,
      fill: s.palette.accent,
      opacity: 0.95,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 4. Hero Photograph in Strict Bauhaus Frame
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Bauhaus Inset — ${photo.alt}`,
      src: photo.url,
      x: width * 0.44,
      y: height * 0.26,
      width: width * 0.48,
      height: height * 0.42,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
      flipX: false,
      flipY: false,
      cornerRadius: 0,
    } as any,

    // 5. Solid Blue Diagonal Accent Bar
    {
      id: `blue_bar_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bauhaus Blue Bar',
      x: width * 0.38,
      y: height * 0.66,
      width: width * 0.54,
      height: 24,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 6. Bauhaus Tag / Manifest Header
    {
      id: `tag_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Manifesto Tag',
      text: 'FORM FOLLOWS FUNCTION • 1919',
      x: width * 0.08,
      y: height * 0.14,
      width: width * 0.5,
      height: 24,
      fontSize: Math.max(12, Math.round(width * 0.022)),
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: s.palette.textMuted,
      letterSpacing: 2,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 7. Bold Herbert Bayer Typography Headline
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bauhaus Main Headline',
      text: prompt.length > 4 ? prompt.toUpperCase().slice(0, 24) : 'BAUHAUS MODERN',
      x: width * 0.08,
      y: height * 0.22,
      width: width * 0.42,
      height: 96,
      fontSize: Math.max(34, Math.round(width * 0.068)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: s.palette.text,
      lineHeight: 1.05,
      letterSpacing: -1,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 8. Functional Body Text
    {
      id: `body_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Functional Description',
      text: 'Unity of art, craft, and mass production for the industrial era.',
      x: width * 0.08,
      y: height * 0.46,
      width: width * 0.32,
      height: 50,
      fontSize: Math.max(13, Math.round(width * 0.024)),
      fontWeight: '400',
      fontFamily: s.typography.bodyFont,
      color: s.palette.textMuted,
      lineHeight: 1.4,
      textAlign: 'left',
      textTransform: 'none',
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,

    // 9. Black Solid CTA Rectangle
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bauhaus CTA Button',
      x: width * 0.08,
      y: height * 0.76,
      width: width * 0.38,
      height: 52,
      color: '#111111',
      fill: '#111111',
      cornerRadius: 0,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 10. White CTA Text
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bauhaus CTA Text',
      text: 'VIEW EXHIBITION →',
      x: width * 0.08,
      y: height * 0.785,
      width: width * 0.38,
      height: 24,
      fontSize: Math.max(13, Math.round(width * 0.024)),
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${s.name} — ${s.tagline}`,
    description: s.description,
    width,
    height,
    backgroundColor: s.palette.background,
    layers,
  };
}

/**
 * 2. Art Deco Style Builder
 * Symmetrical Luxury, Stepped Borders, Burnished Gold & Obsidian
 */
export function buildArtDecoDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.artDeco;
  const photo = resolveHeroPhoto('luxury', prompt);

  const layers: Layer[] = [
    // 1. Obsidian Base
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Obsidian Velvet Canvas',
      x: 0,
      y: 0,
      width,
      height,
      color: s.palette.background,
      fill: s.palette.background,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. Outer Stepped Gold Border
    {
      id: `border_outer_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Stepped Gold Border Outer',
      x: width * 0.05,
      y: height * 0.05,
      width: width * 0.9,
      height: height * 0.9,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: s.palette.primary, width: 2 },
      opacity: 0.8,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 3. Inner Symmetrical Gold Border
    {
      id: `border_inner_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Stepped Gold Border Inner',
      x: width * 0.08,
      y: height * 0.08,
      width: width * 0.84,
      height: height * 0.84,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: s.palette.secondary, width: 1 },
      opacity: 0.6,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 4. Hero Inset with Symmetrical Gold Framing
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Art Deco Hero — ${photo.alt}`,
      src: photo.url,
      x: width * 0.22,
      y: height * 0.22,
      width: width * 0.56,
      height: height * 0.36,
      opacity: 0.92,
      locked: false,
      visible: true,
      rotation: 0,
      cornerRadius: 4,
    } as any,

    // 5. Luxury Emerald Accent Diamond
    {
      id: `diamond_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Emerald Accent Diamond',
      x: width * 0.47,
      y: height * 0.16,
      width: 28,
      height: 28,
      color: s.palette.accent,
      fill: s.palette.accent,
      rotation: 45,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,

    // 6. Roaring Twenties Subtitle
    {
      id: `eyebrow_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Art Deco Eyebrow',
      text: 'THE GRAND METROPOLIS • MCMXXV',
      x: width * 0.15,
      y: height * 0.62,
      width: width * 0.7,
      height: 22,
      fontSize: Math.max(11, Math.round(width * 0.02)),
      fontWeight: '600',
      fontFamily: s.typography.accentFont,
      color: s.palette.primary,
      letterSpacing: 4,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 0.95,
      locked: false,
      visible: true,
    } as any,

    // 7. Symmetrical Gold Headline (Cinzel)
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Art Deco Title',
      text: prompt.length > 4 ? prompt.toUpperCase().slice(0, 26) : 'TIMELESS LUXURY',
      x: width * 0.12,
      y: height * 0.67,
      width: width * 0.76,
      height: 60,
      fontSize: Math.max(26, Math.round(width * 0.052)),
      fontWeight: '700',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 3,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 8. Gold Accent CTA Pill Button
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Gold Deco CTA',
      x: width * 0.32,
      y: height * 0.78,
      width: width * 0.36,
      height: 48,
      color: s.palette.primary,
      fill: s.palette.primary,
      cornerRadius: 4,
      shadow: { color: 'rgba(212, 175, 55, 0.35)', blur: 16, offsetX: 0, offsetY: 4 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 9. CTA Text
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Gold Deco CTA Text',
      text: 'EXPLORE OPULENCE',
      x: width * 0.32,
      y: height * 0.8,
      width: width * 0.36,
      height: 20,
      fontSize: Math.max(12, Math.round(width * 0.022)),
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: '#0a0e14',
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${s.name} — ${s.tagline}`,
    description: s.description,
    width,
    height,
    backgroundColor: s.palette.background,
    layers,
  };
}

/**
 * 3. Brutalism Style Builder
 * Raw confrontation, thick stark black rules, acid neon yellow, monospace typography
 */
export function buildBrutalistDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.brutalism;
  const photo = resolveHeroPhoto('cyberpunk', prompt);

  const layers: Layer[] = [
    // 1. Raw Dark Canvas
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Raw Concrete Canvas',
      x: 0,
      y: 0,
      width,
      height,
      color: s.palette.background,
      fill: s.palette.background,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. High-Voltage Acid Neon Banner Top
    {
      id: `neon_bar_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Acid Yellow Header Stripe',
      x: 0,
      y: 0,
      width,
      height: 48,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `neon_bar_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Header Ticker Text',
      text: '/// CRITICAL SPECIFICATION // 001-ALPHA /// WARNING: UNFILTERED OUTPUT',
      x: 16,
      y: 16,
      width: width - 32,
      height: 20,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: '#000000',
      letterSpacing: -0.5,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 3. Exposed Heavy Wireframe Box for Hero Photo
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Brutalist Monolith — ${photo.alt}`,
      src: photo.url,
      x: width * 0.08,
      y: height * 0.12,
      width: width * 0.84,
      height: height * 0.44,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
      cornerRadius: 0,
      stroke: { color: '#ffffff', width: 3 },
    } as any,

    // 4. Raw Tilted Sticker Badge (Rotated -5deg)
    {
      id: `sticker_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Raw Sticker Badge',
      x: width * 0.65,
      y: height * 0.48,
      width: width * 0.28,
      height: 44,
      color: s.palette.accent,
      fill: s.palette.accent,
      rotation: -5,
      stroke: { color: '#000000', width: 2 },
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `sticker_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Sticker Text',
      text: 'RAW / ARCHIVE',
      x: width * 0.65,
      y: height * 0.495,
      width: width * 0.28,
      height: 22,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: '#ffffff',
      letterSpacing: 1,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: -5,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 5. Brutalist Oversized Headline
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Brutalist Massive Headline',
      text: prompt.length > 4 ? prompt.toUpperCase().slice(0, 24) : 'INDUSTRIAL DISRUPTION',
      x: width * 0.08,
      y: height * 0.62,
      width: width * 0.84,
      height: 72,
      fontSize: Math.max(30, Math.round(width * 0.062)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      lineHeight: 1.05,
      letterSpacing: -2,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 6. Monospaced Spec Lines
    {
      id: `spec_line_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Data Spec Notes',
      text: '[SYS_ID: 884-BRTL] [STATUS: REJECTING CONVENTIONAL BEAUTY] [VER: 2025.2]',
      x: width * 0.08,
      y: height * 0.74,
      width: width * 0.84,
      height: 24,
      fontSize: 12,
      fontWeight: '500',
      fontFamily: s.typography.accentFont,
      color: s.palette.textMuted,
      letterSpacing: -0.5,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,

    // 7. Full-Width Heavy Button
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Brutalist Punch Button',
      x: width * 0.08,
      y: height * 0.82,
      width: width * 0.44,
      height: 52,
      color: s.palette.primary,
      fill: s.palette.primary,
      cornerRadius: 0,
      stroke: { color: '#000000', width: 2 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Button Action Text',
      text: 'EXECUTE SEQUENCE >>',
      x: width * 0.08,
      y: height * 0.845,
      width: width * 0.44,
      height: 22,
      fontSize: 14,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: '#000000',
      letterSpacing: 0.5,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${s.name} — ${s.tagline}`,
    description: s.description,
    width,
    height,
    backgroundColor: s.palette.background,
    layers,
  };
}

/**
 * 4. Swiss Style (International Typographic Style)
 * Rigid mathematical grid, Müller-Brockmann red, clean sans-serif clarity
 */
export function buildSwissStyleDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.swissStyle;
  const photo = resolveHeroPhoto('editorial', prompt);

  const layers: Layer[] = [
    // 1. Clean White Canvas
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Swiss Pure Canvas',
      x: 0,
      y: 0,
      width,
      height,
      color: s.palette.background,
      fill: s.palette.background,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. Strict Grid Coordinate Marker (Top Left)
    {
      id: `marker_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Swiss Red Accent Block',
      x: width * 0.08,
      y: height * 0.08,
      width: 32,
      height: 8,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 3. Grid Hierarchy Header (Helvetica/Inter)
    {
      id: `swiss_subline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Grid System Index',
      text: 'ZÜRICH • INTERNATIONALE TYPOGRAFIE',
      x: width * 0.08,
      y: height * 0.12,
      width: width * 0.84,
      height: 20,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: s.typography.headlineFont,
      color: s.palette.primary,
      letterSpacing: 0.5,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 4. Large Asymmetric Headline (Left-aligned)
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Swiss Bold Headline',
      text: prompt.length > 4 ? prompt.slice(0, 28) : 'Präzision und Klarheit',
      x: width * 0.08,
      y: height * 0.17,
      width: width * 0.58,
      height: 90,
      fontSize: Math.max(32, Math.round(width * 0.064)),
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: s.palette.text,
      lineHeight: 1.1,
      letterSpacing: -1,
      textAlign: 'left',
      textTransform: 'none',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 5. Objective Unembellished Photography
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Objective Documentary Image — ${photo.alt}`,
      src: photo.url,
      x: width * 0.08,
      y: height * 0.38,
      width: width * 0.84,
      height: height * 0.44,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
      cornerRadius: 0,
    } as any,

    // 6. Clean Dividing Rule
    {
      id: `divider_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Grid Horizontal Rule',
      x: width * 0.08,
      y: height * 0.86,
      width: width * 0.84,
      height: 2,
      color: '#09090b',
      fill: '#09090b',
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 7. Triple-Column Footnote Metadata
    {
      id: `footnote_1_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Column 1 Data',
      text: 'EDITION: 1957 / 2025',
      x: width * 0.08,
      y: height * 0.89,
      width: width * 0.26,
      height: 20,
      fontSize: 11,
      fontWeight: '700',
      fontFamily: s.typography.accentFont,
      color: '#09090b',
      letterSpacing: 0.5,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `footnote_2_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Column 2 Data',
      text: 'OBJECTIVE VISUAL COMMUNICATION',
      x: width * 0.38,
      y: height * 0.89,
      width: width * 0.54,
      height: 20,
      fontSize: 11,
      fontWeight: '600',
      fontFamily: s.typography.headlineFont,
      color: s.palette.textMuted,
      letterSpacing: 0.5,
      textAlign: 'right',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${s.name} — ${s.tagline}`,
    description: s.description,
    width,
    height,
    backgroundColor: s.palette.background,
    layers,
  };
}

/**
 * 5. Pop Art Style Builder
 * Lichtenstein & Warhol: Yellow/Magenta/Cyan, thick outlines, comic speech badges
 */
export function buildPopArtDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.popArt;
  const photo = resolveHeroPhoto('fashion', prompt);

  const layers: Layer[] = [
    // 1. Comic Yellow Base
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Ben-Day Yellow Canvas',
      x: 0,
      y: 0,
      width,
      height,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. Cyan Backing Card with 4px Comic Border
    {
      id: `comic_card_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Cyan Comic Panel',
      x: width * 0.08,
      y: height * 0.08,
      width: width * 0.84,
      height: height * 0.84,
      color: s.palette.accent,
      fill: s.palette.accent,
      stroke: { color: '#000000', width: 4 },
      shadow: { color: '#000000', blur: 0, offsetX: 8, offsetY: 8 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 3. Hero Inset Photo with Heavy Comic Border
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Pop Art Subject — ${photo.alt}`,
      src: photo.url,
      x: width * 0.14,
      y: height * 0.14,
      width: width * 0.72,
      height: height * 0.44,
      stroke: { color: '#000000', width: 4 },
      shadow: { color: '#000000', blur: 0, offsetX: 6, offsetY: 6 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // 4. Hot Magenta Comic Speech Badge
    {
      id: `badge_burst_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Magenta Exclamation Badge',
      x: width * 0.62,
      y: height * 0.1,
      width: width * 0.28,
      height: 48,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      stroke: { color: '#000000', width: 3 },
      shadow: { color: '#000000', blur: 0, offsetX: 4, offsetY: 4 },
      rotation: 6,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `badge_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Exclamation Text',
      text: 'POW! ART 60s',
      x: width * 0.62,
      y: height * 0.115,
      width: width * 0.28,
      height: 24,
      fontSize: 16,
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 6,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 5. Massive Warhol Headline
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Pop Art Massive Headline',
      text: prompt.length > 4 ? prompt.toUpperCase().slice(0, 22) : 'CONSUMER HIGH ART',
      x: width * 0.12,
      y: height * 0.62,
      width: width * 0.76,
      height: 68,
      fontSize: Math.max(34, Math.round(width * 0.07)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#000000',
      letterSpacing: 1,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 6. Yellow Comic CTA Button
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Pop CTA Button',
      x: width * 0.28,
      y: height * 0.78,
      width: width * 0.44,
      height: 52,
      color: s.palette.primary,
      fill: s.palette.primary,
      stroke: { color: '#000000', width: 3 },
      shadow: { color: '#000000', blur: 0, offsetX: 5, offsetY: 5 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Pop CTA Text',
      text: 'MAKE ART POP! →',
      x: width * 0.28,
      y: height * 0.805,
      width: width * 0.44,
      height: 22,
      fontSize: 16,
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#000000',
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
  ];

  return {
    title: `${s.name} — ${s.tagline}`,
    description: s.description,
    width,
    height,
    backgroundColor: s.palette.background,
    layers,
  };
}

/**
 * 6. Psychedelic Style Builder
 * Swirling saturated neon vibration, electric lime, shock pink, deep violet
 */
export function buildPsychedelicDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.psychedelic;
  const photo = resolveHeroPhoto('event', prompt);

  const layers: Layer[] = [
    // 1. Cosmic Violet Base
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Cosmic Violet Base',
      x: 0,
      y: 0,
      width,
      height,
      color: s.palette.background,
      fill: s.palette.background,
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 2. Swirling Outer Aura Ring (Concentric)
    {
      id: `aura_1_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Concentric Lime Aura',
      x: width * 0.1,
      y: height * 0.1,
      width: width * 0.8,
      height: width * 0.8,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: s.palette.primary, width: 8 },
      opacity: 0.6,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 3. Middle Shocking Pink Aura Ring
    {
      id: `aura_2_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Concentric Pink Aura',
      x: width * 0.18,
      y: height * 0.18,
      width: width * 0.64,
      height: width * 0.64,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: s.palette.secondary, width: 6 },
      opacity: 0.75,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // 4. Hero Inset Photo with Circular Framing
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: `Psychedelic Focal — ${photo.alt}`,
      src: photo.url,
      x: width * 0.25,
      y: height * 0.22,
      width: width * 0.5,
      height: width * 0.5,
      opacity: 0.9,
      locked: false,
      visible: true,
      rotation: 0,
      cornerRadius: 999,
    } as any,

    // 5. Electric Counter-Culture Headline
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Psychedelic Flowing Title',
      text: prompt.length > 4 ? prompt.toUpperCase().slice(0, 24) : 'ALTERED CONSCIOUSNESS',
      x: width * 0.1,
      y: height * 0.7,
      width: width * 0.8,
      height: 60,
      fontSize: Math.max(28, Math.round(width * 0.056)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: s.palette.primary,
      letterSpacing: 3,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // 6. Subtitle
    {
      id: `sub_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Surreal Subtitle',
      text: 'VIBRANT MIND-EXPANDING SENSORY SOUNDS',
      x: width * 0.1,
      y: height * 0.78,
      width: width * 0.8,
      height: 24,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: s.typography.accentFont,
      color: s.palette.textMuted,
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,

    // 7. Shocking Pink Pill CTA
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Electric CTA',
      x: width * 0.3,
      y: height * 0.84,
      width: width * 0.4,
      height: 50,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      cornerRadius: 999,
      shadow: { color: 'rgba(255, 0, 127, 0.45)', blur: 20, offsetX: 0, offsetY: 4 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Electric CTA Text',
      text: 'ENTER EXPERIENCE ✦',
      x: width * 0.3,
      y: height * 0.865,
      width: width * 0.4,
      height: 20,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
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
    title: `${s.name} — ${s.tagline}`,
    description: s.description,
    width,
    height,
    backgroundColor: s.palette.background,
    layers,
  };
}

/**
 * Master Dispatcher: Build any of the 11 Graphic Design Movements by ID
 */
export function buildCompositionByStyleId(
  styleId: GraphicDesignStyleId,
  width: number,
  height: number,
  prompt: string
): ArtboardDesignResult {
  const opts: StyleBuildOptions = { width, height, prompt };

  switch (styleId) {
    case 'bauhaus':
      return buildBauhausDesign(opts);
    case 'artDeco':
      return buildArtDecoDesign(opts);
    case 'brutalism':
      return buildBrutalistDesign(opts);
    case 'swissStyle':
      return buildSwissStyleDesign(opts);
    case 'popArt':
      return buildPopArtDesign(opts);
    case 'psychedelic':
      return buildPsychedelicDesign(opts);
    case 'minimalism':
    case 'modernism':
    case 'postmodernism':
    case 'flat':
    case 'contemporary':
    default: {
      const s = GRAPHIC_DESIGN_STYLES[styleId] || GRAPHIC_DESIGN_STYLES.modernism;
      const photo = resolveHeroPhoto('editorial', prompt);

      return {
        title: `${s.name} — ${s.tagline}`,
        description: s.description,
        width,
        height,
        backgroundColor: s.palette.background,
        layers: [
          {
            id: `base_${uuidv4().slice(0, 8)}`,
            type: 'rectangle',
            name: `${s.name} Background Canvas`,
            x: 0,
            y: 0,
            width,
            height,
            color: s.palette.background,
            fill: s.palette.background,
            opacity: 1,
            locked: true,
            visible: true,
            rotation: 0,
          } as any,
          {
            id: `hero_photo_${uuidv4().slice(0, 8)}`,
            type: 'image',
            name: `${s.name} Subject — ${photo.alt}`,
            src: photo.url,
            x: width * 0.08,
            y: height * 0.12,
            width: width * 0.84,
            height: height * 0.48,
            opacity: 1,
            locked: false,
            visible: true,
            rotation: 0,
            cornerRadius: styleId === 'flat' ? 16 : 0,
          } as any,
          {
            id: `badge_${uuidv4().slice(0, 8)}`,
            type: 'rectangle',
            name: `${s.name} Badge`,
            x: width * 0.08,
            y: height * 0.65,
            width: width * 0.36,
            height: 32,
            color: s.palette.surface,
            fill: s.palette.surface,
            cornerRadius: 999,
            stroke: { color: s.palette.border, width: 1 },
            opacity: 1,
            locked: false,
            visible: true,
            rotation: 0,
          } as any,
          {
            id: `badge_text_${uuidv4().slice(0, 8)}`,
            type: 'text',
            name: `${s.name} Badge Text`,
            text: s.badge,
            x: width * 0.08,
            y: height * 0.665,
            width: width * 0.36,
            height: 18,
            fontSize: 11,
            fontWeight: '800',
            fontFamily: s.typography.accentFont,
            color: s.palette.primary,
            letterSpacing: 1.5,
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
            name: `${s.name} Headline`,
            text: prompt.length > 4 ? prompt.toUpperCase().slice(0, 26) : s.tagline.toUpperCase().slice(0, 26),
            x: width * 0.08,
            y: height * 0.72,
            width: width * 0.84,
            height: 64,
            fontSize: Math.max(30, Math.round(width * 0.058)),
            fontWeight: s.typography.headlineWeight as any,
            fontFamily: s.typography.headlineFont,
            color: s.palette.text,
            letterSpacing: s.typography.letterSpacing,
            textAlign: 'left',
            textTransform: s.typography.textTransform,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
          } as any,
          {
            id: `cta_btn_${uuidv4().slice(0, 8)}`,
            type: 'rectangle',
            name: `${s.name} CTA Button`,
            x: width * 0.08,
            y: height * 0.84,
            width: width * 0.38,
            height: 48,
            color: s.palette.primary,
            fill: s.palette.primary,
            cornerRadius: styleId === 'flat' ? 12 : 4,
            opacity: 1,
            locked: false,
            visible: true,
            rotation: 0,
          } as any,
          {
            id: `cta_text_${uuidv4().slice(0, 8)}`,
            type: 'text',
            name: `${s.name} CTA Text`,
            text: 'EXPLORE DESIGN →',
            x: width * 0.08,
            y: height * 0.86,
            width: width * 0.38,
            height: 20,
            fontSize: 13,
            fontWeight: '800',
            fontFamily: s.typography.headlineFont,
            color: s.palette.surface === '#ffffff' ? '#ffffff' : '#000000',
            letterSpacing: 1,
            textAlign: 'center',
            textTransform: 'uppercase',
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
          } as any,
        ],
      };
    }
  }
}

/**
 * Classifies design intent against the 11 iconic graphic design movements.
 * Returns the matched style ID or null if none is explicitly specified.
 */
export function classifyDesignMovement(prompt: string): GraphicDesignStyleId | null {
  if (!prompt || typeof prompt !== 'string') return null;
  const p = prompt.toLowerCase();

  if (/bauhaus|gropius|herbert bayer|form follows function|constructivis/.test(p)) {
    return 'bauhaus';
  }
  if (/art deco|art-deco|artdeco|gatsby|roaring 20|roaring twenties|golden age|chrysler/.test(p)) {
    return 'artDeco';
  }
  if (/brutalis|raw concrete|anti-design|neobrutalis|neo-brutalis|monospace spec/.test(p)) {
    return 'brutalism';
  }
  if (/swiss style|swiss|international typographic|muller-brockmann|m\u00fcller-brockmann|grid poster/.test(p)) {
    return 'swissStyle';
  }
  if (/pop art|pop-art|popart|warhol|lichtenstein|ben-day|halftone comic|comic book style/.test(p)) {
    return 'popArt';
  }
  if (/psychedelic|trippy|acid|woodstock|60s rock|summer of love|liquid light|neon aura|groovy/.test(p)) {
    return 'psychedelic';
  }
  if (/postmodern|memphis|sottsass|80s geometric|geometric confetti/.test(p)) {
    return 'postmodernism';
  }
  if (/minimalis|dieter rams|less is more|less but better|negative space|clean whitespace/.test(p)) {
    return 'minimalism';
  }
  if (/flat design|flat 2d|flat graphic|flat illustration/.test(p)) {
    return 'flat';
  }
  if (/modernis|paul rand|mid-century modern|mid century modern|ibm style/.test(p)) {
    return 'modernism';
  }
  if (/contemporary|pentagram|walsh|modern agency|avant-garde|avant garde/.test(p)) {
    return 'contemporary';
  }

  return null;
}

export const GRAPHIC_DESIGN_STYLE_LIST: GraphicDesignStyleMeta[] = Object.values(GRAPHIC_DESIGN_STYLES);
