import { logger } from './logger';
import { log } from '../utils/log';

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
    try {
      const response = await fetch('/api/dynamic-mockups?action=generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = new Error(`Dynamic Mockups API error: ${response.statusText}`);
        log.error('[DynamicMockupsService] Generation failed', error, {
          status: response.status,
          mockupId: params.mockupId,
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
    try {
      const response = await fetch('/api/dynamic-mockups?action=list');
      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      log.error('[DynamicMockupsService] Failed to list mockups', error);
      return [];
    }
  },
};
