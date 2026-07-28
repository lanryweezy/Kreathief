import React, { useState, useRef, useEffect } from 'react';
import { AppMode, AspectRatio } from '../../types';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { Toggle } from '../Toggle';
import * as geminiService from '../../services/geminiService';

import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';
import { getAIErrorMessage } from '../../utils/errorMessages';
import { analyzeDesign, DesignAnalysis } from '../../ai/designEngine';
import { v4 as uuidv4 } from 'uuid';
import { PanelErrorBoundary } from './PanelErrorBoundary';

interface MagicPanelProps {
  onGenerate: (negPrompt?: string) => void;
  uploadedImage: string | null;
}

// Style presets with inline SVG indicators representing the visual aesthetic
const STYLE_PRESETS = [
  {
    name: 'Photorealistic',
    style: 'highly detailed, photorealistic, 8k, cinematic lighting, depth of field',
    gradient: 'from-sky-800 via-blue-700 to-indigo-900',
    icon: 'Camera',
  },
  {
    name: '3D Render',
    style: '3d render, blender, octane render, vivid colors, smooth textures',
    gradient: 'from-violet-800 via-purple-700 to-fuchsia-900',
    icon: 'Box',
  },
  {
    name: 'Cyberpunk',
    style: 'cyberpunk aesthetic, neon lights, futuristic, high contrast, dark atmosphere',
    gradient: 'from-cyan-900 via-teal-800 to-purple-900',
    icon: 'Zap',
  },
  {
    name: 'Watercolor',
    style: 'watercolor painting, artistic, soft edges, pastel colors, paper texture',
    gradient: 'from-pink-700 via-rose-600 to-orange-700',
    icon: 'Brush',
  },
  {
    name: 'Line Art',
    style: 'minimalist line art, vector style, clean lines, black and white, simple',
    gradient: 'from-gray-700 via-slate-600 to-gray-800',
    icon: 'Edit',
  },
  {
    name: 'Oil Painting',
    style: 'oil painting style, visible brushstrokes, textured, classical art',
    gradient: 'from-amber-800 via-yellow-700 to-orange-800',
    icon: 'Brush',
  },
  {
    name: 'Pixel Art',
    style: 'pixel art, 8-bit, retro game style, limited palette',
    gradient: 'from-green-800 via-emerald-700 to-teal-800',
    icon: 'Code',
  },
  {
    name: 'Anime',
    style: 'anime style, studio ghibli, vibrant colors, detailed background',
    gradient: 'from-red-800 via-pink-700 to-rose-800',
    icon: 'Sparkles',
  },
];

// Extended aspect ratios
const ASPECT_RATIOS = [
  { label: '1:1', value: AspectRatio.SQUARE, icon: 'Square' },
  { label: '16:9', value: AspectRatio.LANDSCAPE, icon: 'LayoutCol' },
  { label: '9:16', value: AspectRatio.PORTRAIT, icon: 'LayoutRow' },
  { label: '4:5', value: 'PORTRAIT_45' as any, icon: 'LayoutRow' },
  { label: '4:3', value: 'LANDSCAPE_43' as any, icon: 'LayoutCol' },
];

interface GenerationHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export const MagicPanel: React.FC<MagicPanelProps> = ({ onGenerate, uploadedImage }) => {
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const {
    mode,
    setMode: onSetMode,
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    isProcessing,
    isGenerating,
    addToast,
    quality,
    setQuality,
    selectedLayerIds,
    artboards,
    activeArtboardId,
    addImageLayer,
    lastGeneratedImageUrl,
  } = useStore(
    useShallow((state) => ({
      mode: state.mode,
      setMode: state.setMode,
      prompt: state.prompt,
      setPrompt: state.setPrompt,
      aspectRatio: state.aspectRatio,
      setAspectRatio: state.setAspectRatio,
      isProcessing: state.isProcessing,
      isGenerating: state.isGenerating,
      addToast: state.addToast,
      quality: state.quality,
      setQuality: state.setQuality,
      selectedLayerIds: state.selectedLayerIds,
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      addImageLayer: state.addImageLayer,
      lastGeneratedImageUrl: state.lastGeneratedImageUrl,
    }))
  );

