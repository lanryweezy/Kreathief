import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKreathiefStore } from '../../../store/useStore';

describe('useKreathiefStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useKreathiefStore());
    act(() => {
      result.current.nodes.clear();
      result.current.selectedIds.clear();
      result.current.hoveredId = null;
      result.current.past = [];
      result.current.future = [];
    });
  });

  describe('initial state', () => {
    it('has empty nodes map', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.nodes.size).toBe(0);
    });

    it('has empty selection', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('has default zoom of 1', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.zoom).toBe(1);
    });

    it('has default pan of (0,0)', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.panX).toBe(0);
      expect(result.current.panY).toBe(0);
    });

    it('has darkMode default', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(typeof result.current.darkMode).toBe('boolean');
    });

    it('has showGrid default', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(typeof result.current.showGrid).toBe('boolean');
    });

    it('has empty toasts', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.toasts).toEqual([]);
    });

    it('has recentColors array', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(Array.isArray(result.current.recentColors)).toBe(true);
    });

    it('has empty past/future history', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.past).toEqual([]);
      expect(result.current.future).toEqual([]);
    });

    it('has empty suggestions', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.suggestions).toEqual([]);
    });

    it('has empty creativeSuggestions', () => {
      const { result } = renderHook(() => useKreathiefStore());
      expect(result.current.creativeSuggestions).toEqual([]);
    });
  });

  describe('setTool', () => {
    it('changes the active tool', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setTool('pen' as any);
      });
      expect(result.current.activeTool).toBe('pen');
    });
  });

  describe('addNode / updateNode / removeNode', () => {
    it('adds a node to the map', () => {
      const { result } = renderHook(() => useKreathiefStore());
      const node = {
        id: 'node-1',
        type: 'text',
        x: 100,
        y: 200,
        width: 150,
        height: 40,
      } as any;
      act(() => {
        result.current.addNode(node);
      });
      expect(result.current.nodes.size).toBe(1);
      expect(result.current.nodes.get('node-1')).toBeDefined();
    });

    it('updates a node', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addNode({ id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 40 } as any);
      });
      act(() => {
        result.current.updateNode('n1', { x: 500 } as any);
      });
      expect(result.current.nodes.get('n1')?.x).toBe(500);
    });

    it('removes a node', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addNode({ id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 40 } as any);
      });
      expect(result.current.nodes.size).toBe(1);
      act(() => {
        result.current.removeNode('n1');
      });
      expect(result.current.nodes.size).toBe(0);
    });

    it('handles removing non-existent node gracefully', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.removeNode('nonexistent');
      });
      expect(result.current.nodes.size).toBe(0);
    });
  });

  describe('selectNode', () => {
    it('selects nodes by ids', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addNode({ id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 40 } as any);
        result.current.addNode({ id: 'n2', type: 'text', x: 0, y: 0, width: 100, height: 40 } as any);
      });
      act(() => {
        result.current.selectNode(['n1', 'n2']);
      });
      expect(result.current.selectedIds.size).toBe(2);
      expect(result.current.selectedIds.has('n1')).toBe(true);
      expect(result.current.selectedIds.has('n2')).toBe(true);
    });

    it('clears selection with empty array', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addNode({ id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 40 } as any);
        result.current.selectNode(['n1']);
      });
      act(() => {
        result.current.selectNode([]);
      });
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('setHovered', () => {
    it('sets hovered node id', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setHovered('node-abc');
      });
      expect(result.current.hoveredId).toBe('node-abc');
    });

    it('clears hovered node', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setHovered('node-abc');
        result.current.setHovered(null);
      });
      expect(result.current.hoveredId).toBeNull();
    });
  });

  describe('zoom & pan', () => {
    it('sets zoom', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setZoom(2.5);
      });
      expect(result.current.zoom).toBe(2.5);
    });

    it('sets pan', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setPan(100, 200);
      });
      expect(result.current.panX).toBe(100);
      expect(result.current.panY).toBe(200);
    });
  });

  describe('toggle functions', () => {
    it('toggles dark mode', () => {
      const { result } = renderHook(() => useKreathiefStore());
      const before = result.current.darkMode;
      act(() => {
        result.current.toggleDarkMode();
      });
      expect(result.current.darkMode).toBe(!before);
    });

    it('toggles grid', () => {
      const { result } = renderHook(() => useKreathiefStore());
      const before = result.current.showGrid;
      act(() => {
        result.current.toggleGrid();
      });
      expect(result.current.showGrid).toBe(!before);
    });

    it('toggles rulers', () => {
      const { result } = renderHook(() => useKreathiefStore());
      const before = result.current.showRulers;
      act(() => {
        result.current.toggleRulers();
      });
      expect(result.current.showRulers).toBe(!before);
    });

    it('toggles snap to grid', () => {
      const { result } = renderHook(() => useKreathiefStore());
      const before = result.current.snapToGrid;
      act(() => {
        result.current.toggleSnapToGrid();
      });
      expect(result.current.snapToGrid).toBe(!before);
    });

    it('toggles expert mode', () => {
      const { result } = renderHook(() => useKreathiefStore());
      const before = result.current.expertMode;
      act(() => {
        result.current.toggleExpertMode();
      });
      expect(result.current.expertMode).toBe(!before);
    });
  });

  describe('setRightPanelTab', () => {
    it('changes right panel tab', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.setRightPanelTab('layers');
      });
      expect(result.current.rightPanelTab).toBe('layers');
    });
  });

  describe('undo / redo', () => {
    it('pushes commands to past', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.pushCommand('Move node', { panX: 0 } as any, { panX: 100 } as any);
      });
      expect(result.current.past.length).toBe(1);
      expect(result.current.past[0].label).toBe('Move node');
    });

    it('undo pops from past to future', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.pushCommand('Move node', { panX: 0 } as any, { panX: 100 } as any);
      });
      expect(result.current.past.length).toBe(1);
      act(() => {
        result.current.undo();
      });
      expect(result.current.past.length).toBe(0);
      expect(result.current.future.length).toBe(1);
    });

    it('redo pops from future to past', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.pushCommand('Move node', { panX: 0 } as any, { panX: 100 } as any);
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.redo();
      });
      expect(result.current.past.length).toBe(1);
      expect(result.current.future.length).toBe(0);
    });

    it('undo on empty history does nothing', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.undo();
      });
      expect(result.current.past.length).toBe(0);
      expect(result.current.future.length).toBe(0);
    });

    it('new push clears future', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.pushCommand('A', {} as any, {} as any);
        result.current.undo();
      });
      expect(result.current.future.length).toBe(1);
      act(() => {
        result.current.pushCommand('B', {} as any, {} as any);
      });
      expect(result.current.future.length).toBe(0);
    });
  });

  describe('toast management', () => {
    it('adds a toast', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addToast('info', 'Hello world');
      });
      expect(result.current.toasts.length).toBeGreaterThanOrEqual(1);
      const toast = result.current.toasts[result.current.toasts.length - 1];
      expect(toast.message).toBe('Hello world');
    });

    it('removes a toast by id', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addToast('info', 'Test message');
      });
      const toastId = result.current.toasts[result.current.toasts.length - 1].id;
      act(() => {
        result.current.removeToast(toastId);
      });
      expect(result.current.toasts.find((t) => t.id === toastId)).toBeUndefined();
    });
  });

  describe('color history', () => {
    it('adds a recent color', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addRecentColor('#ff0000');
      });
      expect(result.current.recentColors).toContain('#ff0000');
    });

    it('deduplicates recent colors', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.addRecentColor('#ff0000');
        result.current.addRecentColor('#ff0000');
      });
      const count = result.current.recentColors.filter((c) => c === '#ff0000').length;
      expect(count).toBe(1);
    });
  });

  describe('clearSuggestions', () => {
    it('clears suggestions array', () => {
      const { result } = renderHook(() => useKreathiefStore());
      act(() => {
        result.current.clearSuggestions();
      });
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.creativeSuggestions).toEqual([]);
    });
  });
});
