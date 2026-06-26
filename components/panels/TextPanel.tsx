import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as opentype from 'opentype.js';
import { Icons, FONT_FAMILIES, FONT_CATEGORIES } from '../../constants';
import { TextLayer } from '../../types';
import * as geminiService from '../../services/geminiService';
import { loadFont, registerCustomFont } from '../../services/FontLoader';
import { useStore } from '../../store/useStore';
import { log } from '../../utils/log';
import { getAIErrorMessage } from '../../utils/errorMessages';
import { TextStylesPanel, TextStyle } from './TextStylesPanel';
import { TextGradientEditor } from './TextGradientEditor';
import { TextEffectsPanel } from './TextEffectsPanel';
import { TextOnPath } from './TextOnPath';
import { FindReplaceText } from './FindReplaceText';
import { TextSpacingControls } from './TextSpacingControls';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { Input } from '../Input';
import { Button } from '../Button';

// Flatten relevant fonts for "All" tab
const ALL_FONTS = FONT_FAMILIES;

const FontPreviewItem = ({
  font,
  text = 'Hamburgevons',
  onClick,
  onHover,
}: {
  font: string;
  text?: string;
  onClick: () => void;
  onHover: (f: string | null) => void;
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
      className="w-full text-left p-3 bg-surface-dark-3 border border-gray-700/50 rounded-xl hover:border-brand-600 hover:bg-surface-dark-4 transition-all group overflow-hidden relative"
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
        <div className="w-6 h-6 rounded-full bg-brand-600/20 text-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
          <Icons.Plus className="w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  );
};

export const TextPanel: React.FC = () => {
  const addTextLayer = useStore((state) => state.addTextLayer);
  const updateLayer = useStore((state) => state.updateLayer);
  const setPreviewFontFamily = useStore((state) => state.setPreviewFontFamily);
  const customFonts = useStore((state) => state.customFonts);
  const addCustomFont = useStore((state) => state.addCustomFont);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const artboards = useStore((state) => state.artboards) || [];
  const layers = useMemo(() => artboards.flatMap((a) => a.layers || []), [artboards]);
  const addToast = useStore((state) => state.addToast);

  const [fontSearch, _setFontSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  const [textGenPrompt, setTextGenPrompt] = useState('');
  const [textGenResults, setTextGenResults] = useState<string[]>([]);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [activeTextTab, setActiveTextTab] = useState<
    'add' | 'styles' | 'gradient' | 'effects' | 'path' | 'find' | 'spacing'
  >('add');
  const [selectedTextStyle, setSelectedTextStyle] = useState<Partial<TextStyle> | null>(null);
  const [textGradient, setTextGradient] = useState<any>(null);
  const [textEffects, setTextEffects] = useState<any>({});
  const [selectedFontWeight, setSelectedFontWeight] = useState<string>('400');
  const [pairingFont, setPairingFont] = useState<string | null>(null);
  const [showPairings, setShowPairings] = useState(false);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const selectedLayerId =
    selectedLayerIds && selectedLayerIds.length > 0 ? selectedLayerIds[selectedLayerIds.length - 1] : null;
  const selectedLayer = layers.find((l: any) => l?.id === selectedLayerId) || null;
  const selectedTextLayer = selectedLayer?.type === 'text' ? (selectedLayer as TextLayer) : null;

  // Load recent fonts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kreathief_recent_fonts');
      if (saved) {
        setRecentFonts(JSON.parse(saved));
      }
    } catch (e) {
      log.error('[TextPanel] Failed to load recent fonts', e);
    }
  }, []);

  const getFontPairings = (font: string): string[] => {
    const serifs = ['Playfair Display', 'Cormorant Garamond', 'EB Garamond', 'Libre Baskerville',
      'Lora', 'Merriweather', 'PT Serif', 'Crimson Text', 'Zilla Slab', 'Vollkorn', 'Bitter',
      'Noto Serif', 'Slabo 27px'];
    const displays = ['Bebas Neue', 'Anton', 'Oswald', 'Alfa Slab One', 'Abril Fatface',
      'Bangers', 'Bungee', 'Monoton', 'Staatliches', 'Russo One', 'Acme', 'Comfortaa',
      'Fjalla One', 'Sriracha', 'Cinzel', 'Teko'];
    const scripts = ['Dancing Script', 'Great Vibes', 'Pacifico', 'Satisfy', 'Yellowtail',
      'Sacramenta', 'Caveat', 'Indie Flower', 'Shadows Into Light', 'Amatic SC',
      'Gloria Hallelujah', 'Permanent Marker'];

    if (serifs.some((f) => font.includes(f))) {
      return ['Inter', 'DM Sans', 'Work Sans'];
    } else if (displays.some((f) => font.includes(f))) {
      return ['Inter', 'Open Sans', 'Lato'];
    } else if (scripts.some((f) => font.includes(f))) {
      return ['Montserrat', 'Poppins', 'Roboto'];
    }
    return ['Playfair Display', 'Lora', 'Merriweather'];
  };

  const handleAddText = (style: Partial<TextLayer>) => {
    addTextLayer(style);
    if (style.fontFamily) {
      setPairingFont(style.fontFamily);
      setShowPairings(true);
      setRecentFonts((prev) => {
        const filtered = prev.filter((f) => f !== style.fontFamily);
        const updated = [style.fontFamily!, ...filtered].slice(0, 5);
        localStorage.setItem('kreathief_recent_fonts', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleMagicText = async () => {
    if (!textGenPrompt.trim()) {
      return;
    }
    setIsGeneratingText(true);
    try {
      const results = await geminiService.generateTextOptions(textGenPrompt);
      setTextGenResults(results);
    } catch (e) {
      log.error('[TextPanel] Text generation failed', e, { prompt: textGenPrompt.substring(0, 100) });
      addToast(getAIErrorMessage(e), 'error');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const filteredFonts = useMemo(() => {
    if (activeCategory === 'My Fonts') {
      return customFonts;
    }
    let fonts = activeCategory === 'All' ? ALL_FONTS : (FONT_CATEGORIES as any)[activeCategory] || [];
    if (fontSearch) {
      fonts = fonts.filter((f: string) => f.toLowerCase().includes(fontSearch.toLowerCase()));
    }
    return fonts;
  }, [activeCategory, fontSearch, customFonts]);

  const categories = ['All', 'My Fonts', ...Object.keys(FONT_CATEGORIES)];

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validExtensions = ['.otf', '.ttf', '.woff', '.woff2'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      addToast(`Unsupported font format "${ext}". Please use OTF, TTF, WOFF, or WOFF2.`, 'error');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      let fontName: string;
      try {
        const font = opentype.parse(arrayBuffer);
        fontName =
          font.names.fontFamily?.en ||
          font.names.fontFamily?.['en-US'] ||
          font.names.fontFamily?.enus ||
          file.name.split('.')[0].replace(/[^a-zA-Z0-9 ]/g, '');
      } catch {
        fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9 ]/g, '');
      }
      await registerCustomFont(fontName, arrayBuffer);
      addCustomFont(fontName);
      addToast(`Font "${fontName}" uploaded successfully!`, 'success');
    } catch (err) {
      log.error('[TextPanel] Font upload failed', err, { fileName: file.name });
      addToast(`Font upload failed. The file may be corrupted or invalid.`, 'error');
    }
  };

  return (
    <div
      data-testid="text-panel"
      className="flex flex-col h-full bg-surface-dark-2 p-4 overflow-y-auto custom-scrollbar"
    >
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Text className="w-5 h-5 text-brand-600" />
        Typography
      </h3>

      {/* Font Weight Selector - shown when a text layer is selected */}
      {selectedTextLayer && (
        <div className="mb-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Weight</label>
          <div className="flex flex-wrap gap-1">
            {['300', '400', '500', '600', '700', '900'].map((weight) => (
              <button
                key={weight}
                onClick={() => {
                  setSelectedFontWeight(weight);
                  updateLayer(selectedTextLayer.id, { fontWeight: weight });
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  (selectedTextLayer.fontWeight || '400') === weight
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-dark-3 text-gray-400 hover:text-white hover:bg-surface-dark-4'
                }`}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Panel Tabs - Row 1 */}
      <div className="flex gap-1 mb-2 bg-surface-dark-1 rounded-lg p-1" role="tablist">
        <button
          role="tab"
          aria-selected={activeTextTab === 'add'}
          onClick={() => setActiveTextTab('add')}
          className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            activeTextTab === 'add'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Add
        </button>
        <button
          role="tab"
          aria-selected={activeTextTab === 'styles'}
          onClick={() => setActiveTextTab('styles')}
          className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            activeTextTab === 'styles'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Styles
        </button>
        <button
          role="tab"
          aria-selected={activeTextTab === 'gradient'}
          onClick={() => setActiveTextTab('gradient')}
          className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            activeTextTab === 'gradient'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Gradient
        </button>
        <button
          role="tab"
          aria-selected={activeTextTab === 'effects'}
          onClick={() => setActiveTextTab('effects')}
          className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            activeTextTab === 'effects'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Effects
        </button>
      </div>

      {/* Text Panel Tabs - Row 2 */}
      <div className="flex gap-1 mb-4 bg-surface-dark-1 rounded-lg p-1" role="tablist">
        <button
          role="tab"
          aria-selected={activeTextTab === 'path'}
          onClick={() => setActiveTextTab('path')}
          className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            activeTextTab === 'path'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Path
        </button>
        <button
          role="tab"
          aria-selected={activeTextTab === 'find'}
          onClick={() => setActiveTextTab('find')}
          className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            activeTextTab === 'find'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Find
        </button>
        <button
          role="tab"
          aria-selected={activeTextTab === 'spacing'}
          onClick={() => setActiveTextTab('spacing')}
          className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            activeTextTab === 'spacing'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Spacing
        </button>
      </div>

      {/* Add Text Tab */}
      {activeTextTab === 'add' && (
        <>
          <div className="flex flex-col gap-2 mb-6">
            <button
              data-testid="add-heading-btn"
              onClick={() => handleAddText({ text: 'Heading', fontSize: 62, fontWeight: '800' })}
              className="w-full py-3 bg-surface-dark-4 hover:bg-surface-dark-5 border border-gray-700 hover:border-gray-500 rounded-xl text-left px-4 transition-colors"
            >
              <span className="text-2xl font-extrabold text-white">Add a heading</span>
            </button>
            <button
              data-testid="add-subheading-btn"
              onClick={() => handleAddText({ text: 'Subheading', fontSize: 38, fontWeight: '600' })}
              className="w-full py-2.5 bg-surface-dark-4 hover:bg-surface-dark-5 border border-gray-700 hover:border-gray-500 rounded-xl text-left px-4 transition-colors"
            >
              <span className="text-lg font-semibold text-gray-200">Add a subheading</span>
            </button>
            <button
              data-testid="add-body-text-btn"
              onClick={() => handleAddText({ text: 'Body text', fontSize: 24, fontWeight: '400' })}
              className="w-full py-2 bg-surface-dark-4 hover:bg-surface-dark-5 border border-gray-700 hover:border-gray-500 rounded-xl text-left px-4 transition-colors"
            >
              <span className="text-sm text-gray-300">Add a little bit of body text</span>
            </button>
          </div>

          {/* AI Text Generation */}
          <div className="mb-6 p-3 bg-surface-dark-3 border border-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Magic className="w-4 h-4 text-brand-600" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Text Generator</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Describe what you want to write..."
                value={textGenPrompt}
                onChange={(e) => setTextGenPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicText()}
                className="flex-1 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                className="shrink-0"
                onClick={handleMagicText}
                disabled={isGeneratingText || !textGenPrompt.trim()}
              >
                {isGeneratingText ? (
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Icons.Magic className="w-3 h-3" />
                )}
                Generate
              </Button>
            </div>
            {isGeneratingText && (
              <div className="mt-2 flex items-center gap-2 text-[10px] text-brand-600">
                <div className="animate-spin w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full" />
                <span>AI is generating text options...</span>
              </div>
            )}
            {textGenResults.length > 0 && !isGeneratingText && (
              <div className="mt-3 space-y-1.5">
                {textGenResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddText({ text: result, fontSize: 24, fontWeight: '400' })}
                    className="w-full text-left px-3 py-2 bg-surface-dark-1 border border-gray-700/50 rounded-lg text-xs text-gray-300 hover:border-brand-600 hover:text-white transition-all"
                  >
                    {result}
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
                onClick={() =>
                  handleAddText({
                    text: 'GLOW',
                    fontSize: 60,
                    fontWeight: 'bold',
                    color: '#fff',
                    fontFamily: 'Montserrat',
                    shadow: { color: '#00ffff', blur: 20, offsetX: 0, offsetY: 0 },
                  })
                }
                className="h-16 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-cyan-500 group relative overflow-hidden flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
                <span className="font-bold text-xl text-white drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">GLOW</span>
              </button>

              <button
                onClick={() =>
                  handleAddText({
                    text: 'RETRO',
                    fontSize: 50,
                    fontWeight: 'bold',
                    color: '#ff0099',
                    fontFamily: 'Righteous',
                    shadow: { color: '#00ffff', blur: 0, offsetX: 3, offsetY: 3 },
                  })
                }
                className="h-16 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-pink-500 group relative overflow-hidden flex items-center justify-center"
              >
                <span className="font-display font-bold text-xl text-pink-500 drop-shadow-[2px_2px_0px_#0ff]">
                  RETRO
                </span>
              </button>

              <button
                onClick={() =>
                  handleAddText({
                    text: '3D',
                    fontSize: 50,
                    fontWeight: '900',
                    color: '#ffd700',
                    fontFamily: 'Anton',
                    shadow: { color: '#b8860b', blur: 0, offsetX: 1, offsetY: 1 },
                  })
                }
                className="h-16 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-yellow-500 group relative overflow-hidden flex items-center justify-center"
              >
                <span className="font-bold text-xl text-yellow-400 drop-shadow-[1px_1px_0px_#b8860b] shadow-yellow-700/50">
                  3D
                </span>
              </button>

              <button
                onClick={() =>
                  handleAddText({
                    text: 'HOLLOW',
                    fontSize: 50,
                    fontWeight: '900',
                    color: 'transparent',
                    styleType: 'hollow',
                    fontFamily: 'Inter',
                    stroke: { color: '#ffffff', width: 1 },
                  })
                }
                className="h-16 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-white group flex items-center justify-center"
              >
                <span className="font-bold text-xl text-transparent [-webkit-text-stroke:1px_white]">HOLLOW</span>
              </button>

              <button
                onClick={() =>
                  handleAddText({
                    text: 'GLITCH',
                    fontSize: 50,
                    fontWeight: 'bold',
                    color: '#fff',
                    fontFamily: 'Rubik Glitch',
                    shadow: { color: '#f00', blur: 2, offsetX: -2, offsetY: 0 },
                  })
                }
                className="h-16 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-red-500 group flex items-center justify-center"
              >
                <span className="font-mono font-bold text-lg text-white tracking-widest">GLITCH</span>
              </button>

              <button
                onClick={() =>
                  handleAddText({
                    text: 'NEON',
                    fontSize: 50,
                    fontWeight: 'bold',
                    color: '#ff00ff',
                    fontFamily: 'Monoton',
                    shadow: { color: '#ff00ff', blur: 15, offsetX: 0, offsetY: 0 },
                  })
                }
                className="h-16 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-fuchsia-500 group flex items-center justify-center"
              >
                <span className="font-bold text-lg text-fuchsia-400 drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]">
                  NEON
                </span>
              </button>
            </div>

            {/* Font Pairing Suggestions */}
            {showPairings && pairingFont && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Pairing Suggestions
                  </h4>
                  <button
                    onClick={() => setShowPairings(false)}
                    className="text-[9px] text-gray-500 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 mb-2">
                  Complementary fonts for <span className="text-white font-medium">{pairingFont}</span>
                </p>
                <div className="flex flex-col gap-2">
                  {getFontPairings(pairingFont).map((font) => (
                    <FontPreviewItem
                      key={`pairing-${font}`}
                      font={font}
                      text="Hamburgevons"
                      onClick={() => handleAddText({ text: 'Body Text', fontFamily: font, fontSize: 24, fontWeight: '400' })}
                      onHover={(f) => setPreviewFontFamily(f)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="mb-4 overflow-x-auto custom-scrollbar pb-2">
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-brand-600 text-white shadow-lg shadow-purple-900/20' : 'bg-surface-dark-4 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search fonts..."
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                className="w-full bg-surface-dark-0/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-brand-600 outline-none"
              />
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
                  {customFonts.map((font) => (
                    <FontPreviewItem
                      key={`custom-${font}`}
                      font={font}
                      text="Hamburgevons"
                      onClick={() => handleAddText({ text: 'Your Text', fontFamily: font, fontSize: 32 })}
                      onHover={(f) => setPreviewFontFamily(f)}
                    />
                  ))}
                  {customFonts.length === 0 && (
                    <p className="text-[10px] text-muted-light text-center py-8">
                      You haven&apos;t uploaded any custom fonts yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recent Fonts */}
            {recentFonts.length > 0 && !fontSearch && activeCategory === 'All' && (
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Recently Used</h4>
                <div className="flex flex-col gap-2">
                  {recentFonts.map((font) => (
                    <FontPreviewItem
                      key={`recent-${font}`}
                      font={font}
                      text="Hamburgevons"
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
                    text="Hamburgevons"
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
        </>
      )}

      {/* Styles Tab */}
      {activeTextTab === 'styles' && (
        <TextStylesPanel
          currentStyle={selectedTextStyle || undefined}
          onApplyStyle={(style) => {
            setSelectedTextStyle(style);
            if (selectedTextLayer) {
              updateLayer(selectedTextLayer.id, {
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                fontStyle: style.fontStyle,
                color: style.color,
                textAlign: style.textAlign,
                letterSpacing: style.letterSpacing,
                lineHeight: style.lineHeight,
                textTransform: style.textTransform,
              });
            } else {
              handleAddText({
                text: 'Styled Text',
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                fontStyle: style.fontStyle,
                color: style.color,
                textAlign: style.textAlign,
                letterSpacing: style.letterSpacing,
                lineHeight: style.lineHeight,
                textTransform: style.textTransform,
              });
            }
          }}
          onSaveStyle={(_name, _style) => {
            // Save style logic
          }}
        />
      )}

      {/* Gradient Tab */}
      {activeTextTab === 'gradient' && (
        <TextGradientEditor
          gradient={textGradient}
          onChange={(gradient) => {
            setTextGradient(gradient);
            if (selectedTextLayer) {
              updateLayer(selectedTextLayer.id, { gradient });
            }
          }}
        />
      )}

      {/* Effects Tab */}
      {activeTextTab === 'effects' && (
        <TextEffectsPanel
          effects={textEffects}
          onChange={(effects) => {
            setTextEffects(effects);
            if (selectedTextLayer) {
              updateLayer(selectedTextLayer.id, effects as Partial<TextLayer>);
            }
          }}
        />
      )}

      {/* Path Tab */}
      {activeTextTab === 'path' && (
        <TextOnPath
          onApply={(options) => {
            handleAddText({
              text: options.text,
              fontSize: 32,
              fontWeight: 'bold',
              // Text on path would be handled by canvas rendering
            });
            addToast(`Added curved text: "${options.text}"`, 'success');
          }}
        />
      )}

      {/* Find Tab */}
      {activeTextTab === 'find' && <FindReplaceText />}

      {/* Spacing Tab */}
      {activeTextTab === 'spacing' && (
        <TextSpacingControls
          selectedLayer={
            selectedLayerIds.length > 0 ? (layers.find((l) => l.id === selectedLayerIds[selectedLayerIds.length - 1]) as TextLayer) : undefined
          }
        />
      )}
    </div>
  );
};

export default function TextPanelWrapped() {
  return (
    <PanelErrorBoundary panelName="Text">
      <TextPanel />
    </PanelErrorBoundary>
  );
}
