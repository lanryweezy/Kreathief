import { describe, it, expect, vi } from 'vitest';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      projects: [],
      loadAllProjects: vi.fn(),
      deleteProject: vi.fn(),
      duplicateProject: vi.fn(),
      updateProject: vi.fn(),
      createProject: vi.fn(),
      loadProject: vi.fn(),
      favoriteProjects: [],
      toggleFavoriteProject: vi.fn(),
      shareToCommunity: vi.fn(),
      addToast: vi.fn(),
      reset: vi.fn(),
      user: null,
      toasts: [],
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../../services/storageService', () => ({
  storageService: {
    getProjects: vi.fn().mockResolvedValue([]),
    saveProject: vi.fn().mockResolvedValue(undefined),
    deleteProject: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../utils/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Dashboard', () => {
  it('module can be imported', async () => {
    const mod = await import('../../components/Dashboard');
    expect(mod).toBeDefined();
  });
});
