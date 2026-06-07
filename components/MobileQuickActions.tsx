import React, { useState } from 'react';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';
import { useStore } from '../store/useStore';

/**
 * Mobile Quick Actions Toolbar
 * Floating action button with expandable quick actions
 * Beautiful, simple, and clean design for mobile
 */
export const MobileQuickActions: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const deleteSelected = useStore((state) => state.deleteSelected);
  const duplicateSelected = useStore((state) => state.duplicateSelected);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const resetZoom = useStore((state) => state.resetZoom);
  const moveLayer = useStore((state) => state.moveLayer);

  const hasSelection = selectedLayerIds.length > 0;
  const singleSelection = selectedLayerIds.length === 1;

  const handleToggle = () => {
    haptics.medium();
    setIsExpanded(!isExpanded);
  };

  const handleAction = (action: () => void) => {
    haptics.selection();
    action();
    setIsExpanded(false);
  };

  const quickActions = [
    {
      icon: Icons.Search,
      label: 'Reset Zoom',
      action: resetZoom,
      color: 'from-blue-500 to-indigo-500',
      show: true,
    },
    {
      icon: Icons.Undo,
      label: 'Undo',
      action: undo,
      color: 'from-gray-500 to-gray-600',
      show: true,
    },
    {
      icon: Icons.Redo,
      label: 'Redo',
      action: redo,
      color: 'from-gray-500 to-gray-600',
      show: true,
    },
    {
      icon: Icons.ArrowUp,
      label: 'Bring to Front',
      action: () => singleSelection && moveLayer(selectedLayerIds[0], 'front'),
      color: 'from-emerald-500 to-teal-500',
      show: singleSelection,
    },
    {
      icon: Icons.Copy,
      label: 'Duplicate',
      action: duplicateSelected,
      color: 'from-purple-500 to-pink-500',
      show: hasSelection,
    },
    {
      icon: Icons.Trash,
      label: 'Delete',
      action: deleteSelected,
      color: 'from-red-500 to-orange-500',
      show: hasSelection,
    },
  ].filter(action => action.show);

  return (
    <div className="fixed bottom-24 right-6 z-40 md:hidden">
      {/* Quick Action Buttons */}
      <div className={`
        flex flex-col-reverse gap-3 mb-3
        transition-all duration-300 ease-out
        ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        {quickActions.map((action, index) => (
          <button
            key={action.label}
            onClick={() => handleAction(action.action)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-2xl
              bg-gradient-to-r ${action.color}
              shadow-lg shadow-black/20
              text-white font-medium text-sm
              active:scale-95 transition-all duration-200
            `}
            style={{
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
            }}
          >
            <action.icon className="w-5 h-5" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={handleToggle}
        aria-label="Quick actions"
        aria-expanded={isExpanded}
        className={`
          w-14 h-14 rounded-full
          bg-gradient-to-br from-purple-600 to-pink-600
          shadow-lg shadow-purple-500/30
          flex items-center justify-center
          text-white
          active:scale-95 transition-all duration-300
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
      >
        <Icons.Plus className="w-6 h-6" />
      </button>

      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={handleToggle}
        />
      )}
    </div>
  );
};
