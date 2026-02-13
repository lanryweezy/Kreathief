
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { TextLayer } from '../../types';
import * as geminiService from '../../services/geminiService';

interface TextPanelProps {
  onAddText: (style: Partial<TextLayer>) => void;
  onHoverFont?: (fontFamily: string | null) => void;
}

import { FONT_FAMILIES } from '../../constants';

export const TextPanel: React.FC<TextPanelProps> = ({ onAddText, onHoverFont }) => {
  const [fontSearch, setFontSearch] = useState('');
  const [textGenPrompt, setTextGenPrompt] = useState('');
  const [textGenResults, setTextGenResults] = useState<string[]>([]);
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  const handleMagicText = async () => {
    if (!textGenPrompt.trim()) return;
    setIsGeneratingText(true);
    try {
      const results = await geminiService.generateTextOptions(textGenPrompt);
      setTextGenResults(results);
    } catch (e) {
      console.error(e);
      alert("Failed to generate text options");
    } finally {
      setIsGeneratingText(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-y-auto custom-scrollbar">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Icons.Text className="w-5 h-5 text-[#7d2ae8]" />
        Typography
      </h3>

      {/* Magic Writer */}
      <div className="mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-lg border border-purple-500/30">
        <h4 className="text-xs font-bold text-purple-200 mb-2 flex items-center gap-2">
          <Icons.Magic className="w-3 h-3" />
          Magic Writer
        </h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Topic: e.g. Coffee Sale"
            className="flex-1 bg-[#0e1318] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            value={textGenPrompt}
            onChange={(e) => setTextGenPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleMagicText()}
          />
          <button
            onClick={handleMagicText}
            disabled={isGeneratingText || !textGenPrompt.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded disabled:opacity-50 transition-colors"
          >
            {isGeneratingText ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Icons.Zap className="w-4 h-4" />}
          </button>
        </div>
        {textGenResults.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 max-h-32 overflow-y-auto custom-scrollbar">
            {textGenResults.map((res, i) => (
              <button
                key={i}
                onClick={() => onAddText({ text: res, fontSize: 32, fontWeight: 'bold' })}
                className="bg-[#252627] hover:bg-purple-500 hover:text-white border border-gray-600 text-gray-300 text-[10px] px-2 py-1.5 rounded transition-colors text-left"
              >
                {res}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">

        {/* Font Pairs Section */}
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Font Pairings</h4>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => {
              onAddText({ text: 'MODERN', fontSize: 48, fontWeight: '900', fontFamily: 'Montserrat', y: 300 });
              setTimeout(() => onAddText({ text: 'Minimalist Design', fontSize: 24, fontWeight: '400', fontFamily: 'Inter', y: 360, opacity: 0.8 }), 100);
            }}
            className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 hover:bg-[#252627] hover:border-white transition-all text-left group"
          >
            <div className="font-[Montserrat] font-black text-xl text-white">MODERN</div>
            <div className="font-[Inter] text-xs text-gray-400">Minimalist Design</div>
          </button>

          <button
            onClick={() => {
              onAddText({ text: 'Editorial', fontSize: 48, fontWeight: 'bold', fontFamily: 'Playfair Display', fontStyle: 'italic', y: 300 });
              setTimeout(() => onAddText({ text: 'New Collection 2024', fontSize: 16, fontWeight: '400', fontFamily: 'Lato', y: 360, letterSpacing: 2 }), 100);
            }}
            className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 hover:bg-[#252627] hover:border-white transition-all text-left group"
          >
            <div className="font-[Playfair_Display] font-bold italic text-xl text-white">Editorial</div>
            <div className="font-[Lato] text-[10px] uppercase tracking-widest text-gray-400 mt-1">New Collection</div>
          </button>

          <button
            onClick={() => {
              onAddText({ text: 'STREET', fontSize: 52, fontWeight: '900', fontFamily: 'Oswald', y: 300, color: '#ffde59' });
              setTimeout(() => onAddText({ text: 'URBAN CULTURE', fontSize: 28, fontWeight: '700', fontFamily: 'Roboto Condensed', y: 360, color: '#ffffff' }), 100);
            }}
            className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 hover:bg-[#252627] hover:border-white transition-all text-left group"
          >
            <div className="font-[Oswald] font-black text-xl text-[#ffde59]">STREET</div>
            <div className="font-[Roboto_Condensed] text-xs font-bold text-gray-400">URBAN CULTURE</div>
          </button>

          <button
            onClick={() => {
              onAddText({ text: 'Script', fontSize: 56, fontWeight: '400', fontFamily: 'Great Vibes', y: 300, color: '#fda4af' });
              setTimeout(() => onAddText({ text: 'Handwritten vibes', fontSize: 20, fontWeight: '400', fontFamily: 'Caveat', y: 370, color: '#fff' }), 100);
            }}
            className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 hover:bg-[#252627] hover:border-white transition-all text-left group"
          >
            <div className="font-[Great_Vibes] text-2xl text-pink-300">Script</div>
            <div className="font-[Caveat] text-sm text-gray-400">Handwritten vibes</div>
          </button>
        </div>

        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Styles</h4>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => onAddText({ text: 'NEON', fontSize: 60, fontWeight: 'bold', color: '#0ff', fontFamily: 'Montserrat', shadow: { color: '#0ff', blur: 20, offsetX: 0, offsetY: 0 } })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-cyan-500 group transition-all relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
            <span className="font-bold text-2xl text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] group-hover:scale-110 transition-transform">NEON</span>
          </button>

          <button
            onClick={() => onAddText({ text: 'RETRO', fontSize: 50, fontWeight: 'bold', color: '#ff0099', fontFamily: 'Righteous', shadow: { color: '#00ffff', blur: 0, offsetX: 3, offsetY: 3 } })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-pink-500 group transition-all relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors"></div>
            <span className="font-display font-bold text-2xl text-pink-500 drop-shadow-[2px_2px_0px_#0ff] group-hover:scale-110 transition-transform">RETRO</span>
          </button>

          <button
            onClick={() => onAddText({ text: 'HOLLOW', fontSize: 50, fontWeight: '900', color: '#ffffff', styleType: 'hollow', fontFamily: 'Anton' })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-white group transition-all"
          >
            <span className="font-bold text-2xl text-transparent [-webkit-text-stroke:1px_white] group-hover:scale-110 transition-transform">HOLLOW</span>
          </button>

          <button
            onClick={() => onAddText({ text: 'GLITCH', fontSize: 50, fontWeight: 'bold', color: '#fff', fontFamily: 'Rubik Glitch', shadow: { color: '#f00', blur: 1, offsetX: -2, offsetY: 0 } })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-red-500 group transition-all relative overflow-hidden"
          >
            <span className="font-mono font-bold text-xl text-white tracking-widest group-hover:scale-110 transition-transform relative">
              GLITCH
            </span>
          </button>

          <button
            onClick={() => onAddText({ text: 'Gradient', fontSize: 50, fontWeight: 'bold', gradient: { enabled: true, startColor: '#ff00cc', endColor: '#333399', angle: 45 }, fontFamily: 'Poppins' })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-purple-500 group transition-all"
          >
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#ff00cc] to-[#333399] group-hover:scale-110 transition-transform">Gradient</span>
          </button>

          <button
            onClick={() => onAddText({ text: 'ECHO', fontSize: 50, fontWeight: 'bold', color: '#ffd700', styleType: 'echo', fontFamily: 'Kanit' })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-yellow-500 group transition-all"
          >
            <div className="relative group-hover:scale-110 transition-transform">
              <span className="font-bold text-xl text-yellow-400 absolute top-0 left-0 opacity-30 translate-x-2 translate-y-2">ECHO</span>
              <span className="font-bold text-xl text-yellow-400 relative z-10">ECHO</span>
            </div>
          </button>

          <button
            onClick={() => onAddText({ text: 'ARCH', fontSize: 50, fontWeight: '900', color: '#a855f7', fontFamily: 'Inter', warpStyle: 'arc', curve: 80 })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-purple-500 group transition-all"
          >
            <Icons.Curve className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="ml-2 font-bold text-white">ARCH</span>
          </button>

          <button
            onClick={() => onAddText({ text: 'WAVY', fontSize: 50, fontWeight: '900', color: '#3b82f6', fontFamily: 'Inter', warpStyle: 'flag', curve: 50 })}
            className="h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-gray-800 hover:border-blue-500 group transition-all"
          >
            <Icons.Wave className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="ml-2 font-bold text-white">WAVY</span>
          </button>
        </div>

        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Basics</h4>
        <div className="space-y-2 pb-10">
          <button
            onClick={() => onAddText({ text: 'Heading', fontSize: 64, fontWeight: '800', fontFamily: 'Inter' })}
            className="w-full text-left p-4 bg-[#1e1e1e] border border-gray-700 rounded-lg hover:bg-[#252627] hover:border-white transition-all group"
          >
            <span className="text-3xl font-bold text-white block group-hover:translate-x-1 transition-transform">Heading</span>
          </button>
          <button
            onClick={() => onAddText({ text: 'Subheading', fontSize: 32, fontWeight: '600', fontFamily: 'Inter' })}
            className="w-full text-left p-3 bg-[#1e1e1e] border border-gray-700 rounded-lg hover:bg-[#252627] hover:border-gray-400 transition-all group"
          >
            <span className="text-xl font-semibold text-gray-200 block group-hover:translate-x-1 transition-transform">Subheading</span>
          </button>
          <button
            onClick={() => onAddText({ text: 'Body Text', fontSize: 16, fontWeight: '400', fontFamily: 'Inter' })}
            className="w-full text-left p-3 bg-[#1e1e1e] border border-gray-700 rounded-lg hover:bg-[#252627] hover:border-gray-500 transition-all group"
          >
            <span className="text-sm font-normal text-gray-400 block group-hover:translate-x-1 transition-transform">Body text goes here</span>
          </button>
        </div>

        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Fonts</h4>
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search fonts..."
            className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#7d2ae8]"
            value={fontSearch}
            onChange={(e) => setFontSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 pb-20">
          {FONT_FAMILIES.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase())).map(font => (
            <button
              key={font}
              onClick={() => onAddText({ text: 'New Text', fontFamily: font, fontSize: 32 })}
              onMouseEnter={() => onHoverFont && onHoverFont(font)}
              onMouseLeave={() => onHoverFont && onHoverFont(null)}
              className="w-full text-left p-3 bg-[#1e1e1e] border border-gray-700 rounded-lg hover:border-[#7d2ae8] hover:bg-[#252627] transition-all group overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-2xl text-gray-500 shrink-0" style={{ fontFamily: font }}>Aa</span>
                  <span className="text-sm text-white truncate">{font}</span>
                </div>
                <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 uppercase tracking-tighter shrink-0">Add</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
