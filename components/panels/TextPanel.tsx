
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, FONT_FAMILIES } from '../../constants';
import { TextLayer } from '../../types';
import * as geminiService from '../../services/geminiService';
import { loadFont, registerCustomFont } from '../../services/FontLoader';
import { useStore } from '../../store/useStore';

const FONT_CATEGORIES = {
  'Sans Serif': ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Oswald', 'Quicksand', 'Nunito', 'Ubuntu', 'Rubik', 'Mukta', 'Kanit', 'Barlow', 'Heebo', 'Work Sans', 'Dosis', 'PT Sans', 'Source Sans 3', 'Public Sans', 'Manrope', 'Cairo', 'Hind', 'Oxygen', 'Sarabun', 'Signika', 'Teko', 'Titillium Web', 'Varela Round', 'Josefin Sans', 'Exo 2', 'Arimo', 'Asap', 'Cabin', 'Catamaran', 'Space Grotesk', 'DM Sans'],
  'Serif': ['Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Noto Serif', 'Libre Baskerville', 'Cormorant Garamond', 'Crimson Text', 'EB Garamond', 'Slabo 27px', 'Vollkorn', 'Zilla Slab', 'Bitter'],
  'Display': ['Bebas Neue', 'Anton', 'Lobster', 'Abril Fatface', 'Alfa Slab One', 'Bangers', 'Bungee', 'Cinzel', 'Comfortaa', 'Creepster', 'Fjalla One', 'Fredericka the Great', 'Monoton', 'Righteous', 'Russo One', 'Special Elite', 'Sriracha', 'Staatliches', 'Yellowtail', 'Acme'],
  'Handwriting': ['Caveat', 'Pacifico', 'Dancing Script', 'Indie Flower', 'Shadows Into Light', 'Amatic SC', 'Gloria Hallelujah', 'Great Vibes', 'Permanent Marker', 'Sacramenta', 'Satisfy'],
  'Monospace': ['Roboto Mono', 'Space Mono', 'Source Code Pro', 'IBM Plex Mono', 'Inconsolata']
};

// Flatten relevant fonts for "All" tab but prioritize popular ones
const ALL_FONTS = FONT_FAMILIES;

const FontPreviewItem = ({
  font,
  text = "Typography",
  onClick,
  onHover
}: {
  font: string,
  text?: string,
  onClick: () => void,
  onHover: (f: string | null) => void
}) => {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadFont(font).then(() => setLoaded(true));
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [font]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => onHover(font)}
      onMouseLeave={() => onHover(null)}
      className="w-full text-left p-3 bg-[#1e1e1e] border border-gray-700/50 rounded-lg hover:border-[#7d2ae8] hover:bg-[#252627] transition-all group overflow-hidden relative"
    >
      <div className="flex justify-between items-center relative z-10">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span
            className="text-xl text-white truncate transition-opacity duration-500"
            style={{ fontFamily: loaded ? font : 'inherit', opacity: loaded ? 1 : 0.5 }}
          >
            {text}
          </span>
          <span className="text-[10px] text-gray-500">{font}</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-[#7d2ae8]/20 text-[#7d2ae8] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
          <Icons.Plus className="w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  );
};

