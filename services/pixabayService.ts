import { log } from '../utils/log';
import { getFallbackPhotos } from './fallbackPhotos';

export interface PixabayPhoto {
  id: number;
  url: string;
  thumbnail: string;
  alt: string;
  user: string;
}

export const searchPhotos = async (query: string, page: number = 1): Promise<PixabayPhoto[]> => {
  try {
    const url = new URL('/api/pixabay', window.location.origin);
    url.searchParams.set('action', 'search');
    url.searchParams.set('query', query);
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getFallbackPhotos(query, 'pixabay');
    }
    const data = await response.json();
    if (!data.hits || !Array.isArray(data.hits)) {
      return getFallbackPhotos(query, 'pixabay');
    }
    return (data.hits || []).map((hit: any) => ({
      id: hit.id,
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags || 'Pixabay Photo',
      user: hit.user,
    }));
  } catch (error) {
    log.warn('[PixabayService] Search failed or offline, using fallback library', error, { query });
    return getFallbackPhotos(query, 'pixabay');
  }
};

export const getCategories = async (): Promise<PixabayPhoto[]> => {
  try {
    const url = new URL('/api/pixabay', window.location.origin);
    url.searchParams.set('action', 'categories');
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getFallbackPhotos('curated', 'pixabay');
    }
    const data = await response.json();
    if (!data.hits || !Array.isArray(data.hits)) {
      return getFallbackPhotos('curated', 'pixabay');
    }
    return (data.hits || []).map((hit: any) => ({
      id: hit.id,
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags || 'Pixabay Category',
      user: hit.user,
    }));
  } catch (error) {
    log.warn('[PixabayService] Categories failed or offline, using fallback library', error);
    return getFallbackPhotos('curated', 'pixabay');
  }
};

export const getTrending = async (): Promise<PixabayPhoto[]> => {
  try {
    const url = new URL('/api/pixabay', window.location.origin);
    url.searchParams.set('action', 'trending');
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getFallbackPhotos('trending', 'pixabay');
    }
    const data = await response.json();
    if (!data.hits || !Array.isArray(data.hits)) {
      return getFallbackPhotos('trending', 'pixabay');
    }
    return (data.hits || []).map((hit: any) => ({
      id: hit.id,
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags || 'Pixabay Trending',
      user: hit.user,
    }));
  } catch (error) {
    log.warn('[PixabayService] Trending failed or offline, using fallback library', error);
    return getFallbackPhotos('trending', 'pixabay');
  }
};
