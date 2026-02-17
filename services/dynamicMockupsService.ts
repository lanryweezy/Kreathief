import { logger } from './logger';

const API_ENDPOINT = 'https://app.dynamicmockups.com/dashboard-api';

export interface DynamicMockupRequest {
    mockupId: string;
    designUrl: string;
    placement?: {
        top: number;
        left: number;
        width: number;
        rotate: number;
    };
}

export const dynamicMockupsService = {
    async generateMockup(params: DynamicMockupRequest) {
        const apiKey = import.meta.env.VITE_DYNAMIC_MOCKUPS_API_KEY;
        if (!apiKey) {
            logger.warn('Dynamic Mockups API key not configured');
            return null;
        }

        try {
            const response = await fetch(`${API_ENDPOINT}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`Dynamic Mockups API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.url; // Assuming it returns a URL
        } catch (error) {
            logger.error('Failed to generate mockup', { error, params });
            return null;
        }
    },

    async listMockups() {
        const apiKey = import.meta.env.VITE_DYNAMIC_MOCKUPS_API_KEY;
        if (!apiKey) return [];

        try {
            const response = await fetch(`${API_ENDPOINT}/templates`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });
            const data = await response.json();
            return data.templates || [];
        } catch (error) {
            logger.error('Failed to list mockups', { error });
            return [];
        }
    }
};
