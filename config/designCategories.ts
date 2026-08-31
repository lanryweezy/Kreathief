/**
 * Kreathief Design Categories — 2026 Trend Intelligence
 *
 * 37 sectors mapped to research-backed trend combinations, palettes, fonts,
 * composition rules, and creative direction. This is the single source of
 * truth the Creative Draft agent references when generating designs.
 *
 * Sources: VistaPrint/99designs 2026 Expert Survey, Canva "Imperfect by Design",
 * Adobe 2025 State of Creativity, Behance 10K+ projects, Kittl 2026 Report,
 * sector-specific research across 37 industries.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type TrendName =
  | 'elemental-folk'
  | 'hyper-individualism'
  | 'tactile-craft'
  | 'distorted-cut'
  | 'candid-camera-roll'
  | 'hyper-bloom'
  | 'digi-cute'
  | 'micro-industrial'
  | 'neon-noir'
  | 'frutiger-aero';

export interface PaletteDirection {
  name: string;
  description: string;
  primary: string[];
  accent: string[];
  background: string;
  text: string;
}

export interface TypographyDirection {
  heading: string;
  body: string;
  accent?: string;
  style: string;
}

export interface CompositionRule {
  name: string;
  description: string;
}

export interface DesignCategory {
  id: string;
  name: string;
  sector: string;
  primaryTrend: TrendName;
  secondaryTrend: TrendName;
  palette: PaletteDirection;
  typography: TypographyDirection;
  composition: CompositionRule[];
  photographyDirection: string;
  dosAndDonts: { dos: string[]; donts: string[] };
  canvasRecommendations: string[];
}

// ─── Trend Descriptions ──────────────────────────────────────────────────────

export const TREND_DESCRIPTIONS: Record<TrendName, { name: string; summary: string; keywords: string[] }> = {
  'elemental-folk': {
    name: 'Elemental Folk',
    summary: 'Folk art motifs, ornamental borders, hand-drawn flora/fauna, jewel tones + earthy neutrals, rustic artisanal typography.',
    keywords: ['folk', 'heritage', 'hand-drawn', 'ornamental', 'botanical', 'artisanal', 'jewel-tones', 'earthy'],
  },
  'hyper-individualism': {
    name: 'Hyper-Individualism',
    summary: 'Surreal, trippy, twisted geometry, soft psychedelic palettes, bold custom type as artwork. Anti-AI sameness.',
    keywords: ['surreal', 'trippy', 'psychedelic', 'bold', 'custom-type', 'abstract', 'distorted', 'individual'],
  },
  'tactile-craft': {
    name: 'Tactile Craft',
    summary: 'Embroidery, felt, fabric textures, paper cutouts, patchwork, collage. Handmade warmth.',
    keywords: ['tactile', 'embroidery', 'felt', 'paper-cut', 'collage', 'handmade', 'stitched', 'fabric'],
  },
  'distorted-cut': {
    name: 'Distorted Cut',
    summary: 'Angular cuts, fragmented photography, raw collage, punk-zine energy. Bold and edgy.',
    keywords: ['angular', 'fragmented', 'collage', 'punk', 'raw', 'torn', 'edgy', 'chaotic'],
  },
  'candid-camera-roll': {
    name: 'Candid Camera Roll',
    summary: 'Grainy film, flash photography, unstaged, hand-drawn captions. Closer to memory than marketing.',
    keywords: ['grainy', 'film', 'flash', 'unstaged', 'candid', 'authentic', 'imperfect', 'nostalgic'],
  },
  'hyper-bloom': {
    name: 'Hyper-Bloom',
    summary: 'Digitally amplified botanicals, dreamy "Gen Z blur," romantic pastels. Escapist and cinematic.',
    keywords: ['botanical', 'dreamy', 'romantic', 'pastel', 'blur', 'floral', 'hazy', 'ethereal'],
  },
  'digi-cute': {
    name: 'Digi-Cute',
    summary: 'Kawaii characters, pixel art, Y2K, toy-like shapes, bright gradients. Nostalgic yet polished.',
    keywords: ['kawaii', 'pixel', 'y2k', 'cute', 'character', 'playful', 'bright', 'nostalgic'],
  },
  'micro-industrial': {
    name: 'Micro-Industrial',
    summary: 'Barcodes, QR codes, regulatory marks as design, utilitarian layouts. Stark, precise, technical.',
    keywords: ['utilitarian', 'technical', 'barcode', 'industrial', 'precise', 'stark', 'functional', 'data'],
  },
  'neon-noir': {
    name: 'Neon-Noir',
    summary: 'Red + black + neon accents, gritty, cinematic, motion blur. Japanese street culture + noir cinema.',
    keywords: ['dark', 'neon', 'cinematic', 'gritty', 'red-black', 'motion', 'rebellious', 'urgent'],
  },
  'frutiger-aero': {
    name: 'Frutiger Aero Revival',
    summary: 'Bright gradients, bubbly type, nature-tech harmony, glossy skeuomorphism. Apple iOS 26 catalyst.',
    keywords: ['gradient', 'bubbly', 'glossy', 'optimistic', 'nature-tech', 'skeuomorphic', 'utopian', 'rounded'],
  },
};

// ─── All 37 Design Categories ────────────────────────────────────────────────

export const DESIGN_CATEGORIES: DesignCategory[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. FINTECH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fintech',
    name: 'Fintech',
    sector: 'Finance & Technology',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'frutiger-aero',
    palette: {
      name: 'Beyond-Blue Trust',
      description: 'Move beyond generic corporate blue. Purple (Nubank), coral (Monzo), black (Mercury), gradients (Revolut).',
      primary: ['#6C5CE7', '#00D2D3', '#0A0A0A', '#FF6B6B'],
      accent: ['#FFD700', '#00FF88'],
      background: '#0A0A0A',
      text: '#F0F0F0',
    },
    typography: {
      heading: 'Geometric sans (Inter, Satoshi, Cabinet Grotesk)',
      body: 'Clean sans (DM Sans, Plus Jakarta Sans)',
      accent: 'Monospace (JetBrains Mono, IBM Plex Mono)',
      style: 'Clean, modern, tech-forward. Monospace for data credibility.',
    },
    composition: [
      { name: 'Data Hierarchy', description: 'Clear visual hierarchy for financial data. One primary metric per screen.' },
      { name: 'Trust Signals', description: 'Compliance badges, security indicators, transparent fee visualization.' },
      { name: 'Thumb-Zone Navigation', description: 'Bottom-sheet nav, gesture controls, mobile-first.' },
    ],
    photographyDirection: 'Abstract over literal. Avoid coin/flying-money clichés. Use data-inspired visuals, abstract shapes.',
    dosAndDonts: {
      dos: ['Dark mode as default', 'Progressive disclosure', 'Data storytelling over static charts', 'AI personalization in UI'],
      donts: ['Generic corporate blue', 'Coin/flying money imagery', 'Dense spreadsheet dumps', 'Hidden fees in design'],
    },
    canvasRecommendations: ['Dashboard layouts', 'Mobile app screens', 'Social media ads', 'Presentation slides'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. STREETWEAR
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'streetwear',
    name: 'Streetwear & Fashion',
    sector: 'Fashion & Apparel',
    primaryTrend: 'hyper-individualism',
    secondaryTrend: 'distorted-cut',
    palette: {
      name: 'Soft Psychedelic + Earth',
      description: 'Muted purples, warm corals, sage greens. Cloud Dancer white as anchor.',
      primary: ['#B8A9C9', '#E8A598', '#A3B18A', '#F5F0E8'],
      accent: ['#FF1744', '#00F0FF'],
      background: '#1A1A1A',
      text: '#F5F0E8',
    },
    typography: {
      heading: 'Type collage — mixed fonts, sizes, styles',
      body: 'Clean sans (Neue Haas Grotesk, Akkurat)',
      accent: 'Hand-drawn, naive lettering',
      style: 'Typography IS the design. Multiple fonts creating visual energy. Oversized display type.',
    },
    composition: [
      { name: 'Type Collage', description: 'Multiple fonts, sizes, and styles in one composition for instant visual energy.' },
      { name: 'Asymmetric Editorial', description: 'Off-grid typography, intentional tension, dynamic layouts.' },
      { name: 'Mixed-Media Layering', description: 'Photography + illustration + texture + typography coexisting.' },
    ],
    photographyDirection: 'Candid, unstaged, film-grain. Behind-the-scenes. Flash photography. "Caught mid-moment" authenticity.',
    dosAndDonts: {
      dos: ['Bold custom typography', 'Hand-drawn elements', 'Grainy film textures', 'Community-driven brand systems'],
      donts: ['Generic geometric sans-serif only', 'Over-polished AI imagery', 'Static non-animated brands', 'Corporate-safe layouts'],
    },
    canvasRecommendations: ['Instagram posts', 'Lookbook pages', 'Campaign posters', 'Social media stories'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. MUSIC COVERS / ALBUM ART
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'music-covers',
    name: 'Music Covers & Album Art',
    sector: 'Music & Entertainment',
    primaryTrend: 'hyper-individualism',
    secondaryTrend: 'tactile-craft',
    palette: {
      name: 'Muted Psychedelic',
      description: 'Softer psychedelic tones replacing harsh neons. Charli XCX "brat" effect — bold minimalism with personality.',
      primary: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
      accent: ['#000000', '#FFFFFF'],
      background: '#0D0D0D',
      text: '#FFFFFF',
    },
    typography: {
      heading: 'Liquid/experimental — stretching, flowing letterforms',
      body: 'Clean sans for supporting text',
      accent: 'Ink trap fonts, pick-and-mix ransom-note style',
      style: 'Typography as primary visual element. 68% of breakout covers use bold minimalism.',
    },
    composition: [
      { name: 'Bold Minimalism', description: 'Clean, uncluttered with striking typographic elements. 1-3 colors max.' },
      { name: 'Single Focal Point', description: 'One dominant element. Must work at 300x300px thumbnail.' },
      { name: 'Concept-Driven', description: 'Narrative album art that tells a story, not just looks cool.' },
    ],
    photographyDirection: 'Film-grain, sepia, muted tones. Distorted/glitched portraits. Mixed-media collage. AI-enhanced surrealism as collaborative tool.',
    dosAndDonts: {
      dos: ['Design for streaming thumbnails (300x300px)', 'Animate for Spotify Canvas', 'Use mixed-media collage', 'Text fidelity — exact lyrics'],
      donts: ['Generic AI-generated imagery', 'Over-polished sterile perfection', 'Designs that fail at thumbnail size', 'Static-only artwork'],
    },
    canvasRecommendations: ['Square album art (3000x3000)', 'Spotify Canvas (8s loop)', 'Social media promos', 'Vinyl sleeve'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. BOOK COVERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'book-covers',
    name: 'Book Covers',
    sector: 'Publishing & Editorial',
    primaryTrend: 'elemental-folk',
    secondaryTrend: 'tactile-craft',
    palette: {
      name: 'Jewel Tones + White',
      description: 'Deep emerald, sapphire, ruby on white/cream. White backgrounds gaining traction as bold choice.',
      primary: ['#2D6A4F', '#1B4B8A', '#8B0000', '#FFFFFF'],
      accent: ['#FFD700', '#C5A258'],
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    typography: {
      heading: 'Typography occupies 70-80%+ of cover surface',
      body: 'Clean serif or sans for body text',
      accent: 'Oversized, exaggerated, handwritten display',
      style: 'Type IS the design. Must work at thumbnail AND print size. Dual-scale design non-optional.',
    },
    composition: [
      { name: 'Dual-Scale Design', description: 'Must stop scroll at thumbnail AND reward physical inspection.' },
      { name: 'Genre Signaling', description: 'Readers decide in 1-2 seconds. Visual language must match genre expectations.' },
      { name: 'Serialized Identity', description: 'Consistent design language across imprint titles.' },
    ],
    photographyDirection: 'Hand-painted artwork with modern typography overlay. One-color covers with distorted objects. Painterly/digital painting.',
    dosAndDonts: {
      dos: ['Typography as 70-80% of cover', 'Design for thumbnail first', 'Genre-appropriate signaling', 'Hand-painted/illustrated artwork'],
      donts: ['Small delicate typography', 'Low-contrast type on backgrounds', 'Generic stock photography', 'Designing for only one size'],
    },
    canvasRecommendations: ['Standard book cover', 'Ebook thumbnail', 'Social media promo', 'Audiobook cover'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SOCIAL MEDIA ADS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'social-media-ads',
    name: 'Social Media Ads',
    sector: 'Digital Advertising',
    primaryTrend: 'candid-camera-roll',
    secondaryTrend: 'frutiger-aero',
    palette: {
      name: 'Vibrant Saturated',
      description: 'Bright hues replacing muted neutrals. Bold contrasts that stop the scroll.',
      primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      accent: ['#FFEAA7', '#DDA0DD'],
      background: '#FFFFFF',
      text: '#2D3436',
    },
    typography: {
      heading: 'Oversized bold, 3-5 words max per frame',
      body: 'Clean readable sans (16px+ minimum)',
      accent: 'Hand-drawn annotations',
      style: 'Bold, high-contrast. Must be readable at mobile size. Serif fonts returning.',
    },
    composition: [
      { name: '3-Second Rule', description: 'Frame 1 must contain motion. Hook rate target: above 25%.' },
      { name: 'Single CTA', description: 'One clear action per design. Reduce visual clutter.' },
      { name: 'Mobile-First', description: 'Design for phone screens. 64% of opens on mobile.' },
    ],
    photographyDirection: 'UGC-style outperforms polished (2.64% vs 1.78% CTR). Native-style creative. Candid, unstaged.',
    dosAndDonts: {
      dos: ['UGC-style creative', 'Motion in frame 1', 'Sound-on design', '8-10 carousel slides'],
      donts: ['Over-polished brand ads', 'Static-only content', 'Multiple competing CTAs', 'Text-heavy designs'],
    },
    canvasRecommendations: ['Instagram post (1080x1080)', 'Instagram story (1080x1920)', 'Facebook ad (1200x628)', 'Carousel (1080x1080)'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. YOUTUBE THUMBNAILS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'youtube-thumbnails',
    name: 'YouTube Thumbnails',
    sector: 'Video & Content',
    primaryTrend: 'neon-noir',
    secondaryTrend: 'candid-camera-roll',
    palette: {
      name: 'High-Contrast Pop',
      description: 'Red/blue, yellow/purple, orange/teal. Complementary pairs for maximum contrast.',
      primary: ['#FF0000', '#0066FF', '#FFD700', '#000000'],
      accent: ['#FFFFFF', '#00FF00'],
      background: '#0A0A0A',
      text: '#FFFFFF',
    },
    typography: {
      heading: 'Bebas Neue, Anton, Impact — ultra-bold condensed',
      body: 'N/A — 0-3 words max on thumbnail',
      accent: 'Drop shadows/outlines for legibility',
      style: '12-character rule. 0-3 words significantly outperform. Some top creators use zero text.',
    },
    composition: [
      { name: 'Single Focal Point', description: '69% of breakout thumbnails use a face. 921K more views on average.' },
      { name: 'Curiosity Gap', description: 'Create implicit question that can only be answered by watching.' },
      { name: 'Safe Zones', description: 'Avoid lower-right (timestamp) and bottom (progress bar). Design at 1280x760.' },
    ],
    photographyDirection: 'Dedicated thumbnail photos (not video frames). Exaggerated expressions. Background simplification (darken/blur/desaturate).',
    dosAndDonts: {
      dos: ['Faces with emotion', '0-3 words', 'High contrast', 'Design for mobile (1 inch wide)'],
      donts: ['Overcrowded (4+ elements)', 'Neutral expressions', '7+ words', 'Misleading clickbait'],
    },
    canvasRecommendations: ['YouTube thumbnail (1280x720)', 'YouTube Shorts cover', 'Community post'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. INFOGRAPHICS & PROMOS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'infographics',
    name: 'Infographics & Promotional Graphics',
    sector: 'Data Visualization & Marketing',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'elemental-folk',
    palette: {
      name: 'Transformative Teal + Earth',
      description: 'Pantone 2026 "Transformative Teal" accent with warm earthy neutrals.',
      primary: ['#008080', '#A68B6B', '#7B8F6B', '#D4C5B2'],
      accent: ['#FF6B6B', '#FFD700'],
      background: '#F5F0EB',
      text: '#2C2C2C',
    },
    typography: {
      heading: 'Bold geometric type as hero (50-70% of canvas)',
      body: 'Clean readable sans (16-18px minimum)',
      accent: 'Liquid/experimental for display moments',
      style: 'One insight per chart. Titles as conclusions. Variable fonts for rhythm.',
    },
    composition: [
      { name: 'Bento Grid', description: 'Modular, compartmentalized content in balanced sections.' },
      { name: 'One Insight Per Visual', description: 'Charts are messages, not just metrics.' },
      { name: 'Scrollytelling', description: 'Guided, annotated scroll experiences for complex data.' },
    ],
    photographyDirection: 'Quirky hand-drawn illustrations. Pixel art revival. Mixed-media layering. Tactile craft textures.',
    dosAndDonts: {
      dos: ['One insight per chart', 'Data storytelling', 'Accessible color coding', 'Animated transitions'],
      donts: ['3D pie charts', 'Static chart dumps', 'Rainbow color scales', 'Screenshot Excel charts'],
    },
    canvasRecommendations: ['Infographic poster', 'Social media carousel', 'Presentation slide', 'Email banner'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. FOOD & RESTAURANT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'food-restaurant',
    name: 'Food & Restaurant',
    sector: 'Food & Hospitality',
    primaryTrend: 'candid-camera-roll',
    secondaryTrend: 'elemental-folk',
    palette: {
      name: 'Earthy Heritage',
      description: 'Warm ochre, forest green, burgundy, cream, terracotta. Pantone Cloud Dancer warm white.',
      primary: ['#C4725F', '#2D5F3E', '#8B0000', '#F5F0E8'],
      accent: ['#FFD700', '#D4A373'],
      background: '#FAF7F4',
      text: '#2C2C2C',
    },
    typography: {
      heading: 'Rustic artisanal serifs with handcrafted flair',
      body: 'Clean readable sans for menus/body',
      accent: 'Hand-drawn/scrawled captions',
      style: 'Bold custom display for personality. Serif fonts making comeback for food brands.',
    },
    composition: [
      { name: 'Candid Photography', description: 'Grainy film, harsh flash, messy tables, half-eaten food. THE food photography direction of 2026.' },
      { name: 'Ornamental Borders', description: 'Folk-inspired decorative frames for menus and packaging.' },
      { name: 'Generous Whitespace', description: 'Let food breathe. Don\'t overcrowd the composition.' },
    ],
    photographyDirection: 'Candid Camera Roll is THE direction — grainy film textures, harsh flash, messy tables, half-eaten food, light leaks, "accidental" compositions.',
    dosAndDonts: {
      dos: ['Candid unstaged food photography', 'Hand-drawn menu elements', 'Folk-inspired packaging', 'Warm earthy palettes'],
      donts: ['Perfectly styled studio shots', 'Over-saturated HDR food photos', 'Stock food photography', 'Sterile white backgrounds'],
    },
    canvasRecommendations: ['Menu design', 'Instagram post', 'Food packaging', 'Restaurant branding'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. REAL ESTATE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'real-estate',
    name: 'Real Estate',
    sector: 'Property & Architecture',
    primaryTrend: 'candid-camera-roll',
    secondaryTrend: 'tactile-craft',
    palette: {
      name: 'Luxury Neutral',
      description: 'Black, white, deep navy with subtle gold accents. Muted earth tones.',
      primary: ['#0A1128', '#FFFFFF', '#B8965A', '#D4C5B2'],
      accent: ['#C5A258', '#2D4A3E'],
      background: '#F5F2ED',
      text: '#1A1A1A',
    },
    typography: {
      heading: 'Classic serifs (Didot, Bodoni, Playfair Display) for luxury',
      body: 'Clean sans-serif (Inter, DM Sans)',
      accent: 'Custom/distinctive typefaces as brand assets',
      style: 'Serif for luxury listings. Clean sans for digital. Hand-lettered for event marketing.',
    },
    composition: [
      { name: 'Full-Bleed Imagery', description: 'Cinematic photography with minimal text overlay.' },
      { name: 'Minimal Layout', description: 'Focus on properties. Clean, uncluttered, hero-image-driven.' },
      { name: 'Video-First', description: '403% more inquiries for listings with video.' },
    ],
    photographyDirection: 'Candid, unstaged, film-grain. Drone/aerial as standard (68% faster sales). Moody atmospheric lighting.',
    dosAndDonts: {
      dos: ['Video-first listings', 'Drone/aerial photography', 'Agent-as-brand positioning', 'Mobile-first design'],
      donts: ['Over-staged HDR shots', 'Stock photography', 'Generic "top agent" positioning', 'Desktop-only layouts'],
    },
    canvasRecommendations: ['Property listing card', 'Social media ad', 'Brochure page', 'Yard sign'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. HEALTHCARE & PHARMA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'healthcare',
    name: 'Healthcare & Pharmaceutical',
    sector: 'Health & Medical',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'frutiger-aero',
    palette: {
      name: 'Earthy Grounded + Soft Optimistic',
      description: 'Warm clay, sage green, sand for trust. Sky blue, mint, blush for wellness.',
      primary: ['#A68B6B', '#7B8F6B', '#6BA3BE', '#A8D5BA'],
      accent: ['#B85C3A', '#5B9BD5'],
      background: '#FAF7F4',
      text: '#2C2C2C',
    },
    typography: {
      heading: 'Rounded humanist sans (Nunito, Quicksand, Plus Jakarta Sans)',
      body: 'High-legibility sans (Inter, Roboto, Open Sans)',
      accent: 'Warm serif for heritage (Source Serif Pro)',
      style: 'Approachable, friendly. Minimum 16px body. Variable fonts for accessibility.',
    },
    composition: [
      { name: 'Accessibility First', description: 'WCAG 2.2 AA minimum. 48x48dp touch targets. 7:1 contrast for critical data.' },
      { name: 'Progressive Disclosure', description: 'Overview first, details on demand. Don\'t overwhelm patients.' },
      { name: 'Reassuring Feedback', description: 'Micro-interactions that confirm actions and reduce anxiety.' },
    ],
    photographyDirection: 'Candid, authentic moments. Real patients/staff (with consent). Natural light, warm environments.',
    dosAndDonts: {
      dos: ['Warm human-centered branding', 'Accessibility from day one', 'Plain language (6th-8th grade)', 'Dark mode option'],
      donts: ['Cold institutional aesthetics', 'Generic doctor stock photos', 'Neon-Noir (too anxiety-inducing)', 'Autoplaying animations'],
    },
    canvasRecommendations: ['Health app dashboard', 'Medical infographic', 'Pharma packaging', 'Wellness brand identity'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. EDUCATION & E-LEARNING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'education',
    name: 'Education & E-Learning',
    sector: 'Education & Technology',
    primaryTrend: 'frutiger-aero',
    secondaryTrend: 'digi-cute',
    palette: {
      name: 'Warm & Optimistic',
      description: 'Cream base with saturated accent pops. Bright gradients for EdTech.',
      primary: ['#FFF8F0', '#6CB4EE', '#7DD8C3', '#F5C542'],
      accent: ['#FF7F6B', '#5BA4A4'],
      background: '#FFF8F0',
      text: '#2C2C2C',
    },
    typography: {
      heading: 'Bubbly rounded sans (Nunito, Quicksand, Baloo)',
      body: 'Clean readable sans (Plus Jakarta Sans, Inter)',
      accent: 'Hand-drawn for celebrations/achievements',
      style: 'Friendly, approachable. Mixing 2-3 type families is standard. Dyslexia-friendly options.',
    },
    composition: [
      { name: 'Character-Driven', description: 'Mascots and animated characters guiding users through flows.' },
      { name: 'Gamified Progress', description: 'Progress visualization that feels playful (growing plants, filling jars).' },
      { name: 'Card-Based UI', description: 'Generous padding, rounded corners (12-16px), subtle shadows.' },
    ],
    photographyDirection: 'Candid student life. Real environments, not stock. Hand-drawn accents on photos.',
    dosAndDonts: {
      dos: ['Warm cream backgrounds with texture', 'Character-driven navigation', 'Bento box dashboards', 'Accessible design'],
      donts: ['Cold clinical palettes', 'Sterile white backgrounds', 'Dense text-heavy layouts', 'Generic stock photos'],
    },
    canvasRecommendations: ['Course thumbnail', 'Learning platform UI', 'Educational infographic', 'University branding'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. BEAUTY & COSMETICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'beauty-cosmetics',
    name: 'Beauty & Cosmetics',
    sector: 'Beauty & Personal Care',
    primaryTrend: 'tactile-craft',
    secondaryTrend: 'hyper-bloom',
    palette: {
      name: 'Jewel Tones + Chrome',
      description: 'Deep jewel tones with metallic accents. Chrome silver for innovation.',
      primary: ['#2D6A4F', '#4A0E0E', '#C5A258', '#C0C0C0'],
      accent: ['#FF1493', '#00CED1'],
      background: '#F5F0E8',
      text: '#1A1A1A',
    },
    typography: {
      heading: 'High-contrast serif + clean sans (Playfair Display + Source Sans Pro)',
      body: 'Clean sans for body text',
      accent: 'Bold condensed for impact',
      style: 'Serif revival for luxury. Bold condensed for advertising. Gender-neutral palettes moving beyond pink.',
    },
    composition: [
      { name: 'Minimalist Maximalism', description: 'Clean foundation + one bold element (intricate pattern, saturated accent).' },
      { name: 'Ingredient-Forward', description: 'Apothecary aesthetic — botanical illustrations, science-backed visual language.' },
      { name: 'AR Integration', description: 'QR codes unlocking try-on experiences, sourcing stories.' },
    ],
    photographyDirection: 'Real skin texture (pores, freckles). Diverse skin tones. Close-up texture shots. Natural lighting.',
    dosAndDonts: {
      dos: ['Metallic/chrome finishes', 'Diverse representation', 'Real skin texture', 'Matte tactile finishes'],
      donts: ['Millennial pink everything', 'Over-retouched imagery', 'Generic luxury scripts', 'Single beauty standard'],
    },
    canvasRecommendations: ['Product packaging', 'Social media ad', 'Brand identity', 'Campaign poster'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. TRAVEL & HOSPITALITY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'travel-hospitality',
    name: 'Travel & Hospitality',
    sector: 'Travel & Tourism',
    primaryTrend: 'candid-camera-roll',
    secondaryTrend: 'elemental-folk',
    palette: {
      name: 'Destination-Inspired',
      description: 'Colors pulled from actual geography. Mediterranean blues, desert ochre, forest green.',
      primary: ['#2E5090', '#C67B5C', '#2D4A3E', '#F5F0E8'],
      accent: ['#FFD700', '#E8734A'],
      background: '#FAF7F4',
      text: '#1A1A1A',
    },
    typography: {
      heading: 'Bold serif + clean sans (Playfair Display + Source Sans Pro)',
      body: 'Clean readable sans (16px+ minimum)',
      accent: 'Hand-drawn for boutique/indie brands',
      style: 'High-contrast bold typography. Serif + sans-serif pairings dominant.',
    },
    composition: [
      { name: 'Minimalist Maximalism', description: 'Clean layouts with one bold dramatic element.' },
      { name: 'Local > Global', description: 'Destination-specific visual language beats universal templates.' },
      { name: 'Sustainability Forward', description: 'Eco-credentials integrated into visual identity.' },
    ],
    photographyDirection: 'Authentic candid moments. Local culture immersion. Moody atmospheric lighting. First-person POV.',
    dosAndDonts: {
      dos: ['Destination-specific palettes', 'Sustainability storytelling', '3D virtual tours', 'Personalized visuals'],
      donts: ['Generic stock travel photos', 'Over-processed HDR', 'Neon/electric color schemes', 'One-size-fits-all branding'],
    },
    canvasRecommendations: ['Social media post', 'Brochure page', 'Hotel branding', 'Tourism campaign'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. SPORTS & FITNESS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    sector: 'Sports & Wellness',
    primaryTrend: 'neon-noir',
    secondaryTrend: 'distorted-cut',
    palette: {
      name: 'High-Energy Cinematic',
      description: 'Deep black + bold red + neon accents. Soft psychedelic for boutique fitness.',
      primary: ['#0A0A0A', '#E63946', '#00F0FF', '#FFFFFF'],
      accent: ['#FFD700', '#FF1744'],
      background: '#0A0A0A',
      text: '#FFFFFF',
    },
    typography: {
      heading: 'Oversized condensed (Bebas Neue, Oswald, custom)',
      body: 'Clean sans for supporting text',
      accent: 'Distorted/experimental for energy',
      style: 'Bold condensed sans-serifs dominate. All-caps for impact. Mixed-weight hierarchies.',
    },
    composition: [
      { name: 'Motion Blur', description: 'Blurred motion streaks conveying urgency and kinetic energy.' },
      { name: 'Candid Action', description: 'Mid-jump, mid-sprint, mid-lift. Unposed, raw.' },
      { name: 'Fragmented Layering', description: 'Angular cuts, torn edges, clashing textures.' },
    ],
    photographyDirection: 'Candid, grainy, flash photography. Motion-blurred athletes. "Caught mid-rep" authenticity.',
    dosAndDonts: {
      dos: ['Neon-Noir cinematic aesthetic', 'Motion blur effects', 'Bold condensed typography', 'Real member photos'],
      donts: ['Generic gym stock photos', 'Corporate-safe branding', 'All-neon-everything', 'Static posed shots'],
    },
    canvasRecommendations: ['Gym branding', 'Event poster', 'Social media content', 'App UI'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. GAMING & ESPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'gaming-esports',
    name: 'Gaming & Esports',
    sector: 'Gaming & Entertainment',
    primaryTrend: 'neon-noir',
    secondaryTrend: 'micro-industrial',
    palette: {
      name: 'Dark Luxe',
      description: 'Near-black base + single vibrant accent + metallic/chrome.',
      primary: ['#0A0A0A', '#00D4FF', '#FF1744', '#FFD700'],
      accent: ['#00FF88', '#FF0066'],
      background: '#0D1117',
      text: '#FFFFFF',
    },
    typography: {
      heading: 'Bold condensed sans (Bebas Neue, Dharma Gothic, custom)',
      body: 'Geometric sans for supporting info',
      accent: 'Custom lettered display for tournaments',
      style: 'All-caps for impact. Type with integrated texture/material effects (chrome, neon, emboss).',
    },
    composition: [
      { name: 'Cinematic Depth', description: 'Layered compositions: foreground particles + midground character + atmospheric background.' },
      { name: 'Motion-First', description: 'Static design is insufficient. Every asset needs animated version.' },
      { name: '3D-Integrated', description: 'Blender Cycles renders integrated into 2D layouts.' },
    ],
    photographyDirection: 'Dramatic rim lighting on players. Particle effects. 3D character renders. Dark backgrounds with high-contrast focal elements.',
    dosAndDonts: {
      dos: ['Motion design as standard deliverable', 'Comprehensive brand systems', '3D-integrated designs', 'Social media-first formats'],
      donts: ['Flat minimal logos', 'Static-only assets', 'Pastel gaming palettes', 'Script/calligraphic fonts'],
    },
    canvasRecommendations: ['Tournament poster', 'Stream overlay', 'Team branding', 'Social media campaign'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. AUTOMOTIVE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'automotive',
    name: 'Automotive',
    sector: 'Automotive & Mobility',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'candid-camera-roll',
    palette: {
      name: 'EV Tech + Luxury',
      description: 'Electric blues for EV, jewel tones for luxury, earth tones for sustainability.',
      primary: ['#0066FF', '#00D4FF', '#2D6A4F', '#0A1128'],
      accent: ['#FFD700', '#C5A258'],
      background: '#0A0A0A',
      text: '#F0F0F0',
    },
    typography: {
      heading: 'Geometric sans (Montserrat Black, Bebas Neue)',
      body: 'Clean sans (Roboto, Inter)',
      accent: 'Custom display for brand identity',
      style: 'Bold, confident. High-contrast pairings. Variable fonts for responsive.',
    },
    composition: [
      { name: 'Cinematic CGI', description: 'Full CGI photorealism for car reveals. Dramatic environmental lighting.' },
      { name: 'Dynamic Personalization', description: 'Data-driven, user-specific visuals. 40% higher revenue (McKinsey).' },
      { name: 'Minimalist Maximalism', description: 'Clean foundation + one bold element.' },
    ],
    photographyDirection: 'Dramatic environmental lighting. Moody cinematic car-in-landscape. Detail close-ups. Drone/aerial.',
    dosAndDonts: {
      dos: ['Dynamic brand systems', 'EV-specific palettes', 'Sustainability-forward design', 'AR/VR showrooms'],
      donts: ['Generic "car on road" shots', 'Cold sterile all-gray palettes', 'Static identity systems', 'Neon-overload "future" aesthetics'],
    },
    canvasRecommendations: ['Car reveal poster', 'Social media ad', 'Dealership material', 'Auto show display'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. CRYPTO & WEB3
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'crypto-web3',
    name: 'Crypto & Web3',
    sector: 'Blockchain & Decentralized Finance',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'neon-noir',
    palette: {
      name: 'Dark + Neon Accent',
      description: 'Deep blacks + single neon accent. Jewel tones for NFT art.',
      primary: ['#0A0A0A', '#00D4FF', '#00FF88', '#FF1744'],
      accent: ['#FFD700', '#8B5CF6'],
      background: '#0A0A0A',
      text: '#F0F0F0',
    },
    typography: {
      heading: 'Grotesque sans (Satoshi, Cabinet Grotesk, General Sans)',
      body: 'Clean sans (DM Sans, Plus Jakarta Sans)',
      accent: 'Monospace (JetBrains Mono, IBM Plex Mono)',
      style: 'Code-native feel. Custom variable fonts. Bold display type as art.',
    },
    composition: [
      { name: 'Hash Aesthetics', description: 'Blockchain addresses, hash strings woven into brand patterns.' },
      { name: 'Generative Identity', description: 'SVG-native logos that work as on-chain NFTs.' },
      { name: 'Glassmorphism', description: 'Frosted glass panels over dark backgrounds for DeFi dashboards.' },
    ],
    photographyDirection: 'Hand-drawn elements for trust. Folk-inspired PFPs with deep lore. Animated/interactive NFTs.',
    dosAndDonts: {
      dos: ['Dark mode as default', 'Motion/animation in brand DNA', 'Monospace for data credibility', 'Community-contributed art'],
      donts: ['Generic crypto blue', 'Overused blue-purple gradients', 'Identical "futuristic" gradient blobs', 'Static logos'],
    },
    canvasRecommendations: ['Token landing page', 'NFT collection art', 'DeFi dashboard', 'Social media campaign'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. NGO & NONPROFIT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ngo-nonprofit',
    name: 'NGO & Nonprofit',
    sector: 'Social Impact & Charity',
    primaryTrend: 'elemental-folk',
    secondaryTrend: 'candid-camera-roll',
    palette: {
      name: 'Warm Earth + Hope',
      description: 'Earthy jewel tones for heritage. Romantic pastels for hope. High-contrast for urgency.',
      primary: ['#2D6A4F', '#8B0000', '#C5A258', '#F5F0E8'],
      accent: ['#FF6B6B', '#4ECDC4'],
      background: '#FAF7F4',
      text: '#2C2C2C',
    },
    typography: {
      heading: 'Historically-rooted typefaces with cultural significance',
      body: 'Clean readable sans',
      accent: 'Hand-drawn for grassroots orgs',
      style: 'Type-driven logos for credibility. Bold custom for advocacy. Warm serifs for trust.',
    },
    composition: [
      { name: 'Community-Centered', description: 'Build brand from ground up with beneficiary/staff participation.' },
      { name: 'Data + Story', description: 'Separate visual systems for data (Micro-Industrial) and storytelling (Candid).' },
      { name: 'Brand as Organizing Tool', description: 'Taglines as rallying cries. Logos on protest signs.' },
    ],
    photographyDirection: 'Candid, unstaged field photography. Grain and imperfection = trust. Real beneficiary stories.',
    dosAndDonts: {
      dos: ['Community-centered design process', 'Historically-rooted typefaces', 'Candid field photography', 'Accessible design'],
      donts: ['Corporate-safe templates', 'Generic stock diversity photos', 'Fear-based messaging without hope', 'Top-down rebrands'],
    },
    canvasRecommendations: ['Annual report', 'Fundraising campaign', 'Social media graphics', 'Event poster'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. LEGAL & PROFESSIONAL SERVICES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'legal-professional',
    name: 'Legal & Professional Services',
    sector: 'Professional Services',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'elemental-folk',
    palette: {
      name: 'Modern Authority',
      description: 'Deep navy + warm gold. Slate + terracotta for approachability.',
      primary: ['#1B2A4A', '#B8965A', '#4A6274', '#C4856A'],
      accent: ['#2C4A3E', '#8B9D83'],
      background: '#F5F2ED',
      text: '#1A1A1A',
    },
    typography: {
      heading: 'Modern serif (Freight, Tiempos, Lyon)',
      body: 'Clean sans (Inter, Söhne, Graphik)',
      accent: 'Monospace for data sections',
      style: 'Serif for authority + sans for readability. Oversized bold for hero moments.',
    },
    composition: [
      { name: 'Structured Hierarchy', description: 'Clean, organized layouts mirroring legal documentation precision.' },
      { name: 'Heritage Markers', description: '"Est. 1987," founding dates, years of experience prominently displayed.' },
      { name: 'Tactile Quality', description: 'Premium paper stocks, embossing, foil stamping on physical materials.' },
    ],
    photographyDirection: 'Candid, unstaged team photos. Natural lighting. Real office environments.',
    dosAndDonts: {
      dos: ['Modern serif typography', 'Rich jewel tone palettes', 'Premium tactile materials', 'QR codes as design features'],
      donts: ['Generic scales/gavels imagery', 'Default system fonts', 'Pure black-and-white only', 'Thin ultra-light weights'],
    },
    canvasRecommendations: ['Business card', 'Letterhead', 'Website hero', 'Presentation deck'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. SAAS & TECH STARTUPS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'saas-tech',
    name: 'SaaS & Tech Startups',
    sector: 'Technology & Software',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'frutiger-aero',
    palette: {
      name: 'Neutral + Bold Accent',
      description: 'Clean neutral base with one saturated accent. Soft gradients for optimism.',
      primary: ['#F7F9FC', '#2D7FF9', '#8B5CF6', '#0A0A0A'],
      accent: ['#00FF88', '#FF6B6B'],
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    typography: {
      heading: 'Bubbly rounded (Inter, Plus Jakarta Sans, General Sans)',
      body: 'Clean sans (DM Sans, Manrope)',
      accent: 'Monospace for code/technical (JetBrains Mono, Geist Mono)',
      style: 'Variable fonts for performance. Monospace breaking out of code blocks into brand identity.',
    },
    composition: [
      { name: 'Type-Only Heroes', description: 'Hero sections driven by typography alone — no image needed.' },
      { name: 'Interactive Demos', description: 'Live product demos embedded in landing page.' },
      { name: 'Role-Based Sections', description: 'Feature sections organized by user role.' },
    ],
    photographyDirection: 'Candid team photos. Custom illustrations over stock. Hand-drawn annotations on screenshots.',
    dosAndDonts: {
      dos: ['Benefit-driven headlines', '1-2 CTAs max', 'Transparent pricing', 'Interactive product demos'],
      donts: ['Feature-focused copy', '5+ navigation items', 'Stock photography', 'Generic "SaaS blue"'],
    },
    canvasRecommendations: ['Landing page hero', 'Pitch deck', 'App store screenshots', 'Blog graphics'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 21-37: Remaining categories (condensed format)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'podcast-audio',
    name: 'Podcast & Audio',
    sector: 'Audio & Media',
    primaryTrend: 'hyper-individualism',
    secondaryTrend: 'neon-noir',
    palette: { name: 'Genre-Coded', description: 'Red/orange for true crime, blue/green for business, bright for comedy.', primary: ['#E63946', '#2E5090', '#FFD700', '#0A0A0A'], accent: ['#00F0FF', '#FF1744'], background: '#0A0A0A', text: '#FFFFFF' },
    typography: { heading: 'Bold custom display, 5 words max', body: 'N/A — minimal text on cover art', accent: 'Genre-appropriate type', style: 'Must be readable at 55x55px phone thumbnail. High contrast non-negotiable.' },
    composition: [{ name: '55px First', description: 'Design for smallest display first. High contrast survives thumbnail compression.' }, { name: 'Genre Signaling', description: 'Use expected genre colors for instant recognition.' }],
    photographyDirection: 'Bold, expressive, artistic. Artist imagery, dramatic lighting. Genre-dependent.',
    dosAndDonts: { dos: ['Design for 55px thumbnail', 'Genre-appropriate signaling', '3000x3000px master file', 'Dark mode awareness'], donts: ['Overly busy covers', 'Episode numbers in main art', 'Microphone imagery as default', 'Thin fonts at small sizes'] },
    canvasRecommendations: ['Podcast cover (3000x3000)', 'Audiogram (1080x1920)', 'Episode art', 'Social media promo'],
  },

  {
    id: 'events-weddings',
    name: 'Events & Weddings',
    sector: 'Events & Celebrations',
    primaryTrend: 'hyper-bloom',
    secondaryTrend: 'tactile-craft',
    palette: { name: 'Romantic Botanical', description: 'Blush pinks, sky blues, meadow greens, buttercup yellows. Soft gradients.', primary: ['#F4C2C2', '#87CEEB', '#7CB342', '#FFD54F'], accent: ['#C5A258', '#B87333'], background: '#FAF7F4', text: '#2C2C2C' },
    typography: { heading: 'Hand-drawn calligraphy + clean sans-serif', body: 'Elegant serif or clean sans', accent: 'Folk-inspired ornamental type', style: 'Mix of script + sans-serif. Serif fonts back in wedding contexts.' },
    composition: [{ name: 'Botanical Maximalism', description: 'Dreamy, surreal floral compositions with soft gradients.' }, { name: 'Tactile Print', description: 'Letterpress, embossing, wax seals, textured stocks trending UP.' }],
    photographyDirection: 'Dreamy, hazy, romantic. "Gen Z blur" — out of focus but emotionally rich.',
    dosAndDonts: { dos: ['Hand-drawn elements', 'Soft romantic gradients', 'Tactile print finishes', 'Mixed typography'], donts: ['Ultra-slick digital minimalism', 'AI-perfect layouts', 'Neon-bright palettes', 'Standard rectangular formats only'] },
    canvasRecommendations: ['Wedding invitation', 'Event poster', 'Festival identity', 'Corporate event material'],
  },

  {
    id: 'architecture-interior',
    name: 'Architecture & Interior Design',
    sector: 'Architecture & Design',
    primaryTrend: 'tactile-craft',
    secondaryTrend: 'elemental-folk',
    palette: { name: 'Faded Splendor', description: 'Dark walnut, plum noir, persimmon. Pantone 2026 colors.', primary: ['#351E28', '#5C4033', '#FF5C34', '#AEB8A0'], accent: ['#C5A258', '#E9F056'], background: '#F5F0EB', text: '#1A1A1A' },
    typography: { heading: 'Refined serif with editorial weight', body: 'Warm sans-serif with humanist touches', accent: 'All-caps tracking for firm names', style: 'High-contrast modern serifs. Generous whitespace. Gallery-like confidence.' },
    composition: [{ name: 'Material Tension', description: 'Contrasting raw vs polished, natural stone vs lacquer.' }, { name: 'Color Drenching', description: 'Immersive monochromatic environments. 149% spike in Zillow mentions.' }],
    photographyDirection: 'Moody atmospheric lighting. Dark sultry tones. Material close-ups. "Lived-in" staging.',
    dosAndDonts: { dos: ['Dark wood tones (walnut, espresso)', 'Heritage narratives', 'Curved organic layouts', 'Social-media-optimized compositions'], donts: ['Bleached/white-washed wood', 'Cool grey everything', 'Rigid symmetric grids', 'PDF-only portfolios'] },
    canvasRecommendations: ['Portfolio page', 'Project presentation', 'Social media post', 'Brand identity'],
  },

  {
    id: 'film-cinema',
    name: 'Film & Cinema',
    sector: 'Film & Entertainment',
    primaryTrend: 'neon-noir',
    secondaryTrend: 'distorted-cut',
    palette: { name: 'Cinematic Noir', description: 'Dominant red + black + neon accents. Soft psychedelic for indie.', primary: ['#0A0A0A', '#FF0000', '#00F0FF', '#FFFFFF'], accent: ['#FFD700', '#8B5CF6'], background: '#0A0A0A', text: '#FFFFFF' },
    typography: { heading: 'Custom hand-lettered, distorted, experimental', body: 'Clean sans for supporting info', accent: 'Gothic + candy mix for Y2K', style: 'Typography as artwork. Variable fonts with animation for title sequences.' },
    composition: [{ name: 'Single Iconic Image', description: 'Strong singular visual metaphor over busy composites.' }, { name: 'Layered Depth', description: '2D/3D fusion creating dimensional impact.' }],
    photographyDirection: 'Cinematic chiaroscuro lighting. Motion blur. Single focal point with typographic hierarchy.',
    dosAndDonts: { dos: ['Custom/distorted typography', 'Neon-Noir palette', 'Motion blur effects', 'Candid BTS content'], donts: ['Floating heads composites', 'Generic geometric sans-serifs', 'Default "cinematic" fonts (Trajan)', 'One-size-fits-all templates'] },
    canvasRecommendations: ['Movie poster', 'Festival branding', 'Streaming thumbnail', 'Social media campaign'],
  },

  {
    id: 'magazine-editorial',
    name: 'Magazine & Editorial',
    sector: 'Publishing & Media',
    primaryTrend: 'tactile-craft',
    secondaryTrend: 'distorted-cut',
    palette: { name: 'Jewel Tones + Faded Film', description: 'Rich jewel tones for features. Faded film tones for candid.', primary: ['#2D6A4F', '#4A0E0E', '#C5A258', '#F5F0E8'], accent: ['#FF1744', '#00CED1'], background: '#FAF7F4', text: '#1A1A1A' },
    typography: { heading: 'Bold custom display, oversized', body: 'Clean readable serif or sans', accent: 'Hand-drawn scrawled captions', style: 'Typography as primary visual element. Mixed type families standard.' },
    composition: [{ name: 'Broken Grid', description: 'Asymmetric, overlapping, deliberately disrupted layouts.' }, { name: 'Collage Layering', description: 'Mixed textures, paper-cut edges, stitched borders.' }],
    photographyDirection: 'Grainy film, harsh flash, cropped frames. Distorted/fragmented portraiture.',
    dosAndDonts: { dos: ['Collage-based compositions', 'Bold expressive typography', 'Candid photography', 'Layered depth'], donts: ['Rigid 12-column uniformity', 'Over-polished studio photography', 'Flat single-layer layouts', 'Corporate templates'] },
    canvasRecommendations: ['Magazine cover', 'Feature spread', 'Newsletter header', 'Blog graphics'],
  },

  {
    id: 'packaging-design',
    name: 'Packaging Design',
    sector: 'Product & Packaging',
    primaryTrend: 'elemental-folk',
    secondaryTrend: 'tactile-craft',
    palette: { name: 'Earthy + Jewel', description: 'Rich jewel tones + earthy neutrals. Kraft and natural material tones.', primary: ['#2D6A4F', '#8B0000', '#C5A258', '#D4A373'], accent: ['#FFD700', '#C0C0C0'], background: '#F5F0EB', text: '#2C2C2C' },
    typography: { heading: 'Serif revival — authoritative, timeless', body: 'Clean sans for regulatory info', accent: 'Hand-engraved style for luxury', style: 'Serif fonts making major comeback. Heritage Etch for luxury. Apothecary for wellness.' },
    composition: [{ name: 'Material Honesty', description: 'Let kraft paper be kraft paper. Don\'t cover sustainable materials with glossy finishes.' }, { name: 'Narrative Pop', description: 'Words as main design element. Editorial layouts on packaging.' }],
    photographyDirection: 'Botanical illustrations. Hand-drawn elements. Material textures as design features.',
    dosAndDonts: { dos: ['Sustainable materials with premium aesthetics', 'QR codes as design features', 'Artist collaborations', 'Heritage craft details'], donts: ['Generic "eco" leaf logos', 'Glossy over-laminated finishes', 'Overdesigned cluttered labels', 'Single-use plastic aesthetics'] },
    canvasRecommendations: ['Product label', 'Box packaging', 'Bottle label', 'Shopping bag'],
  },

  {
    id: 'logo-brand-identity',
    name: 'Logo & Brand Identity',
    sector: 'Branding & Identity',
    primaryTrend: 'elemental-folk',
    secondaryTrend: 'hyper-individualism',
    palette: { name: 'Earthy Warmth + Rich Nocturnals', description: 'Oat/clay/sage for approachable. Midnight/forest/wine for premium.', primary: ['#D4A373', '#8B9D83', '#0A1128', '#2D4A3E'], accent: ['#C5A258', '#FF5C34'], background: '#F5F0EB', text: '#1A1A1A' },
    typography: { heading: 'Bespoke/custom serifs with personality', body: 'Clean sans for body text', accent: 'Hand-drawn/artisanal for warmth', style: 'Two poles: warm rounded (approachable) vs blackletter/gothic (dramatic). Middle ground of "clean corporate sans" is weakest.' },
    composition: [{ name: 'Morph-Marks', description: 'Animated/responsive logos. Motion-capable variant as standard.' }, { name: 'One Intentional Blip', description: 'Single off-move as signature — tilted shape, quirky gap, hand-drawn wobble.' }],
    photographyDirection: 'N/A for logos. For brand collateral: candid, authentic, imperfect.',
    dosAndDonts: { dos: ['Human imperfection', 'Warmth and tactility', 'Motion-capable logos', 'Multi-script versions'], donts: ['Hyper-polished samey logos', 'Cold corporate minimalism', 'Loud rainbow gradients', 'Static-only logos'] },
    canvasRecommendations: ['Logo design', 'Brand identity system', 'Business card', 'Brand guidelines'],
  },

  {
    id: 'email-newsletter',
    name: 'Email & Newsletter',
    sector: 'Email Marketing',
    primaryTrend: 'frutiger-aero',
    secondaryTrend: 'micro-industrial',
    palette: { name: 'Warm + Gradient Accent', description: 'Warm neutrals with soft gradient accents. Dark mode-aware.', primary: ['#F5F5F5', '#6CB4EE', '#7DD8C3', '#1A1A1A'], accent: ['#FF6B6B', '#4ECDC4'], background: '#FFFFFF', text: '#1A1A1A' },
    typography: { heading: 'Clean readable sans (16px+ body minimum)', body: 'System-safe web fonts', accent: 'Brand fonts in headers where supported', style: 'Live text over images. Semantic HTML structure. BLUF (Bottom Line Up Front).' },
    composition: [{ name: 'Single-Column Mobile', description: '64% of opens on mobile. Most reliable structure.' }, { name: 'One CTA', description: 'Reduce visual clutter. One clear action per email.' }],
    photographyDirection: 'Minimal imagery. Live text preferred. Compact, optimized images.',
    dosAndDonts: { dos: ['Mobile-first single-column', 'Dark mode optimization', 'BIMI logos', 'Modular content blocks'], donts: ['Full-screen hero images', 'Text baked into images', 'Hidden unsubscribe links', 'Multiple competing CTAs'] },
    canvasRecommendations: ['Email template', 'Newsletter header', 'Promotional email', 'Email signature'],
  },

  {
    id: 'landing-page-web',
    name: 'Landing Page & Web Design',
    sector: 'Web & Digital',
    primaryTrend: 'frutiger-aero',
    secondaryTrend: 'tactile-craft',
    palette: { name: 'Soft Gradient + Bold Accent', description: 'Soft gradients with bold accent colors. Neon glows for heroes.', primary: ['#F7F9FC', '#6CB4EE', '#7DD8C3', '#0A0A0A'], accent: ['#FF6B6B', '#8B5CF6'], background: '#FFFFFF', text: '#1A1A1A' },
    typography: { heading: 'Serifs everywhere — display + body', body: 'Clean readable sans (16-18px)', accent: 'Experimental display for hero sections', style: 'Type-only heroes. Serifs returning strongly. Variable fonts standard.' },
    composition: [{ name: 'Scrollytelling', description: 'Narrative-driven scroll experiences. Large images + text via animations.' }, { name: 'Dynamic Layouts', description: 'Off-grid, overlapping, asymmetric. Breaking rigid grids.' }],
    photographyDirection: 'Human scribble overlays. Candid photography. Hand-drawn elements as anti-AI authenticity.',
    dosAndDonts: { dos: ['Type-only hero sections', 'AI-powered personalization', 'Micro-interactions', 'Accessibility-first'], donts: ['Carousel/slider heroes', 'Auto-playing video with sound', 'Aggressive pop-ups', 'Generic "Learn More" CTAs'] },
    canvasRecommendations: ['Landing page hero', 'Feature section', 'Pricing page', 'About page'],
  },

  {
    id: 'ai-tech-companies',
    name: 'AI & Tech Companies',
    sector: 'Artificial Intelligence',
    primaryTrend: 'micro-industrial',
    secondaryTrend: 'frutiger-aero',
    palette: { name: 'Warm + Technical', description: 'Warm tones (peach, coral, earth) moving away from cold blue/purple AI cliché.', primary: ['#E8A598', '#A3B18A', '#6C5CE7', '#0A0A0A'], accent: ['#00F0FF', '#FFD700'], background: '#0A0A0A', text: '#F0F0F0' },
    typography: { heading: 'Custom display with personality', body: 'Clean sans (Inter, DM Sans)', accent: 'Monospace for developer tools', style: 'Sans serif + uppercase dominant but with increasing demand for custom/distinctive letterforms.' },
    composition: [{ name: 'Personality Over Polish', description: 'Distinctive beats perfect. A brand with quirks is more memorable.' }, { name: 'Technical Authenticity', description: 'Micro-Industrial for dev tools. Information-dense layouts.' }],
    photographyDirection: 'Candid, unstaged. Hand-drawn annotations. Mix polished product UI with raw human context.',
    dosAndDonts: { dos: ['Warm color palettes', 'Hand-drawn humanizing elements', 'Show real products/people', 'Distinctive brand identity'], donts: ['Generic AI brain imagery', 'Electric blue + white default', 'Abstract particle/network visuals', '"Powered by AI" as visual crutch'] },
    canvasRecommendations: ['Product landing page', 'Developer docs', 'Pitch deck', 'Conference branding'],
  },

  {
    id: 'sustainability-eco',
    name: 'Sustainability & Eco',
    sector: 'Environment & Sustainability',
    primaryTrend: 'elemental-folk',
    secondaryTrend: 'tactile-craft',
    palette: { name: 'Earthy Jewel + Carbon-Conscious', description: 'Rich jewel tones + earthy neutrals. Dark mode for carbon consciousness.', primary: ['#2D6A4F', '#8B0000', '#C5A258', '#D4A373'], accent: ['#FFD700', '#008080'], background: '#F5F0EB', text: '#2C2C2C' },
    typography: { heading: 'Rustic artisanal with handcrafted flair', body: 'Clean readable sans', accent: 'Hand-drawn for authenticity', style: 'Bold high-contrast for urgency. Editorial typography for storytelling.' },
    composition: [{ name: 'Transparency as Design', description: 'Micro-Industrial — barcodes, regulatory marks, ingredient lists as bold features.' }, { name: 'Zero-Waste Workflow', description: 'Modular systems, print-on-demand, carbon-conscious color choices.' }],
    photographyDirection: 'Real supply chain photography. Candid, imperfect. Show real people, real places, real data.',
    dosAndDonts: { dos: ['Specific data as design elements', 'Real photography over stock', 'Material honesty', 'Certification-forward design'], donts: ['Generic leaf/globe logos', 'All-green color schemes', 'Vague sustainability claims', 'Stock nature photography'] },
    canvasRecommendations: ['Brand identity', 'Packaging', 'Campaign poster', 'Impact report'],
  },

  {
    id: 'children-kids',
    name: 'Children & Kids',
    sector: 'Children & Family',
    primaryTrend: 'digi-cute',
    secondaryTrend: 'frutiger-aero',
    palette: { name: 'Bright Saturated + Gender-Neutral', description: 'Bright saturated primaries with soft gradients. Earth tones for organic.', primary: ['#FF7F6B', '#5BA4A4', '#F5C542', '#B8A9C9'], accent: ['#FF1744', '#00CED1'], background: '#FFF8F0', text: '#2C2C2C' },
    typography: { heading: 'Bubbly rounded sans (Nunito, Quicksand, Baloo)', body: 'Clean readable sans (16px+ minimum)', accent: 'Hand-drawn for celebrations', style: 'Rounded, friendly, screen-optimized. Dyslexia-friendly options standard.' },
    composition: [{ name: 'Character-Driven', description: 'Mascots and animated characters integrated into navigation and feedback.' }, { name: 'Soft Skeuomorphism', description: 'Buttons that look tactile and pressable. Textures mimicking real materials.' }],
    photographyDirection: 'Hand-drawn illustration dominance. Traditional media preferred. Inclusive representation.',
    dosAndDonts: { dos: ['Hand-drawn illustration', 'Gender-neutral palettes', 'Character-driven design', 'Inclusive representation'], donts: ['Overly polished AI art', 'Harsh neon palettes', 'Strict pink/blue coding', 'Generic clip-art'] },
    canvasRecommendations: ['Book cover', 'Toy packaging', 'App UI', 'Children\'s clothing'],
  },

  {
    id: 'luxury-premium',
    name: 'Luxury & Premium',
    sector: 'Luxury & High-End',
    primaryTrend: 'tactile-craft',
    secondaryTrend: 'elemental-folk',
    palette: { name: 'New Neutrals + Deep Dramatic', description: 'Warm ivory/taupe/charcoal for quiet luxury. Oxblood/midnight/gold for dramatic.', primary: ['#F5F0E8', '#B8AFA6', '#4A0E0E', '#0A1128'], accent: ['#C5A258', '#8B0000'], background: '#F5F0E8', text: '#1A1A1A' },
    typography: { heading: 'Custom bespoke serifs with subtle personality', body: 'Clean sans (Neue Haas Grotesk, Söhne)', accent: 'Hand-drawn artisanal scripts', style: 'High-contrast serif + clean sans pairings. Condensed tightly-tracked capitals. Ultra-thin whispers fading.' },
    composition: [{ name: 'Minimalist Maximalism', description: 'Clean foundation + ONE bold intricate element. Bottega Veneta approach.' }, { name: 'Restraint', description: 'One strong idea per composition. Earn every element. Silence speaks.' }],
    photographyDirection: 'Candid over composed. Film grain. Craft documentation. Close-ups of hands, tools, materials.',
    dosAndDonts: { dos: ['Visible craft and imperfection', 'Material honesty in packaging', 'Heritage as design language', 'Platform-fluid identities'], donts: ['AI-polished template perfection', 'Generic gold foil on everything', 'Excessive plastic/laminate', 'Neon for neon\'s sake'] },
    canvasRecommendations: ['Brand identity', 'Packaging', 'Campaign poster', 'Event invitation'],
  },

  {
    id: 'ecommerce-shopping',
    name: 'E-Commerce & Shopping',
    sector: 'Retail & Commerce',
    primaryTrend: 'candid-camera-roll',
    secondaryTrend: 'frutiger-aero',
    palette: { name: 'Bold Saturated + Gradient', description: 'Rich jewel tones, soft gradients, neutral + saturated accent.', primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'], accent: ['#FFEAA7', '#DDA0DD'], background: '#FFFFFF', text: '#2D3436' },
    typography: { heading: 'Bold custom type as artwork', body: 'Clean readable sans (16px+)', accent: 'Hand-drawn for authenticity', style: 'Big bold custom typefaces. Serif fonts returning. High-contrast pairings.' },
    composition: [{ name: 'Mobile-First Checkout', description: '76% of Gen Z discover on social. Digital wallets = 66% of spending.' }, { name: 'Personalization', description: '70%+ expect personalization. Drives 40% more revenue.' }],
    photographyDirection: 'Candid/unstaged product photography. Natural light. Contextual lifestyle shots. AI-generated backgrounds.',
    dosAndDonts: { dos: ['Candid product photography', 'Mobile-first wallet-integrated checkout', 'AI-powered recommendations', 'Storytelling through heritage'], donts: ['Cookie-cutter templates', 'Overly polished studio shots', 'Multi-step desktop checkout', 'Generic stock imagery'] },
    canvasRecommendations: ['Product listing', 'Sale banner', 'Social media ad', 'Email campaign'],
  },

  {
    id: 'social-media-influencers',
    name: 'Social Media Influencers & Creators',
    sector: 'Creator Economy',
    primaryTrend: 'candid-camera-roll',
    secondaryTrend: 'hyper-individualism',
    palette: { name: 'Soft Psychedelic + Romantic', description: 'Muted purples, warm corals, sage greens. Romantic pastels for beauty.', primary: ['#B8A9C9', '#E8A598', '#A3B18A', '#F4C2C2'], accent: ['#FF1744', '#00CED1'], background: '#FAF7F4', text: '#2C2C2C' },
    typography: { heading: 'Bold custom display type as artwork', body: 'Clean sans for body text', accent: 'Hand-drawn/scrawled captions', style: 'Instagram native fonts for casual. Custom display for professional. 3-5 color palette.' },
    composition: [{ name: 'Photo Dumps', description: 'Raw, unedited collections in carousel format (up to 20 images).' }, { name: 'Grid Curation', description: 'Preview feed before posting. Consistent visual identity.' }],
    photographyDirection: 'Grainy film, flash photography, "almost accidental." Blurred/out-of-focus for fashion.',
    dosAndDonts: { dos: ['Embrace imperfection', 'Consistent 3-5 color palette', 'Mobile-first design', 'Custom typography'], donts: ['Over-curated perfection', 'Generic Canva templates', 'Single-font boring branding', 'Ignoring platform formats'] },
    canvasRecommendations: ['Instagram post', 'Story template', 'Media kit', 'YouTube thumbnail'],
  },

  {
    id: 'music-concert-posters',
    name: 'Music & Concert Posters',
    sector: 'Music & Events',
    primaryTrend: 'neon-noir',
    secondaryTrend: 'hyper-individualism',
    palette: { name: 'Neon-Noir + Soft Psychedelic', description: 'Red/black/neon for urgency. Soft psychedelic for dreamy.', primary: ['#0A0A0A', '#FF0000', '#00F0FF', '#B8A9C9'], accent: ['#FFD700', '#FF1744'], background: '#0A0A0A', text: '#FFFFFF' },
    typography: { heading: 'Typography as artwork — custom, distorted, illustrative', body: 'Clean sans for details', accent: 'Hand-drawn scrawled text', style: 'Oversized bold type that functions as both text and artwork. Distorted letterforms.' },
    composition: [{ name: 'Underground Print Culture', description: 'Zine-like, rebellious, raw layouts influenced by punk and street culture.' }, { name: 'Layered Depth', description: 'Mixing 2D and 3D, combining flat and textured.' }],
    photographyDirection: 'High-quality photography deliberately chopped and distorted. Motion blur. Cinematic.',
    dosAndDonts: { dos: ['Psychedelic surrealism (soft palette)', 'Raw collage and angular cuts', 'Typography as art', 'Cultural identity in festival branding'], donts: ['AI-perfect sterile visuals', 'Over-saturated digital neons', 'Template-driven design', 'Corporate-clean layouts'] },
    canvasRecommendations: ['Concert poster', 'Festival identity', 'Tour poster', 'Social media promo'],
  },

  {
    id: 'dashboard-ui',
    name: 'Dashboard & UI Design',
    sector: 'User Interface & Experience',
    primaryTrend: 'frutiger-aero',
    secondaryTrend: 'micro-industrial',
    palette: { name: 'Soft Pastels + Semantic Tokens', description: 'Muted calming tones. Semantic color tokens. Dark mode as default.', primary: ['#F7F9FC', '#6CB4EE', '#A8D5BA', '#0A0A0F'], accent: ['#00FF88', '#FF6B6B'], background: '#0A0A0F', text: '#F0F0F0' },
    typography: { heading: 'Variable sans (Inter, Geist, Satoshi)', body: 'Clean sans (16-18px minimum)', accent: 'Monospace for data (JetBrains Mono)', style: 'Variable fonts with tabular figure variants. Serif renaissance for marketing pages.' },
    composition: [{ name: 'Bento Grid', description: 'Modular, card-based layouts. Self-contained widgets.' }, { name: 'Command Palette', description: 'Cmd+K universal search becoming standard.' }],
    photographyDirection: 'Minimal. Illustration for empty states. Data visualization as primary visual.',
    dosAndDonts: { dos: ['Dark mode as default', 'Token-first design systems', 'AI-narrated data insights', 'Progressive disclosure'], donts: ['Pure black (#000) backgrounds', '3D pie charts', 'Rigid 12-column grids', 'Light-only interfaces'] },
    canvasRecommendations: ['Dashboard layout', 'Analytics panel', 'Admin UI', 'Mobile app screen'],
  },
];

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

export function getCategoryById(id: string): DesignCategory | undefined {
  return DESIGN_CATEGORIES.find((c) => c.id === id);
}

export function getCategoriesBySector(sector: string): DesignCategory[] {
  return DESIGN_CATEGORIES.filter((c) => c.sector.toLowerCase().includes(sector.toLowerCase()));
}

export function getCategoriesByTrend(trend: TrendName): DesignCategory[] {
  return DESIGN_CATEGORIES.filter((c) => c.primaryTrend === trend || c.secondaryTrend === trend);
}

/**
 * Given a free-text intent from the user, find the best-matching category.
 * Uses keyword matching against category names, sectors, and trend keywords.
 */
