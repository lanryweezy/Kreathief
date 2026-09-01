// ─── AI Model Tiers ─────────────────────────────────────────────────────────
// Each agent in the pipeline uses the model best suited to its cognitive task.
// These map to OpenRouter model IDs via the modelMap in geminiService.ts.
export const MODEL_FAST = 'gemini-2.5-flash'; // Utility tasks: alt text, layer naming, font pairing, SVG, prompt enhancement
export const MODEL_PRO = 'gemini-2.5-pro'; // Vision analysis, style extraction, design analysis
export const MODEL_CREATIVE = 'claude-sonnet-4'; // Creative Draft, Creative Refine, Conversation — strong design reasoning
export const MODEL_CRITIC = 'gpt-4o'; // QA Critic — precise, rule-following, structured audit
export const MODEL_SCORER = 'gemini-2.5-flash'; // Performance Scorer — lightweight scoring task
// Default Configuration
export const DEFAULT_CORNER_RADIUS = 8;

export const CANVAS_SIZE_PRESETS = [
  // Social Media
  { id: 'ig-post', name: 'Instagram Post', width: 1080, height: 1080, category: 'Social' },
  { id: 'ig-story', name: 'Instagram Story/Reel', width: 1080, height: 1920, category: 'Social' },
  { id: 'fb-post', name: 'Facebook Post', width: 1200, height: 630, category: 'Social' },
  { id: 'li-post', name: 'LinkedIn Post', width: 1200, height: 1200, category: 'Social' },
  { id: 'x-post', name: 'X/Twitter Post', width: 1200, height: 675, category: 'Social' },
  { id: 'pin-pin', name: 'Pinterest Pin', width: 1000, height: 1500, category: 'Social' },
  { id: 'tiktok', name: 'TikTok/Reels', width: 1080, height: 1920, category: 'Social' },
  { id: 'wa-status', name: 'WhatsApp Status', width: 1080, height: 1920, category: 'Social' },
  // Video & Content
  { id: 'yt-thumb', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Video' },
  { id: 'yt-short', name: 'YouTube Shorts', width: 1080, height: 1920, category: 'Video' },
  { id: 'podcast-cover', name: 'Podcast Cover', width: 3000, height: 3000, category: 'Video' },
  // Print
  { id: 'presentation', name: 'Presentation (16:9)', width: 1920, height: 1080, category: 'Print' },
  { id: 'presentation-43', name: 'Presentation (4:3)', width: 1440, height: 1080, category: 'Print' },
  { id: 'a4', name: 'A4 Document', width: 2480, height: 3508, category: 'Print' },
  { id: 'a5', name: 'A5 Flyer', width: 1748, height: 2480, category: 'Print' },
  { id: 'letter', name: 'US Letter', width: 2550, height: 3300, category: 'Print' },
  { id: 'business-card', name: 'Business Card', width: 1050, height: 600, category: 'Print' },
  { id: 'billboard', name: 'Billboard (14x48)', width: 4032, height: 1152, category: 'Print' },
  // Digital
  { id: 'email-header', name: 'Email Header', width: 600, height: 200, category: 'Digital' },
  { id: 'blog-hero', name: 'Blog Hero Image', width: 1200, height: 630, category: 'Digital' },
  { id: 'og-image', name: 'Open Graph Image', width: 1200, height: 630, category: 'Digital' },
];

// Fonts — single source of truth
export const FONT_CATEGORIES: Record<string, string[]> = {
  'Sans Serif': [
    'Kreathief001',
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Work Sans',
    'Public Sans',
    'Manrope',
    'DM Sans',
    'Space Grotesk',
    'Lexend',
    'Mulish',
    'Nunito',
    'Quicksand',
    'Rubik',
    'Mukta',
    'Heebo',
    'Ubuntu',
    'Source Sans 3',
    'PT Sans',
    'Cabin',
    'Asap',
    'Exo 2',
    'Catamaran',
    'Cairo',
    'Hind',
    'Oxygen',
    'Sarabun',
    'Signika',
    'Varela Round',
    'Josefin Sans',
    'Arimo',
    'Barlow',
    'Dosis',
    'IBM Plex Sans',
    'Noto Sans',
    'Roboto Condensed',
    'Sora',
    'Abel',
    'Fira Sans',
    'Rajdhani',
    'Titillium Web',
  ],
  Serif: [
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
    'Noto Serif',
    'Slabo 27px',
  ],
  Display: [
    'Bebas Neue',
    'Anton',
    'Oswald',
    'Kanit',
    'Staatliches',
    'Russo One',
    'Alfa Slab One',
    'Abril Fatface',
    'Bungee',
    'Monoton',
    'Acme',
    'Comfortaa',
    'Fjalla One',
    'Sriracha',
    'Teko',
  ],
  'Script & Handwriting': [
    'Dancing Script',
    'Great Vibes',
    'Pacifico',
    'Satisfy',
    'Yellowtail',
    'Sacramenta',
    'Caveat',
    'Indie Flower',
    'Shadows Into Light',
    'Amatic SC',
    'Gloria Hallelujah',
  ],
  'Retro & Decorative': [
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

export const FONT_FAMILIES = Array.from(new Set(Object.values(FONT_CATEGORIES).flat())).sort();

export * as Icons from './components/icons';
