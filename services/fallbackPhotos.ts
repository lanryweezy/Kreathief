/**
 * Fallback curated stock photo library for offline and standalone dev environments.
 * Provides high-resolution, CORS-safe photography across multiple categories when server APIs are unavailable.
 */

export interface BasePhoto {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  author: string;
  authorUrl: string;
  tags: string[];
}

export const CURATED_PHOTOS: BasePhoto[] = [
  {
    id: 'fp-101',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
    alt: 'Majestic Mountain Peak Landscape',
    author: 'Eberhard Grossgasteiger',
    authorUrl: 'https://unsplash.com',
    tags: [
      'mountain',
      'nature',
      'landscape',
      'peak',
      'sky',
      'clouds',
      'snow',
      'outdoors',
      'scenic',
      'trending',
      'curated',
      'abstract',
    ],
  },
  {
    id: 'fp-102',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop',
    alt: 'Tropical Beach Sunset Ocean',
    author: 'Sean Oulashin',
    authorUrl: 'https://unsplash.com',
    tags: [
      'beach',
      'ocean',
      'water',
      'sea',
      'sunset',
      'sky',
      'nature',
      'summer',
      'sand',
      'tropical',
      'trending',
      'curated',
    ],
  },
  {
    id: 'fp-103',
    url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=400&auto=format&fit=crop',
    alt: 'Mystical Green Forest Mist',
    author: 'Casey Horner',
    authorUrl: 'https://unsplash.com',
    tags: ['forest', 'trees', 'green', 'nature', 'mist', 'fog', 'woods', 'landscape', 'outdoor', 'trending', 'curated'],
  },
  {
    id: 'fp-104',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop',
    alt: 'Modern Skyscraper Architecture Glass',
    author: 'Pierre Châtel-Innocenti',
    authorUrl: 'https://unsplash.com',
    tags: [
      'architecture',
      'city',
      'building',
      'skyscraper',
      'modern',
      'urban',
      'business',
      'glass',
      'sky',
      'trending',
      'curated',
    ],
  },
  {
    id: 'fp-105',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    alt: 'Portrait of Young Woman Smiling',
    author: 'Michael Dam',
    authorUrl: 'https://unsplash.com',
    tags: ['people', 'portrait', 'woman', 'face', 'smile', 'model', 'fashion', 'human', 'happy', 'trending', 'curated'],
  },
  {
    id: 'fp-106',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop',
    alt: 'Portrait of Serious Young Man',
    author: 'Warren Wong',
    authorUrl: 'https://unsplash.com',
    tags: ['people', 'portrait', 'man', 'male', 'face', 'human', 'fashion', 'trending', 'curated'],
  },
  {
    id: 'fp-107',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop',
    alt: 'Laptop Code Developer Workspace',
    author: 'Christopher Gower',
    authorUrl: 'https://unsplash.com',
    tags: [
      'technology',
      'computer',
      'laptop',
      'code',
      'coding',
      'developer',
      'office',
      'workspace',
      'business',
      'work',
      'trending',
      'curated',
    ],
  },
  {
    id: 'fp-108',
    url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=400&auto=format&fit=crop',
    alt: 'Fresh Coffee Latte Art Cafe',
    author: 'Nathan Dumlao',
    authorUrl: 'https://unsplash.com',
    tags: ['food', 'coffee', 'latte', 'cafe', 'drink', 'morning', 'cup', 'breakfast', 'trending', 'curated'],
  },
  {
    id: 'fp-109',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400&auto=format&fit=crop',
    alt: 'Cute Golden Retriever Dog',
    author: 'Charles Deluvio',
    authorUrl: 'https://unsplash.com',
    tags: ['animal', 'dog', 'pet', 'puppy', 'cute', 'golden retriever', 'trending', 'curated'],
  },
  {
    id: 'fp-110',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400&auto=format&fit=crop',
    alt: 'Curious Domestic Cat',
    author: 'Manja Vitolic',
    authorUrl: 'https://unsplash.com',
    tags: ['animal', 'cat', 'pet', 'kitten', 'cute', 'feline', 'trending', 'curated'],
  },
  {
    id: 'fp-111',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=400&auto=format&fit=crop',
    alt: 'Vibrant Abstract Color Gradient',
    author: 'Milad Fakurian',
    authorUrl: 'https://unsplash.com',
    tags: [
      'abstract',
      'gradient',
      'color',
      'background',
      'texture',
      'art',
      'colorful',
      'design',
      'trending',
      'curated',
    ],
  },
  {
    id: 'fp-112',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop',
    alt: 'Dark Cyberpunk Neon City Night',
    author: 'Josh Rios',
    authorUrl: 'https://unsplash.com',
    tags: [
      'city',
      'night',
      'neon',
      'dark',
      'cyberpunk',
      'street',
      'urban',
      'lights',
      'trending',
      'curated',
      'abstract',
    ],
  },
  {
    id: 'fp-113',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
    alt: 'Stunning Valley Landscape Lake',
    author: 'Bailey Zindel',
    authorUrl: 'https://unsplash.com',
    tags: ['mountain', 'nature', 'landscape', 'lake', 'water', 'valley', 'scenic', 'trees', 'trending', 'curated'],
  },
  {
    id: 'fp-114',
    url: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=400&auto=format&fit=crop',
    alt: 'Minimalist Modern Workspace Setup',
    author: 'Grovemade',
    authorUrl: 'https://unsplash.com',
    tags: [
      'technology',
      'workspace',
      'desk',
      'office',
      'minimalist',
      'interior',
      'business',
      'work',
      'trending',
      'curated',
    ],
  },
  {
    id: 'fp-115',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop',
    alt: 'Planet Earth from Space Planet',
    author: 'NASA',
    authorUrl: 'https://unsplash.com',
    tags: [
      'space',
      'earth',
      'stars',
      'night',
      'galaxy',
      'universe',
      'planet',
      'dark',
      'abstract',
      'trending',
      'curated',
    ],
  },
  {
    id: 'fp-116',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
    alt: 'Fashion Model Girl in Leather Jacket',
    author: 'Ali Pazani',
    authorUrl: 'https://unsplash.com',
    tags: ['people', 'portrait', 'woman', 'fashion', 'style', 'model', 'girl', 'trending', 'curated'],
  },
  {
    id: 'fp-117',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop',
    alt: 'Delicious Pepperoni Pizza Food',
    author: 'Chad Montano',
    authorUrl: 'https://unsplash.com',
    tags: ['food', 'pizza', 'delicious', 'cheese', 'dinner', 'lunch', 'restaurant', 'trending', 'curated'],
  },
  {
    id: 'fp-118',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400&auto=format&fit=crop',
    alt: 'Luxury Sports Car on Highway',
    author: 'Campbell',
    authorUrl: 'https://unsplash.com',
    tags: ['car', 'vehicle', 'auto', 'road', 'travel', 'speed', 'luxury', 'transportation', 'trending', 'curated'],
  },
  {
    id: 'fp-119',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop',
    alt: 'Foggy Redwoods Forest Wilderness',
    author: 'Dave Hoefler',
    authorUrl: 'https://unsplash.com',
    tags: ['forest', 'nature', 'trees', 'fog', 'redwoods', 'woods', 'landscape', 'outdoor', 'trending', 'curated'],
  },
  {
    id: 'fp-120',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1200&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    alt: 'Business Man Professional Portrait',
    author: 'Philip Martin',
    authorUrl: 'https://unsplash.com',
    tags: ['people', 'portrait', 'man', 'business', 'professional', 'suit', 'male', 'trending', 'curated'],
  },
];

