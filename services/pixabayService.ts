import { log } from '../utils/log';

export interface PixabayPhoto {
  id: number;
  url: string;
  thumbnail: string;
  alt: string;
  user: string;
}

const FALLBACK_PHOTOS: PixabayPhoto[] = [
  {
    id: 1,
    url: 'https://cdn.pixabay.com/photo/2023/01/01/12/15/abstract-7692434_1280.jpg',
    thumbnail: 'https://cdn.pixabay.com/photo/2023/01/01/12/15/abstract-7692434_640.jpg',
    alt: 'Abstract Gradient',
    user: 'Pixabay',
  },
];

export const searchPhotos = async (query: string, page: number = 1): Promise<PixabayPhoto[]> => {
  try {
    const url = new URL('/api/pixabay', window.location.origin);
    url.searchParams.set('action', 'search');
    url.searchParams.set('query', query);
    url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) return FALLBACK_PHOTOS;
    const data = await response.json();
    return (data.hits || []).map((hit: any) => ({
      id: hit.id,
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags || 'Pixabay Photo',
      user: hit.user,
    }));
  } catch (error) {
    log.error('[PixabayService] Search failed', error, { query });
    return FALLBACK_PHOTOS;
  }
};

export const getCategories = async (): Promise<PixabayPhoto[]> => {
  try {
    const url = new URL('/api/pixabay', window.location.origin);
    url.searchParams.set('action', 'categories');
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) return FALLBACK_PHOTOS;
    const data = await response.json();
    return (data.hits || []).map((hit: any) => ({
      id: hit.id,
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags || 'Pixabay Category',
      user: hit.user,
    }));
  } catch (error) {
    log.error('[PixabayService] Categories failed', error);
    return FALLBACK_PHOTOS;
  }
};

export const getTrending = async (): Promise<PixabayPhoto[]> => {
  try {
    const url = new URL('/api/pixabay', window.location.origin);
    url.searchParams.set('action', 'trending');
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) return FALLBACK_PHOTOS;
    const data = await response.json();
    return (data.hits || []).map((hit: any) => ({
      id: hit.id,
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags || 'Pixabay Trending',
      user: hit.user,
    }));
  } catch (error) {
    log.error('[PixabayService] Trending failed', error);
    return FALLBACK_PHOTOS;
  }
};
