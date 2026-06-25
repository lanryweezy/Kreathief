import React from 'react';
import { Layer } from '../types';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';
import { useLongPress } from '../hooks/useLongPress';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

interface MobileLayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onLongPress: () => void;
  index: number;
}

/**
 * Mobile Layer Item - Touch-optimized layer list item
 * Large touch targets, swipe actions, long-press menu
 */
export const MobileLayerItem: React.FC<MobileLayerItemProps> = ({
  layer,
  isSelected,
  onSelect,
  onLongPress,
  index,
}) => {
  const longPressHandlers = useLongPress({
    onLongPress: (e) => {
      e.preventDefault();
      onLongPress();
    },
    onClick: () => {
      haptics.selection();
      onSelect();
    },
    delay: 500,
  });

  const getLayerIcon = () => {
    switch (layer.type) {
      case 'text':
        return Icons.Text;
      case 'image':
        return Icons.Image;
      case 'group':
        return Icons.Folder;
      case 'adjustment':
        return Icons.Sliders;
      default:
        return Icons.Shapes;
    }
  };

  const LayerIcon = getLayerIcon();
  const updateLayer = useStore((state) => state.updateLayer);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      {...longPressHandlers}
      className={`
        flex items-center gap-4 px-5 py-4 rounded-2xl
        transition-all duration-200
        active:scale-98
        ${
          isSelected
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
        }
      `}
    >
      {/* Layer Icon */}
      <div
        className={`
        w-12 h-12 rounded-xl flex items-center justify-center
        ${isSelected ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-white/10'}
      `}
      >
        <LayerIcon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
      </div>

      {/* Layer Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-base font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
          {String(layer.name || `${layer.type} Layer`)}
        </h4>
        <p className="text-sm text-gray-500 capitalize">{layer.type}</p>
      </div>

      {/* Visibility Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          haptics.light();
          updateLayer(layer.id, { visible: layer.visible === false });
        }}
        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
      >
        {layer.visible !== false ? (
          <Icons.Eye className="w-5 h-5 text-gray-400" />
        ) : (
          <Icons.EyeOff className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-purple-500" />
      )}
    </motion.div>
  );
};
