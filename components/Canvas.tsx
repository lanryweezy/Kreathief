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
import { ContextualToolbar } from './canvas/ContextualToolbar';
import { PathEditorOverlay } from './VectorEditor/PathEditorOverlay';
import { VectorPath } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { BrushFilters } from '../services/brushEngine';

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
  const setPenMode = useStore((state) => state.setPenMode);
  const brushType = useStore((state) => state.brushType);
  const brushColor = useStore((state) => state.brushColor) || '#000000';
  const brushSize = useStore((state) => state.brushSize) || 2;
  
  const [activeVectorPath, setActiveVectorPath] = useState<VectorPath | null>(null);
  const [selectedVectorPointIndices, setSelectedVectorPointIndices] = useState<number[]>([]);

  useEffect(() => {
    if (isDrawing && brushType === ('vector_pencil' as any)) {
      if (!activeVectorPath) {
        setActiveVectorPath({
          points: [],
          isClosed: false,
        });
      }
    } else if (!isDrawing) {
      if (activeVectorPath && activeVectorPath.points.length > 1) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        activeVectorPath.points.forEach(p => {
           minX = Math.min(minX, p.x);
           minY = Math.min(minY, p.y);
           maxX = Math.max(maxX, p.x);
           maxY = Math.max(maxY, p.y);
        });
        
        if (minX !== Infinity) {
           const width = Math.max(1, maxX - minX);
           const height = Math.max(1, maxY - minY);
           const shiftedPoints = activeVectorPath.points.map(p => ({
             ...p,
             x: p.x - minX,
             y: p.y - minY,
           }));

           const newLayer: ShapeLayer = {
             id: `path_${uuidv4()}`,
             type: 'path',
             name: 'Vector Path',
             x: minX,
             y: minY,
             width,
             height,
             rotation: 0,
             opacity: 1,
             locked: false,
             visible: true,
             color: brushColor,
             cornerRadius: 0,
             viewBox: `0 0 ${width} ${height}`,
             vectorPath: { points: shiftedPoints, isClosed: activeVectorPath.isClosed },
             pathData: '',
             filters: {
               brightness: 100,
               contrast: 100,
               saturation: 100,
               grayscale: 0,
               sepia: 0,
               blur: 0,
               hueRotate: 0,
               vignette: 0,
               opacity: 1,
             },
             blendMode: 'normal',
             skewX: 0,
             skewY: 0,
             perspective: 0,
             rotateX: 0,
             rotateY: 0,
           };
           useStore.getState().addLayer(newLayer);
        }
      }
      setActiveVectorPath(null);
    }
  }, [isDrawing, brushType]);

  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const layers = useMemo(() => activeArtboard?.layers || [], [activeArtboard]);
  const allLayers = useMemo(() => artboards.flatMap((a) => a.layers || []), [artboards]);

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
    handleMouseDownCombined,
    handleMouseDownLayer,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    layerRefs,
    snapLines,
    selectionBox,
    handleResizeStart,
    handleRotateStart,
  } = useCanvasInteractions({
      zoom: zoom || 1,
      onZoomChangeValue: onZoomChange || (() => {}),
      activeArtboard,
      artboards,
      layers,
      selectedLayerIds,
      onUpdateLayers: (updates) => useStore.getState().updateLayers(updates),
      onSelectLayer: (id) => useStore.getState().selectLayer(id),
      onMultiSelectLayer: (id, shift) => useStore.getState().multiSelectLayer(id, shift),
      setSelectedLayerIds: (ids) => useStore.getState().setSelectedLayerIds(ids),
      onInteractionStart,
      onContextMenu: (pos, id) => setContextMenu({ x: pos.clientX, y: pos.clientY, layerId: id }),
      isDrawing,
      viewportRef,
    });

  // Initial Centering
  useEffect(() => {
    if (activeArtboard && viewportRef.current) {
      const v = viewportRef.current;
      const nx = v.clientWidth / 2 - (activeArtboard.x + activeArtboard.width / 2) * zoom;
      const ny = v.clientHeight / 2 - (activeArtboard.y + activeArtboard.height / 2) * zoom;
      useStore.getState().setPanOffset({ x: nx, y: ny });
    }
  }, []); // Only once on mount

  const initialZoom = useRef(zoom);
  
  // Update initialZoom when zoom changes but not currently pinching
  // (We'll assume pinching if touch count > 1)
  useEffect(() => {
    initialZoom.current = zoom;
  }, [zoom]);

  const handlePinchZoom = useCallback((scale: number, center: { x: number; y: number }) => {
    const newZoom = initialZoom.current * scale;
    const clampedZoom = Math.max(0.1, Math.min(10, newZoom));
    
    if (clampedZoom !== zoom && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const mouseX = center.x - rect.left;
      const mouseY = center.y - rect.top;

      const worldX = (mouseX - panOffset.x) / zoom;
      const worldY = (mouseY - panOffset.y) / zoom;

      const newPanX = mouseX - worldX * clampedZoom;
      const newPanY = mouseY - worldY * clampedZoom;

      onZoomChange(clampedZoom);
      useStore.getState().setPanOffset({ x: newPanX, y: newPanY });
    }
  }, [onZoomChange, zoom, panOffset]);

  const handleRotate = useCallback((angle: number) => {
    if (selectedLayerIds.length === 1) {
      const selectedLayer = layers.find(l => l.id === selectedLayerIds[0]);
      if (selectedLayer && selectedLayer.type !== 'text') {
        onUpdateLayers({ [selectedLayer.id]: { rotation: angle % 360 } });
      }
    }
  }, [selectedLayerIds, layers, onUpdateLayers]);

  useTouchGestures(viewportRef, {
    enabled: true, // Support touch on all platforms (tablets, laptops)
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

  const handleTextDoubleClick = useCallback((e: React.MouseEvent, layer: Layer) => {
    if (layer.type === 'text') {
      e.stopPropagation();
      setEditingTextId(layer.id);
      setTimeout(() => textEditRef.current?.focus(), 0);
    }
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
      <div className="flex-1 relative bg-[#000000] overflow-hidden flex flex-col">
        <style>{ANIMATION_STYLES}</style>

        
        <div
          ref={viewportRef}
          className="flex-1 overflow-hidden relative bg-[#000000] touch-none select-none canvas-container"
           style={{ cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : isDrawing ? 'crosshair' : 'default' }}
          onMouseDown={isDrawing && brushType === 'vector_pencil' ? undefined : handleMouseDownCombined}
        >
          {/* Global Workspace Grid - Responds to Zoom */}
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
                `,
                backgroundSize: `${100 * zoom}px ${100 * zoom}px`,
                backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
              }}
            />
          )}
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
              setActiveArtboardId={setActiveArtboardId}
              onAddArtboard={onAddArtboard}
              onDeleteArtboard={onDeleteArtboard}
              showGrid={showGrid}
              isDrawing={isDrawing}
              isVectorPenMode={isDrawing && brushType === 'vector_pencil'}
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

        {/* PathEditorOverlay is rendered OUTSIDE the zoom transform — coordinates are computed manually */}
        {isDrawing && brushType === 'vector_pencil' && activeVectorPath && (
          <div
            className="absolute inset-0 z-[200] pointer-events-none"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <PathEditorOverlay
              path={activeVectorPath}
              zoom={zoom}
              onUpdate={(newPath) => setActiveVectorPath(newPath as VectorPath)}
              onSelectPoint={setSelectedVectorPointIndices}
              selectedPointIndices={selectedVectorPointIndices}
              onClose={() => setPenMode(false)}
            />
          </div>
        )}
        {/* Centralized stable SVG filters */}
        <BrushFilters />
      </div>
    </ErrorBoundary>
  );
};

export const Canvas = React.memo(CanvasComponent);
