// Models
export const MODEL_FAST = 'gemini-2.5-flash-image';
export const MODEL_PRO = 'gemini-3-pro-image-preview';

// Default Configuration
export const DEFAULT_ASPECT_RATIO = '1:1';
export const CANVAS_W = 1080;
export const CANVAS_H = 1080;

export const CANVAS_SIZE_PRESETS = [
  { id: 'ig-post', name: 'Instagram Post', width: 1080, height: 1080, category: 'Social' },
  { id: 'ig-story', name: 'Instagram Story/Reel', width: 1080, height: 1920, category: 'Social' },
  { id: 'fb-post', name: 'Facebook Post', width: 1200, height: 630, category: 'Social' },
  { id: 'li-post', name: 'LinkedIn Post', width: 1200, height: 1200, category: 'Social' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Video' },
  { id: 'presentation', name: 'Presentation (16:9)', width: 1920, height: 1080, category: 'Print' },
  { id: 'a4', name: 'A4 Document', width: 2480, height: 3508, category: 'Print' },
  { id: 'letter', name: 'US Letter', width: 2550, height: 3300, category: 'Print' },
];

// Fonts
export const FONT_CATEGORIES = {
  'Modern Sans': [
    'Inter',
    'Space Grotesk',
    'DM Sans',
    'Manrope',
    'Montserrat',
    'Poppins',
    'Work Sans',
    'Public Sans',
    'Lexend',
    'Mulish',
    'Open Sans',
    'Lato',
    'Roboto',
  ],
  'Classic Serifs': [
    'Playfair Display',
    'Cormorant Garamond',
    'EB Garamond',
    'Libre Baskerville',
    'Lora',
    'Merriweather',
    'PT Serif',
    'Crimson Text',
    'Zilla Slab',
    'Vollkorn',
    'Bitter',
  ],
  'Elegant Scripts': [
    'Dancing Script',
    'Great Vibes',
    'Pacifico',
    'Satisfy',
    'Yellowtail',
    'Sacramenta',
    'Caveat',
    'Indie Flower',
    'Shadows Into Light',
  ],
  'Display & Bold': [
    'Anton',
    'Bebas Neue',
    'Oswald',
    'Kanit',
    'Staatliches',
    'Russo One',
    'Alfa Slab One',
    'Abril Fatface',
    'Bungee',
    'Monoton',
    'Staatliches',
  ],
  'Vintage & Retro': [
    'Lobster',
    'Righteous',
    'Cinzel',
    'Special Elite',
    'Fredericka the Great',
    'Bangers',
    'Creepster',
    'Permanent Marker',
    'Fredoka One',
  ],
  Monospace: ['IBM Plex Mono', 'Source Code Pro', 'Space Mono', 'Inconsolata', 'Roboto Mono'],
};

export const FONT_FAMILIES = Object.values(FONT_CATEGORIES).flat().sort();

export const DEFAULT_FILTERS_CONST = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  vignette: 0,
};

export const EFFECT_PRESETS = {
  normal: DEFAULT_FILTERS_CONST,
  vintage: {
    brightness: 110,
    contrast: 80,
    saturation: 70,
    sepia: 40,
    grayscale: 0,
    blur: 0,
    opacity: 1,
    vignette: 30,
  },
  noir: {
    brightness: 100,
    contrast: 130,
    saturation: 0,
    sepia: 0,
    grayscale: 100,
    blur: 0,
    opacity: 1,
    vignette: 40,
  },
  vivid: {
    brightness: 105,
    contrast: 120,
    saturation: 180,
    sepia: 0,
    grayscale: 0,
    blur: 0,
    opacity: 1,
    vignette: 0,
  },
  retro: {
    brightness: 100,
    contrast: 90,
    saturation: 120,
    sepia: 20,
    grayscale: 0,
    blur: 0,
    opacity: 1,
    vignette: 20,
  },
  soft: {
    brightness: 115,
    contrast: 90,
    saturation: 90,
    sepia: 0,
    grayscale: 0,
    blur: 1,
    opacity: 1,
    vignette: 10,
  },
};

export * as Icons from './components/icons';
