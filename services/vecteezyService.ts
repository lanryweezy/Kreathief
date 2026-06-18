import { log } from '../utils/log';

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
    // Rely on server configuration instead of client exposed secrets
    return true;
  },

  async searchResources(query: string, page: number = 1): Promise<VecteezyResource[]> {
    try {
      const response = await fetch(`/api/vecteezy?action=search&query=${encodeURIComponent(query)}&page=${page}`);

      if (!response.ok) {
        log.error('[VecteezyService] Search failed', new Error(response.statusText));
        return [];
      }

      const data = await response.json();
      
      // Map API response to our unified format
      const resources = data.data || data.resources || data;
      
      if (!Array.isArray(resources)) {return [];}

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
     try {
       const response = await fetch(`/api/vecteezy?action=download&resourceId=${encodeURIComponent(resourceId)}`);

       if (!response.ok) {return null;}
       const data = await response.json();
       return data.url || data.download_url || null;
     } catch (err) {
       log.error('[VecteezyService] Download fetch error', err as Error);
       return null;
     }
  }
};
