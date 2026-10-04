import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';
import { ImageLayer } from '../../types';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '../Button';

interface MagicImagePanelProps {
  selectedLayer?: ImageLayer;
}

export const MagicImagePanel = React.memo(({ selectedLayer }: MagicImagePanelProps) => {
  const {
    onRmBg,
    onMagicExpand,
    onUpscale,
    onRemix,
    vectorizeLayer,
    isRemovingBg,
    isGenerating,
    addToast,
  } = useStore(
    useShallow((state) => ({
      onRmBg: state.onRmBg,
      onMagicExpand: state.onMagicExpand,
      onUpscale: state.onUpscale,
      onRemix: state.onRemix,
      vectorizeLayer: state.vectorizeLayer,
      isRemovingBg: state.isRemovingBg,
      isGenerating: state.isGenerating,
      addToast: state.addToast,
    }))
  );

  const [fillPrompt, setFillPrompt] = useState('');
  const [isFilling, setIsFilling] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);

  const handleFill = useCallback(async () => {
    if (!selectedLayer || !fillPrompt.trim() || isFilling) {
      return;
    }
    setIsFilling(true);
    try {
      await onRemix(selectedLayer.id, fillPrompt);
      addToast('Generative Fill Applied: Replaced selected area using FLUX.1 Inpainting', 'success');
    } catch (e: any) {
      addToast(e?.message || 'Generative Fill Failed: Inpainting error', 'error');
    } finally {
      setIsFilling(false);
      setFillPrompt('');
    }
  }, [selectedLayer, fillPrompt, isFilling, onRemix, addToast]);

  const handleVectorize = useCallback(async () => {
    if (!selectedLayer || isVectorizing) return;
    setIsVectorizing(true);
    try {
      await vectorizeLayer(selectedLayer.id, {
        numberofcolors: 8,
        simplify: 0.8,
        qtres: 0.5,
        ltres: 0.5,
      });
      addToast('Vectorized Successfully: Raster image converted to editable SVG vector paths', 'success');
    } catch (e: any) {
      addToast(e?.message || 'Vectorization Failed: Could not trace image', 'error');
    } finally {
      setIsVectorizing(false);
    }
  }, [selectedLayer, isVectorizing, vectorizeLayer, addToast]);

  if (!selectedLayer) {
    return (
      <div className="bg-surface-dark-3 rounded-2xl border border-white/5 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Icons.Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">Magic Image AI</h3>
        </div>
        <p className="text-[11px] text-gray-500 text-center py-6 leading-relaxed">
          Select an image on your canvas to unlock 1-click cutout, upscaling, vectorization & generative inpainting.
        </p>
      </div>
    );
  }

  const isLayerProcessing = selectedLayer.isProcessing;
  const disableTools = isLayerProcessing || isGenerating;

  return (
    <div className="bg-surface-dark-3 rounded-2xl border border-white/5 p-5 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-brand-500 flex items-center justify-center shadow-md shadow-purple-500/20">
            <Icons.Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Magic Image Studio</h3>
            <span className="text-[9px] text-gray-500 font-mono">Fal.ai Accelerated</span>
          </div>
        </div>
      </div>

      {/* 1-Click Neural Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">1-Click Neural Actions</h4>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Sub-Second
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* BG Remover */}
          <button
            onClick={() => onRmBg(selectedLayer.id)}
            disabled={disableTools}
            className="p-3 bg-surface-dark-2 hover:bg-surface-dark-1 border border-white/5 hover:border-brand-500/40 rounded-xl flex flex-col items-start gap-1.5 transition-all group text-left disabled:opacity-40"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded-lg bg-pink-500/15 flex items-center justify-center">
                {isRemovingBg && isLayerProcessing ? (
                  <Icons.RefreshCw className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                ) : (
                  <Icons.Scissors className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <span className="text-[8px] font-mono text-gray-500">0.6s Bria</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-200 block group-hover:text-white">Cutout Subject</span>
              <span className="text-[8px] text-gray-500 line-clamp-1">Edge & hair isolation</span>
            </div>
          </button>

          {/* AI Upscale */}
          <button
            onClick={() => onUpscale(selectedLayer.id)}
            disabled={disableTools}
            className="p-3 bg-surface-dark-2 hover:bg-surface-dark-1 border border-white/5 hover:border-brand-500/40 rounded-xl flex flex-col items-start gap-1.5 transition-all group text-left disabled:opacity-40"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Icons.Maximize className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[8px] font-mono text-gray-500">4x/8x HD</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-200 block group-hover:text-white">Clarity Upscale</span>
              <span className="text-[8px] text-gray-500 line-clamp-1">300 DPI print texture</span>
            </div>
          </button>

          {/* Vectorize to SVG */}
          <button
            onClick={handleVectorize}
            disabled={disableTools || isVectorizing}
            className="p-3 bg-surface-dark-2 hover:bg-surface-dark-1 border border-white/5 hover:border-brand-500/40 rounded-xl flex flex-col items-start gap-1.5 transition-all group text-left disabled:opacity-40"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                {isVectorizing ? (
                  <Icons.RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <Icons.Edit className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <span className="text-[8px] font-mono text-gray-500">Native SVG</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-200 block group-hover:text-white">Trace to Vector</span>
              <span className="text-[8px] text-gray-500 line-clamp-1">Editable Bézier nodes</span>
            </div>
          </button>

          {/* Magic Expand */}
          <button
            onClick={() => onMagicExpand(selectedLayer.id)}
            disabled={disableTools}
            className="p-3 bg-surface-dark-2 hover:bg-surface-dark-1 border border-white/5 hover:border-brand-500/40 rounded-xl flex flex-col items-start gap-1.5 transition-all group text-left disabled:opacity-40"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Icons.Layers className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[8px] font-mono text-gray-500">Outpaint</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-200 block group-hover:text-white">Magic Expand</span>
              <span className="text-[8px] text-gray-500 line-clamp-1">Uncrop boundaries</span>
            </div>
          </button>
        </div>
      </div>

      {/* Generative Inpainting Fill */}
      <div className="space-y-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generative Fill (FLUX Inpaint)</h4>
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Type instructions to modify, replace, or add objects inside this image layer.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Add glowing sunglasses and cyberpunk reflections"
            value={fillPrompt}
            onChange={(e) => setFillPrompt(e.target.value)}
            disabled={disableTools}
            className="flex-1 bg-surface-dark-2 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFill();
              }
            }}
          />
          <Button
            variant="primary"
            className="px-3.5 bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20"
            onClick={handleFill}
            disabled={!fillPrompt.trim() || disableTools}
          >
            {isFilling ? (
              <Icons.RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Icons.Wand className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

MagicImagePanel.displayName = 'MagicImagePanel';
