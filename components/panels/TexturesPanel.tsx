import { log } from '../../utils/log';

import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { heavyService } from '../../services/heavyService';
import { PanelErrorBoundary } from './PanelErrorBoundary';

interface TexturesPanelProps {
  onRemoveTexture: () => void;
  currentTexture: string | undefined;
}

export const TexturesPanel: React.FC<TexturesPanelProps> = ({ onRemoveTexture, currentTexture }) => {
  const applyTexture = useStore((state) => state.applyTexture);
  const setTextureIntensity = useStore((state) => state.setTextureIntensity);
  const textureIntensity = useStore((state) => state.textureIntensity);
  const canvasFilters = useStore((state) => state.canvasFilters);
  const setCanvasFilters = useStore((state: any) => state.setCanvasFilters);
  const canvasSize = useStore((state) => state.canvasSize);

  const [intensity, setIntensity] = useState(textureIntensity);
  const [noiseLevel, setNoiseLevel] = useState(canvasFilters.noise || 0);
  const [grainScale, setGrainScale] = useState(canvasFilters.grainScale || 50);
  const [isGeneratingGrain, setIsGeneratingGrain] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SVG Presets
  const PRESETS = [
    {
      name: 'Vintage Paper',
      url: 'https://images.unsplash.com/photo-1586075010633-244416955a1b?auto=format&fit=crop&w=400&q=80',
      preview: 'bg-[#f2ebd4]',
    },
    {
      name: 'White Marble',
      url: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=400&q=80',
      preview: 'bg-stone-200',
    },
    {
      name: 'Dark Marble',
      url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80',
      preview: 'bg-stone-900',
    },
    {
      name: 'Rustic Wood',
      url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80',
      preview: 'bg-amber-900',
    },
    {
      name: 'Gold Foil',
      url: 'https://images.unsplash.com/photo-1502220389334-a63e8df3111f?auto=format&fit=crop&w=400&q=80',
      preview: 'bg-yellow-600',
    },
    {
      name: 'Holographic',
      url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
      preview: 'bg-indigo-400',
    },
    {
      name: 'Crumpled Paper',
      url: 'https://images.unsplash.com/photo-1614036417651-efe591214972?auto=format&fit=crop&w=400&q=80',
      preview: 'bg-gray-300',
    },
  ];

  const applyPreset = (url: string, currentIntensity: number) => {
    applyTexture(url, currentIntensity);
  };

  const handleIntensityChange = (val: number) => {
    setIntensity(val);
    setTextureIntensity(val);
  };

  const handleNoiseChange = async (val: number) => {
    setNoiseLevel(val);
    if (val === 0) {
      setCanvasFilters({ ...canvasFilters, noise: 0, overlayTexture: undefined });
      return;
    }

    setIsGeneratingGrain(true);
    try {
      const grainUrl = await heavyService.generateGrain(
        canvasSize.width,
        canvasSize.height,
        val,
        (105 - grainScale) / 10
      );
      setCanvasFilters({
        ...canvasFilters,
        noise: val,
        grainScale,
        overlayTexture: grainUrl,
      });
    } catch (e) {
      log.error('Grain generation failed', e);
    } finally {
      setIsGeneratingGrain(false);
    }
  };

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (activeTemplate) {
      applyPreset(activeTemplate, intensity);
    }
  }, [intensity, activeTemplate]);

  useEffect(() => {
    setIntensity(textureIntensity);
  }, [textureIntensity]);

  useEffect(() => {
    setNoiseLevel(canvasFilters.noise || 0);
  }, [canvasFilters.noise]);

  useEffect(() => {
    setGrainScale(canvasFilters.grainScale || 50);
  }, [canvasFilters.grainScale]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      applyTexture(url, intensity);
      setActiveTemplate(null);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-[#13161a] overflow-y-auto no-scrollbar">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 shrink-0">
        <Icons.Texture className="w-5 h-5 text-brand-600" />
        Textures & Grain
      </h3>

      {/* Organic Grain Engine */}
      <div className="mb-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-4 rounded-2xl border border-purple-500/20 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em]">Procedural Grain</h4>
          {isGeneratingGrain && (
            <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
              <span>Intensity</span>
              <span className="text-white">{noiseLevel}%</span>
            </div>
            <input
              type="range"
              aria-label="Intensity"
              min="0"
              max="100"
              step="1"
              value={noiseLevel}
              onChange={(e) => handleNoiseChange(parseInt(e.target.value))}
              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-purple-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
              <span>Scale</span>
              <span className="text-white">{grainScale}%</span>
            </div>
            <input
              type="range"
              aria-label="Scale"
              min="10"
              max="100"
              step="5"
              value={grainScale}
              onChange={(e) => {
                setGrainScale(parseInt(e.target.value));
                if (noiseLevel > 0) {
                  handleNoiseChange(noiseLevel);
                }
              }}
              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {(['overlay', 'multiply', 'soft-light'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCanvasFilters({ ...canvasFilters, textureBlendMode: mode })}
                className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${canvasFilters.textureBlendMode === mode ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/20 border-white/5 text-gray-500 hover:text-gray-300'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 shrink-0">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Material Overlays</h4>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-4 hover:border-brand-600 hover:bg-brand-600/5 cursor-pointer transition-all group">
          <Icons.Upload className="w-6 h-6 text-gray-500 mb-2 group-hover:text-brand-600" />
          <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-tighter">
            Upload Texture
          </span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Intensity Slider */}
      <div className="mb-4 bg-surface-dark-3 p-3 rounded-xl border border-gray-700 shrink-0">
        <div className="flex justify-between mb-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Material Opacity</label>
          <span className="text-[10px] font-mono text-purple-400">{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          aria-label="Material Opacity"
          min="0.05"
          max="1"
          step="0.05"
          value={intensity}
          onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
          disabled={!currentTexture}
          className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600 ${!currentTexture ? 'opacity-30 cursor-not-allowed' : ''}`}
        />
      </div>

      {currentTexture && (
        <button
          onClick={() => {
            onRemoveTexture();
            setActiveTemplate(null);
          }}
          className="mb-4 w-full py-2 bg-red-900/10 text-red-500 border border-red-900/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-900/20 transition-all"
        >
          Clear Overlay
        </button>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((tex, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveTemplate(tex.url);
                applyPreset(tex.url, intensity);
              }}
              className={`relative aspect-square rounded-xl border-2 overflow-hidden group transition-all ${activeTemplate === tex.url ? 'border-brand-600 ring-4 ring-brand-600/10' : 'border-gray-800 hover:border-gray-600 shadow-lg'}`}
            >
              <div className={`absolute inset-0 ${tex.preview} opacity-20`}></div>
              <img
                src={tex.url}
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
                alt={tex.name}
              />
              <div className="absolute inset-0 flex items-end p-2.5 bg-gradient-to-t from-black/90 to-transparent">
                <span className="text-[9px] font-black text-white uppercase tracking-tighter">{tex.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function TexturesPanelWrapped(props: React.ComponentProps<typeof TexturesPanel>) {
  return (
    <PanelErrorBoundary panelName="Textures">
      <TexturesPanel {...props} />
    </PanelErrorBoundary>
  );
}
