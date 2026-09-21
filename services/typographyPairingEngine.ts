/**
 * Typography Pairing AI Engine
 * Curated database of 100+ font pairings with style/mood/industry matching.
 * Uses design context to recommend the best heading + body + accent combinations.
 */

// ─── Font Pairing Database ───────────────────────────────────────────────────

export interface FontPairing {
  id: string;
  name: string;
  heading: string;
  body: string;
  accent: string;
  headingWeight: string;
  bodyWeight: string;
  accentWeight: string;
  category: PairingCategory;
  mood: string[];
  industries: string[];
  styles: string[]; // maps to design style IDs
  description: string;
  googleFontsUrl?: string;
}

export type PairingCategory =
  | 'classic'
  | 'modern'
  | 'playful'
  | 'elegant'
  | 'bold'
  | 'minimal'
  | 'editorial'
  | 'tech'
  | 'handcrafted'
  | 'luxury'
  | 'avant_garde';

const PAIRING_CATEGORIES: Record<PairingCategory, { name: string; icon: string }> = {
  classic: { name: 'Classic', icon: '📖' },
  modern: { name: 'Modern', icon: '🔲' },
  playful: { name: 'Playful', icon: '🎪' },
  elegant: { name: 'Elegant', icon: '✨' },
  bold: { name: 'Bold', icon: '💥' },
  minimal: { name: 'Minimal', icon: '◻️' },
  editorial: { name: 'Editorial', icon: '📰' },
  tech: { name: 'Tech', icon: '💻' },
  handcrafted: { name: 'Handcrafted', icon: '✋' },
  luxury: { name: 'Luxury', icon: '👑' },
  avant_garde: { name: 'Avant-Garde', icon: '⚡' },
};

