import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { ImageLayer } from '../../types';
import { haptics } from '../../utils/haptics';

interface CropOverlayProps {
  zoom: number;
  canvasSize: { width: number; height: number };
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export const CropOverlay: React.FC<CropOverlayProps> = ({ zoom, canvasSize: _canvasSize }) => {
  const { croppingLayerId, artboards, cropArea: globalCropArea, setCropArea, applyCrop: globalApplyCrop, cancelCrop: globalCancelCrop, cropAspectRatio, setCropAspectRatio } = useStore(
    useShallow((state) => ({
      croppingLayerId: state.croppingLayerId,
      artboards: state.artboards,
      cropArea: state.cropArea,
      setCropArea: state.setCropArea,
      applyCrop: state.applyCrop,
      cancelCrop: state.cancelCrop,
      cropAspectRatio: state.cropAspectRatio,
      setCropAspectRatio: state.setCropAspectRatio,
    }))
  );

  const [localCropArea, setLocalCropArea] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  // Initialize local state from global on mount
  useEffect(() => {
    if (globalCropArea) {
      setLocalCropArea(globalCropArea);
    }
  }, [globalCropArea]);

  const activeArea = localCropArea || globalCropArea || { x: 0, y: 0, width: 0, height: 0 };

  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startArea, setStartArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  const allLayers = artboards.flatMap(a => a.layers);
  const layer = allLayers.find((l) => l.id === croppingLayerId) as ImageLayer;

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

      if (cropAspectRatio) {
        // Enforce aspect ratio
        if (isResizing === 'e' || isResizing === 'w' || isResizing.includes('e') || isResizing.includes('w')) {
          if (isResizing === 'e') {
            newArea.width = Math.max(10, startArea.width + dx);
            newArea.height = newArea.width / cropAspectRatio;
          } else if (isResizing === 'w') {
            const delta = Math.min(dx, startArea.width - 10);
            newArea.x = startArea.x + delta;
            newArea.width = startArea.width - delta;
            newArea.height = newArea.width / cropAspectRatio;
          } else if (isResizing.includes('e')) {
            newArea.width = Math.max(10, startArea.width + dx);
            if (isResizing.includes('n')) {
              newArea.height = newArea.width / cropAspectRatio;
              newArea.y = startArea.y + (startArea.height - newArea.height);
            } else {
              newArea.height = newArea.width / cropAspectRatio;
            }
          } else if (isResizing.includes('w')) {
            const delta = Math.min(dx, startArea.width - 10);
            newArea.x = startArea.x + delta;
            newArea.width = startArea.width - delta;
            if (isResizing.includes('n')) {
              newArea.height = newArea.width / cropAspectRatio;
              newArea.y = startArea.y + (startArea.height - newArea.height);
            } else {
              newArea.height = newArea.width / cropAspectRatio;
            }
          }
        } else if (isResizing === 'n' || isResizing === 's') {
          if (isResizing === 'n') {
            const delta = Math.min(dy, startArea.height - 10);
            newArea.y = startArea.y + delta;
            newArea.height = startArea.height - delta;
            newArea.width = newArea.height * cropAspectRatio;
          } else {
            newArea.height = Math.max(10, startArea.height + dy);
            newArea.width = newArea.height * cropAspectRatio;
          }
        }
      } else {
        // Free resize
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
      }

      const naturalWidth = layer.naturalWidth || layer.width;
      const naturalHeight = layer.naturalHeight || layer.height;

      // Final bounds clamping
      if (newArea.width > naturalWidth) {
        newArea.width = naturalWidth;
        if (cropAspectRatio) {
          newArea.height = newArea.width / cropAspectRatio;
        }
      }
      if (newArea.height > naturalHeight) {
        newArea.height = naturalHeight;
        if (cropAspectRatio) {
          newArea.width = newArea.height * cropAspectRatio;
        }
      }

      newArea.x = Math.max(0, Math.min(newArea.x, naturalWidth - newArea.width));
      newArea.y = Math.max(0, Math.min(newArea.y, naturalHeight - newArea.height));

      setLocalCropArea(newArea);
    },
    [isResizing, startPos, startArea, zoom, layer, setCropArea, cropAspectRatio]
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

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    haptics.selection();
    setIsResizing(handle);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPos({ x: clientX, y: clientY });
    setStartArea({ ...activeArea });
  };

  const applyCrop = () => {
    if (localCropArea) {
      setCropArea(localCropArea);
    }
    // ensure state sync before action
    setTimeout(() => {
        globalApplyCrop();
    }, 0);
  };

  const cancelCrop = () => {
    setLocalCropArea(null);
    globalCancelCrop();
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
    left: activeArea.x * canvasScale,
    top: activeArea.y * canvasScale,
    width: activeArea.width * canvasScale,
    height: activeArea.height * canvasScale,
    border: '2px solid #7d2ae8',
    boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto',
    cursor: 'move',
    zIndex: 1001,
  };

  const aspectPresets = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
  ];

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
          {/* NW Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
            onTouchStart={(e) => handleMouseDown(e, 'nw')}
            className="absolute -top-4 -left-4 w-8 h-8 flex items-center justify-center z-50 pointer-events-auto cursor-nw-resize"
          >
             <div className="w-4 h-4 bg-white border-2 border-[#7d2ae8] rounded-full shadow-md" />
          </div>

          {/* NE Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
            onTouchStart={(e) => handleMouseDown(e, 'ne')}
            className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center z-50 pointer-events-auto cursor-ne-resize"
          >
             <div className="w-4 h-4 bg-white border-2 border-[#7d2ae8] rounded-full shadow-md" />
          </div>

          {/* SW Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
            onTouchStart={(e) => handleMouseDown(e, 'sw')}
            className="absolute -bottom-4 -left-4 w-8 h-8 flex items-center justify-center z-50 pointer-events-auto cursor-sw-resize"
          >
             <div className="w-4 h-4 bg-white border-2 border-[#7d2ae8] rounded-full shadow-md" />
          </div>

          {/* SE Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'se')}
            onTouchStart={(e) => handleMouseDown(e, 'se')}
            className="absolute -bottom-4 -right-4 w-8 h-8 flex items-center justify-center z-50 pointer-events-auto cursor-se-resize"
          >
             <div className="w-4 h-4 bg-white border-2 border-[#7d2ae8] rounded-full shadow-md" />
          </div>

          {!cropAspectRatio && (
            <>
              {/* N Handle */}
              <div
                onMouseDown={(e) => handleMouseDown(e, 'n')}
                onTouchStart={(e) => handleMouseDown(e, 'n')}
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-8 flex items-center justify-center z-40 pointer-events-auto cursor-ns-resize"
              >
                 <div className="w-8 h-1.5 bg-white border border-[#7d2ae8] rounded-full shadow-sm" />
              </div>

              {/* S Handle */}
              <div
                onMouseDown={(e) => handleMouseDown(e, 's')}
                onTouchStart={(e) => handleMouseDown(e, 's')}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-8 flex items-center justify-center z-40 pointer-events-auto cursor-ns-resize"
              >
                 <div className="w-8 h-1.5 bg-white border border-[#7d2ae8] rounded-full shadow-sm" />
              </div>

              {/* W Handle */}
              <div
                onMouseDown={(e) => handleMouseDown(e, 'w')}
                onTouchStart={(e) => handleMouseDown(e, 'w')}
                className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-12 flex items-center justify-center z-40 pointer-events-auto cursor-ew-resize"
              >
                 <div className="w-1.5 h-8 bg-white border border-[#7d2ae8] rounded-full shadow-sm" />
              </div>

              {/* E Handle */}
              <div
                onMouseDown={(e) => handleMouseDown(e, 'e')}
                onTouchStart={(e) => handleMouseDown(e, 'e')}
                className="absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-12 flex items-center justify-center z-40 pointer-events-auto cursor-ew-resize"
              >
                 <div className="w-1.5 h-8 bg-white border border-[#7d2ae8] rounded-full shadow-sm" />
              </div>
            </>
          )}

          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="flex items-center bg-[#13161a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl pointer-events-auto">
              {aspectPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setCropAspectRatio(preset.value)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${cropAspectRatio === preset.value ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-900/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-[#13161a] border border-white/10 rounded-2xl p-1.5 gap-1.5 shadow-2xl pointer-events-auto">
              <button
                onClick={applyCrop}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#7d2ae8] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#6c1fd1] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-900/30"
              >
                <Icons.Check className="w-4 h-4" /> Apply
              </button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button
                onClick={cancelCrop}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-gray-400 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                <Icons.X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
