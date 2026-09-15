import { useState, useCallback, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Layer } from '../types';
import { buildSceneGraph } from '../types/sceneGraph';
import { isNodeEffectivelyLocked, isNodeEffectivelyVisible } from '../utils/sceneGraph';

export type SelectionState = 'idle' | 'selecting' | 'dragging' | 'resizing' | 'rotating';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function pointInLayer(point: { x: number; y: number }, layer: Layer): boolean {
  const lx = layer.x ?? 0;
  const ly = layer.y ?? 0;
  const lw = layer.width ?? 0;
  const lh = layer.height ?? 0;
  return point.x >= lx && point.x <= lx + lw && point.y >= ly && point.y <= ly + lh;
}

export function useSelectionEngine() {
  const [selectionState, setSelectionState] = useState<SelectionState>('idle');
  const lastCycleIndexRef = useRef<number>(-1);
  const lastCyclePointRef = useRef<{ x: number; y: number } | null>(null);

  const selectedIds = useStore((s) => s.selectedLayerIds);
  const artboards = useStore((s) => s.artboards);
  const activeArtboardId = useStore((s) => s.activeArtboardId);

  const activeLayers: Layer[] = (() => {
    const ab = artboards?.find((a: any) => a.id === activeArtboardId);
    return ab?.layers ?? [];
  })();

  // ⚡ Bolt: Memoize the scene graph to prevent O(N) rebuilds on every isLocked/isVisible check
  const graph = useMemo(() => buildSceneGraph(activeLayers), [activeLayers]);

  const isLocked = useCallback(
    (id: string): boolean => {
      const node = graph.nodeMap.get(id);
      if (node) {
        return isNodeEffectivelyLocked(node);
      }
      // Fallback in case layer was just added and graph hasn't rebuilt yet
      const layer = activeLayers.find((l) => l.id === id);
      return layer?.locked ?? false;
    },
    [activeLayers, graph]
  );

  const isVisible = useCallback(
    (id: string): boolean => {
      const node = graph.nodeMap.get(id);
      if (node) {
        return isNodeEffectivelyVisible(node);
      }
      const layer = activeLayers.find((l) => l.id === id);
      return layer?.visible !== false;
    },
    [activeLayers, graph]
  );

  const select = useCallback(
    (id: string) => {
      if (isLocked(id)) {return;}
      useStore.getState().selectLayer(id);
    },
    [isLocked]
  );

  const multiSelect = useCallback(
    (id: string) => {
      if (isLocked(id)) {return;}
      useStore.getState().multiSelectLayer(id, true);
    },
    [isLocked]
  );

  const marqueeSelect = useCallback(
    (rect: Rect, layers?: Layer[]) => {
      const targets = layers ?? activeLayers;
      const ids = targets
        .filter((l) => !isLocked(l.id) && rectsOverlap(rect, { x: l.x, y: l.y, width: l.width, height: l.height }))
        .map((l) => l.id);
      useStore.getState().setSelectedLayerIds(ids);
    },
    [activeLayers, isLocked]
  );

  const clearSelection = useCallback(() => {
    useStore.getState().setSelectedLayerIds([]);
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  /**
   * Smart Selection:
   * When clicking at a point where multiple layers overlap, repeated calls smoothly cycle
   * selection through all overlapping layers from front-to-back.
   */
  const cycleSelectAtPoint = useCallback(
    (point: { x: number; y: number }): string | null => {
      // Find all unlocked, visible layers that contain this point
      const candidates = activeLayers.filter((l) => {
        if (isLocked(l.id) || !isVisible(l.id)) {return false;}
        return pointInLayer(point, l);
      });

      if (candidates.length === 0) {
        clearSelection();
        lastCycleIndexRef.current = -1;
        lastCyclePointRef.current = null;
        return null;
      }

      // Check if clicking at approximately the same point (within 5px)
      const lastPoint = lastCyclePointRef.current;
      const isSameLocation = lastPoint && Math.abs(lastPoint.x - point.x) <= 5 && Math.abs(lastPoint.y - point.y) <= 5;

      let nextIndex = 0;
      if (isSameLocation && lastCycleIndexRef.current !== -1) {
        nextIndex = (lastCycleIndexRef.current + 1) % candidates.length;
      } else {
        // If one of the overlapping layers is already selected, start from the next one
        const currentIdx = candidates.findIndex((c) => selectedIds.includes(c.id));
        nextIndex = currentIdx !== -1 ? (currentIdx + 1) % candidates.length : 0;
      }

      const chosen = candidates[nextIndex];
      lastCycleIndexRef.current = nextIndex;
      lastCyclePointRef.current = point;

      if (chosen) {
        select(chosen.id);
        return chosen.id;
      }

      return null;
    },
    [activeLayers, isLocked, isVisible, selectedIds, select, clearSelection]
  );

  // State transitions
  const startDragging = useCallback(() => setSelectionState('dragging'), []);
  const startResizing = useCallback(() => setSelectionState('resizing'), []);
  const startRotating = useCallback(() => setSelectionState('rotating'), []);
  const startSelecting = useCallback(() => setSelectionState('selecting'), []);
  const endInteraction = useCallback(() => setSelectionState('idle'), []);

  return {
    selectionState,
    setSelectionState,
    startDragging,
    startResizing,
    startRotating,
    startSelecting,
    endInteraction,
    selectedIds,
    select,
    multiSelect,
    marqueeSelect,
    clearSelection,
    isSelected,
    isLocked,
    cycleSelectAtPoint,
  };
}
