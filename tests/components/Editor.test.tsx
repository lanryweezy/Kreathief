import { describe, it, expect, vi } from 'vitest';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      selectedLayerIds: [],
      canvasSize: { width: 800, height: 600 },
      activeTab: 'design',
      zoom: 1,
      showGrid: false,
      showRulers: false,
      artboards: [],
      activeArtboardId: null,
      projectId: null,
      projectTitle: 'Test',
      showShareModal: false,
      showFeedbackModal: false,
      user: null,
      mode: 'select',
      panOffset: { x: 0, y: 0 },
      canvasBackgroundColor: '#ffffff',
      toasts: [],
      addToast: vi.fn(),
      setActiveTab: vi.fn(),
      setZoom: vi.fn(),
      setShowGrid: vi.fn(),
      setShowRulers: vi.fn(),
      setShowShareModal: vi.fn(),
      setShowFeedbackModal: vi.fn(),
      setCanvasSize: vi.fn(),
      setCanvasBackgroundColor: vi.fn(),
      setPanOffset: vi.fn(),
      setMode: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      reset: vi.fn(),
      history: [],
      snapshots: [],
      tags: [],
      isPublished: false,
      showShortcuts: false,
      setShowShortcuts: vi.fn(),
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: vi.fn(),
      showVersionDiff: false,
      setShowVersionDiff: vi.fn(),
      versionDiffSnapshotId: null,
      favoriteTemplates: [],
      favoriteProjects: [],
      customFonts: [],
      showGoldenRatio: false,
      aspectLocked: false,
      isProcessing: false,
      isExporting: false,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../../store/selectors', () => ({
  selectedLayerSelector: vi.fn(() => null),
  activeArtboardSelector: vi.fn(() => undefined),
  selectedLayersSelector: vi.fn(() => []),
}));

vi.mock('../../services/shareService', () => ({
  shareService: { getShareLinks: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/storageService', () => ({
  storageService: { saveProject: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../hooks/useEditorLogic', () => ({
  useEditorLogic: vi.fn(() => ({})),
}));

vi.mock('../../hooks/useFileHandler', () => ({
  useFileHandler: vi.fn(() => ({
    handleFileUploads: vi.fn(),
    handleAddLogoToCanvas: vi.fn(),
  })),
}));

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('../../hooks/useShakeToUndo', () => ({
  useShakeToUndo: vi.fn(),
}));

vi.mock('../../commands/history', () => ({
  HistoryManager: vi.fn(),
}));

vi.mock('../../commands/move', () => ({
  MoveCommand: vi.fn(),
}));

vi.mock('../../commands/delete', () => ({
  DeleteCommand: vi.fn(),
}));

vi.mock('../../utils/haptics', () => ({
  haptics: { light: vi.fn(), medium: vi.fn(), heavy: vi.fn() },
}));

vi.mock('../../utils/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span' },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Editor', () => {
  it('module can be imported', async () => {
    const mod = await import('../../components/Editor');
    expect(mod).toBeDefined();
  });
});
