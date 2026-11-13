/**
 * Visual Asset Director
 * Intelligently retrieves and matches high-resolution hero photographic assets
 * and visual textures for AI-generated graphic designs.
 */

import { CURATED_PHOTOS, BasePhoto } from './fallbackPhotos';

export interface VisualHeroAsset {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  author: string;
  aspectRatio: number; // width / height
  category: string;
  suggestedScrimOpacity: number; // 0.3 - 0.7 depending on photo brightness
  dominantDarkTone: string;
}

// Archetype aliases for cross-engine compatibility
const ARCHETYPE_ALIASES: Record<string, string> = {
  technology: 'saas',
  tech: 'saas',
  software: 'saas',
  cloud: 'saas',
  architecture: 'editorial',
  streetwear: 'fashion',
  music: 'event',
  concert: 'event',
  festival: 'event',
  dining: 'food',
  restaurant: 'food',
  grill: 'food',
  bbq: 'food',
  beauty: 'luxury',
  fragrance: 'luxury',
  perfume: 'luxury',
};

// Curated high-res hero photography registry mapped to archetypes
const ARCHETYPE_HERO_PHOTOS: Record<string, BasePhoto[]> = {
  fitness: [
    {
      id: 'hero-fit-1',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop',
      alt: 'Athletic Workout Training in Gym',
      author: 'Scott Webb',
      authorUrl: 'https://unsplash.com',
      tags: ['fitness', 'gym', 'workout', 'training', 'athlete', 'crossfit'],
    },
    {
      id: 'hero-fit-2',
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop',
      alt: 'Bodybuilder Deadlifting Barbell',
      author: 'Sven Mieke',
      authorUrl: 'https://unsplash.com',
      tags: ['fitness', 'powerlifting', 'gym', 'muscles', 'strength'],
    },
  ],
  realEstate: [
    {
      id: 'hero-re-1',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=400&auto=format&fit=crop',
      alt: 'Luxury Modern Villa Exterior with Pool',
      author: 'R ARCHITECTURE',
      authorUrl: 'https://unsplash.com',
      tags: ['realEstate', 'luxury', 'mansion', 'penthouse', 'villa', 'pool'],
    },
    {
      id: 'hero-re-2',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop',
      alt: 'Contemporary Luxury House Interior',
      author: 'Spacejoy',
      authorUrl: 'https://unsplash.com',
      tags: ['realEstate', 'interior', 'living room', 'architecture'],
    },
  ],
  fashion: [
    {
      id: 'hero-street-1',
      url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=400&auto=format&fit=crop',
      alt: 'Oversized Streetwear Hoodie Urban Model',
      author: 'Sam Burriss',
      authorUrl: 'https://unsplash.com',
      tags: ['fashion', 'streetwear', 'hoodie', 'boxy', 'oversized', 'urban', 'drop', 'cyberpunk', 'jacket'],
    },
    {
      id: 'hero-fash-1',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
      alt: 'High Fashion Editorial Model in Dark Coat',
      author: 'Dom Hill',
      authorUrl: 'https://unsplash.com',
      tags: ['fashion', 'model', 'editorial', 'streetwear', 'couture'],
    },
    {
      id: 'hero-fash-2',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
      alt: 'Avant-Garde Streetwear Fashion Model',
      author: 'Dom Hill',
      authorUrl: 'https://unsplash.com',
      tags: ['fashion', 'streetwear', 'apparel', 'clothing', 'drop'],
    },
  ],
  event: [
    {
      id: 'hero-evt-1',
      url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop',
      alt: 'Live Concert Stage Lighting and Night Crowd',
      author: 'Marcelo Chagas',
      authorUrl: 'https://unsplash.com',
      tags: ['event', 'concert', 'festival', 'stage', 'afrobeats', 'lagos', 'night', 'live', 'music', 'dj', 'rave'],
    },
    {
      id: 'hero-evt-2',
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop',
      alt: 'Electric Festival Crowd Celebration',
      author: 'Teddy Yang',
      authorUrl: 'https://unsplash.com',
      tags: ['event', 'celebration', 'party', 'festival', 'crowd', 'lights', 'energy'],
    },
  ],
  education: [
    {
      id: 'hero-edu-1',
      url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop',
      alt: 'Students Collaborating Around Laptop',
      author: 'Priscilla Du Preez',
      authorUrl: 'https://unsplash.com',
      tags: ['education', 'course', 'bootcamp', 'students', 'learning'],
    },
  ],
  ecommerce: [
    {
      id: 'hero-ecom-1',
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
      alt: 'Minimalist Smart Watch Product Showcase',
      author: 'Rachit Tank',
      authorUrl: 'https://unsplash.com',
      tags: ['ecommerce', 'product', 'sale', 'watch', 'tech'],
    },
  ],
  saas: [
    {
      id: 'hero-saas-1',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop',
      alt: 'Cloud Analytics and Performance Metrics Dashboard',
      author: 'Luke Chesser',
      authorUrl: 'https://unsplash.com',
      tags: ['saas', 'analytics', 'dashboard', 'cloud', 'data', 'charts', 'software', 'tech', 'ai'],
    },
    {
      id: 'hero-saas-2',
      url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop',
      alt: 'Developer Workspace with Code on Screen',
      author: 'Christopher Gower',
      authorUrl: 'https://unsplash.com',
      tags: ['saas', 'code', 'developer', 'software', 'tech', 'command'],
    },
  ],
  cyberpunk: [
    {
      id: 'hero-cyber-1',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&auto=format&fit=crop',
      alt: 'Futuristic Tokyo Cyberpunk Neon Street at Night',
      author: 'Aleksandar Pasaric',
      authorUrl: 'https://unsplash.com',
      tags: ['cyberpunk', 'neon', 'city', 'night', 'futuristic', 'tokyo', 'streetwear', 'lights'],
    },
    {
      id: 'hero-cyber-2',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop',
      alt: 'High-Tech Digital Cyber Core Circuit Matrix',
      author: 'Alexandre Debiève',
      authorUrl: 'https://unsplash.com',
      tags: ['cyberpunk', 'cyber', 'tech', 'circuit', 'digital', 'futuristic'],
    },
  ],
  food: [
    {
      id: 'hero-food-1',
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop',
      alt: 'Sizzling Firewood Charcoal Meat Skewers Grill Suya',
      author: 'Vincent Keiman',
      authorUrl: 'https://unsplash.com',
      tags: ['food', 'jollof', 'suya', 'grill', 'bbq', 'meat', 'skewers', 'smokey', 'fest', 'dinner', 'naija'],
    },
    {
      id: 'hero-food-2',
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
      alt: 'Rich Savory Culinary Gourmet Bowl and Rice',
      author: 'Farhad Ibrahimzade',
      authorUrl: 'https://unsplash.com',
      tags: ['food', 'rice', 'jollof', 'bowl', 'cuisine', 'fest', 'delicious', 'lunch'],
    },
    {
      id: 'hero-food-3',
      url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=400&auto=format&fit=crop',
      alt: 'Fresh Artisanal Coffee Latte Art',
      author: 'Nathan Dumlao',
      authorUrl: 'https://unsplash.com',
      tags: ['food', 'coffee', 'cafe', 'latte', 'restaurant'],
    },
  ],
  luxury: [
    {
      id: 'hero-lux-1',
      url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400&auto=format&fit=crop',
      alt: 'Artisanal Minimalist Fragrance and Perfume Studio',
      author: 'Laura Chouette',
      authorUrl: 'https://unsplash.com',
      tags: ['luxury', 'fragrance', 'perfume', 'bottle', 'minimalist', 'glass', 'studio', 'editorial'],
    },
    {
      id: 'hero-lux-2',
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&auto=format&fit=crop',
      alt: 'Luxury Beauty and Skincare Cosmetics Serum',
      author: 'Content Pixie',
      authorUrl: 'https://unsplash.com',
      tags: ['luxury', 'skincare', 'beauty', 'gold', 'cosmetics'],
    },
  ],
  africanMarket: [
    {
      id: 'hero-afro-1',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      alt: 'Confident Portrait of Young African Woman',
      author: 'Michael Dam',
      authorUrl: 'https://unsplash.com',
      tags: ['africanMarket', 'people', 'portrait', 'african', 'fashion', 'culture', 'lagos'],
    },
    {
      id: 'hero-afro-2',
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop',
      alt: 'Afrobeats Night Celebration Stage Energy',
      author: 'Yash Sharma',
      authorUrl: 'https://unsplash.com',
      tags: ['africanMarket', 'event', 'afrobeats', 'lagos', 'night', 'celebration', 'energy'],
    },
  ],
  editorial: [
    {
      id: 'hero-edit-1',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop',
      alt: 'Modern Architectural Skyscraper Glass Lines',
      author: 'Pierre Châtel-Innocenti',
      authorUrl: 'https://unsplash.com',
      tags: ['editorial', 'architecture', 'minimalist', 'clean', 'skyscraper'],
    },
    {
      id: 'hero-edit-2',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop',
      alt: 'Contemporary Minimalist Architecture Exhibition Interior',
      author: 'Spacejoy',
      authorUrl: 'https://unsplash.com',
      tags: ['editorial', 'architecture', 'interior', 'minimalist', 'gallery', 'exhibition'],
    },
  ],
};

