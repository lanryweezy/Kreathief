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

const ALL_CATEGORIES: StyleCategory[] = ['trending', 'classical', 'modernist', 'retro', 'raw', 'dark', 'organic', 'playful', 'typography', 'digital', 'fantasy'];

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

  const handleSelect = useCallback((style: DesignStyleEntry) => {
    onSelectStyle(style);
  }, [onSelectStyle]);

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
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
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
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.name.split(' ')[0]}</span>
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
        <div className="grid grid-cols-2 gap-2.5">
          {filteredStyles.map((style) => {
            const isSelected = currentStyleId === style.id;
            const isHovered = hoveredStyle === style.id;

            return (
              <button
                key={style.id}
                onClick={() => handleSelect(style)}
                onMouseEnter={() => setHoveredStyle(style.id)}
                onMouseLeave={() => setHoveredStyle(null)}
                className={`group relative flex flex-col items-start p-3 rounded-2xl border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-brand-500 bg-brand-600/10 ring-1 ring-brand-500/50'
                    : 'border-white/5 bg-surface-dark-3 hover:border-white/20 hover:bg-surface-dark-2'
                }`}
              >
                {/* Color preview */}
                <div className="w-full h-14 rounded-xl mb-2 overflow-hidden relative">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${style.palette.primary} 0%, ${style.palette.secondary} 50%, ${style.palette.accent} 100%)`,
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white/80 uppercase tracking-wider">
                    {style.badge}
                  </span>
                </div>

                {/* Style info */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{style.icon}</span>
                  <span className="text-xs font-bold text-white truncate">{style.name}</span>
                </div>

                {style.era && (
                  <span className="text-[10px] text-gray-500 mb-1">{style.era}</span>
                )}

                <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
                  {style.tagline}
                </p>

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
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
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
            <button
              onClick={() => setSearch('')}
              className="text-xs text-brand-400 mt-2 hover:underline"
            >
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
      <span className="font-medium text-white">{style.icon} {style.name}</span>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icons.X className="w-3 h-3 text-gray-400 hover:text-white" />
        </button>
      )}
    </button>
  );
};
