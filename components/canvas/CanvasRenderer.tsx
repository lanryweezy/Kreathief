import React from 'react';
import { Artboard, Layer, AnimationSettings } from '../../types';
import { CanvasLayerRenderer } from '../CanvasLayerRenderer';

interface CanvasRendererProps {
  artboards: Artboard[];
  activeArtboardId: string;
  canvasBackgroundColor: string;
  canvasFilters: any;
  zoom: number;
  getEffectiveLayer: (layer: Layer) => Layer;
  onLayerRef: (id: string, el: HTMLDivElement | null) => void;
  handleMouseDownLayer: (e: React.MouseEvent, layer: Layer) => void;
  handleResizeStart: (e: React.MouseEvent, layer: Layer, handle: any) => void;
  handleRotateStart: (e: React.MouseEvent, layer: Layer) => void;
  handleContextMenu: (e: React.MouseEvent, layerId: string) => void;
  handleTextDoubleClick: (e: React.MouseEvent, layer: any) => void;
  handleDropShape: (e: React.DragEvent, layerId: string) => void;
  onDoubleClickLayer?: (layer: Layer) => void;
  editingTextId: string | null;
  textEditRef: React.RefObject<HTMLDivElement>;
  finishEditingText: () => void;
  editingPathId: string | null;
  onUpdatePath?: (id: string, updates: any) => void;
  previewAnimation?: AnimationSettings;
  isInteracting: boolean;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  hoveredLayerId: string | null;
  setHoveredLayerId: (id: string | null) => void;
  setActiveArtboardId: (id: string) => void;
  onAddArtboard: () => void;
  onDeleteArtboard: (id: string) => void;
  showGrid: boolean;
  isDrawing: boolean;
  isRefining: boolean;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
  refineCanvasRef: React.RefObject<HTMLCanvasElement>;
  handleDrawingMouseDown: (e: React.MouseEvent) => void;
  handleDrawingMouseMove: (e: React.MouseEvent) => void;
  handleDrawingMouseUp: () => void;
  isLassoMode: boolean;
  localLassoPoints: { x: number; y: number }[];
  booleanPreview: { path: string; operation: string } | null;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
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
  isInteracting,
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
}) => {
  return (
    <>
      {artboards.map((artboard) => (
        <div
          key={artboard.id}
          className="absolute pointer-events-auto"
          style={{
            left: artboard.x,
            top: artboard.y,
            width: artboard.width,
            height: artboard.height,
          }}
          onClick={() => setActiveArtboardId(artboard.id)}
        >
          {/* Artboard Header */}
          <div className="absolute -top-10 left-0 flex items-center gap-3 pointer-events-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap bg-[#1e1e1e] px-2 py-1 rounded-t-lg border-x border-t border-white/10">
                {artboard.name}
              </span>
              <span className="text-[9px] font-bold text-gray-500 bg-black/40 px-2 py-0.5 rounded-b-lg border-x border-b border-white/5">
                {artboard.width} × {artboard.height}
              </span>
            </div>
          </div>

          <div
            className={`relative shadow-2xl bg-white overflow-hidden ${
              activeArtboardId === artboard.id ? 'ring-2 ring-[#7d2ae8]/50' : 'ring-1 ring-white/10'
            }`}
            style={{
              width: artboard.width,
              height: artboard.height,
              backgroundColor: artboard.backgroundColor || canvasBackgroundColor,
              filter:
                activeArtboardId === artboard.id
                  ? `brightness(${canvasFilters.brightness}%) contrast(${canvasFilters.contrast}%) saturate(${canvasFilters.saturation}%) sepia(${canvasFilters.sepia}%) grayscale(${canvasFilters.grayscale}%) blur(${canvasFilters.blur}px)`
                  : 'none',
              opacity: activeArtboardId === artboard.id ? canvasFilters.opacity : 1,
            }}
          >
            <CanvasLayerRenderer
              layers={artboard.layers}
              effectiveLayers={artboard.layers.map((l) => getEffectiveLayer(l))}
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
              onUpdatePath={onUpdatePath || (() => {})}
              zoom={zoom}
              previewAnimation={previewAnimation}
              isInteracting={isInteracting}
            />

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

                {(isDrawing || isRefining) && (
                  <canvas
                    ref={isRefining ? refineCanvasRef : drawingCanvasRef}
                    className="absolute inset-0 z-[70] cursor-crosshair touch-none"
                    width={artboard.width}
                    height={artboard.height}
                    onMouseDown={isRefining ? undefined : handleDrawingMouseDown}
                    onMouseMove={isRefining ? handleDrawingMouseMove : handleDrawingMouseMove}
                    onMouseUp={isRefining ? handleDrawingMouseUp : handleDrawingMouseUp}
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
      ))}
    </>
  );
};
