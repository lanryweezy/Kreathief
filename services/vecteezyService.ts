import { logger } from './logger';

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
        const apiKey = import.meta.env.VITE_VECTEEZY_API_KEY;
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
                throw new Error(`Vecteezy API error: ${response.statusText}`);
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
            return [];
        }
    }
};
