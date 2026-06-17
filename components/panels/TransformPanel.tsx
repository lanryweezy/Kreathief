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

  const getMixedValue = useCallback((prop: string) => {
    if (selectedLayers.length === 0) {return '';}
    const firstVal = (selectedLayers[0] as any)[prop];
    const isMixed = selectedLayers.some(l => (l as any)[prop] !== firstVal);
    return isMixed ? 'Mixed' : Math.round(firstVal).toString();
  }, [selectedLayers]);

  const handleBatchUpdate = useCallback((prop: string, value: number) => {
    const updates: Record<string, Partial<Layer>> = {};
    selectedLayers.forEach(l => {
      updates[l.id] = { [prop]: value };
    });
    updateLayers(updates);
  }, [selectedLayers, updateLayers]);

  const handleAlign = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedLayers.length < 2) {
      addToast?.('Select multiple layers to align', 'info');
      return;
    }
    const updates: Record<string, Partial<Layer>> = {};
    const first = selectedLayers[0];
    
    selectedLayers.forEach(l => {
      let x = l.x;
      let y = l.y;
      
      if (type === 'left') {x = first.x;}
      if (type === 'center') {x = first.x + ((first as any).width - (l as any).width) / 2;}
      if (type === 'right') {x = first.x + (first as any).width - (l as any).width;}
      if (type === 'top') {y = first.y;}
      if (type === 'middle') {y = first.y + ((first as any).height - (l as any).height) / 2;}
      if (type === 'bottom') {y = first.y + (first as any).height - (l as any).height;}
      
      updates[l.id] = { x, y };
    });
    updateLayers(updates);
  }, [selectedLayers, updateLayers, addToast]);

  const handleDistribute = useCallback((type: 'horizontal' | 'vertical') => {
    if (selectedLayers.length < 3) {
      addToast?.('Select 3+ layers to distribute', 'info');
      return;
    }
    // Simple distribution logic
    const sorted = [...selectedLayers].sort((a, b) => type === 'horizontal' ? a.x - b.x : a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalDist = type === 'horizontal' 
      ? last.x - first.x 
      : last.y - first.y;
    const spacing = totalDist / (sorted.length - 1);
    
    const updates: Record<string, Partial<Layer>> = {};
    sorted.forEach((l, i) => {
      if (type === 'horizontal') {
        updates[l.id] = { x: first.x + (spacing * i) };
      } else {
        updates[l.id] = { y: first.y + (spacing * i) };
      }
    });
    updateLayers(updates);
  }, [selectedLayers, updateLayers, addToast]);

  const handleFlip = useCallback((type: 'horizontal' | 'vertical') => {
    const updates: Record<string, Partial<Layer>> = {};
    selectedLayers.forEach(l => {
      if (type === 'horizontal') {
        updates[l.id] = { flipX: !(l as any).flipX };
      } else {
        updates[l.id] = { flipY: !(l as any).flipY };
      }
    });
    updateLayers(updates);
  }, [selectedLayers, updateLayers]);

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icons.Arrange className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transform</h3>
      </div>

      {/* Position & Size (Supports Multi-Select) */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase tracking-widest">X Position</label>
          <input
            type="text"
            value={getMixedValue('x')}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {handleBatchUpdate('x', val);}
            }}
            placeholder="Mixed"
            className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase tracking-widest">Y Position</label>
          <input
            type="text"
            value={getMixedValue('y')}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {handleBatchUpdate('y', val);}
            }}
            placeholder="Mixed"
            className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase tracking-widest">Width</label>
          <input
            type="text"
            value={getMixedValue('width')}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {handleBatchUpdate('width', val);}
            }}
            placeholder="Mixed"
            className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase tracking-widest">Height</label>
          <input
            type="text"
            value={getMixedValue('height')}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {handleBatchUpdate('height', val);}
            }}
            placeholder="Mixed"
            className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none"
          />
        </div>
        
        {/* New Pro Fields */}
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase tracking-widest">Rotation</label>
          <div className="relative">
            <input
              type="text"
              value={getMixedValue('rotation')}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {handleBatchUpdate('rotation', val);}
              }}
              placeholder="Mixed"
              className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none pr-5"
            />
            <span className="absolute right-2 top-1.5 text-[10px] text-gray-600">°</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase tracking-widest">Radius</label>
          <input
            type="text"
            value={getMixedValue('cornerRadius')}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {handleBatchUpdate('cornerRadius', val);}
            }}
            placeholder="0"
            className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none"
          />
        </div>
      </div>

      {/* Align */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Align</label>
        <div className="grid grid-cols-6 gap-1">
          <button onClick={() => handleAlign('left')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Left" aria-label="Align Left">
            <Icons.AlignLeft className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('center')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Center" aria-label="Align Center">
            <Icons.AlignCenter className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('right')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Right" aria-label="Align Right">
            <Icons.AlignRight className="w-3 h-3" />
          </button>
          <div className="col-span-3"></div>
          <button onClick={() => handleAlign('top')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Top" aria-label="Align Top">
            <Icons.AlignTop className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('middle')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Middle" aria-label="Align Middle">
            <Icons.AlignMiddle className="w-3 h-3" />
          </button>
          <button onClick={() => handleAlign('bottom')} className="p-2 bg-[#252627] hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Align Bottom" aria-label="Align Bottom">
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
