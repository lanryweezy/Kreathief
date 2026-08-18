import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { ShapeLayer, ImageLayer } from '../../types';
import { iconScoutService, IconScoutAsset } from '../../services/iconScoutService';
import * as freepikService from '../../services/freepikService';
import * as materialIconService from '../../services/materialIconService';
import * as lucideIconService from '../../services/lucideIconService';
import * as phosphorIconService from '../../services/phosphorIconService';
import * as stickerService from '../../services/stickerService';
import DOMPurify from 'dompurify';
import { SHAPE_LIBRARY } from '../../constants/shapeLibrary';
import { ElementSkeleton } from '../Skeleton';
import { PanelHeader } from './PanelHeader';
import { SearchInput } from '../SearchInput';
import { AssetThumbnail } from '../AssetThumbnail';

import { useStore } from '../../store/useStore';
import { generateLayerId } from '../../utils/layers/layerUtils';
import { log } from '../../utils/log';
import { fuzzyMatch } from '../../utils/search';

const RECENT_SHAPES_KEY = 'kreathief_recent_shapes';
const MAX_RECENT = 10;

const getRecentShapes = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SHAPES_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveRecentShape = (name: string) => {
  const recent = getRecentShapes().filter((n) => n !== name);
  recent.unshift(name);
  localStorage.setItem(RECENT_SHAPES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

type ShapeCategory = 'all' | 'basic' | 'geometric' | 'decorative' | 'ui' | 'arrows' | 'stars';
type FilterCategory = 'all' | 'shapes' | '3d' | 'stickers' | 'illustrations' | 'icons';

interface ShapePreset {
  name: string;
  type: string;
  props: any;
  category: ShapeCategory;
  keywords: string[];
}

interface RemoteAsset {
  id: string;
  name: string;
  thumbnailUrl: string;
  source: string;
  assetType: 'shape' | '3d' | 'lottie' | 'svg' | 'gif' | 'icon';
  svgData?: string;
  width?: number;
  height?: number;
  url?: string;
}

export const ElementsPanel = () => {
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<FilterCategory | null>(null);

  // Curated horizontal carousels data
  const [trending3D, setTrending3D] = useState<RemoteAsset[]>([]);
  const [trendingStickers, setTrendingStickers] = useState<RemoteAsset[]>([]);
  const [trendingIllustrations, setTrendingIllustrations] = useState<RemoteAsset[]>([]);

  const [searchResults, setSearchResults] = useState<RemoteAsset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentNames, setRecentNames] = useState<string[]>(getRecentShapes);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load initial trending items for carousels
  useEffect(() => {
    let isMounted = true;
    const fetchTrendingCarousels = async () => {
      try {
        const [scout3d, stickers, freepikRes] = await Promise.allSettled([
          iconScoutService.search('3d', '3d', 1),
          stickerService.getTrendingStickers(),
          freepikService.searchIcons('illustration', 8),
        ]);

        if (!isMounted) {
          return;
        }

        if (scout3d.status === 'fulfilled' && scout3d.value.length > 0) {
          setTrending3D(
            scout3d.value.map((item) => ({
              id: `is3d-${item.uuid}`,
              name: item.name,
              thumbnailUrl: item.previewUrl,
              source: 'iconscout',
              assetType: '3d',
            }))
          );
        }

        if (stickers.status === 'fulfilled' && stickers.value.length > 0) {
          setTrendingStickers(
            stickers.value.map((st) => ({
              id: st.id,
              name: st.name,
              thumbnailUrl: st.thumbnail,
              source: st.source,
              assetType: 'gif',
              width: st.width,
              height: st.height,
              url: st.url,
            }))
          );
        }

        if (freepikRes.status === 'fulfilled' && freepikRes.value?.items?.length > 0) {
          setTrendingIllustrations(
            freepikRes.value.items.map((ic: any) => ({
              id: `fp-${ic.id}`,
              name: ic.name || 'Illustration',
              thumbnailUrl: ic.thumbnailUrl || ic.image,
              source: 'freepik',
              assetType: 'svg',
            }))
          );
        }
      } catch (err) {
        log.error('[ElementsPanel] Failed loading carousels', err);
      }
    };

    fetchTrendingCarousels();
    return () => {
      isMounted = false;
    };
  }, []);

  const internalAddShape = (type: any, style: Partial<ShapeLayer>, shapeName?: string) => {
    const newLayer: ShapeLayer = {
      id: generateLayerId(type),
      type: type as any,
      name: style.name || 'New Shape',
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      color: '#7d2ae8',
      cornerRadius: 0,
      ...style,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
    };
    addLayer(newLayer);
    if (shapeName) {
      saveRecentShape(shapeName);
      setRecentNames(getRecentShapes());
    }
  };

  const internalAddImageLayer = (src: string, name = 'Graphic Asset', w = 300, h = 300) => {
    let finalW = w;
    let finalH = h;
    if (w && h && w !== h) {
      const maxDim = 300;
      const ratio = w / h;
      if (ratio > 1) {
        finalW = maxDim;
        finalH = Math.round(maxDim / ratio);
      } else {
        finalH = maxDim;
        finalW = Math.round(maxDim * ratio);
      }
    }
    const newLayer: ImageLayer = {
      id: generateLayerId('image'),
      type: 'image',
      name,
      src,
      x: canvasSize.width / 2 - finalW / 2,
      y: canvasSize.height / 2 - finalH / 2,
      width: finalW,
      height: finalH,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
      skewX: 0,
      skewY: 0,
    };
    addLayer(newLayer);
  };

  const executeSearch = useCallback(async (query: string, filterCategory: FilterCategory) => {
    if (!query.trim() && filterCategory === 'all') {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    const q = query.trim() || 'trending';
    const results: RemoteAsset[] = [];

    try {
      const promises: Promise<any>[] = [];

      if (filterCategory === 'all' || filterCategory === '3d') {
        promises.push(
          iconScoutService.search(q, '3d').then((res) =>
            res.map((item) => ({
              id: `is3d-${item.uuid}`,
              name: item.name,
              thumbnailUrl: item.previewUrl,
              source: 'iconscout',
              assetType: '3d' as const,
            }))
          )
        );
      }

      if (filterCategory === 'all' || filterCategory === 'stickers') {
        promises.push(
          stickerService.searchStickers(q).then((res) =>
            res.map((st) => ({
              id: st.id,
              name: st.name,
              thumbnailUrl: st.thumbnail,
              source: st.source,
              assetType: 'gif' as const,
              width: st.width,
              height: st.height,
              url: st.url,
            }))
          ),
          iconScoutService.search(q, 'lottie').then((res) =>
            res.map((item) => ({
              id: `islot-${item.uuid}`,
              name: item.name,
              thumbnailUrl: item.previewUrl,
              source: 'iconscout',
              assetType: 'lottie' as const,
            }))
          )
        );
      }

      if (filterCategory === 'all' || filterCategory === 'illustrations') {
        promises.push(
          freepikService.searchIcons(q, 15).then((res) =>
            (res?.items || []).map((ic: any) => ({
              id: `fp-${ic.id}`,
              name: ic.name || 'Illustration',
              thumbnailUrl: ic.thumbnailUrl || ic.image,
              source: 'freepik',
              assetType: 'svg' as const,
            }))
          ),
          iconScoutService.search(q, 'illustration').then((res) =>
            res.map((item) => ({
              id: `isill-${item.uuid}`,
              name: item.name,
              thumbnailUrl: item.previewUrl,
              source: 'iconscout',
              assetType: 'svg' as const,
            }))
          )
        );
      }

      if (filterCategory === 'all' || filterCategory === 'icons') {
        promises.push(
          materialIconService.searchIcons(q, 10).then((res) =>
            res.map((ic) => ({
              id: `mi-${ic.name}`,
              name: ic.name,
              thumbnailUrl: ic.svgUrl,
              source: 'material',
              assetType: 'icon' as const,
            }))
          ),
          lucideIconService.searchIcons(q, 10).then((res) =>
            res.map((ic) => ({
              id: `luc-${ic.name}`,
              name: ic.name,
              thumbnailUrl: '',
              source: 'lucide',
              svgData: ic.svg,
              assetType: 'icon' as const,
            }))
          )
        );
      }

      const settled = await Promise.allSettled(promises);
      settled.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          results.push(...res.value);
        }
      });

      setSearchResults(results);
    } catch (e) {
      log.error('[ElementsPanel] Search error', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val, activeFilter);
    }, 400);
  };

  const handleFilterClick = (filter: FilterCategory) => {
    setActiveFilter(filter);
    setExpandedCategory(filter === 'all' ? null : filter);
    executeSearch(searchQuery, filter);
  };

  const shapePresets: ShapePreset[] = useMemo(
    () =>
      SHAPE_LIBRARY.map((shape) => ({
        name: shape.name,
        type: shape.type,
        props:
          shape.type === 'path'
            ? {
                pathData: shape.pathData,
                viewBox: shape.viewBox,
                color:
                  shape.category === 'basic'
                    ? '#00c4cc'
                    : shape.category === 'geometric'
                      ? '#7d2ae8'
                      : shape.category === 'stars'
                        ? '#f59e0b'
                        : shape.category === 'decorative'
                          ? '#ec4899'
                          : '#10b981',
                width: 100,
                height: 100,
              }
            : shape.type === 'rectangle'
              ? { width: 100, height: 100, color: '#00c4cc' }
              : shape.type === 'circle'
                ? { width: 100, height: 100, color: '#7d2ae8' }
                : { width: 100, height: 100, color: '#ff00ff' },
        category: shape.category as ShapeCategory,
        keywords: [shape.name.toLowerCase()],
      })),
    []
  );

  const filteredShapePresets = useMemo(() => {
    return shapePresets.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      // 🌸 Bloom: Replaced strict substring matching with fuzzyMatch for typo tolerance
      const matchesSearch =
        !searchQuery.trim() ||
        item.keywords.some((k) => fuzzyMatch(searchQuery, k)) ||
        fuzzyMatch(searchQuery, item.name);
      return matchesCategory && matchesSearch;
    });
  }, [shapePresets, selectedCategory, searchQuery]);

  const filterPills: { id: FilterCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Icons.Grid },
    { id: 'shapes', label: 'Shapes', icon: Icons.Shapes },
    { id: '3d', label: '3D Assets', icon: Icons.Box },
    { id: 'stickers', label: 'Stickers & Motion', icon: Icons.Sticker },
    { id: 'illustrations', label: 'Graphics', icon: Icons.Image },
    { id: 'icons', label: 'Icons', icon: Icons.Star },
  ];

  const handleAssetClick = (asset: RemoteAsset) => {
    if (asset.svgData) {
      const blob = new Blob([DOMPurify.sanitize(asset.svgData)], { type: 'image/svg+xml' });
      internalAddImageLayer(URL.createObjectURL(blob), asset.name);
    } else {
      internalAddImageLayer(asset.url || asset.thumbnailUrl, asset.name, asset.width || 300, asset.height || 300);
    }
  };

  const renderBadge = (type: string) => {
    const badgeColors: Record<string, string> = {
      '3d': 'bg-purple-500/80 text-white',
      lottie: 'bg-emerald-500/80 text-white',
      gif: 'bg-amber-500/80 text-white',
      svg: 'bg-blue-500/80 text-white',
      icon: 'bg-gray-700/80 text-gray-200',
    };
    return (
      <span
        className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-black uppercase rounded tracking-wider backdrop-blur-md z-10 ${
          badgeColors[type] || 'bg-gray-800 text-white'
        }`}
      >
        {type.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      <PanelHeader title="Elements" icon={<Icons.Shapes className="w-5 h-5 text-accent" />} />

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {/* Universal Search */}
        <SearchInput
          placeholder="Search shapes, 3D assets, stickers, graphics..."
          value={searchQuery}
          onChange={handleQueryChange}
          onClear={() => handleQueryChange('')}
          className="py-2.5 text-sm"
        />

        {/* Category Filter Pills (Canva Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar no-scrollbar">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleFilterClick(pill.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <pill.icon className="w-3.5 h-3.5" />
              {pill.label}
            </button>
          ))}
        </div>

        {/* SEARCH / EXPANDED CATEGORY GRID VIEW */}
        {hasSearched || searchQuery.trim() || expandedCategory ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400">
                {isSearching
                  ? 'Searching...'
                  : activeFilter === 'shapes'
                    ? `All Shapes (${filteredShapePresets.length})`
                    : `Results for "${searchQuery || expandedCategory}"`}
              </span>
              {expandedCategory && (
                <button
                  onClick={() => {
                    setExpandedCategory(null);
                    setActiveFilter('all');
                    setSearchQuery('');
                    setHasSearched(false);
                  }}
                  className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                >
                  Back to All
                </button>
              )}
            </div>

            {/* Shape Sub-category Pills if Shapes is active */}
            {activeFilter === 'shapes' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {(['all', 'basic', 'geometric', 'stars', 'arrows', 'decorative', 'ui'] as ShapeCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all shrink-0 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            )}

            {activeFilter === 'shapes' ? (
              <div className="grid grid-cols-4 gap-2">
                {filteredShapePresets.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => internalAddShape(item.type, { ...item.props, name: item.name }, item.name)}
                    className="group aspect-square bg-surface-dark-3 border border-gray-800 hover:border-accent rounded-xl flex flex-col items-center justify-center p-2 transition-all hover:scale-[1.05] cursor-pointer"
                    title={item.name}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      {item.type === 'path' ? (
                        <svg
                          viewBox={(item.props as any).viewBox || '0 0 100 100'}
                          width="100%"
                          height="100%"
                          className="w-full h-full"
                        >
                          <path d={(item.props as any).pathData} fill={(item.props as any).color} />
                        </svg>
                      ) : (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: item.props.color || '#00c4cc',
                            borderRadius: item.type === 'circle' ? '50%' : '3px',
                          }}
                        />
                      )}
                    </div>
                    <span className="text-[9px] font-medium text-gray-400 group-hover:text-white truncate max-w-full mt-1">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : isSearching ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ElementSkeleton key={i} />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {searchResults.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => handleAssetClick(asset)}
                    className="group relative aspect-square bg-surface-dark-3 border border-gray-800 hover:border-accent rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-2 transition-all hover:scale-[1.03]"
                  >
                    {renderBadge(asset.assetType)}
                    {asset.svgData ? (
                      <img
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(DOMPurify.sanitize(asset.svgData))}`}
                        alt={asset.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <AssetThumbnail
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-gray-500">No assets found matching your criteria.</div>
            )}
          </div>
        ) : (
          /* DEFAULT CANVAS-STYLE HORIZONTAL CAROUSELS */
          <div className="flex flex-col gap-6">
            {/* Lane 1: Shapes & Lines */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Icons.Shapes className="w-3.5 h-3.5 text-accent" />
                  Shapes & Primitives
                </span>
                <button
                  onClick={() => handleFilterClick('shapes')}
                  className="text-[10px] font-bold text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  See all <Icons.ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                {shapePresets.slice(0, 10).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => internalAddShape(item.type, { ...item.props, name: item.name }, item.name)}
                    className="w-16 h-16 shrink-0 bg-surface-dark-3 border border-gray-800 hover:border-accent rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.05] cursor-pointer"
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      {item.type === 'path' ? (
                        <svg
                          viewBox={(item.props as any).viewBox || '0 0 100 100'}
                          width="100%"
                          height="100%"
                          className="w-full h-full"
                        >
                          <path d={(item.props as any).pathData} fill={(item.props as any).color} />
                        </svg>
                      ) : (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: item.props.color || '#00c4cc',
                            borderRadius: item.type === 'circle' ? '50%' : '3px',
                          }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lane 2: 3D Assets (IconScout 3D) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Icons.Box className="w-3.5 h-3.5 text-purple-400" />
                  3D Assets & Objects
                </span>
                <button
                  onClick={() => handleFilterClick('3d')}
                  className="text-[10px] font-bold text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  See all <Icons.ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {trending3D.length > 0 ? (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                  {trending3D.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleAssetClick(asset)}
                      className="relative w-20 h-20 shrink-0 bg-surface-dark-3 border border-gray-800 hover:border-purple-500 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-1.5 transition-all hover:scale-[1.05]"
                    >
                      {renderBadge('3d')}
                      <AssetThumbnail
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ElementSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Lane 3: Motion & Stickers */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Icons.Sticker className="w-3.5 h-3.5 text-amber-400" />
                  Stickers & Motion
                </span>
                <button
                  onClick={() => handleFilterClick('stickers')}
                  className="text-[10px] font-bold text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  See all <Icons.ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {trendingStickers.length > 0 ? (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                  {trendingStickers.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleAssetClick(asset)}
                      className="relative w-20 h-20 shrink-0 bg-surface-dark-3 border border-gray-800 hover:border-amber-500 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-1.5 transition-all hover:scale-[1.05]"
                    >
                      {renderBadge('gif')}
                      <AssetThumbnail
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ElementSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Lane 4: Graphics & Illustrations */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Icons.Image className="w-3.5 h-3.5 text-emerald-400" />
                  Vector Graphics & Illustrations
                </span>
                <button
                  onClick={() => handleFilterClick('illustrations')}
                  className="text-[10px] font-bold text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  See all <Icons.ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {trendingIllustrations.length > 0 ? (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                  {trendingIllustrations.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleAssetClick(asset)}
                      className="relative w-20 h-20 shrink-0 bg-surface-dark-3 border border-gray-800 hover:border-emerald-500 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-1.5 transition-all hover:scale-[1.05]"
                    >
                      {renderBadge('svg')}
                      <AssetThumbnail
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ElementSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
