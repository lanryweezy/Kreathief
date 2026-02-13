
import React, { useState, useRef } from 'react';
import { Icons } from '../../constants';
import * as geminiService from '../../services/geminiService';

interface TexturesPanelProps {
  onApplyTexture: (textureUrl: string) => void;
  currentTexture?: string;
  onRemoveTexture: () => void;
}

export const TexturesPanel: React.FC<TexturesPanelProps> = ({
  onApplyTexture,
  currentTexture,
  onRemoveTexture
}) => {
  const [patternPrompt, setPatternPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [intensity, setIntensity] = useState(0.3); // Default opacity
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SVG Presets with placeholder logic for replacements
  const PRESETS = [
    {
      name: "Noise",
      url: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='OPACITY_PLACEHOLDER'/%3E%3C/svg%3E",
      preview: "bg-gray-500"
    },
    {
      name: "Paper",
      url: "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3CfeDiffuseLighting lighting-color='%23f2ebd4' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='OPACITY_PLACEHOLDER'/%3E%3C/svg%3E",
      preview: "bg-[#f2ebd4]"
    },
    {
      name: "Canvas",
      url: "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='canvas'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23canvas)' opacity='OPACITY_PLACEHOLDER'/%3E%3C/svg%3E",
      preview: "bg-stone-300"
    },
    {
      name: "Grid",
      url: "data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='black' stroke-width='1' opacity='OPACITY_PLACEHOLDER'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E",
      preview: "bg-white"
    },
    {
      name: "Lots of Dots",
      url: "data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='dots' x='0' y='0' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23000' opacity='OPACITY_PLACEHOLDER'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23dots)'/%3E%3C/svg%3E",
      preview: "bg-gray-200"
    },
    {
      name: "Diagonal",
      url: "data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='diagonal' width='10' height='10' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'%3E%3Cline x1='0' y1='0' x2='0' y2='10' stroke='%23000' stroke-width='4' opacity='OPACITY_PLACEHOLDER'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23diagonal)'/%3E%3C/svg%3E",
      preview: "bg-gray-300"
    },
    {
      name: "Grunge",
      url: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grunge'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.05' numOctaves='2' result='turbulence'/%3E%3CfeDisplacementMap in2='turbulence' in='SourceGraphic' scale='50' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23000' opacity='OPACITY_PLACEHOLDER' filter='url(%23grunge)'/%3E%3C/svg%3E",
      preview: "bg-zinc-800"
    },
    {
      name: "Halftone",
      url: "data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='halftone' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='5' cy='5' r='2' fill='%23000' opacity='OPACITY_PLACEHOLDER'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23halftone)'/%3E%3C/svg%3E",
      preview: "bg-white"
    },
    {
      name: "Waves",
      url: "data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='waves' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 10 Q 5 20 10 10 T 20 10' fill='none' stroke='%23000' stroke-width='1' opacity='OPACITY_PLACEHOLDER'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23waves)'/%3E%3C/svg%3E",
      preview: "bg-blue-100"
    },
    {
      name: "Checks",
      url: "data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='checks' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Crect x='0' y='0' width='10' height='10' fill='%23000' opacity='OPACITY_PLACEHOLDER'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23000' opacity='OPACITY_PLACEHOLDER'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23checks)'/%3E%3C/svg%3E",
      preview: "bg-gray-400"
    }
  ];

  const applyPreset = (urlTemplate: string, opacity: number = 0.3) => {
    const finalUrl = urlTemplate.replace(/OPACITY_PLACEHOLDER/g, opacity.toString());
    onApplyTexture(finalUrl);
  };

  const handleIntensityChange = (val: number) => {
    setIntensity(val);
    // Try to find if currently selected texture matches a preset, and re-apply with new opacity
    // This is a bit tricky since we only have the final URL. 
    // For now, we will just apply the intensity to the *next* click, 
    // OR we can store the "active template" in state.
  };

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const handlePresetClick = (templateUrl: string) => {
    setActiveTemplate(templateUrl);
    applyPreset(templateUrl, intensity);
  };

  // Re-apply when intensity changes if we have an active template
  React.useEffect(() => {
    if (activeTemplate) {
      applyPreset(activeTemplate, intensity);
    }
  }, [intensity]);

  const handleGeneratePattern = async () => {
    if (!patternPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const patternUrl = await geminiService.generatePattern(patternPrompt);
      onApplyTexture(patternUrl);
      setPatternPrompt('');
      setActiveTemplate(null); // Clear active template since this is custom
    } catch (e) {
      console.error(e);
      alert("Failed to generate pattern");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onApplyTexture(url);
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

      {/* Pattern Gen */}
      <div className="mb-6 p-3 bg-gradient-to-r from-pink-900/20 to-rose-900/20 border border-pink-500/30 rounded-lg">
        <h4 className="text-xs font-bold text-pink-200 mb-2 flex items-center gap-2">
          <Icons.Magic className="w-3 h-3" />
          AI Pattern Generator
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="E.g. cute sushi, geo lines..."
            className="flex-1 bg-[#0e1318] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
            value={patternPrompt}
            onChange={(e) => setPatternPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGeneratePattern()}
          />
          <button
            onClick={handleGeneratePattern}
            disabled={isGenerating || !patternPrompt.trim()}
            className="bg-pink-600 hover:bg-pink-500 text-white p-1.5 rounded disabled:opacity-50 transition-colors"
          >
            {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Icons.Zap className="w-4 h-4" />}
          </button>
        </div>
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
          disabled={!activeTemplate}
          className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8] ${!activeTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="mb-4">
        {currentTexture && (
          <button
            onClick={() => { onRemoveTexture(); setActiveTemplate(null); }}
            className="w-full py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded text-xs font-bold hover:bg-red-900/40 transition-colors"
          >
            Remove Texture
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
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
              onClick={() => handlePresetClick(tex.url)}
              className={`relative aspect-square rounded-lg border-2 overflow-hidden group transition-all ${activeTemplate === tex.url ? 'border-[#7d2ae8] ring-2 ring-[#7d2ae8]/20' : 'border-gray-700 hover:border-gray-500'}`}
            >
              <div className={`absolute inset-0 ${tex.preview}`}></div>
              {/* Show preview with default opacity for visibility */}
              <img src={tex.url.replace('OPACITY_PLACEHOLDER', '0.5')} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
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
