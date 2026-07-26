// @ts-ignore - ignore type mismatch
import { log } from '../utils/log';

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

const FALLBACK_PHOTOS: UnsplashPhoto[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1080&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=200&auto=format&fit=crop',
    alt: 'Abstract Gradient',
    user: { name: 'Unsplash', link: 'https://unsplash.com' },
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=1080&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=200&auto=format&fit=crop',
    alt: 'Minimalist Workspace',
    user: { name: 'Unsplash', link: 'https://unsplash.com' },
  },
];

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
      log.error('[UnsplashService] API request failed', new Error(`Status: ${response.status}`), {
        query,
        page,
        status: response.status,
      });
      return FALLBACK_PHOTOS;
    }

    const data = await response.json();
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
    log.error('[UnsplashService] Search failed', error, { query, page });
    return FALLBACK_PHOTOS;
  }
};
