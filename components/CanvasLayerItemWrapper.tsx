/**
 * CanvasLayerItemWrapper
 * Wraps individual layers to handle async masking and optimization hooks.
 */

import React from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AnimationSettings } from '../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem, AdjustmentLayerItem } from './canvas/LayerItems';
import { useLayerMask } from '../hooks/useLayerWorker';

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
      );
    }

    if (l.type === 'text') {
      return (
        <React.Fragment key={l.id}>
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
      );
    }

    if (l.type === 'adjustment') {
      return (
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
      );
    }

    return (
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
    );
  }
);

CanvasLayerItemWrapper.displayName = 'CanvasLayerItemWrapper';
