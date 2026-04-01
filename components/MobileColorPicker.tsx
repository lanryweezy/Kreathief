import React, { useState } from 'react';
import { haptics } from '../utils/haptics';
import { motion } from 'framer-motion';

interface MobileColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

/**
 * Mobile Color Picker - Touch-optimized color selection
 * Large color swatches, gradient support, recent colors
 */
export const MobileColorPicker: React.FC<MobileColorPickerProps> = ({
  value,
  onChange,
  presets = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E63946', '#457B9D', '#F77F00', '#06FFA5', '#7209B7',
    '#000000', '#FFFFFF', '#6C757D', '#343A40', '#F8F9FA',
  ],
}) => {
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent-colors');
    return saved ? JSON.parse(saved) : [];
  });

  const handleColorSelect = (color: string) => {
    haptics.selection();
    onChange(color);

    // Add to recent colors
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 8);
    setRecentColors(updated);
    localStorage.setItem('recent-colors', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Current Color */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg"
          style={{ backgroundColor: value }}
        />
        <div className="flex-1">
          <label className="text-sm font-semibold text-gray-400 mb-2 block">
            Current Color
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Native Color Picker */}
      <div>
        <label className="text-sm font-semibold text-gray-400 mb-3 block">
          Custom Color
        </label>
        <input
          type="color"
          value={value}
          onChange={(e) => handleColorSelect(e.target.value)}
          className="w-full h-16 rounded-2xl border-2 border-white/10 cursor-pointer"
        />
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div>
          <label className="text-sm font-semibold text-gray-400 mb-3 block">
            Recent Colors
          </label>
          <div className="grid grid-cols-8 gap-2">
            {recentColors.map((color, index) => (
              <motion.button
                key={`${color}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleColorSelect(color)}
                className={`
                  aspect-square rounded-xl border-2 transition-all active:scale-95
                  ${value === color ? 'border-white shadow-lg scale-110' : 'border-white/20'}
                `}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset Colors */}
      <div>
        <label className="text-sm font-semibold text-gray-400 mb-3 block">
          Preset Colors
        </label>
        <div className="grid grid-cols-5 gap-3">
          {presets.map((color, index) => (
            <motion.button
              key={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => handleColorSelect(color)}
              className={`
                aspect-square rounded-2xl border-2 transition-all active:scale-95
                ${value === color ? 'border-white shadow-lg scale-110' : 'border-white/20'}
              `}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Gradient Presets */}
      <div>
        <label className="text-sm font-semibold text-gray-400 mb-3 block">
          Gradients
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
          ].map((gradient, index) => (
            <motion.button
              key={gradient}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                haptics.selection();
                // Handle gradient selection
              }}
              className="h-16 rounded-2xl border-2 border-white/20 active:scale-95 transition-all"
              style={{ background: gradient }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
