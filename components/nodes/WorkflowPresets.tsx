import { useState, useCallback, useMemo } from 'react';
import { WorkflowPreset } from '../../types/nodes';
import { WORKFLOW_PRESETS, getPresetsByCategory } from '../../data/workflowPresets';
import { useNodeGraph } from '../../hooks/useNodeGraph';

interface WorkflowPresetsProps {
  onSelect: (presetId: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🔥' },
  { id: 'kreathief', label: 'KreaThief', icon: '⭐' },
  { id: 'streetwear', label: 'Streetwear', icon: '👕' },
  { id: 'social', label: 'Social', icon: '📱' },
  { id: 'brand', label: 'Brand', icon: '🏷️' },
  { id: 'product', label: 'Product', icon: '📦' },
  { id: 'ai-art', label: 'AI Art', icon: '🎨' },
  { id: 'music', label: 'Music', icon: '🎵' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

const PRESET_CATEGORIES: Record<string, CategoryId[]> = {
  'drop-day-tee': ['streetwear', 'kreathief'],
  'sticker-bomb': ['streetwear', 'kreathief'],
  'embroidery-forge': ['streetwear', 'kreathief'],
  'flyer-drop': ['streetwear', 'social', 'kreathief'],
  'album-art-engine': ['music', 'kreathief'],
  'brand-in-a-box-full': ['brand', 'kreathief'],
  'thumbnail-magnet': ['social', 'kreathief'],
  'content-multiplier': ['social', 'kreathief'],
  'quote-card-factory': ['social', 'kreathief'],
  'glow-up-transformer': ['social', 'kreathief'],
  'carousel-course': ['social', 'kreathief'],
  'podcast-cover': ['music', 'social', 'kreathief'],
  'story-sequence': ['social', 'kreathief'],
  'trend-jacking': ['social', 'kreathief'],
  'logo-rescue': ['brand', 'kreathief'],
  'product-photo-glowup': ['product', 'kreathief'],
  'launch-packaging': ['product', 'kreathief'],
  'label-factory': ['product', 'kreathief'],
  'mockup-machine': ['product', 'kreathief'],
  'menu-maker': ['product', 'kreathief'],
  'vehicle-wrap': ['product', 'kreathief'],
  'logo-forge-100': ['brand', 'ai-art', 'kreathief'],
  'character-sheet': ['ai-art', 'kreathief'],
  'style-transfer': ['ai-art', 'kreathief'],
  'product-photo-pro': ['product', 'ai-art', 'kreathief'],
  'environment-concept': ['ai-art', 'kreathief'],
  'fashion-lookbook': ['ai-art', 'product', 'kreathief'],
  'texture-vault': ['ai-art', 'kreathief'],
  'social-content-blitz': ['social', 'kreathief'],
  'listing-pro': ['product', 'kreathief'],
};

function getPresetCategories(presetId: string): CategoryId[] {
  return PRESET_CATEGORIES[presetId] || ['kreathief'];
}

function WorkflowPresets({ onSelect }: WorkflowPresetsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const loadPreset = useNodeGraph((s) => s.loadPreset);

  const filteredPresets = useMemo(() => {
    let presets = activeCategory === 'all'
      ? WORKFLOW_PRESETS
      : WORKFLOW_PRESETS.filter((p) => getPresetCategories(p.id).includes(activeCategory));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      presets = presets.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return presets;
  }, [activeCategory, searchQuery]);

  const handleSelect = useCallback(
    (presetId: string) => {
      loadPreset(presetId);
      onSelect(presetId);
    },
    [loadPreset, onSelect]
  );

  return (
    <div className="flex flex-col h-full bg-surface-dark-1">
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows..."
            className="w-full pl-9 pr-3 py-2 text-[11px] bg-surface-dark-3 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-600/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'bg-surface-dark-3 text-zinc-400 hover:text-white hover:bg-surface-dark-2'
            }`}
          >
            <span className="text-xs">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset.id)}
            className="w-full text-left p-3 rounded-xl bg-surface-dark-2 border border-white/5 hover:border-brand-600/50 hover:bg-surface-dark-3 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-dark-3 border border-white/5 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                {preset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-white truncate">{preset.name}</div>
                <div className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">{preset.description}</div>
                <div className="flex gap-1 mt-1.5">
                  {getPresetCategories(preset.id).slice(0, 3).map((cat) => (
                    <span key={cat} className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-surface-dark-3 text-zinc-500 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
        {filteredPresets.length === 0 && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-[11px] text-zinc-500">No workflows found</div>
            <div className="text-[10px] text-zinc-600 mt-1">Try a different search or category</div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-white/10">
        <div className="text-[9px] text-zinc-600 text-center">
          {filteredPresets.length} workflow{filteredPresets.length !== 1 ? 's' : ''} available
        </div>
      </div>
    </div>
  );
}

export default WorkflowPresets;
