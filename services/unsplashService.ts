// @ts-ignore - ignore type mismatch
const UNSPLASH_ACCESS_KEY = import.meta.env?.VITE_UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';

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
  if (UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY' || !UNSPLASH_ACCESS_KEY) {
    return FALLBACK_PHOTOS;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
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
    console.error('Unsplash Search Error:', error);
    return FALLBACK_PHOTOS;
  }
};
