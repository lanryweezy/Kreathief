import React, { useState, useMemo } from 'react';
import { TextLayer, ShapeLayer, ImageLayer, Layer } from '../../types';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

// LayerItem Component Props
interface LayerItemProps {
  layer: Layer;
  index: number;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: () => void;
  onSelectMultiple: (e: React.MouseEvent) => void;
  onUpdate: (changes: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: 'forward' | 'backward' | 'front' | 'back') => void;
  isGrouped?: boolean;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  onDrop: (draggedId: string, targetId: string, position: 'above' | 'below') => void;
  onCopy: () => void;
}

const areLayerPropsEqual = (prev: LayerItemProps, next: LayerItemProps) => {
  if (prev.isSelected !== next.isSelected) {
    return false;
  }
  if (prev.isMultiSelected !== next.isMultiSelected) {
    return false;
  }
  if (prev.isGrouped !== next.isGrouped) {
    return false;
  }
  if (prev.isGroupStart !== next.isGroupStart) {
    return false;
  }
  if (prev.isGroupEnd !== next.isGroupEnd) {
    return false;
  }
  if (prev.index !== next.index) {
    return false;
  }

  const l1 = prev.layer;
  const l2 = next.layer;

  if (l1 === l2) {
    return true;
  }

  if (l1.id !== l2.id) {
    return false;
  }
  if (l1.name !== l2.name) {
    return false;
  }
  if (l1.visible !== l2.visible) {
    return false;
  }
  if (l1.locked !== l2.locked) {
    return false;
  }
  if (l1.opacity !== l2.opacity) {
    return false;
  }
  if (l1.blendMode !== l2.blendMode) {
    return false;
  }
  if (l1.type !== l2.type) {
    return false;
  }
  if (l1.groupId !== l2.groupId) {
    return false;
  }
  if (l1.maskLayerId !== l2.maskLayerId) {
    return false;
  }

  if (l1.type === 'text') {
    const t1 = l1 as TextLayer;
    const t2 = l2 as TextLayer;
    if (t1.text !== t2.text || t1.color !== t2.color || t1.fontFamily !== t2.fontFamily) {
      return false;
    }
  } else if (l1.type === 'image') {
    const i1 = l1 as ImageLayer;
    const i2 = l2 as ImageLayer;
    if (i1.src !== i2.src) {
      return false;
    }
  } else {
    const s1 = l1 as ShapeLayer;
    const s2 = l2 as ShapeLayer;
    if (s1.color !== s2.color) {
      return false;
    }
  }

  return true;
};

