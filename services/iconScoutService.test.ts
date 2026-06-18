import { describe, it, expect, vi, beforeEach } from 'vitest';
import { iconScoutService } from './iconScoutService';

// Mock the config
vi.mock('../config', () => ({
  apis: {
    iconScout: {
      clientId: 'test_client_id',
      secretKey: 'test_secret_key',
      baseUrl: 'https://api.iconscout.com/v3',
    },
  },
}));

// Mock the log utility
vi.mock('../utils/log', () => ({
  log: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('IconScout Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('search', () => {
    it('should search for icons successfully', async () => {
      const mockResponse = {
        items: {
          data: [
            {
              id: 1,
              uuid: 'test-uuid-1',
              name: 'Test Icon',
              urls: {
                thumb: 'https://example.com/thumb.png',
                preview: 'https://example.com/preview.png',
                download: 'https://example.com/download.png',
              },
              user: {
                name: 'Test Author',
              },
            },
          ],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await iconScoutService.search('test', 'icon');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 1,
        uuid: 'test-uuid-1',
        name: 'Test Icon',
        type: 'icon',
        previewUrl: 'https://example.com/thumb.png',
        author: 'Test Author',
      });
    });

    it('should handle 3D assets correctly', async () => {
      const mockResponse = {
        items: {
          data: [
            {
              id: 2,
              uuid: 'test-uuid-2',
              name: 'Test 3D Asset',
              urls: {
                thumb: 'https://example.com/3d-thumb.png',
              },
              user: {
                name: '3D Artist',
              },
            },
          ],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await iconScoutService.search('cube', '3d');

      expect(results[0].type).toBe('3d');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('product_type=3d-asset'), expect.any(Object));
    });

    it('should return empty array on API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      const results = await iconScoutService.search('test', 'icon');

      expect(results).toEqual([]);
    });

    it('should include proper headers in request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: { data: [] } }),
      });

      await iconScoutService.search('test', 'icon');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
          },
        })
      );
    });
  });

  describe('getAssetDetails', () => {
    it('should fetch asset details successfully', async () => {
      const mockDetails = {
        id: 1,
        uuid: 'test-uuid',
        name: 'Detailed Asset',
        description: 'Test description',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetails,
      });

      const result = await iconScoutService.getAssetDetails('test-uuid');

      expect(result).toEqual(mockDetails);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('action=details&uuid=test-uuid'),
        expect.any(Object)
      );
    });

    it('should return null on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await iconScoutService.getAssetDetails('test-uuid');

      expect(result).toBeNull();
    });
  });
});
