/**
 * Comprehensive Design Style Database (65+ styles)
 * Compiled from Kittl, Behance, It's Nice That, UX Planet, Design Pickle, Looka research
 * 
 * This file contains metadata for all supported design styles.
 * Each style includes: name, category, era, description, palette, typography, keywords, mood.
 */

export interface DesignStyleEntry {
  id: string;
  name: string;
  category: StyleCategory;
  era: string;
  icon: string;
  tagline: string;
  description: string;
  badge: string;
  mood: string[];
  bestFor: string[];
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
  keywords: string[];
}

export type StyleCategory =
  | 'classical'
  | 'modernist'
  | 'retro'
  | 'raw'
  | 'dark'
  | 'organic'
  | 'playful'
  | 'typography'
  | 'digital'
  | 'fantasy'
  | 'trending';

export const STYLE_CATEGORIES: Record<StyleCategory, { name: string; icon: string; description: string }> = {
  classical: { name: 'Classical & Heritage', icon: '🏛️', description: 'Timeless styles rooted in art history' },
  modernist: { name: 'Modernist & Functional', icon: '📐', description: 'Clean, purposeful, grid-based design' },
  retro: { name: 'Retro & Nostalgic', icon: '📼', description: 'Vintage vibes and throwback aesthetics' },
  raw: { name: 'Raw & Rebellious', icon: '🔥', description: 'Unpolished, authentic, rule-breaking' },
  dark: { name: 'Dark & Dramatic', icon: '🌑', description: 'Moody, intense, high-contrast visuals' },
  organic: { name: 'Organic & Natural', icon: '🌿', description: 'Nature-inspired, warm, grounded' },
  playful: { name: 'Cute & Playful', icon: '🎀', description: 'Fun, charming, approachable' },
  typography: { name: 'Typography-Focused', icon: '🔤', description: 'Type as the hero element' },
  digital: { name: 'Digital & Contemporary', icon: '💎', description: 'Modern, tech-forward, current' },
  fantasy: { name: 'Fantasy & Storytelling', icon: '⚔️', description: 'Narrative, mythical, atmospheric' },
  trending: { name: '2026 Trending', icon: '📈', description: 'What\'s hot right now' },
};

// Helper to create a style entry with defaults
function style(overrides: Partial<DesignStyleEntry> & Pick<DesignStyleEntry, 'id' | 'name' | 'category' | 'tagline' | 'description' | 'palette' | 'keywords'>): DesignStyleEntry {
  return {
    era: '',
    icon: '🎨',
    badge: overrides.name.toUpperCase(),
    mood: [],
    bestFor: [],
    typography: {
      headlineFont: 'Inter',
      bodyFont: 'Inter',
      accentFont: 'Inter',
      headlineWeight: '700',
      letterSpacing: -0.3,
      textTransform: 'none',
    },
    ...overrides,
  };
}

