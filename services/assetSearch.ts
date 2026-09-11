import { log } from '../utils/log';
import * as unsplashService from './unsplashService';
import * as freepikService from './freepikService';
import { iconScoutService } from './iconScoutService';
import { getFallbackPhotos } from './fallbackPhotos';

export interface NormalizedAsset {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  author: string;
  authorUrl?: string;
  provider: string; // Made extensible (was union 'unsplash' | 'pixabay' | 'pexels')
  width?: number;
  height?: number;
}

/**
 * Extensibility Point: AssetSearchProvider Registry
 * Evidence of pressure: The searchAllProviders function relied on hard-coded if blocks
 * to call 3 different asset APIs (Unsplash, Pixabay, Pexels). Adding a fourth would
 * require modifying this core function.
 * Contract: Implementors provide an id and a search method returning NormalizedAssets.
 * Registration allows adding new asset providers without changing core logic.
 */
export interface AssetSearchProvider {
  id: string;
  search(query: string): Promise<NormalizedAsset[]>;
}

const searchProviders = new Map<string, AssetSearchProvider>();

export function registerSearchProvider(provider: AssetSearchProvider) {
  searchProviders.set(provider.id, provider);
}

interface CacheEntry {
  data: NormalizedAsset[];
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const TTL = 5 * 60 * 1000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(provider: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(provider);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(provider, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
}

// Register default providers
registerSearchProvider({
  id: 'unsplash',
  search: (query) =>
    unsplashService.searchPhotos(query).then((results) =>
      results.map((p) => ({
        id: `us-${p.id}`,
        url: p.url,
        thumbnail: p.thumbnail,
        alt: p.alt,
        author: p.user.name,
        authorUrl: p.user.link,
        provider: 'unsplash',
      }))
    ),
});

// Freepik photos — only when an API key is configured, so unconfigured
// installs don't fire doomed requests on every search.
if (freepikService.isConfigured()) {
  registerSearchProvider({
    id: 'freepik',
    search: (query) =>
      freepikService.searchResources(query, 'photos').then((result) =>
        result.items
          .filter((item) => item.thumbnailUrl)
          .map((item) => ({
            id: `fp-${item.id}`,
            url: item.thumbnailUrl,
            thumbnail: item.thumbnailUrl,
            alt: item.name,
            author: item.author,
            provider: 'freepik',
          }))
      ),
  });
}

registerSearchProvider({
  id: 'pexels',
  search: async (query) => {
    try {
      const res = await fetch(`/api/pexels?action=search&query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        if (res.status === 429) log.warn('Pexels rate limited, falling back');
        else log.warn(`Pexels API error: ${res.status}`);
        return getFallbackPhotos(query, 'pexels');
      }
      const data = await res.json();
      if (!data.photos) return getFallbackPhotos(query, 'pexels');

      return data.photos.map((p: any) => ({
        id: `px-${p.id}`,
        url: p.src.original,
        thumbnail: p.src.medium,
        alt: p.alt || 'Pexels photo',
        author: p.photographer,
        authorUrl: p.photographer_url,
        provider: 'pexels',
        width: p.width,
        height: p.height,
      }));
    } catch (err) {
      log.error('Pexels fetch failed, falling back to curated photos', err);
      return getFallbackPhotos(query, 'pexels');
    }
  }
});

registerSearchProvider({
  id: 'pixabay',
  search: async (query) => {
    try {
      const res = await fetch(`/api/pixabay?action=search&query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        if (res.status === 429) log.warn('Pixabay rate limited, falling back');
        else log.warn(`Pixabay API error: ${res.status}`);
        return getFallbackPhotos(query, 'pixabay');
      }
      const data = await res.json();
      if (!data.hits) return getFallbackPhotos(query, 'pixabay');

      return data.hits.map((p: any) => ({
        id: `pb-${p.id}`,
        url: p.largeImageURL,
        thumbnail: p.webformatURL,
        alt: p.tags || 'Pixabay photo',
        author: p.user,
        provider: 'pixabay',
        width: p.imageWidth,
        height: p.imageHeight,
      }));
    } catch (err) {
      log.error('Pixabay fetch failed, falling back to curated photos', err);
      return getFallbackPhotos(query, 'pixabay');
    }
  }
});

registerSearchProvider({
  id: 'iconscout',
  search: (query) =>
    iconScoutService.search(query, 'illustration').then((results) =>
      results.map((p) => ({
        id: `is-${p.id}`,
        url: p.previewUrl,
        thumbnail: p.previewUrl,
        alt: p.name,
        author: p.author,
        provider: 'iconscout',
      }))
    ),
});

export async function searchAllProviders(query: string, providerId?: string): Promise<NormalizedAsset[]> {
  const cacheKey = providerId ? `${providerId}:${query}` : `all:${query}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return cached.data;
  }

  const promises: Promise<NormalizedAsset[]>[] = [];

  for (const provider of searchProviders.values()) {
    if (providerId && providerId !== 'all' && provider.id !== providerId) {
      continue;
    }
    if (checkRateLimit(provider.id)) {
      promises.push(
        provider.search(query).catch((e) => {
          log.error(`[AssetSearch] ${provider.id} failed`, e);
          return [];
        })
      );
    }
  }

  const results = await Promise.all(promises);
  const merged = results.flat();
  cache.set(cacheKey, { data: merged, ts: Date.now() });
  return merged;
}

export function clearSearchCache(): void {
  cache.clear();
  rateLimits.clear();
}
