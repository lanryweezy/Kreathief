/**
 * Graphic Design Styles & 2026 Trends Engine
 * Comprehensive design movements codified from:
 * - Kittl 60+ Visual Design Styles
 * - Magier 2026 Graphic Design Trends Guide
 * - UX Planet 50 Prompting Design Styles
 * - Behance 2026 Digital Design Trends
 * - It's Nice That 2026 Forecast
 */

import { Layer, Gradient } from '../types';
import { ArtboardDesignResult } from './aiDesignDirector';
import { resolveHeroPhoto } from './visualAssetDirector';
import { v4 as uuidv4 } from 'uuid';

export type GraphicDesignStyleCategory = 'trends2026' | 'movements' | 'retroSubculture' | 'minimalDigital';

export type GraphicDesignStyleId =
  // 2026 Key Trends & Digital Aesthetics
  | 'bentoGrid'
  | 'aurora'
  | 'neoBrutalism'
  | 'luxuryTypography'
  | 'micrographics'
  | 'trinket'
  | 'maximalism'
  // Iconic Historical Movements
  | 'bauhaus'
  | 'artDeco'
  | 'artNouveau'
  | 'swissStyle'
  | 'popArt'
  | 'postmodernism'
  | 'modernism'
  // Retro & Subcultures
  | 'y2k'
  | 'synthwave'
  | 'psychedelic'
  | 'risograph'
  | 'typeCollage'
  | 'punk'
  // Minimal & Zen
  | 'minimalism'
  | 'japandi'
  | 'brutalism'
  | 'flat'
  | 'contemporary';

