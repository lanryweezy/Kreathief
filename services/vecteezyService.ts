import { log } from '../utils/log';

const VECTEEZY_API_URL = 'https://api.vecteezy.com/v2';
const ACCOUNT_ID = import.meta.env.VITE_VECTEEZY_ACCOUNT_ID || '';
const SECRET_KEY = import.meta.env.VITE_VECTEEZY_SECRET_KEY || '';

export interface VecteezyResource {
  id: string;
  type: string;
  title: string;
  thumbnail_url: string;
  preview_url: string;
  download_url?: string;
}

export const vecteezyService = {
  isConfigured: () => {
    return !!(ACCOUNT_ID && SECRET_KEY);
  },

  async searchResources(query: string, page: number = 1): Promise<VecteezyResource[]> {
    if (!this.isConfigured()) {
      log.warn('[VecteezyService] API keys not configured. Please add VITE_VECTEEZY_ACCOUNT_ID and VITE_VECTEEZY_SECRET_KEY to .env');
      return [];
    }

    try {
      // API typically uses search_term or q for searching
      const response = await fetch(
        `${VECTEEZY_API_URL}/${ACCOUNT_ID}/resources?search_term=${encodeURIComponent(query)}&page=${page}&per_page=20`,
        {
          headers: {
            'Authorization': `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        log.error('[VecteezyService] Search failed', new Error(response.statusText));
        return [];
      }

      const data = await response.json();
      
      // Map API response to our unified format
      // Vecteezy typically returns an array of resources inside a 'data' or 'resources' property
      const resources = data.data || data.resources || data;
      
      if (!Array.isArray(resources)) return [];

      return resources.map((item: any) => ({
        id: item.id,
        type: item.type || 'photo',
        title: item.title || item.name || 'Untitled',
        // Assuming standard preview structures. Adjust depending on exact Vecteezy schema
        thumbnail_url: item.thumbnail_url || item.thumbnails?.[0]?.url || item.image_url,
        preview_url: item.preview_url || item.image_url || item.thumbnail_url,
      }));
    } catch (err) {
      log.error('[VecteezyService] Search error', err as Error);
      return [];
    }
  },

  async getResourceDownloadUrl(resourceId: string): Promise<string | null> {
     if (!this.isConfigured()) return null;

     try {
       const response = await fetch(
         `${VECTEEZY_API_URL}/${ACCOUNT_ID}/resources/${resourceId}/download`,
         {
           headers: {
             'Authorization': `Bearer ${SECRET_KEY}`,
           },
         }
       );

       if (!response.ok) return null;
       const data = await response.json();
       return data.url || data.download_url || null;
     } catch (err) {
       log.error('[VecteezyService] Download fetch error', err as Error);
       return null;
     }
  }
};
