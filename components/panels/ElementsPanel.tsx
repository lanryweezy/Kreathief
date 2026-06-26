import { useState, useMemo, useCallback, useRef } from 'react';
import { Icons } from '../../constants';
import { ShapeLayer, ImageLayer } from '../../types';
import * as freepikService from '../../services/freepikService';
import * as streamlineService from '../../services/streamlineService';
import * as materialIconService from '../../services/materialIconService';
import * as lucideIconService from '../../services/lucideIconService';
import * as phosphorIconService from '../../services/phosphorIconService';
import * as giService from '../../services/getillustrationService';
import DOMPurify from 'dompurify';
import { SHAPE_LIBRARY } from '../../constants/shapeLibrary';
import { ElementSkeleton } from '../Skeleton';

import { useStore } from '../../store/useStore';
import { generateLayerId } from '../../utils/layers/layerUtils';
import { log } from '../../utils/log';

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
type ActiveSource = 'shapes' | 'icons' | 'illustrations' | 'material' | 'lucide' | 'phosphor';

interface ShapePreset {
  name: string;
  type: string;
  props: any;
  category: ShapeCategory;
  keywords: string[];
}

interface RemoteIcon {
  id: string;
  name: string;
  thumbnailUrl: string;
  source: 'freepik' | 'streamline' | 'material' | 'lucide' | 'phosphor' | 'gi';
  svgData?: string;
  hash?: string;
}

