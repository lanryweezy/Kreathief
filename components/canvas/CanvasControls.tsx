import React from 'react';
import { Layer } from '../../types';
import { MultiSelectionHandles } from './MultiSelectionHandles';
import { ContextMenu } from '../ContextMenu';

interface CanvasControlsProps {
  selectedLayerIds: string[];
  selectedLayers: Layer[];
  zoom: number;
  handleResizeStart: (e: React.MouseEvent, layer: Layer, handle: any) => void;
  handleRotateStart: (e: React.MouseEvent, layer: Layer) => void;
  contextMenu: { x: number; y: number; layerId: string } | null;
  setContextMenu: (menu: { x: number; y: number; layerId: string } | null) => void;
}

import { ContextualToolbar } from './ContextualToolbar';

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  selectedLayerIds,
  selectedLayers,
  zoom,
  handleResizeStart,
  handleRotateStart,
  contextMenu,
  setContextMenu,
}) => {
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
