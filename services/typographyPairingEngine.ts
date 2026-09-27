/**
 * Typography Pairing Engine
 *
 * Maps a design style / campaign archetype to a curated heading + body
 * font pairing. Used by the omnichannel campaign generator and the AI
 * design director to enforce consistent, intentional typographic hierarchy
 * across generated compositions.
 */

export interface TypographyPairing {
  /** Display / heading font family. */
  heading: string;
  /** Body / supporting copy font family. */
  body: string;
  /** Optional accent font for labels, badges and CTAs. */
  accent?: string;
  /** Short descriptor of the pairing's mood, useful for prompt grounding. */
  mood: string;
}

const DEFAULT_PAIRING: TypographyPairing = {
  heading: 'Outfit',
  body: 'Inter',
  accent: 'Space Grotesk',
  mood: 'balanced contemporary',
};

/**
 * Curated pairings keyed by style/archetype identifier. Keys are matched
 * case-insensitively and by substring, so campaign archetypes
 * ('cyberpunk', 'neo_brutalist', ...) and graphic-design styles
 * ('synthwave', 'brutalism', ...) both resolve.
 */
const PAIRINGS: Record<string, TypographyPairing> = {
  cyberpunk: {
    heading: 'Orbitron',
    body: 'Rajdhani',
    accent: 'Share Tech Mono',
    mood: 'high-tech neon futurism',
  },
  synthwave: {
    heading: 'Wavefare',
    body: 'Rajdhani',
    accent: 'Share Tech Mono',
    mood: 'retro 80s neon grid',
  },
  luxury: {
    heading: 'Playfair Display',
    body: 'Montserrat',
    accent: 'Cormorant Garamond',
    mood: 'refined premium elegance',
  },
  luxuryTypography: {
    heading: 'Cormorant Garamond',
    body: 'Montserrat',
    accent: 'Playfair Display',
    mood: 'expressive high-fashion serif',
  },
  neo_brutalist: {
    heading: 'Archivo Black',
    body: 'Space Grotesk',
    accent: 'IBM Plex Mono',
    mood: 'raw high-contrast boldness',
  },
  neoBrutalism: {
    heading: 'Archivo Black',
    body: 'Space Grotesk',
    accent: 'IBM Plex Mono',
    mood: 'raw high-contrast boldness',
  },
  brutalism: {
    heading: 'Anton',
    body: 'Work Sans',
    accent: 'IBM Plex Mono',
    mood: 'unapologetic utilitarian weight',
  },
  modern_editorial: {
    heading: 'Libre Baskerville',
    body: 'Source Sans 3',
    accent: 'Playfair Display',
    mood: 'crisp magazine editorial',
  },
  editorial: {
    heading: 'Libre Baskerville',
    body: 'Source Sans 3',
    accent: 'Playfair Display',
    mood: 'crisp magazine editorial',
  },
  corporate_tech: {
    heading: 'Inter',
    body: 'Inter',
    accent: 'Space Grotesk',
    mood: 'trustworthy modern enterprise',
  },
  minimalism: {
    heading: 'Inter',
    body: 'Inter',
    accent: 'Work Sans',
    mood: 'quiet functional minimalism',
  },
  modernism: {
    heading: 'Outfit',
    body: 'Inter',
    accent: 'Space Grotesk',
    mood: 'clean geometric modernism',
  },
  bauhaus: {
    heading: 'Archivo',
    body: 'Work Sans',
    accent: 'Futura',
    mood: 'constructivist geometric clarity',
  },
  artDeco: {
    heading: 'Poiret One',
    body: 'Montserrat',
    accent: 'Cinzel',
    mood: 'opulent gilded-age glamour',
  },
  popArt: {
    heading: 'Bungee',
    body: 'Work Sans',
    accent: 'Archivo Black',
    mood: 'bold comic-book energy',
  },
  swissStyle: {
    heading: 'Helvetica Neue',
    body: 'Helvetica Neue',
    accent: 'Space Grotesk',
    mood: 'rational international typographic',
  },
  psychedelic: {
    heading: 'Rubik Mono One',
    body: 'Space Grotesk',
    accent: 'Bungee',
    mood: 'kaleidoscopic retro swirl',
  },
  postmodernism: {
    heading: 'Archivo Black',
    body: 'Source Sans 3',
    accent: 'Space Grotesk',
    mood: 'playful ironic fragmentation',
  },
  flat: {
    heading: 'Nunito',
    body: 'Open Sans',
    accent: 'Montserrat',
    mood: 'friendly approachable simplicity',
  },
  contemporary: {
    heading: 'Sora',
    body: 'Inter',
    accent: 'Space Grotesk',
    mood: 'current clean versatility',
  },
  y2k: {
    heading: 'Blender Pro',
    body: 'Inter',
    accent: 'Eurostile',
    mood: 'chrome-plated millennium nostalgia',
  },
  bentoGrid: {
    heading: 'Inter',
    body: 'Inter',
    accent: 'Space Grotesk',
    mood: 'modular structured card layout',
  },
  aurora: {
    heading: 'Sora',
    body: 'Source Sans 3',
    accent: 'Outfit',
    mood: 'luminous gradient serenity',
  },
};

