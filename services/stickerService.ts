import { log } from '../utils/log';

export interface StickerAsset {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: 'tenor' | 'curated';
}

// Curated high-utility static design sticker packs (SVG Data URIs with die-cut white borders & drop shadows)
const CURATED_STICKERS: StickerAsset[] = [
  {
    id: 'curated_star_badge',
    name: '100% Quality Badge',
    source: 'curated',
    width: 200,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><polygon points="100,10 120,60 170,70 135,110 145,160 100,135 55,160 65,110 30,70 80,60" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="8" stroke-linejoin="round"/><polygon points="100,18 116,61 160,70 128,105 137,149 100,127 63,149 72,105 40,70 84,61" fill="%23FFD700"/><circle cx="100" cy="90" r="32" fill="%23FF4500"/><text x="100" y="96" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">100%</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><polygon points="100,18 116,61 160,70 128,105 137,149 100,127 63,149 72,105 40,70 84,61" fill="%23FFD700" stroke="%23FFF" stroke-width="6"/><circle cx="100" cy="90" r="32" fill="%23FF4500"/><text x="100" y="96" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">100%</text></svg>`,
  },
  {
    id: 'curated_fire_sticker',
    name: 'Fire Lit Sticker',
    source: 'curated',
    width: 200,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><path d="M100,15 C130,50 160,90 160,130 A60,60 0 0,1 40,130 C40,90 70,50 100,15 Z" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="10" stroke-linejoin="round"/><path d="M100,25 C125,55 150,90 150,130 A50,50 0 0,1 50,130 C50,90 75,55 100,25 Z" fill="%23FF4500"/><path d="M100,65 C115,85 135,110 135,140 A35,35 0 0,1 65,140 C65,110 85,85 100,65 Z" fill="%23FFD700"/><text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">LIT!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100,25 C125,55 150,90 150,130 A50,50 0 0,1 50,130 C50,90 75,55 100,25 Z" fill="%23FF4500" stroke="%23FFF" stroke-width="8"/><path d="M100,65 C115,85 135,110 135,140 A35,35 0 0,1 65,140 C65,110 85,85 100,65 Z" fill="%23FFD700"/></svg>`,
  },
  {
    id: 'curated_approved_stamp',
    name: 'Approved Stamp Sticker',
    source: 'curated',
    width: 220,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="200" height="100" rx="16" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="8"/><rect x="18" y="18" width="184" height="84" rx="12" fill="none" stroke="%2310B981" stroke-width="6" stroke-dasharray="8 4"/><text x="110" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%2310B981" text-anchor="middle" transform="rotate(-4 110 70)">APPROVED</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><rect x="18" y="18" width="184" height="84" rx="12" fill="%23FFF" stroke="%2310B981" stroke-width="6"/><text x="110" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%2310B981" text-anchor="middle">APPROVED</text></svg>`,
  },
  {
    id: 'curated_sale_tag',
    name: 'Sale Tag Sticker',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><circle cx="90" cy="90" r="75" fill="%23FFFFFF"/><circle cx="90" cy="90" r="68" fill="%23EC4899"/><text x="90" y="85" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" text-anchor="middle">SALE</text><text x="90" y="115" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="%23FDE047" text-anchor="middle">50% OFF</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="90" cy="90" r="68" fill="%23EC4899" stroke="%23FFF" stroke-width="6"/><text x="90" y="85" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" text-anchor="middle">SALE</text><text x="90" y="115" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="%23FDE047" text-anchor="middle">50%</text></svg>`,
  },
  {
    id: 'curated_wow_bubble',
    name: 'WOW Comic Sticker',
    source: 'curated',
    width: 200,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><path d="M10,80 L30,50 L20,30 L60,40 L80,10 L110,35 L150,15 L160,50 L190,70 L165,100 L185,130 L145,135 L120,155 L90,135 L50,150 L55,115 L15,110 Z" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="8" stroke-linejoin="round"/><path d="M18,80 L35,54 L27,36 L62,45 L80,18 L107,40 L143,23 L152,54 L179,72 L157,99 L175,125 L139,129 L117,147 L90,129 L54,142 L59,111 L23,106 Z" fill="%23FACC15"/><text x="100" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="42" fill="%23000000" text-anchor="middle" transform="rotate(-5 100 95)">WOW!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><path d="M18,80 L35,54 L27,36 L62,45 L80,18 L107,40 L143,23 L152,54 L179,72 L157,99 L175,125 L139,129 L117,147 L90,129 L54,142 L59,111 L23,106 Z" fill="%23FACC15" stroke="%23FFF" stroke-width="6"/><text x="100" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="42" fill="%23000000" text-anchor="middle">WOW!</text></svg>`,
  },
  {
    id: 'curated_new_badge',
    name: 'NEW Drop Badge',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><circle cx="80" cy="80" r="70" fill="%23FFFFFF"/><circle cx="80" cy="80" r="62" fill="%233B82F6"/><text x="80" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%23FFFFFF" text-anchor="middle" transform="rotate(-10 80 90)">NEW</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="62" fill="%233B82F6" stroke="%23FFF" stroke-width="6"/><text x="80" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%23FFFFFF" text-anchor="middle">NEW</text></svg>`,
  },
];

