/**
 * CanvasLayerItemWrapper
 * Wraps individual layers to handle async masking and optimization hooks.
 */

import React from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AnimationSettings } from '../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem, AdjustmentLayerItem } from './canvas/LayerItems';
import { useLayerMask, useProcessedImage } from '../hooks/useLayerWorker';
import { Icons } from '../constants';

// Resilience: Layer-level Error Boundary to isolate rendering failures
class LayerErrorBoundary extends React.Component<{ layerId: string; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(`[LayerError] ID: ${this.props.layerId}`, error, errorInfo);
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
  previewAnimation?: AnimationSettings;
}

export const CanvasLayerItemWrapper: React.FC<CanvasLayerItemWrapperProps> = React.memo(
  (props) => {
    const l = props.layer;
    const {
      allLayers,
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
      previewAnimation,
    } = props;

    // Advanced Masking: Use explicit mask property OR sibling mask from props
    const effectiveMaskLayer = maskLayerOverride || 
      (l.maskLayerId && allLayers ? allLayers.find((ml) => ml.id === l.maskLayerId) : null) || 
      null;

    const { maskPath } = useLayerMask(effectiveMaskLayer);
    const { processedUrl, isProcessing: isFiltering } = useProcessedImage(l.type === 'image' ? (l as ImageLayer) : null);
    
    const isSelected = selectedLayerId === l.id || (selectedLayerIds || []).includes(l.id);

    // Dynamic Masking Style
    const maskStyle: React.CSSProperties = maskPath ? {
      clipPath: maskPath,
      WebkitClipPath: maskPath
    } : {};

    const commonProps = {
      isSelected,
      isHovered: hoveredLayerId === l.id,
      onMouseDown: handleMouseDownLayer,
      onResize: handleResizeStart,
      onRotate: handleRotateStart,
      onContextMenu: handleContextMenu,
      previewAnimation: previewAnimation,
      maskPath: maskPath, // Backward compatibility
      zoom: zoom,
    };

    const handleDoubleClick = (_e: React.MouseEvent, layer: any) => {
      if (onDoubleClickLayer) onDoubleClickLayer(layer);
    };

    const renderItem = () => {
      if (l.type === 'image') {
        return (
          <div className="relative h-full w-full" style={maskStyle}>
            {isFiltering && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-lg animate-pulse pointer-events-none">
                <Icons.Magic className="w-5 h-5 text-white/40 animate-spin" />
              </div>
            )}
            <ImageLayerItem
              ref={(el) => setLayerRef(l.id, el)}
              layer={l as ImageLayer}
              {...commonProps}
              optimizedSrc={processedUrl}
            />
          </div>
        );
      }

      if (l.type === 'text') {
        return (
          <div style={maskStyle}>
            <TextLayerItem
              ref={(el) => setLayerRef(l.id, el)}
              layer={l as TextLayer}
              {...commonProps}
              onDoubleClick={handleTextDoubleClick as any}
              isEditing={editingTextId === l.id}
              textEditRef={textEditRef}
              onFinishEditing={finishEditingText}
            />
          </div>
        );
      }

      if (l.type === 'adjustment') {
        return (
          <AdjustmentLayerItem
            ref={(el) => setLayerRef(l.id, el)}
            layer={l as any}
            {...commonProps}
          />
        );
      }

      // Default: Shape Layer
      return (
        <div style={maskStyle}>
          <ShapeLayerItem
            ref={(el) => setLayerRef(l.id, el)}
            layer={l as ShapeLayer}
            {...commonProps}
            onDrop={handleDropShape}
            onDoubleClick={handleDoubleClick}
            editingPathId={editingPathId}
            onUpdatePath={onUpdatePath}
          />
        </div>
      );
    };

    return (
      <LayerErrorBoundary layerId={l.id}>
        {renderItem()}
      </LayerErrorBoundary>
    );
  }
);

CanvasLayerItemWrapper.displayName = 'CanvasLayerItemWrapper';
