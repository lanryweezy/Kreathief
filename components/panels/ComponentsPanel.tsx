import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Layer, Artboard } from '../../types';
import { EmptyState } from '../EmptyState';

export const ComponentsPanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const convertToComponent = useStore((state) => state.convertToComponent);
  const instantiateComponent = useStore((state) => state.instantiateComponent);
  const activeArtboardId = useStore((state) => state.activeArtboardId);

  // Find all Master Components
  const masterComponents = useMemo(() => {
    const masters: Layer[] = [];
    artboards.forEach((a: Artboard) => {
      a.layers.forEach((l: Layer) => {
        if (l.componentId) {
          masters.push(l);
        }
      });
    });
    return masters;
  }, [artboards]);

  // Find selected layer to offer "Create Component" action
  const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
  const selectedLayer = activeArtboard?.layers.find((l) => selectedLayerIds.includes(l.id));
  const canCreateComponent = selectedLayer && !selectedLayer.componentId && !selectedLayer.masterId;

  const handleCreateComponent = () => {
    if (selectedLayer) {
      convertToComponent(selectedLayer.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2 uppercase">
            <Icons.LayoutGrid className="w-4 h-4 text-[#7d2ae8]" />
            Asset Library
          </h3>
          <span className="text-[10px] text-gray-500 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
            {masterComponents.length} Components
          </span>
        </div>

        {canCreateComponent && (
          <button
            onClick={handleCreateComponent}
            className="w-full bg-[#7d2ae8] hover:bg-[#6b23c5] text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7d2ae8]/20"
          >
            <Icons.Plus className="w-4 h-4" />
            Create Component from Selection
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {masterComponents.length === 0 ? (
          <EmptyState
            icon={Icons.LayoutGrid}
            title="No Components Yet"
            description="Convert any layer or group into a Master Component to reuse it across your project with global style syncing."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {masterComponents.map((master) => (
              <div
                key={master.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('componentId', master.componentId!);
                }}
                onClick={() => instantiateComponent(master.componentId!)}
                className="group relative bg-[#1c1f24] border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-[#7d2ae8] hover:bg-[#25282e] transition-all flex flex-col items-center gap-2 overflow-hidden aspect-square justify-center shadow-sm"
              >
                {/* Simplified Preview */}
                <div className="w-12 h-12 rounded-lg bg-[#0e1318] flex items-center justify-center text-[#7d2ae8] group-hover:scale-110 transition-transform">
                  {master.type === 'image' && <Icons.Image className="w-6 h-6" />}
                  {master.type === 'text' && <Icons.Text className="w-6 h-6" />}
                  {master.type !== 'image' && master.type !== 'text' && <Icons.Shapes className="w-6 h-6" />}
                </div>

                <span className="text-[10px] text-gray-400 font-bold truncate w-full text-center group-hover:text-white">
                  {master.name || 'Component'}
                </span>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icons.Plus className="w-3 h-3 text-[#7d2ae8]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-[#1a1d21] border-t border-gray-800">
        <p className="text-[10px] text-gray-500 leading-relaxed italic">
          Tip: Instances preserve text/image overrides but sync colors, shadows, and effects from the Master.
        </p>
      </div>
    </div>
  );
};

export default ComponentsPanel;
