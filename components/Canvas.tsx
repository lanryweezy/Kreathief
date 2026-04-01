import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { activeArtboardSelector, selectedLayerIdSelector, selectedLayersSelector } from '../store/selectors';
import { TextLayer, ShapeLayer, ImageLayer, Layer, AnimationSettings } from '../types';
import { ANIMATION_STYLES } from './canvas/CanvasConstants';
import { ErrorBoundary } from './ErrorBoundary';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { haptics } from '../utils/haptics';

// Specialized Sub-components & Hooks
import { useCanvasInteractions } from './canvas/useCanvasInteractions';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import { CanvasControls } from './canvas/CanvasControls';
import { CanvasGuides } from './canvas/CanvasGuides';
import { ContextualToolbar } from './canvas/ContextualToolbar';

interface CanvasProps {
  zoom: number;
  onZoomChange: (z: number) => void;
  onFileUpload?: (files: File[]) => void;
  onAddLogoToCanvas: (url: string) => void;
  onDoubleClickLayer?: (layer: Layer) => void;
  uploadedImage?: string | null;
  onInteractionStart?: () => void;
  onUpdateTextLayerProp?: (id: string, changes: Partial<TextLayer>) => void;
  onUpdateShapeLayerProp?: (id: string, changes: Partial<ShapeLayer>) => void;
  onUpdateImageLayerProp?: (id: string, changes: Partial<ImageLayer>) => void;
  onOpenAIPanel?: () => void;
  onOpenTemplates?: () => void;
  booleanPreview?: { path: string; operation: string } | null;
  onUpdatePath?: (path: any) => void;
  onSelectLayer?: (id: string | null) => void;
  previewAnimation?: AnimationSettings;
}

