import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creatorService } from '../../services/creatorService';
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
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('../../utils/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('creatorService error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('becomeCreator should catch and log error when user is not authenticated', async () => {
    const mockError = new Error('Not authenticated');
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    const result = await creatorService.becomeCreator({
      name: 'Test Creator',
      email: 'test@example.com',
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[CreatorService] becomeCreator failed', mockError);
  });

  it('becomeCreator should catch and log error from supabase insert', async () => {
    const mockError = new Error('Insert failed');
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user123' } } });
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    const result = await creatorService.becomeCreator({
      name: 'Test Creator',
      email: 'test@example.com',
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[CreatorService] becomeCreator failed', mockError);
  });

  it('uploadAsset should catch and log error when user is not authenticated', async () => {
    const mockError = new Error('Not authenticated');
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    const result = await creatorService.uploadAsset({
      title: 'Test Asset',
      category: 'Test',
      file_url: 'http://test.com/file.png',
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[CreatorService] uploadAsset failed', mockError);
  });

  it('uploadAsset should catch and log error when creator is not found', async () => {
    const mockError = new Error('Not a creator');
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user123' } } });
    const mockSingle = vi.fn().mockResolvedValue({ data: null });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    const result = await creatorService.uploadAsset({
      title: 'Test Asset',
      category: 'Test',
      file_url: 'http://test.com/file.png',
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[CreatorService] uploadAsset failed', mockError);
  });

  it('uploadAsset should catch and log error from supabase insert', async () => {
    const mockError = new Error('Insert failed');
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user123' } } });

    // First call to supabase.from('creators')...
    const mockCreatorSingle = vi.fn().mockResolvedValue({ data: { id: 'creator123' } });
    // Second call to supabase.from('assets')...
    const mockAssetSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'creators') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: mockCreatorSingle,
        };
      }
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: mockAssetSingle,
      };
    });

    const result = await creatorService.uploadAsset({
      title: 'Test Asset',
      category: 'Test',
      file_url: 'http://test.com/file.png',
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[CreatorService] uploadAsset failed', mockError);
  });

  it('getCreatorAssets should catch and log error from supabase fetch', async () => {
    const mockError = new Error('Fetch failed');
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: mockOrder,
    });

    const result = await creatorService.getCreatorAssets('creator123');

    expect(result).toEqual([]);
    expect(log.error).toHaveBeenCalledWith('[CreatorService] getCreatorAssets failed', mockError);
  });

  it('getAssetStats should catch and log error from supabase fetch', async () => {
    const mockError = new Error('Fetch failed');
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: mockError });

    // Create a mock chain that resolves after two .eq() calls
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(function (this: any, key: string) {
        if (key === 'status') {
          return mockEq();
        }
        return this;
      }),
    };

    (supabase.from as any).mockReturnValue(mockChain);

    const result = await creatorService.getAssetStats('creator123');

    expect(result).toEqual({ totalAssets: 0, totalDownloads: 0, totalEarnings: 0 });
    expect(log.error).toHaveBeenCalledWith('[CreatorService] getAssetStats failed', mockError);
  });

  it('approveAsset should catch and log error from supabase update', async () => {
    const mockError = new Error('Update failed');
    const mockEq = vi.fn().mockResolvedValue({ error: mockError });
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: mockEq,
    });

    const result = await creatorService.approveAsset('asset123');

    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[CreatorService] approveAsset failed', mockError);
  });

  it('rejectAsset should catch and log error from supabase update', async () => {
    const mockError = new Error('Update failed');
    const mockEq = vi.fn().mockResolvedValue({ error: mockError });
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: mockEq,
    });

    const result = await creatorService.rejectAsset('asset123', 'Inappropriate content');

    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[CreatorService] rejectAsset failed', mockError);
  });

  it('getAssetById should catch and log error from supabase fetch', async () => {
    const mockError = new Error('Fetch failed');
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });

    const result = await creatorService.getAssetById('asset123');

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledWith('[CreatorService] getAssetById failed', mockError);
  });
});
