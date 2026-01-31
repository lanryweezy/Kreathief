/**
 * Font Loader Service
 * Lazy loads Google Fonts on-demand to improve initial page load
 */

import { logger } from './logger';

// Cache of loaded fonts
const loadedFonts = new Set<string>();

// Preloaded common fonts (loaded immediately)
const PRELOAD_FONTS = ['Inter', 'Space Grotesk'];

// All available fonts
export const AVAILABLE_FONTS = [
    'Abel', 'Abril Fatface', 'Acme', 'Alfa Slab One', 'Amatic SC', 'Anton', 'Arimo', 'Asap',
    'Bangers', 'Barlow', 'Bebas Neue', 'Bitter', 'Bungee',
    'Cabin', 'Cairo', 'Catamaran', 'Caveat', 'Cinzel', 'Comfortaa', 'Cormorant Garamond', 'Creepster', 'Crimson Text',
    'Dancing Script', 'DM Sans', 'Dosis', 'EB Garamond', 'Exo 2',
    'Fira Sans', 'Fjalla One', 'Fredericka the Great',
    'Gloria Hallelujah', 'Great Vibes',
    'Heebo', 'Hind',
    'IBM Plex Mono', 'IBM Plex Sans', 'Inconsolata', 'Indie Flower', 'Inter',
    'Josefin Sans',
    'Kanit',
    'Lato', 'Lexend', 'Libre Baskerville', 'Lobster', 'Lora',
    'Manrope', 'Merriweather', 'Monoton', 'Montserrat', 'Mukta', 'Mulish',
    'Nanum Gothic', 'Noto Sans', 'Noto Serif', 'Nunito',
    'Open Sans', 'Oswald', 'Oxygen',
    'Pacifico', 'Permanent Marker', 'Playfair Display', 'Poppins', 'PT Sans', 'PT Serif', 'Public Sans',
    'Quicksand',
    'Rajdhani', 'Raleway', 'Righteous', 'Roboto', 'Roboto Condensed', 'Roboto Mono', 'Rubik', 'Russo One',
    'Sacramenta', 'Sarabun', 'Satisfy', 'Shadows Into Light', 'Signika', 'Slabo 27px', 'Sora', 'Source Code Pro', 'Source Sans 3', 'Space Grotesk', 'Space Mono', 'Special Elite', 'Sriracha', 'Staatliches',
    'Teko', 'Titillium Web',
    'Ubuntu',
    'Varela Round', 'Vollkorn',
    'Work Sans',
    'Yellowtail',
    'Zilla Slab'
].sort();

/**
 * Load a single font from Google Fonts
 */
export async function loadFont(fontFamily: string): Promise<boolean> {
    // Skip if already loaded
    if (loadedFonts.has(fontFamily)) {
        return true;
    }

    // Skip if it's a system font
    if (fontFamily === 'sans-serif' || fontFamily === 'serif' || fontFamily === 'monospace') {
        return true;
    }

    try {
        const endTimer = logger.time(`Loading font: ${fontFamily}`);

        // Create link element
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily.replace(/ /g, '+'))}:wght@300;400;500;600;700&display=swap`;

        // Wait for font to load
        await new Promise<void>((resolve, reject) => {
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load font: ${fontFamily}`));
            document.head.appendChild(link);
        });

        // Wait for font to be actually available
        await document.fonts.ready;

        loadedFonts.add(fontFamily);
        endTimer();

        return true;
    } catch (error) {
        logger.warn(`Failed to load font: ${fontFamily}`, { error });
        return false;
    }
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
}
