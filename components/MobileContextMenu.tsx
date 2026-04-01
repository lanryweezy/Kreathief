import React from 'react';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  layerId: string;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onLock?: () => void;
  onHide?: () => void;
}

/**
 * Mobile Context Menu - Long-press activated menu
 * Beautiful, touch-friendly context menu for layer actions
 */
export const MobileContextMenu: React.FC<MobileContextMenuProps> = ({
  isOpen,
  onClose,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onLock,
  onHide,
}) => {
  const handleAction = (action: () => void) => {
    haptics.selection();
    action();
    onClose();
  };

  const menuItems = [
    {
      icon: Icons.Copy,
      label: 'Duplicate',
      action: onDuplicate,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Icons.ArrowUp,
      label: 'Bring to Front',
      action: onBringToFront,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Icons.ArrowDown,
      label: 'Send to Back',
      action: onSendToBack,
      color: 'from-orange-500 to-yellow-500',
    },
    ...(onLock ? [{
      icon: Icons.Lock,
      label: 'Lock',
      action: onLock,
      color: 'from-purple-500 to-pink-500',
    }] : []),
    ...(onHide ? [{
      icon: Icons.EyeOff,
      label: 'Hide',
      action: onHide,
      color: 'from-gray-500 to-gray-600',
    }] : []),
    {
      icon: Icons.Trash,
      label: 'Delete',
      action: onDelete,
      color: 'from-red-500 to-red-600',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-4 right-4 z-[201] bg-gradient-to-b from-[#1a1d21] to-[#0e1318] rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Layer Actions</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Icons.X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-3">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAction(item.action)}
                  className={`
                    w-full flex items-center gap-5 px-6 py-5 rounded-2xl
                    bg-gradient-to-r ${item.color}
                    text-white font-bold text-lg
                    active:scale-95 transition-all duration-200
                    shadow-lg
                  `}
                >
                  <item.icon className="w-7 h-7" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
