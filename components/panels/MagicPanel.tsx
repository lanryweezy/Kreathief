import React, { RefObject, useState, useRef, useEffect } from 'react';
import { AppMode, AspectRatio } from '../../types';
import { Icons } from '../../constants';
import { Button } from '../Button';
import * as geminiService from '../../services/geminiService';

import { useStore } from '../../store/useStore';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';

interface MagicPanelProps {
  onGenerate: (negPrompt?: string) => void;
  uploadedImage: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
}

// Style presets with inline SVG indicators representing the visual aesthetic
const STYLE_PRESETS = [
  {
    name: 'Photorealistic',
    style: 'highly detailed, photorealistic, 8k, cinematic lighting, depth of field',
    gradient: 'from-sky-800 via-blue-700 to-indigo-900',
    icon: '📷',
  },
  {
    name: '3D Render',
    style: '3d render, blender, octane render, vivid colors, smooth textures',
    gradient: 'from-violet-800 via-purple-700 to-fuchsia-900',
    icon: '🧊',
  },
  {
    name: 'Cyberpunk',
    style: 'cyberpunk aesthetic, neon lights, futuristic, high contrast, dark atmosphere',
    gradient: 'from-cyan-900 via-teal-800 to-purple-900',
    icon: '⚡',
  },
  {
    name: 'Watercolor',
    style: 'watercolor painting, artistic, soft edges, pastel colors, paper texture',
    gradient: 'from-pink-700 via-rose-600 to-orange-700',
    icon: '🎨',
  },
  {
    name: 'Line Art',
    style: 'minimalist line art, vector style, clean lines, black and white, simple',
    gradient: 'from-gray-700 via-slate-600 to-gray-800',
    icon: '✏️',
  },
  {
    name: 'Oil Painting',
    style: 'oil painting style, visible brushstrokes, textured, classical art',
    gradient: 'from-amber-800 via-yellow-700 to-orange-800',
    icon: '🖌️',
  },
  {
    name: 'Pixel Art',
    style: 'pixel art, 8-bit, retro game style, limited palette',
    gradient: 'from-green-800 via-emerald-700 to-teal-800',
    icon: '👾',
  },
  {
    name: 'Anime',
    style: 'anime style, studio ghibli, vibrant colors, detailed background',
    gradient: 'from-red-800 via-pink-700 to-rose-800',
    icon: '🌸',
  },
];

// Extended aspect ratios
const ASPECT_RATIOS = [
  { label: '1:1', value: AspectRatio.SQUARE, icon: '⬛' },
  { label: '16:9', value: AspectRatio.LANDSCAPE, icon: '▬' },
  { label: '9:16', value: AspectRatio.PORTRAIT, icon: '▮' },
  { label: '4:5', value: 'PORTRAIT_45' as any, icon: '▯' },
  { label: '4:3', value: 'LANDSCAPE_43' as any, icon: '▭' },
];

