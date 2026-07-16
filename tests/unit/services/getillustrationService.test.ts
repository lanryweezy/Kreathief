import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as giService from '../../../services/getillustrationService';

describe('getillustrationService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('searchAll calls the proxy with correct parameters', async () => {
    const mockResponse = { results: { illustrations: [], icons: [], packs: [], iconPacks: [] } };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await giService.searchAll('test query', 10);

    expect(global.fetch).toHaveBeenCalledWith('/api/getillustration?action=search&query=test%20query&limit=10');
    expect(result).toEqual(mockResponse.results);
  });

  it('searchAll handles non-ok response', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false });
    const result = await giService.searchAll('test query', 10);
    expect(result).toEqual({ illustrations: [], icons: [], packs: [], iconPacks: [] });
  });

  it('listPacks calls the proxy correctly', async () => {
    const mockResponse = { items: [{ id: '1' }] };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await giService.listPacks(1, 10, true);

    expect(global.fetch).toHaveBeenCalledWith('/api/getillustration?action=packs&page=1&limit=10&free=true');
    expect(result).toEqual(mockResponse.items);
  });
});
