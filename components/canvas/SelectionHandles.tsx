/**
 * SelectionHandles Component
 * Renders selection handles for a single layer (resize, rotate)
 */

import React from 'react';
import { Layer } from '../../types';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

let selectionPulseInjected = false;
function ensureSelectionPulseStyle() {
  if (selectionPulseInjected) return;
  selectionPulseInjected = true;
  const style = document.createElement('style');
  style.textContent = `@keyframes selectionPulse { 0%, 100% { border-color: #7d2ae8; box-shadow: 0 0 10px rgba(125,42,232,0.2); } 50% { border-color: #9d50ff; box-shadow: 0 0 20px rgba(125,42,232,0.4); } }`;
  document.head.appendChild(style);
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'w' | 'e' | 'n' | 's';

interface SelectionHandlesProps {
  layer: Layer;
  onResize: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
  onRotate: (e: React.MouseEvent, layer: Layer) => void;
  onKeyboardResize?: (layer: Layer, handle: ResizeHandle, dx: number, dy: number, shiftKey: boolean) => void;
  scale?: number;
}

export const SelectionHandles = React.memo(({ layer, onResize, onRotate, onKeyboardResize }: SelectionHandlesProps) => {
  ensureSelectionPulseStyle();
  const updateLayer = useStore((state) => state.updateLayer);
  const rotation = layer.rotation || 0;

  const handleKeyDown = (e: React.KeyboardEvent, handle: ResizeHandle) => {
    if (!onKeyboardResize) return;
    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowUp': dy = -1; break;
      case 'ArrowDown': dy = 1; break;
      case 'ArrowLeft': dx = -1; break;
      case 'ArrowRight': dx = 1; break;
      default: return;
    }
    e.preventDefault();
    onKeyboardResize(layer, handle, dx, dy, e.shiftKey);
  };

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
              ? 'border-brand-400'
              : layer.masterId
                ? 'border-brand-300 border-dashed'
                : 'border-brand-600 ring-1 ring-brand-600/20'
        }`}
        style={{
          borderRadius: `${typeof (layer as any).cornerRadius === 'number' ? (layer as any).cornerRadius : 0}px`,
          animation: layer.locked ? 'none' : 'selectionPulse 2s ease-in-out infinite',
        }}
      />

      {/* Width Label - centered below bottom edge */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 bg-black/50 px-1 py-0.5 rounded whitespace-nowrap z-[60]"
        style={handleContainerStyle}
      >
        W: {Math.round(Number((layer as any).width) || 0)}px
      </div>

      {/* Height Label - centered to the right of right edge */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -right-[52px] text-[9px] text-gray-400 bg-black/50 px-1 py-0.5 rounded whitespace-nowrap z-[60]"
        style={handleContainerStyle}
      >
        H: {Math.round(Number((layer as any).height) || 0)}px
      </div>

      {(layer.locked || layer.componentId || layer.masterId) && (
        <div
          className={`absolute -top-3 -right-3 rounded-full p-1 shadow-md border z-50 flex items-center justify-center cursor-pointer ${
            layer.locked ? 'bg-red-100 text-red-500 border-red-200' : 'bg-brand-400 text-white border-brand-500'
          }`}
          style={handleContainerStyle}
          title={layer.componentId ? 'Master Component' : layer.masterId ? 'Component Instance' : 'Locked'}
          onClick={(e) => {
            e.stopPropagation();
            if (layer.locked) {
              updateLayer(layer.id, { locked: false });
            } else if (!layer.componentId && !layer.masterId) {
              updateLayer(layer.id, { locked: true });
            }
          }}
        >
          {layer.locked ? <Icons.Lock className="w-3 h-3" /> : <Icons.LayoutGrid className="w-3 h-3" />}
        </div>
      )}

      {!layer.locked && (
        <>
          {/* Corner Handles */}
          <div
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, 'nw')}
            onPointerDown={(e) => onResize(e, layer, 'nw')}
            style={handleContainerStyle}
            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-[2.5px] border-brand-600 rounded-md pointer-events-auto cursor-nw-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />
          <div
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, 'ne')}
            onPointerDown={(e) => onResize(e, layer, 'ne')}
            style={handleContainerStyle}
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-[2.5px] border-brand-600 rounded-md pointer-events-auto cursor-ne-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />
          <div
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, 'sw')}
            onPointerDown={(e) => onResize(e, layer, 'sw')}
            style={handleContainerStyle}
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-[2.5px] border-brand-600 rounded-md pointer-events-auto cursor-sw-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />
          <div
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, 'se')}
            onPointerDown={(e) => onResize(e, layer, 'se')}
            style={handleContainerStyle}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-[2.5px] border-brand-600 rounded-md pointer-events-auto cursor-se-resize shadow-[0_2px_10px_rgba(125,42,232,0.4)] hover:scale-125 transition-transform z-50"
          />

          {/* Edge Handles (Middle) */}
          {layer.width > 20 && (
            <>
              <div
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, 'n')}
                onPointerDown={(e) => onResize(e, layer, 'n')}
                style={handleContainerStyle}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white border-[1.5px] border-brand-600 rounded-full pointer-events-auto cursor-ns-resize shadow-md hover:scale-110 transition-transform z-40"
              />
              <div
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, 's')}
                onPointerDown={(e) => onResize(e, layer, 's')}
                style={handleContainerStyle}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white border-[1.5px] border-brand-600 rounded-full pointer-events-auto cursor-ns-resize shadow-md hover:scale-110 transition-transform z-40"
              />
            </>
          )}

          {(layer.type !== 'text' || layer.width > 20) && (
            <>
              <div
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, 'w')}
                onPointerDown={(e) => onResize(e, layer, 'w')}
                style={handleContainerStyle}
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1.5 h-8 bg-white border-[1.5px] border-brand-600 rounded-full pointer-events-auto cursor-ew-resize shadow-md hover:scale-110 transition-transform z-40"
              />
              <div
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, 'e')}
                onPointerDown={(e) => onResize(e, layer, 'e')}
                style={handleContainerStyle}
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-1.5 h-8 bg-white border-[1.5px] border-brand-600 rounded-full pointer-events-auto cursor-ew-resize shadow-md hover:scale-110 transition-transform z-40"
              />
            </>
          )}

          {/* Rotate Handle */}
          <div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 pointer-events-auto group/rotate z-50"
            style={handleContainerStyle}
          >
            <div className="w-0.5 h-6 bg-gradient-to-b from-brand-600 to-brand-400" />
            <div
              onPointerDown={(e) => onRotate(e, layer)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, { rotation: 0 });
              }}
              className="w-8 h-8 bg-white border-[2.5px] border-brand-600 rounded-full cursor-grab flex items-center justify-center hover:bg-brand-600 hover:text-white shadow-[0_4px_15px_rgba(125,42,232,0.4)] transition-all active:cursor-grabbing hover:scale-110"
              title="Double-click to reset"
            >
              <Icons.RotateCw className="w-4 h-4 text-brand-600 group-hover/rotate:text-white transition-colors" />
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
