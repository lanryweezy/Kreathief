import React, { useRef, useCallback, useEffect } from 'react';
import { ImageLayer } from '../../types';
import { useStore } from '../../store/useStore';

interface CropOverlayProps {
  layer: ImageLayer;
  zoom: number;
}

const MIN_CROP = 20; // minimum crop size in natural pixels

/**
 * Store-driven crop overlay. Rendered inside the artboard container while
 * `isCropMode` is active. Reads/writes `cropArea` (natural-pixel space) and
 * commits via the store's `applyCrop`, which rescales layer x/y/width/height.
 */
export const CropOverlay = React.memo(({ layer, zoom }: CropOverlayProps) => {
  const cropArea = useStore((s) => s.cropArea);
  const setCropArea = useStore((s) => s.setCropArea);
  const applyCrop = useStore((s) => s.applyCrop);
  const cancelCrop = useStore((s) => s.cancelCrop);

  const dragState = useRef<{
    handle: 'move' | 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const naturalWidth = layer.naturalWidth || layer.width;
  const naturalHeight = layer.naturalHeight || layer.height;
  // Scale between natural pixels and artboard (display) pixels for this layer
  const imgScale = layer.width / (layer.crop?.width || naturalWidth);

  // Full-image backdrop box in artboard-local coordinates
  const boxX = layer.x - (layer.crop?.x || 0) * imgScale;
  const boxY = layer.y - (layer.crop?.y || 0) * imgScale;
  const boxW = naturalWidth * imgScale;
  const boxH = naturalHeight * imgScale;

  // Exit on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelCrop();
      } else if (e.key === 'Enter') {
        applyCrop();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cancelCrop, applyCrop]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...(useStore.getState().cropArea || { x: 0, y: 0, width: naturalWidth, height: naturalHeight }) },
      };
    },
    [naturalWidth, naturalHeight]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragState.current;
      if (!state) {
        return;
      }
      // Screen px -> artboard px -> natural px
      const dx = (e.clientX - state.startX) / zoom / imgScale;
      const dy = (e.clientY - state.startY) / zoom / imgScale;
      const start = state.startCrop;
      const next = { ...start };

      if (state.handle === 'move') {
        next.x = Math.max(0, Math.min(naturalWidth - start.width, start.x + dx));
        next.y = Math.max(0, Math.min(naturalHeight - start.height, start.y + dy));
      } else {
        const right = start.x + start.width;
        const bottom = start.y + start.height;
        if (state.handle === 'nw' || state.handle === 'sw') {
          next.x = Math.max(0, Math.min(right - MIN_CROP, start.x + dx));
          next.width = right - next.x;
        } else {
          next.width = Math.max(MIN_CROP, Math.min(naturalWidth - start.x, start.width + dx));
        }
        if (state.handle === 'nw' || state.handle === 'ne') {
          next.y = Math.max(0, Math.min(bottom - MIN_CROP, start.y + dy));
          next.height = bottom - next.y;
        } else {
          next.height = Math.max(MIN_CROP, Math.min(naturalHeight - start.y, start.height + dy));
        }
      }

      setCropArea(next);
    },
    [zoom, imgScale, naturalWidth, naturalHeight, setCropArea]
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const resetCrop = useCallback(() => {
    setCropArea({ x: 0, y: 0, width: naturalWidth, height: naturalHeight });
  }, [setCropArea, naturalWidth, naturalHeight]);

  const crop = cropArea || { x: 0, y: 0, width: naturalWidth, height: naturalHeight };
  // Counter-scale UI chrome so handles/buttons stay usable at any zoom level
  const uiScale = 1 / Math.max(zoom, 0.05);

  return (
    <div className="absolute inset-0 z-[150]">
      {/* Dim everything outside the crop overlay; click to cancel */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={cancelCrop} />

      {/* Full-image ghost backdrop */}
      <div className="absolute pointer-events-none" style={{ left: boxX, top: boxY, width: boxW, height: boxH }}>
        <img src={layer.src} alt="" draggable={false} className="w-full h-full opacity-40 select-none" />
        {/* Bright region = current crop selection */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: crop.x * imgScale,
            top: crop.y * imgScale,
            width: crop.width * imgScale,
            height: crop.height * imgScale,
          }}
        >
          <img
            src={layer.src}
            alt=""
            draggable={false}
            className="absolute select-none"
            style={{
              width: boxW,
              height: boxH,
              left: -crop.x * imgScale,
              top: -crop.y * imgScale,
              maxWidth: 'none',
            }}
          />
        </div>
      </div>

      {/* Interactive crop region */}
      <div
        className="absolute border-2 border-white cursor-move pointer-events-auto"
        style={{
          left: boxX + crop.x * imgScale,
          top: boxY + crop.y * imgScale,
          width: crop.width * imgScale,
          height: crop.height * imgScale,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>

        {/* Corner handles */}
        {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
          <div
            key={corner}
            className="absolute w-3 h-3 bg-white border border-gray-800 z-10"
            style={{
              transform: `scale(${uiScale})`,
              ...(corner === 'nw' && { top: -6, left: -6, cursor: 'nw-resize' }),
              ...(corner === 'ne' && { top: -6, right: -6, cursor: 'ne-resize' }),
              ...(corner === 'sw' && { bottom: -6, left: -6, cursor: 'sw-resize' }),
              ...(corner === 'se' && { bottom: -6, right: -6, cursor: 'se-resize' }),
            }}
            onPointerDown={(e) => handlePointerDown(e, corner)}
          />
        ))}

        {/* Dimensions label + controls */}
        <div
          className="absolute -bottom-2 left-1/2 flex flex-col items-center gap-1.5"
          style={{ transform: `translate(-50%, 100%) scale(${uiScale})`, transformOrigin: 'top center' }}
        >
          <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono whitespace-nowrap">
            {Math.round(crop.width)} × {Math.round(crop.height)}
          </div>
          <div className="flex items-center gap-3 bg-surface-dark-3 border border-gray-700 rounded-xl px-4 py-2 shadow-xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetCrop();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Reset
            </button>
            <div className="w-px h-5 bg-gray-700" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelCrop();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                applyCrop();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors whitespace-nowrap"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CropOverlay.displayName = 'CropOverlay';
