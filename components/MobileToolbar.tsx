import React, { useState } from 'react';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface MobileToolbarProps {
  onAddText: () => void;
  onAddShape: (shape: 'rectangle' | 'circle' | 'triangle') => void;
  onAddImage: () => void;
  onDraw: () => void;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({ onAddText, onAddShape, onAddImage, onDraw }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const setCommandPaletteOpen = useStore((state) => state.setCommandPaletteOpen);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const moveLayer = useStore((state) => state.moveLayer);
  const isPenMode = useStore((state) => state.isPenMode);

  const hasSelection = selectedLayerIds.length > 0;

  const handleToolClick = (action: () => void, category?: string) => {
    haptics.selection();
    if (category) {
      setActiveCategory(activeCategory === category ? null : category);
    } else {
      action();
      setActiveCategory(null);
    }
  };

  const tools = [
    {
      id: 'search',
      icon: Icons.Search,
      label: 'Search',
      action: () => setCommandPaletteOpen(true),
      gradient: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'text',
      icon: Icons.Text,
      label: 'Text',
      action: onAddText,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'shapes',
      icon: Icons.Shapes,
      label: 'Shapes',
      category: 'shapes',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      id: 'image',
      icon: Icons.Image,
      label: 'Image',
      action: onAddImage,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 'draw',
      icon: Icons.Brush,
      label: 'Draw',
      action: onDraw,
      gradient: 'from-pink-500 to-rose-500',
    },
  ];

  const activeToolId = isPenMode ? 'draw' : activeCategory;

  const shapes = [
    { type: 'rectangle' as const, icon: Icons.Square, label: 'Square' },
    { type: 'circle' as const, icon: Icons.Circle, label: 'Circle' },
    { type: 'triangle' as const, icon: Icons.Triangle, label: 'Triangle' },
    { type: 'star' as const, icon: Icons.Star, label: 'Star' },
  ];

  return (
    <div className="fixed top-16 left-0 right-0 z-[100] md:hidden px-4">
      {/* Main Toolbar Container */}
      <div className="bg-[#1a1d21]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="flex items-center p-1 overflow-x-auto no-scrollbar">
          {tools.map((tool) => {
            const isActive = activeToolId === tool.id || activeToolId === tool.category;
            return (
              <button
                key={tool.label}
                onClick={() => handleToolClick(tool.action || (() => {}), tool.category)}
                aria-label={tool.label}
                className={`
                  flex flex-col items-center justify-center gap-1
                  min-w-[64px] h-14 rounded-xl
                  transition-all duration-300
                  active:scale-90
                  ${
                    isActive
                      ? `bg-gradient-to-br ${tool.gradient} text-white shadow-lg ring-2 ring-white/30`
                      : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                <tool.icon className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-tighter">{tool.label}</span>
              </button>
            );
          })}

          <div className="w-px h-8 bg-white/5 mx-1" />

          {hasSelection && (
            <>
              <button
                onClick={() => { haptics.light(); moveLayer(selectedLayerIds[0], 'front'); }}
                aria-label="Bring to front"
                className="flex flex-col items-center justify-center gap-1 min-w-[52px] h-14 text-emerald-400/70 active:text-emerald-400 transition-colors"
              >
                <Icons.ArrowUp className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Front</span>
              </button>
              <button
                onClick={() => { haptics.light(); moveLayer(selectedLayerIds[0], 'back'); }}
                aria-label="Send to back"
                className="flex flex-col items-center justify-center gap-1 min-w-[52px] h-14 text-emerald-400/70 active:text-emerald-400 transition-colors"
              >
                <Icons.ArrowDown className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Back</span>
              </button>
              <div className="w-px h-8 bg-white/5 mx-1" />
            </>
          )}

          <button
            onClick={() => {
              haptics.heavy();
              if (confirm('Clear all layers?')) {
                useStore.getState().setLayers([]);
              }
            }}
            aria-label="Clear all layers"
            className="flex flex-col items-center justify-center gap-1 min-w-[64px] h-14 text-red-500/50 active:text-red-500 transition-colors"
          >
            <Icons.Trash className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Clear</span>
          </button>
        </div>
      </div>

      {/* Expanded Category Submenu */}
      <AnimatePresence>
        {activeCategory === 'shapes' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mt-2"
          >
            <div className="bg-[#1a1d21]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 grid grid-cols-4 gap-2 shadow-2xl">
              {shapes.map((shape) => (
                <button
                  key={shape.type}
                  onClick={() => {
                    haptics.success();
                    onAddShape(shape.type as any);
                    setActiveCategory(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl bg-white/5 border border-white/5 active:bg-[#7d2ae8] active:border-[#7d2ae8] transition-all group"
                >
                  <shape.icon className="w-6 h-6 text-gray-400 group-active:text-white transition-colors" />
                  <span className="text-[9px] font-bold text-gray-500 group-active:text-white uppercase">
                    {shape.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
