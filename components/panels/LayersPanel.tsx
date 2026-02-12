
import React, { useState, useMemo } from 'react';
import { TextLayer, ShapeLayer, ImageLayer, Layer } from '../../types';
import { Icons } from '../../constants';

interface LayersPanelProps {
  textLayers: TextLayer[];
  shapeLayers: ShapeLayer[];
  imageLayers: ImageLayer[];
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
  onMove: (dir: 'forward' | 'backward') => void;
  onCopy?: () => void;
}

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
  onCopy = () => { }
}: LayerItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name || getLayerNameFallback(layer));

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
    <div
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        onSelectMultiple(e);
      }}
      className={`group relative flex items-center gap-3 p-2 border rounded cursor-pointer transition-all select-none ${isMultiSelected
        ? 'bg-[#7d2ae8]/20 border-[#7d2ae8]/50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#7d2ae8]'
        : isSelected
          ? 'bg-[#7d2ae8]/10 border-[#7d2ae8]/30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#7d2ae8]'
          : 'border-gray-800/50 hover:bg-[#252627] hover:border-gray-700'
        }`}
    >
      {/* Checkbox for multi-select */}
      <input
        type="checkbox"
        checked={isMultiSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelectMultiple(e as any);
        }}
        className="w-4 h-4 rounded cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Visibility Toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onUpdate({ visible: !layer.visible }); }}
        className={`w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-white transition-colors ${!layer.visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
      >
        {layer.visible ? <Icons.Eye className="w-3.5 h-3.5" /> : <Icons.EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* Thumbnail */}
      <div className="w-8 h-8 rounded bg-[#13161a] border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
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
            </div>

            <div className="flex items-center gap-2">
              {layer.blendMode && layer.blendMode !== 'normal' && (
                <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded uppercase font-bold tracking-wider">
                  {layer.blendMode}
                </span>
              )}
              {layer.opacity < 1 && (
                <span className="text-[9px] text-gray-600">
                  {Math.round(layer.opacity * 100)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onCopy(); }}
          className="p-1 hover:bg-blue-900/30 rounded text-gray-500 hover:text-blue-400 transition-colors"
          title="Copy (Ctrl+C)"
        >
          <Icons.Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onUpdate({ locked: !layer.locked }); }}
          className={`p-1 hover:bg-gray-600 rounded ${layer.locked ? 'text-white' : 'text-gray-500'}`}
          title={layer.locked ? "Unlock" : "Lock"}
        >
          {layer.locked ? <Icons.Unlock className="w-3.5 h-3.5" /> : <Icons.Lock className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 hover:bg-red-900/30 text-gray-500 hover:text-red-400 rounded"
          title="Delete"
        >
          <Icons.Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

export const LayersPanel = React.memo(({
  textLayers,
  shapeLayers,
  imageLayers,
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
  onBatchToggleLock = () => { }
}: LayersPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'text' | 'shape' | 'image'>('all');

  // Combine all layers with metadata
  const allLayers = useMemo(() => {
    const combined = [
      ...textLayers.map(l => ({ ...l, category: 'text' as const })),
      ...shapeLayers.map(l => ({ ...l, category: 'shape' as const })),
      ...imageLayers.map(l => ({ ...l, category: 'image' as const }))
    ];
    return combined;
  }, [textLayers, shapeLayers, imageLayers]);

  // Filter and search layers
  const filteredLayers = useMemo(() => {
    return allLayers.filter(layer => {
      const matchesFilter = filterType === 'all' || layer.category === filterType;
      const matchesSearch = !searchQuery ||
        (layer.name || getLayerNameFallback(layer)).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (layer.type === 'text' && (layer as TextLayer).text.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [allLayers, searchQuery, filterType]);

  function getLayerNameFallback(l: any) {
    if (l.type === 'text') return (l as TextLayer).text.substring(0, 20) || 'Text Layer';
    if (l.type === 'image') return 'Image Layer';
    return (l as ShapeLayer).type.charAt(0).toUpperCase() + (l as ShapeLayer).type.slice(1);
  }

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
      // Range select
      const lastSelected = Array.from(selectedLayerIds)[selectedLayerIds.size - 1];
      const lastIdx = filteredLayers.findIndex(l => l.id === lastSelected);
      const currentIdx = filteredLayers.findIndex(l => l.id === id);
      const start = Math.min(lastIdx, currentIdx);
      const end = Math.max(lastIdx, currentIdx);
      const newSelected = new Set<string>();
      for (let i = start; i <= end; i++) {
        newSelected.add(filteredLayers[i].id);
      }
      setSelectedLayerIds(newSelected);
    } else {
      setSelectedLayerIds(new Set([id]));
    }
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
      const layer = allLayers.find(l => l.id === id);
      if (!layer) return;
      if (layer.category === 'text') onUpdateTextLayer(id, { visible });
      else if (layer.category === 'shape') onUpdateShapeLayer(id, { visible });
      else if (layer.category === 'image') onUpdateImageLayer(id, { visible });
    });
  };

  const handleBatchLock = (locked: boolean) => {
    selectedLayerIds.forEach(id => {
      const layer = allLayers.find(l => l.id === id);
      if (!layer) return;
      if (layer.category === 'text') onUpdateTextLayer(id, { locked });
      else if (layer.category === 'shape') onUpdateShapeLayer(id, { locked });
      else if (layer.category === 'image') onUpdateImageLayer(id, { locked });
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
          <div className="flex gap-1">
            <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 text-xs" title="Collapse All"><Icons.MinusSquare className="w-3.5 h-3.5" /></button>
          </div>
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
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              ✕
            </button>
          )}
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

        {/* Global Actions */}
        <div className="flex bg-[#252627] rounded-lg p-1 gap-1 border border-gray-700/50">
          <button
            onClick={() => setSelectedLayerIds(new Set(filteredLayers.map(l => l.id)))}
            className="flex-1 py-1.5 hover:bg-gray-700 rounded text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 transition-colors"
            title="Select All"
          >
            <Icons.CheckSquare className="w-3 h-3" /> Select All
          </button>
          <button
            onClick={() => {
              const ids = new Set(filteredLayers.map(l => l.id));
              setSelectedLayerIds(ids);
              handleBatchLock(true);
            }}
            className="flex-1 py-1.5 hover:bg-gray-700 rounded text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 transition-colors"
            title="Lock All Visible"
          >
            <Icons.Lock className="w-3 h-3" /> Lock All
          </button>
          <button
            onClick={() => {
              const ids = new Set(filteredLayers.map(l => l.id));
              setSelectedLayerIds(ids);
              handleBatchVisibility(false);
            }}
            className="flex-1 py-1.5 hover:bg-gray-700 rounded text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 transition-colors"
            title="Hide All Visible"
          >
            <Icons.EyeOff className="w-3 h-3" /> Hide All
          </button>
        </div>

        {/* Quick Layout Tools */}
        <div className="flex bg-[#252627] rounded-lg p-1 gap-1">
          <button onClick={() => onLayoutLayers && onLayoutLayers('grid')} className="flex-1 py-1.5 hover:bg-gray-700 rounded text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 transition-colors">
            <Icons.LayoutGrid className="w-3 h-3" /> Grid
          </button>
          <button onClick={() => onLayoutLayers && onLayoutLayers('row')} className="flex-1 py-1.5 hover:bg-gray-700 rounded text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 transition-colors">
            <Icons.LayoutRow className="w-3 h-3" /> Row
          </button>
          <button onClick={() => onLayoutLayers && onLayoutLayers('col')} className="flex-1 py-1.5 hover:bg-gray-700 rounded text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 transition-colors">
            <Icons.LayoutCol className="w-3 h-3" /> Col
          </button>
        </div>

        {/* Batch Actions */}
        {selectedLayerIds.size > 0 && (
          <div className="bg-[#7d2ae8]/10 border border-[#7d2ae8]/30 rounded-lg p-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d2ae8]">{selectedLayerIds.size} selected</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleBatchVisibility(true)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                title="Show all"
              >
                <Icons.Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleBatchVisibility(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                title="Hide all"
              >
                <Icons.EyeOff className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleBatchLock(true)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                title="Lock all"
              >
                <Icons.Lock className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleBatchLock(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                title="Unlock all"
              >
                <Icons.Unlock className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleBatchDelete}
                className="p-1 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400 transition-colors"
                title="Delete all"
              >
                <Icons.Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Empty State */}
        {filteredLayers.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 opacity-30 gap-2">
            <Icons.Layers className="w-10 h-10 text-gray-500" />
            <p className="text-xs font-medium">{searchQuery ? 'No layers found' : 'Empty Canvas'}</p>
          </div>
        )}

        {/* Layers List */}
        {filteredLayers.length > 0 && (
          <div className="space-y-0.5 p-2">
            {filteredLayers.map(layer => (
              <LayerItem
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                isMultiSelected={selectedLayerIds.has(layer.id)}
                onSelect={() => onSelectLayer(layer.id)}
                onSelectMultiple={(e) => handleSelectMultiple(layer.id, e)}
                onUpdate={(c) => {
                  if (layer.category === 'text') onUpdateTextLayer(layer.id, c);
                  else if (layer.category === 'shape') onUpdateShapeLayer(layer.id, c);
                  else if (layer.category === 'image') onUpdateImageLayer(layer.id, c);
                }}
                onDelete={() => onDeleteLayer(layer.id)}
                onDuplicate={() => onDuplicateLayer(layer.id)}
                onMove={(dir) => onMoveLayer(layer.id, dir)}
                onCopy={() => onCopyLayer(layer.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
