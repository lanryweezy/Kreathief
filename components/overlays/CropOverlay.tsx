import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { ImageLayer } from '../../types';

interface CropOverlayProps {
  zoom: number;
  canvasSize: { width: number; height: number };
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export const CropOverlay: React.FC<CropOverlayProps> = ({ zoom, canvasSize: _canvasSize }) => {
  const { croppingLayerId, layers, cropArea, setCropArea, applyCrop, cancelCrop } = useStore();

  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startArea, setStartArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  const layer = layers.find((l) => l.id === croppingLayerId) as ImageLayer;

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !layer) {
        return;
      }

      const previousCropWidth = layer.crop?.width || layer.naturalWidth || layer.width;
      const canvasScale = layer.width / previousCropWidth;

      const dx = (e.clientX - startPos.x) / (zoom * canvasScale);
      const dy = (e.clientY - startPos.y) / (zoom * canvasScale);

      const newArea = { ...startArea };

      if (isResizing.includes('w')) {
        const delta = Math.min(dx, startArea.width - 10);
        newArea.x = startArea.x + delta;
        newArea.width = startArea.width - delta;
      }
      if (isResizing.includes('e')) {
        newArea.width = Math.max(10, startArea.width + dx);
      }
      if (isResizing.includes('n')) {
        const delta = Math.min(dy, startArea.height - 10);
        newArea.y = startArea.y + delta;
        newArea.height = startArea.height - delta;
      }
      if (isResizing.includes('s')) {
        newArea.height = Math.max(10, startArea.height + dy);
      }

      const naturalWidth = layer.naturalWidth || layer.width;
      const naturalHeight = layer.naturalHeight || layer.height;

      newArea.x = Math.max(0, Math.min(newArea.x, naturalWidth - 10));
      newArea.y = Math.max(0, Math.min(newArea.y, naturalHeight - 10));
      newArea.width = Math.min(newArea.width, naturalWidth - newArea.x);
      newArea.height = Math.min(newArea.height, naturalHeight - newArea.y);

      setCropArea(newArea);
    },
    [isResizing, startPos, startArea, zoom, layer, setCropArea]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!layer || layer.type !== 'image') {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartArea({ ...cropArea });
  };

  const naturalWidth = layer.naturalWidth || layer.width;
  const naturalHeight = layer.naturalHeight || layer.height;

  const previousCropWidth = layer.crop?.width || naturalWidth;
  const canvasScale = layer.width / previousCropWidth;

  const fullImageStyle: React.CSSProperties = {
    position: 'absolute',
    left: layer.x - (layer.crop?.x || 0) * canvasScale,
    top: layer.y - (layer.crop?.y || 0) * canvasScale,
    width: naturalWidth * canvasScale,
    height: naturalHeight * canvasScale,
    transform: `rotate(${layer.rotation}deg)`,
    zIndex: 1000,
    pointerEvents: 'none',
    opacity: 0.3,
    overflow: 'hidden',
  };

  const cropBoxStyle: React.CSSProperties = {
    position: 'absolute',
    left: cropArea.x * canvasScale,
    top: cropArea.y * canvasScale,
    width: cropArea.width * canvasScale,
    height: cropArea.height * canvasScale,
    border: '2px solid #7d2ae8',
    boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto',
    cursor: 'move',
    zIndex: 1001,
  };

  return (
    <>
      <div style={fullImageStyle}>
        <img src={layer.src} className="w-full h-full object-contain" alt="" />
      </div>

      <div
        style={{
          position: 'absolute',
          left: layer.x - (layer.crop?.x || 0) * canvasScale,
          top: layer.y - (layer.crop?.y || 0) * canvasScale,
          width: naturalWidth * canvasScale,
          height: naturalHeight * canvasScale,
          transform: `rotate(${layer.rotation}deg)`,
          zIndex: 1001,
          pointerEvents: 'none',
        }}
      >
        <div style={cropBoxStyle}>
          <div
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full cursor-nw-resize z-50 shadow-md"
          ></div>
          <div
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full cursor-ne-resize z-50 shadow-md"
          ></div>
          <div
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full cursor-sw-resize z-50 shadow-md"
          ></div>
          <div
            onMouseDown={(e) => handleMouseDown(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full cursor-se-resize z-50 shadow-md"
          ></div>

          <div
            onMouseDown={(e) => handleMouseDown(e, 'n')}
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white border border-[#7d2ae8] rounded-full cursor-ns-resize z-40 shadow-sm"
          ></div>
          <div
            onMouseDown={(e) => handleMouseDown(e, 's')}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white border border-[#7d2ae8] rounded-full cursor-ns-resize z-40 shadow-sm"
          ></div>
          <div
            onMouseDown={(e) => handleMouseDown(e, 'w')}
            className="absolute top-1/2 -translate-y-1/2 -left-1 w-1.5 h-8 bg-white border border-[#7d2ae8] rounded-full cursor-ew-resize z-40 shadow-sm"
          ></div>
          <div
            onMouseDown={(e) => handleMouseDown(e, 'e')}
            className="absolute top-1/2 -translate-y-1/2 -right-1 w-1.5 h-8 bg-white border border-[#7d2ae8] rounded-full cursor-ew-resize z-40 shadow-sm"
          ></div>

          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center bg-[#13161a] border border-white/10 rounded-xl p-1.5 gap-1.5 shadow-2xl pointer-events-auto">
            <button
              onClick={applyCrop}
              className="flex items-center gap-2 px-4 py-2 bg-[#7d2ae8] text-white rounded-lg text-xs font-bold hover:bg-[#6c1fd1] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-900/20"
            >
              <Icons.Check className="w-4 h-4" /> Apply Crop
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button
              onClick={cancelCrop}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
            >
              <Icons.X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