export const DESIGN_STYLE_DATABASE: Record<string, DesignStyleEntry> = {

  // ═══════════════════════════════════════════════════════════════════
  // CLASSICAL & HERITAGE
  // ═══════════════════════════════════════════════════════════════════

  artDeco: style({
    id: 'artDeco', name: 'Art Deco', category: 'classical', era: '1920s–1930s', icon: '🍸',
    tagline: 'Geometric glamour and polished opulence',
    description: 'Bold geometric shapes, symmetry, metallic accents, stepped forms, and cinematic opulence. Born from the roaring 20s obsession with progress and luxury.',
    badge: 'GOLDEN AGE GLAMOUR',
    mood: ['glamorous', 'sophisticated', 'upscale', 'jazzy'],
    bestFor: ['luxury brands', 'cocktail events', 'retro-modern interfaces', 'premium packaging', 'event branding'],
    palette: { primary: '#1a1a2e', secondary: '#c9a84c', accent: '#d4af37', background: '#0d0d1a', surface: '#16162a', text: '#f5f0e1', textMuted: '#a09882', border: '#c9a84c' },
    typography: { headlineFont: 'Playfair Display', bodyFont: 'Cormorant Garamond', accentFont: 'Cinzel', headlineWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    keywords: ['art deco', 'deco', 'gatsby', 'roaring 20s', '1920', 'luxury gold', 'chrysler', 'ornate luxury', 'vintage luxury', 'geometric glamour', 'metallic'],
  }),

  artNouveau: style({
    id: 'artNouveau', name: 'Art Nouveau', category: 'classical', era: '1890s–1910', icon: '🌸',
    tagline: 'Flowing organic curves and floral elegance',
    description: 'Nature-inspired flowing lines, whiplash curves, floral ornament, and refined typography. A reaction against industrialization celebrating handcrafted beauty.',
    badge: 'ORGANIC ELEGANCE',
    mood: ['romantic', 'ornamental', 'graceful', 'expressive'],
    bestFor: ['posters', 'book covers', 'branding', 'packaging', 'type design'],
    palette: { primary: '#2d4a3e', secondary: '#8b6914', accent: '#c49a6c', background: '#f5f0e8', surface: '#faf7f0', text: '#2d4a3e', textMuted: '#6b8f7e', border: '#c49a6c' },
    typography: { headlineFont: 'Cormorant Garamond', bodyFont: 'EB Garamond', accentFont: 'Playfair Display', headlineWeight: '600', letterSpacing: 0.5, textTransform: 'none' },
    keywords: ['art nouveau', 'nouveau', 'mucha', 'floral', 'organic curves', 'whiplash', 'botanical', 'ornamental', 'flowing lines'],
  }),

  baroque: style({
    id: 'baroque', name: 'Baroque', category: 'classical', era: '17th–18th Century', icon: '👑',
    tagline: 'Dramatic opulence and theatrical grandeur',
    description: 'Swirling ornamentation, intense contrasts, lavish details, and theatrical drama. Originally a Catholic Counter-Reformation power move to inspire awe.',
    badge: 'THEATRICAL OPULENCE',
    mood: ['regal', 'ornate', 'celebratory', 'dramatic'],
    bestFor: ['event invitations', 'premium packaging', 'lavish editorial', 'luxury branding'],
    palette: { primary: '#1a0a2e', secondary: '#8b1a1a', accent: '#d4af37', background: '#0a0515', surface: '#1a0a2e', text: '#f5f0e1', textMuted: '#a08890', border: '#d4af37' },
    typography: { headlineFont: 'Playfair Display', bodyFont: 'Cormorant', accentFont: 'Cinzel Decorative', headlineWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['baroque', 'ornate', 'dramatic', 'theatrical', 'gold leaf', 'flourishes', 'counter-reformation', 'grandeur'],
  }),

  victorian: style({
    id: 'victorian', name: 'Victorian', category: 'classical', era: '1837–1901', icon: '🏛️',
    tagline: 'Ornate detail and gilded craftsmanship',
    description: 'Rich colors, intricate details, elaborate floral motifs, ornate serif fonts, damask patterns, and maximalist ornamentation from the British monarchy era.',
    badge: 'GILDED CRAFT',
    mood: ['opulent', 'historical', 'romantic', 'ornate'],
    bestFor: ['vintage branding', 'event invitations', 'book covers', 'tea brands', 'steampunk'],
    palette: { primary: '#2c1810', secondary: '#8b4513', accent: '#d4af37', background: '#f5ebe0', surface: '#faf5ee', text: '#2c1810', textMuted: '#8b7355', border: '#d4af37' },
    typography: { headlineFont: 'Playfair Display', bodyFont: 'Libre Baskerville', accentFont: 'Cinzel', headlineWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['victorian', 'ornate', 'gilded', 'damask', 'floral motifs', 'elaborate', '19th century', 'british monarchy'],
  }),

  neoclassical: style({
    id: 'neoclassical', name: 'Neoclassical', category: 'classical', era: '18th–19th Century', icon: '🏛️',
    tagline: 'Classical order with restrained grandeur',
    description: 'Greco-Roman ideals of symmetry, order, and elegance. Strategic red accents against muted classical palettes. Structure and reason over ornamentation.',
    badge: 'TIMELESS ORDER',
    mood: ['formal', 'timeless', 'noble', 'dignified'],
    bestFor: ['luxury brands', 'museums', 'academic publications', 'formal print'],
    palette: { primary: '#1a1a1a', secondary: '#8b0000', accent: '#d4af37', background: '#f5f0e8', surface: '#faf7f0', text: '#1a1a1a', textMuted: '#6b6b6b', border: '#c0b090' },
    typography: { headlineFont: 'Cinzel', bodyFont: 'Cormorant Garamond', accentFont: 'Cinzel', headlineWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
    keywords: ['neoclassical', 'classical', 'grecian', 'roman', 'columns', 'laurel', 'marble', 'symmetry', 'antiquity'],
  }),

  chinoiserie: style({
    id: 'chinoiserie', name: 'Chinoiserie', category: 'classical', era: '17th–18th Century', icon: '🐉',
    tagline: 'East Asian motifs through a Western ornamental lens',
    description: 'Intricate patterns featuring cranes, peonies, bamboo, pagodas, and lattice frames. Porcelain-inspired blue-and-white palettes with craft-forward texture.',
    badge: 'PORCELAIN LUXURY',
    mood: ['elegant', 'curated', 'heritage', 'craft'],
    bestFor: ['wallpaper', 'textiles', 'premium packaging', 'ceramics-inspired graphics'],
    palette: { primary: '#1a3a5c', secondary: '#c49a6c', accent: '#d4af37', background: '#f5f0e8', surface: '#ffffff', text: '#1a3a5c', textMuted: '#6b8f9e', border: '#c49a6c' },
    typography: { headlineFont: 'Cormorant', bodyFont: 'EB Garamond', accentFont: 'Cinzel', headlineWeight: '600', letterSpacing: 1, textTransform: 'none' },
    keywords: ['chinoiserie', 'chinese', 'east asian', 'pagoda', 'peony', 'crane', 'bamboo', 'porcelain', 'lattice'],
  }),

  filigree: style({
    id: 'filigree', name: 'Filigree', category: 'classical', era: '17th–18th Century', icon: '✨',
    tagline: 'Intricate lacy metalwork patterns',
    description: 'Delicate ornamentation inspired by vintage jewelry and historical architecture. Lavish swirls, flourishes, and fine details that convey elegance.',
    badge: 'DELICATE LUXURY',
    mood: ['luxurious', 'vintage', 'ceremonial', 'intricate'],
    bestFor: ['premium packaging', 'wedding invitations', 'heritage branding'],
    palette: { primary: '#1a1a2e', secondary: '#c9a84c', accent: '#e8d5a3', background: '#f5f0e8', surface: '#faf7f0', text: '#1a1a2e', textMuted: '#8b7355', border: '#c9a84c' },
    typography: { headlineFont: 'Cormorant', bodyFont: 'EB Garamond', accentFont: 'Cinzel Decorative', headlineWeight: '600', letterSpacing: 1, textTransform: 'none' },
    keywords: ['filigree', 'lacy', 'metalwork', 'intricate', 'ornate', 'swirls', 'flourishes', 'jewelry'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // MODERNIST & FUNCTIONAL
  // ═══════════════════════════════════════════════════════════════════

  bauhaus: style({
    id: 'bauhaus', name: 'Bauhaus', category: 'modernist', era: '1919–1933', icon: '📐',
    tagline: 'Form follows function with radical primary geometry',
    description: 'Founded by Walter Gropius. Pure red, yellow, blue, and black. Asymmetric balance, geometric clarity, and the unity of art and craft.',
    badge: 'FORM FOLLOWS FUNCTION',
    mood: ['rational', 'structured', 'modern', 'functional'],
    bestFor: ['typography', 'product design', 'branding', 'architecture', 'UI design'],
    palette: { primary: '#e52421', secondary: '#004586', accent: '#f4c300', background: '#f4f1ea', surface: '#ffffff', text: '#111111', textMuted: '#444444', border: '#111111' },
    typography: { headlineFont: 'Space Grotesk', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: 0, textTransform: 'uppercase' },
    keywords: ['bauhaus', 'gropius', 'herbert bayer', 'weimar', 'constructivist', 'primary color', 'form follows function'],
  }),

  swissStyle: style({
    id: 'swissStyle', name: 'Swiss / International', category: 'modernist', era: '1950s', icon: '🇨🇭',
    tagline: 'Mathematical grids and objective clarity',
    description: 'Strict grid systems, Helvetica, objective photography, asymmetric layouts, and generous white space. The most influential design movement of the 20th century.',
    badge: 'PRECISION CLARITY',
    mood: ['objective', 'precise', 'trustworthy', 'clear'],
    bestFor: ['corporate identity', 'editorial design', 'wayfinding', 'web layouts'],
    palette: { primary: '#ff0000', secondary: '#000000', accent: '#ffffff', background: '#ffffff', surface: '#f8f8f8', text: '#000000', textMuted: '#666666', border: '#e0e0e0' },
    typography: { headlineFont: 'Inter', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'uppercase' },
    keywords: ['swiss', 'swiss style', 'international typographic', 'helvetica', 'grid layout', 'muller-brockmann', 'rational'],
  }),

  minimalism: style({
    id: 'minimalism', name: 'Minimalism', category: 'modernist', era: '1960s–Present', icon: '🕊️',
    tagline: 'As little design as possible — Dieter Rams',
    description: 'Extreme negative space, restrained neutral monochrome, exquisite typography, and absolute focus on essential message.',
    badge: 'LESS BUT BETTER',
    mood: ['elegant', 'clear', 'modern', 'sophisticated'],
    bestFor: ['tech', 'consulting', 'healthcare', 'SaaS', 'corporate branding'],
    palette: { primary: '#18181b', secondary: '#71717a', accent: '#a1a1aa', background: '#fafafa', surface: '#ffffff', text: '#18181b', textMuted: '#71717a', border: '#e4e4e7' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['minimal', 'minimalist', 'minimalism', 'clean', 'simple', 'whitespace', 'dieter rams', 'uncluttered'],
  }),

  modernism: style({
    id: 'modernism', name: 'Modernism', category: 'modernist', era: 'Early 20th Century', icon: '🏛️',
    tagline: 'Abstraction, simplicity, and geometric clarity',
    description: 'Sans-serif typography, geometric shapes, minimalist grid systems, and contrasting colors. Breaking away from ornamental traditions.',
    badge: 'MODERNIST GRID',
    mood: ['clean', 'progressive', 'structured', 'bold'],
    bestFor: ['branding', 'editorial', 'architecture', 'product design'],
    palette: { primary: '#0f172a', secondary: '#2563eb', accent: '#f59e0b', background: '#f8fafc', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', border: '#cbd5e1' },
    typography: { headlineFont: 'Outfit', bodyFont: 'Inter', accentFont: 'Space Grotesk', headlineWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase' },
    keywords: ['modernism', 'modernist', 'mid-century modern', 'paul rand', 'ibm', 'geometric modern'],
  }),

  flat: style({
    id: 'flat', name: 'Flat Design', category: 'modernist', era: '2010s–Present', icon: '📱',
    tagline: 'Clean 2D clarity for digital-first interfaces',
    description: 'No shadows, no gradients, no textures. Simple 2D elements, bold colors, clean typography. The language of modern digital interfaces.',
    badge: 'FUNCTIONAL CLARITY',
    mood: ['clean', 'modern', 'efficient', 'accessible'],
    bestFor: ['mobile apps', 'UI/UX design', 'web interfaces', 'icons'],
    palette: { primary: '#0078d4', secondary: '#107c10', accent: '#ffb900', background: '#ffffff', surface: '#f3f2f1', text: '#323130', textMuted: '#605e5c', border: '#edebe9' },
    typography: { headlineFont: 'Inter', bodyFont: 'Inter', accentFont: 'Inter', headlineWeight: '600', letterSpacing: -0.3, textTransform: 'none' },
    keywords: ['flat', 'flat design', 'material design', 'ios', 'app style', 'clean 2d', 'vector flat'],
  }),

  geometric: style({
    id: 'geometric', name: 'Geometric', category: 'modernist', era: 'Contemporary', icon: '🔷',
    tagline: 'Mathematical precision and logical innovation',
    description: 'Order, symmetry, clean edges, and mathematical precision. Creates a sense of logic and innovation through structured shapes.',
    badge: 'PRECISION ENGINEERED',
    mood: ['logical', 'innovative', 'modern', 'structured'],
    bestFor: ['fintech', 'engineering', 'AI', 'data-driven companies'],
    palette: { primary: '#1a1a2e', secondary: '#4361ee', accent: '#f72585', background: '#f8f9fa', surface: '#ffffff', text: '#1a1a2e', textMuted: '#6c757d', border: '#dee2e6' },
    typography: { headlineFont: 'Space Grotesk', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'uppercase' },
    keywords: ['geometric', 'geometry', 'shapes', 'angular', 'precision', 'mathematical', 'structured'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // RETRO & NOSTALGIC
  // ═══════════════════════════════════════════════════════════════════

  retroVintage: style({
    id: 'retroVintage', name: 'Retro Vintage', category: 'retro', era: '1980s–1990s', icon: '📻',
    tagline: 'Grainy nostalgia with bold geometric energy',
    description: 'Grainy textures, geometric shapes, bold typography, and refined color palettes drawing from 80s-90s aesthetics.',
    badge: 'ANALOG WARMTH',
    mood: ['nostalgic', 'warm', 'familiar', 'geometric'],
    bestFor: ['branding', 'advertisement', 'packaging', 'social media'],
    palette: { primary: '#2d1b69', secondary: '#e85d04', accent: '#faa307', background: '#fefae0', surface: '#ffffff', text: '#2d1b69', textMuted: '#6b5b95', border: '#dda15e' },
    typography: { headlineFont: 'Righteous', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
    keywords: ['retro', 'vintage', '80s', '90s', 'grainy', 'nostalgic', 'throwback', 'analog'],
  }),

  memphis: style({
    id: 'memphis', name: 'Memphis', category: 'retro', era: '1980s', icon: '🔺',
    tagline: 'Loud geometric shapes and playful postmodern chaos',
    description: 'Bold geometric shapes, clashing colors, squiggles, and playful patterns. Founded by the Memphis Group (Ettore Sottsass) as a rebellion against minimalism.',
    badge: 'POSTMODERN POP',
    mood: ['youthful', 'quirky', 'anti-establishment', 'fun'],
    bestFor: ['creative brands', 'event posters', 'retro fashion', 'packaging'],
    palette: { primary: '#ff6b6b', secondary: '#4ecdc4', accent: '#ffe66d', background: '#f7fff7', surface: '#ffffff', text: '#2c2c54', textMuted: '#706fd3', border: '#ff6b6b' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
    keywords: ['memphis', 'memphis group', 'sottsass', '80s', 'squiggles', 'confetti', 'geometric pop', 'postmodern'],
  }),

  y2k: style({
    id: 'y2k', name: 'Y2K', category: 'retro', era: '1999–2000s', icon: '💿',
    tagline: 'Chrome, neon, and millennial tech nostalgia',
    description: 'Chrome/metallic finishes, neon gradients, tech UI overlays, bubble typography, grunge meets gloss, holographic accents. The aesthetic of the millennium.',
    badge: 'MILLENNIUM GLOSS',
    mood: ['futuristic', 'nostalgic', 'edgy', 'playful'],
    bestFor: ['fashion branding', 'tech revival', 'throwback interfaces', 'social media'],
    palette: { primary: '#ff69b4', secondary: '#00d4ff', accent: '#c084fc', background: '#0a0a1a', surface: '#1a1a2e', text: '#ffffff', textMuted: '#a78bfa', border: '#ff69b4' },
    typography: { headlineFont: 'Outfit', bodyFont: 'Inter', accentFont: 'Space Grotesk', headlineWeight: '800', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['y2k', 'year 2000', 'millennium', 'chrome', 'metallic', 'holographic', 'bubble', 'cyber', 'retro futuristic'],
  }),

  synthwave: style({
    id: 'synthwave', name: 'Synthwave', category: 'retro', era: '1980s Revival', icon: '🌆',
    tagline: 'Neon grids and retro-futuristic sunsets',
    description: 'Grid horizons, VHS textures, neon gradients, 3D chrome type, purple/cyan palettes. The romanticized 80s future that never was.',
    badge: 'NEON DREAMS',
    mood: ['retro-futuristic', 'vibrant', 'dreamy', 'electric'],
    bestFor: ['music visuals', 'arcade interfaces', 'gaming', 'event posters'],
    palette: { primary: '#0d0221', secondary: '#ff2975', accent: '#01cdfe', background: '#0d0221', surface: '#1a0a3e', text: '#ffffff', textMuted: '#b967ff', border: '#ff2975' },
    typography: { headlineFont: 'Orbitron', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    keywords: ['synthwave', 'retrowave', 'outrun', '80s', 'neon', 'grid', 'sunset', 'vhs', 'chrome'],
  }),

  vaporwave: style({
    id: 'vaporwave', name: 'Vaporwave', category: 'retro', era: '2010s', icon: '🗽',
    tagline: 'Surreal 80s/90s nostalgia and consumer critique',
    description: 'Pastel pinks/purples, VHS glitch, Greek busts, Japanese text, lo-fi textures. A satirical mashup of consumer culture and digital dreams.',
    badge: 'DIGITAL DREAMS',
    mood: ['ironic', 'dreamy', 'nostalgic', 'surreal'],
    bestFor: ['indie music', 'visual art', 'experimental design', 'album covers'],
    palette: { primary: '#ff71ce', secondary: '#01cdfe', accent: '#05ffa1', background: '#1a0a2e', surface: '#2d1b4e', text: '#ff71ce', textMuted: '#b967ff', border: '#01cdfe' },
    typography: { headlineFont: 'Space Grotesk', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'none' },
    keywords: ['vaporwave', 'aesthetic', 'vhs', 'glitch', 'greek bust', 'japanese', 'pastel', 'surreal', 'lo-fi'],
  }),

  popArt: style({
    id: 'popArt', name: 'Pop Art', category: 'retro', era: '1950s–1960s', icon: '🎨',
    tagline: 'Bold mass-culture imagery with comic-book energy',
    description: 'Ben-Day dots, bold outlines, primary colors, comic-style elements. Blurring the line between commercial art and fine art.',
    badge: 'POP CULTURE POP',
    mood: ['loud', 'fun', 'energetic', 'eye-catching'],
    bestFor: ['pop culture campaigns', 'retail packaging', 'fashion visuals', 'posters'],
    palette: { primary: '#ff0000', secondary: '#0000ff', accent: '#ffff00', background: '#ffffff', surface: '#ffffff', text: '#000000', textMuted: '#333333', border: '#000000' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
    keywords: ['pop art', 'warhol', 'lichtenstein', 'comic', 'ben-day', 'halftone', 'campbell', 'dots'],
  }),

  steampunk: style({
    id: 'steampunk', name: 'Steampunk', category: 'retro', era: 'Victorian + Sci-Fi', icon: '⚙️',
    tagline: 'Victorian aesthetics meet steam-powered fantasy',
    description: 'Gears, cogs, brass machinery, leather straps, exposed mechanisms. Victorian-era technology reimagined through a speculative lens.',
    badge: 'STEAM & BRASS',
    mood: ['adventurous', 'vintage-futuristic', 'imaginative', 'mechanical'],
    bestFor: ['book covers', 'fantasy branding', 'posters', 'games', 'merchandise'],
    palette: { primary: '#3e2723', secondary: '#795548', accent: '#d4af37', background: '#1a0f0a', surface: '#2c1810', text: '#f5e6d3', textMuted: '#a1887f', border: '#d4af37' },
    typography: { headlineFont: 'Cinzel', bodyFont: 'Cormorant', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['steampunk', 'gears', 'brass', 'victorian', 'steam', 'cogs', 'mechanical', 'clockwork'],
  }),

  midCentury: style({
    id: 'midCentury', name: 'Mid-Century', category: 'retro', era: '1940s–1960s', icon: '🪑',
    tagline: 'Organic simplicity and modern optimism',
    description: 'Clean lines, retro colors, boomerangs, mod patterns. Form, function, and organic simplicity with warm textures and modern optimism.',
    badge: 'ATOMIC AGE',
    mood: ['nostalgic', 'modernist', 'optimistic', 'warm'],
    bestFor: ['furniture branding', 'lifestyle blogs', 'editorial layouts', 'restaurant branding'],
    palette: { primary: '#e85d26', secondary: '#2d6a4f', accent: '#f4a261', background: '#fefae0', surface: '#ffffff', text: '#264653', textMuted: '#6b705c', border: '#dda15e' },
    typography: { headlineFont: 'Righteous', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'none' },
    keywords: ['mid-century', 'midcentury', 'retro', 'atomic', 'eames', 'mod', 'boomerang', '60s'],
  }),

  rocketpunk: style({
    id: 'rocketpunk', name: 'Rocketpunk', category: 'retro', era: '1950s Retrofuturism', icon: '🚀',
    tagline: 'The future as the 1950s imagined it',
    description: 'Rockets, ray guns, atomic symbols, mid-century curves, bold signage typography. Optimistic, sleek, and proudly science-forward.',
    badge: 'SPACE AGE',
    mood: ['optimistic', 'sleek', 'playful', 'science-forward'],
    bestFor: ['posters', 'merch', 'sci-fi branding', 'retro illustrations', 'event graphics'],
    palette: { primary: '#ff6b35', secondary: '#004e89', accent: '#ffd166', background: '#f0f4f8', surface: '#ffffff', text: '#1a1a2e', textMuted: '#6c757d', border: '#ff6b35' },
    typography: { headlineFont: 'Orbitron', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['rocketpunk', 'atomic age', 'retrofuturism', 'space age', 'rockets', '1950s', 'ray gun'],
  }),

  pixelArt: style({
    id: 'pixelArt', name: 'Pixel Art', category: 'retro', era: '1970s–Present', icon: '👾',
    tagline: 'Blocky 8-bit charm and gaming nostalgia',
    description: 'Grid-based visuals, limited color palettes, 8-bit/16-bit aesthetics. Born from technical limitations, now a beloved art form.',
    badge: '8-BIT CHARM',
    mood: ['nostalgic', 'geeky', 'fun', 'retro'],
    bestFor: ['indie games', 'retro events', 'creative portfolios', 'social media'],
    palette: { primary: '#0f380f', secondary: '#306230', accent: '#8bac0f', background: '#9bbc0f', surface: '#e0f8cf', text: '#0f380f', textMuted: '#306230', border: '#0f380f' },
    typography: { headlineFont: 'Space Mono', bodyFont: 'Space Mono', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
    keywords: ['pixel art', '8-bit', '16-bit', 'bitmap', 'retro gaming', 'nintendo', 'minecraft', 'voxel'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // RAW & REBELLIOUS
  // ═══════════════════════════════════════════════════════════════════

  brutalism: style({
    id: 'brutalism', name: 'Brutalism', category: 'raw', era: '2010s Revival', icon: '🏗️',
    tagline: 'Raw, bold, and purposefully unrefined',
    description: 'Stark layouts, monochrome palettes, unrefined typography, monospaced fonts. Intentionally breaking conventions to make a bold statement.',
    badge: 'RAW CONCRETE',
    mood: ['bold', 'disruptive', 'honest', 'rebellious'],
    bestFor: ['artist portfolios', 'experimental interfaces', 'counterculture brands', 'streetwear'],
    palette: { primary: '#000000', secondary: '#ffffff', accent: '#ff0000', background: '#f5f5f5', surface: '#ffffff', text: '#000000', textMuted: '#555555', border: '#000000' },
    typography: { headlineFont: 'Space Mono', bodyFont: 'Space Mono', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
    keywords: ['brutalist', 'brutalism', 'raw', 'monochrome', 'anti-design', 'industrial', 'neobrutalism'],
  }),

  punkGrunge: style({
    id: 'punkGrunge', name: 'Punk Grunge', category: 'raw', era: '1980s–1990s', icon: '🎸',
    tagline: 'Raw texture and rebellious authenticity',
    description: 'Rough textures, muted earth tones, handwritten typography, distorted imagery. DIY aesthetic from the Seattle music scene.',
    badge: 'DIY RAW',
    mood: ['edgy', 'raw', 'authentic', 'rebellious'],
    bestFor: ['music industry', 'fashion', 'band merchandise', 'alternative branding'],
    palette: { primary: '#1a1a1a', secondary: '#8b0000', accent: '#daa520', background: '#2d2d2d', surface: '#3d3d3d', text: '#e0e0e0', textMuted: '#999999', border: '#555555' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
    keywords: ['punk', 'grunge', 'distressed', 'raw', 'diy', 'seattle', 'flannel', 'noise', 'torn'],
  }),

  graffiti: style({
    id: 'graffiti', name: 'Graffiti', category: 'raw', era: '1960s–Present', icon: '🖌️',
    tagline: 'Urban street art with spray-paint energy',
    description: 'Spray paint textures, dripping letters, concrete backgrounds, vivid colors, freestyle typography. Rooted in hip hop culture and protest.',
    badge: 'STREET VOICE',
    mood: ['urban', 'defiant', 'expressive', 'energetic'],
    bestFor: ['streetwear', 'music festivals', 'youth campaigns', 'urban branding'],
    palette: { primary: '#ff6b00', secondary: '#00d4ff', accent: '#ff00ff', background: '#1a1a1a', surface: '#2d2d2d', text: '#ffffff', textMuted: '#aaaaaa', border: '#ff6b00' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
    keywords: ['graffiti', 'street art', 'spray paint', 'urban', 'tagging', 'mural', 'hip hop', 'concrete'],
  }),

  kitsch: style({
    id: 'kitsch', name: 'Kitsch', category: 'raw', era: 'Mid-20th Century', icon: '🌈',
    tagline: 'Embracing bad taste as an art form',
    description: 'Bright colors, exaggerated imagery, playful pop culture references, irony and nostalgia. Turning tackiness into intentional design.',
    badge: 'IRONIC EXCESS',
    mood: ['campy', 'fun', 'ironic', 'playful'],
    bestFor: ['novelty products', 'sticker designs', 'satirical branding', 'retro ads'],
    palette: { primary: '#ff1493', secondary: '#00ff00', accent: '#ffff00', background: '#ff69b4', surface: '#ffffff', text: '#000000', textMuted: '#333333', border: '#ff1493' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
    keywords: ['kitsch', 'camp', 'tacky', 'ironic', 'retro', 'exaggerated', 'pop culture', 'bad taste'],
  }),

  antiDesign: style({
    id: 'antiDesign', name: 'Anti-Design', category: 'raw', era: 'Contemporary', icon: '🚫',
    tagline: 'Breaking every rule with intentional chaos',
    description: 'Multiple clashing fonts, altered spacing, sideways composition, organized chaos. Intentionally breaking conventions to create something unique.',
    badge: 'RULE BREAKER',
    mood: ['disruptive', 'creative', 'chaotic', 'bold'],
    bestFor: ['creative agencies', 'art galleries', 'events', 'experimental brands'],
    palette: { primary: '#ff0000', secondary: '#00ff00', accent: '#0000ff', background: '#ffff00', surface: '#ff00ff', text: '#000000', textMuted: '#666666', border: '#000000' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Space Mono', accentFont: 'Playfair Display', headlineWeight: '900', letterSpacing: -2, textTransform: 'uppercase' },
    keywords: ['anti-design', 'chaos', 'clash', 'unconventional', 'rule-breaking', 'experimental', 'deconstructed'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // DARK & DRAMATIC
  // ═══════════════════════════════════════════════════════════════════

  gothic: style({
    id: 'gothic', name: 'Gothic', category: 'dark', era: '12th Century–Present', icon: '🦇',
    tagline: 'Dark grandeur and medieval mystery',
    description: 'Dramatic contrast between darkness and grandeur, pointed arches, blackletter fonts, stained glass textures, ornate lettering.',
    badge: 'DARK MAJESTY',
    mood: ['dark', 'dramatic', 'mysterious', 'historic'],
    bestFor: ['fantasy book covers', 'music posters', 'alternative fashion', 'band merch'],
    palette: { primary: '#0a0a0a', secondary: '#4a0e4e', accent: '#8b0000', background: '#0a0a0a', surface: '#1a1a1a', text: '#e0d0d0', textMuted: '#808080', border: '#4a0e4e' },
    typography: { headlineFont: 'Cinzel', bodyFont: 'Cormorant', accentFont: 'Cinzel Decorative', headlineWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['gothic', 'goth', 'dark', 'medieval', 'blackletter', 'stained glass', 'pointed arch', 'mysterious'],
  }),

  tenebrism: style({
    id: 'tenebrism', name: 'Tenebrism', category: 'dark', era: 'Baroque Era', icon: '🕯️',
    tagline: 'Extreme light-dark drama from Caravaggio',
    description: 'Extreme contrast between light and dark, dramatic spotlight effect, theatrical intensity. Named after the Baroque painting technique.',
    badge: 'CHIAROSCURO',
    mood: ['intense', 'emotional', 'moody', 'theatrical'],
    bestFor: ['atmospheric posters', 'event flyers', 'editorial', 'cinematic design'],
    palette: { primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#f5deb3', background: '#000000', surface: '#0a0a0a', text: '#f5deb3', textMuted: '#8b7355', border: '#333333' },
    typography: { headlineFont: 'Playfair Display', bodyFont: 'Cormorant', accentFont: 'Cinzel', headlineWeight: '900', letterSpacing: 0, textTransform: 'none' },
    keywords: ['tenebrism', 'chiaroscuro', 'dramatic lighting', 'caravaggio', 'spotlight', 'dark', 'baroque', 'oil painting'],
  }),

  cybercore: style({
    id: 'cybercore', name: 'Cybercore', category: 'dark', era: '1980s–Present', icon: '💻',
    tagline: 'High-tech hacker aesthetics and neon dystopia',
    description: 'Neon lights, glitch effects, code patterns, green/black themes, circuit board motifs, metallic finishes. The aesthetic of the digital underground.',
    badge: 'DIGITAL UNDERGROUND',
    mood: ['futuristic', 'chaotic', 'dystopian', 'high-tech'],
    bestFor: ['tech events', 'gaming visuals', 'hacking culture', 'cybersecurity brands'],
    palette: { primary: '#00ff41', secondary: '#0a0a0a', accent: '#ff00ff', background: '#0a0a0a', surface: '#0f1a0f', text: '#00ff41', textMuted: '#008f11', border: '#00ff41' },
    typography: { headlineFont: 'Space Mono', bodyFont: 'Space Mono', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
    keywords: ['cybercore', 'cyber', 'hacker', 'matrix', 'glitch', 'neon', 'code', 'terminal', 'cyberpunk'],
  }),

  neonNoir: style({
    id: 'neonNoir', name: 'Neon-Noir', category: 'dark', era: 'Contemporary', icon: '🌃',
    tagline: 'Cinematic neon against gritty darkness',
    description: 'Red-and-black palettes with neon highlights, blurred motion effects, gritty high-contrast photography, oversized bold typography.',
    badge: 'NEON SHADOW',
    mood: ['bold', 'edgy', 'cinematic', 'urgent'],
    bestFor: ['cybersecurity', 'gaming', 'developer tools', 'conference design'],
    palette: { primary: '#0a0a0a', secondary: '#ff0040', accent: '#00f0ff', background: '#0a0a0a', surface: '#1a1a1a', text: '#ffffff', textMuted: '#888888', border: '#ff0040' },
    typography: { headlineFont: 'Orbitron', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['neon noir', 'noir', 'neon', 'cinematic', 'dark', 'red black', 'cyberpunk', 'night city'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // ORGANIC & NATURAL
  // ═══════════════════════════════════════════════════════════════════

  biomorphic: style({
    id: 'biomorphic', name: 'Biomorphic', category: 'organic', era: 'Contemporary', icon: '🧬',
    tagline: 'Soft organic forms inspired by nature',
    description: 'Fluid shapes inspired by cells, anatomy, water, and growth patterns. Calm, futuristic, and warm without being playful.',
    badge: 'ORGANIC FLOW',
    mood: ['fluid', 'calm', 'futuristic', 'warm'],
    bestFor: ['branding', 'posters', 'product imagery', 'digital design'],
    palette: { primary: '#2d6a4f', secondary: '#40916c', accent: '#95d5b2', background: '#f8f9fa', surface: '#ffffff', text: '#1b4332', textMuted: '#6b9f80', border: '#95d5b2' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '600', letterSpacing: -0.3, textTransform: 'none' },
    keywords: ['biomorphic', 'organic', 'fluid', 'nature', 'cells', 'wave', 'blob', 'soft shapes'],
  }),

  bohemian: style({
    id: 'bohemian', name: 'Bohemian (Boho)', category: 'organic', era: '1960s–Present', icon: '🌻',
    tagline: 'Free-spirited global eclecticism',
    description: 'Global influences, layered textures, earthy yet vibrant palettes, mandalas, ethnic prints, script fonts. Laid-back wanderlust energy.',
    badge: 'FREE SPIRIT',
    mood: ['free', 'soulful', 'eclectic', 'wanderlust'],
    bestFor: ['handmade products', 'travel brands', 'artisanal markets', 'lifestyle'],
    palette: { primary: '#8b4513', secondary: '#daa520', accent: '#cd853f', background: '#faf0e6', surface: '#ffffff', text: '#3e2723', textMuted: '#8b7355', border: '#daa520' },
    typography: { headlineFont: 'Cormorant', bodyFont: 'Inter', accentFont: 'Cormorant', headlineWeight: '600', letterSpacing: 0, textTransform: 'none' },
    keywords: ['bohemian', 'boho', 'hippie', 'free spirit', 'mandala', 'earthy', 'eclectic', 'wanderlust'],
  }),

  japandi: style({
    id: 'japandi', name: 'Japandi', category: 'organic', era: '2020s', icon: '🎋',
    tagline: 'Japanese minimalism meets Scandinavian warmth',
    description: 'Light woods, beige/gray palettes, clean sans-serif fonts, natural materials. The perfect fusion of simplicity and warmth.',
    badge: 'SERENE FUSION',
    mood: ['calm', 'peaceful', 'intentional', 'serene'],
    bestFor: ['lifestyle brands', 'home decor', 'wellness apps', 'minimal websites'],
    palette: { primary: '#3d3d3d', secondary: '#8b7355', accent: '#c4a882', background: '#f5f0eb', surface: '#faf7f2', text: '#3d3d3d', textMuted: '#8b8b8b', border: '#d4c5b0' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '500', letterSpacing: -0.3, textTransform: 'none' },
    keywords: ['japandi', 'japanese', 'scandinavian', 'minimal', 'natural', 'wood', 'serene', 'wabi sabi'],
  }),

  cottagecore: style({
    id: 'cottagecore', name: 'Cottagecore', category: 'organic', era: '2010s–Present', icon: '🏡',
    tagline: 'Romanticized rural simplicity',
    description: 'Florals, gingham, wood textures, antique finishes, serif/hand-drawn type. A romanticization of countryside living and slow life.',
    badge: 'COUNTRYSIDE CHARM',
    mood: ['cozy', 'nostalgic', 'wholesome', 'warm'],
    bestFor: ['home décor', 'boutique fashion', 'nature books', 'lifestyle blogs'],
    palette: { primary: '#556b2f', secondary: '#8fbc8f', accent: '#deb887', background: '#faf8f0', surface: '#ffffff', text: '#3e4a2e', textMuted: '#8b8b6b', border: '#deb887' },
    typography: { headlineFont: 'Cormorant', bodyFont: 'Inter', accentFont: 'Cormorant', headlineWeight: '600', letterSpacing: 0, textTransform: 'none' },
    keywords: ['cottagecore', 'farmhouse', 'countryside', 'floral', 'rustic', 'cozy', 'vintage', 'pastoral'],
  }),

  mysticalWestern: style({
    id: 'mysticalWestern', name: 'Mystical Western', category: 'organic', era: '2010s', icon: '🌵',
    tagline: 'Desert mysticism meets cowboy grit',
    description: 'Cowboy aesthetics fused with celestial/spiritual imagery. Desert landscapes, moonlit nights, cosmic symbols, tarot, leather textures.',
    badge: 'DESERT MYSTIC',
    mood: ['mystical', 'rugged', 'folklore-driven', 'spiritual'],
    bestFor: ['crystal shops', 'tarot apps', 'music visuals', 'indie apparel', 'festivals'],
    palette: { primary: '#8b4513', secondary: '#daa520', accent: '#c0392b', background: '#1a0f0a', surface: '#2c1810', text: '#f5e6d3', textMuted: '#a1887f', border: '#daa520' },
    typography: { headlineFont: 'Cinzel', bodyFont: 'Cormorant', accentFont: 'Cinzel', headlineWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['western', 'mystical', 'desert', 'cowboy', 'tarot', 'celestial', 'spiritual', 'frontier'],
  }),

  wabiSabi: style({
    id: 'wabiSabi', name: 'Wabi-Sabi', category: 'organic', era: 'Japanese Philosophy', icon: '🍵',
    tagline: 'Finding beauty in imperfection',
    description: 'Embracing imperfection and impermanence. Natural textures, asymmetry, subtle beauty, earthy tones, rough pottery textures.',
    badge: 'IMPERFECT BEAUTY',
    mood: ['humble', 'calm', 'contemplative', 'authentic'],
    bestFor: ['wellness brands', 'tea packaging', 'mindful interfaces', 'artisan products'],
    palette: { primary: '#4a4a4a', secondary: '#8b7355', accent: '#a08060', background: '#f0ebe3', surface: '#f8f5ef', text: '#4a4a4a', textMuted: '#8b8b8b', border: '#c0b090' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '500', letterSpacing: -0.3, textTransform: 'none' },
    keywords: ['wabi sabi', 'imperfect', 'natural', 'organic', 'rough', 'handmade', 'authentic', 'minimalist'],
  }),

  nautical: style({
    id: 'nautical', name: 'Nautical', category: 'organic', era: 'Timeless', icon: '⚓',
    tagline: 'Maritime freshness and coastal order',
    description: 'Navy and white, anchors, ropes, stripes, brass, serif/stencil fonts. The clean order of coastal living.',
    badge: 'MARITIME',
    mood: ['fresh', 'structured', 'maritime', 'trustworthy'],
    bestFor: ['seafood brands', 'beach resorts', 'summer campaigns', 'sailing'],
    palette: { primary: '#001f3f', secondary: '#0074d9', accent: '#ff851b', background: '#f0f8ff', surface: '#ffffff', text: '#001f3f', textMuted: '#6688aa', border: '#0074d9' },
    typography: { headlineFont: 'Outfit', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['nautical', 'maritime', 'sea', 'anchor', 'navy', 'coastal', 'sailing', 'ocean'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // CUTE & PLAYFUL
  // ═══════════════════════════════════════════════════════════════════

  kawaii: style({
    id: 'kawaii', name: 'Kawaii', category: 'playful', era: '1970s–Present', icon: '🌸',
    tagline: 'Japanese cuteness with rounded charm',
    description: 'Rounded shapes, pastel colors, cartoon-like characters, blushing cheeks, handwritten type. The culture of cute.',
    badge: 'CUTE CULTURE',
    mood: ['sweet', 'innocent', 'joyful', 'cheerful'],
    bestFor: ['product design', 'character branding', 'toy packaging', 'social media'],
    palette: { primary: '#ff69b4', secondary: '#87ceeb', accent: '#ffb6c1', background: '#fff0f5', surface: '#ffffff', text: '#d63384', textMuted: '#c08090', border: '#ffb6c1' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'none' },
    keywords: ['kawaii', 'cute', 'japanese', 'pastel', 'chibi', 'adorable', 'kawaii', 'pink'],
  }),

  coquette: style({
    id: 'coquette', name: 'Coquette', category: 'playful', era: 'Contemporary', icon: '🎀',
    tagline: 'Ultra-feminine flirty vintage romance',
    description: 'Baby pinks, pearls, ribbon motifs, dainty serif fonts, heart shapes, lace, bows, soft filters. Sweet, intimate, and personal.',
    badge: 'ROMANTIC FLIRT',
    mood: ['delicate', 'girly', 'nostalgic', 'romantic'],
    bestFor: ['beauty brands', 'fashion', 'romantic lifestyle', 'wedding'],
    palette: { primary: '#d4a0a0', secondary: '#f5c6d0', accent: '#e8b4b8', background: '#fff5f7', surface: '#ffffff', text: '#8b5e6b', textMuted: '#c0a0a8', border: '#f5c6d0' },
    typography: { headlineFont: 'Cormorant', bodyFont: 'Inter', accentFont: 'Cormorant', headlineWeight: '600', letterSpacing: 0, textTransform: 'none' },
    keywords: ['coquette', 'feminine', 'flirty', 'bow', 'lace', 'ribbon', 'romantic', 'girly', 'dainty'],
  }),

  kidcore: style({
    id: 'kidcore', name: 'Kidcore', category: 'playful', era: '2020s', icon: '🖍️',
    tagline: 'Childhood joy and colorful imperfection',
    description: 'Crayons, stickers, bold colors, simple shapes, naive drawings. Playful, emotional, and intentionally imperfect.',
    badge: 'CHILDHOOD JOY',
    mood: ['playful', 'fun', 'nostalgic', 'expressive'],
    bestFor: ['children\'s products', 'youth brands', 'creative portfolios', 'education'],
    palette: { primary: '#ff0000', secondary: '#0000ff', accent: '#ffff00', background: '#ffffff', surface: '#ffffff', text: '#000000', textMuted: '#666666', border: '#ff0000' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -1, textTransform: 'none' },
    keywords: ['kidcore', 'kids', 'childish', 'crayon', 'sticker', 'rainbow', 'colorful', 'naive'],
  }),

  anthropomorphic: style({
    id: 'anthropomorphic', name: 'Anthropomorphic', category: 'playful', era: 'Timeless', icon: '🐻',
    tagline: 'Human traits for non-human characters',
    description: 'Animals/objects given human emotions, expressions, and behavior. Expressive, relatable, and easy to remember.',
    badge: 'CHARACTER DRIVEN',
    mood: ['fun', 'quirky', 'friendly', 'playful'],
    bestFor: ['children\'s products', 'gamified UX', 'branding', 'mascots', 'packaging'],
    palette: { primary: '#ff6b35', secondary: '#004e89', accent: '#ffd166', background: '#fef9ef', surface: '#ffffff', text: '#1a1a2e', textMuted: '#6c757d', border: '#ff6b35' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['anthropomorphic', 'mascot', 'character', 'animal', 'cute', 'friendly', 'personality'],
  }),

  rubberhose: style({
    id: 'rubberhose', name: 'Rubberhose', category: 'playful', era: '1920s–1930s', icon: '🎪',
    tagline: 'Vintage cartoon animation charm',
    description: 'Bendy noodle-like limbs, simple features, exaggerated motion, oversized gloves, thick outlines. 1920s-30s animation style.',
    badge: 'VINTAGE CARTOON',
    mood: ['playful', 'charming', 'surreal', 'nostalgic'],
    bestFor: ['retro mascots', 'café branding', 'sticker packs', 'character logos'],
    palette: { primary: '#2c2c2c', secondary: '#f5e6d3', accent: '#ff6b35', background: '#f5e6d3', surface: '#ffffff', text: '#2c2c2c', textMuted: '#6b5b4b', border: '#2c2c2c' },
    typography: { headlineFont: 'Righteous', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
    keywords: ['rubberhose', 'vintage cartoon', '1920s', 'animation', 'bendy', 'retro', 'mascot'],
  }),

  naive: style({
    id: 'naive', name: 'Naive', category: 'playful', era: 'Contemporary', icon: '😊',
    tagline: 'Childlike honesty over polished perfection',
    description: 'Uneven shapes, jittery outlines, messy fills. Design done honestly, where personality matters more than polish.',
    badge: 'HUMAN TOUCH',
    mood: ['playful', 'human', 'honest', 'expressive'],
    bestFor: ['trend-forward branding', 'creative products', 'youth markets', 'editorial'],
    palette: { primary: '#ff6b6b', secondary: '#4ecdc4', accent: '#ffe66d', background: '#fafafa', surface: '#ffffff', text: '#2c2c54', textMuted: '#706fd3', border: '#ff6b6b' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['naive', 'childlike', 'hand-drawn', 'imperfect', 'doodle', 'sketch', 'honest', 'raw'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // TYPOGRAPHY-FOCUSED
  // ═══════════════════════════════════════════════════════════════════

  luxuryTypography: style({
    id: 'luxuryTypography', name: 'Luxury Typography', category: 'typography', era: '20th Century–Present', icon: '✒️',
    tagline: 'Refined letterforms as pure sophistication',
    description: 'Custom typefaces, elegant scripts, careful ligatures. Typography alone carries the brand identity with timeless authority.',
    badge: 'LETTERFORM LUXURY',
    mood: ['elegant', 'elite', 'timeless', 'sophisticated'],
    bestFor: ['luxury fashion', 'beauty brands', 'high-end editorial', 'premium packaging'],
    palette: { primary: '#0a0a0a', secondary: '#333333', accent: '#d4af37', background: '#f8f8f8', surface: '#ffffff', text: '#0a0a0a', textMuted: '#666666', border: '#e0e0e0' },
    typography: { headlineFont: 'Playfair Display', bodyFont: 'Cormorant', accentFont: 'Cinzel', headlineWeight: '400', letterSpacing: 3, textTransform: 'uppercase' },
    keywords: ['luxury', 'typography', 'elegant', 'serif', 'custom type', 'refined', 'sophisticated', 'monogram'],
  }),

  typeCollage: style({
    id: 'typeCollage', name: 'Type Collage', category: 'typography', era: 'Contemporary', icon: '🔤',
    tagline: 'Letterforms as the composition itself',
    description: 'Typography-first design where type IS the composition. Mixed fonts, weights, sizes, layering, overlap, and cropping for mood and energy.',
    badge: 'TYPE AS ART',
    mood: ['expressive', 'authored', 'attention-grabbing', 'bold'],
    bestFor: ['posters', 'editorials', 'brand graphics', 'event design'],
    palette: { primary: '#000000', secondary: '#ff0000', accent: '#ffffff', background: '#f5f5f5', surface: '#ffffff', text: '#000000', textMuted: '#555555', border: '#000000' },
    typography: { headlineFont: 'Playfair Display', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -2, textTransform: 'uppercase' },
    keywords: ['type collage', 'typography', 'mixed fonts', 'letterpress', 'ransom note', 'expressive type', 'layered type'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // DIGITAL & CONTEMPORARY
  // ═══════════════════════════════════════════════════════════════════

  glassmorphism: style({
    id: 'glassmorphism', name: 'Glassmorphism', category: 'digital', era: '2020s', icon: '💎',
    tagline: 'Frosted glass depth and translucent layers',
    description: 'Semi-transparent overlays, subtle blur effects, depth and dimension, frosted backgrounds with neon tints.',
    badge: 'FROSTED GLASS',
    mood: ['futuristic', 'elegant', 'sleek', 'modern'],
    bestFor: ['apps', 'OS UI', 'product landing pages', 'web design'],
    palette: { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb', background: '#0a0a1a', surface: 'rgba(255,255,255,0.1)', text: '#ffffff', textMuted: '#a0a0c0', border: 'rgba(255,255,255,0.2)' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['glassmorphism', 'glass', 'frosted', 'blur', 'transparent', 'translucent', 'depth'],
  }),

  aurora: style({
    id: 'aurora', name: 'Aurora', category: 'digital', era: '2010s–Present', icon: '🌌',
    tagline: 'Northern lights gradients and cosmic glow',
    description: 'Flowing iridescent gradients inspired by the aurora borealis. Smooth transitions between purples, pinks, blues, and greens.',
    badge: 'COSMIC GLOW',
    mood: ['dreamy', 'futuristic', 'meditative', 'immersive'],
    bestFor: ['wellness apps', 'tech launches', 'spiritual themes', 'digital art'],
    palette: { primary: '#6c5ce7', secondary: '#a29bfe', accent: '#fd79a8', background: '#0a0a2e', surface: '#1a1a4e', text: '#ffffff', textMuted: '#a29bfe', border: '#6c5ce7' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['aurora', 'northern lights', 'gradient', 'cosmic', 'iridescent', 'dreamy', 'ethereal glow'],
  }),

  ethereal: style({
    id: 'ethereal', name: 'Ethereal', category: 'digital', era: '2010s–Present', icon: '🦋',
    tagline: 'Weightless otherworldly delicacy',
    description: 'Soft hues, delicate layering, airy atmosphere, distorted/blurry imagery. Like viewing the world through a dreamy lens.',
    badge: 'DREAMLIKE',
    mood: ['calm', 'mystical', 'romantic', 'weightless'],
    bestFor: ['fashion lookbooks', 'website heroes', 'conceptual art', 'spiritual brands'],
    palette: { primary: '#c9b1d0', secondary: '#a8d8ea', accent: '#ffd3b6', background: '#faf5ff', surface: '#ffffff', text: '#5a4a6a', textMuted: '#b0a0c0', border: '#e0d0f0' },
    typography: { headlineFont: 'Cormorant', bodyFont: 'Inter', accentFont: 'Cormorant', headlineWeight: '400', letterSpacing: 0, textTransform: 'none' },
    keywords: ['ethereal', 'dreamy', 'soft', 'blur', 'gauzy', 'airy', 'delicate', 'otherworldly'],
  }),

  bentoGrid: style({
    id: 'bentoGrid', name: 'Bento Grid', category: 'digital', era: '2010s–Present', icon: '🍱',
    tagline: 'Compartmentalized Japanese-inspired layouts',
    description: 'Clean, orderly layout organizing content into distinct sections with clear separation. Inspired by Japanese bento boxes.',
    badge: 'ORGANIZED GRID',
    mood: ['organized', 'friendly', 'clean', 'digestible'],
    bestFor: ['dashboards', 'portfolios', 'productivity tools', 'websites', 'apps'],
    palette: { primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', background: '#f8f9fa', surface: '#ffffff', text: '#1a1a2e', textMuted: '#6c757d', border: '#e9ecef' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['bento', 'grid', 'modular', 'compartment', 'organized', 'blocks', 'dashboard'],
  }),

  risograph: style({
    id: 'risograph', name: 'Risograph', category: 'digital', era: '2010s–Present', icon: '🖨️',
    tagline: 'Print-inspired layered spot colors with grain',
    description: 'Layered spot colors, visible grain, slight misregistration, tactile texture, ink noise. Handmade print personality.',
    badge: 'PRINT TEXTURE',
    mood: ['warm', 'handmade', 'editorial', 'artistic'],
    bestFor: ['posters', 'zines', 'album art', 'event flyers', 'editorial'],
    palette: { primary: '#ff6b35', secondary: '#004e89', accent: '#ffd166', background: '#f5f0e8', surface: '#faf7f0', text: '#1a1a2e', textMuted: '#6c757d', border: '#ff6b35' },
    typography: { headlineFont: 'Space Grotesk', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'uppercase' },
    keywords: ['risograph', 'riso', 'print', 'grain', 'spot color', 'misregistration', 'zine', 'ink'],
  }),

  contemporary: style({
    id: 'contemporary', name: 'Contemporary', category: 'digital', era: '2020s', icon: '✨',
    tagline: 'Bold, experimental, and of-the-moment',
    description: 'Big bold typography, vibrant contrasting colors, digital + traditional media blend, sustainable and socially conscious.',
    badge: 'NOW',
    mood: ['bold', 'experimental', 'current', 'dynamic'],
    bestFor: ['agency branding', 'tech startups', 'editorial', 'social media'],
    palette: { primary: '#1a1a2e', secondary: '#e94560', accent: '#0f3460', background: '#f8f9fa', surface: '#ffffff', text: '#1a1a2e', textMuted: '#6c757d', border: '#e94560' },
    typography: { headlineFont: 'Outfit', bodyFont: 'Inter', accentFont: 'Space Grotesk', headlineWeight: '800', letterSpacing: -1, textTransform: 'none' },
    keywords: ['contemporary', 'trendy', 'editorial', 'agency', 'avant-garde', 'modern', '2025', '2026'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // FANTASY & STORYTELLING
  // ═══════════════════════════════════════════════════════════════════

  romantasy: style({
    id: 'romantasy', name: 'Romantasy', category: 'fantasy', era: 'Contemporary', icon: '⚔️',
    tagline: 'Romance meets fantasy in ornate storytelling',
    description: 'Ornate type, medieval symbols, florals, moons, swords, dramatic lighting. A brand that feels like a story you can step into.',
    badge: 'FANTASY ROMANCE',
    mood: ['emotional', 'atmospheric', 'narrative', 'dramatic'],
    bestFor: ['book covers', 'fantasy branding', 'romantic products', 'event design'],
    palette: { primary: '#1a0a2e', secondary: '#4a0e4e', accent: '#d4af37', background: '#0a0515', surface: '#1a0a2e', text: '#f5e6d3', textMuted: '#b0a0c0', border: '#d4af37' },
    typography: { headlineFont: 'Cinzel', bodyFont: 'Cormorant', accentFont: 'Cinzel Decorative', headlineWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['romantasy', 'fantasy', 'romance', 'medieval', 'sword', 'moon', 'magic', 'storybook'],
  }),

  futureMedieval: style({
    id: 'futureMedieval', name: 'Future Medieval', category: 'fantasy', era: 'Contemporary', icon: '🛡️',
    tagline: 'Ancient symbolism meets digital futurism',
    description: 'Gothic typography, heraldic symbols, manuscript ornament, mythic motifs, stark contrast palettes, gold/metallic accents with digital textures.',
    badge: 'DIGITAL HERALDRY',
    mood: ['ceremonial', 'powerful', 'dramatic', 'mysterious'],
    bestFor: ['premium branding', 'event design', 'luxury products', 'gaming'],
    palette: { primary: '#0a0a0a', secondary: '#1a1a2e', accent: '#d4af37', background: '#0a0a0a', surface: '#1a1a1a', text: '#d4af37', textMuted: '#8b7355', border: '#d4af37' },
    typography: { headlineFont: 'Cinzel', bodyFont: 'Cormorant', accentFont: 'Cinzel', headlineWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
    keywords: ['future medieval', 'heraldic', 'sigil', 'shield', 'manuscript', 'gothic futuristic', 'digital medieval'],
  }),

  darkAcademia: style({
    id: 'darkAcademia', name: 'Dark Academia', category: 'fantasy', era: 'Contemporary', icon: '📚',
    tagline: 'Gothic scholarship meets mystical knowledge',
    description: 'Gothic academia + mysticism. Candles, spellbooks, antique etchings, black/gold palette, serif calligraphy.',
    badge: 'SCHOLARLY MAGIC',
    mood: ['mysterious', 'scholarly', 'magical', 'intellectual'],
    bestFor: ['fantasy games', 'book clubs', 'witchy brands', 'education'],
    palette: { primary: '#1a1a1a', secondary: '#3e2723', accent: '#d4af37', background: '#0a0a0a', surface: '#1a1a1a', text: '#f5e6d3', textMuted: '#a08060', border: '#d4af37' },
    typography: { headlineFont: 'Cinzel', bodyFont: 'Cormorant', accentFont: 'Cinzel', headlineWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    keywords: ['dark academia', 'academia', 'gothic', 'scholarly', 'books', 'candles', 'mystical', 'library'],
  }),

  // ═══════════════════════════════════════════════════════════════════
  // 2026 TRENDING
  // ═══════════════════════════════════════════════════════════════════

  newMaximalism: style({
    id: 'newMaximalism', name: 'New Maximalism', category: 'trending', era: '2024–Present', icon: '💥',
    tagline: 'More is more — bold, layered, unapologetic',
    description: 'Abundance of colors, shapes, patterns. Controlled chaos with vibrant palettes, dynamic compositions, and fearless visual energy.',
    badge: 'MAXIMUM IMPACT',
    mood: ['energetic', 'bold', 'exciting', 'rebellious'],
    bestFor: ['branding', 'packaging', 'advertising', 'social media', 'events'],
    palette: { primary: '#ff006e', secondary: '#8338ec', accent: '#ffbe0b', background: '#0a0a1a', surface: '#1a1a2e', text: '#ffffff', textMuted: '#b0b0d0', border: '#ff006e' },
    typography: { headlineFont: 'Rubik', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
    keywords: ['maximalism', 'maximalist', 'bold', 'colorful', 'loud', 'layered', 'pattern', 'vibrant', 'more is more'],
  }),

  humanImperfection: style({
    id: 'humanImperfection', name: 'Human Imperfection', category: 'trending', era: '2025–Present', icon: '✋',
    tagline: 'The anti-AI backlash — warmth over polish',
    description: 'Hand-drawn elements, candid photography, imperfect textures, organic typography. Deliberate pushback against AI-generated slickness.',
    badge: 'HUMAN MADE',
    mood: ['authentic', 'warm', 'personal', 'honest'],
    bestFor: ['branding', 'social media', 'editorial', 'packaging', 'any brand wanting to feel human'],
    palette: { primary: '#2d2d2d', secondary: '#8b7355', accent: '#d4a574', background: '#faf5ef', surface: '#ffffff', text: '#2d2d2d', textMuted: '#8b8b8b', border: '#d4a574' },
    typography: { headlineFont: 'Cormorant', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '600', letterSpacing: 0, textTransform: 'none' },
    keywords: ['human', 'imperfect', 'hand-drawn', 'authentic', 'warm', 'organic', 'candid', 'anti-ai', 'real'],
  }),

  microIndustrial: style({
    id: 'microIndustrial', name: 'Micro-Industrial', category: 'trending', era: '2025–Present', icon: '🏭',
    tagline: 'Technical information as design texture',
    description: 'Barcodes, QR codes, regulatory marks, tiny text blocks, technical documentation layouts as design elements. Credibility through density.',
    badge: 'TECHNICAL AUTHORITY',
    mood: ['credible', 'technical', 'precise', 'industrial'],
    bestFor: ['developer tools', 'fintech', 'B2B SaaS', 'sports branding', 'tech companies'],
    palette: { primary: '#1a1a1a', secondary: '#333333', accent: '#00ff00', background: '#f0f0f0', surface: '#ffffff', text: '#1a1a1a', textMuted: '#666666', border: '#1a1a1a' },
    typography: { headlineFont: 'Space Mono', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
    keywords: ['industrial', 'technical', 'utilitarian', 'barcode', 'monospace', 'data', 'blueprint', 'specification'],
  }),

  blotchLogo: style({
    id: 'blotchLogo', name: 'Blotch / Fluid Logos', category: 'trending', era: '2025–Present', icon: '💧',
    tagline: 'Variable, fluid, melting logo forms',
    description: 'Logos that look like they are already on the move. Melting, leaking, organic forms that shift, shrink, and expand.',
    badge: 'SHAPE SHIFTER',
    mood: ['fluid', 'dynamic', 'organic', 'modern'],
    bestFor: ['brand identity', 'motion branding', 'fashion', 'creative agencies'],
    palette: { primary: '#1a1a2e', secondary: '#e94560', accent: '#0f3460', background: '#f8f9fa', surface: '#ffffff', text: '#1a1a2e', textMuted: '#6c757d', border: '#e94560' },
    typography: { headlineFont: 'DM Sans', bodyFont: 'Inter', accentFont: 'DM Sans', headlineWeight: '700', letterSpacing: -0.5, textTransform: 'none' },
    keywords: ['fluid', 'melting', 'blob', 'organic logo', 'shape-shifter', 'variable', 'morphing'],
  }),

  neoMinimalism: style({
    id: 'neoMinimalism', name: 'Neo-Minimalism', category: 'trending', era: '2025–Present', icon: '◻️',
    tagline: 'Clean layouts with bold micro-maximalist accents',
    description: 'Minimal doesn\'t mean boring. Clean layouts paired with bold type, color pops, or intricate micro-details. One strong element takes the spotlight.',
    badge: 'CLEAN BOLD',
    mood: ['modern', 'refined', 'striking', 'balanced'],
    bestFor: ['tech brands', 'editorial', 'product design', 'web design'],
    palette: { primary: '#0a0a0a', secondary: '#333333', accent: '#ff3366', background: '#fafafa', surface: '#ffffff', text: '#0a0a0a', textMuted: '#888888', border: '#e0e0e0' },
    typography: { headlineFont: 'Inter', bodyFont: 'Inter', accentFont: 'Space Mono', headlineWeight: '800', letterSpacing: -1, textTransform: 'none' },
    keywords: ['neo-minimalism', 'minimal', 'clean bold', 'micro-maximalism', 'accent pop', 'refined minimal'],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// LOOKUP HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all styles as an array
 */
export function getAllStyles(): DesignStyleEntry[] {
  return Object.values(DESIGN_STYLE_DATABASE);
}

/**
 * Get styles by category
 */
export function getStylesByCategory(category: StyleCategory): DesignStyleEntry[] {
  return Object.values(DESIGN_STYLE_DATABASE).filter(s => s.category === category);
}

/**
 * Find a style by ID
 */
export function getStyleById(id: string): DesignStyleEntry | undefined {
  return DESIGN_STYLE_DATABASE[id];
}

/**
 * Search styles by keyword/mood/use-case
 */
export function searchStyles(query: string): DesignStyleEntry[] {
  const q = query.toLowerCase();
  return Object.values(DESIGN_STYLE_DATABASE).filter(s =>
    s.keywords.some(k => k.includes(q)) ||
    s.mood.some(m => m.includes(q)) ||
    s.bestFor.some(b => b.includes(q)) ||
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.category.includes(q)
  );
}

/**
 * Classify a prompt into the best-matching style using weighted keyword scoring
 */
export function classifyStyleFromPrompt(prompt: string): string | null {
  const p = prompt.toLowerCase();
  let bestScore = 0;
  let bestId: string | null = null;

  for (const [id, style] of Object.entries(DESIGN_STYLE_DATABASE)) {
    let score = 0;
    for (const kw of style.keywords) {
      if (p.includes(kw)) {
        score += kw.length; // longer keyword = more specific = higher weight
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return bestScore > 0 ? bestId : null;
}

/**
 * Get all style categories with their styles
 */
export function getStyleCategoriesWithEntries(): Array<{ category: StyleCategory; meta: typeof STYLE_CATEGORIES[StyleCategory]; styles: DesignStyleEntry[] }> {
  const categories: StyleCategory[] = ['trending', 'classical', 'modernist', 'retro', 'raw', 'dark', 'organic', 'playful', 'typography', 'digital', 'fantasy'];
  return categories.map(cat => ({
    category: cat,
    meta: STYLE_CATEGORIES[cat],
    styles: getStylesByCategory(cat),
  }));
}