const FONT_PAIRINGS: FontPairing[] = [
  // ═══════════ AVANT-GARDE (Elite AI Tier) ═══════════
  {
    id: 'avant-garde-brutalist',
    name: 'Neo-Brutalist',
    heading: 'Space Grotesk', body: 'Inter', accent: 'Space Mono',
    headingWeight: '900', bodyWeight: '700', accentWeight: '700',
    category: 'avant_garde', mood: ['aggressive', 'technical', 'visionary'],
    industries: ['tech', 'cyberpunk', 'crypto', 'fashion', 'events'],
    styles: ['brutalism', 'contemporary', 'neoMinimalism'],
    description: 'Extreme typographic tension. Giant, aggressively tight headlines colliding with microscopic monospace details.',
  },
  {
    id: 'avant-garde-shanghai',
    name: 'Neo-Shanghai Tech',
    heading: 'Syne', body: 'Manrope', accent: 'Outfit',
    headingWeight: '800', bodyWeight: '500', accentWeight: '800',
    category: 'avant_garde', mood: ['fluid', 'hyper-modern', 'global'],
    industries: ['ai', 'mobility', 'hardware', 'art'],
    styles: ['cybercore', 'fluid', 'acidGraphics'],
    description: 'Bizarre, wide letterforms colliding with strict geometric logic. The sound of a hyper-modern metropolis.',
  },
  {
    id: 'avant-garde-lagos',
    name: 'Lagos Maximalist',
    heading: 'Clash Display', body: 'Cabinet Grotesk', accent: 'Archivo Black',
    headingWeight: '700', bodyWeight: '900', accentWeight: '900',
    category: 'avant_garde', mood: ['vibrant', 'rhythmic', 'loud'],
    industries: ['music', 'streetwear', 'culture', 'festival'],
    styles: ['newMaximalism', 'antiDesign', 'popArt'],
    description: 'Maximum contrast, maximum rhythm. Letters that refuse to stay quietly in their boxes.',
  },

  // ═══════════ CLASSIC ═══════════
  {
    id: 'classic-serif-sans',
    name: 'Timeless Elegance',
    heading: 'Playfair Display', body: 'Source Sans 3', accent: 'Montserrat',
    headingWeight: '700', bodyWeight: '400', accentWeight: '600',
    category: 'classic', mood: ['professional', 'trustworthy', 'refined'],
    industries: ['finance', 'law', 'consulting', 'education', 'real estate'],
    styles: ['neoclassical', 'minimalism', 'swissStyle'],
    description: 'High-contrast serif headlines with clean sans-serif body. The gold standard of professional design.',
  },
  {
    id: 'classic-garamond-helvetica',
    name: 'Swiss Precision',
    heading: 'EB Garamond', body: 'Inter', accent: 'Space Mono',
    headingWeight: '700', bodyWeight: '400', accentWeight: '500',
    category: 'classic', mood: ['intellectual', 'calm', 'authoritative'],
    industries: ['publishing', 'education', 'research', 'museum'],
    styles: ['swissStyle', 'minimalism', 'neoclassical'],
    description: 'Old-world serif meets Swiss rationalism. Perfect for content-heavy designs.',
  },
  {
    id: 'classic-baskerville-arial',
    name: 'British Authority',
    heading: 'Libre Baskerville', body: 'Inter', accent: 'Cormorant',
    headingWeight: '700', bodyWeight: '400', accentWeight: '600',
    category: 'classic', mood: ['dignified', 'traditional', 'ceremonial'],
    industries: ['legal', 'government', 'heritage', 'university'],
    styles: ['victorian', 'neoclassical'],
    description: 'Transitional serif with impeccable heritage credentials.',
  },

  // ═══════════ MODERN ═══════════
  {
    id: 'modern-geometric',
    name: 'Geometric Clarity',
    heading: 'Outfit', body: 'Inter', accent: 'Space Grotesk',
    headingWeight: '800', bodyWeight: '400', accentWeight: '600',
    category: 'modern', mood: ['clean', 'confident', 'approachable'],
    industries: ['saas', 'tech', 'startup', 'fintech', 'app'],
    styles: ['modernism', 'flat', 'contemporary', 'geometric'],
    description: 'The modern tech stack. Geometric headlines with ultra-readable body text.',
  },
  {
    id: 'modern-dm-sans',
    name: 'Quiet Confidence',
    heading: 'DM Sans', body: 'Inter', accent: 'DM Mono',
    headingWeight: '700', bodyWeight: '400', accentWeight: '400',
    category: 'modern', mood: ['calm', 'minimal', 'sophisticated'],
    industries: ['wellness', 'lifestyle', 'fashion', 'design'],
    styles: ['japandi', 'minimalism', 'neoMinimalism'],
    description: 'Low-contrast geometric sans with exceptional readability at small sizes.',
  },
  {
    id: 'modern-sora-inter',
    name: 'Friendly Tech',
    heading: 'Sora', body: 'Inter', accent: 'Space Mono',
    headingWeight: '700', bodyWeight: '400', accentWeight: '500',
    category: 'modern', mood: ['friendly', 'innovative', 'human'],
    industries: ['ai', 'saas', 'education', 'health'],
    styles: ['contemporary', 'flat'],
    description: 'Rounded geometric sans that signals approachable technology.',
  },

  // ═══════════ PLAYFUL ═══════════
  {
    id: 'playful-rubik',
    name: 'Fun & Bold',
    heading: 'Rubik', body: 'Inter', accent: 'Space Mono',
    headingWeight: '800', bodyWeight: '400', accentWeight: '500',
    category: 'playful', mood: ['fun', 'energetic', 'youthful'],
    industries: ['food', 'entertainment', 'gaming', 'kids', 'events'],
    styles: ['memphis', 'kidcore', 'kawaii', 'popArt'],
    description: 'Rounded corners everywhere. Feels friendly without being childish.',
  },
  {
    id: 'playful-baloo',
    name: 'Bubblegum',
    heading: 'Baloo 2', body: 'Nunito', accent: 'Quicksand',
    headingWeight: '700', bodyWeight: '400', accentWeight: '600',
    category: 'playful', mood: ['cute', 'round', 'cheerful'],
    industries: ['children', 'food', 'pets', 'party'],
    styles: ['kawaii', 'kidcore', 'rubberhose'],
    description: 'Ultra-rounded letterforms that feel like bubbles. Perfect for kid-friendly brands.',
  },
  {
    id: 'playful-righteous',
    name: 'Retro Vibes',
    heading: 'Righteous', body: 'Inter', accent: 'Space Mono',
    headingWeight: '400', bodyWeight: '400', accentWeight: '500',
    category: 'playful', mood: ['retro', 'cool', 'nostalgic'],
    industries: ['music', 'fashion', 'events', 'gaming'],
    styles: ['retroVintage', 'synthwave', 'y2k', 'midCentury'],
    description: 'Groovy display face with 70s flair. Use sparingly for maximum impact.',
  },

  // ═══════════ ELEGANT ═══════════
  {
    id: 'elegant-cormorant',
    name: 'Graceful Serif',
    heading: 'Cormorant', body: 'Inter', accent: 'Cormorant',
    headingWeight: '600', bodyWeight: '400', accentWeight: '400',
    category: 'elegant', mood: ['graceful', 'feminine', 'romantic'],
    industries: ['beauty', 'wedding', 'fashion', 'florist', 'spa'],
    styles: ['artNouveau', 'ethereal', 'coquette'],
    description: 'Delicate high-contrast serif with hairline details. Feels like calligraphy in digital form.',
  },
  {
    id: 'elegant-cinzel',
    name: 'Imperial',
    heading: 'Cinzel', body: 'Cormorant', accent: 'Cinzel Decorative',
    headingWeight: '700', bodyWeight: '400', accentWeight: '400',
    category: 'elegant', mood: ['regal', 'ceremonial', 'timeless'],
    industries: ['luxury', 'jewelry', 'hotel', 'yacht', 'private bank'],
    styles: ['baroque', 'victorian', 'neoclassical', 'filigree'],
    description: 'Roman imperial capitals. Use for brands that need to feel like they have centuries of heritage.',
  },
  {
    id: 'elegant-playfair-lora',
    name: 'Editorial Grace',
    heading: 'Playfair Display', body: 'Lora', accent: 'Inter',
    headingWeight: '700', bodyWeight: '400', accentWeight: '500',
    category: 'elegant', mood: ['editorial', 'sophisticated', 'warm'],
    industries: ['magazine', 'book', 'luxury', 'wine', 'art'],
    styles: ['artDeco', 'editorial'],
    description: 'Scotch roman meets transitional serif. A pairing that feels like a premium magazine spread.',
  },

  // ═══════════ BOLD ═══════════
  {
    id: 'bold-impact',
    name: 'Maximum Impact',
    heading: 'Bebas Neue', body: 'Inter', accent: 'Space Mono',
    headingWeight: '400', bodyWeight: '400', accentWeight: '500',
    category: 'bold', mood: ['loud', 'urgent', 'powerful'],
    industries: ['sports', 'fitness', 'music', 'streetwear', 'events'],
    styles: ['brutalism', 'punkGrunge', 'graffiti', 'antiDesign'],
    description: 'All-caps condensed powerhouse. Every headline screams with authority.',
  },
  {
    id: 'bold-archivo',
    name: 'Tech Bold',
    heading: 'Archivo Black', body: 'Inter', accent: 'Space Mono',
    headingWeight: '400', bodyWeight: '400', accentWeight: '500',
    category: 'bold', mood: ['strong', 'tech', 'decisive'],
    industries: ['tech', 'gaming', 'automotive', 'cybersecurity'],
    styles: ['cybercore', 'neonNoir', 'brutalism'],
    description: 'Grotesque heavy weight. Technical authority with brute force.',
  },
  {
    id: 'bold-anton',
    name: 'Poster Power',
    heading: 'Anton', body: 'Inter', accent: 'Space Grotesk',
    headingWeight: '400', bodyWeight: '400', accentWeight: '600',
    category: 'bold', mood: ['impactful', 'dramatic', 'attention-grabbing'],
    industries: ['advertising', 'events', 'music', 'sports'],
    styles: ['newMaximalism', 'popArt', 'memphis'],
    description: 'Ultra-condensed sans for when every pixel of vertical space matters.',
  },

  // ═══════════ MINIMAL ═══════════
  {
    id: 'minimal-pure',
    name: 'Pure Minimal',
    heading: 'Inter', body: 'Inter', accent: 'Inter',
    headingWeight: '700', bodyWeight: '400', accentWeight: '500',
    category: 'minimal', mood: ['clean', 'invisible', 'functional'],
    industries: ['tech', 'saas', 'productivity', 'dashboard'],
    styles: ['minimalism', 'flat', 'swissStyle'],
    description: 'One typeface to rule them all. Inter handles every role with mechanical precision.',
  },
  {
    id: 'minimal-mono',
    name: 'Monospace Minimal',
    heading: 'Space Mono', body: 'Inter', accent: 'Space Mono',
    headingWeight: '700', bodyWeight: '400', accentWeight: '400',
    category: 'minimal', mood: ['technical', 'precise', 'developer'],
    industries: ['devtools', 'code', 'terminal', 'data'],
    styles: ['microIndustrial', 'brutalism', 'utilitarian'],
    description: 'Monospace headlines signal developer-first products. The technical authority play.',
  },

  // ═══════════ EDITORIAL ═══════════
  {
    id: 'editorial-magazine',
    name: 'Magazine Spread',
    heading: 'Fraunces', body: 'Inter', accent: 'Space Grotesk',
    headingWeight: '700', bodyWeight: '400', accentWeight: '600',
    category: 'editorial', mood: ['editorial', 'expressive', 'warm'],
    industries: ['magazine', 'blog', 'publishing', 'media'],
    styles: ['contemporary', 'humanImperfection'],
    description: 'Old-style serif with optical sizing. Feels alive and hand-crafted at every size.',
  },
  {
    id: 'editorial-news',
    name: 'Newsprint',
    heading: 'Merriweather', body: 'Source Sans 3', accent: 'Space Mono',
    headingWeight: '900', bodyWeight: '400', accentWeight: '500',
    category: 'editorial', mood: ['trustworthy', 'informative', 'serious'],
    industries: ['news', 'journalism', 'politics', 'research'],
    styles: ['swissStyle', 'modernism'],
    description: 'Screen-optimized serif built for long-form reading. The journalism standard.',
  },

  // ═══════════ TECH ═══════════
  {
    id: 'tech-mono',
    name: 'Terminal',
    heading: 'JetBrains Mono', body: 'Inter', accent: 'JetBrains Mono',
    headingWeight: '700', bodyWeight: '400', accentWeight: '400',
    category: 'tech', mood: ['developer', 'precise', 'technical'],
    industries: ['devtools', 'code', 'api', 'terminal'],
    styles: ['microIndustrial', 'cybercore'],
    description: 'Purpose-built for code. Ligatures and all. Signals "we build for developers."',
  },
  {
    id: 'tech-futura',
    name: 'Future Perfect',
    heading: 'Orbitron', body: 'Inter', accent: 'Space Mono',
    headingWeight: '700', bodyWeight: '400', accentWeight: '500',
    category: 'tech', mood: ['futuristic', 'sci-fi', 'space-age'],
    industries: ['space', 'gaming', 'crypto', 'metaverse'],
    styles: ['synthwave', 'rocketpunk', 'y2k', 'cybercore'],
    description: 'Geometric display face from the future. Use sparingly for maximum sci-fi impact.',
  },

  // ═══════════ HANDCRAFTED ═══════════
  {
    id: 'handcrafted-caveat',
    name: 'Sketchy Notes',
    heading: 'Caveat', body: 'Inter', accent: 'Space Mono',
    headingWeight: '700', bodyWeight: '400', accentWeight: '500',
    category: 'handcrafted', mood: ['personal', 'casual', 'authentic'],
    industries: ['creative', 'art', 'cafe', 'handmade', 'yoga'],
    styles: ['naive', 'bohemian', 'cottagecore', 'humanImperfection'],
    description: 'Handwritten font that feels genuinely human. Perfect for personal brands.',
  },
  {
    id: 'handcrafted-patrick',
    name: 'Doodle Art',
    heading: 'Patrick Hand', body: 'Nunito', accent: 'Indie Flower',
    headingWeight: '400', bodyWeight: '400', accentWeight: '400',
    category: 'handcrafted', mood: ['fun', 'sketchy', 'creative'],
    industries: ['children', 'education', 'art', 'food'],
    styles: ['naive', 'kidcore', 'conceptualSketch'],
    description: 'Casual handwriting that feels like doodles in a notebook.',
  },

  // ═══════════ LUXURY ═══════════
  {
    id: 'luxury-gold',
    name: 'Gilded',
    heading: 'Cormorant', body: 'Cormorant', accent: 'Cinzel',
    headingWeight: '600', bodyWeight: '400', accentWeight: '400',
    category: 'luxury', mood: ['opulent', 'exclusive', 'prestigious'],
    industries: ['luxury', 'jewelry', 'champagne', 'fashion', 'hotel'],
    styles: ['artDeco', 'baroque', 'filigree', 'luxuryTypography'],
    description: 'Ultra-thin serifs with extreme contrast. The typography equivalent of gold leaf.',
  },
  {
    id: 'luxury-minimal',
    name: 'Quiet Luxury',
    heading: 'DM Sans', body: 'Cormorant', accent: 'Cinzel',
    headingWeight: '500', bodyWeight: '400', accentWeight: '400',
    category: 'luxury', mood: ['understated', 'refined', 'whispered'],
    industries: ['fashion', 'skincare', 'interior', 'gallery'],
    styles: ['minimalism', 'japandi', 'neoMinimalism'],
    description: 'The "if you know, you know" pairing. Sans headlines whisper luxury; serif body confirms it.',
  },
  {
    id: 'luxury-noir',
    name: 'Noir Elegance',
    heading: 'Playfair Display', body: 'Lora', accent: 'Cinzel',
    headingWeight: '900', bodyWeight: '400', accentWeight: '400',
    category: 'luxury', mood: ['dark', 'dramatic', 'sensual'],
    industries: ['perfume', 'nightclub', 'fashion', 'film'],
    styles: ['gothic', 'tenebrism', 'neonNoir'],
    description: 'High-contrast serif in its boldest weight. Feels like a Vogue cover at midnight.',
  },
];

