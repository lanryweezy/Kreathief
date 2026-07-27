import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKreathiefStore, useStore } from '../../../store/useStore';

describe('useKreathiefStore', () => {
  beforeEach(() => {
    act(() => {
      useStore.getState().reset();
      useStore.getState().setArtboards([
        { id: 'artboard-1', name: 'Artboard 1', width: 1080, height: 1080, x: 0, y: 0, layers: [] },
      ]);
      useStore.getState().setActiveArtboardId('artboard-1');
    });
  });

  describe('initial state', () => {
    it('has initial artboards', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(Array.isArray(result.current.artboards)).toBe(true);
      expect(result.current.artboards.length).toBeGreaterThan(0);
    });

    it('has empty or default selection', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(Array.isArray(result.current.selectedLayerIds)).toBe(true);
    });

    it('has default zoom of 1', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.zoom).toBe(1);
    });

    it('has default panOffset', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.panOffset).toBeDefined();
    });

    it('has showGrid default', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(typeof result.current.showGrid).toBe('boolean');
    });

    it('has empty toasts', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.toasts).toEqual([]);
    });
  });

  describe('setActiveTab', () => {
    it('changes the active tab', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setActiveTab('TEXT');
      });
      expect(result.current.activeTab).toBe('TEXT');
    });
  });

  describe('addLayer / updateLayer / deleteLayer', () => {
    it('adds a layer to active artboard', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addLayer({
          id: 'test-layer-1',
          type: 'shape',
          shapeType: 'rectangle',
          name: 'Test Rectangle',
          x: 10,
          y: 20,
          width: 100,
          height: 100,
          fill: '#ff0000',
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0,
        } as any);
      });
      const ab = result.current.artboards.find((a) => a.id === 'artboard-1');
      const layer = ab?.layers.find((l) => l.id === 'test-layer-1');
      expect(layer).toBeDefined();
      expect(layer?.name).toBe('Test Rectangle');
    });

    it('updates a layer', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addLayer({
          id: 'test-layer-2',
          type: 'shape',
          name: 'Old Name',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
        } as any);
      });
      act(() => {
        result.current.updateLayer('test-layer-2', { name: 'Updated Name' });
      });
      const ab = result.current.artboards.find((a) => a.id === 'artboard-1');
      const layer = ab?.layers.find((l) => l.id === 'test-layer-2');
      expect(layer?.name).toBe('Updated Name');
    });

    it('deletes a layer', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addLayer({
          id: 'test-layer-3',
          type: 'shape',
          name: 'To Delete',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
        } as any);
      });
      act(() => {
        result.current.deleteLayer('test-layer-3');
      });
      const ab = result.current.artboards.find((a) => a.id === 'artboard-1');
      const layer = ab?.layers.find((l) => l.id === 'test-layer-3');
      expect(layer).toBeUndefined();
    });
  });

  describe('selectLayer', () => {
    it('selects layers by id', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setSelectedLayerIds(['layer-a', 'layer-b']);
      });
      expect(result.current.selectedLayerIds).toEqual(['layer-a', 'layer-b']);
    });
  });

  describe('zoom & pan', () => {
    it('sets zoom', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setZoom(1.5);
      });
      expect(result.current.zoom).toBe(1.5);
    });

    it('sets panOffset', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setPanOffset({ x: 100, y: 200 });
      });
      expect(result.current.panOffset).toEqual({ x: 100, y: 200 });
    });
  });

  describe('toggle functions', () => {
    it('toggles grid', () => {
      const { result } = renderHook(() => useKreathiefStore());
      const initial = result.current.showGrid;
      act(() => {
        result.current.setShowGrid(!initial);
      });
      expect(result.current.showGrid).toBe(!initial);
    });
  });

  describe('toast management', () => {
    it('adds a toast', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addToast('Test toast message', 'info');
      });
      expect(result.current.toasts.length).toBeGreaterThan(0);
      expect(result.current.toasts[0].message).toBe('Test toast message');
    });

    it('removes a toast by id', () => {
      const { result } = renderHook(() => useKreathiefStore());
      let toastId = '';
      act(() => {
        result.current.addToast('Toast to remove', 'success');
      });
      toastId = result.current.toasts[0].id;
      act(() => {
        result.current.removeToast(toastId);
      });
      expect(result.current.toasts.find((t) => t.id === toastId)).toBeUndefined();
    });
  });
});
