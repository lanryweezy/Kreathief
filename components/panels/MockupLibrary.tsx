import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { MOCKUP_CATEGORIES, MockupPlacement, getMockupById } from '../../services/enhancedMockupsLibrary';
import { VecteezyResource } from '../../services/vecteezyService';
import { PanelHeader } from './PanelHeader';

export interface MockupLibraryProps {
  variant: 'default' | 'full';
  onClose?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  filteredMockups: Array<{ id: string; name: string; bg: string; category?: string }>;
  activeMockupId: string;
  setActiveMockupId: (id: string) => void;
  batchMode: boolean;
  toggleBatchMode: () => void;
  selectedMockupIds: string[];
  toggleMockupSelection: (id: string) => void;
  isBatchGenerating: boolean;
  batchProgress: { current: number; total: number; name: string };
  generateBatchMockups: () => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (v: boolean) => void;
  favoriteMockups: string[];
  toggleFavorite: (id: string) => void;
  suggestedMockups: string[];
  isAnalyzing: boolean;
  suggestMockups: () => void;
  customMockup: string | null;
  handleUploadMockup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  vecteezyResults: VecteezyResource[];
  isSearchingVecteezy: boolean;
  APP_STORE_PRESETS: Record<string, string[]>;
  generatePreset: (name: string) => void;
  placement: MockupPlacement;
  setPlacement: React.Dispatch<React.SetStateAction<MockupPlacement>>;
  isDetecting: boolean;
  handleAutoDetect: () => void;
  mockups: Array<{ id: string; name: string; bg: string; category?: string }>;
}

