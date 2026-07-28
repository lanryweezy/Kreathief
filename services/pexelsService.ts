import { log } from '../utils/log';
import { getFallbackPhotos } from './fallbackPhotos';

export interface PexelsPhoto {
  id: number;
  url: string;
  thumbnail: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

export const searchPhotos = async (query: string, page: number = 1): Promise<PexelsPhoto[]> => {
  try {
    const url = new URL('/api/pexels', window.location.origin);
    url.searchParams.set('action', 'search');
    url.searchParams.set('query', query);
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getFallbackPhotos(query, 'pexels');
    }
    const data = await response.json();
    if (!data.photos || !Array.isArray(data.photos)) {
      return getFallbackPhotos(query, 'pexels');
    }
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x || photo.src.large || photo.src.original,
      thumbnail: photo.src.medium || photo.src.small,
      alt: photo.alt || 'Pexels Photo',
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    }));
  } catch (error) {
    log.warn('[PexelsService] Search failed or offline, using fallback library', error, { query });
    return getFallbackPhotos(query, 'pexels');
  }
};

export const getCurated = async (page: number = 1): Promise<PexelsPhoto[]> => {
  try {
    const url = new URL('/api/pexels', window.location.origin);
    url.searchParams.set('action', 'curated');
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getFallbackPhotos('curated', 'pexels');
    }
    const data = await response.json();
    if (!data.photos || !Array.isArray(data.photos)) {
      return getFallbackPhotos('curated', 'pexels');
    }
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x || photo.src.large || photo.src.original,
      thumbnail: photo.src.medium || photo.src.small,
      alt: photo.alt || 'Pexels Curated',
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    }));
  } catch (error) {
    log.warn('[PexelsService] Curated failed or offline, using fallback library', error);
    return getFallbackPhotos('curated', 'pexels');
  }
};

export const getCollectionPhotos = async (collectionId: string, page: number = 1): Promise<PexelsPhoto[]> => {
  try {
    const url = new URL('/api/pexels', window.location.origin);
    url.searchParams.set('action', 'collections');
    url.searchParams.set('collectionId', collectionId);
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getFallbackPhotos('curated', 'pexels');
    }
    const data = await response.json();
    if (!data.photos || !Array.isArray(data.photos)) {
      return getFallbackPhotos('curated', 'pexels');
    }
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x || photo.src.large || photo.src.original,
      thumbnail: photo.src.medium || photo.src.small,
      alt: photo.alt || 'Pexels Collection',
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    }));
  } catch (error) {
    log.warn('[PexelsService] Collection photos failed or offline, using fallback library', error, { collectionId });
    return getFallbackPhotos('curated', 'pexels');
  }
};
