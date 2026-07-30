import { describe, it, expect, vi, beforeEach } from 'vitest';
import { iconScoutService } from './iconScoutService';

describe('iconScoutService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should format search requests correctly and map response items', async () => {
    const mockResponse = {
      items: {
        data: [
          {
            id: 101,
            uuid: 'uuid-101',
            name: '3D Robot',
            urls: { thumb: 'https://example.com/robot.png' },
            user: { name: '3D Master' },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await iconScoutService.search('robot', '3d');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('action=search&query=robot&product_type=3d-asset'),
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 101,
      uuid: 'uuid-101',
      name: '3D Robot',
      type: '3d',
      previewUrl: 'https://example.com/robot.png',
      downloadUrl: undefined,
      author: '3D Master',
    });
  });

  it('should handle API errors gracefully and return an empty array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    } as any);

    const result = await iconScoutService.search('error_test', 'icon');
    expect(result).toEqual([]);
  });
});