export const MockupLibrary: React.FC<MockupLibraryProps> = ({
  variant,
  onClose,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  filteredMockups,
  activeMockupId,
  setActiveMockupId,
  batchMode,
  toggleBatchMode,
  selectedMockupIds,
  toggleMockupSelection,
  isBatchGenerating,
  batchProgress,
  generateBatchMockups,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favoriteMockups,
  toggleFavorite,
  suggestedMockups,
  isAnalyzing,
  suggestMockups,
  customMockup,
  handleUploadMockup,
  vecteezyResults,
  APP_STORE_PRESETS,
  generatePreset,
  placement,
  setPlacement,
  isDetecting,
  handleAutoDetect,
  mockups,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (variant === 'full') {
    return (
      <div className="w-[320px] flex flex-col border-r border-gray-800 bg-surface-dark-2 shrink-0">
        <PanelHeader
          title="Smart Mockups"
          icon={<Icons.Magic className="w-5 h-5" />}
          action={
            onClose ? (
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="p-1 hover:bg-white/5 rounded-md text-gray-500 hover:text-white transition-all"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            ) : null
          }
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
            <p className="text-[10px] text-blue-300/80 leading-relaxed">
              Automatically places your design onto high-quality product photos. Use the controls below to perfect the
              alignment.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={suggestMockups}
              disabled={isAnalyzing}
              className="flex-1 min-w-[120px] px-3 py-2 bg-gradient-to-r from-brand-600 to-accent rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
            >
              {isAnalyzing ? (
                <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Icons.Magic className="w-3.5 h-3.5" />
              )}
              Suggest
            </button>
            <button
              onClick={toggleBatchMode}
              className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                batchMode
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'bg-surface-dark-3 text-gray-400 border border-gray-700 hover:border-white/20'
              }`}
            >
              <Icons.Layers className="w-3.5 h-3.5" />
              Batch {batchMode && `(${selectedMockupIds.length})`}
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                showFavoritesOnly
                  ? 'bg-red-500 text-white'
                  : 'bg-surface-dark-3 text-gray-400 border border-gray-700 hover:border-white/20'
              }`}
            >
              <Icons.Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favorites
            </button>
          </div>

          <div className="p-3 bg-gradient-to-br from-brand-600/10 to-accent/10 border border-brand-600/20 rounded-lg">
            <h4 className="text-[9px] font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1">
              <Icons.Zap className="w-3 h-3 text-brand-600" />
              Quick Sets
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(APP_STORE_PRESETS).map((preset) => (
                <button
                  key={preset}
                  onClick={() => generatePreset(preset)}
                  className="px-2 py-1 bg-surface-dark-3 hover:bg-brand-600/20 border border-gray-700 hover:border-brand-600 rounded text-[8px] font-bold text-gray-400 hover:text-white transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search mockups..."
              className="w-full bg-surface-dark-3 border border-gray-700 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-brand-600 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>
              Showing <span className="text-white font-bold">{filteredMockups.length}</span> mockups
              {showFavoritesOnly ? ' (Favorites)' : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleAutoDetect}
                disabled={isDetecting}
                className="px-2 py-1 bg-brand-600/20 border border-brand-600/50 rounded hover:border-brand-600 transition-colors text-brand-600 flex items-center gap-1 disabled:opacity-50"
                title="AI Auto-Detect optimal placement"
              >
                {isDetecting ? (
                  <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Icons.Magic className="w-3 h-3" />
                )}
                Auto-Detect
              </button>
              <button
                onClick={() => setPlacement({ ...placement, skewX: 0, skewY: 0, rotate: 0 })}
                className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
              >
                Reset Perspective
              </button>
              <button
                onClick={() => {
                  const current = getMockupById(activeMockupId);
                  if (current) {
                    setPlacement(current.defaultPlacement);
                  }
                }}
                className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>

          {batchMode && (
            <div className="p-3 bg-brand-600/10 border border-brand-600/30 rounded-lg">
              <p className="text-[9px] text-brand-600 font-bold mb-2">
                Batch Mode: Select multiple mockups to generate
              </p>
              {isBatchGenerating && (
                <div className="mb-2">
                  <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                    <span>{batchProgress.name || 'Preparing...'}</span>
                    <span>
                      {batchProgress.current}/{batchProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-dark-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={generateBatchMockups}
                disabled={selectedMockupIds.length === 0 || isBatchGenerating}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded font-bold text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBatchGenerating ? (
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Icons.Download className="w-3.5 h-3.5" />
                )}
                Generate {selectedMockupIds.length} Mockup{selectedMockupIds.length !== 1 && 's'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {MOCKUP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-4">Select Mockup</h3>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-brand-600 transition-all flex flex-col items-center justify-center gap-2 bg-[#1a1d21] group"
          >
            <Icons.Upload className="w-6 h-6 text-gray-500 group-hover:text-brand-600 transition-colors" />
            <span className="text-[9px] font-bold text-gray-500 group-hover:text-white transition-colors">
              Upload Your Own
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadMockup} className="hidden" />

          <div className="grid grid-cols-2 gap-2">
            {customMockup && (
              <button
                onClick={() => setActiveMockupId('custom')}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  activeMockupId === 'custom' ? 'border-brand-600' : 'border-transparent hover:border-gray-600'
                }`}
              >
                <img src={customMockup} alt="Custom mockup" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-brand-600/90 p-1.5 backdrop-blur-sm">
                  <span className="text-[8px] font-bold text-white block truncate">Your Upload</span>
                </div>
              </button>
            )}

            {filteredMockups.map((m) => (
              <div key={m.id} className="relative aspect-square">
                {batchMode && (
                  <label className="absolute top-1 left-1 z-20">
                    <input
                      type="checkbox"
                      checked={selectedMockupIds.includes(m.id)}
                      onChange={() => toggleMockupSelection(m.id)}
                      className="w-4 h-4 rounded border-2 border-white/50 accent-brand-600 bg-black/50"
                    />
                  </label>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(m.id);
                  }}
                  className="absolute top-1 right-1 z-20 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                >
                  <Icons.Heart
                    className={`w-3 h-3 ${favoriteMockups.includes(m.id) ? 'fill-red-500 text-red-500' : 'text-white'}`}
                  />
                </button>

                {suggestedMockups.includes(m.id) && !showFavoritesOnly && (
                  <div className="absolute bottom-12 right-1 z-20 px-1.5 py-0.5 bg-brand-600 text-white text-[7px] font-black uppercase rounded-sm shadow-lg">
                    Suggested
                  </div>
                )}

                <button
                  onClick={() => !batchMode && setActiveMockupId(m.id)}
                  className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                    activeMockupId === m.id ? 'border-brand-600' : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img src={m.bg} alt={m.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 backdrop-blur-sm">
                    <span className="text-[8px] font-bold text-white block truncate">{m.name}</span>
                  </div>
                </button>
              </div>
            ))}

            {vecteezyResults.length > 0 && (
              <div className="col-span-2 pt-2 border-t border-gray-800 mt-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1">
                  <Icons.Globe className="w-3 h-3" /> Vecteezy Results
                </h4>
              </div>
            )}
            {vecteezyResults.map((v) => (
              <div key={v.id} className="relative aspect-square">
                <button
                  onClick={() => !batchMode && setActiveMockupId(v.id)}
                  className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                    activeMockupId === v.id ? 'border-blue-400' : 'border-transparent hover:border-blue-500/50'
                  }`}
                >
                  <img src={v.preview_url} alt={v.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1.5 backdrop-blur-sm">
                    <span className="text-[8px] font-bold text-white block truncate">{v.title}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PanelHeader
        tabs={MOCKUP_CATEGORIES.map((cat) => ({
          id: cat,
          label: cat,
        }))}
        activeTabId={activeCategory}
        onTabChange={(id) => setActiveCategory(id)}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Icons.Magic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-200 mb-1">Smart Mockups</h4>
            <p className="text-[10px] text-blue-300/80 leading-relaxed">
              Automatically places your design onto high-quality product photos. Use the controls below to perfect the
              alignment.
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search mockups (e.g., t-shirt, phone, coffee)..."
            className="w-full bg-surface-dark-3 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-brand-600 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>
            Showing <span className="text-white font-bold">{mockups.length}</span> mockups
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPlacement({ ...placement, skewX: 0, skewY: 0, rotate: 0 })}
              className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
              title="Reset perspective"
            >
              Reset Perspective
            </button>
            <button
              onClick={() => {
                const current = getMockupById(activeMockupId);
                if (current) {
                  setPlacement(current.defaultPlacement);
                }
              }}
              className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
              title="Reset all"
            >
              Reset All
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            {searchQuery ? 'Search Results' : 'Select Mockup'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {mockups.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMockupId(m.id)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  activeMockupId === m.id
                    ? 'border-brand-600 ring-2 ring-brand-600/20'
                    : 'border-gray-800 hover:border-gray-600'
                }`}
              >
                <img src={m.bg} alt={m.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-white shadow-sm">{m.name}</span>
                </div>
                {m.category && (
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] text-gray-300">
                    {m.category}
                  </div>
                )}
              </button>
            ))}
          </div>
          {mockups.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-xs">
              <Icons.Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No mockups found for &quot;{searchQuery}&quot;</p>
              <button onClick={() => setSearchQuery('')} className="mt-2 text-brand-600 hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
