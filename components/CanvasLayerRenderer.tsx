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

const isLayerVisible = (layer: Layer, viewport: { x: number; y: number; width: number; height: number } | null, zoom: number, selectedLayerIds: string[] = []) => {
  if (!viewport || viewport.width === 0 || viewport.height === 0) {return true;}
  
  // Selected layers or adjustment layers should always be active
  if (selectedLayerIds.includes(layer.id) || layer.type === 'adjustment') {return true;}

  const buffer = Math.min(1000, 200 / Math.max(0.1, zoom)); // Clamp buffer
  const lw = (layer as any).width || 0;
  const lh = (layer as any).height || 0;
  
  // For groups, we should be more lenient with culling as they might have large children
  const isGroup = (layer as any).isGroup;
  const checkBuffer = isGroup ? buffer * 5 : buffer;

  return (
    layer.x + lw > viewport.x - checkBuffer &&
    layer.x < viewport.x + viewport.width + checkBuffer &&
    layer.y + lh > viewport.y - checkBuffer &&
    layer.y < viewport.y + viewport.height + checkBuffer
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
    // Pre-calculate mask associations in a single pass to avoid O(N^2) lookups
    // CRITICAL: Must use the full layers list to maintain correct masking indices
    const layerMasks = React.useMemo(() => {
      const masks = new Map<string, Layer>();
      if (!layers) {return masks;}
      for (let i = 1; i < layers.length; i++) {
        const potentialMask = layers[i - 1];
        if (potentialMask && potentialMask.isMasking) {
          masks.set(layers[i].id, potentialMask);
        }
      }
      return masks;
    }, [layers]);

    return (
      <>
        {effectiveLayers
          .filter((l) => {
            // 1. Must be a top-level layer (or the group marker itself)
            if (l.groupId) {return false;}
            
            // 2. Must be visible
            if (l.visible === false) {return false;}

            // 3. Size-based and viewport-based culling
            if (!isLayerVisible(l, viewportBounds, zoom, selectedLayerIds)) {return false;}

            return true;
          })
          .map((l) => {
            if (l.isMasking) {return null;}
            const maskLayer = layerMasks.get(l.id);

            // If it's a group, we need to render its children too
            // Note: In this architecture, children are filtered out of the top-level list
            // but the Group Marker renders them as its own "content" or just alongside.
            const children = l.isGroup 
              ? layers.filter(child => child.groupId === l.id && child.visible !== false)
              : [];

            return (
              <React.Fragment key={l.id}>
                <CanvasLayerItemWrapper
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
                {children.map(child => (
                  <CanvasLayerItemWrapper
                    key={child.id}
                    layer={child}
                    allLayers={layers}
                    maskLayerOverride={layerMasks.get(child.id)}
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
                ))}
              </React.Fragment>
            );
          })}
      </>
    );
  }
);
CanvasLayerRenderer.displayName = 'CanvasLayerRenderer';