const LayerItem = React.memo(
  ({
    layer,
    isSelected,
    isMultiSelected = false,
    onSelect,
    onSelectMultiple,
    onUpdate,
    onDelete,
    onDuplicate,
    isGrouped = false,
    isGroupStart = false,
    isGroupEnd = false,
    onDrop,
  }: LayerItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(layer.name || '');
    const [showSettings, setShowSettings] = useState(false);
    const [dragOver, setDragOver] = useState<'top' | 'bottom' | null>(null);

    function getLayerNameFallback(l: Layer) {
      if (l.type === 'text') {
        return (l as TextLayer).text.substring(0, 20) || 'Text Layer';
      }
      if (l.type === 'image') {
        return 'Image Layer';
      }
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
            <img
              src={(layer as ImageLayer).src}
              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
              alt=""
            />
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
              lineHeight: 1,
            }}
          >
            <span className="text-[10px] font-bold truncate tracking-tighter">
              {l.text.trim().substring(0, 3) || 'T'}
            </span>
          </div>
        );
      }
      const l = layer as ShapeLayer;
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#0e1318] p-1.5">
          <div
            className="w-full h-full transition-transform group-hover:scale-110 shadow-sm"
            style={{
              backgroundColor: l.color,
              borderRadius: l.type === 'circle' ? '50%' : l.type === 'rectangle' ? '2px' : '0',
              clipPath: l.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
              border: l.color === '#ffffff' || l.color === 'white' ? '1px solid #333' : 'none',
            }}
          />
        </div>
      );
    };

    const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData('layerId', layer.id);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        setDragOver('top');
      } else {
        setDragOver('bottom');
      }
    };

    const handleDragLeave = () => {
      setDragOver(null);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData('layerId');
      if (draggedId && draggedId !== layer.id) {
        onDrop(draggedId, layer.id, dragOver === 'top' ? 'above' : 'below');
      }
      setDragOver(null);
    };

    return (
      <div className="flex flex-col">
        <div
          draggable={!layer.locked && !isEditing}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
            marginBottom: isGroupEnd ? '8px' : '0',
            borderTop: dragOver === 'top' ? '2px solid #7d2ae8' : undefined,
            borderBottom: dragOver === 'bottom' ? '2px solid #7d2ae8' : '1px solid rgba(31, 41, 55, 0.5)',
          }}
        >
          {isGrouped && (
            <div
              className={`absolute left-0 w-1 bg-gray-700 ${isGroupStart ? 'top-0 rounded-tr' : ''} ${isGroupEnd ? 'bottom-0 rounded-br' : ''} h-full ml-1`}
            ></div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="cursor-grab active:cursor-grabbing text-gray-700 group-hover:text-gray-500 transition-colors">
              <Icons.MoreVertical className="w-3 h-3 -mr-1" />
              <Icons.MoreVertical className="w-3 h-3 -ml-1" />
            </div>
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
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ visible: !layer.visible });
            }}
            className={`w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-white transition-colors ${!layer.visible ? 'opacity-100 text-gray-600' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
            title={layer.visible ? 'Hide Layer' : 'Show Layer'}
          >
            {layer.visible ? <Icons.Eye className="w-3.5 h-3.5" /> : <Icons.EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ locked: !layer.locked });
            }}
            className={`w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-white transition-colors ${layer.locked ? 'opacity-100 text-[#7d2ae8]' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
            title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
          >
            {layer.locked ? <Icons.Lock className="w-3.5 h-3.5" /> : <Icons.Unlock className="w-3.5 h-3.5" />}
          </button>

          <div className="w-8 h-8 rounded bg-[#13161a] border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
            {getThumbnail()}
            {layer.maskLayerId && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#7d2ae8] rounded-tl flex items-center justify-center">
                <Icons.Layers className="w-2 h-2 text-white" />
              </div>
            )}
          </div>

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
                  <span
                    className={`text-xs truncate font-medium ${isSelected || isMultiSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'} ${layer.visible ? '' : 'opacity-50'}`}
                  >
                    {layer.name || getLayerNameFallback(layer)}
                  </span>
                  {isGrouped && <span className="text-[8px] bg-gray-700 text-gray-400 px-1 rounded">GRP</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase text-gray-600 font-bold bg-gray-800 px-1 rounded">
                    {layer.type}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className={`p-1 rounded transition-colors ${showSettings ? 'bg-[#7d2ae8] text-white' : 'hover:bg-gray-700 text-gray-500'}`}
              title="Layer Settings"
            >
              <Icons.Settings className="w-3 h-3" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div
            className="bg-[#1a1d21] p-2 border-b border-gray-800 animate-slide-down text-[10px]"
            style={{ marginLeft: isGrouped ? '24px' : '0' }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-500 font-bold uppercase">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={layer.opacity}
                  onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 font-bold uppercase">Blend Mode</label>
                <select
                  value={layer.blendMode || 'normal'}
                  onChange={(e) => onUpdate({ blendMode: e.target.value })}
                  className="w-full bg-[#0e1318] border border-gray-700 rounded px-1 py-0.5 text-gray-300 focus:border-[#7d2ae8] outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                </select>
              </div>
            </div>
            <div className="mt-2 flex gap-2 border-t border-gray-700/50 pt-2 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                  setShowSettings(false);
                }}
                className="px-2 py-1 hover:bg-gray-700 rounded text-gray-400 flex items-center gap-1"
              >
                <Icons.Copy className="w-3 h-3" /> Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="px-2 py-1 hover:bg-red-900/30 text-red-400 rounded flex items-center gap-1"
              >
                <Icons.Trash className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
  areLayerPropsEqual
);
LayerItem.displayName = 'LayerItem';

