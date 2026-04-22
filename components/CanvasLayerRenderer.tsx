import React from 'react';
import { TextLayer, Layer, AnimationSettings } from '../types';
import { CanvasLayerItemWrapper } from './CanvasLayerItemWrapper';

interface CanvasLayerRendererProps {
  layers: Layer[];
  effectiveLayers: Layer[];
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  hoveredLayerId: string | null;
  setHoveredLayerId: (id: string | null) => void;
  setLayerRef: (id: string, el: HTMLDivElement | null) => void;
  handleMouseDownLayer: (e: React.MouseEvent, layer: Layer) => void;
  handleResizeStart: (e: React.MouseEvent, layer: Layer, handle: any) => void;
  handleRotateStart: (e: React.MouseEvent, layer: Layer) => void;
  handleContextMenu: (e: React.MouseEvent, layerId: string) => void;
  handleTextDoubleClick: (e: React.MouseEvent, layer: TextLayer) => void;
  handleDropShape: (e: React.DragEvent, layerId: string) => void;
  onDoubleClickLayer?: (layer: Layer) => void;
  editingTextId: string | null;
  textEditRef: React.RefObject<HTMLDivElement>;
  finishEditingText: () => void;
  editingPathId: string | null;
  onUpdatePath: (id: string, changes: Partial<Layer>) => void;
  zoom: number;
  previewAnimation?: AnimationSettings;
  viewportBounds: { x: number; y: number; width: number; height: number } | null;
}

const isLayerVisible = (layer: Layer, viewport: { x: number; y: number; width: number; height: number } | null, zoom: number) => {
  if (!viewport) return false;
  
  const buffer = 50 / zoom; // Adjust buffer based on zoom
  const lw = (layer as any).width || 0;
  const lh = (layer as any).height || 0;
  
  // Size-based culling: skip layers that are too small to see at current zoom
  const screenWidth = lw * zoom;
  const screenHeight = lh * zoom;
  if (screenWidth < 0.5 && screenHeight < 0.5) return false;

  return (
    layer.x + lw > viewport.x - buffer &&
    layer.x < viewport.x + viewport.width + buffer &&
    layer.y + lh > viewport.y - buffer &&
    layer.y < viewport.y + viewport.height + buffer
  );
};

export const CanvasLayerRenderer: React.FC<CanvasLayerRendererProps> = React.memo(
  ({
    layers,
    effectiveLayers,
    selectedLayerId,
    selectedLayerIds,
    hoveredLayerId,
    setHoveredLayerId,
    setLayerRef,
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
    zoom,
    previewAnimation,
    viewportBounds,
  }) => {
    return (
      <>
        {effectiveLayers
          .filter((l) => !l.groupId && isLayerVisible(l, viewportBounds, zoom))
          .map((l) => {
            // Masking Logic: A layer with isMasking=true masks the first visible layer ABOVE it (higher index)
            if (l.isMasking) return null;

            // Find if there's a mask layer below this one
            // We use effectiveLayers for index lookup since it's the ordered render list
            let maskLayer: Layer | undefined;
            const actualIdx = effectiveLayers.findIndex(el => el.id === l.id);
            if (actualIdx > 0) {
              const potentialMask = effectiveLayers[actualIdx - 1];
              if (potentialMask && potentialMask.isMasking) {
                maskLayer = potentialMask;
              }
            }

            return (
              <CanvasLayerItemWrapper
                key={l.id}
                layer={l}
                allLayers={layers}
                maskLayerOverride={maskLayer}
                selectedLayerId={selectedLayerId}
                selectedLayerIds={selectedLayerIds}
                hoveredLayerId={hoveredLayerId}
                setHoveredLayerId={setHoveredLayerId}
                setLayerRef={setLayerRef}
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
                zoom={zoom}
                previewAnimation={previewAnimation}
              />
            );
          })}
      </>
    );
  }
);
CanvasLayerRenderer.displayName = 'CanvasLayerRenderer';