/**
 * Resolve the curated font pairing for a given style or campaign archetype.
 * Falls back to a safe, balanced default for unknown identifiers so callers
 * always receive a usable pairing.
 */
export function recommendPairingForStyle(style: string): TypographyPairing {
  if (!style) {
    return { ...DEFAULT_PAIRING };
  }
  const key = style.toLowerCase();
  if (PAIRINGS[key]) {
    return { ...PAIRINGS[key] };
  }
  // Substring match: tolerate variants like 'neo-brutalist' or 'cyberpunk_neon'.
  const normalized = key.replace(/[^a-z]/g, '');
  for (const [name, pairing] of Object.entries(PAIRINGS)) {
    if (normalized.includes(name.replace(/[^a-z]/g, ''))) {
      return { ...pairing };
    }
  }
  return { ...DEFAULT_PAIRING };
}

export interface TypographyCategory {
  category: string;
  meta: {
    description: string;
    icon: string;
  };
  pairings: Array<{
    style: string;
    pairing: TypographyPairing;
  }>;
}

/**
 * Returns all curated pairings grouped into thematic categories, useful for
 * browse/picker surfaces in the design assistant.
 */
export function getCategoriesWithPairings(): TypographyCategory[] {
  const groups: Array<{ category: string; description: string; icon: string; keys: string[] }> = [
    {
      category: 'Futuristic & Neon',
      description: 'High-energy technology and retro-futurism aesthetics.',
      icon: '⚡',
      keys: ['cyberpunk', 'synthwave', 'y2k', 'aurora'],
    },
    {
      category: 'Luxury & Editorial',
      description: 'Refined serif-led systems for premium and print brands.',
      icon: '✒️',
      keys: ['luxury', 'luxuryTypography', 'modern_editorial', 'editorial', 'artDeco'],
    },
    {
      category: 'Bold & Brutalist',
      description: 'Heavy, high-contrast voices that command attention.',
      icon: '🟧',
      keys: ['neo_brutalist', 'neoBrutalism', 'brutalism', 'popArt', 'postmodernism'],
    },
    {
      category: 'Clean & Contemporary',
      description: 'Neutral, versatile sans-serifs for modern products.',
      icon: '⬜',
      keys: [
        'corporate_tech',
        'minimalism',
        'modernism',
        'bauhaus',
        'swissStyle',
        'flat',
        'contemporary',
        'bentoGrid',
        'psychedelic',
      ],
    },
  ];

  return groups.map((group) => ({
    category: group.category,
    meta: { description: group.description, icon: group.icon },
    pairings: group.keys
      .filter((key) => PAIRINGS[key])
      .map((key) => ({ style: key, pairing: { ...PAIRINGS[key] } })),
  }));
}

export default recommendPairingForStyle;
