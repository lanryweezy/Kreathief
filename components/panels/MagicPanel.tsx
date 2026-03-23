import React, { RefObject, useState } from 'react';
import { AppMode, AspectRatio } from '../../types';
import { Icons } from '../../constants';
import { Button } from '../Button';
import * as geminiService from '../../services/geminiService';

import { useStore } from '../../store/useStore';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';

interface MagicPanelProps {
  onGenerate: () => void;
  uploadedImage: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
}

export const MagicPanel: React.FC<MagicPanelProps> = ({ onGenerate, uploadedImage, fileInputRef }) => {
  const {
    mode,
    setMode: onSetMode,
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    isProcessing,
    addToast,
    quality,
    setQuality,
    selectedLayerIds,
    artboards,
    activeArtboardId
  } = useStore();

  const layers = artboards?.find((a) => a.id === activeArtboardId)?.layers || [];
  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      return;
    }
    setIsEnhancing(true);
    try {
      const enhanced = await geminiService.enhancePrompt(prompt);
      setPrompt(enhanced);
      analyticsService.track('generate_image', { mode: 'enhance_prompt' });
    } catch (e: any) {
      log.error('[MagicPanel] Prompt enhancement failed', e, { prompt: prompt.substring(0, 100) });
      addToast(
        'Prompt enhancement failed',
        'error',
        { label: 'Retry', onClick: handleEnhancePrompt },
        'There was an issue connecting to the AI service.'
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  const selectedImageLayer = layers.find((l) => l.id === selectedLayerId && l.type === 'image');

  // -- Contextual Edit Mode --
  if (selectedImageLayer && mode !== AppMode.THEME) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <div className="p-6 border-b border-white/5 space-y-6">
          <div className="bg-purple-600/10 rounded-2xl p-4 border border-purple-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                <Icons.Magic className="w-4 h-4 text-[#7d2ae8]" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Generative Edit</h4>
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              Transform <span className="text-white font-black">&quot;{selectedImageLayer.name || 'Image'}&quot;</span>{' '}
              with AI commands.
            </p>
          </div>

          <div className="relative group">
            <textarea
              className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:border-[#7d2ae8]/50 focus:ring-1 focus:ring-[#7d2ae8]/20 outline-none resize-none custom-scrollbar transition-all font-medium"
              placeholder="E.g., Turn the cat into a dog, Change the background to a beach..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest bg-black border border-white/10 text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#7d2ae8]/10 hover:border-purple-500/30 transition-all shadow-xl"
            >
              {isEnhancing ? (
                <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Icons.Sparkles className="w-3 h-3" />
              )}
              Enhance
            </button>
          </div>

          <Button
            variant="primary"
            className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-purple-900/40"
            onClick={() => {
              onGenerate();
              analyticsService.trackGeneration(prompt, 'edit');
            }}
            loading={isProcessing}
            disabled={!prompt.trim()}
          >
            <Icons.Wand className="w-4 h-4 mr-2" />
            Generate Transformation
          </Button>
        </div>
      </div>
    );
  }

  // -- Main Generation Mode --

  const getButtonLabel = () => {
    switch (mode) {
      case AppMode.GENERATE:
        return 'Generate Magic';
      case AppMode.EDIT:
        return 'Remix Design';
      case AppMode.THEME:
        return 'Apply Palette';
      default:
        return 'Generate';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Top Tabs */}
      <div className="p-6 border-b border-white/5 space-y-6">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => onSetMode(AppMode.GENERATE)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === AppMode.GENERATE ? 'bg-[#7d2ae8] text-white shadow-[0_0_15px_rgba(125,42,232,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Imagine
          </button>
          <button
            onClick={() => onSetMode(AppMode.EDIT)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === AppMode.EDIT ? 'bg-[#7d2ae8] text-white shadow-[0_0_15px_rgba(125,42,232,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Remix
          </button>
          <button
            onClick={() => onSetMode(AppMode.THEME)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === AppMode.THEME ? 'bg-[#7d2ae8] text-white shadow-[0_0_15px_rgba(125,42,232,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Theme
          </button>
        </div>

        {/* Input Area */}
        <div className="relative group">
          <textarea
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:border-[#7d2ae8]/50 focus:ring-1 focus:ring-[#7d2ae8]/20 outline-none resize-none custom-scrollbar transition-all font-medium"
            placeholder={mode === AppMode.GENERATE ? 'A futuristic city with flying cars...' : 'Describe changes...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest bg-black border border-white/10 text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#7d2ae8]/10 hover:border-purple-500/30 transition-all shadow-xl"
          >
            {isEnhancing ? (
              <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Icons.Sparkles className="w-3 h-3" />
            )}
            Enhance
          </button>
        </div>

        {/* Settings Row */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Quality Engine</label>
            <div className="flex bg-white/5 rounded-xl border border-white/5 p-1">
              <button
                onClick={() => setQuality('standard')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${quality === 'standard' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Turbo
              </button>
              <button
                onClick={() => setQuality('hd')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${quality === 'hd' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                HD <Icons.Star className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {mode === AppMode.GENERATE && (
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Aspect Ratio</label>
              <div className="flex bg-white/5 rounded-xl border border-white/5 p-1 gap-1">
                {[AspectRatio.SQUARE, AspectRatio.LANDSCAPE, AspectRatio.PORTRAIT].map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all ${aspectRatio === r ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    title={r}
                  >
                    {r === AspectRatio.SQUARE ? '1:1' : r === AspectRatio.LANDSCAPE ? '16:9' : '9:16'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Mode Upload */}
        {mode === AppMode.EDIT && (
          <div className="mb-4">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Source Image</label>
            {uploadedImage ? (
              <div className="relative group rounded-lg overflow-hidden border border-gray-600 aspect-[2/1] bg-black/50">
                <img src={uploadedImage} className="w-full h-full object-contain" />
                <button
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">
                    Replace
                  </span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-gray-700 bg-[#1e1e1e] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
              >
                <Icons.Upload className="w-5 h-5 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-400">Click to upload reference</span>
              </div>
            )}
          </div>
        )}

        <Button
          variant="primary"
          className="w-full py-3 shadow-lg shadow-purple-900/20"
          onClick={() => {
            onGenerate();
            analyticsService.trackGeneration(prompt, mode);
          }}
          loading={isProcessing}
          disabled={!prompt.trim() || (mode === AppMode.EDIT && !uploadedImage)}
        >
          <Icons.Magic className="w-4 h-4 mr-2" />
          {getButtonLabel()}
        </Button>
      </div>

      {/* Styles Gallery */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-t border-white/5">
        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 sticky top-0 bg-[#0a0a0a] py-2 z-10">
          Curated Styles
        </h4>
        <div className="grid grid-cols-2 gap-3 pb-10">
          {[
            { name: 'Photorealistic', style: 'highly detailed, photorealistic, 8k, cinematic lighting, depth of field' },
            { name: '3D Render', style: '3d render, blender, octane render, vivid colors, smooth textures' },
            { name: 'Cyberpunk', style: 'cyberpunk aesthetic, neon lights, futuristic, high contrast, dark atmosphere' },
            { name: 'Watercolor', style: 'watercolor painting, artistic, soft edges, pastel colors, paper texture' },
            { name: 'Line Art', style: 'minimalist line art, vector style, clean lines, black and white, simple' },
            { name: 'Oil Painting', style: 'oil painting style, visible brushstrokes, textured, classical art' },
            { name: 'Pixel Art', style: 'pixel art, 8-bit, retro game style, limited palette' },
            { name: 'Anime', style: 'anime style, studio ghibli, vibrant colors, detailed background' },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setPrompt(prompt ? `${prompt}, ${item.style}` : item.style);
                analyticsService.track('generate_image', { mode: 'apply_style', style: item.name });
              }}
              className="group relative h-20 bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-[#7d2ae8]/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{item.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default MagicPanel;
