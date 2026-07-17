import React from 'react';
import { useStore } from '../../store/useStore';
import { Artboard, Layer, AnimationSettings, CanvasFilters, ResizeHandle } from '../../types';
import { CanvasLayerRenderer } from '../CanvasLayerRenderer';
import { ArtisticFilters } from '../ArtisticFilters';
import { buildFilterString } from '../../utils/layers';
import { SmartSuggestions } from './SmartSuggestions';
import { SmartSnap } from './SmartSnap';
import { SmartSuggestion } from '../../hooks/useSmartInteraction';
import { bitmapCache } from '../../utils/bitmapCache';
import { ErrorBoundary } from '../ErrorBoundary';

const noop = () => {};

interface CanvasRendererProps {
  artboards: Artboard[];
  activeArtboardId: string | null;
  canvasBackgroundColor: string;
  canvasFilters: CanvasFilters;
  zoom: number;
  getEffectiveLayer: (layer: Layer) => Layer;
  onLayerRef: (id: string, el: HTMLDivElement | null) => void;
  handleMouseDownLayer: (e: React.MouseEvent, layer: Layer) => void;
  handleResizeStart: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
  handleRotateStart: (e: React.MouseEvent, layer: Layer) => void;
  handleContextMenu: (e: React.MouseEvent, layerId: string) => void;
  handleTextDoubleClick: (e: React.MouseEvent, layer: Layer) => void;
  handleDropShape: (e: React.DragEvent, layerId: string) => void;
  onDoubleClickLayer?: (layer: Layer) => void;
  editingTextId: string | null;
  textEditRef: React.RefObject<HTMLDivElement>;
  finishEditingText: () => void;
  editingPathId: string | null;
  onUpdatePath?: (id: string, updates: any) => void;
  previewAnimation?: AnimationSettings;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  hoveredLayerId: string | null;
  setHoveredLayerId: (id: string | null) => void;
  setActiveArtboardId: (id: string) => void;
  showGrid: boolean;
  isDrawing: boolean;
  isRefining: boolean;
  isVectorPenMode?: boolean;
  isInteracting?: boolean;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
  refineCanvasRef: React.RefObject<HTMLCanvasElement>;
  handleDrawingMouseDown: (e: React.PointerEvent | React.MouseEvent) => void;
  handleDrawingMouseMove: (e: React.PointerEvent | React.MouseEvent) => void;
  handleDrawingMouseUp: (e?: React.PointerEvent | React.MouseEvent) => void;
  isLassoMode: boolean;
  localLassoPoints: { x: number; y: number }[];
  booleanPreview: { path: string; operation: string } | null;
  viewportBounds: { x: number; y: number; width: number; height: number } | null;
  suggestions?: SmartSuggestion[];
  onDismissSuggestion?: (id: string) => void;
  onApplySuggestion?: (suggestion: SmartSuggestion) => void;
  allLayers?: Layer[];
}

interface ArtboardItemProps {
  artboard: Artboard;
  activeArtboardId: string | null;
  canvasBackgroundColor: string;
  canvasFilters: CanvasFilters;
  zoom: number;
  getEffectiveLayer: (layer: Layer) => Layer;
  onLayerRef: (id: string, el: HTMLDivElement | null) => void;
  handleMouseDownLayer: (e: React.MouseEvent, layer: Layer) => void;
  handleResizeStart: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
  handleRotateStart: (e: React.MouseEvent, layer: Layer) => void;
  handleContextMenu: (e: React.MouseEvent, layerId: string) => void;
  handleTextDoubleClick: (e: React.MouseEvent, layer: Layer) => void;
  handleDropShape: (e: React.DragEvent, layerId: string) => void;
  onDoubleClickLayer?: (layer: Layer) => void;
  editingTextId: string | null;
  textEditRef: React.RefObject<HTMLDivElement>;
  finishEditingText: () => void;
  editingPathId: string | null;
  onUpdatePath?: (id: string, updates: any) => void;
  previewAnimation?: AnimationSettings;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  hoveredLayerId: string | null;
  setHoveredLayerId: (id: string | null) => void;
  setActiveArtboardId: (id: string) => void;
  showGrid: boolean;
  isDrawing: boolean;
  isRefining: boolean;
  isInteracting?: boolean;
  isVectorPenMode?: boolean;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
  refineCanvasRef: React.RefObject<HTMLCanvasElement>;
  handleDrawingMouseDown: (e: React.PointerEvent | React.MouseEvent) => void;
  handleDrawingMouseMove: (e: React.PointerEvent | React.MouseEvent) => void;
  handleDrawingMouseUp: (e?: React.PointerEvent | React.MouseEvent) => void;
  isLassoMode: boolean;
  localLassoPoints: { x: number; y: number }[];
  booleanPreview: { path: string; operation: string } | null;
  viewportBounds: { x: number; y: number; width: number; height: number } | null;
}

