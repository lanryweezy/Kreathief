import React from 'react';
import { Layer } from '../../types';
import { useStore } from '../../store/useStore';

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'w' | 'e' | 'n' | 's';

interface Props {
  layer: Layer;
  multi?: boolean;
  onResize: (e: React.MouseEvent, layer: Layer, handle: Handle) => void;
  onRotate: (e: React.MouseEvent, layer: Layer) => void;
  onKeyboardResize?: (layer: Layer, handle: Handle, dx: number, dy: number, shiftKey: boolean) => void;
}

const HS =
  'absolute w-2 h-2 bg-white border-[1.5px] border-brand-600 rounded-sm pointer-events-auto transition-transform duration-150 hover:scale-125';

export const SelectionHandles = React.memo(({ layer, multi, onResize, onRotate, onKeyboardResize }: Props) => {
  const updateLayer = useStore((s) => s.updateLayer);
  const r = { transform: `rotate(${-(layer.rotation || 0)}deg)` };
  const key = (e: React.KeyboardEvent, h: Handle) => {
    if (!onKeyboardResize) {
      return;
    }
    const d: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const v = d[e.key];
    if (!v) {
      return;
    }
    e.preventDefault();
    onKeyboardResize(layer, h, v[0], v[1], e.shiftKey);
  };
  const h = (handle: Handle, cls: string) => (
    <div
      key={handle}
      tabIndex={0}
      onKeyDown={(e) => key(e, handle)}
      onPointerDown={(e) => {
        e.stopPropagation();
        onResize(e, layer, handle);
      }}
      // Stopping pointerdown does NOT stop the compatibility mousedown — block it
      // explicitly so the parent layer's onMouseDown doesn't start a drag.
      onMouseDown={(e) => e.stopPropagation()}
      style={r}
      className={`${HS} ${cls}`}
    />
  );

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      <div
        className={`absolute -inset-[2px] ${multi ? 'border-[1px] border-dashed border-brand-600' : 'border-[1px] border-brand-600 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]'} transition-all`}
        style={{ borderRadius: `${(layer as any).cornerRadius ?? 0}px` }}
      />

      {!layer.locked && (
        <>
          {h('nw', '-top-1 -left-1 cursor-nw-resize')}
          {h('ne', '-top-1 -right-1 cursor-ne-resize')}
          {h('sw', '-bottom-1 -left-1 cursor-sw-resize')}
          {h('se', '-bottom-1 -right-1 cursor-se-resize')}
          {layer.width > 24 && (
            <>
              {h('n', '-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize w-5 h-1.5 rounded-full')}
              {h('s', '-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize w-5 h-1.5 rounded-full')}
              {h('w', 'top-1/2 -translate-y-1/2 -left-1 cursor-ew-resize w-1.5 h-5 rounded-full')}
              {h('e', 'top-1/2 -translate-y-1/2 -right-1 cursor-ew-resize w-1.5 h-5 rounded-full')}
            </>
          )}
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-50"
            style={r}
          >
            <div className="w-px h-4 bg-brand-600" />
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                onRotate(e, layer);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, { rotation: 0 });
              }}
              className="w-5 h-5 bg-white border-[1.5px] border-brand-600 rounded-full cursor-grab hover:scale-110 transition-transform active:cursor-grabbing flex items-center justify-center"
              title="Rotate (double-click to reset)"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M8.5 5a3.5 3.5 0 01-6.8 1.2" stroke="#7d2ae8" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M1.5 5a3.5 3.5 0 016.8-1.2" stroke="#7d2ae8" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M7 1.5l.5 2.7M3 8.5l-.5-2.7" stroke="#7d2ae8" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            {(layer.rotation || 0) !== 0 && (
              <div className="mt-1 text-[8px] font-mono text-brand-600 bg-white/90 px-1 rounded">
                {Math.round(layer.rotation || 0)}°
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
SelectionHandles.displayName = 'SelectionHandles';
