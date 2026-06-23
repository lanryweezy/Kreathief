import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { Layer } from '../../types';
import { GeometryOracle } from '../../utils/geometryOracle';

interface ContextualToolbarProps {
  selectedLayerIds: string[];
  layers: Layer[];
  zoom: number;
}

export const ContextualToolbar = React.memo(({ selectedLayerIds, layers, zoom }: ContextualToolbarProps) => {
  const { updateLayer, deleteSelected, duplicateSelected, moveLayer, saveToHistory } = useStore(
    useShallow((state) => ({
      updateLayer: state.updateLayer,
      deleteSelected: state.deleteSelected,
      duplicateSelected: state.duplicateSelected,
      moveLayer: state.moveLayer,
      saveToHistory: state.saveToHistory,
    }))
  );

  const [opacity, setOpacity] = useState(1);

  // Get current selection bounds
  const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));

  useEffect(() => {
    if (selectedLayers.length === 1) {
      setOpacity(selectedLayers[0].opacity);
    }
  }, [selectedLayerIds, selectedLayers]);

  if (selectedLayerIds.length === 0) {
    return null;
  }

  const bounds = GeometryOracle.getGroupBounds(selectedLayers);

  // Position toolbar above the selection
  const toolbarTop = bounds.y - 45 / zoom;
  const toolbarLeft = bounds.x + bounds.width / 2;

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setOpacity(val);
    selectedLayerIds.forEach((id) => updateLayer(id, { opacity: val }));
  };

  const handleOpacityCommit = () => {
    saveToHistory();
  };

  return (
    <div className="flex items-center gap-1 bg-surface-dark-3/60 backdrop-blur-xl border-x border-white/5 px-3 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Opacity Control */}
      <div className="flex items-center gap-2 px-2 border-r border-white/10 mr-1">
        <Icons.Transparency className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={handleOpacityChange}
          onMouseUp={handleOpacityCommit}
          className="w-16 accent-brand-600 cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => {
            saveToHistory();
            duplicateSelected();
          }}
          icon={<Icons.Copy className="w-3.5 h-3.5" />}
          label="Duplicate"
        />

        <ToolbarButton
          onClick={() => {
            saveToHistory();
            selectedLayerIds.forEach((id) => moveLayer(id, 'front'));
          }}
          icon={<Icons.ArrowUp className="w-3.5 h-3.5" />}
          label="Bring to Front"
        />

        <ToolbarButton
          onClick={() => {
            saveToHistory();
            selectedLayerIds.forEach((id) => moveLayer(id, 'back'));
          }}
          icon={<Icons.ArrowDown className="w-3.5 h-3.5" />}
          label="Send to Back"
        />

        <div className="w-px h-4 bg-white/5 mx-1"></div>

        <ToolbarButton
          onClick={() => {
            saveToHistory();
            deleteSelected();
          }}
          icon={<Icons.Trash className="w-3.5 h-3.5" />}
          label="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
  ContextualToolbar.displayName = 'ContextualToolbar';
});

const ToolbarButton = ({ onClick, icon, label, variant = 'default' }: any) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`p-2 rounded-lg transition-all flex items-center justify-center group relative ${
      variant === 'danger'
        ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
        : 'hover:bg-white/10 text-gray-300 hover:text-white'
    }`}
    title={label}
  >
    {icon}
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
      {label}
    </span>
  </button>
);
