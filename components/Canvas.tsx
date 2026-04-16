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
import { ContextualToolbar } from './canvas/ContextualToolbar';
import { SelectionMarquee } from './canvas/SelectionMarquee';
import { useTouchGestures } from '../hooks/useTouchGestures';

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
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor) || '#ffffff';
  const canvasFilters = useStore((state) => state.canvasFilters) || {};
  const layers = useMemo(() => activeArtboard?.layers || [], [activeArtboard]);
  const allLayers = useMemo(() => artboards.flatMap((a) => a.layers), [artboards]);

  const onUpdateLayers = useStore((state) => state.updateLayers);
  const onSelectLayer = useStore((state) => state.selectLayer);
  const onMultiSelectLayer = useStore((state) => state.multiSelectLayer);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const showGrid = useStore((state) => state.showGrid) || false;
  const isDrawing = useStore((state) => state.isPenMode) || false;

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
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    handleResizeStart,
    handleRotateStart,
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

  // Mobile Touch Gestures
  useTouchGestures(viewportRef, {
    onPinch: (scale) => onZoomChange?.(Math.max(0.05, Math.min(10, zoom * scale))),
    onRotate: (delta) => {
      if (selectedLayerIds.length === 1) {
        const id = selectedLayerIds[0];
        const l = allLayers.find(ly => ly.id === id);
        if (l) onUpdateLayers?.({ [id]: { rotation: (l.rotation + delta) % 360 } });
      }
    }
  });

  const selectedLayers = useMemo(() =>
    allLayers.filter(l => selectedLayerIds.includes(l.id)),
    [allLayers, selectedLayerIds]
  );

  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

  const handleDrawingMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingState.isDrawingPath || !drawingCanvasRef.current) {
      return;
    }
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left);
    let y = (e.clientY - rect.top);

    // Apply Smoothing/Stabilization (Lerp between last and current)
    const smoothFactor = 1 - (brushSmoothing / 100) * 0.9; // 1.0 (none) to 0.1 (high)
    x = drawingLastPos.current.x + (x - drawingLastPos.current.x) * smoothFactor;
    y = drawingLastPos.current.y + (y - drawingLastPos.current.y) * smoothFactor;

    // Apply Jitter
    if (brushJitter > 0) {
      const jitterAmount = (brushJitter / 100) * brushSize * zoom;
      x += (Math.random() - 0.5) * jitterAmount;
      y += (Math.random() - 0.5) * jitterAmount;
    }

    const ctx = drawingCanvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    if (brushType === BrushType.VECTOR_PENCIL) {
      setVectorPoints((prev) => [...prev, { x, y }]);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Add randomness for certain brushes
      if ([BrushType.SPLATTER, BrushType.CRAYON, BrushType.TEXTURE].includes(brushType)) {
        const randomOffset = (Math.random() - 0.5) * brushSize * zoom * 0.5;
        ctx.lineTo(x + randomOffset, y + randomOffset);
      } else {
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reset line dash for next stroke
      if ([BrushType.CRAYON, BrushType.TEXTURE].includes(brushType)) {
        ctx.setLineDash([]);
      }
    }
    drawingLastPos.current = { x, y };
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawing) {
      return;
    }
    setDrawingState({ ...drawingState, isDrawingPath: false });
    if (brushType === BrushType.VECTOR_PENCIL && vectorPoints.length > 2) {
      let d = `M ${vectorPoints[0]!.x} ${vectorPoints[0]!.y}`;
      for (let i = 1; i < vectorPoints.length - 1; i++) {
        const p1 = vectorPoints[i]!,
          p2 = vectorPoints[i + 1]!;
        d += ` Q ${p1.x} ${p1.y} ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2}`;
      }
      d += ` L ${vectorPoints[vectorPoints.length - 1]!.x} ${vectorPoints[vectorPoints.length - 1]!.y}`;
      onVectorDrawingComplete?.(d, { color: brushColor, width: brushSize, opacity: brushOpacity });
      drawingCanvasRef.current
        ?.getContext('2d')
        ?.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      setVectorPoints([]);
    } else {
      onDrawingComplete?.(drawingCanvasRef.current?.toDataURL('image/png') || '');
      drawingCanvasRef.current
        ?.getContext('2d')
        ?.clearRect(0, 0, drawingCanvasRef.current!.width, drawingCanvasRef.current!.height);
    }
  };
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
            {/* Editable Zoom Input for #4 */}
            <EditableZoom zoom={zoom} onZoomChange={onZoomChange} />
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
                  // Auto-fit zoom
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
              onLayerRef={(id, el) => {
                layerRefs.current[id] = el;
              }}
              handleMouseDownLayer={handleMouseDownLayer}
              handleResizeStart={handleResizeStart}
              handleRotateStart={handleRotateStart}
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
              handleResizeStart={handleResizeStart}
              handleRotateStart={handleRotateStart}
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
