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
 * Resolves the optimal photographic hero visual for a given design intent and archetype.
 */
export function resolveHeroPhoto(archetype: string, promptText?: string): VisualHeroAsset {
  const pLower = (promptText || '').toLowerCase();
  const normalizedArch = ARCHETYPE_ALIASES[archetype] || archetype;

  // 1. High-confidence cross-archetype keyword scan (e.g. food, perfume, hoodie, dashboard keywords)
  const allPhotos = Object.values(ARCHETYPE_HERO_PHOTOS).flat();
  let bestKeywordPhoto: BasePhoto | null = null;
  let bestMatchScore = 0;

  for (const photo of allPhotos) {
    let score = 0;
    for (const tag of photo.tags) {
      if (pLower.includes(tag.toLowerCase())) {
        // Boost priority for ultra-distinct semantic anchors
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

  // If we found a strong keyword match (score >= 3), prioritize it over loose archetype defaults
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
