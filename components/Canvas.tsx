import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { TextLayer, ShapeLayer, ImageLayer, Layer, AnimationSettings } from '../types';
import { ANIMATION_STYLES } from './canvas/CanvasConstants';
import { ErrorBoundary } from './ErrorBoundary';

// Specialized Sub-components & Hooks
import { useCanvasInteractions } from './canvas/useCanvasInteractions';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import { CanvasControls } from './canvas/CanvasControls';
import { CanvasGuides } from './canvas/CanvasGuides';
import { SelectionMarquee } from './canvas/SelectionMarquee';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { Icons } from '../constants';

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

  // Essential store state - split for granular re-renders
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor) || '#ffffff';
  const canvasFilters = useStore((state) => state.canvasFilters) || {};
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const showGrid = useStore((state) => state.showGrid) || false;
  const showRulers = useStore((state) => state.showRulers) || false;
  const isDrawing = useStore((state) => state.isPenMode) || false;

  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const layers = useMemo(() => activeArtboard?.layers || [], [activeArtboard]);
  const allLayers = useMemo(() => artboards.flatMap((a) => a.layers), [artboards]);

  const onUpdateLayers = useStore((state) => state.updateLayers);
  const onToggleGrid = useStore((state) => state.setShowGrid);
  const onToggleRulers = useStore((state) => state.setShowRulers);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (viewportRef.current) {
        setViewportSize({
          width: viewportRef.current.clientWidth || 0,
          height: viewportRef.current.clientHeight || 0,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Interaction Hook
  const {
    panOffset,
    isPanning,
    isSpacePressed,
    handleMouseDownContainer,
    handleMouseDownLayer,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    layerRefs,
    snapLines,
    selectionBox
  } = useCanvasInteractions({
      zoom: zoom || 1,
      onZoomChangeValue: onZoomChange || (() => {}),
      activeArtboard,
      layers,
      selectedLayerIds,
      onUpdateLayers: (updates) => useStore.getState().updateLayers(updates),
      onSelectLayer: (id) => useStore.getState().selectLayer(id),
      onMultiSelectLayer: (id, shift) => useStore.getState().multiSelectLayer(id, shift),
      onInteractionStart,
      onContextMenu: (pos, id) => setContextMenu({ x: pos.clientX, y: pos.clientY, layerId: id }),
      isDrawing,
      viewportRef,
    });

  // Mobile Touch Gestures Integration
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const initialZoom = useRef(zoom);

  const handlePinchZoom = useCallback((scale: number) => {
    const newZoom = initialZoom.current * scale;
    const clampedZoom = Math.max(0.1, Math.min(10, newZoom));
    onZoomChange(clampedZoom);
  }, [onZoomChange]);

  const handleRotate = useCallback((angle: number) => {
    if (selectedLayerIds.length === 1) {
      const selectedLayer = layers.find(l => l.id === selectedLayerIds[0]);
      if (selectedLayer && selectedLayer.type !== 'text') {
        onUpdateLayers({ [selectedLayer.id]: { rotation: angle % 360 } });
      }
    }
  }, [selectedLayerIds, layers, onUpdateLayers]);

  useTouchGestures(viewportRef, {
    enabled: isMobile,
    onPinchZoom: handlePinchZoom,
    onRotate: handleRotate,
    minZoom: 0.1,
    maxZoom: 10,
  });

  const selectedLayers = useMemo(() =>
    allLayers.filter(l => selectedLayerIds.includes(l.id)),
    [allLayers, selectedLayerIds]
  );

  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

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

  const finishEditingText = useCallback(() => {
    if (editingTextId && textEditRef.current) {
      const newText = textEditRef.current.innerText || textEditRef.current.textContent || '';
      const currentLayer = allLayers.find((l: Layer) => l.id === editingTextId);
      if (currentLayer && currentLayer.type === 'text' && currentLayer.text !== newText) {
        useStore.getState().saveToHistory();
        const updates: Partial<TextLayer> = {
          text: newText,
          name: newText.length > 20 ? newText.slice(0, 20) + '…' : newText,
        };
        onUpdateLayers?.({ [editingTextId]: updates });
      }
    }
    setEditingTextId(null);
  }, [editingTextId, allLayers, onUpdateLayers]);

  // Listen for rotation resets
  useEffect(() => {
    const handleReset = (e: any) => {
      const { id } = e.detail;
      onUpdateLayers?.({ [id]: { rotation: 0 } });
    };
    window.addEventListener('canvas-reset-rotation', handleReset);
    return () => window.removeEventListener('canvas-reset-rotation', handleReset);
  }, [onUpdateLayers]);

  const viewportBounds = useMemo(() => ({
    x: -panOffset.x / zoom,
    y: -panOffset.y / zoom,
    width: (viewportRef.current?.clientWidth || 0) / zoom,
    height: (viewportRef.current?.clientHeight || 0) / zoom,
  }), [panOffset, zoom]);

  const textEditRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const refineCanvasRef = useRef<HTMLCanvasElement>(null);

  const setActiveArtboardId = useCallback((id: string) => useStore.getState().setActiveArtboardId(id), []);
  const onAddArtboard = useCallback(() => useStore.getState().addArtboard(), []);
  const onDeleteArtboard = useCallback((id: string) => useStore.getState().deleteArtboard(id), []);

  return (
    <ErrorBoundary componentName="Canvas" variant="widget">
      <div className="flex-1 relative bg-[#13161a] overflow-hidden flex flex-col">
        <style>{ANIMATION_STYLES}</style>
        <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors"
              title="Zoom Out"
            >
              <Icons.ZoomOut className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 min-w-[60px] justify-center px-2 py-1 bg-white/5 rounded border border-white/10 text-[11px] font-mono text-gray-400">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors"
              title="Zoom In"
            >
              <Icons.ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (activeArtboard) {
                  const minZoomX = viewportSize.width / activeArtboard.width;
                  const minZoomY = viewportSize.height / activeArtboard.height;
                  const fitZoom = Math.min(minZoomX, minZoomY, 1);
                  onZoomChange(Math.max(0.1, fitZoom));
                }
              }}
              className="ml-2 px-2 py-1 text-xs bg-[#7d2ae8]/20 text-[#7d2ae8] rounded hover:bg-[#7d2ae8]/30 transition-colors"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleGrid(!showGrid)}
              className={`p-2 rounded ${showGrid ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-400'}`}
            >
              <Icons.Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => onToggleRulers(!showRulers)}
              className={`p-2 rounded ${showRulers ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-400'}`}
            >
              <Icons.Layout className="w-5 h-5" />
            </button>
          </div>
        </div>

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
              getEffectiveLayer={(l) => l}
              onLayerRef={useCallback((id: string, el: HTMLDivElement | null) => {
                layerRefs.current[id] = el;
              }, [layerRefs])}
              handleMouseDownLayer={handleMouseDownLayer}
              handleResizeStart={() => {}}
              handleRotateStart={() => {}}
              handleContextMenu={handleContextMenu}
              handleTextDoubleClick={handleTextDoubleClick}
              handleDropShape={() => {}}
              onDoubleClickLayer={onDoubleClickLayer}
              editingTextId={editingTextId}
              textEditRef={textEditRef}
              finishEditingText={finishEditingText}
              editingPathId={null}
              previewAnimation={props.previewAnimation}
              isInteracting={false}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              hoveredLayerId={hoveredLayerId}
              setHoveredLayerId={setHoveredLayerId}
              setActiveArtboardId={setActiveArtboardId}
              onAddArtboard={onAddArtboard}
              onDeleteArtboard={onDeleteArtboard}
              showGrid={showGrid}
              isDrawing={isDrawing}
              isRefining={false}
              drawingCanvasRef={drawingCanvasRef}
              refineCanvasRef={refineCanvasRef}
              handleDrawingMouseDown={handleDrawingMouseDown}
              handleDrawingMouseMove={handleDrawingMouseMove}
              handleDrawingMouseUp={() => (handleDrawingMouseUp as any)()}
              isLassoMode={false}
              localLassoPoints={[]}
              booleanPreview={booleanPreview}
              viewportBounds={viewportBounds}
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

            {selectionBox && <SelectionMarquee box={selectionBox} />}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const Canvas = React.memo(CanvasComponent);
