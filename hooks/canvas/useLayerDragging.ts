import { useState, useRef, useCallback, useEffect } from 'react';
import { Layer, Artboard } from '../../types';
import { SnapLine } from '../../utils/snappingOracle';
import { calculateSnaps as wasmCalculateSnaps, initEngine } from '../../utils/geometry-wasm';
import { SNAP_THRESHOLD } from '../../components/canvas/CanvasConstants';
import { haptics } from '../../utils/haptics';

interface UseLayerDraggingProps {
  layers: Layer[];
  selectedLayerIds: string[];
  activeArtboard: Artboard | undefined;
  zoom: number;
  onUpdateLayers: (updates: Record<string, Partial<Layer>>) => void;
  onSelectLayer: (id: string | null) => void;
  onMultiSelectLayer: (id: string, shift: boolean) => void;
  onInteractionStart?: () => void;
  onContextMenu?: (e: { clientX: number; clientY: number }, layerId: string) => void;
  triggerHaptic: (pattern?: number | number[]) => void;
}

export const useLayerDragging = ({
  layers,
  selectedLayerIds,
  activeArtboard,
  zoom,
  onUpdateLayers,
  onSelectLayer,
  onMultiSelectLayer,
  onInteractionStart,
  onContextMenu,
  triggerHaptic,
}: UseLayerDraggingProps) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);

  const dragStateRef = useRef(dragState);
  const layersRef = useRef(layers);
  const activeArtboardRef = useRef(activeArtboard);
  const zoomRef = useRef(zoom);
  const staticLayersRef = useRef<Layer[]>([]);
  const dragUpdateBuffer = useRef<Record<string, Partial<Layer>>>({});
  const bulkDragPreviewRef = useRef<Record<string, Partial<Layer>>>({});
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasSnappedToCenterRef = useRef(false);

  useEffect(() => {
    initEngine();
  }, []);

  useEffect(() => {
    dragStateRef.current = dragState;
    layersRef.current = layers;
    activeArtboardRef.current = activeArtboard;
    zoomRef.current = zoom;
  }, [dragState, layers, activeArtboard, zoom]);

  const startDragging = useCallback(
    (e: React.MouseEvent | React.TouchEvent, layer: Layer) => {
      if ('touches' in e && e.touches.length === 0) {
        return;
      }
      wasSnappedToCenterRef.current = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const isShift = 'shiftKey' in e ? e.shiftKey : false;
      const isRightClick = !('touches' in e) && e.button === 2;

      if (!('touches' in e)) {
        e.stopPropagation();
      }

      if (isRightClick) {
        onContextMenu?.({ clientX, clientY }, layer.id);
        return;
      }

      const isLockedRecursive = (l: Layer): boolean => {
        if (l.locked) {
          return true;
        }
        if (l.groupId) {
          const parent = layersRef.current.find((p) => p.id === l.groupId);
          if (parent) {
            return isLockedRecursive(parent);
          }
        }
        return false;
      };

      if (isLockedRecursive(layer) && !isShift) {
        return;
      }

      // Group-First Selection: If shift is NOT held and the target group isn't already selected,
      // select the top-most group. If the group IS already selected, allow selecting children.
      let targetToSelect = layer;
      const findTopMostGroup = (l: Layer): Layer => {
        if (!l.groupId) {
          return l;
        }
        const parent = layersRef.current.find((p) => p.id === l.groupId);
        if (parent) {
          // If the parent group is NOT selected, we should select it first
          const isParentSelected = selectedLayerIds.includes(parent.id);
          if (!isParentSelected) {
            return findTopMostGroup(parent);
          }
        }
        return l;
      };

      if (!isShift) {
        targetToSelect = findTopMostGroup(layer);
      }

      if ('touches' in e) {
        longPressTimerRef.current = setTimeout(() => {
          triggerHaptic(20);
          onContextMenu?.({ clientX, clientY }, targetToSelect.id);
          longPressTimerRef.current = null;
        }, 600);
      }

      const isAlreadySelected = selectedLayerIds.includes(targetToSelect.id);
      if (isShift) {
        onMultiSelectLayer(targetToSelect.id, true);
      } else if (!isAlreadySelected) {
        onSelectLayer(targetToSelect.id);
      }

      onInteractionStart?.();

      // Clear long-press timer on any movement (prevents context menu during drag)
      const clearLongPress = () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      };
      const onMoveForTimer = () => {
        clearLongPress();
        window.removeEventListener('mousemove', onMoveForTimer);
        window.removeEventListener('touchmove', onMoveForTimer);
      };
      window.addEventListener('mousemove', onMoveForTimer, { once: true });
      window.addEventListener('touchmove', onMoveForTimer, { once: true });

      const selectedIds =
        isShift || isAlreadySelected
          ? Array.from(new Set([...selectedLayerIds, targetToSelect.id]))
          : [targetToSelect.id];

      // Recursively find all children for grouped layers
      const findChildrenRecursive = (parentId: string, allLayers: Layer[]): string[] => {
        // ⚡ Bolt: Replaced chained .filter().map() with a single loop to avoid intermediate array allocations
        const children: string[] = [];
        for (let i = 0; i < allLayers.length; i++) {
          if (allLayers[i].groupId === parentId) {
            children.push(allLayers[i].id);
          }
        }
        let allChildren = [...children];
        for (let i = 0; i < children.length; i++) {
          allChildren = [...allChildren, ...findChildrenRecursive(children[i], allLayers)];
        }
        return allChildren;
      };

      let idsToMove = [...selectedIds];
      selectedIds.forEach((id) => {
        idsToMove = [...idsToMove, ...findChildrenRecursive(id, layersRef.current)];
      });
      idsToMove = Array.from(new Set(idsToMove));

      const initialPositions: Record<string, { x: number; y: number }> = {};
      const staticLayers: Layer[] = [];

      layersRef.current.forEach((l) => {
        if (idsToMove.includes(l.id)) {
          initialPositions[l.id] = { x: l.x, y: l.y };
        } else if (l.visible !== false) {
          staticLayers.push(l);
        }
      });

      staticLayersRef.current = staticLayers;

      setDragState({
        isDragging: true,
        startX: clientX,
        startY: clientY,
        initialPositions,
      });
    },
    [selectedLayerIds, onMultiSelectLayer, onSelectLayer, onInteractionStart, onContextMenu, triggerHaptic]
  );

  const updateDragging = useCallback(
    (e: MouseEvent) => {
      const currentDragState = dragStateRef.current;
      const currentActiveArtboard = activeArtboardRef.current;
      if (currentDragState?.isDragging && currentActiveArtboard) {
        const dx = (e.clientX - currentDragState.startX) / zoomRef.current;
        const dy = (e.clientY - currentDragState.startY) / zoomRef.current;

        const movingLayers = layersRef.current.filter((l) => currentDragState.initialPositions[l.id]);
        const currentMovingLayers = movingLayers.map((l) => ({
          ...l,
          x: currentDragState.initialPositions[l.id].x + dx,
          y: currentDragState.initialPositions[l.id].y + dy,
        }));

        const snap = wasmCalculateSnaps(
          currentMovingLayers,
          staticLayersRef.current,
          currentActiveArtboard,
          SNAP_THRESHOLD,
          zoomRef.current
        );

        setSnapLines(snap.lines);

        const isSnappedToCenter = snap.lines.some(
          (line) =>
            (line.type === 'vertical' && Math.abs(line.value - currentActiveArtboard.width / 2) < 0.5) ||
            (line.type === 'horizontal' && Math.abs(line.value - currentActiveArtboard.height / 2) < 0.5)
        );
        if (isSnappedToCenter && !wasSnappedToCenterRef.current) {
          haptics.snap();
        }
        wasSnappedToCenterRef.current = isSnappedToCenter;

        const pivotId = movingLayers[0]?.id;
        const finalDx =
          dx + (snap.x !== null && pivotId ? snap.x - (currentDragState.initialPositions[pivotId].x + dx) : 0);
        const finalDy =
          dy + (snap.y !== null && pivotId ? snap.y - (currentDragState.initialPositions[pivotId].y + dy) : 0);

        const buffer = dragUpdateBuffer.current;
        for (const key in buffer) {
          delete buffer[key];
        }

        Object.entries(currentDragState.initialPositions).forEach(([id, pos]) => {
          buffer[id] = { x: pos.x + finalDx, y: pos.y + finalDy };
        });
        bulkDragPreviewRef.current = { ...buffer };
        onUpdateLayers(bulkDragPreviewRef.current);
      }
    },
    [onUpdateLayers]
  );

  const finalizeDragging = useCallback(() => {
    if (Object.keys(bulkDragPreviewRef.current).length > 0) {
      onUpdateLayers(bulkDragPreviewRef.current);
      bulkDragPreviewRef.current = {};
    }
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setDragState(null);
    setSnapLines([]);
  }, [onUpdateLayers]);

  return {
    dragState,
    snapLines,
    startDragging,
    updateDragging,
    finalizeDragging,
    dragStateRef,
  };
};