/**
 * Generates a completely bespoke, prompt-derived visual hero asset as an SVG data URL.
 * Guarantees fresh, unique, high-aesthetic generative visuals for every prompt without
 * depending on external stock photo servers or repetitive static image lists.
 */
export function generateBespokeHeroAsset(
  promptText: string,
  archetype?: string,
  width = 1200,
  height = 800
): VisualHeroAsset {
  const pLower = promptText.toLowerCase();
  const normalizedArch = ARCHETYPE_ALIASES[archetype || ''] || archetype || 'editorial';

  // Deterministic seed hashing from prompt string
  let hash = 0;
  for (let i = 0; i < promptText.length; i++) {
    hash = (hash << 5) - hash + promptText.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  // Classify thematic domain
  const isHorology = pLower.includes('watch') || pLower.includes('timepiece') || pLower.includes('horology') || pLower.includes('chrono') || pLower.includes('luxury') || pLower.includes('jewel') || pLower.includes('perfume') || pLower.includes('fragrance');
  const isMusicFestival = pLower.includes('afrobeats') || pLower.includes('music') || pLower.includes('festival') || pLower.includes('concert') || pLower.includes('dj') || pLower.includes('dance') || pLower.includes('rave') || pLower.includes('sound') || pLower.includes('beats') || pLower.includes('lagos');
  const isTechSaas = pLower.includes('tech') || pLower.includes('software') || pLower.includes('saas') || pLower.includes('ai') || pLower.includes('cloud') || pLower.includes('data') || pLower.includes('analytics') || pLower.includes('cyber') || pLower.includes('code') || pLower.includes('neural');
  const isFashion = pLower.includes('fashion') || pLower.includes('streetwear') || pLower.includes('hoodie') || pLower.includes('model') || pLower.includes('runway') || pLower.includes('couture') || pLower.includes('apparel');
  const isFood = pLower.includes('food') || pLower.includes('culinary') || pLower.includes('restaurant') || pLower.includes('coffee') || pLower.includes('dining') || pLower.includes('chef') || pLower.includes('gourmet') || pLower.includes('dish') || pLower.includes('grill') || pLower.includes('jollof') || pLower.includes('bakery');
  const isRealEstate = pLower.includes('real estate') || pLower.includes('architecture') || pLower.includes('villa') || pLower.includes('mansion') || pLower.includes('interior') || pLower.includes('penthouse') || pLower.includes('sanctuary') || pLower.includes('property');
  const isFitness = pLower.includes('fitness') || pLower.includes('gym') || pLower.includes('workout') || pLower.includes('training') || pLower.includes('sport') || pLower.includes('athlete') || pLower.includes('crossfit') || pLower.includes('power');

  // Palette configuration based on domain
  let bgDark = '#090a0f';
  let primary = '#38bdf8';
  let secondary = '#6366f1';
  let accent = '#a855f7';
  let glow = 'rgba(56, 189, 248, 0.4)';
  let themeName = 'GENERATIVE ARTWORK';

  if (isHorology) {
    bgDark = '#0a0805';
    primary = '#d4af37';
    secondary = '#f5ecd7';
    accent = '#b45309';
    glow = 'rgba(212, 175, 55, 0.35)';
    themeName = 'HAUTE HOROLOGIE';
  } else if (isMusicFestival) {
    bgDark = '#0e0417';
    primary = '#f59e0b';
    secondary = '#ec4899';
    accent = '#10b981';
    glow = 'rgba(245, 158, 11, 0.45)';
    themeName = 'SONIC STAGE';
  } else if (isTechSaas) {
    bgDark = '#050b14';
    primary = '#00f0ff';
    secondary = '#3b82f6';
    accent = '#6366f1';
    glow = 'rgba(0, 240, 255, 0.35)';
    themeName = 'SYNAPSE MATRIX';
  } else if (isFashion) {
    bgDark = '#080809';
    primary = '#ffffff';
    secondary = '#ff2d55';
    accent = '#71717a';
    glow = 'rgba(255, 45, 85, 0.3)';
    themeName = 'ATELIER EDITORIAL';
  } else if (isFood) {
    bgDark = '#140803';
    primary = '#ea580c';
    secondary = '#f59e0b';
    accent = '#fbbf24';
    glow = 'rgba(234, 88, 12, 0.4)';
    themeName = 'ARTISAN GASTRONOMY';
  } else if (isRealEstate) {
    bgDark = '#09131a';
    primary = '#c8a87c';
    secondary = '#38bdf8';
    accent = '#10b981';
    glow = 'rgba(200, 168, 124, 0.35)';
    themeName = 'ARCHITECTURAL RESIDENCE';
  } else if (isFitness) {
    bgDark = '#080a10';
    primary = '#ff3344';
    secondary = '#ccff00';
    accent = '#38bdf8';
    glow = 'rgba(255, 51, 68, 0.4)';
    themeName = 'KINETIC VELOCITY';
  }

  const cleanTitle = promptText.slice(0, 48).replace(/["<>&]/g, '');
  const cx = width * 0.5;
  const cy = height * 0.48;

  let domainSvgMarkup = '';

  if (isHorology) {
    // Intricate luxury watch tourbillon and chronometer dial geometry
    domainSvgMarkup = `
      <circle cx="${cx}" cy="${cy}" r="${height * 0.34}" fill="none" stroke="${primary}" stroke-width="3" opacity="0.85"/>
      <circle cx="${cx}" cy="${cy}" r="${height * 0.31}" fill="${bgDark}" stroke="${primary}" stroke-width="1.5" stroke-dasharray="2 6"/>
      <circle cx="${cx}" cy="${cy}" r="${height * 0.28}" fill="none" stroke="${secondary}" stroke-width="1" opacity="0.4"/>
      <!-- Hour markers -->
      ${Array.from({ length: 12 }).map((_, i) => {
        const rad = (i * 30 * Math.PI) / 180;
        const x1 = cx + Math.sin(rad) * (height * 0.28);
        const y1 = cy - Math.cos(rad) * (height * 0.28);
        const x2 = cx + Math.sin(rad) * (height * 0.24);
        const y2 = cy - Math.cos(rad) * (height * 0.24);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${primary}" stroke-width="${i % 3 === 0 ? 3 : 1.5}" stroke-linecap="round"/>`;
      }).join('\n')}
      <!-- Sub-dials -->
      <circle cx="${cx - height * 0.1}" cy="${cy}" r="${height * 0.08}" fill="none" stroke="${primary}" stroke-width="1" opacity="0.6"/>
      <circle cx="${cx + height * 0.1}" cy="${cy}" r="${height * 0.08}" fill="none" stroke="${primary}" stroke-width="1" opacity="0.6"/>
      <!-- Watch hands -->
      <line x1="${cx}" y1="${cy}" x2="${cx + height * 0.14}" y2="${cy - height * 0.1}" stroke="${secondary}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="${cx}" y1="${cy}" x2="${cx - height * 0.06}" y2="${cy - height * 0.18}" stroke="${primary}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="${primary}"/>
    `;
  } else if (isMusicFestival) {
    // Stage spotlight beams, audio waveforms, and festival energy bursts
    domainSvgMarkup = `
      <!-- Spotlight cones -->
      <polygon points="${cx},${height * 0.05} ${cx - width * 0.38},${height} ${cx - width * 0.08},${height}" fill="url(#beamGrad1)" opacity="0.35"/>
      <polygon points="${cx},${height * 0.05} ${cx + width * 0.08},${height} ${cx + width * 0.38},${height}" fill="url(#beamGrad2)" opacity="0.35"/>
      <!-- Equalizer ripple rings -->
      <circle cx="${cx}" cy="${cy}" r="${height * 0.32}" fill="none" stroke="${primary}" stroke-width="2" stroke-dasharray="12 8" opacity="0.5"/>
      <circle cx="${cx}" cy="${cy}" r="${height * 0.24}" fill="none" stroke="${secondary}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
      <circle cx="${cx}" cy="${cy}" r="${height * 0.16}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.8"/>
      <!-- Audio bars -->
      ${Array.from({ length: 24 }).map((_, i) => {
        const barH = 20 + ((posHash + i * 17) % 110);
        const bx = cx - 240 + i * 20;
        return `<rect x="${bx}" y="${cy + 60 - barH / 2}" width="10" height="${barH}" rx="5" fill="${i % 2 === 0 ? primary : secondary}" opacity="0.85"/>`;
      }).join('\n')}
      <circle cx="${cx}" cy="${cy}" r="${height * 0.08}" fill="${primary}" opacity="0.2"/>
    `;
  } else if (isTechSaas) {
    // 3D perspective cyber grid, neural network nodes, and holographic data arcs
    domainSvgMarkup = `
      <!-- Neural graph nodes -->
      <line x1="${cx - 180}" y1="${cy - 70}" x2="${cx}" y2="${cy - 120}" stroke="${primary}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
      <line x1="${cx}" y1="${cy - 120}" x2="${cx + 180}" y2="${cy - 70}" stroke="${primary}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
      <line x1="${cx - 180}" y1="${cy - 70}" x2="${cx - 100}" y2="${cy + 80}" stroke="${secondary}" stroke-width="1.5" opacity="0.5"/>
      <line x1="${cx + 180}" y1="${cy - 70}" x2="${cx + 100}" y2="${cy + 80}" stroke="${secondary}" stroke-width="1.5" opacity="0.5"/>
      <line x1="${cx - 100}" y1="${cy + 80}" x2="${cx + 100}" y2="${cy + 80}" stroke="${primary}" stroke-width="2" opacity="0.7"/>
      <!-- Nodes -->
      <circle cx="${cx}" cy="${cy - 120}" r="14" fill="${primary}" filter="url(#dropGlow)"/>
      <circle cx="${cx - 180}" cy="${cy - 70}" r="10" fill="${secondary}"/>
      <circle cx="${cx + 180}" cy="${cy - 70}" r="10" fill="${secondary}"/>
      <circle cx="${cx - 100}" cy="${cy + 80}" r="12" fill="${accent}"/>
      <circle cx="${cx + 100}" cy="${cy + 80}" r="12" fill="${accent}"/>
      <!-- Holographic arcs -->
      <path d="M ${cx - 140} ${cy} A 140 140 0 0 1 ${cx + 140} ${cy}" fill="none" stroke="${primary}" stroke-width="2" stroke-dasharray="8 6"/>
      <path d="M ${cx - 200} ${cy + 30} A 200 200 0 0 1 ${cx + 200} ${cy + 30}" fill="none" stroke="${secondary}" stroke-width="1.5" opacity="0.4"/>
    `;
  } else if (isFood) {
    // Artisanal ceramic platter, ascending aroma curves, and culinary emblem
    domainSvgMarkup = `
      <circle cx="${cx}" cy="${cy + 20}" r="${height * 0.32}" fill="none" stroke="${primary}" stroke-width="3" opacity="0.75"/>
      <circle cx="${cx}" cy="${cy + 20}" r="${height * 0.28}" fill="${bgDark}" stroke="${secondary}" stroke-width="1.5" opacity="0.9"/>
      <circle cx="${cx}" cy="${cy + 20}" r="${height * 0.22}" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="10 5" opacity="0.6"/>
      <!-- Rising aroma / smoke curves -->
      <path d="M ${cx - 40} ${cy + 20} Q ${cx - 70} ${cy - 70} ${cx - 20} ${cy - 140}" fill="none" stroke="${primary}" stroke-width="3" stroke-linecap="round" opacity="0.65"/>
      <path d="M ${cx} ${cy + 10} Q ${cx + 30} ${cy - 80} ${cx} ${cy - 160}" fill="none" stroke="${secondary}" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>
      <path d="M ${cx + 40} ${cy + 20} Q ${cx + 70} ${cy - 70} ${cx + 25} ${cy - 130}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <!-- Culinary center seal -->
      <circle cx="${cx}" cy="${cy + 20}" r="22" fill="${primary}" opacity="0.25"/>
      <circle cx="${cx}" cy="${cy + 20}" r="10" fill="${primary}"/>
    `;
  } else if (isRealEstate) {
    // Architectural elevation perspectives, structural frames, and sunset horizon
    domainSvgMarkup = `
      <!-- Horizon -->
      <line x1="${width * 0.1}" y1="${cy + 100}" x2="${width * 0.9}" y2="${cy + 100}" stroke="${primary}" stroke-width="1.5" opacity="0.4"/>
      <!-- Architectural residence silhouettes -->
      <polygon points="${cx - 240},${cy + 100} ${cx - 240},${cy - 80} ${cx - 60},${cy - 80} ${cx - 60},${cy + 100}" fill="${bgDark}" stroke="${primary}" stroke-width="2.5"/>
      <polygon points="${cx - 80},${cy + 100} ${cx - 80},${cy - 140} ${cx + 180},${cy - 140} ${cx + 180},${cy + 100}" fill="${bgDark}" stroke="${secondary}" stroke-width="2.5"/>
      <polygon points="${cx + 140},${cy + 100} ${cx + 140},${cy - 40} ${cx + 260},${cy - 40} ${cx + 260},${cy + 100}" fill="${bgDark}" stroke="${primary}" stroke-width="2"/>
      <!-- Cantilever glass windows -->
      <rect x="${cx - 50}" y="${cy - 120}" width="90" height="50" fill="${primary}" opacity="0.25"/>
      <rect x="${cx + 60}" y="${cy - 120}" width="90" height="50" fill="${secondary}" opacity="0.25"/>
      <circle cx="${cx + 180}" cy="${cy - 170}" r="32" fill="${accent}" opacity="0.3"/>
    `;
  } else if (isFitness) {
    // High-velocity kinetic vectors, biometric pulse, and dynamic chevron angles
    domainSvgMarkup = `
      <!-- Dynamic chevrons -->
      <polygon points="${cx - 160},${cy - 90} ${cx - 100},${cy} ${cx - 160},${cy + 90} ${cx - 120},${cy + 90} ${cx - 60},${cy} ${cx - 120},${cy - 90}" fill="${primary}" opacity="0.85"/>
      <polygon points="${cx - 60},${cy - 90} ${cx},${cy} ${cx - 60},${cy + 90} ${cx - 20},${cy + 90} ${cx + 40},${cy} ${cx - 20},${cy - 90}" fill="${secondary}" opacity="0.9"/>
      <polygon points="${cx + 40},${cy - 90} ${cx + 100},${cy} ${cx + 40},${cy + 90} ${cx + 80},${cy + 90} ${cx + 140},${cy} ${cx + 80},${cy - 90}" fill="${primary}" opacity="0.85"/>
      <!-- Biometric pulse wave -->
      <path d="M ${width * 0.1} ${cy + 110} L ${cx - 100} ${cy + 110} L ${cx - 60} ${cy + 60} L ${cx - 20} ${cy + 150} L ${cx + 20} ${cy + 40} L ${cx + 60} ${cy + 110} L ${width * 0.9} ${cy + 110}" fill="none" stroke="${secondary}" stroke-width="3" stroke-linecap="round"/>
    `;
  } else {
    // Abstract editorial geometry with harmonic circles and glass reflections
    domainSvgMarkup = `
      <circle cx="${cx}" cy="${cy}" r="${height * 0.32}" fill="none" stroke="${primary}" stroke-width="2" stroke-dasharray="16 10"/>
      <circle cx="${cx}" cy="${cy}" r="${height * 0.24}" fill="url(#meshGlow)" opacity="0.5"/>
      <polygon points="${cx},${cy - height * 0.26} ${cx + width * 0.16},${cy + height * 0.14} ${cx - width * 0.16},${cy + height * 0.14}" fill="none" stroke="${secondary}" stroke-width="2"/>
      <circle cx="${cx + width * 0.18}" cy="${cy - height * 0.12}" r="18" fill="${primary}" opacity="0.7"/>
      <circle cx="${cx - width * 0.2}" cy="${cy + height * 0.1}" r="12" fill="${accent}" opacity="0.8"/>
    `;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgDark}" />
      <stop offset="60%" stop-color="#050508" />
      <stop offset="100%" stop-color="${bgDark}" />
    </linearGradient>
    <radialGradient id="meshGlow" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.45" />
      <stop offset="50%" stop-color="${secondary}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="${bgDark}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="beamGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0"/>
    </linearGradient>
    <filter id="dropGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Canvas Backdrop -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${height}" fill="url(#meshGlow)"/>

  <!-- Thematic Visual Subject -->
  <g id="hero-generative-subject">
    ${domainSvgMarkup}
  </g>

  <!-- Architectural Studio Watermark and Coordinate Seal -->
  <g transform="translate(0, ${height * 0.82})">
    <rect x="${width * 0.08}" y="0" width="${width * 0.84}" height="${height * 0.12}" rx="12" fill="${bgDark}" fill-opacity="0.8" stroke="${primary}" stroke-width="1" stroke-opacity="0.35"/>
    <text x="${width * 0.12}" y="${height * 0.055}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(14, Math.round(width * 0.016))}" font-weight="800" fill="#ffffff" letter-spacing="1">
      ${cleanTitle.toUpperCase()}
    </text>
    <text x="${width * 0.12}" y="${height * 0.088}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(10, Math.round(width * 0.011))}" font-weight="600" fill="${primary}" letter-spacing="2" opacity="0.9">
      ${themeName} // BESPOKE GENERATIVE ASSET // ID #${posHash.toString(16).toUpperCase()}
    </text>
    <circle cx="${width * 0.88}" cy="${height * 0.06}" r="6" fill="${accent}"/>
  </g>
</svg>
`.trim();

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    id: `bespoke-hero-${posHash}`,
    url: dataUrl,
    thumbnail: dataUrl,
    alt: `Bespoke AI Graphic: ${cleanTitle}`,
    author: 'Kreathief Generative Studio',
    aspectRatio: width / height,
    category: normalizedArch,
    suggestedScrimOpacity: 0.55,
    dominantDarkTone: bgDark,
  };
}

