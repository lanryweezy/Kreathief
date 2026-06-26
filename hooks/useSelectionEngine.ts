import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Layer } from '../types';

type SelectionState = 'idle' | 'selecting' | 'dragging' | 'resizing' | 'rotating';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function useSelectionEngine() {
  const selectionState: SelectionState = 'idle';

  const selectedIds = useStore((s) => s.selectedLayerIds);
  const artboards = useStore((s) => s.artboards);
  const activeArtboardId = useStore((s) => s.activeArtboardId);

  const activeLayers: Layer[] = (() => {
    const ab = artboards.find((a) => a.id === activeArtboardId);
    return ab?.layers ?? [];
  })();

  const select = useCallback(
    (id: string) => {
      const layer = activeLayers.find((l) => l.id === id);
      if (layer?.locked) return;
      useStore.getState().selectLayer(id);
    },
    [activeLayers]
  );

  const multiSelect = useCallback(
    (id: string) => {
      const layer = activeLayers.find((l) => l.id === id);
      if (layer?.locked) return;
      useStore.getState().multiSelectLayer(id, true);
    },
    [activeLayers]
  );

  const marqueeSelect = useCallback(
    (rect: Rect, layers?: Layer[]) => {
      const targets = layers ?? activeLayers;
      const ids = targets
        .filter((l) => !l.locked && rectsOverlap(rect, { x: l.x, y: l.y, width: l.width, height: l.height }))
        .map((l) => l.id);
      useStore.getState().setSelectedLayerIds(ids);
    },
    [activeLayers]
  );

  const clearSelection = useCallback(() => {
    useStore.getState().setSelectedLayerIds([]);
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const isLocked = useCallback(
    (id: string) => activeLayers.find((l) => l.id === id)?.locked ?? false,
    [activeLayers]
  );

  return { selectionState, selectedIds, select, multiSelect, marqueeSelect, clearSelection, isSelected, isLocked };
}
