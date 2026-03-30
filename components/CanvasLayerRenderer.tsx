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
  }) => {
    return (
      <>
        {effectiveLayers
          .filter((l) => !l.groupId)
          .map((l) => (
            <CanvasLayerItemWrapper
              key={l.id}
              layer={l}
              allLayers={layers}
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
      </>
    );
  }
);
CanvasLayerRenderer.displayName = 'CanvasLayerRenderer';