export interface GraphicDesignStyleMeta {
  id: GraphicDesignStyleId;
  name: string;
  category: GraphicDesignStyleCategory;
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
  bentoGrid: {
    id: 'bentoGrid',
    name: 'Bento Grid',
    category: 'trends2026',
    era: 'Late 2010s – 2026 UI',
    icon: '🍱',
    tagline: 'Modular compartmentalized balance and modern UI hierarchy',
    description: 'Inspired by Japanese bento boxes and Apple keynotes. Rounded modular cards with clear separation, micro-data, and structured content blocks.',
    badge: 'MODULAR BENTO SYSTEM',
    palette: {
      primary: '#6366f1',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#090d16',
      surface: '#151b28',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#232d42',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Inter',
      accentFont: 'Space Mono',
      headlineWeight: '800',
      letterSpacing: -0.5,
      textTransform: 'none',
    },
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora & Ethereal',
    category: 'trends2026',
    era: '2020s – 2026 Luminous Trend',
    icon: '🌌',
    tagline: 'Radiant Northern Lights gradients, soft cosmic glow, and ethereal calm',
    description: 'Luminous multi-color transitions with deep purples, teals, and soft magenta. Atmospheric, dreamy, and quietly futuristic.',
    badge: 'AURORA LUMINESCENCE',
    palette: {
      primary: '#a855f7',
      secondary: '#06b6d4',
      accent: '#ec4899',
      background: '#070714',
      surface: '#12112a',
      text: '#ffffff',
      textMuted: '#c4b5fd',
      border: '#3b0764',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Inter',
      accentFont: 'DM Sans',
      headlineWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
  },
  neoBrutalism: {
    id: 'neoBrutalism',
    name: 'Neo-Brutalism',
    category: 'trends2026',
    era: '2022 – 2026 Modern Web',
    icon: '⚡',
    tagline: 'High-voltage saturated blocks, 4px black borders, and hard zero-blur drop shadows',
    description: 'Raw, honest, and delightfully loud. Defies sterile corporate minimalism with bold primary/fluorescent blocks, rotated stickers, and thick black rules.',
    badge: 'HIGH VOLTAGE NEO-BRUTAL',
    palette: {
      primary: '#facc15',
      secondary: '#22d3ee',
      accent: '#f43f5e',
      background: '#fef08a',
      surface: '#ffffff',
      text: '#000000',
      textMuted: '#1e293b',
      border: '#000000',
    },
    typography: {
      headlineFont: 'Space Grotesk',
      bodyFont: 'Space Mono',
      accentFont: 'Space Mono',
      headlineWeight: '900',
      letterSpacing: -0.5,
      textTransform: 'uppercase',
    },
  },
  luxuryTypography: {
    id: 'luxuryTypography',
    name: 'Luxury Typography',
    category: 'trends2026',
    era: 'High Fashion & Haute Couture',
    icon: '⚜️',
    tagline: 'Refined editorial serifs, generous tracking, and golden restraint',
    description: 'Haute couture editorial aesthetics. High-contrast display serifs, bespoke ligatures, obsidian grounds, and razor-thin gold framing.',
    badge: 'HAUTE COUTURE EDITORIAL',
    palette: {
      primary: '#d4af37',
      secondary: '#f5ecd7',
      accent: '#b45309',
      background: '#0a0a0c',
      surface: '#141418',
      text: '#fbfbfb',
      textMuted: '#a3a3a3',
      border: '#d4af37',
    },
    typography: {
      headlineFont: 'Cinzel',
      bodyFont: 'Playfair Display',
      accentFont: 'Cinzel',
      headlineWeight: '700',
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
  },
  micrographics: {
    id: 'micrographics',
    name: 'Micrographics',
    category: 'trends2026',
    era: '2025–2026 Technical Information',
    icon: '📐',
    tagline: 'Aesthetics of technical information: timestamps, coordinates, and industrial precision',
    description: 'As featured in It\'s Nice That & Nike campaigns. Blueprint crosshairs, spec sheet numbering, measurement ticks, and raw data furniture.',
    badge: 'TECHNICAL SPEC 01-X',
    palette: {
      primary: '#38bdf8',
      secondary: '#22c55e',
      accent: '#e2e8f0',
      background: '#080d1a',
      surface: '#0f172a',
      text: '#f8fafc',
      textMuted: '#64748b',
      border: '#1e293b',
    },
    typography: {
      headlineFont: 'Space Mono',
      bodyFont: 'Space Mono',
      accentFont: 'Space Mono',
      headlineWeight: '700',
      letterSpacing: -0.5,
      textTransform: 'uppercase',
    },
  },
  trinket: {
    id: 'trinket',
    name: 'Trinket / Visual Index',
    category: 'trends2026',
    era: '2025–2026 Visual Index',
    icon: '🗂️',
    tagline: 'Curated flat-lay inventory grids, specimen numbering, and personal archive aesthetic',
    description: 'The joy of collecting and organizing. Numbered compartmental cells, specimen labels, clean outlines, and catalog-style presentation.',
    badge: 'CURATED SPECIMEN SHEET',
    palette: {
      primary: '#0f766e',
      secondary: '#d97706',
      accent: '#0284c7',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#cbd5e1',
    },
    typography: {
      headlineFont: 'Space Grotesk',
      bodyFont: 'Inter',
      accentFont: 'Space Mono',
      headlineWeight: '700',
      letterSpacing: -0.2,
      textTransform: 'none',
    },
  },
  maximalism: {
    id: 'maximalism',
    name: 'New Maximalism',
    category: 'trends2026',
    era: '2024–2026 New Maximalism',
    icon: '🎉',
    tagline: 'More is more: fearless color combinations, rich layered patterns, and joyful energy',
    description: 'Challenging sterile minimalism with an explosion of color, overlapping geometric cards, bold contrasts, and vibrant optimism.',
    badge: 'MORE IS MORE',
    palette: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      background: '#180b2c',
      surface: '#2c1650',
      text: '#ffffff',
      textMuted: '#e9d5ff',
      border: '#ec4899',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Outfit',
      accentFont: 'Space Grotesk',
      headlineWeight: '900',
      letterSpacing: -0.5,
      textTransform: 'uppercase',
    },
  },
  bauhaus: {
    id: 'bauhaus',
    name: 'Bauhaus',
    category: 'movements',
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
  artDeco: {
    id: 'artDeco',
    name: 'Art Deco',
    category: 'movements',
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
  artNouveau: {
    id: 'artNouveau',
    name: 'Art Nouveau',
    category: 'movements',
    era: '1890 – 1910',
    icon: '🌿',
    tagline: 'Whiplash curves, organic botanical framing, and romantic handcrafted elegance',
    description: 'Alphonse Mucha and Gustav Klimt aesthetic. Elegant flowing vines, stylized florals, gentle arches, and warm vintage romance.',
    badge: 'ORGANIC WHIPLASH',
    palette: {
      primary: '#059669',
      secondary: '#d97706',
      accent: '#854d0e',
      background: '#faf6ee',
      surface: '#f3ece0',
      text: '#1c1917',
      textMuted: '#57534e',
      border: '#059669',
    },
    typography: {
      headlineFont: 'Playfair Display',
      bodyFont: 'DM Sans',
      accentFont: 'Playfair Display',
      headlineWeight: '700',
      letterSpacing: 1,
      textTransform: 'none',
    },
  },
  swissStyle: {
    id: 'swissStyle',
    name: 'Swiss Style',
    category: 'movements',
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
  popArt: {
    id: 'popArt',
    name: 'Pop Art',
    category: 'movements',
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
  postmodernism: {
    id: 'postmodernism',
    name: 'Postmodernism',
    category: 'movements',
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
  modernism: {
    id: 'modernism',
    name: 'Modernism',
    category: 'movements',
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
  y2k: {
    id: 'y2k',
    name: 'Y2K & Cybercore',
    category: 'retroSubculture',
    era: '1999–2000s & 2026 Revival',
    icon: '💿',
    tagline: 'Liquid chrome, holographic sheen, tech UI overlays, and optimistic millennium futurism',
    description: 'Early internet optimism meets cyberpunk. Iridescent neon gradients, starbursts, matrix grid lines, and glossy cyber typography.',
    badge: 'SYSTEM 2000 CYBER',
    palette: {
      primary: '#00f0ff',
      secondary: '#ff007f',
      accent: '#a855f7',
      background: '#050510',
      surface: '#13112c',
      text: '#ffffff',
      textMuted: '#99f6e4',
      border: '#00f0ff',
    },
    typography: {
      headlineFont: 'Outfit',
      bodyFont: 'Space Grotesk',
      accentFont: 'Space Mono',
      headlineWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  },
  synthwave: {
    id: 'synthwave',
    name: 'Synthwave',
    category: 'retroSubculture',
    era: '80s Arcade & Retro-Futurism',
    icon: '🌴',
    tagline: 'Neon grid horizons, wireframe sunsets, and 80s arcade adrenaline',
    description: 'Electric sunsets, neon wireframe horizons, glowing palms, and high-contrast synth soundtrack aesthetics.',
    badge: 'RETRO FUTURE 1984',
    palette: {
      primary: '#ff007f',
      secondary: '#00f0ff',
      accent: '#f59e0b',
      background: '#090014',
      surface: '#1f0038',
      text: '#ffffff',
      textMuted: '#e879f9',
      border: '#ff007f',
    },
    typography: {
      headlineFont: 'Bebas Neue',
      bodyFont: 'Outfit',
      accentFont: 'Space Mono',
      headlineWeight: '900',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  },
  psychedelic: {
    id: 'psychedelic',
    name: 'Psychedelic',
    category: 'retroSubculture',
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
  risograph: {
    id: 'risograph',
    name: 'Risograph Print',
    category: 'retroSubculture',
    era: 'Print Studio Revival',
    icon: '🖨️',
    tagline: 'Vibrant dual-spot ink colors, paper grain, and beautiful misregistration charm',
    description: 'The tactile beauty of real riso machines. Fluro pink and cornflower blue inks, slight intentional print offset, and warm analog personality.',
    badge: 'RISO TWO-TONE SPOT',
    palette: {
      primary: '#ff4071',
      secondary: '#2563eb',
      accent: '#fde047',
      background: '#fbf9f4',
      surface: '#f3efe6',
      text: '#1e1e24',
      textMuted: '#52525b',
      border: '#ff4071',
    },
    typography: {
      headlineFont: 'Space Grotesk',
      bodyFont: 'Inter',
      accentFont: 'Space Mono',
      headlineWeight: '800',
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
  },
  typeCollage: {
    id: 'typeCollage',
    name: 'Type-Collage',
    category: 'retroSubculture',
    era: '2026 Pick-and-Mix Expression',
    icon: '✂️',
    tagline: 'Expressive scale shifts, mixed fonts, and rule-breaking ransom-note rhythm',
    description: 'Type as the hero visual material. Juxtaposing condensed sans with sweeping serifs, angled sticker badges, and high-energy diagonal layouts.',
    badge: 'EXPRESSIVE TYPE EXPERIMENT',
    palette: {
      primary: '#ef4444',
      secondary: '#3b82f6',
      accent: '#10b981',
      background: '#18181b',
      surface: '#27272a',
      text: '#ffffff',
      textMuted: '#a1a1aa',
      border: '#ffffff',
    },
    typography: {
      headlineFont: 'Bebas Neue',
      bodyFont: 'Inter',
      accentFont: 'Playfair Display',
      headlineWeight: '900',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  },
  punk: {
    id: 'punk',
    name: 'Punk & Grunge',
    category: 'retroSubculture',
    era: '1970s DIY & 2026 Anti-Polish',
    icon: '🎸',
    tagline: 'Photocopier grit, ripped tape accents, stark high contrast, and raw DIY defiance',
    description: 'Human fingerprints and intentional chaos. Pure black, raw white, acid red warnings, rough paper noise, and unapologetic attitude.',
    badge: 'DIY RESISTANCE',
    palette: {
      primary: '#dc2626',
      secondary: '#ffffff',
      accent: '#facc15',
      background: '#000000',
      surface: '#121212',
      text: '#ffffff',
      textMuted: '#d4d4d8',
      border: '#ffffff',
    },
    typography: {
      headlineFont: 'Space Mono',
      bodyFont: 'Inter',
      accentFont: 'Space Mono',
      headlineWeight: '900',
      letterSpacing: -1,
      textTransform: 'uppercase',
    },
  },
  minimalism: {
    id: 'minimalism',
    name: 'Minimalism',
    category: 'minimalDigital',
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
  japandi: {
    id: 'japandi',
    name: 'Japandi & Wabi-Sabi',
    category: 'minimalDigital',
    era: '2020s Zen Living',
    icon: '🎋',
    tagline: 'Japanese minimalism meets Scandinavian warmth: earthy tranquility and organic balance',
    description: 'Muted stone and sand palettes, gentle wabi-sabi asymmetry, warm linen textures, and deeply calm negative space.',
    badge: 'ORGANIC SERENITY',
    palette: {
      primary: '#3d372e',
      secondary: '#7a705e',
      accent: '#c4b59d',
      background: '#f5f2eb',
      surface: '#ede8dd',
      text: '#2c2720',
      textMuted: '#78716c',
      border: '#d6cebe',
    },
    typography: {
      headlineFont: 'DM Sans',
      bodyFont: 'Inter',
      accentFont: 'DM Sans',
      headlineWeight: '600',
      letterSpacing: 0,
      textTransform: 'none',
    },
  },
  brutalism: {
    id: 'brutalism',
    name: 'Brutalism',
    category: 'minimalDigital',
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
    category: 'minimalDigital',
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
    category: 'minimalDigital',
    era: 'Present & 2026 Trends',
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

export interface StyleBuildOptions {
  width: number;
  height: number;
  prompt: string;
}

// ─── 1. Bauhaus Builder ──────────────────────────────────────────────────────
export function buildBauhausDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.bauhaus;
  const photo = resolveHeroPhoto('editorial', prompt);

  const layers: Layer[] = [
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
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: 'Bauhaus Hero Form',
      src: photo.url,
      x: width * 0.08,
      y: height * 0.16,
      width: width * 0.5,
      height: height * 0.44,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `blue_accent_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bauhaus Cobalt Accent',
      x: width * 0.04,
      y: height * 0.56,
      width: width * 0.24,
      height: 8,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bauhaus Primary Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 24) : 'FORM & FUNCTION',
      x: width * 0.08,
      y: height * 0.66,
      width: width * 0.84,
      height: 64,
      fontSize: Math.max(34, Math.round(width * 0.065)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: s.palette.text,
      letterSpacing: 0,
      textAlign: 'left',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `badge_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bauhaus Button',
      x: width * 0.08,
      y: height * 0.82,
      width: width * 0.4,
      height: 52,
      color: s.palette.primary,
      fill: s.palette.primary,
      cornerRadius: 0,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `badge_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bauhaus Button Text',
      text: 'EXPLORE SYSTEM →',
      x: width * 0.08,
      y: height * 0.845,
      width: width * 0.4,
      height: 20,
      fontSize: 14,
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

// ─── 2. Bento Grid 2026 Builder ─────────────────────────────────────────────
export function buildBentoGridDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.bentoGrid;
  const photo = resolveHeroPhoto('technology', prompt);

  const layers: Layer[] = [
    // Base Canvas
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento Grid Canvas',
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

    // Header Tag Pill
    {
      id: `header_pill_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento Header Pill',
      x: width * 0.06,
      y: height * 0.05,
      width: width * 0.32,
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
      id: `header_tag_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento Header Tag',
      text: '🍱 BENTO MODULAR UI',
      x: width * 0.06,
      y: height * 0.062,
      width: width * 0.32,
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

    // Bento Card 1: Main Announcement (Top-Left, 54% width, 48% height)
    {
      id: `bento_card1_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento Hero Card',
      x: width * 0.06,
      y: height * 0.12,
      width: width * 0.52,
      height: height * 0.46,
      color: s.palette.surface,
      fill: s.palette.surface,
      cornerRadius: 24,
      stroke: { color: s.palette.border, width: 1 },
      shadow: { color: 'rgba(0,0,0,0.4)', blur: 24, offsetX: 0, offsetY: 8 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `bento_h1_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento Main Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 24) : 'MODULAR SYSTEM',
      x: width * 0.09,
      y: height * 0.16,
      width: width * 0.46,
      height: 72,
      fontSize: Math.max(26, Math.round(width * 0.046)),
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: s.palette.text,
      letterSpacing: -0.5,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `bento_sub_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento Card Subtitle',
      text: 'Precision compartmentalized architecture. Engineered for instant clarity and visual impact.',
      x: width * 0.09,
      y: height * 0.32,
      width: width * 0.46,
      height: 48,
      fontSize: 14,
      fontWeight: '400',
      fontFamily: s.typography.bodyFont,
      color: s.palette.textMuted,
      lineHeight: 1.4,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `bento_chip_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento Hero Pill',
      x: width * 0.09,
      y: height * 0.46,
      width: width * 0.32,
      height: 34,
      color: s.palette.primary,
      fill: s.palette.primary,
      cornerRadius: 12,
      opacity: 0.15,
      stroke: { color: s.palette.primary, width: 1 },
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `bento_chip_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento Hero Pill Text',
      text: '✦ 99.4% OPTIMAL EFFICIENCY',
      x: width * 0.09,
      y: height * 0.475,
      width: width * 0.32,
      height: 16,
      fontSize: 11,
      fontWeight: '700',
      fontFamily: s.typography.accentFont,
      color: s.palette.primary,
      letterSpacing: 1,
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Bento Card 2: Visual Media Card (Top-Right, 32% width, 46% height)
    {
      id: `bento_card2_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento Media Card Frame',
      x: width * 0.62,
      y: height * 0.12,
      width: width * 0.32,
      height: height * 0.46,
      color: s.palette.surface,
      fill: s.palette.surface,
      cornerRadius: 24,
      stroke: { color: s.palette.border, width: 1 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `bento_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: 'Bento Media Asset',
      src: photo.url,
      x: width * 0.64,
      y: height * 0.14,
      width: width * 0.28,
      height: height * 0.32,
      cornerRadius: 16,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `bento_photo_badge_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento Photo Label',
      text: 'LIVE PRODUCTION ASSET',
      x: width * 0.64,
      y: height * 0.50,
      width: width * 0.28,
      height: 18,
      fontSize: 10,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: s.palette.secondary,
      letterSpacing: 1.5,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Bento Card 3: Metrics Card (Bottom-Left, 42% width, 32% height)
    {
      id: `bento_card3_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento Metrics Card',
      x: width * 0.06,
      y: height * 0.62,
      width: width * 0.42,
      height: height * 0.32,
      color: s.palette.surface,
      fill: s.palette.surface,
      cornerRadius: 24,
      stroke: { color: s.palette.border, width: 1 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `bento_stat_num_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento Big Number',
      text: '3.8x',
      x: width * 0.09,
      y: height * 0.66,
      width: width * 0.36,
      height: 60,
      fontSize: Math.max(42, Math.round(width * 0.075)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: s.palette.secondary,
      letterSpacing: -1,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `bento_stat_lbl_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento Stat Label',
      text: 'SPEED & FIDELITY INCREASE',
      x: width * 0.09,
      y: height * 0.77,
      width: width * 0.36,
      height: 20,
      fontSize: 12,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: s.palette.textMuted,
      letterSpacing: 1,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Bento Card 4: Action Card (Bottom-Right, 42% width, 32% height)
    {
      id: `bento_card4_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento Action Card',
      x: width * 0.52,
      y: height * 0.62,
      width: width * 0.42,
      height: height * 0.32,
      color: s.palette.surface,
      fill: s.palette.surface,
      cornerRadius: 24,
      stroke: { color: s.palette.border, width: 1 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `bento_cta_title_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento CTA Title',
      text: 'READY TO DEPLOY',
      x: width * 0.55,
      y: height * 0.66,
      width: width * 0.36,
      height: 24,
      fontSize: 16,
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: s.palette.text,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `bento_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Bento CTA Button',
      x: width * 0.55,
      y: height * 0.76,
      width: width * 0.36,
      height: 48,
      color: s.palette.primary,
      fill: s.palette.primary,
      cornerRadius: 14,
      shadow: { color: 'rgba(99,102,241,0.5)', blur: 20, offsetX: 0, offsetY: 6 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `bento_btn_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Bento CTA Text',
      text: 'GET STARTED NOW →',
      x: width * 0.55,
      y: height * 0.78,
      width: width * 0.36,
      height: 20,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 1,
      textAlign: 'center',
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

// ─── 3. Aurora & Ethereal Builder ───────────────────────────────────────────
export function buildAuroraDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.aurora;

  const layers: Layer[] = [
    // Base Space Canvas
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Aurora Deep Cosmos',
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

    // Luminous Orb 1: Violet Glow (Top-Right)
    {
      id: `aurora_orb1_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Aurora Violet Glow',
      x: width * 0.45,
      y: -height * 0.1,
      width: width * 0.7,
      height: width * 0.7,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 0.35,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // Luminous Orb 2: Cyan Radiance (Center-Left)
    {
      id: `aurora_orb2_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Aurora Cyan Radiance',
      x: -width * 0.15,
      y: height * 0.25,
      width: width * 0.65,
      height: width * 0.65,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      opacity: 0.3,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // Luminous Orb 3: Magenta Atmosphere (Bottom-Right)
    {
      id: `aurora_orb3_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Aurora Magenta Atmosphere',
      x: width * 0.3,
      y: height * 0.5,
      width: width * 0.6,
      height: width * 0.6,
      color: s.palette.accent,
      fill: s.palette.accent,
      opacity: 0.25,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // Translucent Frosted Glass Card
    {
      id: `aurora_glass_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Aurora Glass Frame',
      x: width * 0.1,
      y: height * 0.16,
      width: width * 0.8,
      height: height * 0.68,
      color: 'rgba(255, 255, 255, 0.04)',
      fill: 'rgba(255, 255, 255, 0.04)',
      cornerRadius: 32,
      stroke: { color: 'rgba(255, 255, 255, 0.18)', width: 1 },
      shadow: { color: 'rgba(168, 85, 247, 0.25)', blur: 40, offsetX: 0, offsetY: 12 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // Cosmic Eyebrow Pill
    {
      id: `aurora_pill_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Aurora Pill Tag',
      x: width * 0.3,
      y: height * 0.24,
      width: width * 0.4,
      height: 36,
      color: 'rgba(168, 85, 247, 0.18)',
      fill: 'rgba(168, 85, 247, 0.18)',
      cornerRadius: 999,
      stroke: { color: 'rgba(168, 85, 247, 0.4)', width: 1 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `aurora_tag_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Aurora Tag Text',
      text: '✧ COSMIC AURA ✧',
      x: width * 0.3,
      y: height * 0.255,
      width: width * 0.4,
      height: 18,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: s.typography.accentFont,
      color: '#c4b5fd',
      letterSpacing: 3,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Luminous Headline
    {
      id: `aurora_h1_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Aurora Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 24) : 'TRANSCENDENT CALM',
      x: width * 0.14,
      y: height * 0.35,
      width: width * 0.72,
      height: 90,
      fontSize: Math.max(34, Math.round(width * 0.065)),
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 2,
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Soft Ethereal Description
    {
      id: `aurora_desc_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Aurora Subtitle',
      text: 'Where luminous atmosphere dissolves the boundary between human perception and digital consciousness.',
      x: width * 0.18,
      y: height * 0.51,
      width: width * 0.64,
      height: 52,
      fontSize: 15,
      fontWeight: '400',
      fontFamily: s.typography.bodyFont,
      color: '#cbd5e1',
      lineHeight: 1.5,
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Ethereal Pill CTA Button
    {
      id: `aurora_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Aurora CTA Button',
      x: width * 0.32,
      y: height * 0.66,
      width: width * 0.36,
      height: 52,
      color: s.palette.primary,
      fill: s.palette.primary,
      cornerRadius: 999,
      shadow: { color: 'rgba(168, 85, 247, 0.6)', blur: 24, offsetX: 0, offsetY: 8 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `aurora_btn_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Aurora CTA Text',
      text: 'ENTER EXPERIENCE ✦',
      x: width * 0.32,
      y: height * 0.685,
      width: width * 0.36,
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

// ─── 4. Neo-Brutalism Builder ───────────────────────────────────────────────
export function buildNeoBrutalistDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.neoBrutalism;

  const layers: Layer[] = [
    // Vibrant Acid Canvas
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Neo-Brutalist Acid Base',
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

    // Stark Main Card with 4px Black Border & Hard 8px Zero-Blur Shadow
    {
      id: `neo_card_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Neo-Brutalist Main Frame',
      x: width * 0.08,
      y: height * 0.1,
      width: width * 0.84,
      height: height * 0.78,
      color: '#ffffff',
      fill: '#ffffff',
      cornerRadius: 0,
      stroke: { color: '#000000', width: 4 },
      shadow: { color: '#000000', blur: 0, offsetX: 8, offsetY: 8 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // Solid Black Header Strip
    {
      id: `neo_header_bar_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Neo Header Bar',
      x: width * 0.08,
      y: height * 0.1,
      width: width * 0.84,
      height: 48,
      color: '#000000',
      fill: '#000000',
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `neo_header_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Neo Header Spec Text',
      text: 'SYS::NEO_BRUTAL // VOL_2026 // RAW EDIT',
      x: width * 0.12,
      y: height * 0.118,
      width: width * 0.76,
      height: 20,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: s.palette.primary,
      letterSpacing: 2,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Tilted Sticker Badge (-5 deg)
    {
      id: `neo_sticker_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Neo Tilted Sticker',
      x: width * 0.62,
      y: height * 0.18,
      width: width * 0.28,
      height: 42,
      color: s.palette.accent,
      fill: s.palette.accent,
      cornerRadius: 0,
      stroke: { color: '#000000', width: 3 },
      shadow: { color: '#000000', blur: 0, offsetX: 5, offsetY: 5 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: -5,
    } as any,
    {
      id: `neo_sticker_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Neo Sticker Text',
      text: '★ 100% RAW ★',
      x: width * 0.62,
      y: height * 0.195,
      width: width * 0.28,
      height: 20,
      fontSize: 12,
      fontWeight: '900',
      fontFamily: s.typography.accentFont,
      color: '#ffffff',
      letterSpacing: 1.5,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: -5,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Monolithic High-Impact Headline
    {
      id: `neo_headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Neo Brutal Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 22) : 'NO COMPROMISE',
      x: width * 0.14,
      y: height * 0.28,
      width: width * 0.72,
      height: 90,
      fontSize: Math.max(38, Math.round(width * 0.075)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#000000',
      letterSpacing: -1,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Monospaced Specification Subtitle
    {
      id: `neo_sub_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Neo Spec Subtitle',
      text: '> Rejection of sterile corporate gradients.\\n> Built with raw contrast, hard boundaries, and unyielding visual honesty.',
      x: width * 0.14,
      y: height * 0.44,
      width: width * 0.72,
      height: 60,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: s.typography.bodyFont,
      color: '#1e293b',
      lineHeight: 1.4,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Electric Cyan Sub-Block Frame
    {
      id: `neo_cyan_block_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Neo Cyan Accent Box',
      x: width * 0.14,
      y: height * 0.58,
      width: width * 0.72,
      height: 72,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      stroke: { color: '#000000', width: 3 },
      shadow: { color: '#000000', blur: 0, offsetX: 5, offsetY: 5 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `neo_cyan_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Neo Cyan Box Text',
      text: 'DIRECT TO PRODUCTION // VERIFIED HIGH-CONTRAST',
      x: width * 0.16,
      y: height * 0.615,
      width: width * 0.68,
      height: 24,
      fontSize: 14,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: '#000000',
      letterSpacing: 1,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Chunky Tactile CTA Button
    {
      id: `neo_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Neo Tactile Button',
      x: width * 0.14,
      y: height * 0.74,
      width: width * 0.48,
      height: 56,
      color: '#000000',
      fill: '#000000',
      stroke: { color: '#000000', width: 4 },
      shadow: { color: '#000000', blur: 0, offsetX: 6, offsetY: 6 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `neo_btn_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Neo Button Text',
      text: 'EXECUTE DEPLOYMENT →',
      x: width * 0.14,
      y: height * 0.765,
      width: width * 0.48,
      height: 22,
      fontSize: 14,
      fontWeight: '900',
      fontFamily: s.typography.accentFont,
      color: s.palette.primary,
      letterSpacing: 1,
      textAlign: 'center',
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

// ─── 5. Luxury Typography Builder ───────────────────────────────────────────
export function buildLuxuryTypographyDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.luxuryTypography;
  const photo = resolveHeroPhoto('fashion', prompt);

  const layers: Layer[] = [
    // Obsidian Canvas
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

    // Outer Golden Hairline Frame
    {
      id: `gold_frame_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Luxury Gold Hairline Frame',
      x: width * 0.05,
      y: height * 0.05,
      width: width * 0.9,
      height: height * 0.9,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: s.palette.primary, width: 1 },
      opacity: 0.65,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // Top Heraldic Insignia
    {
      id: `crest_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Luxury Insignia',
      text: '✦  M M X X V I  ✦',
      x: width * 0.1,
      y: height * 0.08,
      width: width * 0.8,
      height: 24,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: s.typography.accentFont,
      color: s.palette.primary,
      letterSpacing: 6,
      textAlign: 'center',
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,

    // Editorial Hero Portrait
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: 'Editorial Haute Subject',
      src: photo.url,
      x: width * 0.2,
      y: height * 0.14,
      width: width * 0.6,
      height: height * 0.44,
      stroke: { color: s.palette.primary, width: 1 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // Thin Gold Divider Rule
    {
      id: `gold_divider_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Gold Hairline Divider',
      x: width * 0.38,
      y: height * 0.62,
      width: width * 0.24,
      height: 1,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 0.8,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,

    // Haute Couture Display Headline
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Luxury Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 22) : 'HAUTE COUTURE',
      x: width * 0.1,
      y: height * 0.66,
      width: width * 0.8,
      height: 64,
      fontSize: Math.max(34, Math.round(width * 0.062)),
      fontWeight: '700',
      fontFamily: s.typography.headlineFont,
      color: s.palette.secondary,
      letterSpacing: 4,
      textAlign: 'center',
      textTransform: 'uppercase',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Refined Subtitle
    {
      id: `sub_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Luxury Collection Subtitle',
      text: 'THE AUTUMN EDITORIAL EDITION — EXCLUSIVE LAUNCH',
      x: width * 0.1,
      y: height * 0.76,
      width: width * 0.8,
      height: 20,
      fontSize: 12,
      fontWeight: '500',
      fontFamily: s.typography.headlineFont,
      color: s.palette.textMuted,
      letterSpacing: 3,
      textAlign: 'center',
      rotation: 0,
      opacity: 0.85,
      locked: false,
      visible: true,
    } as any,

    // Minimalist Gold Bordered Button
    {
      id: `lux_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Luxury Button',
      x: width * 0.32,
      y: height * 0.82,
      width: width * 0.36,
      height: 48,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: s.palette.primary, width: 1 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `lux_btn_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Luxury Button Text',
      text: 'DISCOVER COLLECTION →',
      x: width * 0.32,
      y: height * 0.84,
      width: width * 0.36,
      height: 18,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: s.typography.headlineFont,
      color: s.palette.primary,
      letterSpacing: 2,
      textAlign: 'center',
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

// ─── 6. Y2K & Cybercore Builder ─────────────────────────────────────────────
export function buildY2kDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.y2k;

  const layers: Layer[] = [
    // Base Matrix Darkness
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Y2K Cyber Base',
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

    // Glowing Neon Grid Lines
    {
      id: `y2k_grid_h_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Y2K Matrix Rule',
      x: 0,
      y: height * 0.2,
      width,
      height: 1,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 0.3,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `y2k_grid_v_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Y2K Matrix Vertical',
      x: width * 0.85,
      y: 0,
      width: 1,
      height,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      opacity: 0.25,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,

    // Tech HUD Status Badge
    {
      id: `hud_badge_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Y2K HUD Status Badge',
      x: width * 0.08,
      y: height * 0.08,
      width: width * 0.44,
      height: 32,
      color: 'rgba(0, 240, 255, 0.1)',
      fill: 'rgba(0, 240, 255, 0.1)',
      stroke: { color: s.palette.primary, width: 1 },
      cornerRadius: 6,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `hud_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Y2K Status Text',
      text: 'SYS.2000 // CORE ONLINE ✦',
      x: width * 0.08,
      y: height * 0.095,
      width: width * 0.44,
      height: 18,
      fontSize: 11,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: s.palette.primary,
      letterSpacing: 2,
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Holographic Liquid Pill (Rotated -6 deg)
    {
      id: `holo_pill_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Y2K Liquid Chrome Pill',
      x: width * 0.6,
      y: height * 0.15,
      width: width * 0.32,
      height: 48,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      cornerRadius: 999,
      shadow: { color: 'rgba(255, 0, 127, 0.6)', blur: 24, offsetX: 0, offsetY: 4 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: -6,
    } as any,
    {
      id: `holo_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Y2K Pill Text',
      text: 'CYBER 2000',
      x: width * 0.6,
      y: height * 0.17,
      width: width * 0.32,
      height: 20,
      fontSize: 13,
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 2,
      textAlign: 'center',
      rotation: -6,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Electric Headline
    {
      id: `y2k_h1_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Y2K Cyber Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 22) : 'DIGITAL HORIZON',
      x: width * 0.08,
      y: height * 0.34,
      width: width * 0.84,
      height: 84,
      fontSize: Math.max(36, Math.round(width * 0.072)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: s.palette.primary,
      letterSpacing: 2,
      shadow: { color: 'rgba(0, 240, 255, 0.6)', blur: 28, offsetX: 0, offsetY: 0 },
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Cyber Tagline
    {
      id: `y2k_sub_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Y2K Cyber Subtitle',
      text: 'Accelerating into the early-2000s chrome dreamscape. Pure optimism meets liquid metal interfaces.',
      x: width * 0.08,
      y: height * 0.48,
      width: width * 0.76,
      height: 50,
      fontSize: 15,
      fontWeight: '500',
      fontFamily: s.typography.bodyFont,
      color: s.palette.textMuted,
      lineHeight: 1.4,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,

    // Chrome CTA Button
    {
      id: `y2k_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Y2K Launch Button',
      x: width * 0.08,
      y: height * 0.68,
      width: width * 0.46,
      height: 54,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      cornerRadius: 16,
      stroke: { color: s.palette.primary, width: 2 },
      shadow: { color: 'rgba(255, 0, 127, 0.5)', blur: 24, offsetX: 0, offsetY: 6 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `y2k_btn_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Y2K Launch Text',
      text: 'ENTER CYBERSPACE →',
      x: width * 0.08,
      y: height * 0.705,
      width: width * 0.46,
      height: 20,
      fontSize: 14,
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 1.5,
      textAlign: 'center',
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

// ─── 7. Swiss Style Builder ─────────────────────────────────────────────────
export function buildSwissStyleDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.swissStyle;
  const photo = resolveHeroPhoto('architecture', prompt);

  const layers: Layer[] = [
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Swiss Pure White Canvas',
      x: 0,
      y: 0,
      width,
      height,
      color: '#ffffff',
      fill: '#ffffff',
      opacity: 1,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `muller_red_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Swiss Müller-Brockmann Red Header',
      x: width * 0.08,
      y: height * 0.06,
      width: width * 0.84,
      height: 12,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `tag_col1_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Swiss Metadata Index',
      text: 'INTL. TYPOGRAPHIC // N° 48',
      x: width * 0.08,
      y: height * 0.1,
      width: width * 0.38,
      height: 20,
      fontSize: 12,
      fontWeight: '800',
      fontFamily: s.typography.accentFont,
      color: s.palette.primary,
      letterSpacing: 1.5,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `hero_photo_${uuidv4().slice(0, 8)}`,
      type: 'image',
      name: 'Swiss Objective Photograph',
      src: photo.url,
      x: width * 0.48,
      y: height * 0.14,
      width: width * 0.44,
      height: height * 0.46,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Swiss Asymmetric Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 24) : 'RATIONAL DESIGN',
      x: width * 0.08,
      y: height * 0.2,
      width: width * 0.38,
      height: 140,
      fontSize: Math.max(34, Math.round(width * 0.062)),
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: s.palette.text,
      letterSpacing: -1,
      lineHeight: 1.05,
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `swiss_cta_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Swiss CTA Pill',
      x: width * 0.08,
      y: height * 0.78,
      width: width * 0.38,
      height: 48,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      cornerRadius: 4,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `swiss_cta_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Swiss CTA Text',
      text: 'VIEW ARCHIVE →',
      x: width * 0.08,
      y: height * 0.8,
      width: width * 0.38,
      height: 20,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 1,
      textAlign: 'center',
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
    backgroundColor: '#ffffff',
    layers,
  };
}

// ─── 8. Art Deco Builder ────────────────────────────────────────────────────
export function buildArtDecoDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.artDeco;

  const layers: Layer[] = [
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Art Deco Obsidian Base',
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
      id: `gold_border_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Art Deco Gold Border',
      x: width * 0.06,
      y: height * 0.06,
      width: width * 0.88,
      height: height * 0.88,
      color: 'transparent',
      fill: 'transparent',
      stroke: { color: s.palette.primary, width: 2 },
      opacity: 0.9,
      locked: true,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `crest_label_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Art Deco Insignia',
      text: '✦ METROPOLIS GRAND ✦',
      x: width * 0.1,
      y: height * 0.18,
      width: width * 0.8,
      height: 24,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: s.typography.headlineFont,
      color: s.palette.primary,
      letterSpacing: 4,
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Art Deco Main Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 24) : 'THE GOLDEN ERA',
      x: width * 0.1,
      y: height * 0.32,
      width: width * 0.8,
      height: 72,
      fontSize: Math.max(36, Math.round(width * 0.068)),
      fontWeight: '700',
      fontFamily: s.typography.headlineFont,
      color: s.palette.secondary,
      letterSpacing: 3,
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `deco_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Art Deco Button',
      x: width * 0.3,
      y: height * 0.68,
      width: width * 0.4,
      height: 52,
      color: s.palette.primary,
      fill: s.palette.primary,
      stroke: { color: '#ffffff', width: 1 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `deco_btn_txt_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Art Deco Button Text',
      text: 'RESERVE TABLE →',
      x: width * 0.3,
      y: height * 0.705,
      width: width * 0.4,
      height: 20,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: s.typography.headlineFont,
      color: '#0a0e14',
      letterSpacing: 2,
      textAlign: 'center',
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

// ─── 9. Pop Art Builder ─────────────────────────────────────────────────────
export function buildPopArtDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.popArt;

  const layers: Layer[] = [
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Pop Art Canvas',
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
      id: `yellow_block_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Pop Saturated Yellow Field',
      x: width * 0.08,
      y: height * 0.08,
      width: width * 0.84,
      height: height * 0.84,
      color: s.palette.primary,
      fill: s.palette.primary,
      stroke: { color: '#000000', width: 6 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `dialogue_box_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Pop Comic Speech Frame',
      x: width * 0.14,
      y: height * 0.2,
      width: width * 0.72,
      height: 90,
      color: '#ffffff',
      fill: '#ffffff',
      stroke: { color: '#000000', width: 4 },
      shadow: { color: '#000000', blur: 0, offsetX: 8, offsetY: 8 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: -3,
    } as any,
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Pop Comic Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 20) : 'BOOM! REVOLUTION',
      x: width * 0.14,
      y: height * 0.23,
      width: width * 0.72,
      height: 54,
      fontSize: Math.max(34, Math.round(width * 0.065)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#000000',
      letterSpacing: 2,
      textAlign: 'center',
      rotation: -3,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `cta_btn_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Pop Art CTA',
      x: width * 0.24,
      y: height * 0.68,
      width: width * 0.52,
      height: 56,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      stroke: { color: '#000000', width: 4 },
      shadow: { color: '#000000', blur: 0, offsetX: 6, offsetY: 6 },
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Pop Art CTA Text',
      text: 'POW! GET IT NOW →',
      x: width * 0.24,
      y: height * 0.705,
      width: width * 0.52,
      height: 24,
      fontSize: 16,
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#ffffff',
      letterSpacing: 2,
      textAlign: 'center',
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

// ─── 10. Psychedelic Builder ────────────────────────────────────────────────
export function buildPsychedelicDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  const { width, height, prompt } = opts;
  const s = GRAPHIC_DESIGN_STYLES.psychedelic;

  const layers: Layer[] = [
    {
      id: `base_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Psychedelic Cosmos Canvas',
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
      id: `aura_ring1_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Aura Neon Ring 1',
      x: width * 0.2,
      y: height * 0.18,
      width: width * 0.6,
      height: width * 0.6,
      color: s.palette.primary,
      fill: s.palette.primary,
      opacity: 0.2,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `aura_ring2_${uuidv4().slice(0, 8)}`,
      type: 'circle',
      name: 'Aura Magenta Ring 2',
      x: width * 0.28,
      y: height * 0.26,
      width: width * 0.44,
      height: width * 0.44,
      color: s.palette.secondary,
      fill: s.palette.secondary,
      opacity: 0.35,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `headline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Psychedelic Warped Headline',
      text: prompt.length > 3 ? prompt.toUpperCase().slice(0, 20) : 'ELECTRIC MIND',
      x: width * 0.08,
      y: height * 0.42,
      width: width * 0.84,
      height: 72,
      fontSize: Math.max(36, Math.round(width * 0.07)),
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: s.palette.primary,
      letterSpacing: 3,
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    } as any,
    {
      id: `subheadline_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Psychedelic Cosmic Subtitle',
      text: s.tagline.toUpperCase(),
      x: width * 0.12,
      y: height * 0.54,
      width: width * 0.76,
      height: 36,
      fontSize: Math.max(14, Math.round(width * 0.022)),
      fontWeight: '700',
      fontFamily: s.typography.bodyFont,
      color: s.palette.secondary,
      letterSpacing: 4,
      textAlign: 'center',
      rotation: 0,
      opacity: 0.9,
      locked: false,
      visible: true,
    } as any,
    {
      id: `cta_pill_${uuidv4().slice(0, 8)}`,
      type: 'rectangle',
      name: 'Electric Glow CTA Pill',
      x: width * 0.28,
      y: height * 0.66,
      width: width * 0.44,
      height: 52,
      color: s.palette.primary,
      fill: s.palette.primary,
      cornerRadius: 999,
      opacity: 1,
      locked: false,
      visible: true,
      rotation: 0,
    } as any,
    {
      id: `cta_text_${uuidv4().slice(0, 8)}`,
      type: 'text',
      name: 'Electric CTA Text',
      text: 'ENTER THE VORTEX →',
      x: width * 0.28,
      y: height * 0.68,
      width: width * 0.44,
      height: 24,
      fontSize: 14,
      fontWeight: '900',
      fontFamily: s.typography.headlineFont,
      color: '#000000',
      letterSpacing: 2,
      textAlign: 'center',
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

// ─── 11. Brutalism Builder ──────────────────────────────────────────────────
export function buildBrutalistDesign(opts: StyleBuildOptions): ArtboardDesignResult {
  return buildNeoBrutalistDesign(opts);
}

// ─── Master Dispatcher ──────────────────────────────────────────────────────
export function buildCompositionByStyleId(
  styleId: GraphicDesignStyleId,
  width: number,
  height: number,
  prompt: string
): ArtboardDesignResult {
  const opts: StyleBuildOptions = { width, height, prompt };

  switch (styleId) {
    case 'bentoGrid':
      return buildBentoGridDesign(opts);
    case 'aurora':
      return buildAuroraDesign(opts);
    case 'neoBrutalism':
      return buildNeoBrutalistDesign(opts);
    case 'luxuryTypography':
      return buildLuxuryTypographyDesign(opts);
    case 'y2k':
      return buildY2kDesign(opts);
    case 'bauhaus':
      return buildBauhausDesign(opts);
    case 'artDeco':
      return buildArtDecoDesign(opts);
    case 'swissStyle':
      return buildSwissStyleDesign(opts);
    case 'popArt':
      return buildPopArtDesign(opts);
    case 'psychedelic':
      return buildPsychedelicDesign(opts);
    case 'brutalism':
      return buildBrutalistDesign(opts);
    case 'minimalism':
    case 'modernism':
    case 'postmodernism':
    case 'flat':
    case 'contemporary':
    case 'artNouveau':
    case 'synthwave':
    case 'risograph':
    case 'typeCollage':
    case 'micrographics':
    case 'japandi':
    case 'trinket':
    case 'maximalism':
    case 'punk':
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
 * Classifies design intent against 2026 trends and foundational movements.
 * Returns the matched style ID or null if none is explicitly specified.
 */
export function classifyDesignMovement(prompt: string): GraphicDesignStyleId | null {
  if (!prompt || typeof prompt !== 'string') return null;
  const p = prompt.toLowerCase();

  // 2026 Trends & Modern Layouts
  if (/bento|bento grid|bento-grid|modular card|compartment|apple keynote grid/.test(p)) {
    return 'bentoGrid';
  }
  if (/aurora|ethereal|northern light|iridescent|glowing gradient|dreamy mist/.test(p)) {
    return 'aurora';
  }
  if (/neo-brutal|neobrutal|hard shadow|4px border|bold solid color|brutalist web/.test(p)) {
    return 'neoBrutalism';
  }
  if (/luxury typograph|haute couture|fashion editorial|gold and black|cinzel|couture|luxury brand/.test(p)) {
    return 'luxuryTypography';
  }
  if (/y2k|cybercore|cyberpunk|chrome|holographic|liquid metal|early 2000|year 2000/.test(p)) {
    return 'y2k';
  }
  if (/synthwave|retrowave|neon grid|80s grid|outrun|arcade neon/.test(p)) {
    return 'synthwave';
  }
  if (/micrographic|blueprint|technical spec|spec sheet|coordinate|stamp spec|industrial diagram/.test(p)) {
    return 'micrographics';
  }
  if (/japandi|wabi-sabi|wabi sabi|zen minimalist|japanese minimalist|scandinavian minimal/.test(p)) {
    return 'japandi';
  }
  if (/risograph|riso|spot color|misregistration|grain print|screen print/.test(p)) {
    return 'risograph';
  }
  if (/type-collage|type collage|ransom note|pick and mix|font collage|mixed type/.test(p)) {
    return 'typeCollage';
  }
  if (/trinket|visual index|specimen sheet|flat lay|collection grid|archive layout/.test(p)) {
    return 'trinket';
  }
  if (/maximalis|more is more|pattern overload|color explosion/.test(p)) {
    return 'maximalism';
  }
  if (/punk|grunge|photocopier|anti-polish|zine|distressed/.test(p)) {
    return 'punk';
  }
  if (/art nouveau|art-nouveau|mucha|whiplash|botanical curve|organic floral/.test(p)) {
    return 'artNouveau';
  }

  // Foundational Historical Movements
  if (/bauhaus|gropius|herbert bayer|form follows function|constructivis/.test(p)) {
    return 'bauhaus';
  }
  if (/art deco|art-deco|artdeco|gatsby|roaring 20|roaring twenties|golden age|chrysler/.test(p)) {
    return 'artDeco';
  }
  if (/brutalis|raw concrete|anti-design|monospace spec/.test(p)) {
    return 'brutalism';
  }
  if (/swiss style|swiss|international typographic|muller-brockmann|müller-brockmann|grid poster/.test(p)) {
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

export function getStylesByCategory(category: GraphicDesignStyleCategory): GraphicDesignStyleMeta[] {
  return GRAPHIC_DESIGN_STYLE_LIST.filter((s) => s.category === category);
}
