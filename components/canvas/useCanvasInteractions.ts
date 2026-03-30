import { useState, useRef, useCallback, useEffect } from 'react';
import { Layer, Artboard } from '../../types';
import { SnappingOracle, SnapLine } from '../../utils/snappingOracle';
import { SNAP_THRESHOLD } from './CanvasConstants';

interface UseCanvasInteractionsProps {
  zoom: number;
  onZoomChangeValue: (z: number) => void;
  activeArtboard: Artboard | undefined;
  layers: Layer[];
  selectedLayerIds: string[];
  onUpdateLayers: (updates: Record<string, Partial<Layer>>) => void;
  onSelectLayer: (id: string | null) => void;
  onMultiSelectLayer: (id: string, shift: boolean) => void;
  onInteractionStart?: () => void;
  onContextMenu?: (e: { clientX: number; clientY: number }, layerId: string) => void;
  isDrawing: boolean;
  viewportRef: React.RefObject<HTMLDivElement>;
}

export const useCanvasInteractions = ({
  zoom,
  onZoomChangeValue,
  activeArtboard,
  layers,
  selectedLayerIds,
  onUpdateLayers,
  onSelectLayer,
  onMultiSelectLayer,
  onInteractionStart,
  onContextMenu,
  isDrawing,
  viewportRef,
}: UseCanvasInteractionsProps) => {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const panOffsetRef = useRef(panOffset);
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  const panStartRef = useRef({ x: 0, y: 0 });
  const bulkDragPreviewRef = useRef<Record<string, Partial<Layer>>>({});
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Haptics might fail on some platforms, ignore
      }
    }
  }, []);

  const handleMouseDownContainer = useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed) {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
      } else {
        onSelectLayer(null);
      }
    },
    [isSpacePressed, onSelectLayer]
  );

  const handleMouseDownLayer = useCallback(
    (e: React.MouseEvent | React.TouchEvent, layer: Layer) => {
      if (isSpacePressed || isDrawing || layer.locked) {
        return;
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const isShift = 'shiftKey' in e ? e.shiftKey : false;

      if (!('touches' in e)) {
        e.stopPropagation();
      }

      if ('touches' in e) {
        longPressTimerRef.current = setTimeout(() => {
          triggerHaptic(20);
          onContextMenu?.({ clientX, clientY }, layer.id);
          longPressTimerRef.current = null;
        }, 600);
      }

      const isAlreadySelected = selectedLayerIds.includes(layer.id);
      if (isShift) {
        onMultiSelectLayer(layer.id, true);
      } else if (!isAlreadySelected) {
        onSelectLayer(layer.id);
      }

      onInteractionStart?.();

      const idsToMove =
        isShift || isAlreadySelected ? Array.from(new Set([...selectedLayerIds, layer.id])) : [layer.id];

      const initialPositions: Record<string, { x: number; y: number }> = {};
      layers.forEach((l) => {
        if (idsToMove.includes(l.id)) {
          initialPositions[l.id] = { x: l.x, y: l.y };
        }
      });

      setDragState({
        isDragging: true,
        startX: clientX,
        startY: clientY,
        initialPositions,
      });
    },
    [
      isSpacePressed,
      isDrawing,
      selectedLayerIds,
      layers,
      onMultiSelectLayer,
      onSelectLayer,
      onInteractionStart,
      onContextMenu,
      triggerHaptic,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const newOffset = {
          x: panOffsetRef.current.x + dx,
          y: panOffsetRef.current.y + dy,
        };
        setPanOffset(newOffset);
        panOffsetRef.current = newOffset;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (dragState?.isDragging && activeArtboard) {
        const dx = (e.clientX - dragState.startX) / zoomRef.current;
        const dy = (e.clientY - dragState.startY) / zoomRef.current;

        const movingLayers = layers.filter((l) => dragState.initialPositions[l.id]);
        const currentMovingLayers = movingLayers.map((l) => ({
          ...l,
          x: dragState.initialPositions[l.id].x + dx,
          y: dragState.initialPositions[l.id].y + dy,
        }));

        const snap = SnappingOracle.calculateSnaps(
          currentMovingLayers,
          layers,
          activeArtboard,
          SNAP_THRESHOLD,
          zoomRef.current
        );

        setSnapLines(snap.lines);

        const pivotId = movingLayers[0]?.id;
        const finalDx = dx + (snap.x !== null && pivotId ? snap.x - (dragState.initialPositions[pivotId].x + dx) : 0);
        const finalDy = dy + (snap.y !== null && pivotId ? snap.y - (dragState.initialPositions[pivotId].y + dy) : 0);

        const updates: Record<string, Partial<Layer>> = {};
        Object.entries(dragState.initialPositions).forEach(([id, pos]) => {
          updates[id] = { x: pos.x + finalDx, y: pos.y + finalDy, dirty: true };
        });
        bulkDragPreviewRef.current = updates;
      }
    },
    [isPanning, dragState, activeArtboard, layers]
  );

  const handleMouseUp = useCallback(() => {
    if (Object.keys(bulkDragPreviewRef.current).length > 0) {
      onUpdateLayers(bulkDragPreviewRef.current);
      bulkDragPreviewRef.current = {};
    }
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setDragState(null);
    setIsPanning(false);
    setSnapLines([]);
  }, [onUpdateLayers]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        if (lastPinchDistanceRef.current !== null) {
          const delta = dist - lastPinchDistanceRef.current;
          onZoomChangeValue(Math.max(0.1, Math.min(5, zoomRef.current + delta * 0.01)));
        }
        lastPinchDistanceRef.current = dist;
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      lastPinchDistanceRef.current = null;
    };

    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [viewportRef, onZoomChangeValue]);

  return {
    panOffset,
    isPanning,
    isSpacePressed,
    setIsSpacePressed,
    handleMouseDownContainer,
    handleMouseDownLayer,
    layerRefs,
    snapLines,
  };
};
