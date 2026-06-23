import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Layer, ImageLayer } from '../../types';
import { useStore } from '../../store/useStore';

interface CropOverlayProps {
  layer: ImageLayer;
  zoom: number;
  onClose: () => void;
}

export const CropOverlay = React.memo(({ layer, zoom, onClose }: CropOverlayProps) => {
  const updateLayer = useStore((s) => s.updateLayer);
  const [crop, setCrop] = useState(layer.crop || { x: 0, y: 0, width: layer.width, height: layer.height });
  const [isDragging, setIsDragging] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const dragStart = useRef({ x: 0, y: 0, crop: crop });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(handle);
      dragStart.current = { x: e.clientX, y: e.clientY, crop: { ...crop } };
    },
    [crop]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;

      const dx = (e.clientX - dragStart.current.x) / zoom;
      const dy = (e.clientY - dragStart.current.y) / zoom;
      const startCrop = dragStart.current.crop;

      let newCrop = { ...startCrop };

      if (isDragging === 'move') {
        newCrop.x = Math.max(0, Math.min(layer.naturalWidth || layer.width - startCrop.width, startCrop.x + dx));
        newCrop.y = Math.max(0, Math.min(layer.naturalHeight || layer.height - startCrop.height, startCrop.y + dy));
      } else if (isDragging === 'nw') {
        newCrop.x = Math.max(0, startCrop.x + dx);
        newCrop.y = Math.max(0, startCrop.y + dy);
        newCrop.width = Math.max(20, startCrop.width - dx);
        newCrop.height = Math.max(20, startCrop.height - dy);
      } else if (isDragging === 'ne') {
        newCrop.y = Math.max(0, startCrop.y + dy);
        newCrop.width = Math.max(20, startCrop.width + dx);
        newCrop.height = Math.max(20, startCrop.height - dy);
      } else if (isDragging === 'sw') {
        newCrop.x = Math.max(0, startCrop.x + dx);
        newCrop.width = Math.max(20, startCrop.width - dx);
        newCrop.height = Math.max(20, startCrop.height + dy);
      } else if (isDragging === 'se') {
        newCrop.width = Math.max(20, startCrop.width + dx);
        newCrop.height = Math.max(20, startCrop.height + dy);
      }

      setCrop(newCrop);
    },
    [isDragging, zoom, layer, crop]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  const applyCrop = useCallback(() => {
    updateLayer(layer.id, { crop } as Partial<Layer>);
    onClose();
  }, [layer.id, crop, updateLayer, onClose]);

  const resetCrop = useCallback(() => {
    const full = { x: 0, y: 0, width: layer.naturalWidth || layer.width, height: layer.naturalHeight || layer.height };
    setCrop(full);
    updateLayer(layer.id, { crop: full } as Partial<Layer>);
  }, [layer, updateLayer]);

  const scaleX = layer.width / (layer.naturalWidth || layer.width);
  const scaleY = layer.height / (layer.naturalHeight || layer.height);

  return (
    <div className="absolute inset-0 z-[150]">
      {/* Dimmed overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />

      {/* Crop region */}
      <div
        ref={containerRef}
        className="absolute border-2 border-white cursor-move"
        style={{
          left: crop.x * scaleX,
          top: crop.y * scaleY,
          width: crop.width * scaleX,
          height: crop.height * scaleY,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Grid lines */}
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
            className="absolute w-3 h-3 bg-white border border-gray-800 cursor-pointer z-10"
            style={{
              ...(corner === 'nw' && { top: -6, left: -6, cursor: 'nw-resize' }),
              ...(corner === 'ne' && { top: -6, right: -6, cursor: 'ne-resize' }),
              ...(corner === 'sw' && { bottom: -6, left: -6, cursor: 'sw-resize' }),
              ...(corner === 'se' && { bottom: -6, right: -6, cursor: 'se-resize' }),
            }}
            onPointerDown={(e) => handlePointerDown(e, corner)}
          />
        ))}

        {/* Dimensions label */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono whitespace-nowrap">
          {Math.round(crop.width)} × {Math.round(crop.height)}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-surface-dark-3 border border-gray-700 rounded-xl px-4 py-2 shadow-xl z-[160]">
        <button onClick={resetCrop} className="text-xs text-gray-400 hover:text-white transition-colors">
          Reset
        </button>
        <div className="w-px h-5 bg-gray-700" />
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-white transition-colors">
          Cancel
        </button>
        <button
          onClick={applyCrop}
          className="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
  CropOverlay.displayName = 'CropOverlay';
});
