import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { IconButton } from './ToolbarShared';
import { Layer } from '../../types';

interface MaskToolsProps {
  layer: Layer;
  onUpdateLayer: (changes: any) => void;
  documentColors?: string[];
  isPro?: boolean;
  onOpenPricing?: () => void;
}

export const MaskTools = React.memo(
  ({
    layer,
    onUpdateLayer,
    documentColors: _documentColors,
    isPro: _isPro,
    onOpenPricing: _onOpenPricing,
  }: MaskToolsProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
          setShowSettings(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          // For text layers, use imageFill; for shapes, use both backgroundImage and imageFill
          if (layer.type === 'text') {
            onUpdateLayer({
              imageFill: {
                src: result,
                fit: 'cover',
                scale: 1,
                offsetX: 0,
                offsetY: 0,
                opacity: 1,
              },
            });
          } else if (layer.type !== 'image') {
            // For shapes and other non-image layers, set both backgroundImage and imageFill
            onUpdateLayer({
              backgroundImage: result,
              imageFill: {
                src: result,
                fit: 'cover',
                scale: 1,
                offsetX: 0,
                offsetY: 0,
                opacity: 1,
              },
              // Clear gradient if it exists to avoid conflicts
              gradient: undefined,
            });
          } else {
            // For image layers (shouldn't happen in this context)
            onUpdateLayer({
              backgroundImage: result,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const updateFill = (changes: any) => {
      onUpdateLayer({ imageFill: { ...(layer as any).imageFill, ...changes } });
    };

    const updateBackgroundScale = (scale: number) => {
      onUpdateLayer({ backgroundScale: scale });
    };

    const hasImageFill =
      layer.type === 'text'
        ? !!(layer as any).imageFill
        : !!(layer as any).backgroundImage || !!(layer as any).imageFill;

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer" title={layer.type === 'text' ? 'Add image to text' : 'Add image to shape'}>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div
              className={`p-1.5 rounded-lg border border-dashed transition-all ${hasImageFill ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white shadow-lg shadow-[#7d2ae8]/30' : 'bg-black/20 border-white/20 text-gray-400 hover:border-[#7d2ae8]/50 hover:text-white'}`}
            >
              <Icons.Image className="w-4 h-4" />
            </div>
          </label>

          {hasImageFill && (
            <div className="relative" ref={settingsRef}>
              <IconButton onClick={() => setShowSettings(!showSettings)} active={showSettings} title="Image Settings">
                <Icons.Settings className="w-4 h-4" />
              </IconButton>

              {showSettings && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-4 z-50 animate-fadeIn space-y-4 backdrop-blur-xl max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {layer.type === 'text' ? (
                    // Text layer imageFill settings
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        Fit & Scale
                      </span>
                      <div className="flex bg-black/40 rounded-lg p-1 gap-1">
                        {['cover', 'contain', 'fill'].map((fit) => (
                          <button
                            key={fit}
                            onClick={() => updateFill({ fit })}
                            className={`flex-1 text-[9px] py-1 rounded capitalize font-bold transition-all ${(layer as any).imageFill?.fit === fit ? 'bg-[#7d2ae8] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                            {fit}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[9px] text-gray-500 font-bold uppercase">Scale</span>
                          <span className="text-[9px] text-white font-mono">
                            {Math.round(((layer as any).imageFill?.scale || 1) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={(layer as any).imageFill?.scale || 1}
                          onChange={(e) => updateFill({ scale: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase block text-center">
                            Offset X
                          </span>
                          <input
                            type="number"
                            value={(layer as any).imageFill?.offsetX || 0}
                            onChange={(e) => updateFill({ offsetX: parseInt(e.target.value) })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-[10px] text-white p-1.5 outline-none font-mono text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase block text-center">
                            Offset Y
                          </span>
                          <input
                            type="number"
                            value={(layer as any).imageFill?.offsetY || 0}
                            onChange={(e) => updateFill({ offsetY: parseInt(e.target.value) })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-[10px] text-white p-1.5 outline-none font-mono text-center"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5">
                        <button
                          onClick={() => onUpdateLayer({ imageFill: undefined })}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-red-500/20"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Shape layer backgroundImage settings
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        Scale & Position
                      </span>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[9px] text-gray-500 font-bold uppercase">Scale</span>
                          <span className="text-[9px] text-white font-mono">
                            {Math.round(((layer as any).backgroundScale || 1) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={(layer as any).backgroundScale || 1}
                          onChange={(e) => updateBackgroundScale(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase block text-center">
                            Offset X
                          </span>
                          <input
                            type="number"
                            value={(layer as any).backgroundPositionX || 0}
                            onChange={(e) => onUpdateLayer({ backgroundPositionX: parseInt(e.target.value) })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-[10px] text-white p-1.5 outline-none font-mono text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase block text-center">
                            Offset Y
                          </span>
                          <input
                            type="number"
                            value={(layer as any).backgroundPositionY || 0}
                            onChange={(e) => onUpdateLayer({ backgroundPositionY: parseInt(e.target.value) })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-[10px] text-white p-1.5 outline-none font-mono text-center"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5">
                        <button
                          onClick={() => onUpdateLayer({ backgroundImage: undefined, backgroundGradient: undefined })}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-red-500/20"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

MaskTools.displayName = 'MaskTools';