/**
 * Resolves the optimal hero visual for a given design intent and archetype.
 * Prioritizes dynamic, bespoke prompt-generated visuals over canned stock photos
 * to guarantee unique, on-brief assets on every generation run.
 */
export function resolveHeroPhoto(archetype: string, promptText?: string): VisualHeroAsset {
  const pTrim = (promptText || '').trim();

  // If a descriptive prompt is supplied, synthesize a fresh, bespoke AI asset
  // directly tailored to the prompt's semantics rather than pulling static stock photos.
  if (pTrim.length >= 3) {
    return generateBespokeHeroAsset(pTrim, archetype);
  }

  const pLower = pTrim.toLowerCase();
  const normalizedArch = ARCHETYPE_ALIASES[archetype] || archetype;

  // 1. High-confidence cross-archetype keyword scan (e.g. food, perfume, hoodie, dashboard keywords)
  const allPhotos = Object.values(ARCHETYPE_HERO_PHOTOS).flat();
  let bestKeywordPhoto: BasePhoto | null = null;
  let bestMatchScore = 0;

  for (const photo of allPhotos) {
    let score = 0;
    for (const tag of photo.tags) {
      if (pLower.includes(tag.toLowerCase())) {
        if (['jollof', 'suya', 'grill', 'bbq', 'rice', 'fragrance', 'perfume', 'hoodie', 'streetwear', 'dashboard', 'analytics', 'afrobeats'].includes(tag.toLowerCase())) {
          score += 4;
        } else {
          score += 1;
        }
      }
    }
    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestKeywordPhoto = photo;
    }
  }

  if (bestKeywordPhoto && bestMatchScore >= 3) {
    return {
      id: bestKeywordPhoto.id,
      url: bestKeywordPhoto.url,
      thumbnail: bestKeywordPhoto.thumbnail,
      alt: bestKeywordPhoto.alt,
      author: bestKeywordPhoto.author,
      aspectRatio: 1.5,
      category: normalizedArch,
      suggestedScrimOpacity: 0.65,
      dominantDarkTone: '#0a0a12',
    };
  }

  // 2. Archetype lookup with keyword refinement
  const photos = ARCHETYPE_HERO_PHOTOS[normalizedArch] || ARCHETYPE_HERO_PHOTOS.editorial;
  let matchedPhoto = photos[0];
  for (const photo of photos) {
    if (photo.tags.some((tag) => pLower.includes(tag))) {
      matchedPhoto = photo;
      break;
    }
  }

  // 3. Fallback search across global CURATED_PHOTOS if no archetype photo matched
  if (!matchedPhoto) {
    const globalMatch = CURATED_PHOTOS.find((p) => p.tags.some((t) => pLower.includes(t)));
    if (globalMatch) {
      matchedPhoto = globalMatch;
    } else {
      matchedPhoto = CURATED_PHOTOS[0];
    }
  }

  return {
    id: matchedPhoto.id,
    url: matchedPhoto.url,
    thumbnail: matchedPhoto.thumbnail,
    alt: matchedPhoto.alt,
    author: matchedPhoto.author,
    aspectRatio: 1.5,
    category: normalizedArch,
    suggestedScrimOpacity: 0.65,
    dominantDarkTone: '#0a0a12',
  };
}

