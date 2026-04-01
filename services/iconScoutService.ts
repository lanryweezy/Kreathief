import { log } from '../utils/log';
import { apis } from '../config';

const ICONS_BASE_URL = apis.iconScout.baseUrl;
const CLIENT_ID = apis.iconScout.clientId;
const SECRET_KEY = apis.iconScout.secretKey;

export type IconScoutAssetType = 'icon' | 'illustration' | '3d' | 'lottie';

export interface IconScoutAsset {
  id: number;
  uuid: string;
  name: string;
  type: IconScoutAssetType;
  previewUrl: string;
  downloadUrl?: string;
  author: string;
}

export const iconScoutService = {
  async search(query: string, type: IconScoutAssetType = 'icon', page: number = 1): Promise<IconScoutAsset[]> {
    if (!CLIENT_ID || !SECRET_KEY) {
      log.warn('[IconScoutService] Credentials not configured');
      return [];
    }

    try {
      const url = new URL(`${ICONS_BASE_URL}/search`);
      url.searchParams.append('query', query);
      url.searchParams.append('product_type', type === '3d' ? '3d-asset' : type);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('per_page', '20');

      const response = await fetch(url.toString(), {
        headers: {
          'Client-ID': CLIENT_ID,
          'Client-Secret': SECRET_KEY,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`IconScout API error: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.items?.data || [];

      return items.map((item: any) => ({
        id: item.id,
        uuid: item.uuid,
        name: item.name,
        type: type,
        previewUrl: item.urls?.thumb || item.urls?.preview || '',
        downloadUrl: item.urls?.download,
        author: item.user?.name || 'IconScout',
      }));
    } catch (error) {
      log.error('[IconScoutService] Search failed', error, { query, type });
      return [];
    }
  },

  async getAssetDetails(uuid: string): Promise<any | null> {
    try {
      const response = await fetch(`${ICONS_BASE_URL}/items/${uuid}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Client-Secret': SECRET_KEY,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {throw new Error('Failed to fetch asset details');}
      return await response.json();
    } catch (error) {
      log.error('[IconScoutService] Details fetch failed', error, { uuid });
      return null;
    }
  }
};