export const ElementsPanel = () => {
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);

  const [activeSource, setActiveSource] = useState<ActiveSource>('shapes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategory>('all');

  const [remoteIcons, setRemoteIcons] = useState<RemoteIcon[]>([]);
  const [_isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [_loadingIconId, setLoadingIconId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [recentNames, setRecentNames] = useState<string[]>(getRecentShapes);
  const [dragData, setDragData] = useState<ShapePreset | null>(null);

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

  const internalAddImageLayer = (src: string) => {
    const newLayer: ImageLayer = {
      id: generateLayerId('image'),
      type: 'image',
      name: 'Image Layer',
      src,
      x: canvasSize.width / 2 - 150,
      y: canvasSize.height / 2 - 150,
      width: 300,
      height: 300,
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

  const searchRemoteIcons = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setRemoteIcons([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    const source = activeSource;

    try {
      const searchPromises: Promise<any>[] = [];

      if (source === 'icons' || source === 'shapes' || source === 'illustrations') {
        searchPromises.push(
          freepikService.searchIcons(query, 12).then((r) => ({ type: 'freepik', data: r })),
          streamlineService.searchIcons(query, 12).then((r) => ({ type: 'streamline', data: r }))
        );
        if (source === 'illustrations' && giService.isConfigured()) {
          searchPromises.push(
            giService.searchAll(query, 15).then((r) => ({ type: 'gi', data: r }))
          );
        }
      }
      if (source === 'material') {
        searchPromises.push(materialIconService.searchIcons(query, 20).then((r) => ({ type: 'material', data: r })));
      }
      if (source === 'lucide') {
        searchPromises.push(lucideIconService.searchIcons(query, 20).then((r) => ({ type: 'lucide', data: r })));
      }
      if (source === 'phosphor') {
        searchPromises.push(phosphorIconService.searchIcons(query, 20).then((r) => ({ type: 'phosphor', data: r })));
      }

      const results = await Promise.allSettled(searchPromises);
      const icons: RemoteIcon[] = [];

      results.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        const { type, data } = result.value;
        if (type === 'freepik' && data?.items?.length > 0) {
          data.items.forEach((icon: any) => icons.push({ id: `fp-${icon.id}`, name: icon.name, thumbnailUrl: icon.thumbnailUrl, source: 'freepik' }));
        } else if (type === 'streamline' && data?.icons?.length > 0) {
          data.icons.forEach((icon: any) => { if (icon.thumbnailUrl) icons.push({ id: `sl-${icon.id}`, name: icon.name, thumbnailUrl: icon.thumbnailUrl, source: 'streamline', hash: icon.hash }); });
        } else if (type === 'material' && data?.length > 0) {
          data.forEach((icon: any) => icons.push({ id: `mi-${icon.name}`, name: icon.name, thumbnailUrl: icon.svgUrl, source: 'material' }));
        } else if (type === 'lucide' && data?.length > 0) {
          data.forEach((icon: any) => icons.push({ id: `luc-${icon.name}`, name: icon.name, thumbnailUrl: '', source: 'lucide', svgData: icon.svg }));
        } else if (type === 'phosphor' && data?.length > 0) {
          data.forEach((icon: any) => { if (icon.thumbnailUrl) icons.push({ id: `ph-${icon.name}`, name: icon.name, thumbnailUrl: '', source: 'phosphor', svgData: icon.svg }); });
        } else if (type === 'gi' && data) {
          const ills = data.illustrations || [];
          const gicons = data.icons || [];
          ills.forEach((item: any) => icons.push({ id: `gi-${item.id}`, name: item.pack?.name || 'Illustration', thumbnailUrl: item.thumbnailUrl || item.imageUrl, source: 'gi' }));
          gicons.forEach((item: any) => icons.push({ id: `gi-${item.id}`, name: item.name || item.iconPack?.name || 'Icon', thumbnailUrl: item.thumbnailUrl || item.imageUrl, source: 'gi' }));
        }
      });
      setRemoteIcons(icons);
    } catch (err) {
      log.error('[ElementsPanel] Icon search failed', err);
      setRemoteIcons([]);
    } finally {
      setIsSearching(false);
    }
  }, [activeSource]);

  const handleRemoteSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (activeSource !== 'shapes') {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => searchRemoteIcons(query), 400);
      }
    },
    [activeSource, searchRemoteIcons]
  );

  const handleAddRemoteIcon = async (icon: RemoteIcon) => {
    setLoadingIconId(icon.id);
    try {
      if (icon.source === 'freepik') {
        const numericId = parseInt(icon.id.replace('fp-', ''));
        const blobUrl = await freepikService.downloadIconPNG(numericId);
        internalAddImageLayer(blobUrl || icon.thumbnailUrl);
      } else if (icon.source === 'streamline' && icon.hash) {
        const svgData = await streamlineService.downloadIconSVG(icon.hash, { size: 256 });
        if (svgData) {
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          internalAddImageLayer(URL.createObjectURL(blob));
        } else {
          internalAddImageLayer(icon.thumbnailUrl);
        }
      } else if (icon.source === 'material') {
        const name = icon.id.replace('mi-', '');
        const svgData = await materialIconService.downloadIconSVG(name);
        if (svgData) {
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          internalAddImageLayer(URL.createObjectURL(blob));
        } else {
          internalAddImageLayer(icon.thumbnailUrl);
        }
      } else if (icon.source === 'lucide') {
        const svgData = icon.svgData || await lucideIconService.downloadIconSVG(icon.name);
        if (svgData) {
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          internalAddImageLayer(URL.createObjectURL(blob));
        }
      } else if (icon.source === 'phosphor') {
        const svgData = icon.svgData || await phosphorIconService.downloadIconSVG(icon.name);
        if (svgData) {
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          internalAddImageLayer(URL.createObjectURL(blob));
        }
      } else if (icon.source === 'gi') {
        internalAddImageLayer(icon.thumbnailUrl);
      } else {
        internalAddImageLayer(icon.thumbnailUrl);
      }
    } catch (err) {
      log.error('[ElementsPanel] Failed to add icon', err, { iconId: icon.id });
      if (icon.thumbnailUrl) internalAddImageLayer(icon.thumbnailUrl);
    } finally {
      setLoadingIconId(null);
    }
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
                : { width: 100, height: 100, color: '#ff00ff' }, // triangle
        category: shape.category as ShapeCategory,
        keywords: [shape.name.toLowerCase()],
      })),
    []
  );

  const filteredShapes = useMemo(() => {
    let filtered = shapePresets;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((shape) => shape.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (shape) => shape.name.toLowerCase().includes(query) || shape.keywords.some((keyword) => keyword.includes(query))
      );
    }
    return filtered;
  }, [selectedCategory, searchQuery, shapePresets]);

  const recentShapes = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== 'all') return [];
    return recentNames
      .map((name) => shapePresets.find((s) => s.name === name))
      .filter(Boolean) as ShapePreset[];
  }, [recentNames, shapePresets, searchQuery, selectedCategory]);

  const categories = [
    { id: 'all' as ShapeCategory, label: 'All', icon: Icons.Grid },
    { id: 'basic' as ShapeCategory, label: 'Basic', icon: Icons.Square },
    { id: 'geometric' as ShapeCategory, label: 'Geometric', icon: Icons.Triangle },
    { id: 'stars' as ShapeCategory, label: 'Stars', icon: Icons.Star },
    { id: 'arrows' as ShapeCategory, label: 'Arrows', icon: Icons.ArrowRight },
    { id: 'decorative' as ShapeCategory, label: 'Decorative', icon: Icons.Heart },
    { id: 'ui' as ShapeCategory, label: 'UI', icon: Icons.Layout },
  ];

  const sources = [
    { id: 'shapes' as ActiveSource, label: 'Shapes', icon: Icons.Shapes },
    { id: 'icons' as ActiveSource, label: 'Icons', icon: Icons.Star },
    { id: 'illustrations' as ActiveSource, label: 'Illustrations', icon: Icons.Image },
    { id: 'material' as ActiveSource, label: 'Material', icon: Icons.Layers },
    { id: 'lucide' as ActiveSource, label: 'Lucide', icon: Icons.Zap },
    { id: 'phosphor' as ActiveSource, label: 'Phosphor', icon: Icons.Sparkles },
  ];

  const quickSearchTerms =
    activeSource === 'icons'
      ? ['arrow', 'star', 'heart', 'user', 'home', 'search', 'settings', 'check']
      : activeSource === 'material'
        ? ['home', 'search', 'settings', 'person', 'delete', 'add', 'close', 'menu']
        : activeSource === 'lucide'
          ? ['arrow', 'star', 'heart', 'user', 'home', 'search', 'settings', 'check']
          : activeSource === 'phosphor'
            ? ['arrow', 'star', 'heart', 'user', 'home', 'search', 'settings', 'check']
            : ['business', 'technology', 'nature', 'food', 'sport', 'music', 'travel', 'health'];

  const handleDragStart = useCallback((e: React.DragEvent, item: ShapePreset) => {
    setDragData(item);
    e.dataTransfer.setData('application/x-shape-preset', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
    const ghost = document.createElement('div');
    ghost.style.width = '48px';
    ghost.style.height = '48px';
    ghost.style.opacity = '0.8';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 24, 24);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, []);

  const renderShapeItem = (item: ShapePreset, idx: number) => (
    <button
      key={idx}
      data-testid={`shape-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
      id={`shape-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onClick={() => internalAddShape(item.type, { ...item.props, name: item.name }, item.name)}
      className="aspect-square bg-surface-dark-3 border border-gray-800 rounded-xl hover:border-brand-600 flex flex-col items-center justify-center gap-1 group"
    >
      <div className="w-12 h-12 flex items-center justify-center">
        {item.type === 'path' ? (
          <svg
            viewBox={(item.props as any).viewBox || '0 0 100 100'}
            width="100%"
            height="100%"
            className="w-full h-full drop-shadow-sm"
          >
            <path d={(item.props as any).pathData} fill={(item.props as any).color} />
          </svg>
        ) : (
          <div
            style={{
              width: '36px',
              height: item.type === 'rectangle' && (item.props as any).height < 10 ? '3px' : '36px',
              backgroundColor:
                item.props.color === 'transparent' ? 'transparent' : item.props.color || '#fff',
              border: item.props.stroke ? `1.5px solid ${item.props.stroke.color}` : 'none',
              borderRadius: item.type === 'circle' ? '50%' : item.props.cornerRadius ? '4px' : '0',
              transform: item.type === 'diamond' ? 'rotate(45deg)' : 'none',
              clipPath: item.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
            }}
          />
        )}
      </div>
      <span className="text-[8px] text-gray-500 group-hover:text-gray-300 font-medium truncate w-full text-center px-1">
        {item.name}
      </span>
    </button>
  );

  return (
    <div
      data-testid="elements-panel"
      className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-5"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData('application/x-shape-preset');
        if (raw && dragData) {
          const rect = e.currentTarget.getBoundingClientRect();
          const preset = dragData;
          internalAddShape(preset.type, { ...preset.props, name: preset.name }, preset.name);
          setDragData(null);
        }
      }}
    >
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-dark-3 rounded-xl border border-gray-800">
        {sources.map((src) => (
          <button
            key={src.id}
            onClick={() => {
              setActiveSource(src.id);
              setRemoteIcons([]);
              setHasSearched(false);
              if (searchQuery.trim().length >= 2) {
                setTimeout(() => searchRemoteIcons(searchQuery), 0);
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold ${activeSource === src.id ? 'bg-brand-600 text-white' : 'text-gray-500'}`}
          >
            <src.icon className="w-3.5 h-3.5" /> {src.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder={`Search ${activeSource}...`}
          className="w-full bg-surface-dark-3 border border-gray-700 rounded-xl py-2 pl-10 text-xs text-white focus:border-brand-600"
          value={searchQuery}
          onChange={(e) => handleRemoteSearch(e.target.value)}
        />
        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      {activeSource === 'shapes' ? (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${selectedCategory === cat.id ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface-dark-3 border-gray-700 text-gray-400'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {recentShapes.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Recently Used</h4>
              <div className="grid grid-cols-3 gap-3">
                {recentShapes.map((item, idx) => renderShapeItem(item, idx))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {filteredShapes.map((item, idx) => renderShapeItem(item, idx))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {_isSearching ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <ElementSkeleton key={i} />
              ))}
            </div>
          ) : hasSearched ? (
            <div className="grid grid-cols-3 gap-3">
              {remoteIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => handleAddRemoteIcon(icon)}
                  className="aspect-square bg-surface-dark-3 border border-gray-800 rounded-xl hover:border-brand-600 flex items-center justify-center p-2 group"
                >
                  {icon.svgData ? (
                    <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(icon.svgData, { USE_PROFILES: { svg: true } }) }} />
                  ) : icon.thumbnailUrl ? (
                    <img
                      src={icon.thumbnailUrl}
                      alt={icon.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <span className="text-[8px] text-gray-500 text-center truncate">{icon.name}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {quickSearchTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    searchRemoteIcons(term);
                  }}
                  className="text-[10px] px-3 py-1 bg-surface-dark-3 text-gray-400 rounded-full border border-gray-700"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElementsPanel;
