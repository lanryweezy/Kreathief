import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

interface TexturesPanelProps {
}

export const TexturesPanel: React.FC<TexturesPanelProps> = () => {
  const applyTexture = useStore(state => state.applyTexture);
  const removeTexture = useStore(state => state.removeTexture);
  const setTextureIntensity = useStore(state => state.setTextureIntensity);
  const textureIntensity = useStore(state => state.textureIntensity);

  const selectedLayerIds = useStore(state => state.selectedLayerIds);
  const layers = useStore(state => state.layers);

  const currentLayer = layers.find(l => selectedLayerIds.includes(l.id));
  const currentTexture = (currentLayer?.type === 'text') ? currentLayer.decorations?.textures?.[0] : null;

  const [intensity, setIntensity] = useState(textureIntensity);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SVG Presets with placeholder logic for replacements
  const PRESETS = [
    {
      name: "Vintage Paper",
      url: "https://images.unsplash.com/photo-1586075010633-244416955a1b?auto=format&fit=crop&w=400&q=80",
      preview: "bg-[#f2ebd4]"
    },
    {
      name: "White Marble",
      url: "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=400&q=80",
      preview: "bg-stone-200"
    },
    {
      name: "Dark Marble",
      url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80",
      preview: "bg-stone-900"
    },
    {
      name: "Rustic Wood",
      url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80",
      preview: "bg-amber-900"
    },
    {
      name: "Gold Foil",
      url: "https://images.unsplash.com/photo-1502220389334-a63e8df3111f?auto=format&fit=crop&w=400&q=80",
      preview: "bg-yellow-600"
    },
    {
      name: "Holographic",
      url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80",
      preview: "bg-indigo-400"
    },
    {
      name: "Brushed Metal",
      url: "https://images.unsplash.com/photo-1530514104649-e59ec601dff0?auto=format&fit=crop&w=400&q=80",
      preview: "bg-zinc-400"
    },
    {
      name: "Carbon Fiber",
      url: "https://images.unsplash.com/photo-1550684847-75bdda21cc95?auto=format&fit=crop&w=400&q=80",
      preview: "bg-zinc-900"
    },
    {
      name: "Water Color",
      url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80",
      preview: "bg-blue-300"
    },
    {
      name: "Crumpled Paper",
      url: "https://images.unsplash.com/photo-1614036417651-efe591214972?auto=format&fit=crop&w=400&q=80",
      preview: "bg-gray-300"
    }
  ];

  const applyPreset = (url: string, currentIntensity: number) => {
    applyTexture(url, currentIntensity);
  };

  const handleIntensityChange = (val: number) => {
    setIntensity(val);
    setTextureIntensity(val);
  };

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const handlePresetClick = (templateUrl: string) => {
    setActiveTemplate(templateUrl);
    applyPreset(templateUrl, intensity);
  };

  // Re-apply when intensity changes if we have an active template
  useEffect(() => {
    if (activeTemplate) {
      applyPreset(activeTemplate, intensity);
    }
  }, [intensity, activeTemplate]);

  // Update local intensity state when store's textureIntensity changes
  useEffect(() => {
    setIntensity(textureIntensity);
  }, [textureIntensity]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      applyTexture(url, intensity);
      setActiveTemplate(null);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full p-4 bg-[#13161a]">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Texture className="w-5 h-5 text-[#7d2ae8]" />
        Textures & Patterns
      </h3>

      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Upload Custom Texture</h4>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-[#7d2ae8] hover:bg-[#7d2ae8]/5 cursor-pointer transition-all group">
          <Icons.Upload className="w-8 h-8 text-gray-500 mb-2 group-hover:text-[#7d2ae8]" />
          <span className="text-xs font-bold text-gray-400 group-hover:text-white">Click to upload</span>
          <span className="text-[10px] text-gray-600 mt-1">PNG, JPG or SVG</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Intensity Slider */}
      <div className="mb-4 bg-[#1e1e1e] p-3 rounded-lg border border-gray-700">
        <div className="flex justify-between mb-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Intensity / Opacity</label>
          <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={intensity}
          onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
          disabled={!currentTexture}
          className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8] ${!currentTexture ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="mb-4">
        {currentTexture && (
          <button
            onClick={() => { removeTexture(); setActiveTemplate(null); }}
            className="w-full py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded text-xs font-bold hover:bg-red-900/40 transition-colors"
          >
            Remove Texture
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-[#7d2ae8] transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-[#7d2ae8] bg-[#1e1e1e]"
          >
            <Icons.Plus className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Upload</span>
          </button>

          {PRESETS.map((tex, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveTemplate(tex.url);
                applyTexture(tex.url);
              }}
              className={`relative aspect-square rounded-lg border-2 overflow-hidden group transition-all ${activeTemplate === tex.url ? 'border-[#7d2ae8] ring-2 ring-[#7d2ae8]/20' : 'border-gray-700 hover:border-gray-500'}`}
            >
              <div className={`absolute inset-0 ${tex.preview}`}></div>
              <img src={tex.url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={tex.name} />
              <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{tex.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TexturesPanel;
