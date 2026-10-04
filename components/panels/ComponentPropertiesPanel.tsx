import React from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { PanelHeader } from './PanelHeader';

export const ComponentPropertiesPanel: React.FC = () => {
  const activeArtboardId = useStore(state => state.activeArtboardId);
  const artboards = useStore(state => state.artboards);
  const selectedLayerIds = useStore(state => state.selectedLayerIds);
  const updateLayer = useStore(state => state.updateLayer);
  const markOverride = useStore((state: any) => state.markOverride);
  
  const activeArtboard = artboards.find(a => a.id === activeArtboardId);
  const selectedLayer = activeArtboard?.layers.find(l => selectedLayerIds.includes(l.id));
  
  // Only show panel if a Component Instance is selected
  if (!selectedLayer || !selectedLayer.masterId) {
    return null;
  }
  
  const handlePropertyOverride = (prop: string, value: any) => {
    markOverride(selectedLayer.id, prop);
    updateLayer(selectedLayer.id, { [prop]: value });
  };
  
  const overrides = selectedLayer.overrides || [];

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden border-l border-white/5 w-64 absolute right-[280px] top-0 bottom-0 shadow-xl z-20">
      <PanelHeader
        title="Component Instance"
        icon={<Icons.Component className="w-5 h-5 text-purple-400" />}
      />
      
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* Basic Info */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Instance of</label>
          <div className="flex items-center gap-2 p-2 bg-surface-dark-3 rounded-lg border border-white/5">
             <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                <Icons.Component className="w-3 h-3 text-purple-400" />
             </div>
             <span className="text-sm text-gray-200 truncate">{selectedLayer.name || 'Component'}</span>
          </div>
        </div>
        
        <hr className="border-white/5" />
        
        {/* Properties / Overrides */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</label>
             <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500">{overrides.length} overridden</span>
          </div>
          
          {selectedLayer.type === 'text' && (
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Text Content</label>
              <textarea
                value={(selectedLayer as any).text}
                onChange={(e) => handlePropertyOverride('text', e.target.value)}
                className="w-full bg-surface-dark-3 border border-white/10 rounded-lg p-2 text-sm text-white resize-none"
                rows={2}
              />
              {overrides.includes('text') && <span className="text-[10px] text-purple-400">Overridden</span>}
            </div>
          )}
          
          {(selectedLayer as any).color && (
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Fill Color</label>
              <div className="flex items-center gap-2">
                 <input 
                   type="color" 
                   value={(selectedLayer as any).color}
                   onChange={(e) => handlePropertyOverride('color', e.target.value)}
                   className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                 />
                 <span className="text-sm text-gray-300 font-mono">{(selectedLayer as any).color}</span>
              </div>
              {overrides.includes('color') && <span className="text-[10px] text-purple-400">Overridden</span>}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ComponentPropertiesPanel;
