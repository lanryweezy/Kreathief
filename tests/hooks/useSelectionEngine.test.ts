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
    const { result } = renderHook(() => useSelectionEngine());
    act(() => result.current.marqueeSelect({ x: 0, y: 0, width: 100, height: 100 }));
    expect(mockSetSelectedLayerIds).toHaveBeenCalledWith(expect.arrayContaining(['l1']));
    mockState.artboards[0].layers[0] = layer({ id: 'l1', locked: true });
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
  it('selectionState defaults to idle', () => {
    const { result } = renderHook(() => useSelectionEngine());
    expect(result.current.selectionState).toBe('idle');
  });
});
