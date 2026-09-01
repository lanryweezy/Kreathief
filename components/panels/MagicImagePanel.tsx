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
  const { onRmBg, onMagicExpand, onUpscale, onRemix, isRemovingBg, isGenerating } = useStore(
    useShallow((state) => ({
      onRmBg: state.onRmBg,
      onMagicExpand: state.onMagicExpand,
      onUpscale: state.onUpscale,
      onRemix: state.onRemix,
      isRemovingBg: state.isRemovingBg,
      isGenerating: state.isGenerating,
    }))
  );

  const [fillPrompt, setFillPrompt] = useState('');
  const [isFilling, setIsFilling] = useState(false);

  const handleFill = useCallback(async () => {
    if (!selectedLayer || !fillPrompt.trim() || isFilling) {
      return;
    }
    setIsFilling(true);
    await onRemix(selectedLayer.id, fillPrompt);
    setIsFilling(false);
    setFillPrompt('');
  }, [selectedLayer, fillPrompt, isFilling, onRemix]);

  if (!selectedLayer) {
    return (
      <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icons.Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Magic Image AI</h3>
        </div>
        <p className="text-[10px] text-gray-500 text-center py-4">Select an image to use magic tools</p>
      </div>
    );
  }

  const isLayerProcessing = selectedLayer.isProcessing;
  const disableTools = isLayerProcessing || isGenerating;

  return (
    <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4 space-y-5">
      <div className="flex items-center gap-2 border-b border-gray-700 pb-3">
        <Icons.Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Magic Image AI</h3>
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">1-Click Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() => onRmBg(selectedLayer.id)}
            disabled={disableTools}
          >
            {isRemovingBg && isLayerProcessing ? (
              <Icons.RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Icons.Scissors className="w-3 h-3 text-brand-400" />
            )}
            BG Remover
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() => onUpscale(selectedLayer.id)}
            disabled={disableTools}
          >
            <Icons.Maximize className="w-3 h-3 text-brand-400" />
            AI Upscale
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto col-span-2 flex items-center gap-2"
            onClick={() => onMagicExpand(selectedLayer.id)}
            disabled={disableTools}
          >
            <Icons.Maximize className="w-3 h-3 text-brand-400" />
            Magic Expand (Outpaint)
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Generative Fill</h4>
        <p className="text-[9px] text-gray-500 mb-2 leading-tight">
          Describe what you want to add or change in this image. The AI will seamlessly blend it in.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. A cyberpunk city skyline"
            value={fillPrompt}
            onChange={(e) => setFillPrompt(e.target.value)}
            disabled={disableTools}
            className="flex-1 bg-surface-dark-4 border border-gray-600 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFill();
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            className="px-3 flex items-center justify-center"
            onClick={handleFill}
            disabled={!fillPrompt.trim() || disableTools}
          >
            {isFilling ? <Icons.RefreshCw className="w-3 h-3 animate-spin" /> : <Icons.Wand className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
});

MagicImagePanel.displayName = 'MagicImagePanel';