interface GenerationHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
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
    activeArtboardId,

    addImageLayer,
  } = useStore();

  const layers = artboards?.find((a) => a.id === activeArtboardId)?.layers || [];
  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [genHistory, setGenHistory] = useState<GenerationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('kreathief_gen_history');
      return saved ? JSON.parse(saved).slice(0, 6) : [];
    } catch { return []; }
  });

  // Subscribe to newly generated images and add them to history
  const generatedImages = undefined as any;
  const prevGeneratedRef = useRef<string | null>(null);
  useEffect(() => {
    // generatedImages may be undefined if store doesn't expose it
    if (!generatedImages || generatedImages === prevGeneratedRef.current) return;
    prevGeneratedRef.current = generatedImages;
    const item: GenerationHistoryItem = {
      id: Date.now().toString(),
      imageUrl: generatedImages,
      prompt: prompt || 'Generated image',
      timestamp: Date.now(),
    };
    setGenHistory(prev => {
      const next = [item, ...prev].slice(0, 6);
      try { localStorage.setItem('kreathief_gen_history', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [generatedImages, prompt]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await geminiService.enhancePrompt(prompt);
      setPrompt(enhanced);
      analyticsService.track('generate_image', { mode: 'enhance_prompt' });
    } catch (e: any) {
      log.error('[MagicPanel] Prompt enhancement failed', e, { prompt: prompt.substring(0, 100) });
      addToast('Prompt enhancement failed', 'error', { label: 'Retry', onClick: handleEnhancePrompt }, 'There was an issue connecting to the AI service.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const selectedImageLayer = layers.find((l) => l.id === selectedLayerId && l.type === 'image');

  // -- Contextual Edit Mode --
  if (selectedImageLayer && mode !== AppMode.THEME) {
    return (
      <div className="flex flex-col h-full bg-[#13161a]">
        <div className="p-4 border-b border-gray-700">
          <div className="bg-[#252627] rounded-lg p-3 border border-[#7d2ae8]/30 mb-4 shadow-lg shadow-purple-900/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#7d2ae8]">
                <Icons.Magic className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-white">Generative Edit</h4>
            </div>
            <p className="text-[10px] text-gray-400">
              Edit <span className="text-white font-medium">&quot;{selectedImageLayer.name || 'Image'}&quot;</span>{' '}
              using natural language.
            </p>
          </div>

          <div className="relative mb-4">
            <textarea
              className="w-full h-32 bg-[#1e1e1e] border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-[#7d2ae8] focus:ring-1 focus:ring-[#7d2ae8] outline-none resize-none custom-scrollbar"
              placeholder="E.g., Turn the cat into a dog, Change the background to a beach..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              className="absolute bottom-2 right-2 text-[10px] bg-[#7d2ae8]/20 hover:bg-[#7d2ae8]/40 text-[#7d2ae8] px-2 py-1 rounded flex items-center gap-1 transition-colors"
              title="Enhance prompt with AI"
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
            className="w-full py-3 shadow-xl shadow-indigo-900/20"
            onClick={() => {
              onGenerate(negativePrompt);
              analyticsService.trackGeneration(prompt, 'edit');
            }}
            loading={isProcessing}
            disabled={!prompt.trim()}
          >
            <Icons.Wand className="w-4 h-4 mr-2" />
            Generate Edit
          </Button>
        </div>
      </div>
    );
  }

  // -- Main Generation Mode --

  const getButtonLabel = () => {
    switch (mode) {
      case AppMode.GENERATE: return 'Generate Image';
      case AppMode.EDIT: return 'Generate Edits';
      case AppMode.THEME: return 'Apply Theme';
      default: return 'Generate';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Top Tabs */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex bg-[#1e1e1e] p-1 rounded-lg mb-4 border border-gray-700">
          <button
            onClick={() => onSetMode(AppMode.GENERATE)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${mode === AppMode.GENERATE ? 'bg-[#7d2ae8] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Imagine
          </button>
          <button
            onClick={() => onSetMode(AppMode.EDIT)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${mode === AppMode.EDIT ? 'bg-[#7d2ae8] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Remix
          </button>
          <button
            onClick={() => onSetMode(AppMode.THEME)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${mode === AppMode.THEME ? 'bg-[#7d2ae8] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Theme
          </button>
        </div>

        {/* Input Area */}
        <div className="relative mb-2">
          <textarea
            className="w-full h-28 bg-[#1e1e1e] border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-[#7d2ae8] focus:ring-1 focus:ring-[#7d2ae8] outline-none resize-none custom-scrollbar shadow-inner"
            placeholder={mode === AppMode.GENERATE ? 'A futuristic city with flying cars...' : 'Describe changes...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="absolute bottom-3 right-3 text-[10px] bg-[#2a2a2a] hover:bg-[#333] border border-gray-600 text-purple-400 px-2 py-1 rounded flex items-center gap-1 transition-all shadow-sm"
          >
            {isEnhancing ? (
              <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Icons.Sparkles className="w-3 h-3" />
            )}
            Enhance
          </button>
        </div>

        {/* Negative Prompt Toggle */}
        <button
          onClick={() => setShowNegative(!showNegative)}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors mb-3 uppercase tracking-wider font-bold"
        >
          <Icons.Plus className={`w-3 h-3 transition-transform duration-200 ${showNegative ? 'rotate-45' : ''}`} />
          {showNegative ? 'Hide' : 'Add'} Negative Prompt
        </button>

        {showNegative && (
          <div className="mb-3 animate-fade-in">
            <textarea
              className="w-full h-16 bg-[#1e1e1e] border border-red-900/40 rounded-lg p-3 text-xs text-gray-300 placeholder-gray-600 focus:border-red-600/50 outline-none resize-none custom-scrollbar"
              placeholder="What to exclude (e.g., blurry, ugly, watermark, text, bad anatomy)..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
            <p className="text-[9px] text-gray-600 mt-1">These elements will be excluded from the generation.</p>
          </div>
        )}

        {/* Settings Row */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Quality</label>
            <div className="flex bg-[#1e1e1e] rounded border border-gray-700 p-0.5">
              <button
                onClick={() => setQuality('standard')}
                className={`flex-1 py-1 rounded text-[10px] font-bold ${quality === 'standard' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
              >
                Fast
              </button>
              <button
                onClick={() => setQuality('hd')}
                className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 ${quality === 'hd' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'text-gray-400'}`}
              >
                Pro <Icons.Star className="w-2 h-2" />
              </button>
            </div>
          </div>

          {mode === AppMode.GENERATE && (
            <div className="flex-1">
              <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Ratio</label>
              <div className="flex bg-[#1e1e1e] rounded border border-gray-700 p-0.5 gap-0.5 overflow-x-auto">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setAspectRatio(r.value)}
                    className={`flex-shrink-0 px-1.5 py-1 rounded text-[9px] font-bold whitespace-nowrap ${aspectRatio === r.value ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                    title={r.label}
                  >
                    {r.label}
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
            onGenerate(negativePrompt);
            analyticsService.trackGeneration(prompt, mode);
          }}
          loading={isProcessing}
          disabled={!prompt.trim() || (mode === AppMode.EDIT && !uploadedImage)}
        >
          <Icons.Magic className="w-4 h-4 mr-2" />
          {getButtonLabel()}
        </Button>
      </div>

      {/* Generation History Strip */}
      {genHistory.length > 0 && (
        <div className="px-4 pt-3 pb-1 border-b border-gray-800/60">
          <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Icons.History className="w-3 h-3" />
            Recent
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {genHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (addImageLayer) {
                    addImageLayer(item.imageUrl, 'Generated Image');
                  }
                  setPrompt(item.prompt);
                  addToast('Image added to canvas', 'success');
                }}
                className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-700 hover:border-[#7d2ae8] transition-all group"
                title={item.prompt}
              >
                <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Icons.Plus className="w-4 h-4 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Styles Gallery */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 sticky top-0 bg-[#13161a] py-1 z-10">
          Quick Styles
        </h4>
        <div className="grid grid-cols-2 gap-2 pb-10">
          {STYLE_PRESETS.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setPrompt(prompt ? `${prompt}, ${item.style}` : item.style);
                analyticsService.track('generate_image', { mode: 'apply_style', style: item.name });
              }}
              className="group relative h-16 rounded-xl overflow-hidden hover:scale-[1.03] transition-all duration-200 hover:shadow-lg hover:shadow-black/40"
            >
              {/* Gradient background as visual preview */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-90`} />
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }} />
              <div className="absolute inset-0 flex flex-col items-start justify-end p-2 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="text-xs font-bold text-white group-hover:text-white/90 drop-shadow">{item.name}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default MagicPanel;
