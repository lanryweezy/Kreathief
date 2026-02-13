
import React, { useState, useMemo } from 'react';
import { TextLayer, ShapeLayer, ImageLayer, Layer } from '../../types';
import { Icons } from '../../constants';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onDeleteLayer: (id: string) => void;
  onUpdateTextLayer: (id: string, changes: Partial<TextLayer>) => void;
  onUpdateShapeLayer: (id: string, changes: Partial<ShapeLayer>) => void;
  onUpdateImageLayer: (id: string, changes: Partial<ImageLayer>) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
  onLayoutLayers?: (type: 'grid' | 'row' | 'col') => void;
  onCopyLayer?: (id: string) => void;
  onPasteLayer?: () => void;
  onBatchDelete?: (ids: string[]) => void;
  onBatchToggleVisibility?: (ids: string[], visible: boolean) => void;
  onBatchToggleLock?: (ids: string[], locked: boolean) => void;
  onGroup?: () => void;
  onUngroup?: () => void;
}

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: () => void;
  onSelectMultiple?: (e: React.MouseEvent) => void;
  onUpdate: (changes: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: 'forward' | 'backward' | 'front' | 'back') => void;
  onCopy?: () => void;
  isGrouped?: boolean;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
}


const areLayerPropsEqual = (prev: LayerItemProps, next: LayerItemProps) => {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isMultiSelected !== next.isMultiSelected) return false;
  if (prev.isGrouped !== next.isGrouped) return false;
  if (prev.isGroupStart !== next.isGroupStart) return false;
  if (prev.isGroupEnd !== next.isGroupEnd) return false;

  const l1 = prev.layer;
  const l2 = next.layer;

  if (l1 === l2) return true;

  // Check critical fields for UI updates (ignore x,y,width,height,rotation)
  if (l1.id !== l2.id) return false;
  if (l1.name !== l2.name) return false;
  if (l1.visible !== l2.visible) return false;
  if (l1.locked !== l2.locked) return false;
  if (l1.opacity !== l2.opacity) return false;
  if (l1.blendMode !== l2.blendMode) return false;
  if (l1.type !== l2.type) return false;
  if (l1.groupId !== l2.groupId) return false;

  if (l1.type === 'text') {
    const t1 = l1 as TextLayer;
    const t2 = l2 as TextLayer;
    if (t1.text !== t2.text || t1.color !== t2.color || t1.fontFamily !== t2.fontFamily) return false;
  } else if (l1.type === 'image') {
    const i1 = l1 as ImageLayer;
    const i2 = l2 as ImageLayer;
    if (i1.src !== i2.src) return false;
  } else {
    // Must be ShapeLayer
    const s1 = l1 as ShapeLayer;
    const s2 = l2 as ShapeLayer;
    if (s1.color !== s2.color) return false;
  }

  return true;
};