const ArtboardItem = React.memo(
  ({
    artboard,
    activeArtboardId,
    canvasBackgroundColor,
    canvasFilters,
    zoom,
    getEffectiveLayer,
    onLayerRef,
    handleMouseDownLayer,
    handleResizeStart,
    handleRotateStart,
    handleContextMenu,
    handleTextDoubleClick,
    handleDropShape,
    onDoubleClickLayer,
    editingTextId,
    textEditRef,
    finishEditingText,
    editingPathId,
    onUpdatePath,
    previewAnimation,
    selectedLayerId,
    selectedLayerIds,
    hoveredLayerId,
    setHoveredLayerId,
    setActiveArtboardId,
    showGrid,
    isDrawing,
    isRefining,
    isVectorPenMode = false,
    drawingCanvasRef,
    refineCanvasRef,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isLassoMode,
    localLassoPoints,
    booleanPreview,
    viewportBounds,
    isInteracting,
  }: ArtboardItemProps) => {
    const effectiveLayers = React.useMemo(() => {
      const layers = artboard.layers || [];
      // Skip map if getEffectiveLayer is basically an identity function
      const isIdentity = !getEffectiveLayer || (layers.length > 0 && getEffectiveLayer(layers[0]) === layers[0]);
      if (isIdentity) {
        return layers;
      }
      // Map to effective layers (e.g. groups) and remove duplicates and nulls
      const mapped = layers.map((l) => getEffectiveLayer(l)).filter(Boolean) as Layer[];
      const unique = Array.from(new Map(mapped.map((l) => [l.id, l])).values());
      return unique;
    }, [artboard.layers, getEffectiveLayer]);

    const handleArtboardClick = React.useCallback(() => {
      setActiveArtboardId(artboard.id);
    }, [setActiveArtboardId, artboard.id]);

    const handleAddArtboardClick = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      useStore.getState().addArtboard();
    }, []);

    const cachedFilterString = React.useMemo(() => buildFilterString(canvasFilters), [canvasFilters]);

    return (
      <div
        key={artboard.id}
        data-artboard-id={artboard.id}
        className="absolute pointer-events-auto design-artboard"
        style={{
          left: artboard.x,
          top: artboard.y,
          width: artboard.width,
          height: artboard.height,
        }}
        onClick={handleArtboardClick}
      >
        {/* Artboard Header */}
        <div className="absolute -top-10 left-0 flex items-center gap-3 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap bg-surface-dark-3 px-2 py-1 rounded-t-lg border-x border-t border-white/10 flex items-center gap-2">
              {artboard.name}
              <button
                onClick={handleAddArtboardClick}
                className="w-3.5 h-3.5 flex items-center justify-center bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500 hover:text-white transition-all cursor-pointer"
                title="Add Canvas"
                type="button"
              >
                +
              </button>
            </span>
            <span className="text-[9px] font-bold text-gray-500 bg-black/40 px-2 py-0.5 rounded-b-lg border-x border-b border-white/5">
              {artboard.width} × {artboard.height}
            </span>
          </div>
        </div>

        <div
          className={`relative shadow-2xl bg-white overflow-hidden ${
            activeArtboardId === artboard.id ? 'ring-2 ring-brand-600/50' : 'ring-1 ring-white/10'
          }`}
          style={{
            width: artboard.width,
            height: artboard.height,
            backgroundColor: artboard.backgroundColor || canvasBackgroundColor,
            filter: activeArtboardId === artboard.id ? cachedFilterString : 'none',
            opacity: activeArtboardId === artboard.id ? canvasFilters.opacity : 1,
          }}
        >
          <CanvasLayerRenderer
            layers={artboard.layers}
            effectiveLayers={effectiveLayers}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            hoveredLayerId={hoveredLayerId}
            setHoveredLayerId={setHoveredLayerId}
            setLayerRef={onLayerRef}
            handleMouseDownLayer={handleMouseDownLayer}
            handleResizeStart={handleResizeStart}
            handleRotateStart={handleRotateStart}
            handleContextMenu={handleContextMenu}
            handleTextDoubleClick={handleTextDoubleClick}
            handleDropShape={handleDropShape}
            onDoubleClickLayer={onDoubleClickLayer}
            editingTextId={editingTextId}
            textEditRef={textEditRef}
            finishEditingText={finishEditingText}
            editingPathId={editingPathId}
            onUpdatePath={onUpdatePath || noop}
            zoom={zoom}
            previewAnimation={previewAnimation}
            viewportBounds={
              viewportBounds
                ? {
                    ...viewportBounds,
                    x: viewportBounds.x - artboard.x,
                    y: viewportBounds.y - artboard.y,
                  }
                : null
            }
          />

          {/* Global Texture/Grain Overlay */}
          {(canvasFilters.overlayTexture || (canvasFilters as any).overlayTexture) && (
            <div
              className="absolute inset-0 pointer-events-none z-[100]"
              style={{
                backgroundImage: `url(${canvasFilters.overlayTexture || (canvasFilters as any).overlayTexture})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                mixBlendMode: (canvasFilters.textureBlendMode || 'overlay') as any,
                opacity: canvasFilters.opacity,
              }}
            />
          )}

          {activeArtboardId === artboard.id && (
            <>
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none z-[60] opacity-10"
                  style={{
                    backgroundImage:
                      'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                    backgroundSize: '100px 100px',
                  }}
                />
              )}

              {(isDrawing || isRefining) && !isVectorPenMode && (
                <canvas
                  ref={isRefining ? refineCanvasRef : drawingCanvasRef}
                  className="absolute inset-0 z-[70] cursor-crosshair touch-none"
                  width={artboard.width}
                  height={artboard.height}
                  onPointerDown={isRefining ? undefined : handleDrawingMouseDown}
                  onPointerMove={isRefining ? handleDrawingMouseMove : handleDrawingMouseMove}
                  onPointerUp={handleDrawingMouseUp}
                />
              )}

              {isLassoMode && (
                <svg className="absolute inset-0 z-[70] pointer-events-none w-full h-full">
                  {localLassoPoints.length > 1 && (
                    <polyline
                      points={localLassoPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="rgba(125, 42, 232, 0.2)"
                      stroke="#7d2ae8"
                      strokeWidth={2 / zoom}
                      strokeDasharray="5,5"
                    />
                  )}
                </svg>
              )}

              {booleanPreview && (
                <svg className="absolute inset-0 z-[75] pointer-events-none w-full h-full">
                  <path
                    d={booleanPreview.path}
                    fill="rgba(168, 85, 247, 0.15)"
                    stroke="#a855f7"
                    strokeWidth={3 / zoom}
                    strokeDasharray={`${6 / zoom},${4 / zoom}`}
                    className="animate-pulse"
                  />
                </svg>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);
ArtboardItem.displayName = 'ArtboardItem';

export const CanvasRenderer: React.FC<CanvasRendererProps> = React.memo(
  ({
    artboards,
    activeArtboardId,
    canvasBackgroundColor,
    canvasFilters,
    zoom,
    getEffectiveLayer,
    onLayerRef,
    handleMouseDownLayer,
    handleResizeStart,
    handleRotateStart,
    handleContextMenu,
    handleTextDoubleClick,
    handleDropShape,
    onDoubleClickLayer,
    editingTextId,
    textEditRef,
    finishEditingText,
    editingPathId,
    onUpdatePath,
    previewAnimation,
    selectedLayerId,
    selectedLayerIds,
    hoveredLayerId,
    setHoveredLayerId,
    setActiveArtboardId,
    showGrid,
    isDrawing,
    isRefining,
    drawingCanvasRef,
    refineCanvasRef,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isLassoMode,
    localLassoPoints,
    booleanPreview,
    viewportBounds,
    isInteracting,
    suggestions = [],
    onDismissSuggestion = () => {},
    onApplySuggestion = () => {},
    allLayers = [],
  }) => {
    // Memo check for bitmapCache before rendering image layers
    const imageLayerBitmaps = React.useMemo(() => {
      const bitmaps = new Map<string, ImageBitmap | null>();
      for (const artboard of artboards) {
        for (const layer of artboard.layers || []) {
          if (layer.type === 'image') {
            // Populate bitmap cache map for downstream rendering
            bitmaps.set(layer.id, null);
          }
        }
      }
      // Log cache stats for debugging
      void bitmapCache.stats();
      return bitmaps;
    }, [artboards]);

    return (
      <>
        <ArtisticFilters />
        {artboards.map((artboard) => (
          <ArtboardItem
            key={artboard.id}
            artboard={artboard}
            activeArtboardId={activeArtboardId}
            canvasBackgroundColor={canvasBackgroundColor}
            canvasFilters={canvasFilters}
            zoom={zoom}
            getEffectiveLayer={getEffectiveLayer}
            onLayerRef={onLayerRef}
            handleMouseDownLayer={handleMouseDownLayer}
            handleResizeStart={handleResizeStart}
            handleRotateStart={handleRotateStart}
            handleContextMenu={handleContextMenu}
            handleTextDoubleClick={handleTextDoubleClick}
            handleDropShape={handleDropShape}
            onDoubleClickLayer={onDoubleClickLayer}
            editingTextId={editingTextId}
            textEditRef={textEditRef}
            finishEditingText={finishEditingText}
            editingPathId={editingPathId}
            onUpdatePath={onUpdatePath}
            previewAnimation={previewAnimation}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            hoveredLayerId={hoveredLayerId}
            setHoveredLayerId={setHoveredLayerId}
            setActiveArtboardId={setActiveArtboardId}
            showGrid={showGrid}
            isDrawing={isDrawing}
            isRefining={isRefining}
            drawingCanvasRef={drawingCanvasRef}
            refineCanvasRef={refineCanvasRef}
            handleDrawingMouseDown={handleDrawingMouseDown}
            handleDrawingMouseMove={handleDrawingMouseMove}
            handleDrawingMouseUp={handleDrawingMouseUp}
            isLassoMode={isLassoMode}
            localLassoPoints={localLassoPoints}
            booleanPreview={booleanPreview}
            viewportBounds={viewportBounds}
          />
        ))}

        <ErrorBoundary componentName="SmartSuggestions" variant="widget">
          <SmartSuggestions
            suggestions={suggestions}
            onDismiss={onDismissSuggestion}
            onApply={onApplySuggestion}
            selectedIds={selectedLayerIds}
            layers={allLayers}
            zoom={zoom}
          />
        </ErrorBoundary>

        <ErrorBoundary componentName="SmartSnap" variant="widget">
          <SmartSnap layers={allLayers} selectedIds={selectedLayerIds} zoom={zoom} />
        </ErrorBoundary>
      </>
    );
  }
);

CanvasRenderer.displayName = 'CanvasRenderer';
