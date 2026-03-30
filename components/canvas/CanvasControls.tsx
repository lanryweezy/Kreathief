import React from 'react';
import { Layer } from '../../types';
import { MultiSelectionHandles } from './MultiSelectionHandles';
import { ContextMenu } from '../ContextMenu';

interface CanvasControlsProps {
  selectedLayerIds: string[];
  allLayers: Layer[];
  zoom: number;
  handleResizeStart: (e: React.MouseEvent, layer: Layer, handle: any) => void;
  handleRotateStart: (e: React.MouseEvent, layer: Layer) => void;
  contextMenu: { x: number; y: number; layerId: string } | null;
  setContextMenu: (menu: { x: number; y: number; layerId: string } | null) => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  selectedLayerIds,
  allLayers,
  zoom,
  handleResizeStart,
  handleRotateStart,
  contextMenu,
  setContextMenu,
}) => {
  const selectedLayers = allLayers.filter((l) => selectedLayerIds.includes(l.id));

  return (
    <>
      {/* Global Multi-selection handles */}
      {selectedLayerIds.length > 1 && (
        <div className="absolute inset-0 pointer-events-none z-[80]">
          <MultiSelectionHandles
            layers={selectedLayers}
            zoom={zoom}
            onResize={handleResizeStart}
            onRotate={handleRotateStart}
          />
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          layerId={contextMenu.layerId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};
