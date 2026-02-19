import React from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider, CompactInput } from './ToolbarShared';
import { FILTER_PRESETS } from './ToolbarConstants';
import { ImageLayer } from '../../types';

interface ImageToolsProps {
  layer: ImageLayer;
  isRemovingBg: boolean;
  isExpanding: boolean;
  isEraserActive: boolean;
  isPro: boolean;
  handleRemoveBackground: () => void;
  handleEraserClick: () => void;
  handleMagicExpand: () => void;
  onRemix?: (id: string) => void;
  handleUpdateLayer: (changes: any) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onUpscale?: (id: string) => void;
  onEnhance?: (id: string) => void;
  onRetouch?: (id: string) => void;
  onCrop?: () => void;
  showResize: boolean;
  setShowResize: (show: boolean) => void;
  _onVectorize?: (id: string) => void;
}

export const ImageTools = React.memo(
  ({
    layer,
    isRemovingBg,
    isExpanding,
    isEraserActive,
    isPro,
    handleRemoveBackground,
    handleEraserClick,
    handleMagicExpand,
    onRemix,
    handleUpdateLayer,
    showFilters,
    setShowFilters,
    onUpscale,
    onEnhance,
    onRetouch,
    onCrop,
    showResize,
    setShowResize,
  }: ImageToolsProps) => {
    return (
      <div className="flex items-center gap-3">
        <IconButton
          onClick={handleRemoveBackground}
          disabled={isRemovingBg}
          active={isRemovingBg}
          title="Remove BG"
          className="relative"
        >
          {isRemovingBg ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Icons.Magic className="w-4 h-4 text-indigo-400" />
          )}
          {!isPro && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
              <Icons.Lock className="w-2 h-2 text-white" />
            </div>
          )}
        </IconButton>
        <IconButton onClick={handleEraserClick} active={isEraserActive} title="Magic Eraser" className="relative">
          <Icons.Eraser className="w-4 h-4 text-red-400" />
          {!isPro && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
              <Icons.Lock className="w-2 h-2 text-white" />
            </div>
          )}
        </IconButton>
        <IconButton
          onClick={handleMagicExpand}
          disabled={isExpanding}
          active={isExpanding}
          title="Expand"
          className="relative"
        >
          {isExpanding ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Icons.Maximize className="w-4 h-4 text-purple-400" />
          )}
          {!isPro && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
              <Icons.Lock className="w-2 h-2 text-white" />
            </div>
          )}
        </IconButton>
        <IconButton onClick={() => onRemix && onRemix(layer.id)} title="Remix">
          <Icons.RefreshCw className="w-4 h-4 text-emerald-400" />
        </IconButton>

        <Divider />

        <IconButton onClick={() => onEnhance?.(layer.id)} title="Auto Enhance">
          <Icons.Sparkles className="w-4 h-4 text-yellow-400" />
        </IconButton>
        <IconButton onClick={() => onUpscale?.(layer.id)} title="Upscale 2x">
          <Icons.TrendingUp className="w-4 h-4 text-cyan-400" />
        </IconButton>
        <IconButton onClick={() => onRetouch?.(layer.id)} title="Face Retouch">
          <Icons.User className="w-4 h-4 text-pink-400" />
        </IconButton>

        <Divider />

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showFilters ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white shadow-lg shadow-[#7d2ae8]/30' : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'}`}
            >
              <Icons.Filter className="w-3.5 h-3.5" /> Presets
            </button>
            {showFilters && (
              <div className="absolute top-full left-0 mt-3 w-64 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-3 z-50 animate-fadeIn backdrop-blur-xl">
                <div className="grid grid-cols-3 gap-2">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        handleUpdateLayer({ filters: { ...layer.filters, ...preset.filters } });
                      }}
                      className="aspect-video rounded-lg border border-white/5 hover:border-[#7d2ae8] bg-black/20 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-all font-bold uppercase tracking-tighter"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 h-8 bg-black/20 rounded-lg border border-white/10">
            <Icons.Blend className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="range"
              min="0"
              max="20"
              value={layer.filters?.blur || 0}
              onChange={(e) => {
                handleUpdateLayer({ filters: { ...layer.filters, blur: parseInt(e.target.value) } });
              }}
              className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
            />
          </div>
        </div>
        <Divider />

        <IconButton onClick={onCrop} title="Crop Image">
          <Icons.Crop className="w-4 h-4 text-emerald-400" />
        </IconButton>
        <div className="relative">
          <IconButton onClick={() => setShowResize(!showResize)} active={showResize} title="Resize Image">
            <Icons.Maximize className="w-4 h-4 text-blue-400" />
          </IconButton>
          {showResize && (
            <div className="absolute top-full left-0 mt-3 w-48 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-3 z-50 animate-fadeIn space-y-3 backdrop-blur-xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">
                Dimensions
              </span>
              <div className="flex gap-2 items-center">
                <CompactInput
                  value={layer.width}
                  onChange={(e: any) => handleUpdateLayer({ width: parseInt(e.target.value) })}
                  min={1}
                  width="w-full"
                  label="W"
                />
                <CompactInput
                  value={layer.height}
                  onChange={(e: any) => handleUpdateLayer({ height: parseInt(e.target.value) })}
                  min={1}
                  width="w-full"
                  label="H"
                />
              </div>
              <button
                onClick={() => setShowResize(false)}
                className="w-full py-1.5 bg-[#7d2ae8] text-white text-[10px] font-bold rounded-lg"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ImageTools.displayName = 'ImageTools';
