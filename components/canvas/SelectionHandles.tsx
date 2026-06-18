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
  const rotation = layer.rotation || 0;

  // Style to keep handles upright
  const handleContainerStyle = {
    transform: `rotate(${-rotation}deg)`,
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      {/* Primary Selection Border */}
      <div
        className={`absolute -inset-[1px] border-[1.5px] shadow-[0_0_15px_rgba(125,42,232,0.3)] transition-all ${
          layer.locked
            ? 'border-red-500 border-dashed opacity-50'
            : layer.componentId
              ? 'border-[#a855f7]'
              : layer.masterId
                ? 'border-[#c084fc] border-dashed'
                : 'border-[#7d2ae8] ring-1 ring-[#7d2ae8]/20'
        }`}
        style={{
          borderRadius: `${typeof (layer as any).cornerRadius === 'number' ? (layer as any).cornerRadius : 0}px`,
          animation: layer.locked ? 'none' : 'selectionPulse 2s ease-in-out infinite',
        }}
      >
        {/* Dimension Pill  high contrast, subtle */}
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-[9px] font-black font-mono px-2 py-0.5 rounded-full shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60]"
          style={handleContainerStyle}
        >
          {Math.round(Number((layer as any).width) || 0)} × {Math.round(Number((layer as any).height) || 0)}
        </div>
      </div>

      <style>{`
        @keyframes selectionPulse {
          0%, 100% { border-color: #7d2ae8; box-shadow: 0 0 10px rgba(125,42,232,0.2); }
          50% { border-color: #9d50ff; box-shadow: 0 0 20px rgba(125,42,232,0.4); }
        }
      `}</style>

      {(layer.locked || layer.componentId || layer.masterId) && (
        <div
          className={`absolute -top-3 -right-3 rounded-full p-1 shadow-md border z-50 flex items-center justify-center ${
            layer.locked ? 'bg-red-100 text-red-500 border-red-200' : 'bg-[#a855f7] text-white border-[#9333ea]'
          }`}
          style={handleContainerStyle}
          title={layer.componentId ? 'Master Component' : layer.masterId ? 'Component Instance' : 'Locked'}
        >
          {layer.locked ? <Icons.Lock className="w-3 h-3" /> : <Icons.LayoutGrid className="w-3 h-3" />}
        </div>
      )}

      {!layer.locked && (
        <>
          {/* Corner Handles */}
          <div
            onMouseDown={(e) => onResize(e, layer, 'nw')}
            style={handleContainerStyle}
            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-[2.5px] border-[#7d2ae8] rounded-md pointer-events-auto cursor-nw-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, layer, 'ne')}
            style={handleContainerStyle}
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-[2.5px] border-[#7d2ae8] rounded-md pointer-events-auto cursor-ne-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, layer, 'sw')}
            style={handleContainerStyle}
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-[2.5px] border-[#7d2ae8] rounded-md pointer-events-auto cursor-sw-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, layer, 'se')}
            style={handleContainerStyle}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-[2.5px] border-[#7d2ae8] rounded-md pointer-events-auto cursor-se-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />

          {/* Edge Handles (Middle) */}
          {layer.width > 30 && (
            <>
              <div
                onMouseDown={(e) => onResize(e, layer, 'n')}
                style={handleContainerStyle}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white border-[1.5px] border-[#7d2ae8] rounded-full pointer-events-auto cursor-ns-resize shadow-md hover:scale-110 transition-transform z-40"
              />
              <div
                onMouseDown={(e) => onResize(e, layer, 's')}
                style={handleContainerStyle}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white border-[1.5px] border-[#7d2ae8] rounded-full pointer-events-auto cursor-ns-resize shadow-md hover:scale-110 transition-transform z-40"
              />
            </>
          )}

          {(layer.type !== 'text' || layer.width > 30) && (
            <>
              <div
                onMouseDown={(e) => onResize(e, layer, 'w')}
                style={handleContainerStyle}
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1.5 h-8 bg-white border-[1.5px] border-[#7d2ae8] rounded-full pointer-events-auto cursor-ew-resize shadow-md hover:scale-110 transition-transform z-40"
              />
              <div
                onMouseDown={(e) => onResize(e, layer, 'e')}
                style={handleContainerStyle}
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-1.5 h-8 bg-white border-[1.5px] border-[#7d2ae8] rounded-full pointer-events-auto cursor-ew-resize shadow-md hover:scale-110 transition-transform z-40"
              />
            </>
          )}

          {/* Rotate Handle */}
          <div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 pointer-events-auto group/rotate z-50"
            style={handleContainerStyle}
          >
            <div className="w-0.5 h-6 bg-gradient-to-b from-[#7d2ae8] to-[#9d50ff]" />
            <div
              onMouseDown={(e) => onRotate(e, layer)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                (window as any).dispatchEvent(new CustomEvent('canvas-reset-rotation', { detail: { id: layer.id } }));
              }}
              className="w-8 h-8 bg-white border-[2.5px] border-[#7d2ae8] rounded-full cursor-grab flex items-center justify-center hover:bg-[#7d2ae8] hover:text-white shadow-[0_4px_15px_rgba(125,42,232,0.4)] transition-all active:cursor-grabbing hover:scale-110"
              title="Double-click to reset"
            >
              <Icons.RotateCw className="w-4 h-4 text-[#7d2ae8] group-hover/rotate:text-white transition-colors" />
            </div>
            {rotation !== 0 && (
              <div className="mt-2 bg-black/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-black text-white border border-white/10 shadow-2xl">
                {Math.round(rotation)}°
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

SelectionHandles.displayName = 'SelectionHandles';
