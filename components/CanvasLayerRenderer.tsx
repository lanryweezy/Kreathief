import React from 'react';
import { TextLayer, ShapeLayer, ImageLayer, Layer, AnimationSettings } from '../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem } from './canvas/LayerItems';
import { getLayerClipPath } from '../utils/layerRendering';

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
  isInteracting: boolean;
}

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
    isInteracting,
  }) => {
    return (
      <>
        {effectiveLayers
          .filter((l) => !l.groupId)
          .map((l) => {
            const maskLayer = l.maskLayerId ? layers.find((ml) => ml.id === l.maskLayerId) : null;
            const maskPath = maskLayer ? getLayerClipPath(maskLayer) : undefined;
            const isSelected = selectedLayerId === l.id || selectedLayerIds.includes(l.id);

            if (l.type === 'image') {
              return (
                <ImageLayerItem
                  key={l.id}
                  ref={(el) => setLayerRef(l.id, el)}
                  layer={l as ImageLayer}
                  isSelected={isSelected}
                  isHovered={hoveredLayerId === l.id}
                  onMouseDown={handleMouseDownLayer}
                  onMouseEnter={setHoveredLayerId}
                  onMouseLeave={() => setHoveredLayerId(null)}
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
                      key={`text-edit-${l.id}`}
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
                    <>
                      {!(l as TextLayer).text && (
                        <div
                          className="absolute inset-0 border-2 border-dashed border-gray-600/50 rounded flex items-center justify-center pointer-events-none"
                          style={{ left: l.x, top: l.y, width: l.width, transform: `rotate(${l.rotation}deg)` }}
                        >
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-0 hover:opacity-100 transition-opacity">
                            Empty Text
                          </span>
                        </div>
                      )}
                      <TextLayerItem
                        ref={(el) => setLayerRef(l.id, el)}
                        layer={l as TextLayer}
                        isSelected={isSelected}
                        isHovered={hoveredLayerId === l.id}
                        onMouseDown={handleMouseDownLayer}
                        onMouseEnter={setHoveredLayerId}
                        onMouseLeave={() => setHoveredLayerId(null)}
                        onResize={handleResizeStart}
                        onRotate={handleRotateStart}
                        onContextMenu={handleContextMenu}
                        onDoubleClick={handleTextDoubleClick}
                        isInteracting={isInteracting}
                        previewAnimation={previewAnimation}
                        maskPath={maskPath}
                      />
                    </>
                  )}
                </React.Fragment>
              );
            }

            return (
              <ShapeLayerItem
                key={l.id}
                ref={(el) => setLayerRef(l.id, el)}
                layer={l as ShapeLayer}
                isSelected={isSelected}
                isHovered={hoveredLayerId === l.id}
                onMouseDown={handleMouseDownLayer}
                onMouseEnter={setHoveredLayerId}
                onMouseLeave={() => setHoveredLayerId(null)}
                onResize={handleResizeStart}
                onRotate={handleRotateStart}
                onContextMenu={handleContextMenu}
                onDrop={handleDropShape}
                onDoubleClick={(_e, layer) => onDoubleClickLayer?.(layer)}
                editingPathId={editingPathId}
                onUpdatePath={onUpdatePath}
                zoom={zoom}
                previewAnimation={previewAnimation}
                maskPath={maskPath}
              />
            );
          })}
      </>
    );
  }
);
CanvasLayerRenderer.displayName = 'CanvasLayerRenderer';