/**
 * Ranked, de-duplicated hero photo candidates relevant to an archetype/prompt.
 * Keyword-matched photos come first (by score), then the archetype pool.
 * Used by the creative variation engine so repeated generations rotate imagery.
 */
export function listHeroPhotoCandidates(archetype: string, promptText?: string): VisualHeroAsset[] {
  const pLower = (promptText || '').toLowerCase();
  const normalizedArch = ARCHETYPE_ALIASES[archetype] || archetype;
  const scored = Object.values(ARCHETYPE_HERO_PHOTOS)
    .flat()
    .map((photo) => ({
      photo,
      score: photo.tags.reduce((s, tag) => (pLower.includes(tag.toLowerCase()) ? s + 1 : s), 0),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((p) => p.photo);
  const pool = ARCHETYPE_HERO_PHOTOS[normalizedArch] || ARCHETYPE_HERO_PHOTOS.editorial || [];
  const seen = new Set<string>();
  const ordered: BasePhoto[] = [];
  for (const photo of [...scored, ...pool]) {
    if (photo && !seen.has(photo.id)) {
      seen.add(photo.id);
      ordered.push(photo);
    }
  }
  return ordered.map((p) => ({
    id: p.id,
    url: p.url,
    thumbnail: p.thumbnail,
    alt: p.alt,
    author: p.author,
    aspectRatio: 1.5,
    category: normalizedArch,
    suggestedScrimOpacity: 0.65,
    dominantDarkTone: '#0a0a12',
  }));
}