export const LayersPanel = React.memo(() => {
  const layers = useStore((state) => state.layers);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const selectLayer = useStore((state) => state.selectLayer);
  const multiSelectLayer = useStore((state) => state.multiSelectLayer);
  const updateLayer = useStore((state) => state.updateLayer);
  const deleteLayer = useStore((state) => state.deleteLayer);
  const deleteSelected = useStore((state) => state.deleteSelected);
  const duplicateLayer = useStore((state) => state.duplicateLayer);
  const moveLayer = useStore((state) => state.moveLayer);
  const reorderLayer = useStore((state) => state.reorderLayer);
  const groupSelected = useStore((state) => state.groupSelected);
  const ungroupSelected = useStore((state) => state.ungroupSelected);
  const copyLayer = useStore((state) => state.copyLayer);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'shape' | 'image'>('all');

  const selectedLayerId = selectedLayerIds.length > 0 ? selectedLayerIds[selectedLayerIds.length - 1] : null;

  // Virtualization constants/state
  const ITEM_HEIGHT = 50;
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const displayLayers = useMemo(() => {
    const result = [...layers].reverse();

    return result.filter((layer) => {
      const matchesFilter = filterType === 'all' || layer.type === filterType;
      const matchesSearch =
        !searchQuery ||
        (layer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (layer.type === 'text' && (layer as TextLayer).text.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [layers, searchQuery, filterType]);

  const totalHeight = displayLayers.length * ITEM_HEIGHT;

  const visibleLayers = useMemo(() => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT);
    const end = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT);
    const buffer = 10;
    const startIndex = Math.max(0, start - buffer);
    const endIndex = Math.min(displayLayers.length, end + buffer);

    const visible = [];
    for (let i = startIndex; i < endIndex; i++) {
      visible.push({
        layer: displayLayers[i]!,
        index: i,
        offset: i * ITEM_HEIGHT,
      });
    }
    return visible;
  }, [displayLayers, scrollTop, containerHeight]);

  const getGroupStatus = (layer: Layer, index: number, array: Layer[]) => {
    if (!layer.groupId) {
      return { isGrouped: false };
    }
    const isGrouped = true;
    const prev = array[index - 1];
    const next = array[index + 1];
    const isGroupStart = !prev || prev.groupId !== layer.groupId;
    const isGroupEnd = !next || next.groupId !== layer.groupId;
    return { isGrouped, isGroupStart, isGroupEnd };
  };

  const handleSelectMultiple = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    multiSelectLayer(id, e.shiftKey || e.ctrlKey || e.metaKey);
  };

  const handleBatchVisibility = (visible: boolean) => {
    selectedLayerIds.forEach((id) => updateLayer(id, { visible }));
  };

  const handleBatchLock = (locked: boolean) => {
    selectedLayerIds.forEach((id) => updateLayer(id, { locked }));
  };

  const handleDrop = (draggedId: string, targetId: string, position: 'above' | 'below') => {
    const draggedIndex = layers.findIndex((l) => l.id === draggedId);
    const targetIndex = layers.findIndex((l) => l.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    let newIndex = targetIndex;
    if (position === 'above') {
      newIndex = targetIndex + 1;
    }

    reorderLayer(draggedId, newIndex);
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2 uppercase">
            <Icons.Layers className="w-4 h-4 text-[#7d2ae8]" />
            Layers
          </h3>
          <span className="text-[10px] text-gray-500 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
            {layers.length} Layers
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e1318] border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#7d2ae8] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {(['all', 'text', 'shape', 'image'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${filterType === type
                  ? 'bg-[#7d2ae8] text-white shadow-lg shadow-[#7d2ae8]/20'
                  : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {type === 'all' ? 'All' : type === 'text' ? 'Text' : type === 'shape' ? 'Shapes' : 'Images'}
            </button>
          ))}
        </div>

        {selectedLayerIds.length > 0 && (
          <div className="bg-[#7d2ae8]/10 border border-[#7d2ae8]/30 rounded-lg p-2 flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-[#7d2ae8]">{selectedLayerIds.length} selected</span>
            <div className="flex gap-1">
              <button
                onClick={() => groupSelected()}
                className="px-2 py-1 hover:bg-gray-700 rounded text-gray-400 text-[10px] font-bold uppercase"
                title="Group"
                disabled={selectedLayerIds.length < 2}
              >
                <Icons.Group className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => ungroupSelected()}
                className="px-2 py-1 hover:bg-gray-700 rounded text-gray-400 text-[10px] font-bold uppercase"
                title="Ungroup"
              >
                <Icons.Ungroup className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-gray-700 mx-1 self-center" />
              <button
                onClick={() => handleBatchVisibility(true)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
                title="Show"
              >
                <Icons.Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleBatchVisibility(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
                title="Hide"
              >
                <Icons.EyeOff className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleBatchLock(true)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
                title="Lock"
              >
                <Icons.Lock className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteSelected()}
                className="p-1 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400"
                title="Delete"
              >
                <Icons.Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        onScroll={(e) => {
          const target = e.currentTarget;
          setScrollTop(target.scrollTop);
          setContainerHeight(target.clientHeight);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {displayLayers.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 opacity-30 gap-2">
            <Icons.Layers className="w-10 h-10 text-gray-500" />
            <p className="text-xs font-medium">{searchQuery ? 'No layers match filter' : 'Canvas is empty'}</p>
          </div>
        )}

        {displayLayers.length > 0 && (
          <div
            style={{
              height: `${totalHeight}px`,
              position: 'relative',
              backgroundColor: '#13161a',
            }}
          >
            {visibleLayers.map((layerInfo) => {
              const { layer, index, offset } = layerInfo;
              const { isGrouped, isGroupStart, isGroupEnd } = getGroupStatus(layer, index, displayLayers);
              const isSelected = selectedLayerId === layer.id;
              const isMultiSelected = selectedLayerIds.includes(layer.id);

              return (
                <div
                  key={layer.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${offset}px)`,
                  }}
                >
                  <LayerItem
                    layer={layer}
                    index={index}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    isGrouped={isGrouped}
                    isGroupStart={isGroupStart}
                    isGroupEnd={isGroupEnd}
                    onSelect={() => selectLayer(layer.id)}
                    onSelectMultiple={(e) => handleSelectMultiple(layer.id, e)}
                    onUpdate={(c) => updateLayer(layer.id, c)}
                    onDelete={() => deleteLayer(layer.id)}
                    onDuplicate={() => duplicateLayer(layer.id)}
                    onMove={(dir) => moveLayer(layer.id, dir)}
                    onCopy={() => copyLayer(layer.id)}
                    onDrop={handleDrop}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
LayersPanel.displayName = 'LayersPanel';

export default LayersPanel;
