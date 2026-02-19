/**
 * SelectionHandles Component
 * Renders selection handles for a single layer (resize, rotate)
 */

import React from 'react';
import { Layer } from '../../types';
import { Icons } from '../../constants';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'w' | 'e' | 'n' | 's';

interface SelectionHandlesProps {
  layer: Layer;
  onResize: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
  onRotate: (e: React.MouseEvent, layer: Layer) => void;
  scale?: number;
}

export const SelectionHandles = React.memo(({ layer, onResize, onRotate }: SelectionHandlesProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      {/* Border */}
      <div
        className={`absolute -inset-0.5 border-2 ${
          layer.locked ? 'border-red-400 border-dashed' : 'border-[#00c4cc]'
        } shadow-[0_0_8px_rgba(0,196,204,0.25)]`}
        style={{ borderRadius: `${(layer as any).cornerRadius || 0}px` }}
      />

      {layer.locked && (
        <div className="absolute -top-3 -right-3 bg-red-100 text-red-500 rounded-full p-1 shadow-md border border-red-200 z-50">
          <Icons.Lock className="w-3 h-3" />
        </div>
      )}

      {!layer.locked && (
        <>
          {/* Corner Handles */}
          <div
            onMouseDown={(e) => onResize(e, layer, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-nw-resize shadow-md hover:scale-125 transition-transform z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, layer, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-ne-resize shadow-md hover:scale-125 transition-transform z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, layer, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-sw-resize shadow-md hover:scale-125 transition-transform z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, layer, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-se-resize shadow-md hover:scale-125 transition-transform z-50"
          />

          {/* Edge Handles (Middle) */}
          {layer.width > 30 && (
            <>
              <div
                onMouseDown={(e) => onResize(e, layer, 'n')}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ns-resize shadow-sm hover:scale-110 transition-transform z-40"
              />
              <div
                onMouseDown={(e) => onResize(e, layer, 's')}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ns-resize shadow-sm hover:scale-110 transition-transform z-40"
              />
            </>
          )}

          {(layer.type !== 'text' || layer.width > 30) && (
            <>
              <div
                onMouseDown={(e) => onResize(e, layer, 'w')}
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1.5 h-6 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ew-resize shadow-sm hover:scale-110 transition-transform z-40"
              />
              <div
                onMouseDown={(e) => onResize(e, layer, 'e')}
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-1.5 h-6 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ew-resize shadow-sm hover:scale-110 transition-transform z-40"
              />
            </>
          )}

          {/* Rotate Handle */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 pointer-events-auto group/rotate z-50">
            <div className="w-px h-6 bg-[#7d2ae8]" />
            <div
              onMouseDown={(e) => onRotate(e, layer)}
              className="w-7 h-7 bg-white border-2 border-[#7d2ae8] rounded-full cursor-grab flex items-center justify-center hover:bg-[#7d2ae8] hover:text-white shadow-lg transition-all active:cursor-grabbing hover:scale-110"
              title="Rotate"
            >
              <Icons.RotateCw className="w-3.5 h-3.5 text-[#7d2ae8] group-hover/rotate:text-white" />
            </div>
          </div>
        </>
      )}
    </div>
  );
});

SelectionHandles.displayName = 'SelectionHandles';
