import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      addToast: vi.fn(),
      artboards: [],
      activeArtboardId: null,
      selectedLayerIds: [],
      projectTitle: 'Test Project',
      user: null,
      reset: vi.fn(),
      toasts: [],
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../../../services/exportService', () => ({
  exportToSvg: vi.fn(() => '<svg></svg>'),
  exportToCanvas: vi.fn(() => document.createElement('canvas')),
  downloadBlob: vi.fn(),
  batchExportArtboardsZip: vi.fn(() => Promise.resolve(new Blob())),
  ColorProfile: 'srgb',
}));

vi.mock('../../../utils/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('ExportModal', () => {
  it('module can be imported', async () => {
    const mod = await import('../../../components/modals/ExportModal');
    expect(mod).toBeDefined();
  });
});