const LayerItem = React.memo(({
  layer,
  isSelected,
  isMultiSelected = false,
  onSelect,
  onSelectMultiple = () => { },
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onCopy = () => { },
  isGrouped = false,
  isGroupStart = false,
  isGroupEnd = false
}: LayerItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name || getLayerNameFallback(layer));
  const [showSettings, setShowSettings] = useState(false);

  function getLayerNameFallback(l: Layer) {
    if (l.type === 'text') return (l as TextLayer).text.substring(0, 20) || 'Text Layer';
    if (l.type === 'image') return 'Image Layer';
    return (l as ShapeLayer).type.charAt(0).toUpperCase() + (l as ShapeLayer).type.slice(1);
  }

  const handleRename = () => {
    if (editName.trim()) {
      onUpdate({ name: editName });
    } else {
      setEditName(layer.name || getLayerNameFallback(layer));
    }
    setIsEditing(false);
  };

  const getThumbnail = () => {
    if (layer.type === 'image') {
      return (
        <div className="w-full h-full relative group/thumb overflow-hidden">
          <img src={(layer as ImageLayer).src} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110" />
          <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/0 transition-colors" />
        </div>
      );
    }
    if (layer.type === 'text') {
      const l = layer as TextLayer;
      return (
        <div
          className="w-full h-full flex items-center justify-center bg-[#0e1318] text-center p-0.5 overflow-hidden"
          style={{
            color: l.color,
            fontFamily: `"${l.fontFamily}", sans-serif`,
            lineHeight: 1
          }}
        >
          <span className="text-[10px] font-bold truncate tracking-tighter">
            {l.text.trim().substring(0, 3) || 'T'}
          </span>
        </div>
      );
    }

    // Shape Layer
    const l = layer as ShapeLayer;
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0e1318] p-1.5">
        <div
          className="w-full h-full transition-transform group-hover:scale-110 shadow-sm"
          style={{
            backgroundColor: l.color,
            borderRadius: l.type === 'circle' ? '50%' : l.type === 'rectangle' ? '2px' : '0',
            clipPath: l.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
            border: l.color === '#ffffff' || l.color === 'white' ? '1px solid #333' : 'none'
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div
        onClick={onSelect}
        onContextMenu={(e) => {
          e.preventDefault();
          onSelectMultiple(e);
        }}
        className={`group relative flex items-center gap-3 p-2 border-b border-gray-800/50 cursor-pointer transition-all select-none ${isMultiSelected
          ? 'bg-[#7d2ae8]/20 border-l-2 border-l-[#7d2ae8]'
          : isSelected
            ? 'bg-[#7d2ae8]/10 border-l-2 border-l-[#7d2ae8]'
            : 'hover:bg-[#252627] border-l-2 border-l-transparent'
          }`}
        style={{
          paddingLeft: isGrouped ? '24px' : '8px',
          marginBottom: isGroupEnd ? '8px' : '0'
        }}
      >
        {isGrouped && (
          <div className={`absolute left-0 w-1 bg-gray-700 ${isGroupStart ? 'top-0 rounded-tr' : ''} ${isGroupEnd ? 'bottom-0 rounded-br' : ''} h-full ml-1`}></div>
        )}

        {/* Checkbox for multi-select */}
        <input
          type="checkbox"
          checked={isMultiSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelectMultiple(e as any);
          }}
          className="w-3 h-3 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 accent-[#7d2ae8]"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Visibility Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onUpdate({ visible: !layer.visible }); }}
          className={`w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-white transition-colors ${!layer.visible ? 'opacity-100 text-gray-600' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
        >
          {layer.visible ? <Icons.Eye className="w-3.5 h-3.5" /> : <Icons.EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Thumbnail */}
        <div className="w-8 h-8 rounded bg-[#13161a] border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {getThumbnail()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="w-full bg-[#0e1318] text-white text-xs px-1 py-0.5 rounded border border-[#7d2ae8] outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs truncate font-medium ${isSelected || isMultiSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {layer.name || getLayerNameFallback(layer)}
                </span>
                {layer.locked && <Icons.Lock className="w-2.5 h-2.5 text-gray-500" />}
                {isGrouped && <span className="text-[8px] bg-gray-700 text-gray-400 px-1 rounded">GRP</span>}
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase text-gray-600 font-bold bg-gray-800 px-1 rounded">{layer.type}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions (Hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
            className={`p-1 rounded transition-colors ${showSettings ? 'bg-[#7d2ae8] text-white' : 'hover:bg-gray-700 text-gray-500'}`}
            title="Layer Settings"
          >
            <Icons.Settings className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ locked: !layer.locked }); }}
            className={`p-1 hover:bg-gray-600 rounded ${layer.locked ? 'text-[#7d2ae8]' : 'text-gray-500'}`}
            title={layer.locked ? "Unlock" : "Lock"}
          >
            {layer.locked ? <Icons.Unlock className="w-3 h-3" /> : <Icons.Lock className="w-3 h-3" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 hover:bg-red-900/30 text-gray-500 hover:text-red-400 rounded"
            title="Delete"
          >
            <Icons.Trash className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded Settings */}
      {showSettings && (
        <div className="bg-[#1a1d21] p-2 border-b border-gray-800 animate-slide-down text-[10px]" style={{ marginLeft: isGrouped ? '24px' : '0' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-500 font-bold">Opacity</label>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={layer.opacity}
                onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-500 font-bold">Blend Mode</label>
              <select
                value={layer.blendMode || 'normal'}
                onChange={(e) => onUpdate({ blendMode: e.target.value })}
                className="w-full bg-[#0e1318] border border-gray-700 rounded px-1 py-0.5 text-gray-300 focus:border-[#7d2ae8] outline-none"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
              </select>
            </div>
          </div>
          <div className="mt-2 flex gap-2 border-t border-gray-700/50 pt-2">
            <button onClick={() => onMove('forward')} className="flex-1 flex items-center justify-center gap-1 py-1 hover:bg-gray-700 rounded text-gray-400">
              <Icons.ArrowUp className="w-3 h-3" /> Fwd
            </button>
            <button onClick={() => onMove('backward')} className="flex-1 flex items-center justify-center gap-1 py-1 hover:bg-gray-700 rounded text-gray-400">
              <Icons.ArrowDown className="w-3 h-3" /> Bwd
            </button>
            <button onClick={() => onMove('front')} className="flex-1 flex items-center justify-center gap-1 py-1 hover:bg-gray-700 rounded text-gray-400">
              <Icons.ArrowUp className="w-3 h-3" /> Front
            </button>
            <button onClick={() => onMove('back')} className="flex-1 flex items-center justify-center gap-1 py-1 hover:bg-gray-700 rounded text-gray-400">
              <Icons.ArrowDown className="w-3 h-3" /> Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}, areLayerPropsEqual);

export const LayersPanel = React.memo(({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onUpdateTextLayer,
  onUpdateShapeLayer,
  onUpdateImageLayer,
  onDuplicateLayer,
  onMoveLayer,
  onLayoutLayers,
  onCopyLayer = () => { },
  onPasteLayer = () => { },
  onBatchDelete = () => { },
  onBatchToggleVisibility = () => { },
  onBatchToggleLock = () => { },
  onGroup,
  onUngroup
}: LayersPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'text' | 'shape' | 'image'>('all');

  // Filter and search layers
  // Note: We reverse layers for display so top layer is first in list
  const displayLayers = useMemo(() => {
    let result = [...layers].reverse();

    return result.filter(layer => {
      const matchesFilter = filterType === 'all' || layer.type === filterType;
      const matchesSearch = !searchQuery ||
        (layer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (layer.type === 'text' && (layer as TextLayer).text.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [layers, searchQuery, filterType]);

  // Helper to check group status for display
  const getGroupStatus = (layer: Layer, index: number, array: Layer[]) => {
    if (!layer.groupId) return { isGrouped: false };
    const isGrouped = true;
    // Since array is reversed, previous index is actually "visually above", next index is "visually below"
    const prev = array[index - 1];
    const next = array[index + 1];
    const isGroupStart = !prev || prev.groupId !== layer.groupId;
    const isGroupEnd = !next || next.groupId !== layer.groupId;
    return { isGrouped, isGroupStart, isGroupEnd };
  };

  const handleSelectMultiple = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      const newSelected = new Set(selectedLayerIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedLayerIds(newSelected);
    } else if (e.shiftKey && selectedLayerIds.size > 0) {
      // Logic for shift select needs to find index in displayLayers
      const lastSelected = Array.from(selectedLayerIds)[selectedLayerIds.size - 1];
      const lastIdx = displayLayers.findIndex(l => l.id === lastSelected);
      const currentIdx = displayLayers.findIndex(l => l.id === id);
      const start = Math.min(lastIdx, currentIdx);
      const end = Math.max(lastIdx, currentIdx);
      const newSelected = new Set<string>();
      for (let i = start; i <= end; i++) {
        if (displayLayers[i]) newSelected.add(displayLayers[i].id);
      }
      setSelectedLayerIds(newSelected);
    } else {
      setSelectedLayerIds(new Set([id]));
    }
  };

  const dispatchUpdate = (id: string, changes: any, type: string) => {
    if (type === 'text') onUpdateTextLayer(id, changes);
    else if (type === 'shape') onUpdateShapeLayer(id, changes);
    else if (type === 'image') onUpdateImageLayer(id, changes);
  };

  const handleBatchDelete = () => {
    if (selectedLayerIds.size === 0) return;
    if (window.confirm(`Delete ${selectedLayerIds.size} layer(s)?`)) {
      selectedLayerIds.forEach(id => onDeleteLayer(id));
      setSelectedLayerIds(new Set());
    }
  };

  const handleBatchVisibility = (visible: boolean) => {
    selectedLayerIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (!layer) return;
      dispatchUpdate(id, { visible }, layer.type);
    });
  };

  const handleBatchLock = (locked: boolean) => {
    selectedLayerIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (!layer) return;
      dispatchUpdate(id, { locked }, layer.type);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Header / Actions */}
      <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
            <Icons.Layers className="w-4 h-4 text-[#7d2ae8]" />
            LAYERS
          </h3>
          <span className="text-[10px] text-gray-500 font-mono bg-gray-800 px-1.5 py-0.5 rounded">{layers.length} Layers</span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e1318] border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#7d2ae8] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {(['all', 'text', 'shape', 'image'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${filterType === type ? 'bg-[#7d2ae8] text-white shadow-lg shadow-[#7d2ae8]/20' : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {type === 'all' ? 'All' : type === 'text' ? 'Text' : type === 'shape' ? 'Shapes' : 'Images'}
            </button>
          ))}
        </div>

        {/* Batch Actions */}
        {selectedLayerIds.size > 0 && (
          <div className="bg-[#7d2ae8]/10 border border-[#7d2ae8]/30 rounded-lg p-2 flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-[#7d2ae8]">{selectedLayerIds.size} selected</span>
            <div className="flex gap-1">
              <button
                onClick={() => onGroup && onGroup()}
                className="px-2 py-1 hover:bg-gray-700 rounded text-gray-400 text-[10px] font-bold uppercase"
                title="Group"
                disabled={selectedLayerIds.size < 2}
              >
                Group
              </button>
              <button
                onClick={() => onUngroup && onUngroup()}
                className="px-2 py-1 hover:bg-gray-700 rounded text-gray-400 text-[10px] font-bold uppercase"
                title="Ungroup"
              >
                Ungroup
              </button>
              <div className="w-px h-4 bg-gray-700 mx-1 self-center" />
              <button onClick={() => handleBatchVisibility(true)} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="Show"><Icons.Eye className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleBatchVisibility(false)} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="Hide"><Icons.EyeOff className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleBatchLock(true)} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="Lock"><Icons.Lock className="w-3.5 h-3.5" /></button>
              <button onClick={handleBatchDelete} className="p-1 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400" title="Delete"><Icons.Trash className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Empty State */}
        {displayLayers.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 opacity-30 gap-2">
            <Icons.Layers className="w-10 h-10 text-gray-500" />
            <p className="text-xs font-medium">{searchQuery ? 'No layers match filter' : 'Canvas is empty'}</p>
          </div>
        )}

        {/* Layers List */}
        <div className="bg-[#13161a]">
          {displayLayers.map((layer, index) => {
            const { isGrouped, isGroupStart, isGroupEnd } = getGroupStatus(layer, index, displayLayers);
            return (
              <LayerItem
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                isMultiSelected={selectedLayerIds.has(layer.id)}
                isGrouped={isGrouped}
                isGroupStart={isGroupStart}
                isGroupEnd={isGroupEnd}
                onSelect={() => onSelectLayer(layer.id)}
                onSelectMultiple={(e) => handleSelectMultiple(layer.id, e)}
                onUpdate={(c) => dispatchUpdate(layer.id, c, layer.type)}
                onDelete={() => onDeleteLayer(layer.id)}
                onDuplicate={() => onDuplicateLayer(layer.id)}
                onMove={(dir) => onMoveLayer(layer.id, dir)}
                onCopy={() => onCopyLayer && onCopyLayer(layer.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
