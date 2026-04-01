import React, { useState } from 'react';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileToolbarProps {
  onAddText: () => void;
  onAddShape: (shape: 'rectangle' | 'circle' | 'triangle') => void;
  onAddImage: () => void;
  onDraw: () => void;
}

/**
 * Mobile Toolbar - Horizontal scrollable toolbar
 * Quick access to essential design tools on mobile
 */
export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  onAddText,
  onAddShape,
  onAddImage,
  onDraw,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
      icon: Icons.Text,
      label: 'Text',
      action: onAddText,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Icons.Shapes,
      label: 'Shapes',
      category: 'shapes',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Icons.Image,
      label: 'Image',
      action: onAddImage,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Icons.Pen,
      label: 'Draw',
      action: onDraw,
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const shapes = [
    { type: 'rectangle' as const, icon: Icons.Square, label: 'Rectangle' },
    { type: 'circle' as const, icon: Icons.Circle, label: 'Circle' },
    { type: 'triangle' as const, icon: Icons.Triangle, label: 'Triangle' },
  ];

  return (
    <div className="fixed top-20 left-0 right-0 z-40 md:hidden">
      {/* Main Toolbar */}
      <div className="px-4">
        <div className="bg-[#1a1d21]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tools.map((tool) => (
              <button
                key={tool.label}
                onClick={() => handleToolClick(tool.action || (() => {}), tool.category)}
                className={`
                  flex flex-col items-center justify-center gap-1.5
                  min-w-[72px] px-4 py-3 rounded-xl
                  transition-all duration-200
                  active:scale-95
                  ${activeCategory === tool.category
                    ? `bg-gradient-to-br ${tool.gradient} shadow-lg`
                    : 'bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                <tool.icon className={`w-6 h-6 ${activeCategory === tool.category ? 'text-white' : 'text-gray-300'}`} />
                <span className={`text-xs font-medium ${activeCategory === tool.category ? 'text-white' : 'text-gray-400'}`}>
                  {tool.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shape Submenu */}
      <AnimatePresence>
        {activeCategory === 'shapes' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-4 mt-2"
          >
            <div className="bg-[#1a1d21]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3">
              <div className="flex gap-2">
                {shapes.map((shape) => (
                  <button
                    key={shape.type}
                    onClick={() => {
                      haptics.selection();
                      onAddShape(shape.type);
                      setActiveCategory(null);
                    }}
                    className="flex-1 flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <shape.icon className="w-8 h-8 text-purple-400" />
                    <span className="text-xs font-medium text-gray-300">{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