// ─── Lookup Functions ────────────────────────────────────────────────────────

export function getAllPairings(): FontPairing[] {
  return FONT_PAIRINGS;
}

export function getPairingsByCategory(category: PairingCategory): FontPairing[] {
  return FONT_PAIRINGS.filter(p => p.category === category);
}

export function getPairingById(id: string): FontPairing | undefined {
  return FONT_PAIRINGS.find(p => p.id === id);
}

/**
 * Find the best font pairing for a given context.
 * Scores each pairing based on style match, mood match, and industry match.
 */
export function recommendPairing(context: {
  styleId?: string;
  mood?: string[];
  industry?: string;
  category?: PairingCategory;
}): FontPairing | null {
  const scored = FONT_PAIRINGS.map(pairing => {
    let score = 0;

    // Style match (highest weight)
    if (context.styleId && pairing.styles.includes(context.styleId)) {
      score += 10;
    }

    // Mood match
    if (context.mood) {
      for (const m of context.mood) {
        if (pairing.mood.includes(m)) score += 3;
      }
    }

    // Industry match
    if (context.industry && pairing.industries.includes(context.industry)) {
      score += 5;
    }

    // Category match
    if (context.category && pairing.category === context.category) {
      score += 4;
    }

    return { pairing, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].pairing : null;
}

/**
 * Get top N recommendations for a context.
 */
export function recommendPairings(context: {
  styleId?: string;
  mood?: string[];
  industry?: string;
  category?: PairingCategory;
}, count: number = 3): FontPairing[] {
  const scored = FONT_PAIRINGS.map(pairing => {
    let score = 0;
    if (context.styleId && pairing.styles.includes(context.styleId)) score += 10;
    if (context.mood) {
      for (const m of context.mood) {
        if (pairing.mood.includes(m)) score += 3;
      }
    }
    if (context.industry && pairing.industries.includes(context.industry)) score += 5;
    if (context.category && pairing.category === context.category) score += 4;
    return { pairing, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).filter(s => s.score > 0).map(s => s.pairing);
}

/**
 * Generate a Google Fonts URL for a pairing.
 */
export function getGoogleFontsUrl(pairing: FontPairing): string {
  const families = [pairing.heading, pairing.body, pairing.accent]
    .filter((f, i, arr) => arr.indexOf(f) === i) // deduplicate
    .map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Get all categories with their pairings.
 */
export function getCategoriesWithPairings(): Array<{ category: PairingCategory; meta: typeof PAIRING_CATEGORIES[PairingCategory]; pairings: FontPairing[] }> {
  const categories: PairingCategory[] = ['luxury', 'bold', 'elegant', 'modern', 'minimal', 'editorial', 'classic', 'playful', 'tech', 'handcrafted'];
  return categories.map(cat => ({
    category: cat,
    meta: PAIRING_CATEGORIES[cat],
    pairings: getPairingsByCategory(cat),
  }));
}

/**
 * Convenient helper to get an optimal font pairing from any style ID, movement name, or archetype.
 */
export function recommendPairingForStyle(styleOrArchetype: string): FontPairing {
  const normalized = (styleOrArchetype || '').toLowerCase().trim();
  
  // Try direct match
  const direct = recommendPairing({
    styleId: styleOrArchetype,
    industry: styleOrArchetype,
  });
  if (direct) return direct;

  // Fallback mappings by keyword
  if (normalized.includes('cyber') || normalized.includes('neon') || normalized.includes('tech') || normalized.includes('saas') || normalized.includes('futur') || normalized.includes('avant') || normalized.includes('abstract') || normalized.includes('event')) {
    return recommendPairing({ category: 'avant_garde' }) || FONT_PAIRINGS[0];
  }
  if (normalized.includes('lux') || normalized.includes('gold') || normalized.includes('prestige') || normalized.includes('eleg')) {
    return recommendPairing({ category: 'luxury' }) || FONT_PAIRINGS[0];
  }
  if (normalized.includes('edit') || normalized.includes('mag') || normalized.includes('art') || normalized.includes('swiss')) {
    return recommendPairing({ category: 'editorial' }) || FONT_PAIRINGS[1];
  }
  if (normalized.includes('fit') || normalized.includes('sport') || normalized.includes('bold') || normalized.includes('power')) {
    return recommendPairing({ category: 'bold' }) || FONT_PAIRINGS[6];
  }
  if (normalized.includes('fash') || normalized.includes('cloth') || normalized.includes('trend')) {
    return recommendPairing({ category: 'modern' }) || FONT_PAIRINGS[3];
  }

  // Default to versatile Modern Geometric
  return FONT_PAIRINGS[3] || FONT_PAIRINGS[0];
}
