import React from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer } from '../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem } from './canvas/LayerItems';

interface StaticLayerRendererProps {
  layers: Layer[];
  scale: number;
}

/**
 * A lightweight, non-interactive version of CanvasLayerRenderer.
 * Used for displaying agent-generated variants in smaller cards.
 */
export const StaticLayerRenderer: React.FC<StaticLayerRendererProps> = ({ layers, scale }) => {
  return (
    <div 
      className="relative pointer-events-none overflow-hidden" 
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'top left',
        width: '1000px', // Fixed coordinate space
        height: '1000px' 
      }}
    >
      {layers.map((l) => {
        if (l.type === 'image') {
          return (
            <ImageLayerItem
              key={l.id}
              layer={l as ImageLayer}
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
               layer={l as TextLayer}
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
            layer={l as ShapeLayer}
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
