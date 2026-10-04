/**
 * Creative Variation Engine
 * ─────────────────────────
 * Guarantees that repeated generations for the SAME prompt explore genuinely
 * different design space instead of returning identical outputs.
 *
 * Every generation run gets a fresh `variationSeed`. From it we derive a
 * deterministic "design genome" per variant (so a given seed is reproducible
 * for debugging / tests) that controls:
 *   • typography pairing (Google Fonts, role-aware heading/body swap)
 *   • palette hue drift (saturated colours only — neutrals stay neutral)
 *   • composition mirroring (layout handedness)
 *   • hero photography rotation (ranked relevant candidates)
 *   • copywriting angle + art-direction archetype for LLM stages
 *
 * Brand kits always win: when a brand kit supplies fonts/colours the genome
 * leaves those dimensions untouched.
 *
 * The output stays fully editable — the engine only rewrites layer
 * properties; it never rasterises or flattens anything.
 */
import type { Layer } from '../types';
import { listHeroPhotoCandidates } from './visualAssetDirector';

// ─── Seeded randomness ──────────────────────────────────────────────────────

export function createVariationSeed(): number {
  try {
    const buf = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(buf);
    if (buf[0]) {
      return buf[0];
    }
  } catch {
    /* fall through */
  }
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** Small, fast, well-distributed PRNG (mulberry32). Returns [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

// ─── Creative vocabularies ──────────────────────────────────────────────────

export interface FontPairing {
  name: string;
  heading: string;
  body: string;
  /** Wide display faces get scaled down so copy keeps fitting its box. */
  headingScale: number;
  /** Archetypes this pairing suits; empty = universal. */
  fits: string[];
}

export const FONT_PAIRINGS: FontPairing[] = [
  { name: 'Editorial Luxe', heading: 'Playfair Display', body: 'Inter', headingScale: 0.96, fits: ['luxury', 'editorial', 'fashion', 'realEstate', 'food'] },
  { name: 'Tech Grotesk', heading: 'Space Grotesk', body: 'Inter', headingScale: 0.97, fits: ['saas', 'cyberpunk', 'education', 'ecommerce'] },
  { name: 'Impact Poster', heading: 'Bebas Neue', body: 'Montserrat', headingScale: 1.08, fits: ['event', 'fitness', 'cyberpunk', 'africanMarket', 'food'] },
  { name: 'Modern Serif', heading: 'DM Serif Display', body: 'DM Sans', headingScale: 0.96, fits: ['editorial', 'luxury', 'realEstate', 'education', 'food'] },
  { name: 'Avant-Garde', heading: 'Syne', body: 'Manrope', headingScale: 0.9, fits: ['fashion', 'editorial', 'event', 'saas'] },
  { name: 'Brutalist Block', heading: 'Archivo Black', body: 'Archivo', headingScale: 0.88, fits: ['fitness', 'event', 'ecommerce', 'cyberpunk', 'fashion'] },
  { name: 'Refined Classic', heading: 'Cormorant Garamond', body: 'Lato', headingScale: 1.02, fits: ['luxury', 'realEstate', 'editorial'] },
  { name: 'Bold Condensed', heading: 'Anton', body: 'Roboto', headingScale: 1.0, fits: ['fitness', 'event', 'africanMarket', 'ecommerce', 'food'] },
  { name: 'Soft Serif', heading: 'Fraunces', body: 'Work Sans', headingScale: 0.94, fits: ['food', 'education', 'editorial', 'africanMarket'] },
  { name: 'Wide Display', heading: 'Unbounded', body: 'Plus Jakarta Sans', headingScale: 0.84, fits: ['saas', 'cyberpunk', 'event', 'fashion'] },
  { name: 'Geometric Clean', heading: 'Outfit', body: 'Inter', headingScale: 1.0, fits: [] },
  { name: 'Statement Fatface', heading: 'Abril Fatface', body: 'Poppins', headingScale: 0.92, fits: ['fashion', 'food', 'event', 'editorial'] },
];

export interface ArtDirection {
  id: string;
  name: string;
  brief: string;
}

export const ART_DIRECTIONS: ArtDirection[] = [
  { id: 'swiss', name: 'Swiss International Grid', brief: 'Strict modular grid, flush-left ragged-right type, generous margins, one bold accent colour, asymmetric balance.' },
  { id: 'editorial', name: 'Editorial Magazine Cover', brief: 'Masthead-scale headline, layered cover lines, subject overlapping the title, refined serif/sans contrast.' },
  { id: 'brutalist', name: 'Brutalist Raw Type', brief: 'Oversized heavy type, hard edges, visible structure, high contrast blocks, deliberate tension, no soft gradients.' },
  { id: 'minimal-luxury', name: 'Minimal Luxury Whitespace', brief: 'At least 45% negative space, small elegant type, thin rules, restrained 2-3 colour palette, quiet confidence.' },
  { id: 'asymmetric-split', name: 'Asymmetric Split Tension', brief: '60/40 or 70/30 split, image bleeding off one edge, type anchored to the opposite corner, strong diagonal eye path.' },
  { id: 'kinetic-diagonal', name: 'Kinetic Diagonal', brief: 'Rotated type band or shapes at 8-15°, motion energy, layered overlapping elements, dynamic reading flow.' },
  { id: 'bauhaus', name: 'Bauhaus Geometric', brief: 'Primary geometric shapes (circle, square, triangle) as structural elements, primary-adjacent palette, clean sans type.' },
  { id: 'retro-futurist', name: 'Retro-Futurist Glow', brief: 'Deep dark field, luminous gradient orbs, chrome/neon accents, wide display type, cinematic atmosphere.' },
  { id: 'collage', name: 'Collage Cutout Layering', brief: 'Cut-out subject over torn/offset colour planes, sticker-like badges, playful overlaps, handmade energy.' },
  { id: 'type-hero', name: 'Oversized Typographic Hero', brief: 'Typography IS the visual: one word filling 60-80% of the width, image secondary or cropped inside the letters region.' },
  { id: 'spatial-depth', name: 'Spatial Depth Planes', brief: 'Foreground/midground/background planes with scale contrast, soft shadows, subject breaking the frame for depth.' },
  { id: 'organic-fluid', name: 'Organic Fluid Shapes', brief: 'Soft blob shapes, rounded containers, warm harmonious palette, friendly humanist type, gentle flow.' },
];

export const COPY_ANGLES = [
  'benefit-led promise (what the audience gains)',
  'bold provocative statement',
  'intriguing question that creates curiosity',
  'social proof / credibility',
  'urgency and scarcity',
  'sensory, poetic and evocative',
  'playful wit / wordplay',
  'minimal declarative (two to three words of pure confidence)',
];

// ─── Anti-repetition memory (session scoped) ────────────────────────────────

const recentHeadlinesByIntent = new Map<string, string[]>();
const recentDirectionIds: string[] = [];

function normalizeIntent(intent: string): string {
  return intent.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);
}

export function rememberHeadlines(intent: string, headlines: string[]): void {
  const key = normalizeIntent(intent);
  const prev = recentHeadlinesByIntent.get(key) || [];
  const next = [...prev, ...headlines.filter(Boolean).map((h) => h.trim())].slice(-15);
  recentHeadlinesByIntent.set(key, next);
}

export function recentHeadlines(intent: string): string[] {
  return recentHeadlinesByIntent.get(normalizeIntent(intent)) || [];
}

/** Picks an art direction, avoiding the last few used this session. */
export function pickArtDirection(rng: () => number = Math.random): ArtDirection {
  const fresh = ART_DIRECTIONS.filter((d) => !recentDirectionIds.includes(d.id));
  const choice = pick(fresh.length ? fresh : ART_DIRECTIONS, rng);
  recentDirectionIds.push(choice.id);
  if (recentDirectionIds.length > 4) {
    recentDirectionIds.shift();
  }
  return choice;
}

/** Test helper — clears session memory. */
export function __resetVariationMemory(): void {
  recentHeadlinesByIntent.clear();
  recentDirectionIds.length = 0;
}

// ─── Design genome ──────────────────────────────────────────────────────────

export interface DesignGenome {
  seed: number;
  fontPairing: FontPairing;
  hueShift: number;
  mirror: boolean;
  photoOffset: number;
  copyAngle: string;
}

export function deriveGenome(seed: number, variantIndex: number, archetype?: string): DesignGenome {
  const rng = mulberry32((seed ^ Math.imul(variantIndex + 1, 0x9e3779b1)) >>> 0);
  const suitable = FONT_PAIRINGS.filter((p) => p.fits.length === 0 || (archetype && p.fits.includes(archetype)));
  const fontPairing = pick(suitable.length >= 3 ? suitable : FONT_PAIRINGS, rng);
  const hueRoll = rng();
  const hueShift = hueRoll < 0.35 ? 0 : Math.round((rng() < 0.5 ? -1 : 1) * (12 + rng() * 28));
  return {
    seed,
    fontPairing,
    hueShift,
    mirror: rng() < 0.45,
    photoOffset: Math.floor(rng() * 6),
    copyAngle: pick(COPY_ANGLES, rng),
  };
}

// ─── Colour helpers ─────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

/** Rotates hue of saturated colours only; neutrals (bg blacks/whites/greys) are kept. */
export function shiftHue(color: unknown, degrees: number): unknown {
  if (typeof color !== 'string' || !degrees) return color;
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  const [h, s, l] = rgbToHsl(...rgb);
  if (s < 0.18 || l < 0.08 || l > 0.94) return color;
  return hslToHex((h + degrees + 360) % 360, s, l);
}

const COLOR_KEYS = ['color', 'fill', 'stroke', 'strokeColor', 'backgroundColor', 'shadowColor', 'glowColor'];

function shiftLayerColors(layer: any, degrees: number): void {
  for (const key of COLOR_KEYS) {
    if (typeof layer[key] === 'string') {
      layer[key] = shiftHue(layer[key], degrees);
    }
  }
  for (const gKey of ['gradient', 'fill', 'fillGradient']) {
    const g = layer[gKey];
    if (g && typeof g === 'object' && Array.isArray(g.stops)) {
      g.stops = g.stops.map((stop: any) => (stop && typeof stop.color === 'string' ? { ...stop, color: shiftHue(stop.color, degrees) } : stop));
    }
  }
}

// ─── Genome application ─────────────────────────────────────────────────────

export interface VariationContext {
  width: number;
  height: number;
  archetype: string;
  prompt: string;
  /** Brand kit supplied fonts — never override them. */
  lockFonts?: boolean;
  /** Brand kit supplied colours — never drift them. */
  lockColors?: boolean;
}

function isIconFont(family: unknown): boolean {
  return typeof family === 'string' && /icon|symbol|emoji|awesome/i.test(family);
}

/**
 * Applies a design genome to a layer stack. Pure: returns new layers.
 * Every result remains a native, editable multi-layer composition.
 */
export function applyDesignGenome(layers: Layer[], genome: DesignGenome, ctx: VariationContext): Layer[] {
  const out = structuredClone(layers) as any[];
  const textLayers = out.filter((l) => l && l.type === 'text');
  const maxFont = Math.max(0, ...textLayers.map((l) => Number(l.fontSize) || 0));

  // 1. Typography pairing (role-aware: large type = heading face).
  if (!ctx.lockFonts && maxFont > 0) {
    for (const t of textLayers) {
      if (isIconFont(t.fontFamily)) continue;
      const size = Number(t.fontSize) || 0;
      const isHeading = size >= maxFont * 0.6;
      if (isHeading) {
        t.fontFamily = genome.fontPairing.heading;
        if (genome.fontPairing.headingScale !== 1 && size > 0) {
          t.fontSize = Math.max(12, Math.round(size * genome.fontPairing.headingScale));
        }
      } else {
        t.fontFamily = genome.fontPairing.body;
      }
    }
  }

  // 2. Palette drift.
  if (!ctx.lockColors && genome.hueShift) {
    for (const layer of out) {
      if (layer && layer.type !== 'image') shiftLayerColors(layer, genome.hueShift);
    }
  }

  // 3. Composition handedness (mirror horizontally).
  if (genome.mirror) {
    for (const layer of out) {
      if (!layer || typeof layer.x !== 'number' || typeof layer.width !== 'number') continue;
      const isFullBleed = layer.x <= 1 && layer.width >= ctx.width - 1;
      if (isFullBleed) continue;
      layer.x = Math.round(ctx.width - layer.x - layer.width);
      if (typeof layer.rotation === 'number' && layer.rotation) layer.rotation = -layer.rotation;
    }
  }

  // 4. Hero photography rotation.
  if (genome.photoOffset > 0) {
    const candidates = listHeroPhotoCandidates(ctx.archetype, ctx.prompt);
    if (candidates.length > 1) {
      for (const layer of out) {
        if (layer && layer.type === 'image' && /hero photo/i.test(layer.name || '')) {
          const currentIdx = Math.max(0, candidates.findIndex((c) => c.url === layer.src));
          const next = candidates[(currentIdx + genome.photoOffset) % candidates.length];
          if (next && next.url !== layer.src) {
            layer.src = next.url;
            layer.name = `Hero Photo — ${next.alt}`;
          }
        }
      }
    }
  }

  return out as Layer[];
}

/** Short human label for the variant card ("Impact Poster · mirrored · hue +24°"). */
export function describeGenome(genome: DesignGenome): string {
  const parts = [genome.fontPairing.name];
  if (genome.mirror) parts.push('mirrored layout');
  if (genome.hueShift) parts.push(`palette ${genome.hueShift > 0 ? '+' : ''}${genome.hueShift}°`);
  return parts.join(' · ');
}
