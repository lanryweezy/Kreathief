import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Layer } from '../../types';
import { GeometryOracle } from '../../utils/geometryOracle';

interface ContextualToolbarProps {
  selectedLayerIds: string[];
  layers: Layer[];
  zoom: number;
}

export const ContextualToolbar: React.FC<ContextualToolbarProps> = ({
  selectedLayerIds,
  layers,
  zoom,
}) => {
  const { 
    updateLayer, 
    deleteSelected, 
    duplicateSelected, 
    moveLayer,
    saveToHistory 
  } = useStore();

  const [opacity, setOpacity] = useState(1);

  // Get current selection bounds
  const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));
  
  useEffect(() => {
    if (selectedLayers.length === 1) {
      setOpacity(selectedLayers[0].opacity);
    }
  }, [selectedLayerIds, selectedLayers]);

  if (selectedLayerIds.length === 0) return null;

  const bounds = GeometryOracle.getGroupBounds(selectedLayers);
  
  // Position toolbar above the selection
  const toolbarTop = bounds.y - (45 / zoom);
  const toolbarLeft = bounds.x + (bounds.width / 2);

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setOpacity(val);
    selectedLayerIds.forEach(id => updateLayer(id, { opacity: val }));
  };

  const handleOpacityCommit = () => {
    saveToHistory();
  };

  return (
    <div 
      className="absolute z-[100] flex items-center gap-1 bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-2xl animate-fadeIn pointer-events-auto"
      style={{
        top: toolbarTop,
        left: toolbarLeft,
        transform: `translateX(-50%) scale(${Math.max(0.7, 1 / zoom)})`,
        transformOrigin: 'bottom center',
      }}
    >
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
          className="w-16 accent-[#7d2ae8] cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-0.5">
        <ToolbarButton 
          onClick={() => { saveToHistory(); duplicateSelected(); }} 
          icon={<Icons.Copy className="w-3.5 h-3.5" />} 
          label="Duplicate" 
        />
        
        <ToolbarButton 
          onClick={() => { saveToHistory(); selectedLayerIds.forEach(id => moveLayer(id, 'front')); }} 
          icon={<Icons.ArrowUp className="w-3.5 h-3.5" />} 
          label="Bring to Front" 
        />

        <ToolbarButton 
          onClick={() => { saveToHistory(); selectedLayerIds.forEach(id => moveLayer(id, 'back')); }} 
          icon={<Icons.ArrowDown className="w-3.5 h-3.5" />} 
          label="Send to Back" 
        />

        <div className="w-px h-4 bg-white/5 mx-1"></div>

        <ToolbarButton 
          onClick={() => { saveToHistory(); deleteSelected(); }} 
          icon={<Icons.Trash className="w-3.5 h-3.5" />} 
          label="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
};

const ToolbarButton = ({ onClick, icon, label, variant = 'default' }: any) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
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
