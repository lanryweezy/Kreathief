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
  provider: 'unsplash' | 'pixabay' | 'pexels';
  width?: number;
  height?: number;
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

function normalizeUnsplash(results: any[]): NormalizedAsset[] {
  return results.map((p) => ({
    id: `us-${p.id}`,
    url: p.url,
    thumbnail: p.thumbnail,
    alt: p.alt,
    author: p.user.name,
    authorUrl: p.user.link,
    provider: 'unsplash' as const,
  }));
}

function normalizePixabay(results: any[]): NormalizedAsset[] {
  return results.map((p) => ({
    id: `pb-${p.id}`,
    url: p.url,
    thumbnail: p.thumbnail,
    alt: p.alt,
    author: p.user,
    provider: 'pixabay' as const,
  }));
}

function normalizePexels(results: any[]): NormalizedAsset[] {
  return results.map((p) => ({
    id: `px-${p.id}`,
    url: p.url,
    thumbnail: p.thumbnail,
    alt: p.alt,
    author: p.photographer,
    authorUrl: p.photographerUrl,
    provider: 'pexels' as const,
  }));
}

export async function searchAllProviders(query: string): Promise<NormalizedAsset[]> {
  const cacheKey = `all:${query}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  const promises: Promise<NormalizedAsset[]>[] = [];

  if (checkRateLimit('unsplash')) {
    promises.push(
      unsplashService
        .searchPhotos(query)
        .then(normalizeUnsplash)
        .catch((e) => {
          log.error('[AssetSearch] Unsplash failed', e);
          return [];
        })
    );
  }
  if (checkRateLimit('pixabay')) {
    promises.push(
      pixabayService
        .searchPhotos(query)
        .then(normalizePixabay)
        .catch((e) => {
          log.error('[AssetSearch] Pixabay failed', e);
          return [];
        })
    );
  }
  if (checkRateLimit('pexels')) {
    promises.push(
      pexelsService
        .searchPhotos(query)
        .then(normalizePexels)
        .catch((e) => {
          log.error('[AssetSearch] Pexels failed', e);
          return [];
        })
    );
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
