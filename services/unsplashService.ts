import { log } from '../utils/log';
import { getFallbackPhotos } from './fallbackPhotos';

export interface UnsplashPhoto {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  user: {
    name: string;
    link: string;
  };
}

export const searchPhotos = async (query: string, page: number = 1): Promise<UnsplashPhoto[]> => {
  try {
    const url = new URL('/api/unsplash', window.location.origin);
    url.searchParams.append('action', 'search');
    url.searchParams.append('query', query);
    url.searchParams.append('page', page.toString());
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      log.warn('[UnsplashService] API request failed or offline, using fallback library', {
        query,
        page,
        status: response.status,
      });
      return getFallbackPhotos(query, 'unsplash');
    }

    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) {
      return getFallbackPhotos(query, 'unsplash');
    }
    return data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      alt: photo.alt_description || 'Unsplash Photo',
      user: {
        name: photo.user.name,
        link: photo.user.links.html,
      },
    }));
  } catch (error) {
    log.warn('[UnsplashService] Search failed, using fallback library', error, { query, page });
    return getFallbackPhotos(query, 'unsplash');
  }
};