export const TextPanel: React.FC = () => {
  const addTextLayer = useStore(state => state.addTextLayer);
  const setPreviewFontFamily = useStore(state => state.setPreviewFontFamily);
  const customFonts = useStore(state => state.customFonts);
  const addCustomFont = useStore(state => state.addCustomFont);

  const [fontSearch, setFontSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  const [textGenPrompt, setTextGenPrompt] = useState('');
  const [textGenResults, setTextGenResults] = useState<string[]>([]);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const fontInputRef = useRef<HTMLInputElement>(null);

  // Load recent fonts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kreathief_recent_fonts');
      if (saved) {
        setRecentFonts(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recent fonts", e);
    }
  }, []);

  const handleAddText = (style: Partial<TextLayer>) => {
    addTextLayer(style);
    if (style.fontFamily) {
      setRecentFonts(prev => {
        // Remove if exists to bubble to top
        const filtered = prev.filter(f => f !== style.fontFamily);
        const updated = [style.fontFamily!, ...filtered].slice(0, 5);
        localStorage.setItem('kreathief_recent_fonts', JSON.stringify(updated));
        return updated;
      });
    }
  };

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

  const filteredFonts = useMemo(() => {
    if (activeCategory === 'My Fonts') return customFonts;
    let fonts = activeCategory === 'All' ? ALL_FONTS : (FONT_CATEGORIES as any)[activeCategory] || [];
    if (fontSearch) {
      fonts = fonts.filter((f: string) => f.toLowerCase().includes(fontSearch.toLowerCase()));
    }
    return fonts;
  }, [activeCategory, fontSearch, customFonts]);

  const categories = ['All', 'My Fonts', ...Object.keys(FONT_CATEGORIES)];

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9 ]/g, '');
      await registerCustomFont(fontName, arrayBuffer);
      addCustomFont(fontName);
    } catch (err) {
      console.error("Font upload failed", err);
      alert("Font upload failed.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-y-auto custom-scrollbar">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Icons.Text className="w-5 h-5 text-[#7d2ae8]" />
        Typography
      </h3>

      {/* Standard Text Buttons */}
      <div className="flex flex-col gap-2 mb-6">
        <button
          onClick={() => handleAddText({ text: 'Heading', fontSize: 62, fontWeight: '800' })}
          className="w-full py-3 bg-[#252627] hover:bg-[#333] border border-gray-700 hover:border-gray-500 rounded-lg text-left px-4 transition-colors"
        >
          <span className="text-2xl font-extrabold text-white">Add a heading</span>
        </button>
        <button
          onClick={() => handleAddText({ text: 'Subheading', fontSize: 38, fontWeight: '600' })}
          className="w-full py-2.5 bg-[#252627] hover:bg-[#333] border border-gray-700 hover:border-gray-500 rounded-lg text-left px-4 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-200">Add a subheading</span>
        </button>
        <button
          onClick={() => handleAddText({ text: 'Body text', fontSize: 24, fontWeight: '400' })}
          className="w-full py-2 bg-[#252627] hover:bg-[#333] border border-gray-700 hover:border-gray-500 rounded-lg text-left px-4 transition-colors"
        >
          <span className="text-sm text-gray-300">Add a little bit of body text</span>
        </button>
      </div>

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
                onClick={() => handleAddText({ text: res, fontSize: 32, fontWeight: 'bold' })}
                className="bg-[#252627] hover:bg-purple-500 hover:text-white border border-gray-600 text-gray-300 text-[10px] px-2 py-1.5 rounded transition-colors text-left"
              >
                {res}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10">
        {/* Text Presets Grid */}
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Text Effects</h4>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => handleAddText({ text: 'GLOW', fontSize: 60, fontWeight: 'bold', color: '#fff', fontFamily: 'Montserrat', shadow: { color: '#00ffff', blur: 20, offsetX: 0, offsetY: 0 } })}
            className="h-16 bg-[#1a1a1a] rounded border border-gray-800 hover:border-cyan-500 group relative overflow-hidden flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
            <span className="font-bold text-xl text-white drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">GLOW</span>
          </button>

          <button
            onClick={() => handleAddText({ text: 'RETRO', fontSize: 50, fontWeight: 'bold', color: '#ff0099', fontFamily: 'Righteous', shadow: { color: '#00ffff', blur: 0, offsetX: 3, offsetY: 3 } })}
            className="h-16 bg-[#1a1a1a] rounded border border-gray-800 hover:border-pink-500 group relative overflow-hidden flex items-center justify-center"
          >
            <span className="font-display font-bold text-xl text-pink-500 drop-shadow-[2px_2px_0px_#0ff]">RETRO</span>
          </button>

          <button
            onClick={() => handleAddText({ text: '3D', fontSize: 50, fontWeight: '900', color: '#ffd700', fontFamily: 'Anton', shadow: { color: '#b8860b', blur: 0, offsetX: 1, offsetY: 1 } })}
            className="h-16 bg-[#1a1a1a] rounded border border-gray-800 hover:border-yellow-500 group relative overflow-hidden flex items-center justify-center"
          >
            <span className="font-bold text-xl text-yellow-400 drop-shadow-[1px_1px_0px_#b8860b] shadow-yellow-700/50">3D</span>
          </button>

          <button
            onClick={() => handleAddText({ text: 'HOLLOW', fontSize: 50, fontWeight: '900', color: 'transparent', styleType: 'hollow', fontFamily: 'Inter', stroke: { color: '#ffffff', width: 1 } })}
            className="h-16 bg-[#1a1a1a] rounded border border-gray-800 hover:border-white group flex items-center justify-center"
          >
            <span className="font-bold text-xl text-transparent [-webkit-text-stroke:1px_white]">HOLLOW</span>
          </button>

          <button
            onClick={() => handleAddText({ text: 'GLITCH', fontSize: 50, fontWeight: 'bold', color: '#fff', fontFamily: 'Rubik Glitch', shadow: { color: '#f00', blur: 2, offsetX: -2, offsetY: 0 } })}
            className="h-16 bg-[#1a1a1a] rounded border border-gray-800 hover:border-red-500 group flex items-center justify-center"
          >
            <span className="font-mono font-bold text-lg text-white tracking-widest">GLITCH</span>
          </button>

          <button
            onClick={() => handleAddText({ text: 'NEON', fontSize: 50, fontWeight: 'bold', color: '#ff00ff', fontFamily: 'Monoton', shadow: { color: '#ff00ff', blur: 15, offsetX: 0, offsetY: 0 } })}
            className="h-16 bg-[#1a1a1a] rounded border border-gray-800 hover:border-fuchsia-500 group flex items-center justify-center"
          >
            <span className="font-bold text-lg text-fuchsia-400 drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]">NEON</span>
          </button>
        </div>

        {/* Categories */}
        <div className="mb-4 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-900/20' : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* My Fonts Section */}
        {activeCategory === 'My Fonts' && (
          <div className="mb-6">
            <button
              onClick={() => fontInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 transition-colors flex flex-col items-center justify-center gap-2 mb-4 bg-purple-500/5"
            >
              <Icons.Uploads className="w-6 h-6 text-purple-400" />
              <div className="text-center">
                <span className="text-xs font-bold text-white block">Upload Custom Font</span>
                <span className="text-[9px] text-gray-500">Supports OTF, TTF, WOFF</span>
              </div>
            </button>
            <input
              type="file"
              ref={fontInputRef}
              className="hidden"
              accept=".otf,.ttf,.woff,.woff2"
              onChange={handleFontUpload}
            />
            <div className="flex flex-col gap-2">
              {customFonts.map(font => (
                <FontPreviewItem
                  key={`custom-${font}`}
                  font={font}
                  text={font}
                  onClick={() => handleAddText({ text: 'Your Text', fontFamily: font, fontSize: 32 })}
                  onHover={(f) => setPreviewFontFamily(f)}
                />
              ))}
              {customFonts.length === 0 && (
                <p className="text-[10px] text-gray-600 text-center py-8">You haven't uploaded any custom fonts yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Fonts */}
        {recentFonts.length > 0 && !fontSearch && activeCategory === 'All' && (
          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Recently Used</h4>
            <div className="flex flex-col gap-2">
              {recentFonts.map(font => (
                <FontPreviewItem
                  key={`recent-${font}`}
                  font={font}
                  text={font}
                  onClick={() => handleAddText({ text: 'Your Text', fontFamily: font, fontSize: 32 })}
                  onHover={(f) => setPreviewFontFamily(f)}
                />
              ))}
            </div>
            <div className="h-px bg-gray-800 my-4"></div>
          </div>
        )}

        {/* Font List */}
        <div className="flex flex-col gap-2 pb-20">
          {filteredFonts.length > 0 ? (
            filteredFonts.map((font: string) => (
              <FontPreviewItem
                key={font}
                font={font}
                text={font}
                onClick={() => handleAddText({ text: 'Your Text', fontFamily: font, fontSize: 32 })}
                onHover={(f) => setPreviewFontFamily(f)}
              />
            ))
          ) : (
            <div className="text-center py-10 opacity-40">
              <p className="text-xs">No fonts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
