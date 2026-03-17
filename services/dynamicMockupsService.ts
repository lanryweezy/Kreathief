import { logger } from './logger';
import { log } from '../utils/log';
import { apis } from '../config';

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
    const apiKey = apis.dynamicMockups.apiKey;
    if (!apiKey) {
      logger.warn('Dynamic Mockups API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${API_ENDPOINT}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = new Error(`Dynamic Mockups API error: ${response.statusText}`);
        log.error('[DynamicMockupsService] Generation failed', error, { 
          status: response.status,
          mockupId: params.mockupId 
        });
        throw error;
      }

      const data = await response.json();
      return data.url; // Assuming it returns a URL
    } catch (error) {
      logger.error('Failed to generate mockup', { error, params });
      log.error('[DynamicMockupsService] Generation failed', error, { params });
      return null;
    }
  },

  async listMockups() {
    const apiKey = apis.dynamicMockups.apiKey;
    if (!apiKey) {
      log.debug('[DynamicMockupsService] No API key configured, returning empty list');
      return [];
    }

    try {
      const response = await fetch(`${API_ENDPOINT}/templates`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      log.error('[DynamicMockupsService] Failed to list mockups', error);
      return [];
    }
  },
};