export const getCuratedStickers = (query?: string): StickerAsset[] => {
  if (!query || !query.trim()) {
    return CURATED_STICKERS;
  }
  const q = query.toLowerCase().trim();
  const matched = CURATED_STICKERS.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  return matched.length > 0 ? matched : CURATED_STICKERS;
};

export const searchStickers = async (query: string, pos?: string): Promise<StickerAsset[]> => {
  if (!query || !query.trim()) {
    return getTrendingStickers(pos);
  }

  try {
    const url = new URL('/api/tenor', window.location.origin);
    url.searchParams.set('action', 'search');
    url.searchParams.set('query', query);
    if (pos) {
      url.searchParams.set('pos', pos);
    }

    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getCuratedStickers(query);
    }

    const data = await response.json();
    if (!data || !data.results || !Array.isArray(data.results)) {
      return getCuratedStickers(query);
    }

    const stickers: StickerAsset[] = data.results
      .map((item: any) => {
        const media =
          item.media_formats?.png ||
          item.media_formats?.webp ||
          item.media_formats?.gif ||
          item.media_formats?.tinywebp ||
          {};
        const thumb =
          item.media_formats?.tinywebp || item.media_formats?.tinypng || item.media_formats?.tinygif || media;
        return {
          id: item.id || `tenor_${Math.random().toString(36).substring(2)}`,
          name: item.content_description || query || 'Sticker',
          url: media.url || thumb.url || '',
          thumbnail: thumb.url || media.url || '',
          width: media.dims ? media.dims[0] : 200,
          height: media.dims ? media.dims[1] : 200,
          source: 'tenor' as const,
        };
      })
      .filter((s: StickerAsset) => s.url);

    return stickers.length > 0 ? stickers : getCuratedStickers(query);
  } catch (error) {
    log.warn('[StickerService] Search failed or offline, using curated fallback pack', error, { query });
    return getCuratedStickers(query);
  }
};

export const getTrendingStickers = async (pos?: string): Promise<StickerAsset[]> => {
  try {
    const url = new URL('/api/tenor', window.location.origin);
    url.searchParams.set('action', 'trending');
    if (pos) {
      url.searchParams.set('pos', pos);
    }

    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getCuratedStickers();
    }

    const data = await response.json();
    if (!data || !data.results || !Array.isArray(data.results)) {
      return getCuratedStickers();
    }

    const stickers: StickerAsset[] = data.results
      .map((item: any) => {
        const media =
          item.media_formats?.png ||
          item.media_formats?.webp ||
          item.media_formats?.gif ||
          item.media_formats?.tinywebp ||
          {};
        const thumb =
          item.media_formats?.tinywebp || item.media_formats?.tinypng || item.media_formats?.tinygif || media;
        return {
          id: item.id || `tenor_${Math.random().toString(36).substring(2)}`,
          name: item.content_description || 'Trending Sticker',
          url: media.url || thumb.url || '',
          thumbnail: thumb.url || media.url || '',
          width: media.dims ? media.dims[0] : 200,
          height: media.dims ? media.dims[1] : 200,
          source: 'tenor' as const,
        };
      })
      .filter((s: StickerAsset) => s.url);

    return stickers.length > 0 ? stickers : getCuratedStickers();
  } catch (error) {
    log.warn('[StickerService] Trending fetch failed or offline, using curated fallback pack', error);
    return getCuratedStickers();
  }
};