export function matchCategoryFromIntent(intent: string): DesignCategory | undefined {
  const lower = intent.toLowerCase();

  // Direct name/ID match
  for (const cat of DESIGN_CATEGORIES) {
    if (lower.includes(cat.id) || lower.includes(cat.name.toLowerCase())) {
      return cat;
    }
  }

  // Sector keyword match
  const sectorKeywords: Record<string, string[]> = {
    'fintech': ['bank', 'finance', 'payment', 'crypto', 'defi', 'money', 'financial'],
    'streetwear': ['streetwear', 'fashion', 'clothing', 'apparel', 'wear', 'outfit'],
    'music-covers': ['album', 'cover art', 'music cover', 'single art', 'ep cover'],
    'book-covers': ['book', 'novel', 'ebook', 'audiobook', 'publishing'],
    'social-media-ads': ['ad', 'advertisement', 'social ad', 'promo', 'promotion'],
    'youtube-thumbnails': ['youtube', 'thumbnail', 'video cover'],
    'food-restaurant': ['food', 'restaurant', 'cafe', 'bakery', 'menu', 'dining', 'chef'],
    'real-estate': ['real estate', 'property', 'house', 'apartment', 'listing'],
    'healthcare': ['health', 'medical', 'hospital', 'pharma', 'wellness', 'doctor'],
    'education': ['education', 'school', 'university', 'course', 'learning', 'elearning'],
    'beauty-cosmetics': ['beauty', 'cosmetic', 'skincare', 'makeup', 'perfume', 'fragrance'],
    'travel-hospitality': ['travel', 'hotel', 'resort', 'tourism', 'airline', 'hospitality'],
    'sports-fitness': ['sport', 'fitness', 'gym', 'workout', 'athletic', 'training'],
    'gaming-esports': ['gaming', 'esports', 'game', 'twitch', 'stream'],
    'automotive': ['car', 'auto', 'vehicle', 'ev', 'automotive', 'dealership'],
    'crypto-web3': ['crypto', 'web3', 'blockchain', 'nft', 'defi', 'dao', 'token'],
    'ngo-nonprofit': ['ngo', 'nonprofit', 'charity', 'foundation', 'humanitarian'],
    'legal-professional': ['law', 'legal', 'lawyer', 'attorney', 'accounting', 'consulting'],
    'saas-tech': ['saas', 'startup', 'app', 'software', 'platform', 'tech startup'],
    'podcast-audio': ['podcast', 'audio', 'episode', 'show'],
    'events-weddings': ['wedding', 'event', 'festival', 'conference', 'party', 'invitation'],
    'architecture-interior': ['architecture', 'interior', 'architect', 'building'],
    'film-cinema': ['film', 'movie', 'cinema', 'poster', 'documentary'],
    'magazine-editorial': ['magazine', 'editorial', 'newspaper', 'publication'],
    'packaging-design': ['packaging', 'package', 'label', 'box', 'bottle'],
    'logo-brand-identity': ['logo', 'brand identity', 'branding', 'wordmark', 'monogram'],
    'email-newsletter': ['email', 'newsletter', 'mailer'],
    'landing-page-web': ['landing page', 'website', 'web design', 'hero section'],
    'ai-tech-companies': ['ai company', 'artificial intelligence', 'machine learning', 'ml'],
    'sustainability-eco': ['sustainable', 'eco', 'green', 'organic', 'environment'],
    'children-kids': ['children', 'kids', 'toy', 'nursery', 'baby', 'pediatric'],
    'luxury-premium': ['luxury', 'premium', 'high-end', 'exclusive', 'bespoke'],
    'ecommerce-shopping': ['ecommerce', 'e-commerce', 'shop', 'store', 'product'],
    'social-media-influencers': ['influencer', 'creator', 'personal brand', 'media kit'],
    'music-concert-posters': ['concert', 'gig', 'tour', 'live music', 'band'],
    'dashboard-ui': ['dashboard', 'ui', 'ux', 'admin panel', 'analytics'],
  };

  for (const [catId, keywords] of Object.entries(sectorKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return DESIGN_CATEGORIES.find((c) => c.id === catId);
    }
  }

  return undefined;
}
