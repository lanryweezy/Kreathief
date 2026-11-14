import React, { useState, useMemo, useCallback } from 'react';
import { Icons } from '../../constants';
import {
  DESIGN_STYLE_DATABASE,
  STYLE_CATEGORIES,
  getAllStyles,
  getStylesByCategory,
  searchStyles,
  type DesignStyleEntry,
  type StyleCategory,
} from '../../services/designStyleDatabase';

interface StylePickerProps {
  onSelectStyle: (style: DesignStyleEntry) => void;
  currentStyleId?: string | null;
  onClose?: () => void;
}

const ALL_CATEGORIES: StyleCategory[] = [
  'trending',
  'classical',
  'modernist',
  'retro',
  'raw',
  'dark',
  'organic',
  'playful',
  'typography',
  'digital',
  'fantasy',
];

export const StylePicker: React.FC<StylePickerProps> = ({ onSelectStyle, currentStyleId, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<StyleCategory | 'all'>('all');
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  const filteredStyles = useMemo(() => {
    if (search.trim()) {
      return searchStyles(search.trim());
    }
    if (activeCategory === 'all') {
      return getAllStyles();
    }
    return getStylesByCategory(activeCategory);
  }, [search, activeCategory]);

  const handleSelect = useCallback(
    (style: DesignStyleEntry) => {
      onSelectStyle(style);
    },
    [onSelectStyle]
  );

  return (
    <div className="flex flex-col h-full bg-surface-dark-1 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Icons.Palette className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-bold">Design Styles</h2>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
            {Object.keys(DESIGN_STYLE_DATABASE).length} styles
          </span>
        </div>
        {onClose && (
          <button
            aria-label="Close style picker"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search styles, moods, use cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-dark-3 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          {search && (
            <button
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <Icons.X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const meta = STYLE_CATEGORIES[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {meta.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Results count */}
      <div className="px-4 pb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          {filteredStyles.length} style{filteredStyles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Style Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredStyles.map((style) => {
            const isSelected = currentStyleId === style.id;
            const isHovered = hoveredStyle === style.id;
            const swatches = [
              style.palette.background,
              style.palette.primary,
              style.palette.secondary,
              style.palette.accent,
            ];

            return (
              <button
                key={style.id}
                onClick={() => handleSelect(style)}
                onMouseEnter={() => setHoveredStyle(style.id)}
                onMouseLeave={() => setHoveredStyle(null)}
                className={`group relative flex flex-col items-start p-2.5 rounded-2xl border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-brand-500 bg-brand-600/10 ring-1 ring-brand-500/50'
                    : 'border-white/10 bg-surface-dark-3 hover:border-white/25 hover:bg-surface-dark-2'
                }`}
              >
                {/* Live Visual Style Specimen */}
                <div
                  className="w-full h-24 rounded-xl mb-2.5 overflow-hidden relative p-2.5 flex flex-col justify-between transition-transform duration-200 group-hover:scale-[1.01]"
                  style={{
                    backgroundColor: style.palette.background,
                    border: `1px solid ${style.palette.border}`,
                  }}
                >
                  {/* Top accent bar + surface pill */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider truncate max-w-[70%]"
                      style={{
                        backgroundColor: style.palette.surface,
                        color: style.palette.accent,
                        border: `1px solid ${style.palette.border}`,
                      }}
                    >
                      {style.badge}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: style.palette.accent }}
                    />
                  </div>

                  {/* Live Typography Specimen */}
                  <div className="my-auto">
                    <div
                      className="text-sm leading-tight truncate"
                      style={{
                        color: style.palette.text,
                        fontFamily: `${style.typography.headlineFont}, sans-serif`,
                        fontWeight: style.typography.headlineWeight,
                        letterSpacing: `${style.typography.letterSpacing}px`,
                        textTransform: style.typography.textTransform,
                      }}
                    >
                      {style.name}
                    </div>
                    <div
                      className="text-[9px] truncate mt-0.5"
                      style={{
                        color: style.palette.textMuted,
                        fontFamily: `${style.typography.bodyFont}, sans-serif`,
                      }}
                    >
                      {style.typography.headlineFont} · {style.era || style.category}
                    </div>
                  </div>

                  {/* Bottom Palette Swatch Strip */}
                  <div className="flex items-center gap-1">
                    {swatches.map((hex, i) => (
                      <span
                        key={`${style.id}-sw-${i}`}
                        className="h-1.5 flex-1 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Style info */}
                <div className="flex items-center justify-between w-full gap-1 mb-0.5">
                  <span className="text-xs font-bold text-white truncate">{style.name}</span>
                  {style.era && <span className="text-[9px] text-gray-500 shrink-0">{style.era}</span>}
                </div>

                <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{style.tagline}</p>

                {/* Mood tags */}
                {isHovered && style.mood.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {style.mood.slice(0, 3).map((m) => (
                      <span
                        key={m}
                        className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow-md">
                    <Icons.Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredStyles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Icons.Search className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No styles match "{search}"</p>
            <button onClick={() => setSearch('')} className="text-xs text-brand-400 mt-2 hover:underline">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact style chip for inline display (e.g., in the dashboard prompt area)
 */
export const StyleChip: React.FC<{
  style: DesignStyleEntry;
  onClick?: () => void;
  onRemove?: () => void;
  compact?: boolean;
}> = ({ style, onClick, onRemove, compact }) => {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-dark-3 hover:border-white/20 transition-all ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'
      }`}
    >
      <span
        className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full shrink-0`}
        style={{
          background: `linear-gradient(135deg, ${style.palette.primary}, ${style.palette.accent})`,
        }}
      />
      <span className="font-medium text-white">{style.name}</span>
      {onRemove && (
        <button
          aria-label="Remove style"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icons.X className="w-3 h-3 text-gray-400 hover:text-white" />
        </button>
      )}
    </button>
  );
};
