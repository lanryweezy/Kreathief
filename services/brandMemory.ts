/**
 * Brand Memory System
 * Persists user brand identity (colors, fonts, voice, imagery) across sessions.
 * Ensures AI-generated designs always respect brand guidelines.
 * Stores per-user brand kits with versioning and active kit selection.
 */

import { db as supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { log } from '../utils/log';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BrandKit {
  id: string;
  name: string;
  userId: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  colorPalette: string[]; // all brand colors

  // Typography
  headingFont: string;
  bodyFont: string;
  accentFont: string;

  // Imagery
  logoUrl?: string;
  logoDarkUrl?: string;
  logoLightUrl?: string;
  faviconUrl?: string;

  // Voice & Tone
  tagline?: string;
  brandVoice?: 'professional' | 'friendly' | 'bold' | 'playful' | 'luxury' | 'technical';
  brandDescription?: string;

  // Industry
  industry?: string;
  targetAudience?: string;

  // Metadata
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  version: number;
}

export interface BrandExtractionResult {
  colors: string[];
  fonts: string[];
  confidence: number;
  suggestions: string[];
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'kreathief_brand_kits';
const ACTIVE_BRAND_KEY = 'kreathief_active_brand_kit';

function getLocalBrandKits(): BrandKit[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalBrandKits(kits: BrandKit[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(kits));
  } catch {
    log.warn('[BrandMemory] Failed to save brand kits to localStorage');
  }
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/**
 * Create a new brand kit.
 */
export function createBrandKit(data: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt' | 'version'>): BrandKit {
  const kit: BrandKit = {
    ...data,
    id: `brand_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  };

  const kits = getLocalBrandKits();
  kits.push(kit);
  saveLocalBrandKits(kits);

  // If this is the first kit, make it active
  if (kits.length === 1) {
    setActiveBrandKit(kit.id);
  }

  log.info('[BrandMemory] Created brand kit', { id: kit.id, name: kit.name });
  return kit;
}

/**
 * Update an existing brand kit.
 */
export function updateBrandKit(id: string, updates: Partial<BrandKit>): BrandKit | null {
  const kits = getLocalBrandKits();
  const index = kits.findIndex(k => k.id === id);
  if (index === -1) return null;

  kits[index] = {
    ...kits[index],
    ...updates,
    id, // prevent ID change
    updatedAt: Date.now(),
    version: kits[index].version + 1,
  };

  saveLocalBrandKits(kits);
  log.info('[BrandMemory] Updated brand kit', { id });
  return kits[index];
}

/**
 * Delete a brand kit.
 */
export function deleteBrandKit(id: string): boolean {
  const kits = getLocalBrandKits();
  const filtered = kits.filter(k => k.id !== id);
  if (filtered.length === kits.length) return false;

  saveLocalBrandKits(filtered);

  // If deleted kit was active, switch to first available
  if (getActiveBrandKitId() === id) {
    setActiveBrandKit(filtered.length > 0 ? filtered[0].id : null);
  }

  return true;
}

/**
 * Get all brand kits for the current user.
 */
export function getAllBrandKits(): BrandKit[] {
  return getLocalBrandKits();
}

/**
 * Get a specific brand kit by ID.
 */
export function getBrandKit(id: string): BrandKit | null {
  return getLocalBrandKits().find(k => k.id === id) || null;
}

/**
 * Get the currently active brand kit.
 */
export function getActiveBrandKit(): BrandKit | null {
  const activeId = getActiveBrandKitId();
  if (!activeId) {
    const kits = getLocalBrandKits();
    return kits.length > 0 ? kits[0] : null;
  }
  return getBrandKit(activeId);
}

/**
 * Get the active brand kit ID.
 */
export function getActiveBrandKitId(): string | null {
  return localStorage.getItem(ACTIVE_BRAND_KEY) || null;
}

/**
 * Set the active brand kit.
 */
export function setActiveBrandKit(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_BRAND_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_BRAND_KEY);
  }
  // Also update the Zustand store
  try {
    const { useStore } = require('../store/useStore');
    useStore.getState().setActiveBrandKitId(id);
  } catch {
    // Store not available (e.g., during testing)
  }
}

// ─── Brand Extraction ────────────────────────────────────────────────────────

/**
 * Extract brand colors from an image URL.
 * Returns the dominant colors as hex values.
 */
export async function extractBrandColorsFromImage(imageUrl: string): Promise<BrandExtractionResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ colors: [], fonts: [], confidence: 0, suggestions: ['Could not analyze image'] });
          return;
        }

        // Sample at reduced resolution for speed
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        const colorCounts: Record<string, number> = {};

        // Sample every 4th pixel
        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          // Skip transparent and very dark/light pixels
          if (a < 128) continue;
          if (r + g + b < 30 || r + g + b > 730) continue;

          // Quantize to reduce similar colors
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;

          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        // Get top 5 distinct colors
        const sorted = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        // Filter out too-similar colors
        const colors: string[] = [];
        for (const [hex] of sorted) {
          if (colors.length >= 5) break;
          const isTooSimilar = colors.some(existing => colorDistance(hex, existing) < 60);
          if (!isTooSimilar) {
            colors.push(hex);
          }
        }

        resolve({
          colors,
          fonts: [],
          confidence: colors.length >= 3 ? 0.8 : 0.5,
          suggestions: colors.length < 3
            ? ['Image has limited color variety. Try uploading a logo or brand asset.']
            : [`Extracted ${colors.length} brand colors from your image.`],
        });
      } catch (err) {
        resolve({ colors: [], fonts: [], confidence: 0, suggestions: ['Failed to analyze image colors'] });
      }
    };
    img.onerror = () => {
      resolve({ colors: [], fonts: [], confidence: 0, suggestions: ['Could not load image'] });
    };
    img.src = imageUrl;
  });
}

/**
 * Calculate perceptual distance between two hex colors.
 */
function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ─── AI Prompt Integration ───────────────────────────────────────────────────

/**
 * Generate brand-aware context for AI prompts.
 * Call this before sending any design generation request.
 */
export function getBrandPromptContext(): string {
  const kit = getActiveBrandKit();
  if (!kit) return '';

  const parts: string[] = [];

  parts.push(`BRAND IDENTITY:`);
  parts.push(`- Brand name: ${kit.name}`);
  if (kit.tagline) parts.push(`- Tagline: "${kit.tagline}"`);
  if (kit.industry) parts.push(`- Industry: ${kit.industry}`);
  if (kit.brandDescription) parts.push(`- Description: ${kit.brandDescription}`);
  if (kit.brandVoice) parts.push(`- Voice/tone: ${kit.brandVoice}`);

  parts.push(`\nBRAND COLORS (MUST USE):`);
  parts.push(`- Primary: ${kit.primaryColor}`);
  parts.push(`- Secondary: ${kit.secondaryColor}`);
  parts.push(`- Accent: ${kit.accentColor}`);
  parts.push(`- Background: ${kit.backgroundColor}`);
  parts.push(`- Text: ${kit.textColor}`);
  if (kit.colorPalette.length > 5) {
    parts.push(`- Full palette: ${kit.colorPalette.join(', ')}`);
  }

  parts.push(`\nBRAND TYPOGRAPHY (MUST USE):`);
  parts.push(`- Headlines: ${kit.headingFont}`);
  parts.push(`- Body text: ${kit.bodyFont}`);
  parts.push(`- Accents: ${kit.accentFont}`);

  if (kit.targetAudience) {
    parts.push(`\nTARGET AUDIENCE: ${kit.targetAudience}`);
  }

  parts.push(`\nIMPORTANT: All designs MUST use these exact brand colors and fonts. Do not deviate from the brand identity.`);

  return parts.join('\n');
}

/**
 * Check if a color palette matches the active brand kit.
 * Returns a score 0-100 indicating brand consistency.
 */
export function checkBrandConsistency(colors: string[]): number {
  const kit = getActiveBrandKit();
  if (!kit || colors.length === 0) return 100; // No brand = no violation

  const brandColors = [
    kit.primaryColor, kit.secondaryColor, kit.accentColor,
    kit.backgroundColor, kit.textColor,
    ...kit.colorPalette,
  ].map(c => c.toLowerCase());

  let matchCount = 0;
  for (const color of colors) {
    const normalized = color.toLowerCase();
    if (brandColors.some(bc => bc === normalized || colorDistance(bc, normalized) < 40)) {
      matchCount++;
    }
  }

  return Math.round((matchCount / colors.length) * 100);
}
