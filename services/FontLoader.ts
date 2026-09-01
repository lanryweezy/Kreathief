/**
 * Font Loader Service
 * Lazy loads fonts on-demand. Uses local fonts first, falls back to Google Fonts CDN if needed
 */

import { logger } from './logger';
import { storageService } from './storageService';
import { FONT_FAMILIES } from '../constants';

// Cache of loaded fonts
const loadedFonts = new Set<string>();
const customFonts = new Set<string>();
// Families that failed both local and CDN loads — avoids re-injecting dead <link> tags
const failedFonts = new Set<string>();

// Fonts already loaded globally via fonts.css
const LOCAL_FONTS = ['Inter', 'Space Grotesk', 'Outfit', 'Kreathief001'];

// Optional UI notifier so font failures surface to the user (registered in App init)
type FontToastCallback = (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
let toastCallback: FontToastCallback | null = null;

export function setFontToastCallback(callback: FontToastCallback): void {
  toastCallback = callback;
}

// Variable font axes registry: tracks available variation axes per family
const variableFontAxes = new Map<string, string[]>();

// Preloaded common fonts (loaded immediately)
const PRELOAD_FONTS = ['Inter', 'Space Grotesk', 'Outfit'];

// Single source of truth: derived from constants.FONT_FAMILIES
export const AVAILABLE_FONTS = FONT_FAMILIES;

// Local font files (downloaded from Google Fonts)
const LOCAL_FONT_WEIGHTS = ['300', '400', '500', '600', '700'];

/**
 * Load a single font - tries local first, falls back to CDN
 */
export async function loadFont(fontFamily: string): Promise<boolean> {
  // Strip CSS fallback (e.g. "Inter, sans-serif" → "Inter")
  const cleanFamily = fontFamily.split(',')[0].trim().replace(/['"]/g, '');

  // Skip if already loaded or natively bundled
  if (loadedFonts.has(cleanFamily) || LOCAL_FONTS.includes(cleanFamily)) {
    return true;
  }

  // Skip families that already failed — no point retrying every render
  if (failedFonts.has(cleanFamily)) {
    return false;
  }

  // Skip if it's a system font
  if (cleanFamily === 'sans-serif' || cleanFamily === 'serif' || cleanFamily === 'monospace' || cleanFamily === '') {
    return true;
  }

  const endTimer = logger.time(`Loading font: ${cleanFamily}`);
  const ok = await loadFontFromCdn(cleanFamily);
  if (!ok) {
    failedFonts.add(cleanFamily);
  }
  endTimer();
  return ok;
}

/**
 * Load a font from the Google Fonts CDN
 */
async function loadFontFromCdn(cleanFamily: string): Promise<boolean> {
  try {
    const endTimer = logger.time(`Loading font from CDN: ${cleanFamily}`);

    const encodedName = cleanFamily.replace(/ /g, '+');
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodedName}:wght@300;400;500;600;700;800;900&display=swap`;
    const isVariable = false;

    // Create link element for Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;

    // Wait for font to load
    await new Promise<void>((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => {
        // Remove the dead stylesheet so it isn't left in <head>
        link.remove();
        reject(new Error(`Failed to load font: ${cleanFamily}`));
      };
      document.head.appendChild(link);
    });

    // Wait for font to be actually available
    await document.fonts.ready;

    // Parse and store available axes from the loaded CSS
    if (isVariable) {
      variableFontAxes.set(cleanFamily, ['wght', 'ital']);
    } else {
      // Detect loaded weight variants from document.fonts
      const detectedWeights = new Set<string>();
      document.fonts.forEach((face) => {
        if (face.family === cleanFamily && face.status === 'loaded') {
          detectedWeights.add(String(face.weight));
        }
      });
      if (detectedWeights.size > 0) {
        variableFontAxes.set(cleanFamily, Array.from(detectedWeights).sort());
      }
    }

    loadedFonts.add(cleanFamily);
    endTimer();
    return true;
  } catch (cdnError) {
    logger.warn(`Failed to load font from CDN: ${cleanFamily}`, {
      error: cdnError instanceof Error ? cdnError.message : String(cdnError),
    });
    failedFonts.add(cleanFamily);
    toastCallback?.(`Could not load font "${cleanFamily}" — a fallback font will be used.`, 'warning');
    return false;
  }
}

/**
 * Register a custom font file (OTF, TTF, WOFF)
 */
export async function registerCustomFont(
  name: string,
  data: string | ArrayBuffer,
  saveToStorage = true
): Promise<boolean> {
  try {
    const fontData = typeof data === 'string' ? data : await blobToBase64(new Blob([data]));
    const fontFace = new FontFace(name, `url(${fontData})`);
    const loadedFace = await fontFace.load();
    (document.fonts as any).add(loadedFace);

    customFonts.add(name);
    loadedFonts.add(name);

    if (saveToStorage) {
      const saved = await storageService.getSetting<{ name: string; data: string }[]>('kreathief_custom_fonts', []);
      if (!saved.find((f) => f.name === name)) {
        await storageService.setSetting('kreathief_custom_fonts', [...saved, { name, data: fontData }]);
      }
    }

    logger.info(`Custom font registered: ${name}`);
    return true;
  } catch (error) {
    logger.error(`Failed to register custom font: ${name}`, { error });
    return false;
  }
}

/**
 * Initialize custom fonts from storage
 */
export async function initCustomFonts(): Promise<void> {
  try {
    const saved = await storageService.getSetting<{ name: string; data: string }[]>('kreathief_custom_fonts', []);
    logger.info(`Initializing ${saved.length} custom fonts from storage`);
    await Promise.all(saved.map((font) => registerCustomFont(font.name, font.data, false)));
  } catch (error) {
    logger.error('Failed to initialize custom fonts', { error });
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Get all available fonts including custom ones
 */
export function getAllAvailableFonts(): string[] {
  const all = [...AVAILABLE_FONTS, ...Array.from(customFonts)];
  if (!all.includes('Kreathief001')) {
    all.push('Kreathief001');
  }
  return all.sort();
}

/**
 * Load multiple fonts at once
 */
export async function loadFonts(fontFamilies: string[]): Promise<void> {
  await Promise.all(fontFamilies.map(loadFont));
}

/**
 * Check if a font is loaded
 */
export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily);
}

/**
 * Get list of loaded fonts
 */
export function getLoadedFonts(): string[] {
  return Array.from(loadedFonts);
}

/**
 * Get available variation axes for a font family
 */
export function getFontAxes(fontFamily: string): string[] {
  const cleanFamily = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  return variableFontAxes.get(cleanFamily) || ['wght'];
}

/**
 * Preload essential fonts on startup
 */
export function preloadEssentialFonts(): void {
  logger.info('Preloading essential fonts');
  loadFonts(PRELOAD_FONTS);
}

// Initialize on module load
if (typeof window !== 'undefined') {
  // Only preload essential fonts, not all fonts
  preloadEssentialFonts();
  initCustomFonts();
}
