import { useRef, useCallback, useEffect } from 'react';
import { Layer, Artboard } from '../../types';
import { useCanvasPanning } from '../../hooks/canvas/useCanvasPanning';
import { useCanvasSelection } from '../../hooks/canvas/useCanvasSelection';
import { useLayerDragging } from '../../hooks/canvas/useLayerDragging';
import { useLayerTransformation } from '../../hooks/canvas/useLayerTransformation';
import { useDrawingMode } from '../../hooks/canvas/useDrawingMode';
import { useStore } from '../../store/useStore';

interface UseCanvasInteractionsProps {
  zoom: number;
  onZoomChangeValue: (z: number) => void;
  activeArtboard: Artboard | undefined;
  artboards: Artboard[];
  layers: Layer[];
  selectedLayerIds: string[];
  onUpdateLayers: (updates: Record<string, Partial<Layer>>) => void;
  onSelectLayer: (id: string | null) => void;
  onMultiSelectLayer: (id: string, shift: boolean) => void;
  setSelectedLayerIds: (ids: string[]) => void;
  onInteractionStart?: () => void;
  onContextMenu?: (e: { clientX: number; clientY: number }, layerId: string) => void;
  isDrawing: boolean;
  viewportRef: React.RefObject<HTMLDivElement>;
}

