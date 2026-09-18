import { log } from '../utils/log';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

/**
 * Search for photos on Pexels.
 */
export async function searchPexelsImages(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<PexelsPhoto[]> {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsSearchResponse = await response.json();
    return data.photos || [];
  } catch (error) {
    log.error('Failed to fetch from Pexels', error);
    return [];
  }
}

/**
 * Get curated (popular) photos from Pexels.
 */
export async function getCuratedPexelsImages(page: number = 1, perPage: number = 20): Promise<PexelsPhoto[]> {
  try {
    const url = `https://api.pexels.com/v1/curated?page=${page}&per_page=${perPage}`;
    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsSearchResponse = await response.json();
    return data.photos || [];
  } catch (error) {
    log.error('Failed to fetch curated Pexels images', error);
    return [];
  }
}
