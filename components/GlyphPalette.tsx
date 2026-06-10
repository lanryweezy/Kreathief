import { useEffect, useState } from 'react';
import * as opentype from 'opentype.js';

const COMMON_GLYPHS = [
  '™',
  '®',
  '©',
  '•',
  '§',
  '¶',
  '†',
  '‡',
  '…',
  '—',
  '–',
  '←',
  '↑',
  '→',
  '↓',
  '↔',
  '↕',
  '↖',
  '↗',
  '↘',
  '↙',
  '♠',
  '♣',
  '♥',
  '♦',
  'α',
  'β',
  'γ',
  'δ',
  'ε',
  'θ',
  'λ',
  'μ',
  'π',
  'σ',
  'ω',
  '½',
  '¼',
  '¾',
  '¹',
  '²',
  '³',
  '°',
  '±',
  '×',
  '÷',
  '≈',
  '≠',
  '≡',
  '≥',
  '≤',
];

interface GlyphPaletteProps {
  fontFamily: string;
  onSelect: (glyph: string) => void;
  onClose: () => void;
}

export const GlyphPalette = ({ fontFamily, onSelect, onClose }: GlyphPaletteProps) => {
  const [glyphs, setGlyphs] = useState<string[]>(COMMON_GLYPHS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'common' | 'font'>('common');
  const [fontObj, setFontObj] = useState<opentype.Font | null>(null);

  useEffect(() => {
    const loadFontGlyphs = async () => {
      setIsLoading(true);
      try {
        // Try to load local font first
        let fontUrl: string | null = null;

        // Check if it's one of our core local fonts
        const localFonts = ['Inter', 'Space Grotesk', 'Outfit'];
        if (localFonts.includes(fontFamily)) {
          // Try weight 400
          fontUrl = `/fonts/${fontFamily.replace(/\s+/g, '-')}-400.ttf`;
        }

        if (fontUrl) {
          try {
            const buffer = await fetch(fontUrl).then((res) => res.arrayBuffer());
            const font = opentype.parse(buffer);
            setFontObj(font);

            const extracted: string[] = [];
            const numGlyphs = font.numGlyphs;

            for (let i = 0; i < Math.min(numGlyphs, 2000); i++) {
              const glyph = font.glyphs.get(i);
              if (glyph.unicode) {
                extracted.push(String.fromCharCode(glyph.unicode));
              }
            }
            setGlyphs(extracted);
            setIsLoading(false);
            return;
          } catch (localError) {
            console.warn(`Local font load failed for ${fontFamily}, trying CDN...`, localError);
          }
        }

        // Fallback to Google Fonts CDN
        const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily.replace(/ /g, '+'))}:wght@400&display=swap`;
        const cssResponse = await fetch(cssUrl);
        const cssText = await cssResponse.text();

        const urlMatch = cssText.match(/src:\s*url\(([^)]+)\)/);
        if (urlMatch && urlMatch[1]) {
          const urlFromCDN = urlMatch[1].replace(/['"]/g, '');
          const buffer = await fetch(urlFromCDN).then((res) => res.arrayBuffer());

          try {
            const font = opentype.parse(buffer);
            setFontObj(font);

            const extracted: string[] = [];
            const numGlyphs = font.numGlyphs;

            for (let i = 0; i < Math.min(numGlyphs, 2000); i++) {
              const glyph = font.glyphs.get(i);
              if (glyph.unicode) {
                extracted.push(String.fromCharCode(glyph.unicode));
              }
            }

            setGlyphs(extracted);
          } catch (e) {
            console.error('OpenType Parse Error', e);
          }
        }
      } catch (error) {
        console.error('Failed to load font glyphs', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'font' && !fontObj) {
      loadFontGlyphs();
    }
  }, [activeTab, fontFamily, fontObj]);

  return (
    <div className="absolute top-full right-0 mt-3 w-64 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-3 z-50 animate-fadeIn backdrop-blur-xl flex flex-col max-h-80">
      <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Glyphs</span>
        <div className="flex bg-black/20 rounded-lg p-0.5">
          <button
            onClick={() => {
              setActiveTab('common');
              setGlyphs(COMMON_GLYPHS);
            }}
            className={`text-[10px] px-2 py-1 rounded-md transition-all ${activeTab === 'common' ? 'bg-[#7d2ae8] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Common
          </button>
          <button
            onClick={() => setActiveTab('font')}
            className={`text-[10px] px-2 py-1 rounded-md transition-all ${activeTab === 'font' ? 'bg-[#7d2ae8] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {fontFamily}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#7d2ae8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-1 overflow-y-auto custom-scrollbar pr-1">
          {glyphs.map((g, i) => (
            <button
              key={`${g}-${i}`}
              onClick={() => {
                onSelect(g);
                onClose();
              }}
              title={`Unicode: ${g.charCodeAt(0)}`}
              className="p-1.5 text-base text-gray-300 hover:text-white hover:bg-[#7d2ae8] rounded-md transition-all flex items-center justify-center aspect-square font-medium"
              style={{ fontFamily: activeTab === 'font' ? `"${fontFamily}", sans-serif` : 'inherit' }}
            >
              {g}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
