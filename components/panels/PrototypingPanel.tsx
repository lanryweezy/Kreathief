import React, { useState } from 'react';
import { Icons } from '../../constants';
import { PanelHeader } from './PanelHeader';
import { useStore } from '../../store/useStore';

export const PrototypingPanel = () => {
  const selectedLayerIds = useStore(s => s.selectedLayerIds);
  const artboards = useStore(s => s.artboards);
  
  // Prototyping state
  const [interactionType, setInteractionType] = useState('on_click');
  const [navigateTarget, setNavigateTarget] = useState('');
  const [animationType, setAnimationType] = useState('smart_animate');
  
  const hasSelection = selectedLayerIds.length > 0;
  
  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      <PanelHeader title="Prototyping" icon={<Icons.Zap className="w-5 h-5 text-brand-500" />} />
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-10 space-y-6">
        
        {!hasSelection ? (
          <div className="text-center text-gray-500 text-xs mt-10">
            <Icons.MousePointer2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>Select a layer to add interactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Interaction Trigger */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Trigger</label>
              <select 
                className="w-full bg-surface-dark-4 border border-gray-700 rounded-lg text-xs p-2 text-white outline-none focus:border-brand-500"
                value={interactionType}
                onChange={e => setInteractionType(e.target.value)}
              >
                <option value="on_click">On Click</option>
                <option value="on_hover">While Hovering</option>
                <option value="on_drag">On Drag</option>
                <option value="after_delay">After Delay</option>
              </select>
            </div>
            
            {/* Action / Destination */}
            <div className="p-3 bg-surface-dark-3 border border-gray-700/50 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Icons.ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-white">Navigate To</span>
              </div>
              <select 
                className="w-full bg-surface-dark-4 border border-gray-700 rounded-lg text-xs p-2 text-white outline-none focus:border-brand-500"
                value={navigateTarget}
                onChange={e => setNavigateTarget(e.target.value)}
              >
                <option value="">Select Target Artboard...</option>
                {artboards.map(ab => (
                  <option key={ab.id} value={ab.id}>{ab.name || ab.id}</option>
                ))}
              </select>
            </div>
            
            {/* Animation Settings */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Animation</label>
              <select 
                className="w-full bg-surface-dark-4 border border-gray-700 rounded-lg text-xs p-2 text-white outline-none focus:border-brand-500"
                value={animationType}
                onChange={e => setAnimationType(e.target.value)}
              >
                <option value="instant">Instant</option>
                <option value="dissolve">Dissolve</option>
                <option value="smart_animate">Smart Animate</option>
                <option value="push">Push</option>
                <option value="slide_in">Slide In</option>
              </select>
            </div>
            
            <button className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
              <Icons.Plus className="w-4 h-4" />
              Add Interaction
            </button>
            
          </div>
        )}
      </div>
    </div>
  );
};
