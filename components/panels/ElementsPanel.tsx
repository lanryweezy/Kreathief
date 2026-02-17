import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Icons } from '../../constants';
import { ShapeLayer, ImageLayer } from '../../types';
import * as geminiService from '../../services/geminiService';
import * as freepikService from '../../services/freepikService';
import * as streamlineService from '../../services/streamlineService';
import { SHAPE_LIBRARY } from '../../constants/shapeLibrary';

import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

interface ElementsPanelProps { }

type ShapeCategory = 'all' | 'basic' | 'geometric' | 'decorative' | 'ui' | 'arrows' | 'stars';
type ActiveSource = 'shapes' | 'icons' | 'illustrations';

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
  source: 'freepik' | 'streamline';
  hash?: string;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ }) => {
  const addLayer = useStore(state => state.addLayer);
  const canvasSize = useStore(state => state.canvasSize);

  const [activeSource, setActiveSource] = useState<ActiveSource>('shapes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategory>('all');
  const [shapePrompt, setShapePrompt] = useState('');
  const [isGeneratingShape, setIsGeneratingShape] = useState(false);

  const [remoteIcons, setRemoteIcons] = useState<RemoteIcon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingIconId, setLoadingIconId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const internalAddShape = (type: any, style: Partial<ShapeLayer>) => {
    const newLayer: ShapeLayer = {
      id: uuidv4(),
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
      filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0, opacity: 1 }
    };
    addLayer(newLayer);
  };

  const internalAddImageLayer = (src: string) => {
    const newLayer: ImageLayer = {
      id: uuidv4(),
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
      filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0, opacity: 1 },
      skewX: 0,
      skewY: 0
    };
    addLayer(newLayer);
  };

  const handleGenerateShape = async () => {
    if (!shapePrompt.trim()) return;
    setIsGeneratingShape(true);
    try {
      const pathData = await geminiService.generateSVGShape(shapePrompt);
      if (pathData) {
        internalAddShape('path', { pathData: pathData, color: '#7d2ae8', name: shapePrompt });
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

  const searchRemoteIcons = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setRemoteIcons([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const [freepikResult, streamlineResult] = await Promise.allSettled([
        freepikService.searchIcons(query, 12),
        streamlineService.searchIcons(query, 12),
      ]);

      const icons: RemoteIcon[] = [];
      if (freepikResult.status === 'fulfilled' && freepikResult.value.items.length > 0) {
        freepikResult.value.items.forEach(icon => {
          icons.push({ id: `fp-${icon.id}`, name: icon.name, thumbnailUrl: icon.thumbnailUrl, source: 'freepik' });
        });
      }
      if (streamlineResult.status === 'fulfilled' && streamlineResult.value.icons.length > 0) {
        streamlineResult.value.icons.forEach((icon: any) => {
          if (icon.thumbnailUrl) {
            icons.push({ id: `sl-${icon.id}`, name: icon.name, thumbnailUrl: icon.thumbnailUrl, source: 'streamline', hash: icon.hash });
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
      } else {
        internalAddImageLayer(icon.thumbnailUrl);
      }
    } catch (err) {
      console.error('Failed to add icon:', err);
      internalAddImageLayer(icon.thumbnailUrl);
    } finally {
      setLoadingIconId(null);
    }
  };

  const shapePresets: ShapePreset[] = useMemo(() => SHAPE_LIBRARY.map(shape => ({
    name: shape.name,
    type: shape.type,
    props: shape.type === 'path' ? { pathData: shape.pathData, viewBox: shape.viewBox, color: shape.category === 'basic' ? '#00c4cc' : shape.category === 'geometric' ? '#7d2ae8' : shape.category === 'stars' ? '#f59e0b' : shape.category === 'decorative' ? '#ec4899' : '#10b981', width: 100, height: 100 } :
      shape.type === 'rectangle' ? { width: 100, height: 100, color: '#00c4cc' } :
        shape.type === 'circle' ? { width: 100, height: 100, color: '#7d2ae8' } :
          { width: 100, height: 100, color: '#ff00ff' }, // triangle
    category: shape.category as ShapeCategory,
    keywords: [shape.name.toLowerCase()],
  })), []);

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
  }, [selectedCategory, searchQuery, shapePresets]);

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
  ];

  const quickSearchTerms = activeSource === 'icons'
    ? ['arrow', 'star', 'heart', 'user', 'home', 'search', 'settings', 'check']
    : ['business', 'technology', 'nature', 'food', 'sport', 'music', 'travel', 'health'];

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-5">
      {/* AI Hub */}
      <div className="p-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl">
        <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Icons.Sparkles className="w-4 h-4 text-amber-400" /> AI Generator
        </h4>
        <div className="flex gap-2 mb-3">
          <input
            type="text" placeholder="Describe a shape..."
            className="flex-1 bg-[#0e1318] border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            value={shapePrompt} onChange={(e) => setShapePrompt(e.target.value)}
          />
        </div>
        <button
          onClick={handleGenerateShape} disabled={isGeneratingShape || !shapePrompt.trim()}
          className="w-full bg-[#7d2ae8] text-white py-2 rounded-lg text-[11px] font-bold"
        >
          {isGeneratingShape ? 'Generating...' : 'Generate Shape'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#1a1a1a] rounded-xl border border-gray-800">
        {sources.map(src => (
          <button
            key={src.id} onClick={() => { setActiveSource(src.id); setRemoteIcons([]); setHasSearched(false); setSearchQuery(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold ${activeSource === src.id ? 'bg-[#7d2ae8] text-white' : 'text-gray-500'}`}
          >
            <src.icon className="w-3.5 h-3.5" /> {src.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text" placeholder={`Search ${activeSource}...`}
          className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl py-2 pl-10 text-xs text-white focus:border-[#7d2ae8]"
          value={searchQuery} onChange={(e) => handleRemoteSearch(e.target.value)}
        />
        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      {activeSource === 'shapes' ? (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${selectedCategory === cat.id ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {filteredShapes.map((item, idx) => (
              <button
                key={idx} onClick={() => internalAddShape(item.type, item.props)}
                className="aspect-square bg-[#1e1e1e] border border-gray-800 rounded-xl hover:border-[#7d2ae8] flex flex-col items-center justify-center gap-1 group"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {item.type === 'path' ? (
                    <svg viewBox={(item.props as any).viewBox || "0 0 100 100"} width="100%" height="100%" className="w-full h-full drop-shadow-sm">
                      <path d={(item.props as any).pathData} fill={(item.props as any).color} />
                    </svg>
                  ) : (
                    <div style={{
                      width: '24px', height: item.type === 'rectangle' && (item.props as any).height < 10 ? '2px' : '24px',
                      backgroundColor: item.props.color === 'transparent' ? 'transparent' : (item.props.color || '#fff'),
                      border: item.props.stroke ? `1.5px solid ${item.props.stroke.color}` : 'none',
                      borderRadius: item.type === 'circle' ? '50%' : (item.props.cornerRadius ? '4px' : '0'),
                      transform: item.type === 'diamond' ? 'rotate(45deg)' : 'none',
                      clipPath: item.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
                    }} />
                  )}
                </div>
                <span className="text-[8px] text-gray-500 group-hover:text-gray-300 font-medium truncate w-full text-center px-1">{item.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {hasSearched ? (
            <div className="grid grid-cols-3 gap-3">
              {remoteIcons.map(icon => (
                <button
                  key={icon.id} onClick={() => handleAddRemoteIcon(icon)}
                  className="aspect-square bg-[#1e1e1e] border border-gray-800 rounded-xl hover:border-[#7d2ae8] flex items-center justify-center p-2"
                >
                  <img src={icon.thumbnailUrl} alt={icon.name} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {quickSearchTerms.map(term => (
                <button key={term} onClick={() => { setSearchQuery(term); searchRemoteIcons(term); }} className="text-[10px] px-3 py-1 bg-[#1e1e1e] text-gray-400 rounded-full border border-gray-700">
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