const CanvasComponent: React.FC<CanvasProps> = (props) => {
  const { zoom, onZoomChange, onDoubleClickLayer, onInteractionStart, booleanPreview = null } = props;

  // Local state for specialized modes
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

  // Essential store state
  const artboards = useStore((state) => state.artboards);
  const activeArtboard = useStore(activeArtboardSelector);
  const activeArtboardId = activeArtboard?.id || (artboards[0]?.id ?? '');

  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);
  const canvasFilters = useStore((state) => state.canvasFilters);
  const layers = useMemo(() => activeArtboard?.layers || [], [activeArtboard]);
  const allLayers = useMemo(() => artboards.flatMap(a => a.layers), [artboards]);
  const selectedLayers = useStore(selectedLayersSelector);

  const onUpdateLayers = useStore((state) => state.updateLayers);
  const onSelectLayer = useStore((state) => state.selectLayer);
  const onMultiSelectLayer = useStore((state) => state.multiSelectLayer);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const showGrid = useStore((state) => state.showGrid);
  const isDrawing = useStore((state) => state.isPenMode);

  const viewportRef = useRef<HTMLDivElement>(null);
  const textEditRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const refineCanvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction Hook
  const { 
    panOffset, 
    isPanning, 
    isSpacePressed, 
    handleMouseDownContainer, 
    handleMouseDownLayer, 
    layerRefs, 
    snapLines,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    selectionBox
  } = useCanvasInteractions({
      zoom,
      onZoomChangeValue: onZoomChange,
      activeArtboard,
      layers,
      selectedLayerIds,
      onUpdateLayers,
      onSelectLayer: (id) => onSelectLayer?.(id),
      onMultiSelectLayer,
      onInteractionStart,
      onContextMenu: (pos, id) => setContextMenu({ x: pos.clientX, y: pos.clientY, layerId: id }),
      isDrawing,
      viewportRef,
    });

  // Mobile Touch Gestures Integration
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const initialZoom = useRef(zoom);
  const initialRotation = useRef(0);

  useTouchGestures(viewportRef, {
    enabled: isMobile,
    onPinchZoom: (scale, center) => {
      const newZoom = initialZoom.current * scale;
      const clampedZoom = Math.max(0.1, Math.min(10, newZoom));
      onZoomChange(clampedZoom);
    },
    onRotate: (angle, center) => {
      if (selectedLayerIds.length === 1) {
        const selectedLayer = layers.find(l => l.id === selectedLayerIds[0]);
        if (selectedLayer && selectedLayer.type !== 'text') {
          const newRotation = (initialRotation.current + angle) % 360;
          onUpdateLayers({ [selectedLayer.id]: { rotation: newRotation } });
        }
      }
    },
    onPan: (deltaX, deltaY) => {
      // Pan handled by useCanvasInteractions
    },
    minZoom: 0.1,
    maxZoom: 10,
  });

  // Reset initial values on gesture end
  useEffect(() => {
    const handleTouchEnd = () => {
      initialZoom.current = zoom;
      if (selectedLayerIds.length === 1) {
        const selectedLayer = layers.find(l => l.id === selectedLayerIds[0]);
        if (selectedLayer) {
          initialRotation.current = (selectedLayer as any).rotation || 0;
        }
      }
    };

    if (isMobile && viewportRef.current) {
      viewportRef.current.addEventListener('touchend', handleTouchEnd);
      return () => {
        viewportRef.current?.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [zoom, selectedLayerIds, layers, isMobile]);

  // Use props.previewAnimation to avoid unused warning
  const currentPreviewAnimation = props.previewAnimation;

  const selectedLayerId = useStore(selectedLayerIdSelector);

  // Handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, layerId });
  }, []);

  const handleTextDoubleClick = useCallback((e: React.MouseEvent, layer: TextLayer) => {
    e.stopPropagation();
    setEditingTextId(layer.id);
    setTimeout(() => textEditRef.current?.focus(), 0);
  }, []);

  // FIX: Add rotation handler with snapping
  const handleRotateStart = useCallback((e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    
    const ROTATION_SNAP_ANGLE = 15;
    const ROTATION_SNAP_SHIFT_ANGLE = 45;
    
    const centerX = layer.x + (layer as any).width / 2;
    const centerY = layer.y + (layer as any).height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    // FIX: Add rotation snapping
    const isShiftKey = e.shiftKey;
    const snapAngle = isShiftKey ? ROTATION_SNAP_SHIFT_ANGLE : ROTATION_SNAP_ANGLE;
    
    // Snap to nearest increment
    const snappedAngle = Math.round(angle / snapAngle) * snapAngle;
    
    // Apply snapped rotation
    const finalRotation = snappedAngle;
    
    onUpdateLayers({ [layer.id]: { rotation: finalRotation } });
  }, [onUpdateLayers]);

  const finishEditingText = useCallback(() => {
    if (editingTextId && textEditRef.current) {
      const newText = textEditRef.current.innerText || textEditRef.current.textContent || '';
      const currentLayer = allLayers.find((l: Layer) => l.id === editingTextId);
      if (currentLayer && currentLayer.type === 'text' && currentLayer.text !== newText) {
        useStore.getState().saveToHistory();
        const updates: Partial<TextLayer> = {
          text: newText,
          name: newText.length > 20 ? newText.slice(0, 20) + '�' : newText,
        };
        onUpdateLayers?.({ [editingTextId]: updates });
      }
    }
    setEditingTextId(null);
  }, [editingTextId, allLayers, onUpdateLayers]);

  // Calculate Viewport Bounds for Culling
  const viewportBounds = useMemo(() => {
    const el = viewportRef.current;
    if (!el) {return null;}
    
    // Convert screen viewport to canvas coordinates
    return {
      x: -panOffset.x / zoom,
      y: -panOffset.y / zoom,
      width: el.clientWidth / zoom,
      height: el.clientHeight / zoom,
    };
  }, [panOffset, zoom]);

  // Simplified render
  return (
    <ErrorBoundary componentName="Canvas" variant="widget">
      <div className="flex-1 relative bg-[#13161a] overflow-hidden flex flex-col">
        <style>{ANIMATION_STYLES}</style>

        <div
          ref={viewportRef}
          className="flex-1 overflow-hidden relative bg-gray-900 touch-none select-none canvas-container"
          style={{ cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default' }}
          onMouseDown={handleMouseDownContainer}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <CanvasRenderer
              artboards={artboards}
              activeArtboardId={activeArtboardId}
              canvasBackgroundColor={canvasBackgroundColor}
              canvasFilters={canvasFilters}
              zoom={zoom}
              viewportBounds={viewportBounds}
              getEffectiveLayer={(l) => l}
              onLayerRef={(id, el) => {
                layerRefs.current[id] = el;
              }}
              handleMouseDownLayer={handleMouseDownLayer}
              handleResizeStart={() => {}}
              handleRotateStart={handleRotateStart}
              handleContextMenu={handleContextMenu}
              handleTextDoubleClick={handleTextDoubleClick}
              handleDropShape={() => {}}
              onDoubleClickLayer={onDoubleClickLayer}
              editingTextId={editingTextId}
              textEditRef={textEditRef}
              finishEditingText={finishEditingText}
              editingPathId={null}
              previewAnimation={currentPreviewAnimation || undefined}
              isInteracting={false}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              hoveredLayerId={hoveredLayerId}
              setHoveredLayerId={setHoveredLayerId}
              setActiveArtboardId={(id) => useStore.getState().setActiveArtboardId(id)}
              onAddArtboard={() => useStore.getState().addArtboard()}
              onDeleteArtboard={(id) => useStore.getState().deleteArtboard(id)}
              showGrid={showGrid}
              isDrawing={isDrawing}
              isRefining={false}
              drawingCanvasRef={drawingCanvasRef}
              refineCanvasRef={refineCanvasRef}
              handleDrawingMouseDown={handleDrawingMouseDown}
              handleDrawingMouseMove={handleDrawingMouseMove}
              handleDrawingMouseUp={handleDrawingMouseUp}
              isLassoMode={false}
              localLassoPoints={[]}
              booleanPreview={booleanPreview}
            />

                        <CanvasControls
              selectedLayerIds={selectedLayerIds}
              selectedLayers={selectedLayers}
              zoom={zoom}
              handleResizeStart={() => {}}
              handleRotateStart={() => {}}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
            />

            <CanvasGuides snapLines={snapLines} />

            <ContextualToolbar
              selectedLayerIds={selectedLayerIds}
              layers={allLayers}
              zoom={zoom}
            />

            {/* Selection Marquee */}
            {selectionBox && (
              <div
                className="absolute border border-[#7d2ae8] bg-[#7d2ae8]/10 z-[100] pointer-events-none"
                style={{
                  left: Math.min(selectionBox.start.x, selectionBox.end.x),
                  top: Math.min(selectionBox.start.y, selectionBox.end.y),
                  width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                  height: Math.abs(selectionBox.end.y - selectionBox.start.y),
                  borderStyle: 'dashed',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const Canvas = React.memo(CanvasComponent);






