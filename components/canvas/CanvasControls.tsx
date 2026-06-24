import React from 'react';
import { Layer } from '../../types';
import { MultiSelectionHandles } from './MultiSelectionHandles';
import { ContextMenu } from '../ContextMenu';
import { AlignmentPalette } from './AlignmentPalette';
import { DimensionInputs } from './DimensionInputs';

interface CanvasControlsProps {
  selectedLayerIds: string[];
  selectedLayers: Layer[];
  zoom: number;
  handleResizeStart: (e: React.MouseEvent, layer: Layer, handle: any) => void;
  handleRotateStart: (e: React.MouseEvent, layer: Layer) => void;
  contextMenu: { x: number; y: number; layerId: string } | null;
  setContextMenu: (menu: { x: number; y: number; layerId: string } | null) => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = React.memo(
  ({ selectedLayerIds, selectedLayers, zoom, handleResizeStart, handleRotateStart, contextMenu, setContextMenu }) => {
    const singleLayer = selectedLayers.length === 1 ? selectedLayers[0] : null;

    return (
      <>
        {/* Alignment Palette for multi-selection */}
        {selectedLayerIds.length >= 2 && (
          <div className="absolute inset-0 pointer-events-none z-[85]">
            <AlignmentPalette selectedLayerIds={selectedLayerIds} layers={selectedLayers} zoom={zoom} />
          </div>
        )}

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

        {/* Dimension inputs for single selection */}
        {singleLayer && !singleLayer.locked && (
          <div className="absolute inset-0 pointer-events-none z-[85]">
            <DimensionInputs layer={singleLayer} zoom={zoom} />
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
  }
);
CanvasControls.displayName = 'CanvasControls';
