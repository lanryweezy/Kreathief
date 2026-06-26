import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStore } from '../../../../store/useStore';

describe('historySlice', () => {
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

  describe('saveToHistory', () => {
    it('creates a full snapshot on its first invocation', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.past = [];
        result.current.__lastStateSnapshot = null;
      });

      act(() => {
        result.current.saveToHistory();
      });

      expect(result.current.past.length).toBe(1);
      expect(result.current.past[0].type).toBe('snapshot');
      expect(result.current.past[0].state).toBeDefined();
      expect(result.current.past[0].patch).toBeUndefined();
    });
  });

  describe('undo', () => {
    it('works correctly using state patches', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtboard('A1');
      });

      // Clear the history that got triggered by addArtboard
      act(() => {
        result.current.past = [];
        result.current.__lastStateSnapshot = null;
        result.current.saveToHistory(); // create baseline snapshot
      });

      // We explicitly clear debounce interval logic for this test to be robust
      // because addLayer triggers saveToHistory itself, we don't need to manually call it.
      act(() => {
        result.current.addLayer({
          id: 'patch-layer',
          type: 'text' as const,
          name: 'Text',
          text: 'Hello',
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

      // Let's assert we have a baseline snapshot and a patch
      expect(result.current.past.length).toBeGreaterThanOrEqual(2);
      expect(result.current.past[result.current.past.length - 1].type).toBe('patch');

      const activeArtboard = result.current.artboards.find((a) => a.id === result.current.activeArtboardId);
      expect(activeArtboard?.layers.length).toBe(1);

      const pastLengthBeforeUndo = result.current.past.length;

      // 3. Undo
      act(() => {
        result.current.undo();
      });

      // State should be reverted (layer removed)
      const revertedArtboard = result.current.artboards.find((a) => a.id === result.current.activeArtboardId);
      expect(revertedArtboard ? revertedArtboard.layers.length : 0).toBe(0);
      expect(result.current.past.length).toBe(pastLengthBeforeUndo - 1);
      expect(result.current.future.length).toBe(1);
    });
  });

  describe('redo', () => {
    it('works correctly using state patches', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtboard('A1');
      });

      act(() => {
        result.current.past = [];
        result.current.__lastStateSnapshot = null;
        result.current.saveToHistory(); // create baseline snapshot
      });

      act(() => {
        result.current.addLayer({
          id: 'patch-layer-redo',
          type: 'text' as const,
          name: 'Text',
          text: 'Hello Redo',
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

      const pastLengthBeforeUndo = result.current.past.length;

      act(() => {
        result.current.undo();
      });

      expect(result.current.past.length).toBe(pastLengthBeforeUndo - 1);
      expect(result.current.future.length).toBe(1);

      act(() => {
        result.current.redo();
      });

      const activeArtboard = result.current.artboards.find((a) => a.id === result.current.activeArtboardId);
      expect(activeArtboard?.layers.length).toBe(1);
      expect(activeArtboard?.layers[0].id).toBe('patch-layer-redo');
      expect(result.current.past.length).toBe(pastLengthBeforeUndo);
      expect(result.current.future.length).toBe(0);
    });
  });

  describe('batching', () => {
    it('consolidates multiple operations into a single history entry', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtboard('A1');
      });

      act(() => {
        result.current.past = [];
        result.current.__lastStateSnapshot = null;
        result.current.saveToHistory(); // create baseline snapshot
      });

      const initialHistoryLength = result.current.past.length;

      act(() => {
        result.current.beginBatch();
      });

      act(() => {
        result.current.addLayer({
          id: 'batch-layer-1',
          type: 'text' as const,
          name: 'Text',
          text: 'One',
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
        result.current.addLayer({
          id: 'batch-layer-2',
          type: 'text' as const,
          name: 'Text',
          text: 'Two',
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

      // Assert that history hasn't been updated yet because we are batching
      expect(result.current.past.length).toBe(initialHistoryLength);

      act(() => {
        result.current.endBatch();
      });

      // Now history should only be increased by 1, and it's a snapshot
      expect(result.current.past.length).toBe(initialHistoryLength + 1);
      const activeArtboard = result.current.artboards.find((a) => a.id === result.current.activeArtboardId);
      expect(activeArtboard?.layers.length).toBe(2);
      expect(result.current.past[result.current.past.length - 1].type).toBe('snapshot');
    });
  });
});
