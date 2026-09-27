import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { getCategoriesWithPairings, TypographyPairing } from '../../services/typographyPairingEngine';
import { loadFont } from '../../services/FontLoader';
import { TextLayer, Layer } from '../../types';

export const TypographyPairingsPanel: React.FC = () => {
  const { artboards, activeArtboardId, selectedLayerIds, updateLayer, harmonizeArtboardTypography, addToast, saveToHistory } =
    useStore(
      useShallow((state) => ({
        artboards: state.artboards,
        activeArtboardId: state.activeArtboardId,
        selectedLayerIds: state.selectedLayerIds,
        updateLayer: state.updateLayer,
        harmonizeArtboardTypography: state.harmonizeArtboardTypography,
        addToast: state.addToast,
        saveToHistory: state.saveToHistory,
      }))
    );

  const categories = useMemo(() => getCategoriesWithPairings(), []);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const textLayers = useMemo(
    () => (activeArtboard?.layers || []).filter((l: Layer) => l.type === 'text') as TextLayer[],
    [activeArtboard]
  );

  const selectedTextLayerId = selectedLayerIds && selectedLayerIds.length > 0 ? selectedLayerIds[selectedLayerIds.length - 1] : null;
  const isTextSelected = Boolean(textLayers.some((t) => t.id === selectedTextLayerId));

  const allPairings = useMemo(() => {
    const list: Array<{ category: string; style: string; pairing: TypographyPairing }> = [];
    categories.forEach((cat) => {
      cat.pairings.forEach((p) => {
        list.push({ category: cat.category, style: p.style, pairing: p.pairing });
      });
    });
    return list;
  }, [categories]);

  const filteredPairings = useMemo(() => {
    return allPairings.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        item.style.toLowerCase().includes(q) ||
        item.pairing.heading.toLowerCase().includes(q) ||
        item.pairing.body.toLowerCase().includes(q) ||
        item.pairing.mood.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allPairings, selectedCategory, searchQuery]);

  const handleApplyToSelected = async (fontName: string) => {
    if (!selectedTextLayerId) return;
    saveToHistory?.();
    await loadFont(fontName);
    updateLayer(selectedTextLayerId, { fontFamily: fontName });
    addToast?.(`Updated selected text to ${fontName}`, 'success');
  };

  const handleHarmonizeCanvas = (pairing: TypographyPairing) => {
    harmonizeArtboardTypography(pairing);
  };

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* Harmonize Hero Banner */}
      <div className="p-3.5 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 rounded-xl relative overflow-hidden shadow-lg">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Icons.Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-black tracking-wide text-white">Artboard Harmonizer</h4>
              <p className="text-[10px] text-indigo-200/70 font-medium">
                {textLayers.length} text layer{textLayers.length === 1 ? '' : 's'} detected on active canvas
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => harmonizeArtboardTypography()}
          className="w-full py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Icons.Wand className="w-3.5 h-3.5 text-yellow-300" />
          Auto-Harmonize All Typography
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search pairings, fonts, or aesthetics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 bg-surface-dark-3 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
        />

        <div className="flex flex-wrap gap-1">
          {['All', ...categories.map((c) => c.category)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pairings List */}
      <div className="space-y-2.5">
        {filteredPairings.map(({ style, pairing }) => (
          <div
            key={style}
            className="p-3 bg-surface-dark-3/80 hover:bg-surface-dark-3 border border-white/10 rounded-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-400">
                {style.replace(/_/g, ' ')}
              </span>
              <span className="text-[9px] text-gray-500 font-medium lowercase">
                {pairing.mood}
              </span>
            </div>

            {/* Typography Preview Sample */}
            <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 mb-2.5 space-y-1">
              <div
                className="text-base font-extrabold text-white leading-tight truncate"
                style={{ fontFamily: pairing.heading }}
              >
                {pairing.heading} (Headline)
              </div>
              <div
                className="text-xs text-gray-300 font-normal leading-relaxed truncate"
                style={{ fontFamily: pairing.body }}
              >
                {pairing.body} — Balanced body copy & supporting subheadlines.
              </div>
              {pairing.accent && (
                <div
                  className="text-[9px] font-black uppercase tracking-widest text-indigo-400 truncate"
                  style={{ fontFamily: pairing.accent }}
                >
                  {pairing.accent} — Accent / Badge Pill
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleHarmonizeCanvas(pairing)}
                className="flex-1 py-1.5 px-2 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 hover:text-white border border-brand-500/30 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                title="Apply this pairing across all text layers on the active artboard"
              >
                <Icons.Layers className="w-3 h-3" />
                Apply to Artboard
              </button>

              {isTextSelected && (
                <button
                  onClick={() => handleApplyToSelected(pairing.heading)}
                  className="py-1.5 px-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-lg text-[10px] font-bold transition-all"
                  title="Apply heading font to currently selected text layer"
                >
                  Selected ({pairing.heading})
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
