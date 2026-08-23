import { log } from '../utils/log';
/**
 * CanvasLayerItemWrapper
 * Wraps individual layers to handle async masking and optimization hooks.
 */

import React, { useMemo } from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AnimationSettings } from '../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem, AdjustmentLayerItem } from './canvas/LayerItems';
import { useLayerMask, useProcessedImage } from '../hooks/useLayerWorker';
import { Icons } from '../constants';

// Resilience: Layer-level Error Boundary to isolate rendering failures
class LayerErrorBoundary extends React.Component<
  { layerId: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    log.error(`[LayerError] ID: ${this.props.layerId}`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded">
          <Icons.Help className="w-4 h-4 text-red-500" />
        </div>
      );
    }
    return this.props.children;
  }
}

interface CanvasLayerItemWrapperProps {
  layer: Layer;
  allLayers: Layer[];
  layerMap?: Map<string, Layer>;
  maskLayerOverride?: Layer; // Support for sibling-based masking (Advanced)
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
}

export const CanvasLayerItemWrapper: React.FC<CanvasLayerItemWrapperProps> = React.memo(
  (props) => {
    const l = props.layer;

    const {
      allLayers,
      layerMap,
      maskLayerOverride,
      selectedLayerId,
      selectedLayerIds,
      hoveredLayerId,
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
      isInteracting,
      previewAnimation,
    } = props;

    // Advanced Masking: Use O(1) lookup from precomputed layerMap
    const resolvedLayerMap = useMemo(() => {
      if (layerMap) {
        return layerMap;
      }
      if (!allLayers) {
        return null;
      }
      const map = new Map<string, Layer>();
      for (const ml of allLayers) {
        map.set(ml.id, ml);
      }
      return map;
    }, [layerMap, allLayers]);

    const effectiveMaskLayer =
      maskLayerOverride ||
      (l.maskLayerId && resolvedLayerMap ? resolvedLayerMap.get(l.maskLayerId) || null : null) ||
      null;

    const { maskPath } = useLayerMask(effectiveMaskLayer);
    const { processedUrl, isProcessing: isFiltering } = useProcessedImage(
      l.type === 'image' ? (l as ImageLayer) : null
    );

    const isSelected = selectedLayerId === l.id || (selectedLayerIds || []).includes(l.id);

    // Dynamic Masking Style
    const maskStyle: React.CSSProperties = maskPath
      ? {
          clipPath: maskPath,
          WebkitClipPath: maskPath,
        }
      : {};

    const commonProps = {
      isSelected,
      isHovered: hoveredLayerId === l.id,
      onMouseDown: handleMouseDownLayer,
      onResize: handleResizeStart,
      onRotate: handleRotateStart,
      onContextMenu: handleContextMenu,
      previewAnimation: previewAnimation,
      maskPath: maskStyle.clipPath as string,
      zoom: zoom,
      isInteracting,
    };

    const handleDoubleClick = (_e: React.MouseEvent, layer: any) => {
      if (onDoubleClickLayer) {
        onDoubleClickLayer(layer);
      }
    };

    const renderItem = () => {
      if (l.type === 'image') {
        // NOTE: no block-level wrapper here — an in-flow wrapper div pushes each
        // subsequent image layer below the artboard (clipped by overflow-hidden),
        // so only one image would ever be visible at a time.
        return (
          <>
            {isFiltering && (
              <div
                className="absolute z-[101] flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-lg animate-pulse pointer-events-none"
                style={{
                  left: l.x,
                  top: l.y,
                  width: (l as ImageLayer).width,
                  height: (l as ImageLayer).height,
                }}
              >
                <Icons.Magic className="w-5 h-5 text-white/40 animate-spin" />
              </div>
            )}
            <ImageLayerItem
              ref={(el) => setLayerRef(l.id, el)}
              layer={l as ImageLayer}
              {...commonProps}
              optimizedSrc={processedUrl}
            />
          </>
        );
      }

      if (l.type === 'text') {
        return (
          <TextLayerItem
            ref={(el) => setLayerRef(l.id, el)}
            layer={l as TextLayer}
            {...commonProps}
            onDoubleClick={handleTextDoubleClick as any}
            isEditing={editingTextId === l.id}
            textEditRef={textEditRef}
            onFinishEditing={finishEditingText}
          />
        );
      }

      if (l.type === 'adjustment') {
        return <AdjustmentLayerItem ref={(el) => setLayerRef(l.id, el)} layer={l as any} {...commonProps} />;
      }

      // Default: Shape Layer
      return (
        <ShapeLayerItem
          ref={(el) => setLayerRef(l.id, el)}
          layer={l as ShapeLayer}
          {...commonProps}
          onDrop={handleDropShape}
          onDoubleClick={handleDoubleClick}
          editingPathId={editingPathId}
          onUpdatePath={onUpdatePath}
        />
      );
    };

    return <LayerErrorBoundary layerId={l.id}>{renderItem()}</LayerErrorBoundary>;
  },
  (prev, next) => {
    // High-performance comparison
    if (prev.layer !== next.layer) {
      return false;
    }
    if (prev.zoom !== next.zoom) {
      return false;
    }
    if (prev.hoveredLayerId !== next.hoveredLayerId) {
      return false;
    }
    if (prev.editingTextId !== next.editingTextId) {
      return false;
    }
    if (prev.editingPathId !== next.editingPathId) {
      return false;
    }
    if (prev.maskLayerOverride !== next.maskLayerOverride) {
      return false;
    }
    if (prev.previewAnimation !== next.previewAnimation) {
      return false;
    }
    if (prev.isInteracting !== next.isInteracting) {
      return false;
    }

    // Selection check: only re-render if THIS layer's selection status changes
    const prevSelected =
      prev.selectedLayerId === prev.layer.id || (prev.selectedLayerIds || []).includes(prev.layer.id);
    const nextSelected =
      next.selectedLayerId === next.layer.id || (next.selectedLayerIds || []).includes(next.layer.id);
    if (prevSelected !== nextSelected) {
      return false;
    }

    // Masking check: if this layer has a mask, we must re-render if allLayers changes
    // (since the mask might be a sibling that was modified)
    if (prev.layer.maskLayerId && prev.allLayers !== next.allLayers) {
      return false;
    }

    return true;
  }
);

CanvasLayerItemWrapper.displayName = 'CanvasLayerItemWrapper';
