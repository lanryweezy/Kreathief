import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useStore from '../useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('state initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useStore());

      expect(result.current.layers).toEqual([]);
      expect(result.current.selectedLayerIds).toEqual([]);
      expect(result.current.mode).toBe('select');
      expect(result.current.canvasSize).toEqual({ width: 1920, height: 1080 });
      expect(result.current.canvasBackgroundColor).toBe('#ffffff');
    });
  });

  describe('layer management', () => {
    it('should add a layer', () => {
      const { result } = renderHook(() => useStore());

      const newLayer = {
        id: 'layer-1',
        type: 'text' as const,
        content: 'Hello World',
        x: 100,
        y: 100,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
      };

      act(() => {
        result.current.addLayer(newLayer);
      });

      expect(result.current.layers.length).toBe(1);
      expect(result.current.layers[0]).toEqual(newLayer);
    });

    it('should update a layer', () => {
      const { result } = renderHook(() => useStore());

      const initialLayer = {
        id: 'layer-1',
        type: 'text' as const,
        content: 'Original',
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
      };

      act(() => {
        result.current.addLayer(initialLayer);
      });

      act(() => {
        result.current.updateLayer('layer-1', { content: 'Updated', x: 50 });
      });

      const updatedLayer = result.current.layers[0];
      expect(updatedLayer.content).toBe('Updated');
      expect(updatedLayer.x).toBe(50);
      expect(updatedLayer.id).toBe('layer-1');
    });

    it('should delete a layer', () => {
      const { result } = renderHook(() => useStore());

      const layer = {
        id: 'layer-to-delete',
        type: 'shape' as const,
        content: { shapeType: 'rect' as const },
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
      };

      act(() => {
        result.current.addLayer(layer);
        result.current.deleteLayer('layer-to-delete');
      });

      expect(result.current.layers.length).toBe(0);
    });

    it('should duplicate a layer', () => {
      const { result } = renderHook(() => useStore());

      const originalLayer = {
        id: 'original',
        type: 'image' as const,
        content: 'https://example.com/image.png',
        x: 10,
        y: 10,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
      };

      act(() => {
        result.current.addLayer(originalLayer);
        result.current.duplicateLayer('original');
      });

      expect(result.current.layers.length).toBe(2);
      const duplicated = result.current.layers.find(l => l.id !== 'original');
      expect(duplicated).toBeDefined();
      expect(duplicated?.content).toBe(originalLayer.content);
      expect(duplicated?.x).toBe(originalLayer.x + 10); // Offset duplication
    });
  });

  describe('selection management', () => {
    it('should select a single layer', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLayer({
          id: 'selectable-layer',
          type: 'text' as const,
          content: 'Select me',
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
        result.current.selectLayer('selectable-layer');
      });

      expect(result.current.selectedLayerIds).toEqual(['selectable-layer']);
    });

    it('should select multiple layers', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLayer({
          id: 'layer-1',
          type: 'text' as const,
          content: 'Layer 1',
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
        result.current.addLayer({
          id: 'layer-2',
          type: 'shape' as const,
          content: { shapeType: 'rect' as const },
          x: 100,
          y: 100,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
        result.current.selectLayers(['layer-1', 'layer-2']);
      });

      expect(result.current.selectedLayerIds).toEqual(['layer-1', 'layer-2']);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectLayer('some-layer');
        result.current.clearSelection();
      });

      expect(result.current.selectedLayerIds).toEqual([]);
    });
  });

  describe('canvas settings', () => {
    it('should update canvas size', () => {
      const { result } = renderHook(() => useStore());

      const newSize = { width: 1080, height: 1080 };

      act(() => {
        result.current.setCanvasSize(newSize);
      });

      expect(result.current.canvasSize).toEqual(newSize);
    });

    it('should update background color', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setBackgroundColor('#ff0000');
      });

      expect(result.current.canvasBackgroundColor).toBe('#ff0000');
    });

    it('should apply canvas filters', () => {
      const { result } = renderHook(() => useStore());

      const filters = {
        blur: 5,
        brightness: 110,
        contrast: 120,
      };

      act(() => {
        result.current.setCanvasFilters(filters);
      });

      expect(result.current.canvasFilters).toEqual(filters);
    });
  });

  describe('mode management', () => {
    it('should set editor mode', () => {
      const { result } = renderHook(() => useStore());

      const modes: Array<'select' | 'pan' | 'draw' | 'text'> = ['select', 'pan', 'draw', 'text'];

      modes.forEach((mode) => {
        act(() => {
          result.current.setMode(mode);
        });
        expect(result.current.mode).toBe(mode);
      });
    });
  });

  describe('history operations', () => {
    it('should track history on layer changes', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLayer({
          id: 'history-test',
          type: 'text' as const,
          content: 'History Test',
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
      });

      // History should be tracked
      expect(result.current.history).toBeDefined();
    });

    it('should support undo operation', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLayer({
          id: 'undo-test',
          type: 'text' as const,
          content: 'Undo Me',
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
        result.current.undo();
      });

      // Layer should be removed after undo
      expect(result.current.layers.length).toBe(0);
    });

    it('should support redo operation', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLayer({
          id: 'redo-test',
          type: 'text' as const,
          content: 'Redo Me',
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
        result.current.undo();
        result.current.redo();
      });

      // Layer should be restored after redo
      expect(result.current.layers.length).toBe(1);
    });
  });

  describe('utility functions', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLayer({
          id: 'reset-test',
          type: 'text' as const,
          content: 'Reset Test',
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
        result.current.selectLayer('reset-test');
        result.current.reset();
      });

      expect(result.current.layers).toEqual([]);
      expect(result.current.selectedLayerIds).toEqual([]);
      expect(result.current.canvasSize).toEqual({ width: 1920, height: 1080 });
    });
  });
});
