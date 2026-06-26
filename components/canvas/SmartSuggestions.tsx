import React, { useEffect, useRef } from 'react';
import { SmartSuggestion } from '../../hooks/useSmartInteraction';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Layer } from '../../types';

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  onDismiss: (id: string) => void;
  onApply: (suggestion: SmartSuggestion) => void;
  selectedIds: string[];
  layers: Layer[];
  zoom: number;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  onDismiss,
  onApply,
  selectedIds,
  layers,
  zoom,
}) => {
  const { updateLayer, saveToHistory } = useStore(
    useShallow((state) => ({
      updateLayer: state.updateLayer,
      saveToHistory: state.saveToHistory,
    }))
  );

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || selectedIds.length === 0) return;

    const selectedLayers = layers.filter(l => selectedIds.includes(l.id));
    if (selectedLayers.length === 0) return;

    const bounds = {
      x: Math.min(...selectedLayers.map(l => l.x)),
      y: Math.min(...selectedLayers.map(l => l.y)),
      width: Math.max(...selectedLayers.map(l => l.x + l.width)) - Math.min(...selectedLayers.map(l => l.x)),
      height: Math.max(...selectedLayers.map(l => l.y + l.height)) - Math.min(...selectedLayers.map(l => l.y)),
    };

    ref.current.style.left = `${(bounds.x + bounds.width / 2) * zoom}px`;
    ref.current.style.top = `${bounds.y * zoom - 40}px`;
  }, [selectedIds, layers, zoom]);

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      AlignCenter: <Icons.AlignCenter className="w-3.5 h-3.5" />,
      Spacing: <Icons.Spacing className="w-3.5 h-3.5" />,
      Group: <Icons.Group className="w-3.5 h-3.5" />,
      Layers: <Icons.Layers className="w-3.5 h-3.5" />,
      Text: <Icons.Text className="w-3.5 h-3.5" />,
      Lock: <Icons.Lock className="w-3.5 h-3.5" />,
      Scissors: <Icons.Scissors className="w-3.5 h-3.5" />,
      EyeDropper: <Icons.EyeDropper className="w-3.5 h-3.5" />,
    };
    return iconMap[iconName] || <Icons.Zap className="w-3.5 h-3.5" />;
  };

  const handleLockRatio = (layerId: string) => {
    saveToHistory();
    updateLayer(layerId, { lockProportions: true });
  };

  const handleAction = (suggestion: SmartSuggestion) => {
    if (suggestion.id === 'lock-ratio') {
      selectedIds.forEach(id => handleLockRatio(id));
    }
    onApply(suggestion);
  };

  if (suggestions.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-1 px-2 py-1 bg-surface-dark-3/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg"
      style={{ transform: 'translateX(-50%)' }}
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => handleAction(suggestion)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          {getIcon(suggestion.icon)}
          <span>{suggestion.label}</span>
        </button>
      ))}
      <button
        onClick={() => suggestions.forEach(s => onDismiss(s.id))}
        className="ml-1 p-1 text-gray-500 hover:text-gray-300 rounded"
      >
        <Icons.X className="w-3 h-3" />
      </button>
    </div>
  );
};