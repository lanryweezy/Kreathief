import { useRef, useCallback, useEffect } from 'react';
import { Layer, Artboard } from '../../types';
import { useCanvasPanning } from '../../hooks/canvas/useCanvasPanning';
import { useCanvasSelection } from '../../hooks/canvas/useCanvasSelection';
import { useLayerDragging } from '../../hooks/canvas/useLayerDragging';
import { useLayerTransformation } from '../../hooks/canvas/useLayerTransformation';
import { useDrawingMode } from '../../hooks/canvas/useDrawingMode';

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
    panOffsetRef: _panOffsetRef
  } = useCanvasPanning();

  const {
    selectionBox,
    startSelection,
    updateSelection,
    finalizeSelection,
    selectionBoxRef
  } = useCanvasSelection({
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
    dragStateRef
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
    triggerHaptic
  });

  // 4. Transformation Hook
  const {
    transformState,
    handleResizeStart,
    handleRotateStart,
    updateTransformation,
    finalizeTransformation
  } = useLayerTransformation({
    layers,
    zoom,
    onUpdateLayers
  });

  // 5. Drawing Hook
  const {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isDrawingInternalRef: _isDrawingInternalRef
  } = useDrawingMode({ zoom, isDrawing });

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
      if (isSpacePressed || isDrawing || layer.locked) {
        return;
      }
      startDragging(e, layer);
    },
    [isSpacePressed, isDrawing, startDragging]
  );

  const handleMouseMoveInternal = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        updatePanning(e);
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

      if (isDrawing) {
        handleDrawingMouseMove(e);
        return;
      }

      if (transformState) {
        updateTransformation(e);
      }
    },
    [isPanning, updatePanning, updateSelection, updateDragging, updateTransformation, selectionBoxRef, dragStateRef, transformState, isDrawing, handleDrawingMouseMove]
  );

  const handleMouseUpInternal = useCallback(() => {
    if (selectionBoxRef.current) {
      finalizeSelection(selectedLayerIds);
    }

    if (dragStateRef.current?.isDragging) {
      finalizeDragging();
    }

    if (transformState) {
      finalizeTransformation();
    }

    if (isDrawing) {
      handleDrawingMouseUp();
    }
    
    stopPanning();
  }, [selectedLayerIds, finalizeSelection, finalizeDragging, finalizeTransformation, stopPanning, selectionBoxRef, dragStateRef, transformState, isDrawing, handleDrawingMouseUp]);

  // Global Event Listeners
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMouseMoveInternal(e);
    const onMouseUp = () => handleMouseUpInternal();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleMouseMoveInternal, handleMouseUpInternal]);

  // Mobile Pinch/Zoom
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // ZOOM AT CURSOR POSITION
        const zoomFactor = 1.05; // More precise zoom
        const newZoom = e.deltaY > 0 
          ? Math.max(0.1, zoom / zoomFactor) 
          : Math.min(10, zoom * zoomFactor);
        
        if (newZoom !== zoom && viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const worldX = (mouseX - panOffset.x) / zoom;
          const worldY = (mouseY - panOffset.y) / zoom;

          const newPanX = mouseX - worldX * newZoom;
          const newPanY = mouseY - worldY * newZoom;

          onZoomChangeValue(newZoom);
          useStore.getState().setPanOffset({ x: newPanX, y: newPanY });
        }
      } else {
        // SCROLL PANNING
        e.preventDefault();
        const scrollSpeed = 0.8;
        if (e.shiftKey) {
          useStore.getState().setPanOffset(prev => ({
            x: prev.x - e.deltaY * scrollSpeed,
            y: prev.y - e.deltaX * scrollSpeed
          }));
        } else {
          useStore.getState().setPanOffset(prev => ({
            x: prev.x - e.deltaX * scrollSpeed,
            y: prev.y - e.deltaY * scrollSpeed
          }));
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [viewportRef, onZoomChangeValue, zoom, panOffset]);

  const handleMouseDownCombined = useCallback((e: React.MouseEvent) => {
    // Middle mouse button (button 1) always pans
    if (e.button === 1) {
      e.preventDefault();
      startPanning(e);
      return;
    }
    handleMouseDownContainer(e);
  }, [handleMouseDownContainer, startPanning]);

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
