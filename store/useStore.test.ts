import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStore } from './useStore';
import { AppMode } from '../types';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.reset();
      result.current.past = [];
      result.current.future = [];
      result.current.__lastStateSnapshot = null;
    });
  });

  describe('state initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useStore());

      // After reset, artboards should have 0 elements because of the way reset is implemented in useStore.ts
      expect(result.current.artboards).toEqual([]);
      expect(result.current.selectedLayerIds).toEqual([]);
      // Default mode in uiSlice is GENERATE
      expect(result.current.mode).toBe(AppMode.GENERATE);
      expect(result.current.canvasBackgroundColor).toBe('#ffffff');
    });
  });

  describe('layer management', () => {
    it('should add a layer to the active artboard', () => {
      const { result } = renderHook(() => useStore());

      // First add an artboard since reset clears them
      act(() => {
        result.current.addArtboard('Test Artboard');
      });

      const newLayer = {
        id: 'layer-1',
        type: 'text' as const,
        name: 'Test Layer',
        text: 'Hello World',
        x: 100,
        y: 100,
        width: 100,
        height: 40,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fontSize: 16,
        fontWeight: 'normal',
        fontFamily: 'Arial',
        color: '#000000',
        filters: {} as any,
        blendMode: 'normal' as const,
      };

      act(() => {
        result.current.addLayer(newLayer);
      });

      const activeArtboard = result.current.artboards.find(a => a.id === result.current.activeArtboardId);
      expect(activeArtboard?.layers.length).toBe(1);
      expect(activeArtboard?.layers[0].id).toBe('layer-1');
    });

    it('should update a layer', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtboard('Test Artboard');
      });

      const initialLayer = {
        id: 'layer-1',
        type: 'text' as const,
        name: 'Test Layer',
        text: 'Original',
        x: 0,
        y: 0,
        width: 100,
        height: 40,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fontSize: 16,
        fontWeight: 'normal',
        fontFamily: 'Arial',
        color: '#000000',
        filters: {} as any,
        blendMode: 'normal' as const,
      };

      act(() => {
        result.current.addLayer(initialLayer);
      });

      act(() => {
        result.current.updateLayer('layer-1', { text: 'Updated' } as any);
      });

      const activeArtboard = result.current.artboards.find(a => a.id === result.current.activeArtboardId);
      const updatedLayer = activeArtboard?.layers[0] as any;
      expect(updatedLayer.text).toBe('Updated');
    });

    it('should delete a layer', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtboard('Test Artboard');
      });

      const layer = {
        id: 'layer-to-delete',
        type: 'rectangle' as const,
        name: 'Box',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        color: '#000000',
        filters: {} as any,
        blendMode: 'normal' as const,
      } as any;

      act(() => {
        result.current.addLayer(layer);
        result.current.deleteLayer('layer-to-delete');
      });

      const activeArtboard = result.current.artboards.find(a => a.id === result.current.activeArtboardId);
      expect(activeArtboard ? activeArtboard.layers.length : 0).toBe(0);
    });
  });

  describe('selection management', () => {
    it('should select a single layer', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtboard();
        result.current.addLayer({
          id: 'selectable-layer',
          type: 'text' as const,
          name: 'Text',
          text: 'Select me',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          fontSize: 16,
          fontWeight: 'normal',
          fontFamily: 'Arial',
          color: '#000000',
          filters: {} as any,
          blendMode: 'normal' as const,
        });
        result.current.selectLayer('selectable-layer');
      });

      expect(result.current.selectedLayerIds).toEqual(['selectable-layer']);
    });

    it('should set selected layer IDs', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setSelectedLayerIds(['layer-1', 'layer-2']);
      });

      expect(result.current.selectedLayerIds).toEqual(['layer-1', 'layer-2']);
    });
  });

  describe('mode management', () => {
    it('should set editor mode', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setMode(AppMode.DRAW);
      });
      expect(result.current.mode).toBe(AppMode.DRAW);
    });
  });

  describe('history operations', () => {
    it('should support undo operation', async () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtboard('A1');
      });

      await new Promise(r => setTimeout(r, 10));

      act(() => {
        result.current.addLayer({
          id: 'undo-test',
          type: 'text' as const,
          name: 'Undo',
          text: 'Undo Me',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          fontSize: 16,
          fontWeight: 'normal',
          fontFamily: 'Arial',
          color: '#000000',
          filters: {} as any,
          blendMode: 'normal' as const,
        });
      });

      act(() => {
        result.current.undo();
      });

      const activeArtboard = result.current.artboards.find(a => a.id === result.current.activeArtboardId);
      expect(activeArtboard ? activeArtboard.layers.length : 0).toBe(0);
    });
  });
});
