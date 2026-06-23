import React from 'react';
import { Icons } from '../../constants';
import { Layer } from '../../types';
import { alignLayers, distributeLayers, AlignmentType, DistributionType, tidyUpLayers } from '../../utils/layoutUtils';

import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

interface ArrangePanelProps {}

export const ArrangePanel: React.FC<ArrangePanelProps> = () => {
  const {
    artboards,
    selectedLayerIds,
    canvasSize,
    updateLayers,
    moveLayer: onMoveLayer,
    showGrid,
    setShowGrid,
    snapToObjects,
    setSnapToObjects,
    snapToGrid,
    setSnapToGrid,
  } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      selectedLayerIds: state.selectedLayerIds,
      canvasSize: state.canvasSize,
      updateLayers: state.updateLayers,
      moveLayer: state.moveLayer,
      showGrid: state.showGrid,
      setShowGrid: state.setShowGrid,
      snapToObjects: state.snapToObjects,
      setSnapToObjects: state.setSnapToObjects,
      snapToGrid: state.snapToGrid,
      setSnapToGrid: state.setSnapToGrid,
    }))
  );

  const allLayers = artboards.flatMap((a) => a.layers);
  const selectedLayers = allLayers.filter((l) => selectedLayerIds.includes(l.id));
  const onUpdateLayers = updateLayers;
  const [isAspectRatioLocked, setIsAspectRatioLocked] = React.useState(true);
  const [alignToPage, setAlignToPage] = React.useState(false);

  if (selectedLayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 opacity-30">
        <Icons.Layers className="w-12 h-12 mb-4" />
        <p className="text-sm font-medium">Select a layer to arrange</p>
      </div>
    );
  }

  const isSingle = selectedLayers.length === 1;
  const firstLayer = selectedLayers[0];

  const handleAlign = (type: AlignmentType) => {
    const updatesArr = alignLayers(selectedLayers, type, canvasSize, alignToPage);
    const updates: Record<string, any> = {};
    updatesArr.forEach((u) => (updates[u.id] = u.changes));
    onUpdateLayers(updates);
  };

  const handleDistribute = (type: DistributionType) => {
    const updatesArr = distributeLayers(selectedLayers, type);
    const updates: Record<string, any> = {};
    updatesArr.forEach((u) => (updates[u.id] = u.changes));
    onUpdateLayers(updates);
  };

  const handleTidyUp = () => {
    const updatesArr = tidyUpLayers(selectedLayers);
    const updates: Record<string, any> = {};
    updatesArr.forEach((u) => (updates[u.id] = u.changes));
    onUpdateLayers(updates);
  };

  const handleInputChange = (field: keyof Layer, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return;
    }

    const updates: Record<string, any> = {};
    selectedLayers.forEach((l) => {
      const changes: any = { [field]: num };

      if (isAspectRatioLocked) {
        const ratio = l.width / ((l as any).height || l.width);
        if (field === 'width') {
          changes.height = num / ratio;
        } else if (field === 'height') {
          changes.width = num * ratio;
        }
      }

      updates[l.id] = changes;
    });
    onUpdateLayers(updates);
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
          <Icons.Layout className="w-4 h-4 text-brand-600" />
          ARRANGE
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Transform Controls */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transform</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400">X Position</span>
              <input
                type="number"
                value={Math.round(firstLayer.x)}
                onChange={(e) => handleInputChange('x', e.target.value)}
                className="w-full bg-surface-dark-2 border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:border-brand-600 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400">Y Position</span>
              <input
                type="number"
                value={Math.round(firstLayer.y)}
                onChange={(e) => handleInputChange('y', e.target.value)}
                className="w-full bg-surface-dark-2 border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:border-brand-600 outline-none"
              />
            </div>
            <div className="space-y-1.5 relative">
              <span className="text-[10px] text-gray-400">Width</span>
              <input
                type="number"
                value={Math.round(firstLayer.width)}
                onChange={(e) => handleInputChange('width', e.target.value)}
                className="w-full bg-surface-dark-2 border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:border-brand-600 outline-none"
              />
              <button
                onClick={() => setIsAspectRatioLocked(!isAspectRatioLocked)}
                className={`absolute -bottom-4 right-0 z-10 p-1 rounded transition-colors ${isAspectRatioLocked ? 'text-brand-600' : 'text-gray-600 hover:text-gray-400'}`}
                title="Lock Aspect Ratio"
              >
                {isAspectRatioLocked ? <Icons.Lock className="w-3 h-3" /> : <Icons.Unlock className="w-3 h-3" />}
              </button>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400">Height</span>
              <input
                type="number"
                value={Math.round((firstLayer as any).height || firstLayer.width)}
                onChange={(e) => handleInputChange('height' as any, e.target.value)}
                className="w-full bg-surface-dark-2 border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:border-brand-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Alignment Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Alignment</label>
            {!isSingle && (
              <div className="flex bg-surface-dark-2 p-0.5 rounded-lg border border-gray-800">
                <button
                  onClick={() => setAlignToPage(false)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${!alignToPage ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Selection
                </button>
                <button
                  onClick={() => setAlignToPage(true)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${alignToPage ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Page
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'left', icon: <Icons.AlignLeft className="w-4 h-4" />, label: 'Align Left' },
              { id: 'h-center', icon: <Icons.AlignCenter className="w-4 h-4" />, label: 'Center Horizontally' },
              { id: 'right', icon: <Icons.AlignRight className="w-4 h-4" />, label: 'Align Right' },
              { id: 'top', icon: <Icons.ArrowUp className="w-4 h-4" />, label: 'Align Top' },
              { id: 'v-center', icon: <Icons.ArrowRight className="w-4 h-4 -rotate-90" />, label: 'Center Vertically' },
              { id: 'bottom', icon: <Icons.ArrowDown className="w-4 h-4" />, label: 'Align Bottom' },
            ].map((a) => (
              <button
                key={a.id}
                onClick={() => handleAlign(a.id as AlignmentType)}
                className="flex items-center justify-center p-2.5 bg-surface-dark-3 border border-gray-800 rounded-lg hover:bg-gray-800 hover:border-gray-700 transition-all text-gray-400 hover:text-white group"
                title={a.label}
              >
                {a.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Distribution (Only if 3+ selected) */}
        {selectedLayers.length >= 3 && (
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Distribution</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDistribute('h-spacing')}
                className="flex items-center justify-center gap-2 p-2 bg-surface-dark-3 border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase"
                title="Distribute gaps horizontally"
              >
                <Icons.Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDistribute('v-spacing')}
                className="flex items-center justify-center gap-2 p-2 bg-surface-dark-3 border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase"
                title="Distribute gaps vertically"
              >
                <Icons.Rows className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDistribute('h-center')}
                className="flex items-center justify-center gap-2 p-2 bg-surface-dark-3 border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase"
                title="Distribute centers horizontally"
              >
                <Icons.AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDistribute('v-center')}
                className="flex items-center justify-center gap-2 p-2 bg-surface-dark-3 border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase"
                title="Distribute centers vertically"
              >
                <Icons.AlignCenter className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={handleTidyUp}
                className="col-span-2 flex items-center justify-center gap-2 p-2 bg-brand-600/10 border border-brand-600/30 rounded-lg hover:bg-brand-600/20 text-brand-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider"
              >
                <Icons.Magic className="w-4 h-4" /> Magic Tidy Up
              </button>
            </div>
          </div>
        )}

        {/* Layer Order */}
        {isSingle && (
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onMoveLayer(firstLayer.id, 'front')}
                className="flex items-center justify-center gap-2 p-2 bg-surface-dark-3 border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase"
              >
                Bring to Front
              </button>
              <button
                onClick={() => onMoveLayer(firstLayer.id, 'back')}
                className="flex items-center justify-center gap-2 p-2 bg-surface-dark-3 border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase"
              >
                Send to Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Snapping Toggles */}
      <div className="mt-auto p-4 border-t border-gray-800 bg-surface-dark-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Layout Aids</span>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Show Grid</span>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600"></div>
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Snap to Objects</span>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!snapToObjects}
                onChange={(e) => setSnapToObjects(e.target.checked)}
              />
              <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600"></div>
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Snap to Grid</span>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600"></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ArrangePanel;
