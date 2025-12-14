
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { ShapeLayer } from '../../types';
import * as geminiService from '../../services/geminiService';

interface ElementsPanelProps {
  onAddShape: (type: any, style: Partial<ShapeLayer>) => void;
  onAddImageLayer?: (src: string) => void;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ onAddShape, onAddImageLayer }) => {
  const [activeTab, setActiveTab] = useState<'shapes' | 'stickers'>('shapes');
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

  const presets = [
      { name: "Square", type: 'rectangle', props: { width: 100, height: 100, color: '#00c4cc' } },
      { name: "Circle", type: 'circle', props: { width: 100, height: 100, color: '#7d2ae8' } },
      { name: "Triangle", type: 'triangle', props: { width: 100, height: 100, color: '#ff00ff' } },
      { name: "Star", type: 'star', props: { width: 100, height: 100, color: '#ffd700' } },
      { name: "Hexagon", type: 'hexagon', props: { width: 100, height: 100, color: '#00ff99' } },
      { name: "Diamond", type: 'diamond', props: { width: 100, height: 100, color: '#ff4444' } },
      { name: "Arrow", type: 'arrow', props: { width: 100, height: 60, color: '#ffffff' } },
      { name: "Heart", type: 'heart', props: { width: 100, height: 100, color: '#ff66b2' } },
      { name: "Bubble", type: 'speech_bubble', props: { width: 120, height: 100, color: '#cccccc' } },
      { name: "Ribbon", type: 'ribbon', props: { width: 150, height: 50, color: '#ff5555' } },
      { name: "Shield", type: 'shield', props: { width: 100, height: 120, color: '#5555ff' } },
      { name: "Banner", type: 'banner', props: { width: 180, height: 60, color: '#55aa55' } },
      
      { name: "Rounded", type: 'rectangle', props: { width: 100, height: 100, color: '#3366ff', cornerRadius: 20 } },
      { name: "Pill", type: 'rectangle', props: { width: 150, height: 60, color: '#ff9900', cornerRadius: 30 } },
      { name: "Line", type: 'rectangle', props: { width: 150, height: 4, color: '#ffffff' } },
      
      { name: "Frame", type: 'rectangle', props: { width: 100, height: 100, color: 'transparent', stroke: { color: '#ffffff', width: 4 } } },
      { name: "Ring", type: 'circle', props: { width: 100, height: 100, color: 'transparent', stroke: { color: '#00c4cc', width: 4 } } },
      
      { name: "Card", type: 'rectangle', props: { width: 160, height: 100, color: '#1a1a1a', cornerRadius: 8, stroke: { color: '#333', width: 1 } } },
      { name: "Button", type: 'rectangle', props: { width: 120, height: 40, color: '#7d2ae8', cornerRadius: 4 } },
      { name: "Divider", type: 'rectangle', props: { width: 200, height: 2, color: '#666666' } },
  ];

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
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
            {/* Custom Shape Generator */}
            <div className="mb-6 p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <Icons.Sparkles className="w-4 h-4 text-amber-400" />
                  AI Shape Generator
              </h4>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="E.g. lightning bolt, splash..." 
                    className="flex-1 bg-[#0e1318] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#7d2ae8]"
                    value={shapePrompt}
                    onChange={(e) => setShapePrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateShape()}
                  />
                  <button 
                    onClick={handleGenerateShape}
                    disabled={isGeneratingShape || !shapePrompt.trim()}
                    className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white p-1.5 rounded disabled:opacity-50"
                  >
                    {isGeneratingShape ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Icons.ArrowUp className="w-4 h-4 rotate-90" />}
                  </button>
              </div>
            </div>

            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Basic Shapes</h4>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {presets.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => onAddShape(item.type, item.props)}
                  className="aspect-square bg-[#1e1e1e] border border-gray-700 rounded-lg hover:border-gray-500 hover:bg-gray-800 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden"
                >
                  <div 
                      className="w-8 h-8 flex items-center justify-center relative z-10"
                      style={{ opacity: (item.props as any).opacity || 1 }}
                  >
                      <div style={{
                        width: item.type === 'rectangle' && item.props.height < 10 ? '32px' : '20px',
                        height: item.type === 'rectangle' && item.props.height < 10 ? '4px' : '20px',
                        backgroundColor: item.props.color === 'transparent' ? 'transparent' : (item.props.color || '#fff'),
                        border: item.props.stroke ? `${Math.max(1, item.props.stroke.width/2)}px solid ${item.props.stroke.color}` : 'none',
                        borderRadius: item.type === 'circle' ? '50%' : (item.props.cornerRadius ? '4px' : '2px'),
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
                        {item.type === 'heart' && <span className="text-lg leading-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: item.props.color }}>♥</span>}
                      </div>
                  </div>
                  <span className="text-[9px] text-gray-500 group-hover:text-gray-300">{item.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 block mb-2">Describe a Sticker</label>
              <textarea
                className="w-full h-24 bg-[#1e1e1e] border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-[#7d2ae8] outline-none resize-none mb-3 custom-scrollbar"
                placeholder="E.g., A cute robot cat, A cup of coffee, Neon lightning bolt..."
                value={stickerPrompt}
                onChange={(e) => setStickerPrompt(e.target.value)}
              />
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
                  className="aspect-square bg-[#1e1e1e] rounded border border-gray-700 hover:border-[#7d2ae8] flex items-center justify-center text-xl hover:bg-[#252627] transition-colors"
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
