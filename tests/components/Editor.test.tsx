import { render } from '@testing-library/react';
import { vi } from 'vitest';
import Editor from '../../components/Editor';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        selectedLayerIds: [],
        canvasSize: { width: 800, height: 600 },
        activeTab: 'design',
        zoom: 1,
        showGrid: false,
        showRulers: false,
        artboards: [],
        activeArtboardId: null,
        projectId: null,
        projectTitle: 'Test Project',
        showShareModal: false,
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
        setCanvasSize: vi.fn(),
        setCanvasBackgroundColor: vi.fn(),
        setPanOffset: vi.fn(),
        setMode: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
        saveToHistory: vi.fn(),
        deleteSelectedLayers: vi.fn(),
        duplicateSelectedLayers: vi.fn(),
        selectAllLayers: vi.fn(),
        deselectAllLayers: vi.fn(),
        bringToFront: vi.fn(),
        sendToBack: vi.fn(),
        alignLeft: vi.fn(),
        alignCenter: vi.fn(),
        alignRight: vi.fn(),
        alignTop: vi.fn(),
        alignMiddle: vi.fn(),
        alignBottom: vi.fn(),
        groupSelectedLayers: vi.fn(),
        ungroupSelectedLayers: vi.fn(),
        toggleLayerVisibility: vi.fn(),
        toggleLayerLock: vi.fn(),
        reorderLayers: vi.fn(),
        saveProject: vi.fn(),
        reset: vi.fn(),
      });
    }
    return undefined;
  }),
}));

describe('Editor', () => {
  it('renders without crashing', () => {
    render(<Editor onBack={vi.fn()} user={{ id: 'user-1', email: 'test@test.com', name: 'Test User' } as any} />);
  });
});
