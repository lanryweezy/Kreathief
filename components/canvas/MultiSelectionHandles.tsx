/**
 * MultiSelectionHandles Component
 * Renders selection handles for a group of selected layers
 */

import React, { useMemo } from 'react';
import { Layer } from '../../types';
import { Icons } from '../../constants';
import { GeometryOracle } from '../../utils/geometryOracle';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'w' | 'e' | 'n' | 's';

interface MultiSelectionHandlesProps {
  layers: Layer[];
  zoom: number;
  onResize: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
  onRotate: (e: React.MouseEvent, layer: Layer) => void;
}

export const MultiSelectionHandles = React.memo(({ layers, onResize, onRotate }: MultiSelectionHandlesProps) => {
  // Calculate bounding box for all selected layers using centralized logic
  const bounds = useMemo(
    () => (layers.length > 0 ? GeometryOracle.getGroupBounds(layers) : { x: 0, y: 0, width: 0, height: 0 }),
    [layers]
  );

  if (layers.length === 0) {
    return null;
  }

  // Create a memoized proxy layer representing the group for the handles
  const groupLayer: Layer = useMemo(() => ({
    id: 'group_proxy',
    type: 'rectangle',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    cornerRadius: 0,
    color: 'transparent',
  } as any), [bounds.x, bounds.y, bounds.width, bounds.height]);

  return (
    <div id="multi-selection-box" className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      {/* Visual Bounding Box */}
      <div
        className="absolute border-2 border-[#7d2ae8] border-dashed"
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          pointerEvents: 'none',
        }}
      >
        {/* Dimension Badge for Multi-selection */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#7d2ae8] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none border border-white/20">
          {Math.round(bounds.width)} × {Math.round(bounds.height)}
        </div>
      </div>

      {/* Reuse SelectionHandles UI logic manually for the group */}
      <div className="absolute" style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }}>
        {/* Corner Handles */}
        <div
          onMouseDown={(e) => onResize(e, groupLayer, 'nw')}
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-nw-resize shadow-md z-50"
        ></div>
        <div
          onMouseDown={(e) => onResize(e, groupLayer, 'ne')}
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-ne-resize shadow-md z-50"
        ></div>
        <div
          onMouseDown={(e) => onResize(e, groupLayer, 'sw')}
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-sw-resize shadow-md z-50"
        ></div>
        <div
          onMouseDown={(e) => onResize(e, groupLayer, 'se')}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-se-resize shadow-md z-50"
        ></div>

        {/* Edge Handles */}
        {bounds.width > 30 && (
          <>
            <div
              onMouseDown={(e) => onResize(e, groupLayer, 'n')}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#7d2ae8] rounded-full pointer-events-auto cursor-ns-resize shadow-sm z-40"
            ></div>
            <div
              onMouseDown={(e) => onResize(e, groupLayer, 's')}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#7d2ae8] rounded-full pointer-events-auto cursor-ns-resize shadow-sm z-40"
            ></div>
          </>
        )}

        {/* Rotate Handle for Multi-Selection */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 pointer-events-auto group/rotate z-50">
          <div className="w-px h-6 bg-[#7d2ae8]"></div>
          <div
            onMouseDown={(e) => onRotate(e, groupLayer)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              (window as any).dispatchEvent(new CustomEvent('canvas-reset-rotation', { detail: { ids: layers.map(l => l.id) } }));
            }}
            className="w-7 h-7 bg-white border-2 border-[#7d2ae8] rounded-full cursor-grab flex items-center justify-center hover:bg-[#7d2ae8] hover:text-white shadow-lg transition-all active:cursor-grabbing hover:scale-110"
            title="Double-click to reset"
          >
            <Icons.RotateCw className="w-3.5 h-3.5 text-[#7d2ae8] group-hover/rotate:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
});

MultiSelectionHandles.displayName = 'MultiSelectionHandles';

