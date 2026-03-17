import { logger } from './logger';
import { log } from '../utils/log';
import { apis } from '../config';

const API_ENDPOINT = 'https://api.vecteezy.com/v1';

export interface VecteezySearchResult {
    id: string;
    title: string;
    previewUrl: string;
    downloadUrl: string;
    type: 'vector' | 'photo' | 'video';
}

export const vecteezyService = {
    async search(query: string, type: 'vector' | 'photo' = 'vector') {
        const apiKey = apis.vecteezy.apiKey;
        if (!apiKey) {
            logger.warn('Vecteezy API key not configured');
            return [];
        }

        try {
            // Note: Real Vecteezy API might requires specific headers or params
            // This is a representative implementation
            const response = await fetch(`${API_ENDPOINT}/search?q=${encodeURIComponent(query)}&type=${type}`, {
                headers: {
                    'X-API-KEY': apiKey,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const error = new Error(`Vecteezy API error: ${response.statusText}`);
                log.error('[VecteezyService] API request failed', error, { 
                    status: response.status, 
                    query,
                    type 
                });
                throw error;
            }

            const data = await response.json();
            return (data.results || []).map((item: any) => ({
                id: item.id,
                title: item.title,
                previewUrl: item.preview_url,
                downloadUrl: item.download_url,
                type: item.resource_type,
            })) as VecteezySearchResult[];
        } catch (error) {
            logger.error('Failed to search Vecteezy', { error, query });
            log.error('[VecteezyService] Search failed', error, { query, type });
            return [];
        }
    }
};
