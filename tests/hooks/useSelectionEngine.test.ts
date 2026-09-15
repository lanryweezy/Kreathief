import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSelectionEngine } from '../../hooks/useSelectionEngine';
import type { ShapeLayer } from '../../types';

const mockSelectLayer = vi.fn();
const mockMultiSelectLayer = vi.fn();
const mockSetSelectedLayerIds = vi.fn();
let mockState: any;

vi.mock('../../store/useStore', () => ({
  useStore: Object.assign(
    vi.fn((sel: any) => (typeof sel === 'function' ? sel(mockState) : mockState)),
    { getState: () => mockState }
  ),
}));

const layer = (o?: Partial<ShapeLayer>): ShapeLayer => ({
  id: 'l1',
  type: 'rectangle',
  color: '#f00',
  cornerRadius: 0,
  x: 10,
  y: 10,
  width: 80,
  height: 80,
  rotation: 0,
  opacity: 1,
  locked: false,
  visible: true,
  ...o,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    selectedLayerIds: [],
    artboards: [{ id: 'ab1', layers: [layer({ id: 'l1' }), layer({ id: 'l2', x: 200, y: 200 })] }],
    activeArtboardId: 'ab1',
    selectLayer: mockSelectLayer,
    multiSelectLayer: mockMultiSelectLayer,
    setSelectedLayerIds: mockSetSelectedLayerIds,
  };
});

describe('useSelectionEngine', () => {
  it('select(id) calls store.selectLayer', () => {
    const { result } = renderHook(() => useSelectionEngine());
    act(() => result.current.select('l1'));
    expect(mockSelectLayer).toHaveBeenCalledWith('l1');
  });
  it('multiSelect(id) calls store.multiSelectLayer', () => {
    const { result } = renderHook(() => useSelectionEngine());
    act(() => result.current.multiSelect('l1'));
    expect(mockMultiSelectLayer).toHaveBeenCalledWith('l1', true);
  });
  it('clearSelection empties selectedIds', () => {
    const { result } = renderHook(() => useSelectionEngine());
    act(() => result.current.clearSelection());
    expect(mockSetSelectedLayerIds).toHaveBeenCalledWith([]);
  });
  it('locked layer → select and multiSelect ignore it', () => {
    mockState.artboards[0].layers[0] = layer({ id: 'l1', locked: true });
    const { result } = renderHook(() => useSelectionEngine());
    act(() => result.current.select('l1'));
    act(() => result.current.multiSelect('l1'));
    expect(mockSelectLayer).not.toHaveBeenCalled();
    expect(mockMultiSelectLayer).not.toHaveBeenCalled();
  });
  it('marqueeSelect selects layers in rect and excludes locked', () => {
    const { result, rerender } = renderHook(() => useSelectionEngine());
    act(() => result.current.marqueeSelect({ x: 0, y: 0, width: 100, height: 100 }));
    expect(mockSetSelectedLayerIds).toHaveBeenCalledWith(expect.arrayContaining(['l1']));

    // Update layer in store and trigger a re-render to simulate React state updating,
    // which useSelectionEngine needs to pick up in its useMemo hook.
    mockState = {
      ...mockState,
      artboards: [{ id: 'ab1', layers: [layer({ id: 'l1', locked: true }), layer({ id: 'l2', x: 200, y: 200 })] }]
    };
    rerender();

    act(() => result.current.marqueeSelect({ x: 0, y: 0, width: 100, height: 100 }));
    expect(mockSetSelectedLayerIds.mock.calls[1][0]).not.toContain('l1');
  });
  it('isSelected returns correct boolean', () => {
    mockState.selectedLayerIds = ['l1'];
    const { result } = renderHook(() => useSelectionEngine());
    expect(result.current.isSelected('l1')).toBe(true);
    expect(result.current.isSelected('l2')).toBe(false);
  });
  it('isLocked returns correct boolean', () => {
    mockState.artboards[0].layers[0] = layer({ id: 'l1', locked: true });
    const { result } = renderHook(() => useSelectionEngine());
    expect(result.current.isLocked('l1')).toBe(true);
    expect(result.current.isLocked('l2')).toBe(false);
  });
  it('selectionState defaults to idle and transitions properly', () => {
    const { result } = renderHook(() => useSelectionEngine());
    expect(result.current.selectionState).toBe('idle');

    act(() => result.current.startDragging());
    expect(result.current.selectionState).toBe('dragging');

    act(() => result.current.startResizing());
    expect(result.current.selectionState).toBe('resizing');

    act(() => result.current.startRotating());
    expect(result.current.selectionState).toBe('rotating');

    act(() => result.current.startSelecting());
    expect(result.current.selectionState).toBe('selecting');

    act(() => result.current.endInteraction());
    expect(result.current.selectionState).toBe('idle');
  });

  describe('cycleSelectAtPoint', () => {
    it('returns null and clears selection when clicking empty area', () => {
      const { result } = renderHook(() => useSelectionEngine());
      let chosen: string | null = null;
      act(() => {
        chosen = result.current.cycleSelectAtPoint({ x: 999, y: 999 });
      });
      expect(chosen).toBeNull();
      expect(mockSetSelectedLayerIds).toHaveBeenCalledWith([]);
    });

    it('cycles through overlapping layers on repeated clicks at same point', () => {
      // l1 and l3 overlap at (20, 20)
      mockState.artboards[0].layers = [
        layer({ id: 'l1', x: 0, y: 0, width: 50, height: 50 }),
        layer({ id: 'l2', x: 200, y: 200, width: 50, height: 50 }),
        layer({ id: 'l3', x: 10, y: 10, width: 50, height: 50 }),
      ];

      const { result } = renderHook(() => useSelectionEngine());

      // First click at (20, 20) selects first candidate
      let sel1: string | null = null;
      act(() => {
        sel1 = result.current.cycleSelectAtPoint({ x: 20, y: 20 });
      });
      expect(sel1).toBe('l1');
      expect(mockSelectLayer).toHaveBeenCalledWith('l1');

      // Second click at same point cycles to second candidate (l3)
      let sel2: string | null = null;
      act(() => {
        sel2 = result.current.cycleSelectAtPoint({ x: 20, y: 20 });
      });
      expect(sel2).toBe('l3');
      expect(mockSelectLayer).toHaveBeenCalledWith('l3');

      // Third click cycles back to l1
      let sel3: string | null = null;
      act(() => {
        sel3 = result.current.cycleSelectAtPoint({ x: 20, y: 20 });
      });
      expect(sel3).toBe('l1');
    });

    it('skips locked or invisible layers when cycling', () => {
      mockState.artboards[0].layers = [
        layer({ id: 'l1', x: 0, y: 0, width: 50, height: 50, locked: true }),
        layer({ id: 'l2', x: 0, y: 0, width: 50, height: 50, visible: false }),
        layer({ id: 'l3', x: 0, y: 0, width: 50, height: 50 }),
      ];

      const { result } = renderHook(() => useSelectionEngine());
      let chosen: string | null = null;
      act(() => {
        chosen = result.current.cycleSelectAtPoint({ x: 25, y: 25 });
      });
      expect(chosen).toBe('l3');
      expect(mockSelectLayer).toHaveBeenCalledWith('l3');
    });
  });
});

