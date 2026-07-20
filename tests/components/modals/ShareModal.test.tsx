import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      onlineUsers: [],
      addToast: vi.fn(),
      reset: vi.fn(),
      toasts: [],
      projectId: 'test-project',
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../../../services/shareService', () => ({
  shareService: {
    createShareLink: vi.fn().mockResolvedValue({ url: 'https://test.com/share/abc' }),
    getShareLinks: vi.fn().mockResolvedValue([]),
    deleteShareLink: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../utils/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('ShareModal', () => {
  it('module can be imported', async () => {
    const mod = await import('../../../components/modals/ShareModal');
    expect(mod).toBeDefined();
  });
});
