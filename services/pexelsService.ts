import { log } from '../utils/log';

export interface PexelsPhoto {
  id: number;
  url: string;
  thumbnail: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

const FALLBACK_PHOTOS: PexelsPhoto[] = [
  {
    id: 1,
    url: 'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    thumbnail: 'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=300',
    alt: 'Abstract Background',
    photographer: 'Pexels',
    photographerUrl: 'https://pexels.com',
  },
];

export const searchPhotos = async (query: string, page: number = 1): Promise<PexelsPhoto[]> => {
  try {
    const url = new URL('/api/pexels', window.location.origin);
    url.searchParams.set('action', 'search');
    url.searchParams.set('query', query);
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) return FALLBACK_PHOTOS;
    const data = await response.json();
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x || photo.src.large || photo.src.original,
      thumbnail: photo.src.medium || photo.src.small,
      alt: photo.alt || 'Pexels Photo',
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    }));
  } catch (error) {
    log.error('[PexelsService] Search failed', error, { query });
    return FALLBACK_PHOTOS;
  }
};

export const getCurated = async (page: number = 1): Promise<PexelsPhoto[]> => {
  try {
    const url = new URL('/api/pexels', window.location.origin);
    url.searchParams.set('action', 'curated');
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) return FALLBACK_PHOTOS;
    const data = await response.json();
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x || photo.src.large || photo.src.original,
      thumbnail: photo.src.medium || photo.src.small,
      alt: photo.alt || 'Pexels Curated',
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    }));
  } catch (error) {
    log.error('[PexelsService] Curated failed', error);
    return FALLBACK_PHOTOS;
  }
};

export const getCollectionPhotos = async (collectionId: string, page: number = 1): Promise<PexelsPhoto[]> => {
  try {
    const url = new URL('/api/pexels', window.location.origin);
    url.searchParams.set('action', 'collections');
    url.searchParams.set('collectionId', collectionId);
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) return FALLBACK_PHOTOS;
    const data = await response.json();
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x || photo.src.large || photo.src.original,
      thumbnail: photo.src.medium || photo.src.small,
      alt: photo.alt || 'Pexels Collection',
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    }));
  } catch (error) {
    log.error('[PexelsService] Collection photos failed', error, { collectionId });
    return FALLBACK_PHOTOS;
  }
};
