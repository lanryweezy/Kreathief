
import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { ShapeLayer } from '../../types';
import * as geminiService from '../../services/geminiService';

interface ElementsPanelProps {
  onAddShape: (type: any, style: Partial<ShapeLayer>) => void;
  onAddImageLayer?: (src: string) => void;
}

type ShapeCategory = 'all' | 'basic' | 'geometric' | 'decorative' | 'ui';

interface ShapePreset {
  name: string;
  type: string;
  props: any;
  category: ShapeCategory;
  keywords: string[];
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ onAddShape, onAddImageLayer }) => {
  const [activeTab, setActiveTab] = useState<'shapes' | 'stickers'>('shapes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategory>('all');
  const [shapePrompt, setShapePrompt] = useState('');
  const [isGeneratingShape, setIsGeneratingShape] = useState(false);
  const [stickerPrompt, setStickerPrompt] = useState('');
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);

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

  const handleGenerateSticker = async () => {
    if (!stickerPrompt.trim() || !onAddImageLayer) return;
    setIsGeneratingSticker(true);
    try {
      const fullPrompt = `Vector art sticker of ${stickerPrompt}, white background, die-cut border, high quality, vibrant colors, isolated`;
      const base64 = await geminiService.generateImage(fullPrompt, '1:1', 'standard');
      onAddImageLayer(base64);
      setStickerPrompt('');
    } catch (e) {
      console.error(e);
      alert('Failed to generate sticker');
    } finally {
      setIsGeneratingSticker(false);
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

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shape => shape.category === selectedCategory);
    }

    // Filter by search query
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

  const shapePromptSuggestions = ['lightning bolt', 'cloud', 'wave', 'splash', 'flame'];
  const stickerPromptSuggestions = ['cute robot', 'coffee cup', 'rocket ship', 'neon star', 'pizza slice'];

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-[#13161a] sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('shapes')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'shapes' ? 'border-[#7d2ae8] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          Shapes
        </button>
        <button
          onClick={() => setActiveTab('stickers')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'stickers' ? 'border-[#7d2ae8] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          AI Stickers
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'shapes' ? (
          <>
            {/* AI Shape Generator */}
            <div className="mb-4 p-3 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4 text-amber-400" />
                AI Shape Generator
              </h4>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Describe a shape..."
                  className="flex-1 bg-[#0e1318] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#7d2ae8]"
                  value={shapePrompt}
                  onChange={(e) => setShapePrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateShape()}
                />
                <button
                  onClick={handleGenerateShape}
                  disabled={isGeneratingShape || !shapePrompt.trim()}
                  className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white px-3 py-1.5 rounded disabled:opacity-50 text-xs font-bold"
                >
                  {isGeneratingShape ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : 'Generate'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {shapePromptSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setShapePrompt(suggestion)}
                    className="text-[9px] px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded border border-indigo-500/30 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search shapes..."
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#7d2ae8] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            </div>

            {/* Category Filters */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id
                    ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-500/20'
                    : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#252627] hover:text-gray-300 border border-gray-700'
                    }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Shapes Grid */}
            {filteredShapes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {filteredShapes.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAddShape(item.type, item.props)}
                    className="aspect-square bg-[#1e1e1e] border border-gray-700 rounded-lg hover:border-[#7d2ae8] hover:bg-[#252627] flex flex-col items-center justify-center gap-1.5 transition-all group relative overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 hover:scale-105"
                  >
                    {/* Add Icon Overlay */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-4 h-4 bg-[#7d2ae8] rounded-full flex items-center justify-center">
                        <Icons.Plus className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>

                    <div
                      className="w-10 h-10 flex items-center justify-center relative z-10"
                      style={{ opacity: (item.props as any).opacity || 1 }}
                    >
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
                <p className="text-xs">No shapes found for "{searchQuery}"</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-400 block mb-2">Describe a Sticker</label>
              <textarea
                className="w-full h-20 bg-[#1e1e1e] border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-[#7d2ae8] outline-none resize-none mb-3 custom-scrollbar"
                placeholder="E.g., A cute robot cat, A cup of coffee..."
                value={stickerPrompt}
                onChange={(e) => setStickerPrompt(e.target.value)}
              />

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {stickerPromptSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setStickerPrompt(suggestion)}
                    className="text-[9px] px-2 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded border border-purple-500/30 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleGenerateSticker}
                loading={isGeneratingSticker}
                disabled={!stickerPrompt.trim()}
              >
                Generate Sticker
              </Button>
            </div>

            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Inspiration</h4>
            <div className="grid grid-cols-3 gap-2">
              {['🤖', '🌈', '🍕', '🚀', '🎸', '🌺', '💎', '🔥', '👀'].map((emoji, i) => (
                <button
                  key={i}
                  className="aspect-square bg-[#1e1e1e] rounded-lg border border-gray-700 hover:border-[#7d2ae8] hover:bg-[#252627] flex items-center justify-center text-2xl hover:scale-110 transition-all"
                  onClick={() => setStickerPrompt(prev => prev + ' ' + emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-4 bg-blue-900/20 p-2 rounded border border-blue-500/20">
              <span className="font-bold text-blue-400">Pro Tip:</span> Generated stickers come with white backgrounds. Use the "Remove BG" tool in the toolbar after adding them.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
