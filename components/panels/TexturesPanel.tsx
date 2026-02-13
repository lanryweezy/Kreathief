
import React, { useState } from 'react';
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

  // Using high-quality SVG data URIs for textures to avoid external deps and CORS issues
  const textures = [
    {
      name: "Noise",
      url: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E",
      preview: "bg-gray-400"
    },
    {
      name: "Paper",
      url: "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3CfeDiffuseLighting lighting-color='%23f2ebd4' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.4'/%3E%3C/svg%3E",
      preview: "bg-[#f2ebd4]"
    },
    {
      name: "Grunge",
      url: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grunge'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.05' numOctaves='2' result='turbulence'/%3E%3CfeDisplacementMap in2='turbulence' in='SourceGraphic' scale='50' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23000' opacity='0.2' filter='url(%23grunge)'/%3E%3C/svg%3E",
      preview: "bg-gray-600"
    },
    {
      name: "Halftone",
      url: "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='halftone' x='0' y='0' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='5' cy='5' r='2' fill='%23000' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23halftone)'/%3E%3C/svg%3E",
      preview: "bg-white"
    },
    {
      name: "Lines",
      url: "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='lines' x='0' y='0' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 10L10 0M-2 2L2 -2M8 12L12 8' stroke='%23000' stroke-width='1' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23lines)'/%3E%3C/svg%3E",
      preview: "bg-white"
    },
    {
      name: "Dust",
      url: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E",
      preview: "bg-gray-500"
    }
  ];

  const handleGeneratePattern = async () => {
    if (!patternPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const patternUrl = await geminiService.generatePattern(patternPrompt);
      onApplyTexture(patternUrl);
      setPatternPrompt('');
    } catch (e) {
      console.error(e);
      alert("Failed to generate pattern");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
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

      <div className="mb-4">
        <p className="text-[11px] text-gray-400 mb-2">Apply overlay to design.</p>
        {currentTexture && (
          <button
            onClick={onRemoveTexture}
            className="w-full py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded text-xs font-bold hover:bg-red-900/40 transition-colors"
          >
            Remove Texture
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
        {textures.map((tex, i) => (
          <button
            key={i}
            onClick={() => onApplyTexture(tex.url)}
            className={`relative aspect-square rounded-lg border-2 overflow-hidden group transition-all ${currentTexture === tex.url ? 'border-[#7d2ae8] ring-2 ring-[#7d2ae8]/20' : 'border-gray-700 hover:border-gray-500'}`}
          >
            <div className={`absolute inset-0 ${tex.preview}`}></div>
            <img src={tex.url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{tex.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; export default TexturesPanel;
