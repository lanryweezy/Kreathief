/**
 * CanvasLayerItemWrapper
 * Wraps individual layers to handle async masking and optimization hooks.
 */

import React from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AnimationSettings } from '../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem, AdjustmentLayerItem } from './canvas/LayerItems';
import { useLayerMask } from '../hooks/useLayerWorker';
import { Icons } from '../constants';

// Resilience: Layer-level Error Boundary to isolate rendering failures
class LayerErrorBoundary extends React.Component<{ children: React.ReactNode; layerId: string }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) {
    console.error(`[Resilience] Layer ${this.props.layerId} failed:`, error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute flex items-center justify-center border border-red-500/50 bg-red-500/10 rounded overflow-hidden" style={{ left: 0, top: 0, width: 50, height: 50 }}>
          <Icons.AlertTriangle className="w-4 h-4 text-red-500 opacity-50" />
        </div>
      );
    }
    return this.props.children;
  }
}

interface CanvasLayerItemWrapperProps {
  layer: Layer;
  allLayers: Layer[];
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
  ({
    layer: l,
    allLayers,
    selectedLayerId,
    selectedLayerIds,
    hoveredLayerId,
    setLayerRef,
    handleMouseDownLayer,
    handleResizeStart,
    handleRotateStart,
    handleContextMenu,
    handleTextDoubleClick,
    onDoubleClickLayer,
    editingTextId,
    textEditRef,
    finishEditingText,
    onUpdatePath,
    zoom,
    previewAnimation,
  }) => {
    const maskLayer = (l.maskLayerId ? allLayers.find((ml) => ml.id === l.maskLayerId) : null) || null;
    const { maskPath } = useLayerMask(maskLayer);
    const isSelected = selectedLayerId === l.id || selectedLayerIds.includes(l.id);

    if (l.type === 'image') {
      return (
        <LayerErrorBoundary layerId={l.id}>
          <ImageLayerItem
            ref={(el) => setLayerRef(l.id, el)}
            layer={l as ImageLayer}
            isSelected={isSelected}
            isHovered={hoveredLayerId === l.id}
            onMouseDown={handleMouseDownLayer}
            onResize={handleResizeStart}
            onRotate={handleRotateStart}
            onContextMenu={handleContextMenu}
            previewAnimation={previewAnimation}
            maskPath={maskPath}
          />
        </LayerErrorBoundary>
      );
    }

    if (l.type === 'text') {
      return (
        <LayerErrorBoundary layerId={l.id} key={l.id}>
          <React.Fragment>
            {editingTextId === l.id ? (
              <div
                ref={textEditRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={finishEditingText}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    textEditRef.current?.blur();
                  }
                }}
                className="absolute bg-transparent border-2 border-[#7d2ae8] outline-none z-[100] cursor-text min-w-[50px] text-layer-item"
                data-layer-type="text"
                data-is-editing="true"
                data-initial-text={(l as TextLayer).text}
                style={{
                  left: l.x,
                  top: l.y,
                  width: l.width,
                  fontSize: (l as TextLayer).fontSize,
                  fontFamily: (l as TextLayer).fontFamily,
                  fontWeight: (l as TextLayer).fontWeight,
                  textAlign: (l as TextLayer).textAlign,
                  color: (l as TextLayer).color,
                  transform: `rotate(${l.rotation}deg)`,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  clipPath: maskPath,
                }}
              >
                {(l as TextLayer).text}
              </div>
            ) : (
              <TextLayerItem
                ref={(el) => setLayerRef(l.id, el)}
                layer={l as TextLayer}
                isSelected={isSelected}
                isHovered={hoveredLayerId === l.id}
                onMouseDown={handleMouseDownLayer}
                onResize={handleResizeStart}
                onRotate={handleRotateStart}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleTextDoubleClick}
                previewAnimation={previewAnimation}
                maskPath={maskPath}
              />
            )}
          </React.Fragment>
        </LayerErrorBoundary>
      );
    }

    if (l.type === 'adjustment') {
      return (
        <LayerErrorBoundary layerId={l.id}>
          <AdjustmentLayerItem
            ref={(el) => setLayerRef(l.id, el)}
            layer={l}
            isSelected={isSelected}
            isHovered={hoveredLayerId === l.id}
            onMouseDown={handleMouseDownLayer}
            onResize={handleResizeStart}
            onRotate={handleRotateStart}
            onContextMenu={handleContextMenu}
            previewAnimation={previewAnimation}
          />
        </LayerErrorBoundary>
      );
    }

    if (l.type === 'group') {
      const group = l as any; // Cast to any for now to access children
      return (
        <LayerErrorBoundary layerId={l.id}>
          <div
            ref={(el) => setLayerRef(l.id, el)}
            className="absolute group-layer-container"
            onMouseDown={(e) => handleMouseDownLayer(e, l)}
            onContextMenu={(e) => handleContextMenu(e, l.id)}
            style={{
              left: l.x,
              top: l.y,
              width: l.width,
              height: l.height,
              transform: `rotate(${l.rotation}deg)`,
              opacity: l.opacity,
              zIndex: isSelected ? 100 : 1,
            }}
          >
            {/* Recursive render: child layers within this group */}
            {group.children?.map((childId: string) => {
              const childLayer = allLayers.find((layer) => layer.id === childId);
              if (!childLayer) {return null;}
              return (
                <CanvasLayerItemWrapper
                  key={childId}
                  layer={childLayer}
                  allLayers={allLayers}
                  selectedLayerId={selectedLayerId}
                  selectedLayerIds={selectedLayerIds}
                  hoveredLayerId={hoveredLayerId}
                  setHoveredLayerId={() => {}} // No-op nested hover for now
                  setLayerRef={setLayerRef}
                  handleMouseDownLayer={handleMouseDownLayer}
                  handleResizeStart={handleResizeStart}
                  handleRotateStart={handleRotateStart}
                  handleContextMenu={handleContextMenu}
                  handleTextDoubleClick={handleTextDoubleClick}
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
            
            {isSelected && (
              <div className="absolute inset-0 border border-[#7d2ae8] ring-1 ring-[#7d2ae8]/20 pointer-events-none" />
            )}
          </div>
        </LayerErrorBoundary>
      );
    }

    return (
      <LayerErrorBoundary layerId={l.id}>
        <ShapeLayerItem
          ref={(el) => setLayerRef(l.id, el)}
          layer={l as ShapeLayer}
          isSelected={isSelected}
          isHovered={hoveredLayerId === l.id}
          onMouseDown={handleMouseDownLayer}
          onResize={handleResizeStart}
          onRotate={handleRotateStart}
          onContextMenu={handleContextMenu}
          onDoubleClick={(_e, layer) => onDoubleClickLayer?.(layer)}
          onUpdatePath={onUpdatePath}
          zoom={zoom}
          previewAnimation={previewAnimation}
          maskPath={maskPath}
        />
      </LayerErrorBoundary>
    );
  }
);

CanvasLayerItemWrapper.displayName = 'CanvasLayerItemWrapper';
