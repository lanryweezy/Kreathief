import React, { useCallback, useMemo } from 'react';
import { Icons } from '../../constants';
import { Layer } from '../../types';
import { useStore } from '../../store/useStore';

export const TransformPanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards) || [];
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const updateLayers = useStore((state) => state.updateLayers);
  const addToast = useStore((state) => state.addToast);

  const allLayers = useMemo(() => artboards.flatMap(a => a.layers), [artboards]);
  const selectedLayers = useMemo(() => 
    allLayers.filter(l => selectedLayerIds.includes(l.id)),
    [allLayers, selectedLayerIds]
  );

  const handleAlign = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedLayers.length < 2) {
      addToast('Select 2+ layers to align', 'warning');
      return;
    }

    const updates: Partial<Layer>[] = [];
    const reference = selectedLayers[0] as any;

    selectedLayers.forEach((layer) => {
      const update: Partial<Layer> = { id: layer.id };
      const layerAny = layer as any;

      switch (type) {
        case 'left':
          update.x = reference.x;
          break;
        case 'center':
          update.x = reference.x + (reference.width - layerAny.width) / 2;
          break;
        case 'right':
          update.x = reference.x + reference.width - layerAny.width;
          break;
        case 'top':
          update.y = reference.y;
          break;
        case 'middle':
          update.y = reference.y + (reference.height - layerAny.height) / 2;
          break;
        case 'bottom':
          update.y = reference.y + reference.height - layerAny.height;
          break;
      }
      
      updates.push(update);
    });

    updateLayers(updates);
    addToast(`Aligned ${selectedLayers.length} layers ${type}`, 'success');
  }, [selectedLayers, updateLayers, addToast]);

  const handleDistribute = useCallback((type: 'horizontal' | 'vertical') => {
    if (selectedLayers.length < 3) {
      addToast('Select 3+ layers to distribute', 'warning');
      return;
    }

    const sorted = [...selectedLayers].sort((a, b) =>
      type === 'horizontal' ? (a as any).x - (b as any).x : (a as any).y - (b as any).y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpace = type === 'horizontal'
      ? ((last as any).x + (last as any).width) - (first as any).x
      : ((last as any).y + (last as any).height) - (first as any).y;

    const totalLayerSize = sorted.reduce((sum, layer) =>
      sum + (type === 'horizontal' ? (layer as any).width : (layer as any).height), 0
    );

    const gap = (totalSpace - totalLayerSize) / (sorted.length - 1);

    const updates: Partial<Layer>[] = [];
    let currentPosition = type === 'horizontal' ? (first as any).x : (first as any).y;

    sorted.forEach((layer, index) => {
      if (index === 0) return; // Skip first layer
      
      const update: Partial<Layer> = { id: layer.id };
      const layerSize = type === 'horizontal' ? (layer as any).width : (layer as any).height;
      
      if (type === 'horizontal') {
        update.x = currentPosition + gap;
      } else {
        update.y = currentPosition + gap;
      }
      
      updates.push(update);
      currentPosition += layerSize + gap;
    });

    updateLayers(updates);
    addToast(`Distributed ${selectedLayers.length} layers ${type}`, 'success');
  }, [selectedLayers, updateLayers, addToast]);

  const handleFlip = useCallback((axis: 'horizontal' | 'vertical') => {
    if (selectedLayers.length === 0) {
      addToast('Select a layer to flip', 'warning');
      return;
    }

    const updates = selectedLayers.map(layer => ({
      id: layer.id,
      flipX: axis === 'horizontal' ? !(layer as any).flipX : (layer as any).flipX,
      flipY: axis === 'vertical' ? !(layer as any).flipY : (layer as any).flipY,
    }));

    updateLayers(updates);
    addToast(`Flipped ${selectedLayers.length} layers ${axis}`, 'success');
  }, [selectedLayers, updateLayers, addToast]);

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icons.Arrange className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transform</h3>
      </div>

      {/* Position & Size */}
      {selectedLayers.length === 1 && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">X</label>
            <input
              type="number"
              value={Math.round(selectedLayers[0].x)}
              onChange={(e) => {
                updateLayers([{ id: selectedLayers[0].id, x: parseInt(e.target.value) }]);
              }}
              className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Y</label>
            <input
              type="number"
              value={Math.round(selectedLayers[0].y)}
              onChange={(e) => {
                updateLayers([{ id: selectedLayers[0].id, y: parseInt(e.target.value) }]);
              }}
              className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Width</label>
            <input
              type="number"
              value={Math.round(selectedLayers[0].width)}
              onChange={(e) => {
                updateLayers([{ id: selectedLayers[0].id, width: parseInt(e.target.value) }]);
              }}
              className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Height</label>
            <input
              type="number"
              value={Math.round(selectedLayers[0].height)}
              onChange={(e) => {
                updateLayers([{ id: selectedLayers[0].id, height: parseInt(e.target.value) }]);
              }}
              className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* Align */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Align</label>
        <div className="grid grid-cols-6 gap-1">
          <button onClick={() => handleAlign('left')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Left">
            <Icons.AlignLeft className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('center')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Center">
            <Icons.AlignCenter className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('right')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Right">
            <Icons.AlignRight className="w-3 h-3" />
          </button>
          <div className="col-span-3"></div>
          <button onClick={() => handleAlign('top')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Top">
            <Icons.AlignTop className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('middle')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Middle">
            <Icons.AlignMiddle className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('bottom')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Bottom">
            <Icons.AlignBottom className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Distribute */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Distribute</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleDistribute('horizontal')}
            className="flex-1 py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white"
          >
            Horizontal
          </button>
          <button
            onClick={() => handleDistribute('vertical')}
            className="flex-1 py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white"
          >
            Vertical
          </button>
        </div>
      </div>

      {/* Flip */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Flip</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleFlip('horizontal')}
            className="flex-1 py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white"
          >
            Flip Horizontal
          </button>
          <button
            onClick={() => handleFlip('vertical')}
            className="flex-1 py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white"
          >
            Flip Vertical
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-3 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              // Group layers
              addToast('Grouped layers', 'success');
            }}
            disabled={selectedLayers.length < 2}
            className="py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white disabled:opacity-50"
          >
            Group
          </button>
          <button
            onClick={() => {
              // Ungroup
              addToast('Ungrouped layers', 'success');
            }}
            className="py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white"
          >
            Ungroup
          </button>
        </div>
      </div>
    </div>
  );
};
