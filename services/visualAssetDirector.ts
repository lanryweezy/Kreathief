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
      id: 'hero-fash-1',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
      alt: 'High Fashion Editorial Model in Dark Coat',
      author: 'Dom Hill',
      authorUrl: 'https://unsplash.com',
      tags: ['fashion', 'model', 'editorial', 'streetwear', 'couture'],
    },
  ],
  event: [
    {
      id: 'hero-evt-1',
      url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop',
      alt: 'Electronic Music Festival Stage and Crowd',
      author: 'Marcelo Chagas',
      authorUrl: 'https://unsplash.com',
      tags: ['event', 'concert', 'festival', 'dj', 'nightclub', 'rave'],
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
      url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop',
      alt: 'Developer Workspace with Code on Screen',
      author: 'Christopher Gower',
      authorUrl: 'https://unsplash.com',
      tags: ['saas', 'code', 'developer', 'software', 'tech'],
    },
  ],
  cyberpunk: [
    {
      id: 'hero-cyber-1',
      url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop',
      alt: 'Dark Neon Cyberpunk City Street at Night',
      author: 'Josh Rios',
      authorUrl: 'https://unsplash.com',
      tags: ['cyberpunk', 'neon', 'city', 'night', 'futuristic'],
    },
  ],
  food: [
    {
      id: 'hero-food-1',
      url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=400&auto=format&fit=crop',
      alt: 'Fresh Artisanal Coffee Latte Art',
      author: 'Nathan Dumlao',
      authorUrl: 'https://unsplash.com',
      tags: ['food', 'coffee', 'cafe', 'latte', 'restaurant'],
    },
    {
      id: 'hero-food-2',
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop',
      alt: 'Cozy Modern Restaurant Table Dining',
      author: 'Jason Leung',
      authorUrl: 'https://unsplash.com',
      tags: ['food', 'restaurant', 'dining', 'table'],
    },
  ],
  luxury: [
    {
      id: 'hero-lux-1',
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
      alt: 'Confident Portrait of Young Woman',
      author: 'Michael Dam',
      authorUrl: 'https://unsplash.com',
      tags: ['people', 'portrait', 'african', 'fashion', 'culture'],
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
      tags: ['editorial', 'architecture', 'minimalist', 'clean'],
    },
  ],
};

/**
 * Resolves the optimal photographic hero visual for a given design intent and archetype.
 */
export function resolveHeroPhoto(archetype: string, promptText?: string): VisualHeroAsset {
  const pLower = (promptText || '').toLowerCase();

  // 1. Direct archetype lookup
  const photos = ARCHETYPE_HERO_PHOTOS[archetype] || ARCHETYPE_HERO_PHOTOS.editorial;

  // 2. Keyword refinement if multiple photos available
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
    category: archetype,
    suggestedScrimOpacity: 0.65,
    dominantDarkTone: '#0a0a12',
  };
}
