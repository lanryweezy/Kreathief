import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { ShapeLayer } from '../../types';
import * as geminiService from '../../services/geminiService';
import * as freepikService from '../../services/freepikService';
import * as streamlineService from '../../services/streamlineService';

interface ElementsPanelProps {
  onAddShape: (type: any, style: Partial<ShapeLayer>) => void;
  onAddImageLayer?: (src: string) => void;
}

type ShapeCategory = 'all' | 'basic' | 'geometric' | 'decorative' | 'ui';
type ActiveSource = 'shapes' | 'icons' | 'illustrations';

interface ShapePreset {
  name: string;
  type: string;
  props: any;
  category: ShapeCategory;
  keywords: string[];
}

// --- Remote icon state ---
interface RemoteIcon {
  id: string;
  name: string;
  thumbnailUrl: string;
  source: 'freepik' | 'streamline';
  hash?: string; // for streamline downloads
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ onAddShape, onAddImageLayer }) => {
  const [activeSource, setActiveSource] = useState<ActiveSource>('shapes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategory>('all');
  const [shapePrompt, setShapePrompt] = useState('');
  const [isGeneratingShape, setIsGeneratingShape] = useState(false);

  // Remote icon search state
  const [remoteIcons, setRemoteIcons] = useState<RemoteIcon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingIconId, setLoadingIconId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleGenerateShape = async () => {
    if (!shapePrompt.trim()) return;
    setIsGeneratingShape(true);
    try {
      const pathData = await geminiService.generateSVGShape(shapePrompt);
      if (pathData) {
        onAddShape('path', { pathData: pathData, color: '#7d2ae8' });
        setShapePrompt('');
      } else {
        alert("Could not generate shape path.");
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate shape');
    } finally {
      setIsGeneratingShape(false);
    }
  };

  // --- Remote icon search (debounced) ---
  const searchRemoteIcons = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setRemoteIcons([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Search both APIs in parallel
      const [freepikResult, streamlineResult] = await Promise.allSettled([
        freepikService.searchIcons(query, 12),
        streamlineService.searchIcons(query, 12),
      ]);

      const icons: RemoteIcon[] = [];

      // Add Freepik results
      if (freepikResult.status === 'fulfilled' && freepikResult.value.items.length > 0) {
        freepikResult.value.items.forEach(icon => {
          icons.push({
            id: `fp-${icon.id}`,
            name: icon.name,
            thumbnailUrl: icon.thumbnailUrl,
            source: 'freepik',
          });
        });
      }

      // Add Streamline results
      if (streamlineResult.status === 'fulfilled' && streamlineResult.value.icons.length > 0) {
        streamlineResult.value.icons.forEach((icon: any) => {
          if (icon.thumbnailUrl) {
            icons.push({
              id: `sl-${icon.id}`,
              name: icon.name,
              thumbnailUrl: icon.thumbnailUrl,
              source: 'streamline',
              hash: icon.hash,
            });
          }
        });
      }

      setRemoteIcons(icons);
    } catch (err) {
      console.error('Icon search error:', err);
      setRemoteIcons([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleRemoteSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (activeSource !== 'shapes') {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => searchRemoteIcons(query), 400);
    }
  }, [activeSource, searchRemoteIcons]);

  const handleAddRemoteIcon = async (icon: RemoteIcon) => {
    if (!onAddImageLayer) return;
    setLoadingIconId(icon.id);

    try {
      if (icon.source === 'freepik') {
        const numericId = parseInt(icon.id.replace('fp-', ''));
        const blobUrl = await freepikService.downloadIconPNG(numericId);
        if (blobUrl) {
          onAddImageLayer(blobUrl);
        } else if (icon.thumbnailUrl) {
          onAddImageLayer(icon.thumbnailUrl);
        }
      } else if (icon.source === 'streamline' && icon.hash) {
        const svgData = await streamlineService.downloadIconSVG(icon.hash, { size: 256 });
        if (svgData) {
          // Convert SVG string to a data URL
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const dataUrl = URL.createObjectURL(blob);
          onAddImageLayer(dataUrl);
        } else if (icon.thumbnailUrl) {
          onAddImageLayer(icon.thumbnailUrl);
        }
      } else if (icon.thumbnailUrl) {
        onAddImageLayer(icon.thumbnailUrl);
      }
    } catch (err) {
      console.error('Failed to add icon:', err);
      // Fallback to thumbnail
      if (icon.thumbnailUrl) onAddImageLayer(icon.thumbnailUrl);
    } finally {
      setLoadingIconId(null);
    }
  };

  const shapePresets: ShapePreset[] = [
    // Basic Shapes
    { name: "Square", type: 'rectangle', props: { width: 100, height: 100, color: '#00c4cc' }, category: 'basic', keywords: ['square', 'box', 'rect'] },
    { name: "Circle", type: 'circle', props: { width: 100, height: 100, color: '#7d2ae8' }, category: 'basic', keywords: ['circle', 'round', 'dot'] },
    { name: "Triangle", type: 'triangle', props: { width: 100, height: 100, color: '#ff00ff' }, category: 'basic', keywords: ['triangle', 'arrow'] },
    { name: "Line", type: 'rectangle', props: { width: 150, height: 4, color: '#ffffff' }, category: 'basic', keywords: ['line', 'divider', 'separator'] },

    // Geometric
    { name: "Star", type: 'star', props: { width: 100, height: 100, color: '#ffd700' }, category: 'geometric', keywords: ['star', 'rating'] },
    { name: "Hexagon", type: 'hexagon', props: { width: 100, height: 100, color: '#00ff99' }, category: 'geometric', keywords: ['hexagon', 'hex'] },
    { name: "Diamond", type: 'diamond', props: { width: 100, height: 100, color: '#ff4444' }, category: 'geometric', keywords: ['diamond', 'rhombus'] },
    { name: "Arrow", type: 'arrow', props: { width: 100, height: 60, color: '#ffffff' }, category: 'geometric', keywords: ['arrow', 'pointer'] },
    { name: "Star 4", type: 'star_4', props: { width: 100, height: 100, color: '#ffd700' }, category: 'geometric', keywords: ['star', 'sparkle'] },
    { name: "Star 8", type: 'star_8', props: { width: 100, height: 100, color: '#ffd700' }, category: 'geometric', keywords: ['star', 'burst'] },
    { name: "Pentagon", type: 'pentagon', props: { width: 100, height: 100, color: '#00ff99' }, category: 'geometric', keywords: ['pentagon', 'poly'] },
    { name: "Octagon", type: 'octagon', props: { width: 100, height: 100, color: '#ff4444' }, category: 'geometric', keywords: ['octagon', 'stop'] },
    { name: "Plus", type: 'plus', props: { width: 100, height: 100, color: '#00c4cc' }, category: 'geometric', keywords: ['plus', 'cross', 'add'] },

    // Decorative
    { name: "Heart", type: 'heart', props: { width: 100, height: 100, color: '#ff66b2' }, category: 'decorative', keywords: ['heart', 'love'] },
    { name: "Bubble", type: 'speech_bubble', props: { width: 120, height: 100, color: '#cccccc' }, category: 'decorative', keywords: ['bubble', 'speech', 'chat'] },
    { name: "Ribbon", type: 'ribbon', props: { width: 150, height: 50, color: '#ff5555' }, category: 'decorative', keywords: ['ribbon', 'banner'] },
    { name: "Shield", type: 'shield', props: { width: 100, height: 120, color: '#5555ff' }, category: 'decorative', keywords: ['shield', 'badge'] },
    { name: "Banner", type: 'banner', props: { width: 180, height: 60, color: '#55aa55' }, category: 'decorative', keywords: ['banner', 'flag'] },

    // UI Elements
    { name: "Rounded", type: 'rectangle', props: { width: 100, height: 100, color: '#3366ff', cornerRadius: 20 }, category: 'ui', keywords: ['rounded', 'square'] },
    { name: "Pill", type: 'rectangle', props: { width: 150, height: 60, color: '#ff9900', cornerRadius: 30 }, category: 'ui', keywords: ['pill', 'button', 'capsule'] },
    { name: "Frame", type: 'rectangle', props: { width: 100, height: 100, color: 'transparent', stroke: { color: '#ffffff', width: 4 } }, category: 'ui', keywords: ['frame', 'border', 'outline'] },
    { name: "Ring", type: 'circle', props: { width: 100, height: 100, color: 'transparent', stroke: { color: '#00c4cc', width: 4 } }, category: 'ui', keywords: ['ring', 'circle', 'outline'] },
    { name: "Card", type: 'rectangle', props: { width: 160, height: 100, color: '#1a1a1a', cornerRadius: 8, stroke: { color: '#333', width: 1 } }, category: 'ui', keywords: ['card', 'panel'] },
    { name: "Button", type: 'rectangle', props: { width: 120, height: 40, color: '#7d2ae8', cornerRadius: 4 }, category: 'ui', keywords: ['button', 'cta'] },
    { name: "Divider", type: 'rectangle', props: { width: 200, height: 2, color: '#666666' }, category: 'ui', keywords: ['divider', 'line', 'separator'] },
  ];

  const filteredShapes = useMemo(() => {
    let filtered = shapePresets;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shape => shape.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shape =>
        shape.name.toLowerCase().includes(query) ||
        shape.keywords.some(keyword => keyword.includes(query))
      );
    }
    return filtered;
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'all' as ShapeCategory, label: 'All', icon: Icons.Grid },
    { id: 'basic' as ShapeCategory, label: 'Basic', icon: Icons.Square },
    { id: 'geometric' as ShapeCategory, label: 'Geometric', icon: Icons.Triangle },
    { id: 'decorative' as ShapeCategory, label: 'Decorative', icon: Icons.Heart },
    { id: 'ui' as ShapeCategory, label: 'UI', icon: Icons.Layout },
  ];

  const sources = [
    { id: 'shapes' as ActiveSource, label: 'Shapes', icon: Icons.Shapes },
    { id: 'icons' as ActiveSource, label: 'Icons', icon: Icons.Star },
    { id: 'illustrations' as ActiveSource, label: 'Illustrations', icon: Icons.Image },
  ];

  const quickSearchTerms = activeSource === 'icons'
    ? ['arrow', 'star', 'heart', 'user', 'home', 'search', 'settings', 'check']
    : ['business', 'technology', 'nature', 'food', 'sport', 'music', 'travel', 'health'];

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-5">
      {/* AI Creation Hub */}
      <div className="p-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl shadow-inner">
        <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Icons.Sparkles className="w-4 h-4 text-amber-400" />
          AI Shape Generator
        </h4>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Describe a shape..."
            className="flex-1 bg-[#0e1318] border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7d2ae8] transition-all"
            value={shapePrompt}
            onChange={(e) => setShapePrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateShape()}
          />
        </div>
        <button
          onClick={handleGenerateShape}
          disabled={isGeneratingShape || !shapePrompt.trim()}
          className="w-full bg-[#7d2ae8] hover:bg-[#6b23c5] text-white py-2 rounded-lg disabled:opacity-50 text-[11px] font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
        >
          {isGeneratingShape ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div> : <Icons.Triangle className="w-3 h-3" />}
          Generate Vector Shape
        </button>
        <div className="flex flex-wrap gap-1 mt-3">
          {['lightning bolt', 'cloud', 'wave', 'coffee cup', 'rocket'].map((s, i) => (
            <button key={i} onClick={() => setShapePrompt(s)} className="text-[9px] px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full border border-white/10 transition-colors">{s}</button>
          ))}
        </div>
      </div>

      {/* Source Tabs: Shapes | Icons | Illustrations */}
      <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-xl border border-gray-800">
        {sources.map(src => (
          <button
            key={src.id}
            onClick={() => {
              setActiveSource(src.id);
              setRemoteIcons([]);
              setHasSearched(false);
              setSearchQuery('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-bold transition-all ${activeSource === src.id
              ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-500/20'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#252627]'
              }`}
          >
            <src.icon className="w-3.5 h-3.5" />
            {src.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={activeSource === 'shapes' ? 'Search shapes...' : `Search ${activeSource}...`}
          className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#7d2ae8] transition-all"
          value={searchQuery}
          onChange={(e) => handleRemoteSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && activeSource !== 'shapes') {
              searchRemoteIcons(searchQuery);
            }
          }}
        />
        <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        {isSearching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* ===== SHAPES TAB ===== */}
      {activeSource === 'shapes' && (
        <>
          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${selectedCategory === cat.id
                  ? 'bg-[#7d2ae8] text-white border-[#7d2ae8] shadow-lg shadow-purple-500/20'
                  : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#252627] hover:text-gray-300 border-gray-700'
                  }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Shapes Grid */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Library</h4>
            {filteredShapes.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {filteredShapes.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAddShape(item.type, item.props)}
                    className="aspect-square bg-[#1e1e1e] border border-gray-800 rounded-xl hover:border-[#7d2ae8] hover:bg-[#252627] flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden hover:scale-105"
                  >
                    <div className="w-10 h-10 flex items-center justify-center relative z-10" style={{ opacity: (item.props as any).opacity || 1 }}>
                      <div style={{
                        width: item.type === 'rectangle' && item.props.height < 10 ? '40px' : '28px',
                        height: item.type === 'rectangle' && item.props.height < 10 ? '4px' : '28px',
                        backgroundColor: item.props.color === 'transparent' ? 'transparent' : (item.props.color || '#fff'),
                        border: item.props.stroke ? `${Math.max(2, item.props.stroke.width / 2)}px solid ${item.props.stroke.color}` : 'none',
                        borderRadius: item.type === 'circle' ? '50%' : (item.props.cornerRadius ? '6px' : '2px'),
                        transform: item.type === 'diamond' ? 'rotate(45deg)' : 'none',
                        clipPath: item.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                          item.type === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                            item.type === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                              item.type === 'arrow' ? 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)' :
                                item.type === 'shield' ? 'polygon(50% 0, 100% 20%, 100% 70%, 50% 100%, 0 70%, 0 20%)' :
                                  item.type === 'banner' ? 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)' :
                                    item.type === 'ribbon' ? 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%, 10% 50%)' :
                                      'none'
                      }}>
                        {item.type === 'heart' && <span className="text-2xl leading-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: item.props.color }}>♥</span>}
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-500 group-hover:text-gray-300 font-medium">{item.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Icons.Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No shapes found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== ICONS & ILLUSTRATIONS TABS ===== */}
      {activeSource !== 'shapes' && (
        <div className="space-y-4">
          {/* Quick search suggestions */}
          {!hasSearched && (
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-3">
                Popular Searches
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {quickSearchTerms.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(term);
                      searchRemoteIcons(term);
                    }}
                    className="text-[10px] px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#7d2ae8] text-gray-400 hover:text-white rounded-full border border-gray-700 hover:border-[#7d2ae8] transition-all font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="mt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center">
                  {activeSource === 'icons' ? <Icons.Star className="w-8 h-8 text-purple-400 opacity-60" /> : <Icons.Image className="w-8 h-8 text-indigo-400 opacity-60" />}
                </div>
                <p className="text-xs text-gray-500 font-medium">Search {activeSource === 'icons' ? '200K+ icons' : 'illustrations'}</p>
                <p className="text-[10px] text-gray-600 mt-1">Powered by Freepik & Streamline</p>
              </div>
            </div>
          )}

          {/* Search Results */}
          {hasSearched && (
            <>
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {isSearching ? 'Searching...' : `${remoteIcons.length} results`}
                </h4>
                {remoteIcons.length > 0 && (
                  <span className="text-[9px] text-gray-600">Click to add to canvas</span>
                )}
              </div>

              {remoteIcons.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {remoteIcons.map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => handleAddRemoteIcon(icon)}
                      disabled={loadingIconId === icon.id}
                      className="aspect-square bg-[#1e1e1e] border border-gray-800 rounded-xl hover:border-[#7d2ae8] hover:bg-[#252627] flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden hover:scale-105 disabled:opacity-50"
                      title={`${icon.name} (${icon.source})`}
                    >
                      {loadingIconId === icon.id ? (
                        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <>
                          <img
                            src={icon.thumbnailUrl}
                            alt={icon.name}
                            className="w-10 h-10 object-contain"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {/* Source badge */}
                          <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${icon.source === 'freepik' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            title={icon.source === 'freepik' ? 'Freepik' : 'Streamline'}
                          />
                        </>
                      )}
                      <span className="text-[8px] text-gray-500 group-hover:text-gray-300 font-medium truncate w-full text-center px-1">
                        {icon.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="text-center py-10 text-gray-500">
                  <Icons.Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No {activeSource} found</p>
                  <p className="text-[10px] text-gray-600 mt-1">Try a different search term</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};
