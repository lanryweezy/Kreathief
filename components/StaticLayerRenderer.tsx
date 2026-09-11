import React from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AdjustmentLayer } from '../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem, AdjustmentLayerItem } from './canvas/LayerItems';

interface StaticLayerRendererProps {
  layers: Layer[];
  scale: number;
  width?: number | string;
  height?: number | string;
}

/**
 * A lightweight, non-interactive version of CanvasLayerRenderer.
 * Used for displaying agent-generated variants in smaller cards and for DOM export.
 */
export const StaticLayerRenderer: React.FC<StaticLayerRendererProps> = ({
  layers,
  scale,
  width = '100%',
  height = '100%',
}) => {
  return (
    <div
      className="relative pointer-events-none overflow-hidden"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width,
        height,
      }}
    >
      {layers.map((l, idx) => {
        if (l.visible === false) {
          return null;
        }

        const zIndex = typeof (l as any).zIndex === 'number' ? (l as any).zIndex : idx + 1;
        const layerWithZIndex = { ...l, zIndex };

        if (l.type === 'adjustment') {
          return (
            <AdjustmentLayerItem
              key={l.id}
              layer={layerWithZIndex as AdjustmentLayer}
              isSelected={false}
              isHovered={false}
              onMouseDown={() => {}}
              onResize={() => {}}
              onRotate={() => {}}
              onContextMenu={() => {}}
            />
          );
        }

        if (l.type === 'image') {
          return (
            <ImageLayerItem
              key={l.id}
              layer={layerWithZIndex as ImageLayer}
              isSelected={false}
              isHovered={false}
              onMouseDown={() => {}}
              onResize={() => {}}
              onRotate={() => {}}
              onContextMenu={() => {}}
            />
          );
        }

        if (l.type === 'text') {
          return (
            <TextLayerItem
              key={l.id}
              layer={layerWithZIndex as TextLayer}
              isSelected={false}
              isHovered={false}
              onMouseDown={() => {}}
              onResize={() => {}}
              onRotate={() => {}}
              onContextMenu={() => {}}
              onDoubleClick={() => {}}
            />
          );
        }

        return (
          <ShapeLayerItem
            key={l.id}
            layer={layerWithZIndex as ShapeLayer}
            isSelected={false}
            isHovered={false}
            onMouseDown={() => {}}
            onResize={() => {}}
            onRotate={() => {}}
            onContextMenu={() => {}}
            onDoubleClick={() => {}}
            zoom={1}
          />
        );
      })}
    </div>
  );
};