export interface FallbackPhotoAdapter {
  adapt(results: BasePhoto[]): any[];
}

export const fallbackPhotoAdapters = new Map<string, FallbackPhotoAdapter>();

fallbackPhotoAdapters.set("unsplash", {
  adapt(results) {
    return results.map((p, idx) => ({
      id: `us-fb-${p.id}-${idx}`,
      url: p.url,
      thumbnail: p.thumbnail,
      alt: p.alt,
      user: {
        name: p.author,
        link: p.authorUrl,
      },
    }));
  },
});

fallbackPhotoAdapters.set("pixabay", {
  adapt(results) {
    return results.map((p, idx) => ({
      id: 1000 + idx,
      url: p.url,
      thumbnail: p.thumbnail,
      alt: p.alt,
      user: p.author,
    }));
  },
});

fallbackPhotoAdapters.set("pexels", {
  adapt(results) {
    return results.map((p, idx) => ({
      id: 2000 + idx,
      url: p.url,
      thumbnail: p.thumbnail,
      alt: p.alt,
      photographer: p.author,
      photographerUrl: p.authorUrl,
    }));
  },
});

fallbackPhotoAdapters.set("vecteezy", {
  adapt(results) {
    return results.map((p, idx) => ({
      id: `vz-fb-${p.id}-${idx}`,
      type: "photo",
      title: p.alt,
      thumbnail_url: p.thumbnail,
      preview_url: p.url,
    }));
  },
});

export function registerFallbackPhotoAdapter(provider: string, adapter: FallbackPhotoAdapter) {
  fallbackPhotoAdapters.set(provider, adapter);
}

export function getFallbackPhotos(query: string, provider: string): any[] {
  const q = (query || "").trim().toLowerCase();
  const isDefault = !q || q === "trending" || q === "curated" || q === "all";

  const filtered = CURATED_PHOTOS.filter((photo) => {
    if (isDefault) {
      return true;
    }
    const inAlt = photo.alt.toLowerCase().includes(q);
    const inTags = photo.tags.some((tag) => tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase()));
    return inAlt || inTags;
  });

  const results = filtered.length > 0 ? filtered : CURATED_PHOTOS;

  const adapter = fallbackPhotoAdapters.get(provider);
  if (adapter) {
    return adapter.adapt(results);
  }

  return results;
}