export const useCanvasInteractions = ({
  zoom,
  onZoomChangeValue,
  activeArtboard,
  artboards,
  layers,
  selectedLayerIds,
  onUpdateLayers,
  onSelectLayer,
  onMultiSelectLayer,
  setSelectedLayerIds,
  onInteractionStart,
  onContextMenu,
  isDrawing,
  viewportRef,
}: UseCanvasInteractionsProps) => {
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastPinchDistanceRef = useRef<number | null>(null);
  const selectedLayerIdsRef = useRef(selectedLayerIds);
  selectedLayerIdsRef.current = selectedLayerIds;

  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Haptics might fail on some platforms, ignore
      }
    }
  }, []);

  // 1. Panning Hook
  const {
    panOffset,
    setPanOffset: _setPanOffset,
    isPanning,
    setIsPanning: _setIsPanning,
    isSpacePressed,
    setIsSpacePressed,
    startPanning,
    updatePanning,
    stopPanning,
    panOffsetRef,
  } = useCanvasPanning();

  const { selectionBox, startSelection, updateSelection, finalizeSelection, selectionBoxRef } = useCanvasSelection({
    artboards,
    onSelectLayer,
    setSelectedLayerIds,
    zoom,
    panOffset,
    viewportRef,
  });

  // 3. Dragging Hook
  const {
    dragState: _dragState,
    snapLines,
    startDragging,
    updateDragging,
    finalizeDragging,
    dragStateRef,
  } = useLayerDragging({
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
  });

  // 4. Transformation Hook
  const { transformState, handleResizeStart, handleRotateStart, updateTransformation, finalizeTransformation } =
    useLayerTransformation({
      layers,
      zoom,
      onUpdateLayers,
      panOffset,
      viewportRef,
      activeArtboard,
    });

  // 5. Drawing Hook
  const {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isDrawingInternalRef: _isDrawingInternalRef,
  } = useDrawingMode({ zoom, isDrawing });

  // 6. Smart Mask Mode
  const isSmartMaskMode = useStore((state) => state.isSmartMaskMode);
  const isSmartMaskModeRef = useRef(isSmartMaskMode);
  isSmartMaskModeRef.current = isSmartMaskMode;

  // Use refs for values that change frequently but shouldn't re-register listeners
  const isPanningRef = useRef(isPanning);
  isPanningRef.current = isPanning;
  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;
  const transformStateRef = useRef(transformState);
  transformStateRef.current = transformState;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // ORCHESTRATION LOGIC
  const handleMouseDownContainer = useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed) {
        startPanning(e);
      } else if (isDrawing) {
        handleDrawingMouseDown(e);
      } else {
        startSelection(e);
      }
    },
    [isSpacePressed, isDrawing, startPanning, startSelection, handleDrawingMouseDown]
  );

  const handleMouseDownLayer = useCallback(
    (e: React.MouseEvent | React.TouchEvent, layer: Layer) => {
      if (isSmartMaskModeRef.current) {
        const store = useStore.getState();
        const mask = store.hoveredMaskBoundary;
        if (mask && layer.type === 'image') {
          store.setIsSmartMaskMode?.(false);
          store.updateLayer(layer.id, { maskPath: mask.path, maskType: 'lasso' });
          store.addToast?.('Smart mask applied!', 'success');
        }
        return;
      }

      if (isSpacePressed || isDrawing || layer.locked) {
        return;
      }
      startDragging(e, layer);
    },
    [isSpacePressed, isDrawing, startDragging]
  );

  const handleMouseMoveInternal = useCallback(
    (e: MouseEvent) => {
      if (isPanningRef.current) {
        updatePanning(e);
        return;
      }

      if (isSmartMaskModeRef.current) {
        if (viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const worldX = (mouseX - panOffsetRef.current.x) / zoomRef.current;
          const worldY = (mouseY - panOffsetRef.current.y) / zoomRef.current;

          // Smart mask inference placeholder
          void worldX;
          void worldY;
        }
        return;
      }

      if (selectionBoxRef.current) {
        updateSelection(e);
        return;
      }

      if (dragStateRef.current?.isDragging) {
        updateDragging(e);
        return;
      }

      if (isDrawingRef.current) {
        handleDrawingMouseMove(e as any);
        return;
      }

      if (transformStateRef.current) {
        updateTransformation(e);
      }
    },
    [
      updatePanning,
      updateSelection,
      updateDragging,
      updateTransformation,
      selectionBoxRef,
      dragStateRef,
      handleDrawingMouseMove,
    ]
  );

  const handleMouseUpInternal = useCallback(() => {
    if (selectionBoxRef.current) {
      finalizeSelection(selectedLayerIdsRef.current);
    }

    if (dragStateRef.current?.isDragging) {
      finalizeDragging();
    }

    if (transformStateRef.current) {
      finalizeTransformation();
    }

    if (isDrawingRef.current) {
      handleDrawingMouseUp();
    }

    stopPanning();
  }, [
    finalizeSelection,
    finalizeDragging,
    finalizeTransformation,
    stopPanning,
    selectionBoxRef,
    dragStateRef,
    handleDrawingMouseUp,
  ]);

  // Global Event Listeners
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMouseMoveInternal(e);
    const onMouseUp = () => handleMouseUpInternal();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMouseMoveInternal({ clientX: touch.clientX, clientY: touch.clientY, target: e.target } as any);
      }
    };
    const onTouchEnd = () => handleMouseUpInternal();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleMouseMoveInternal, handleMouseUpInternal]);

  // Mobile Pinch/Zoom — the listener is registered once, so it must read live
  // zoom/pan values instead of closure captures (locals here went stale after
  // the first zoom/pan change, making ctrl+wheel zoom jump back to mount state)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const zoomFactor = 1.05;
        const currentZoom = (useStore.getState() as any).zoom || 1;
        const currentPan = panOffsetRef.current;
        const newZoom = e.deltaY > 0 ? Math.max(0.1, currentZoom / zoomFactor) : Math.min(10, currentZoom * zoomFactor);

        if (newZoom !== currentZoom && viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const worldX = (mouseX - currentPan.x) / currentZoom;
          const worldY = (mouseY - currentPan.y) / currentZoom;

          const newPanX = mouseX - worldX * newZoom;
          const newPanY = mouseY - worldY * newZoom;

          // Sync the ref immediately so rapid wheel events (before the next
          // React render) chain from the freshest pan value
          panOffsetRef.current = { x: newPanX, y: newPanY };
          onZoomChangeValue(newZoom);
          useStore.getState().setPanOffset({ x: newPanX, y: newPanY });
        }
      } else {
        e.preventDefault();
        const scrollSpeed = 0.8;
        if (e.shiftKey) {
          useStore.getState().setPanOffset((prev: { x: number; y: number }) => ({
            x: prev.x - e.deltaY * scrollSpeed,
            y: prev.y - e.deltaX * scrollSpeed,
          }));
        } else {
          useStore.getState().setPanOffset((prev: { x: number; y: number }) => ({
            x: prev.x - e.deltaX * scrollSpeed,
            y: prev.y - e.deltaY * scrollSpeed,
          }));
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [viewportRef, onZoomChangeValue]);

  const handleMouseDownCombined = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button (button 1) always pans
      if (e.button === 1) {
        e.preventDefault();
        startPanning(e);
        return;
      }
      handleMouseDownContainer(e);
    },
    [handleMouseDownContainer, startPanning]
  );

  return {
    panOffset,
    isPanning,
    isSpacePressed,
    setIsSpacePressed,
    handleMouseDownCombined,
    handleMouseDownLayer,
    handleResizeStart,
    handleRotateStart,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    layerRefs,
    snapLines,
    selectionBox,
  };
};
