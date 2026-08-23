import React from 'react';
import { TextLayer, Layer, AnimationSettings } from '../types';
import { CanvasLayerItemWrapper } from './CanvasLayerItemWrapper';

const MAX_DOM_LAYERS = 300;

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
  isInteracting?: boolean;
  previewAnimation?: AnimationSettings;
  viewportBounds: { x: number; y: number; width: number; height: number } | null;
}

const isLayerVisible = (
  layer: Layer,
  viewport: { x: number; y: number; width: number; height: number } | null,
  zoom: number,
  selectedLayerIds: string[] = []
) => {
  if (!viewport || viewport.width === 0 || viewport.height === 0) {
    return true;
  }

  if (selectedLayerIds.includes(layer.id) || layer.type === 'adjustment') {
    return true;
  }

  const buffer = Math.min(1000, 200 / Math.max(0.1, zoom));
  const lw = (layer as any).width || 0;
  const lh = (layer as any).height || 0;

  const isGroup = (layer as any).isGroup;
  const checkBuffer = isGroup ? buffer * 5 : buffer;

  return (
    layer.x + lw > viewport.x - checkBuffer &&
    layer.x < viewport.x + viewport.width + checkBuffer &&
    layer.y + lh > viewport.y - checkBuffer &&
    layer.y < viewport.y + viewport.height + checkBuffer
  );
};

const distanceToViewportCenter = (
  layer: Layer,
  viewport: { x: number; y: number; width: number; height: number }
): number => {
  const cx = viewport.x + viewport.width / 2;
  const cy = viewport.y + viewport.height / 2;
  const lw = (layer as any).width || 0;
  const lh = (layer as any).height || 0;
  const lx = layer.x + lw / 2;
  const ly = layer.y + lh / 2;
  const dx = lx - cx;
  const dy = ly - cy;
  return dx * dx + dy * dy;
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
    isInteracting,
  }) => {
    const layerMasks = React.useMemo(() => {
      const masks = new Map<string, Layer>();
      if (!layers) {
        return masks;
      }
      for (let i = 1; i < layers.length; i++) {
        const potentialMask = layers[i - 1];
        if (potentialMask && potentialMask.isMasking) {
          masks.set(layers[i].id, potentialMask);
        }
      }
      return masks;
    }, [layers]);

    const groupChildrenMap = React.useMemo(() => {
      const map = new Map<string, Layer[]>();
      if (!layers) {
        return map;
      }
      for (const l of layers) {
        if (l.groupId && l.visible !== false) {
          const arr = map.get(l.groupId);
          if (arr) {
            arr.push(l);
          } else {
            map.set(l.groupId, [l]);
          }
        }
      }
      return map;
    }, [layers]);

    const layerMap = React.useMemo(() => {
      const map = new Map<string, Layer>();
      if (!layers) {
        return map;
      }
      for (const l of layers) {
        map.set(l.id, l);
      }
      return map;
    }, [layers]);

    const visibleLayers = React.useMemo(() => {
      const filtered = effectiveLayers.filter((l) => {
        if (l.groupId) {
          return false;
        }
        if (l.visible === false) {
          return false;
        }
        if (!isLayerVisible(l, viewportBounds, zoom, selectedLayerIds)) {
          return false;
        }
        return true;
      });

      if (filtered.length <= MAX_DOM_LAYERS) {
        return filtered;
      }

      const selectedSet = new Set(selectedLayerIds);
      if (selectedLayerId) {
        selectedSet.add(selectedLayerId);
      }

      const prioritized: Layer[] = [];
      const candidates: Layer[] = [];

      for (const l of filtered) {
        if (selectedSet.has(l.id) || l.id === hoveredLayerId || l.type === 'adjustment') {
          prioritized.push(l);
        } else {
          candidates.push(l);
        }
      }

      if (viewportBounds) {
        candidates.sort(
          (a, b) => distanceToViewportCenter(a, viewportBounds) - distanceToViewportCenter(b, viewportBounds)
        );
      }

      const remaining = MAX_DOM_LAYERS - prioritized.length;
      return [...prioritized, ...candidates.slice(0, Math.max(0, remaining))];
    }, [effectiveLayers, viewportBounds, zoom, selectedLayerIds, selectedLayerId, hoveredLayerId]);

    return (
      <>
        {visibleLayers.map((l) => {
          if (l.isMasking) {
            return null;
          }
          const maskLayer = layerMasks.get(l.id);

          const children = groupChildrenMap.get(l.id) || [];

          return (
            <React.Fragment key={l.id}>
              <CanvasLayerItemWrapper
                layer={l}
                allLayers={layers}
                layerMap={layerMap}
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
                isInteracting={isInteracting}
                previewAnimation={previewAnimation}
              />
              {children.map((child) => (
                <CanvasLayerItemWrapper
                  key={child.id}
                  layer={child}
                  allLayers={layers}
                  layerMap={layerMap}
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
                  isInteracting={isInteracting}
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
