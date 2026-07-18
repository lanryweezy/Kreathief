import { log } from '../utils/log';
import * as unsplashService from './unsplashService';
import * as pixabayService from './pixabayService';
import * as pexelsService from './pexelsService';

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
  if (entry.count >= RATE_LIMIT) return false;
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

registerSearchProvider({
  id: 'pixabay',
  search: (query) =>
    pixabayService.searchPhotos(query).then((results) =>
      results.map((p) => ({
        id: `pb-${p.id}`,
        url: p.url,
        thumbnail: p.thumbnail,
        alt: p.alt,
        author: p.user,
        provider: 'pixabay',
      }))
    ),
});

registerSearchProvider({
  id: 'pexels',
  search: (query) =>
    pexelsService.searchPhotos(query).then((results) =>
      results.map((p) => ({
        id: `px-${p.id}`,
        url: p.url,
        thumbnail: p.thumbnail,
        alt: p.alt,
        author: p.photographer,
        authorUrl: p.photographerUrl,
        provider: 'pexels',
      }))
    ),
});

export async function searchAllProviders(query: string): Promise<NormalizedAsset[]> {
  const cacheKey = `all:${query}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  const promises: Promise<NormalizedAsset[]>[] = [];

  for (const provider of searchProviders.values()) {
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