  const layers = artboards?.find((a) => a.id === activeArtboardId)?.layers || [];
  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [antiAiSlop, setAntiAiSlop] = useState(true);
  const [designAnalysis, setDesignAnalysis] = useState<DesignAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [genHistory, setGenHistory] = useState<GenerationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('kreathief_gen_history');
      return saved ? JSON.parse(saved).slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  // Subscribe to newly generated images and add them to history
  const prevGeneratedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!lastGeneratedImageUrl || lastGeneratedImageUrl === prevGeneratedRef.current) {
      return;
    }
    prevGeneratedRef.current = lastGeneratedImageUrl;
    const item: GenerationHistoryItem = {
      id: uuidv4(),
      imageUrl: lastGeneratedImageUrl,
      prompt: prompt || 'Generated image',
      timestamp: Date.now(),
    };
    setGenHistory((prev) => {
      const next = [item, ...prev].slice(0, 6);
      try {
        localStorage.setItem('kreathief_gen_history', JSON.stringify(next));
      } catch (e) {
        log.error('[MagicPanel] Failed to save generation history to localStorage', e);
      }
      return next;
    });
  }, [lastGeneratedImageUrl, prompt]);

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
        getAIErrorMessage(e),
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
      <div className="flex flex-col h-full bg-surface-dark-1">
        <div className="p-6 border-b border-white/5 space-y-6">
          <div className="bg-purple-600/10 rounded-2xl p-4 border border-purple-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                <Icons.Magic className="w-4 h-4 text-brand-600" />
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
              className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-muted-light focus:border-brand-600/50 focus:ring-1 focus:ring-brand-600/20 outline-none resize-none custom-scrollbar transition-all font-medium"
              placeholder="E.g., Turn the cat into a dog, Change the background to a beach..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest bg-black border border-white/10 text-brand-400 px-3 py-1.5 rounded-xl flex items-center gap-2 hover:bg-brand-600/10 hover:border-brand-500/30 transition-all shadow-xl"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
            >
              {isEnhancing ? (
                <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Icons.Sparkles className="w-3 h-3" />
              )}
              Enhance
            </Button>
          </div>

          <Button
            variant="primary"
            className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-purple-900/40"
            onClick={() => {
              onGenerate(negativePrompt);
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
        return 'Generate Image';
      case AppMode.EDIT:
        return 'Generate Edits';
      case AppMode.THEME:
        return 'Apply Theme';
      default:
        return 'Generate';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-1">
      {/* Top Tabs */}
      <div className="p-6 border-b border-white/5 space-y-6">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => onSetMode(AppMode.GENERATE)}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === AppMode.GENERATE ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Imagine
          </button>
          <button
            onClick={() => onSetMode(AppMode.EDIT)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === AppMode.EDIT ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Remix
          </button>
          <button
            onClick={() => onSetMode(AppMode.THEME)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === AppMode.THEME ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Theme
          </button>
        </div>

        {/* Input Area */}
        <div className="relative mb-2">
          <textarea
            data-testid="magic-prompt-input"
            className="w-full h-28 bg-surface-dark-3 border border-gray-600 rounded-xl p-3 text-sm text-white placeholder-muted-light focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none resize-none custom-scrollbar shadow-inner"
            placeholder={mode === AppMode.GENERATE ? 'A futuristic city with flying cars...' : 'Describe changes...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-3 right-3 text-[11px] font-black uppercase tracking-widest bg-black/80 backdrop-blur-md border border-white/10 text-brand-400 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-600/20 hover:border-brand-500/30 transition-all shadow-2xl"
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
          >
            {isEnhancing ? (
              <div className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Icons.Sparkles className="w-3.5 h-3.5" />
            )}
            Enhance
          </Button>
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
              className="w-full h-16 bg-surface-dark-3 border border-red-900/40 rounded-xl p-3 text-xs text-gray-300 placeholder-muted-light focus:border-red-600/50 outline-none resize-none custom-scrollbar"
              placeholder="What to exclude (e.g., blurry, ugly, watermark, text, bad anatomy)..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
            <p className="text-[9px] text-muted-light mt-1">These elements will be excluded from the generation.</p>
          </div>
        )}

        {/* Settings Block */}
        <div className="space-y-4 select-none">
          {/* Quality Row */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block">
              Quality Engine
            </label>
            <div className="flex bg-white/5 rounded-xl border border-white/5 p-1">
              <button
                onClick={() => setQuality('standard')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${quality === 'standard' ? 'bg-brand-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Turbo
              </button>
              <button
                onClick={() => setQuality('hd')}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${quality === 'hd' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                HD <Icons.Star className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Aspect Ratio Row */}
          {mode === AppMode.GENERATE && (
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block">
                AI Generation Ratio
              </label>
              <div className="flex bg-white/5 rounded-xl border border-white/5 p-1 gap-1 overflow-x-auto no-scrollbar select-none">
                {ASPECT_RATIOS.map((r) => {
                  const AspectIcon = (Icons as any)[r.icon] || Icons.Square;
                  return (
                    <button
                      key={r.label}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex-1 min-w-[54px] flex-shrink-0 whitespace-nowrap py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${aspectRatio === r.value ? 'bg-brand-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                      <AspectIcon className="w-3 h-3" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Edit Mode Upload */}
        {mode === AppMode.EDIT && (
          <div className="mb-4">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Source Image</label>
            {uploadedImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-gray-600 aspect-[2/1] bg-black/50">
                <img src={uploadedImage} className="w-full h-full object-contain" />
                <button
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => localFileInputRef.current?.click()}
                >
                  <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">
                    Replace
                  </span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => localFileInputRef.current?.click()}
                className="border border-dashed border-gray-700 bg-surface-dark-3 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
              >
                <Icons.Upload className="w-5 h-5 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-400">Click to upload reference</span>
              </div>
            )}
          </div>
        )}

        <input type="file" ref={localFileInputRef} className="hidden" accept="image/*" />

        <div className="flex items-center justify-between mb-4 bg-white/5 p-2 rounded-xl border border-white/5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
            ✨ Anti-AI-Slop & Quality Control
          </span>
          <Toggle checked={antiAiSlop} onChange={setAntiAiSlop} size="sm" ariaLabel="Anti-AI-Slop quality control" />
        </div>

        <Button
          variant="ghost"
          className="w-full py-2.5 mb-3 border border-white/10 text-gray-300 hover:text-white hover:border-brand-600/50"
          onClick={async () => {
            setIsAnalyzing(true);
            try {
              // Simulate network/AI processing delay for loading state
              await new Promise((resolve) => setTimeout(resolve, 1500));
              const result = analyzeDesign(artboards, layers);
              setDesignAnalysis(result);
              analyticsService.track('analyze_design', { score: result.score });
            } catch (e) {
              log.error('[MagicPanel] Design analysis failed', e);
              addToast('Analysis failed', 'error');
            } finally {
              setIsAnalyzing(false);
            }
          }}
          loading={isAnalyzing}
        >
          <Icons.Magic className="w-4 h-4 mr-2" />
          Analyze Design
        </Button>

        {designAnalysis && (
          <div className="mb-4 p-4 bg-surface-dark-3 rounded-xl border border-white/5 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Design Score</span>
              <span className="text-lg font-black text-brand-600">{designAnalysis.score}/100</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[9px] text-gray-500 uppercase">Layout</div>
                <div className="text-xs font-bold text-white">{designAnalysis.layout.score}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[9px] text-gray-500 uppercase">Type</div>
                <div className="text-xs font-bold text-white">{designAnalysis.typography.score}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[9px] text-gray-500 uppercase">Color</div>
                <div className="text-xs font-bold text-white">{designAnalysis.color.score}</div>
              </div>
            </div>
            {designAnalysis.suggestions.length > 0 && (
              <div className="space-y-1 pt-1">
                {designAnalysis.suggestions.map((s, i) => (
                  <div key={i} className="text-[10px] text-gray-400 flex items-start gap-1.5">
                    <span className="text-brand-600 mt-0.5">•</span>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Button
          variant="primary"
          className="w-full py-3 shadow-lg shadow-purple-900/20"
          onClick={() => {
            const finalPrompt = antiAiSlop
              ? `${prompt} (Anti-AI-Slop: avoid flat vectors, uncurated purple/blue gradients, generic 3D icons, or generic digital illustrations. Use premium editorial contrast, high-fidelity real-world textures, and high-contrast professional design tokens.)`
              : prompt;
            useStore.getState().setPrompt(finalPrompt);
            onGenerate(negativePrompt);
            analyticsService.trackGeneration(finalPrompt, mode);
          }}
          loading={isProcessing}
          disabled={!prompt.trim() || (mode === AppMode.EDIT && !uploadedImage)}
        >
          <Icons.Magic className="w-4 h-4 mr-2" />
          {getButtonLabel()}
        </Button>

        {isGenerating && (
          <div className="space-y-3 pt-4 animate-pulse">
            <div className="h-3 bg-white/5 rounded w-1/4" />
            <div className="aspect-video bg-white/5 rounded-2xl" />
            <div className="flex gap-2">
              <div className="h-8 bg-white/5 rounded-lg flex-1" />
              <div className="h-8 bg-white/5 rounded-lg flex-1" />
              <div className="h-8 bg-white/5 rounded-lg flex-1" />
            </div>
          </div>
        )}
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
                className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-gray-700 hover:border-brand-600 transition-all group"
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
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-t border-white/5">
        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 sticky top-0 bg-surface-dark-1 py-2 z-10">
          Curated Styles
        </h4>
        <div className="grid grid-cols-2 gap-3 pb-10">
          {STYLE_PRESETS.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setPrompt(prompt ? `${prompt}, ${item.style}` : item.style);
                analyticsService.track('generate_image', { mode: 'apply_style', style: item.name });
              }}
              className="group relative h-20 rounded-2xl overflow-hidden hover:scale-[1.05] transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95"
              aria-label={`Apply ${item.name} style preset`}
            >
              {/* Gradient background as visual preview */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80`} />
              {/* Subtle texture overlay */}
              <div
                className="absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />
              <div className="absolute inset-0 flex flex-col items-start justify-end p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <div className="flex items-center gap-2">
                  {(() => {
                    const PresetIcon = (Icons as any)[item.icon] || Icons.Magic;
                    return (
                      <PresetIcon className="w-5 h-5 text-white/90 transform group-hover:scale-110 transition-transform" />
                    );
                  })()}
                  <span className="text-[13px] font-black text-white tracking-tight drop-shadow-lg">{item.name}</span>
                </div>
              </div>
              <div className="absolute inset-0 border border-white/10 group-hover:border-white/20 rounded-2xl transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default function MagicPanelWrapped(props: React.ComponentProps<typeof MagicPanel>) {
  return (
    <PanelErrorBoundary panelName="Magic">
      <MagicPanel {...props} />
    </PanelErrorBoundary>
  );
}
