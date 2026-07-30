import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider, CompactInput } from './ToolbarShared';
import { FILTER_PRESETS } from './ToolbarConstants';
import { ImageLayer } from '../../types';
import { Dropdown } from '../Dropdown';
import { useStore } from '../../store/useStore';
import { NavTab } from '../../types';
import { useMagicActions } from '../../hooks/useMagicActions';

interface ImageToolsProps {
  layer: ImageLayer;
  isRemovingBg: boolean;
  isExpanding: boolean;
  isSmartMaskMode: boolean;
  setIsSmartMaskMode: (active: boolean) => void;
  isPro: boolean;
  handleRemoveBackground: () => void;
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
  setIsLassoMode: (active: boolean) => void;
  isLassoMode: boolean;
  refineBrushMode: 'none' | 'erase' | 'restore';
  setRefineBrushMode: (mode: 'none' | 'erase' | 'restore') => void;
  refineBrushSize: number;
  setRefineBrushSize: (size: number) => void;
  doneLasso: () => void;
  cancelLasso: () => void;
  _onVectorize?: (id: string) => void;
}

export const ImageTools = React.memo(
  ({
    layer,
    isRemovingBg,
    isExpanding,
    isSmartMaskMode,
    setIsSmartMaskMode,
    isPro,
    handleRemoveBackground,
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
    setIsLassoMode,
    isLassoMode,
    refineBrushMode,
    setRefineBrushMode,
    refineBrushSize,
    setRefineBrushSize,
    doneLasso,
    cancelLasso,
  }: ImageToolsProps) => {
    const filtersButtonRef = useRef<HTMLButtonElement>(null);
    const resizeButtonRef = useRef<HTMLButtonElement>(null);
    const mockupButtonRef = useRef<HTMLButtonElement>(null);
    const [showMockupQuickSelect, setShowMockupQuickSelect] = React.useState(false);
    const [showPatchNodes, setShowPatchNodes] = React.useState(false);
    const patchNodesButtonRef = useRef<HTMLButtonElement>(null);
    const setActiveTab = useStore((state) => state.setActiveTab);
    const { isProcessing, handleEraseObject, handleMagicExtract } = useMagicActions();

    const handleApplyMockup = () => {
      // Select the current image layer before opening mockup panel
      useStore.getState().selectLayer(layer.id);
      setActiveTab(NavTab.MOCKUP);
      setShowMockupQuickSelect(false);
    };

    return (
      <div className="flex items-center gap-3 flex-nowrap">
        <div className="flex bg-surface-dark-4 rounded-lg border border-brand-600/30 p-0.5 shadow-lg shadow-purple-900/10">
          <IconButton
            onClick={handleRemoveBackground}
            loading={isRemovingBg}
            title="Auto Cut Out (AI)"
            className="px-3"
          >
            <div className="flex items-center gap-1.5">
              <Icons.Scissors className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cut Out</span>
            </div>
            {!isPro && (
              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                <Icons.Lock className="w-2 h-2 text-white" />
              </div>
            )}
          </IconButton>

          <Divider />

          <IconButton
            onClick={() => setIsSmartMaskMode(!isSmartMaskMode)}
            active={isSmartMaskMode}
            title="Smart Mask (Hover & Click)"
            className="px-3"
          >
            <div className="flex items-center gap-1.5">
              <Icons.Target className="w-4 h-4 text-pink-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Smart Mask</span>
            </div>
          </IconButton>

          <Divider />
          <IconButton
            onClick={() => setIsLassoMode(!isLassoMode)}
            active={isLassoMode}
            title="Lasso Cut Out"
            className="px-3"
          >
            <Icons.Brush className={`w-4 h-4 ${isLassoMode ? 'text-white' : 'text-indigo-400'}`} />
          </IconButton>
        </div>

        {layer.maskPath && (
          <>
            <Divider />
            <div className="flex bg-surface-dark-4 rounded-lg border border-pink-500/50 p-0.5 shadow-lg shadow-pink-900/10 animate-slideIn gap-1">
              <IconButton
                onClick={() => handleEraseObject(layer, layer.maskPath!)}
                loading={isProcessing}
                title="Erase Object (AI)"
                className="px-3"
              >
                <div className="flex items-center gap-1.5">
                  <Icons.Trash2 className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Erase</span>
                </div>
              </IconButton>
              <IconButton
                onClick={() => handleMagicExtract(layer, layer.maskPath!)}
                loading={isProcessing}
                title="Magic Extract (Separate Layer)"
                className="px-3"
              >
                <div className="flex items-center gap-1.5">
                  <Icons.Layers className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Extract</span>
                </div>
              </IconButton>
            </div>
          </>
        )}

        {layer.inpaintNodes && layer.inpaintNodes.length > 0 && (
          <>
            <Divider />
            <div className="relative">
              <button
                ref={patchNodesButtonRef}
                onClick={() => setShowPatchNodes(!showPatchNodes)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showPatchNodes ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-600/30' : 'bg-black/20 border-white/10 text-brand-300 hover:border-white/20 hover:bg-black/30'}`}
              >
                <Icons.Layers className="w-3.5 h-3.5" /> Patches ({layer.inpaintNodes.length})
              </button>
              <Dropdown
                anchorRef={patchNodesButtonRef}
                isOpen={showPatchNodes}
                onClose={() => setShowPatchNodes(false)}
                align="left"
              >
                <div className="w-56 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-3 animate-fadeIn space-y-2 backdrop-blur-xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-2">
                    Inpaint Nodes
                  </span>
                  {layer.inpaintNodes.map((node, i) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between bg-surface-dark-4 border border-white/5 rounded-lg p-2 hover:border-white/10"
                    >
                      <span className="text-[10px] text-gray-300 font-bold truncate flex-1">Patch {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newNodes = [...layer.inpaintNodes!];
                            newNodes[i] = { ...node, enabled: !node.enabled };
                            handleUpdateLayer({ inpaintNodes: newNodes });
                          }}
                          className="text-gray-400 hover:text-white"
                          title="Toggle Visibility"
                        >
                          {node.enabled ? (
                            <Icons.Eye className="w-3.5 h-3.5" />
                          ) : (
                            <Icons.EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            const newNodes = layer.inpaintNodes!.filter((_, index) => index !== i);
                            handleUpdateLayer({ inpaintNodes: newNodes.length > 0 ? newNodes : undefined });
                          }}
                          className="text-red-400 hover:text-red-300"
                          title="Delete Patch"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Dropdown>
            </div>
          </>
        )}

        {isLassoMode && (
          <>
            <Divider />
            <div className="flex bg-surface-dark-4 rounded-lg border-2 border-indigo-500/50 p-0.5 gap-0.5 shadow-lg shadow-indigo-900/20 animate-slideIn">
              <IconButton
                onClick={() => setRefineBrushMode(refineBrushMode === 'erase' ? 'none' : 'erase')}
                active={refineBrushMode === 'erase'}
                title="Erase (Subtraction)"
                className="px-2"
              >
                <div className="relative">
                  <Icons.Eraser className={`w-4 h-4 ${refineBrushMode === 'erase' ? 'text-white' : 'text-red-400'}`} />
                  <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full border border-surface-dark-3">
                    <Icons.Minus className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </IconButton>
              <IconButton
                onClick={() => setRefineBrushMode(refineBrushMode === 'restore' ? 'none' : 'restore')}
                active={refineBrushMode === 'restore'}
                title="Restore (Addition)"
                className="px-2"
              >
                <div className="relative">
                  <Icons.Brush
                    className={`w-4 h-4 ${refineBrushMode === 'restore' ? 'text-white' : 'text-emerald-400'}`}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full border border-surface-dark-3">
                    <Icons.Plus className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </IconButton>
            </div>

            <div className="flex items-center gap-2 px-3 h-8 bg-black/20 rounded-lg border border-white/10 animate-fadeIn">
              <span className="text-[9px] text-gray-500 uppercase font-black">Size</span>
              <input
                type="range"
                min="5"
                max="150"
                value={refineBrushSize}
                aria-label="Refine brush size"
                onChange={(e) => setRefineBrushSize(parseInt(e.target.value))}
                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[9px] text-indigo-400 font-mono w-6">{refineBrushSize}</span>
            </div>

            <Divider />

            <div className="flex bg-surface-dark-4 rounded-lg border border-gray-700 p-0.5 gap-0.5 animate-fadeIn">
              <IconButton
                onClick={() => handleUpdateLayer({ rotation: (layer.rotation + 90) % 360 })}
                title="Rotate 90°"
              >
                <Icons.RotateCw className="w-4 h-4 text-blue-400" />
              </IconButton>
              <IconButton
                onClick={() => handleUpdateLayer({ flipX: !layer.flipX })}
                active={layer.flipX}
                title="Flip Horizontal"
              >
                <Icons.FlipHorizontal className="w-4 h-4 text-cyan-400" />
              </IconButton>
              <IconButton
                onClick={() => handleUpdateLayer({ flipY: !layer.flipY })}
                active={layer.flipY}
                title="Flip Vertical"
              >
                <Icons.FlipVertical className="w-4 h-4 text-cyan-400" />
              </IconButton>
            </div>

            <div className="flex bg-surface-dark-4 rounded-lg border border-gray-700 p-0.5 gap-1 animate-fadeIn">
              <button
                onClick={doneLasso}
                className="px-3 h-8 flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-md transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
              >
                <Icons.Check className="w-3.5 h-3.5" />
                Done
              </button>
              <button
                onClick={cancelLasso}
                className="px-3 h-8 flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-bold rounded-md transition-all active:scale-95"
              >
                <Icons.X className="w-3.5 h-3.5 text-gray-500" />
                Cancel
              </button>
            </div>
          </>
        )}
        <IconButton
          onClick={handleMagicExpand}
          loading={isExpanding}
          active={isExpanding}
          title="Expand"
          className="relative"
        >
          <Icons.Maximize className="w-4 h-4 text-purple-400" />
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

        {/* Apply Mockup - Contextual Button */}
        <div className="relative">
          <button
            ref={mockupButtonRef}
            onClick={() => setShowMockupQuickSelect(!showMockupQuickSelect)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 bg-gradient-to-r from-brand-600/20 to-accent/20 text-white hover:border-brand-600 transition-all shadow-lg shadow-purple-900/20"
            title="Apply Mockup"
          >
            <Icons.Image className="w-4 h-4 text-brand-600" />
            <span className="uppercase tracking-wider">Mockup</span>
          </button>
          <Dropdown
            anchorRef={mockupButtonRef}
            isOpen={showMockupQuickSelect}
            onClose={() => setShowMockupQuickSelect(false)}
            align="left"
          >
            <div className="w-64 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-4 animate-fadeIn backdrop-blur-xl">
              <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                <Icons.Image className="w-4 h-4 text-brand-600" />
                Quick Mockups
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { id: 'tshirt_flat', name: 'T-Shirt', icon: '👕' },
                  { id: 'mug', name: 'Coffee Mug', icon: '☕' },
                  { id: 'iphone_mockup', name: 'iPhone', icon: '📱' },
                  { id: 'macbook', name: 'MacBook', icon: '💻' },
                  { id: 'tote_bag', name: 'Tote Bag', icon: '👜' },
                  { id: 'poster_wall', name: 'Poster', icon: '🖼️' },
                ].map((mockup) => (
                  <button
                    key={mockup.id}
                    onClick={handleApplyMockup}
                    className="p-2 bg-surface-dark-4 hover:bg-brand-600/20 border border-gray-700 hover:border-brand-600 rounded-lg transition-all text-left"
                  >
                    <span className="text-lg block mb-1">{mockup.icon}</span>
                    <span className="text-[9px] font-bold text-gray-300">{mockup.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleApplyMockup}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Icons.Grid className="w-3.5 h-3.5" />
                View All 50+ Mockups
              </button>
            </div>
          </Dropdown>
        </div>

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
              ref={filtersButtonRef}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showFilters ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-600/30' : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'}`}
            >
              <Icons.Filter className="w-3.5 h-3.5" /> Presets
            </button>
            <Dropdown
              anchorRef={filtersButtonRef}
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              align="left"
            >
              <div className="w-80 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-3 animate-fadeIn backdrop-blur-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="mb-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Standard</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {FILTER_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          handleUpdateLayer({
                            filters: { ...layer.filters, ...preset.filters, artisticFilter: undefined },
                          });
                        }}
                        className={`aspect-video rounded-lg border flex items-center justify-center text-[10px] transition-all font-bold uppercase tracking-tighter ${
                          !layer.filters?.artisticFilter &&
                          Object.keys(preset.filters || {}).every(
                            (k) => (layer.filters as any)?.[k] === (preset.filters as any)[k]
                          )
                            ? 'border-brand-600 bg-brand-600/10 text-white'
                            : 'border-white/5 hover:border-brand-600 bg-black/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Artistic Effects
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'artistic-watercolor', name: 'Watercolor' },
                      { id: 'artistic-sketch', name: 'Pencil Sketch' },
                      { id: 'artistic-cartoon', name: 'Cartoon / Halftone' },
                      { id: 'artistic-glitch', name: 'Vintage Glitch' },
                    ].map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => {
                          handleUpdateLayer({ filters: { ...layer.filters, artisticFilter: effect.id } });
                        }}
                        className={`py-3 rounded-lg border flex items-center justify-center text-[11px] transition-all font-bold tracking-tight ${
                          layer.filters?.artisticFilter === effect.id
                            ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-600/40'
                            : 'border-white/5 hover:border-brand-600/50 bg-black/20 text-gray-300 hover:text-white hover:bg-brand-600/10'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Icons.Sparkles className="w-3.5 h-3.5" />
                          {effect.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
          <div className="flex items-center gap-2 px-3 h-8 bg-black/20 rounded-lg border border-white/10">
            <Icons.Blend className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="range"
              min="0"
              max="20"
              value={layer.filters?.blur || 0}
              aria-label="Blur amount"
              onChange={(e) => {
                handleUpdateLayer({ filters: { ...layer.filters, blur: parseInt(e.target.value) } });
              }}
              className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>
        <Divider />

        <IconButton onClick={onCrop} title="Crop Image">
          <Icons.Crop className="w-4 h-4 text-emerald-400" />
        </IconButton>
        <div className="relative">
          <IconButton
            ref={resizeButtonRef}
            onClick={() => setShowResize(!showResize)}
            active={showResize}
            title="Resize Image"
          >
            <Icons.Maximize className="w-4 h-4 text-blue-400" />
          </IconButton>
          <Dropdown anchorRef={resizeButtonRef} isOpen={showResize} onClose={() => setShowResize(false)} align="left">
            <div className="w-48 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-3 animate-fadeIn space-y-3 backdrop-blur-xl">
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
                className="w-full py-1.5 bg-brand-600 text-white text-[10px] font-bold rounded-lg"
              >
                Done
              </button>
            </div>
          </Dropdown>
        </div>
      </div>
    );
  }
);

ImageTools.displayName = 'ImageTools';
