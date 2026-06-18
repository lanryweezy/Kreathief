import React from 'react';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';

export const MobileTransformController: React.FC = () => {
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const updateLayer = useStore((state) => state.updateLayer);
  const nudgeLayer = useStore((state) => state.nudgeLayer);
  const artboards = useStore((state) => state.artboards);
  const activeArtboardId = useStore((state) => state.activeArtboardId);

  const selectedLayer = React.useMemo(() => {
    if (selectedLayerIds.length !== 1) {return null;}
    const artboard = artboards.find(a => a.id === activeArtboardId);
    return artboard?.layers.find(l => l.id === selectedLayerIds[0]);
  }, [selectedLayerIds, artboards, activeArtboardId]);

  if (!selectedLayer) {return null;}

  const handleNudge = (dx: number, dy: number) => {
    haptics.light();
    nudgeLayer(selectedLayer.id, dx, dy);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#1a1d21]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 flex flex-col gap-4">
        
        {/* Quick Sliders */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
               <span>Opacity</span>
               <span className="text-white">{Math.round(selectedLayer.opacity * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={selectedLayer.opacity} 
              onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 h-1.5 bg-white/5 rounded-full appearance-none"
            />
          </div>

          {selectedLayer.type === 'text' && (
             <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
                  <span>Font Size</span>
                  <span className="text-white">{(selectedLayer as any).fontSize}px</span>
                </div>
                <input 
                  type="range" min="8" max="200" step="1" 
                  value={(selectedLayer as any).fontSize} 
                  onChange={(e) => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full appearance-none"
                />
             </div>
          )}
        </div>

        <div className="flex items-center justify-between">
           {/* Nudge D-Pad */}
           <div className="flex items-center gap-1 bg-black/40 p-2 rounded-2xl border border-white/5">
              <div className="grid grid-cols-3 gap-1">
                 <div />
                 <button aria-label="Nudge up" onClick={() => handleNudge(0, -1)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg active:bg-purple-500 transition-colors">
                    <Icons.ChevronUp className="w-5 h-5 text-white" />
                 </button>
                 <div />
                 
                 <button aria-label="Nudge left" onClick={() => handleNudge(-1, 0)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg active:bg-purple-500 transition-colors">
                    <Icons.ChevronLeft className="w-5 h-5 text-white" />
                 </button>
                 <button aria-label="Nudge down" onClick={() => handleNudge(0, 1)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg active:bg-purple-500 transition-colors">
                    <Icons.ChevronDown className="w-5 h-5 text-white" />
                 </button>
                 <button aria-label="Nudge right" onClick={() => handleNudge(1, 0)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg active:bg-purple-500 transition-colors">
                    <Icons.ChevronRight className="w-5 h-5 text-white" />
                 </button>
              </div>
              <div className="flex flex-col gap-1 ml-2">
                 <button onClick={() => handleNudge(0, -10)} className="px-2 py-1 text-[8px] font-black bg-white/5 rounded text-gray-400 uppercase">x10</button>
                 <button onClick={() => handleNudge(0, 1)} className="px-2 py-1 text-[8px] font-black bg-white/5 rounded text-gray-400 uppercase">x1</button>
              </div>
           </div>

           {/* Quick Actions */}
           <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                 <button aria-label={selectedLayer.locked ? "Unlock layer" : "Lock layer"} onClick={() => updateLayer(selectedLayer.id, { locked: !selectedLayer.locked })} className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${selectedLayer.locked ? 'bg-orange-500/20 border-orange-500/30 text-orange-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    {selectedLayer.locked ? <Icons.Lock className="w-5 h-5" /> : <Icons.Unlock className="w-5 h-5" />}
                 </button>
                 <button aria-label={selectedLayer.visible ? "Hide layer" : "Show layer"} onClick={() => updateLayer(selectedLayer.id, { visible: !selectedLayer.visible })} className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${!selectedLayer.visible ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    {selectedLayer.visible ? <Icons.Eye className="w-5 h-5" /> : <Icons.EyeOff className="w-5 h-5" />}
                 </button>
              </div>
              <button 
                onClick={() => useStore.getState().deleteSelected()}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                 Delete Layer
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
