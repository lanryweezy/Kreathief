import { describe, it, expect, vi, beforeEach } from 'vitest';
import { templateMarketplace } from '../../services/templateMarketplace';
import { db as supabase } from '../../lib/supabase/client';
import { log } from '../../utils/log';

vi.mock('../../lib/supabase/client', () => ({
  db: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
  },
}));

vi.mock('../../utils/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('templateMarketplace error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submitTemplate should catch and log error when user is not authenticated', async () => {
    const mockError = new Error('Not authenticated');
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    const result = await templateMarketplace.submitTemplate({
      title: 'Test',
      description: 'Desc',
      category: 'Cat',
      tags: [],
      templateData: {},
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Submit failed', mockError);
  });

  it('submitTemplate should catch and log error from supabase insert', async () => {
    const mockError = new Error('Insert failed');
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '123' } } });
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    const result = await templateMarketplace.submitTemplate({
      title: 'Test',
      description: 'Desc',
      category: 'Cat',
      tags: [],
      templateData: {},
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Submit failed', mockError);
  });

  it('getTemplates should catch and log error from supabase', async () => {
    const mockError = new Error('Fetch failed');
    const mockRange = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: mockRange,
    });

    const result = await templateMarketplace.getTemplates();

    expect(result).toEqual({ data: [], total: 0, page: 1, hasMore: false });
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Fetch failed', mockError);
  });

  it('getTemplateById should catch and log error from supabase', async () => {
    const mockError = new Error('Get by ID failed');
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    const result = await templateMarketplace.getTemplateById('123');

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Get by ID failed', mockError);
  });

  it('likeTemplate should catch and log error from supabase rpc', async () => {
    const mockError = new Error('Like failed');
    (supabase.rpc as any).mockRejectedValue(mockError);

    await templateMarketplace.likeTemplate('123');

    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Like failed', mockError);
  });

  it('getPopularTemplates should catch and log error from supabase', async () => {
    const mockError = new Error('Popular fetch failed');
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: mockLimit,
    });

    const result = await templateMarketplace.getPopularTemplates();

    expect(result).toEqual([]);
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Popular fetch failed', mockError);
  });

  it('getRecentTemplates should catch and log error from supabase', async () => {
    const mockError = new Error('Recent fetch failed');
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: mockLimit,
    });

    const result = await templateMarketplace.getRecentTemplates();

    expect(result).toEqual([]);
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Recent fetch failed', mockError);
  });

  it('searchTemplates should catch and log error from supabase', async () => {
    const mockError = new Error('Search failed');
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: mockLimit,
    });

    const result = await templateMarketplace.searchTemplates('test');

    expect(result).toEqual([]);
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] Search failed', mockError);
  });

  it('getTemplatesByUser should catch and log error from supabase', async () => {
    const mockError = new Error('User fetch failed');
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: mockOrder,
    });

    const result = await templateMarketplace.getTemplatesByUser('123');

    expect(result).toEqual([]);
    expect(log.error).toHaveBeenCalledWith('[TemplateMarketplace] User fetch failed', mockError);
  });
});
