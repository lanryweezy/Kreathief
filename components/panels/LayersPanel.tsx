import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TextLayer, ShapeLayer, ImageLayer, Layer, Artboard } from '../../types';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { fuzzyMatch } from '../../utils/search';
import { useShallow } from 'zustand/react/shallow';
import { ArrangePanel } from './ArrangePanel';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { PanelHeader } from './PanelHeader';

// LayerItem Component Props
interface LayerItemProps {
  layer: Layer;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onSelectMultiple: (e: React.MouseEvent) => void;
  onUpdate: (changes: Partial<Layer>) => void;
  onDelete: () => void;
  isGrouped?: boolean;
  onDrop: (draggedId: string, targetId: string, position: 'above' | 'below') => void;
  style?: React.CSSProperties;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

const areLayerPropsEqual = (prev: LayerItemProps, next: LayerItemProps) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.isGrouped === next.isGrouped &&
    prev.layer === next.layer &&
    prev.index === next.index
  );
};

function getLayerNameFallback(l: Layer) {
  if (l.type === 'text') {
    return (l as TextLayer).text.substring(0, 20) || 'Text Layer';
  }
  if (l.type === 'image') {
    return 'Image Layer';
  }
  return (l as ShapeLayer).type.charAt(0).toUpperCase() + (l as ShapeLayer).type.slice(1);
}

const LayerItem = React.memo(
  ({
    layer,
    isSelected,
    onSelect,
    onSelectMultiple,
    onUpdate,
    onDelete,
    isGrouped = false,
    onDrop,
    style,
    tabIndex = -1,
    onKeyDown,
  }: LayerItemProps) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const setHoveredLayerId = useStore((s) => s.setHoveredLayerId);
    const globalHoveredId = useStore((s) => s.hoveredLayerId);
    const isHovered = globalHoveredId === layer.id;
    const [showSettings, setShowSettings] = useState(false);
    const [dragOver, setDragOver] = useState<'top' | 'bottom' | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameText, setRenameText] = useState(layer.name || '');

    useEffect(() => {
      setRenameText(layer.name || '');
    }, [layer.name]);

    const isGroup = layer.isGroup === true;
    const isExpanded = layer.isExpanded !== false;
    const [localExpanded, setLocalExpanded] = useState(isExpanded);

    useEffect(() => {
      setLocalExpanded(layer.isExpanded !== false);
    }, [layer.isExpanded]);

    useEffect(() => {
      if (isSelected && itemRef.current) {
        itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, [isSelected]);

    const getThumbnail = () => {
      if (layer.type === 'image') {
        return <img src={(layer as ImageLayer).src} className="w-full h-full object-cover" alt="" />;
      }
      if (layer.type === 'text') {
        return (
          <div className="w-full h-full flex items-center justify-center bg-surface-dark-2 p-0.5 overflow-hidden">
            <span className="text-[10px] font-bold" style={{ color: (layer as TextLayer).color }}>
              T
            </span>
          </div>
        );
      }
      return <div className="w-full h-full" style={{ backgroundColor: (layer as ShapeLayer).color }} />;
    };

    return (
      <div className="flex flex-col" ref={itemRef} style={style}>
        <div
          role="treeitem"
          aria-selected={isSelected}
          aria-label={`Layer: ${String(layer.name || getLayerNameFallback(layer))}${isSelected ? ', selected' : ''}${layer.locked ? ', locked' : ''}`}
          tabIndex={tabIndex}
          onKeyDown={onKeyDown}
          draggable={!layer.locked}
          onDragStart={(e) => {
            e.dataTransfer.setData('layerId', layer.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(e.clientY < e.currentTarget.getBoundingClientRect().top + 25 ? 'top' : 'bottom');
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => {
            const draggedId = e.dataTransfer.getData('layerId');
            if (draggedId && draggedId !== layer.id) {
              onDrop(draggedId, layer.id, dragOver === 'top' ? 'above' : 'below');
            }
            setDragOver(null);
          }}
          onClick={(e) => {
            if (isGroup) {
              setLocalExpanded(!localExpanded);
              onUpdate({ isExpanded: !localExpanded });
            } else {
              if (e.shiftKey) {
                onSelectMultiple(e);
              } else {
                onSelect();
              }
            }
          }}
          onMouseEnter={() => setHoveredLayerId?.(layer.id)}
          onMouseLeave={() => setHoveredLayerId?.(null)}
          className={`group relative flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all duration-200 ${
            isSelected
              ? 'bg-white/[0.08] border-l-4 border-l-brand-600 shadow-inner'
              : isHovered
                ? 'bg-brand-600/20 border-l-4 border-l-brand-400'
                : 'hover:bg-white/[0.03]'
          }`}
          style={{ paddingLeft: isGrouped && !layer.isGroup ? '42px' : '16px' }}
        >
          {/* Mask Indicator Logic */}
          <div className="w-8 h-8 rounded bg-surface-dark-2 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
            {getThumbnail()}
            {(layer.maskLayerId || layer.isMasking) && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-brand-600 rounded-tl flex items-center justify-center shadow-lg">
                <Icons.Layers className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          <div
            className="flex-1 min-w-0"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
          >
            <div className="flex items-center gap-2">
              {layer.maskLayerId && <Icons.ArrowRight className="w-2.5 h-2.5 text-brand-600 rotate-90" />}
              {isRenaming ? (
                <input
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onBlur={() => {
                    setIsRenaming(false);
                    if (renameText.trim()) {
                      onUpdate({ name: renameText.trim() });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsRenaming(false);
                      if (renameText.trim()) {
                        onUpdate({ name: renameText.trim() });
                      }
                    }
                    if (e.key === 'Escape') {
                      setIsRenaming(false);
                      setRenameText(layer.name || '');
                    }
                  }}
                  autoFocus
                  className="w-full bg-black/60 border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-gray-400'}`}>
                  {String(layer.name || getLayerNameFallback(layer))}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <button
              aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ visible: !layer.visible });
              }}
              className="p-1 text-gray-500 hover:text-white"
            >
              {layer.visible ? <Icons.Eye className="w-3.5 h-3.5" /> : <Icons.EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              aria-label="Layer settings"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className={`p-1 rounded ${showSettings ? 'bg-brand-600 text-white' : 'text-gray-500'}`}
            >
              <Icons.Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-white/5 backdrop-blur-xl p-4 border-b border-white/10 space-y-4 text-[11px] animate-in slide-in-from-top-1 duration-200">
            <div className="space-y-1.5">
              <label
                htmlFor={`rename-${layer.id}`}
                className="text-gray-500 uppercase font-black tracking-widest text-[9px]"
              >
                Layer Name
              </label>
              <input
                id={`rename-${layer.id}`}
                type="text"
                value={layer.name || ''}
                placeholder={getLayerNameFallback(layer)}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor={`opacity-${layer.id}`}
                  className="text-gray-500 uppercase font-black tracking-widest text-[9px]"
                >
                  Opacity {Math.round(layer.opacity * 100)}%
                </label>
                <input
                  id={`opacity-${layer.id}`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={layer.opacity}
                  onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-brand-600 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gray-500 uppercase font-black tracking-widest text-[9px]">Masking</label>
                <button
                  onClick={() => onUpdate({ isMasking: !layer.isMasking, clippingMaskType: 'clipping' })}
                  className={`w-full py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${layer.isMasking ? 'bg-brand-600 border-brand-600 text-white shadow-lg' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                >
                  {layer.isMasking ? 'Masking Active' : 'Use as Mask'}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className="text-gray-600 text-[9px] uppercase font-bold">
                Layer ID: {layer.id.substring(0, 8)}...
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-400 hover:text-red-300 font-black uppercase tracking-tighter transition-colors"
              >
                Delete
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

interface RowData {
  layers: Layer[];
  selectedLayerIds: string[];
  selectLayer: (id: string) => void;
  multiSelectLayer: (id: string, append: boolean) => void;
  updateLayer: (id: string, changes: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayer: (id: string, index: number) => void;
}

export const LayersPanel = () => {
  const {
    artboards,
    activeArtboardId,
    selectedLayerIds,
    selectLayer,
    multiSelectLayer,
    updateLayer,
    deleteLayer,
    reorderLayer,
  } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      selectedLayerIds: state.selectedLayerIds,
      selectLayer: state.selectLayer,
      multiSelectLayer: state.multiSelectLayer,
      updateLayer: state.updateLayer,
      deleteLayer: state.deleteLayer,
      reorderLayer: state.reorderLayer,
    }))
  );
  const layers = useMemo(
    () => artboards.find((a: Artboard) => a.id === activeArtboardId)?.layers || [],
    [artboards, activeArtboardId]
  );

  const [activeTab, setActiveTab] = useState<'layers' | 'arrange'>('layers');
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);
  const [focusedLayerIndex, setFocusedLayerIndex] = useState<number>(-1);

  // Reversed list mirrors what the UI renders (top = last in array)
  const reversedLayers = useMemo(() => [...layers].reverse(), [layers]);

  const [layerSearch, setLayerSearch] = useState('');
  const [showOverlapping, setShowOverlapping] = useState(false);

  // Compute bounding box intersection for "Overlapping" filter mode
  const filteredLayers = useMemo(() => {
    const q = layerSearch.trim();
    let result = reversedLayers;
    if (q) {
      // 🌸 Bloom: Replaced exact substring matching with fuzzyMatch for typo tolerance
      result = result.filter((l) => fuzzyMatch(q, l.name || l.type));
    }
    if (!showOverlapping || selectedLayerIds.length === 0) {
      return result;
    }

    // Find the selected layer's bounding box
    const selectedLayer = layers.find((l) => l.id === selectedLayerIds[0]);
    if (!selectedLayer) {
      return result;
    }

    const selLeft = selectedLayer.x;
    const selTop = selectedLayer.y;
    const selRight = selectedLayer.x + (selectedLayer.width || 0);
    const selBottom = selectedLayer.y + (selectedLayer.height || 0);

    return result.filter((l) => {
      if (l.id === selectedLayer.id) {
        return true;
      } // always show the selected layer itself
      const lLeft = l.x;
      const lTop = l.y;
      const lRight = l.x + (l.width || 0);
      const lBottom = l.y + (l.height || 0);
      // AABB intersection test
      return lLeft < selRight && lRight > selLeft && lTop < selBottom && lBottom > selTop;
    });
  }, [reversedLayers, layerSearch, showOverlapping, selectedLayerIds, layers]);

  const handleLayerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, displayIndex: number) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = Math.min(displayIndex + 1, filteredLayers.length - 1);
        setFocusedLayerIndex(next);
        const el = containerRef.current?.querySelectorAll<HTMLDivElement>('[role="treeitem"]')[next];
        el?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = Math.max(displayIndex - 1, 0);
        setFocusedLayerIndex(prev);
        const el = containerRef.current?.querySelectorAll<HTMLDivElement>('[role="treeitem"]')[prev];
        el?.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const layer = filteredLayers[displayIndex];
        if (layer) {
          selectLayer(layer.id);
        }
        break;
      }
      case 'Delete':
      case 'Backspace': {
        e.preventDefault();
        const layer = filteredLayers[displayIndex];
        if (layer && !layer.locked) {
          deleteLayer(layer.id);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setFocusedLayerIndex(-1);
        (e.currentTarget as HTMLDivElement).blur();
        break;
      }
    }
  };

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setListHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Tabs */}
      <PanelHeader
        tabs={[
          { id: 'layers', label: 'Layers', count: layers.length },
          { id: 'arrange', label: 'Arrange' },
        ]}
        activeTabId={activeTab}
        onTabChange={(id) => setActiveTab(id)}
        action={
          layers.length > 0 ? (
            <button
              onClick={() => {
                if (window.confirm('Clear all layers? This action cannot be undone easily.')) {
                  layers.forEach((l) => deleteLayer(l.id));
                }
              }}
              title="Clear Canvas"
              aria-label="Clear Canvas"
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Icons.Trash className="w-3.5 h-3.5" />
            </button>
          ) : null
        }
      >
        {layers.length > 0 && activeTab === 'layers' && (
          <button
            onClick={() => useStore.getState().autoRenameLayers?.()}
            title="AI Rename Layers"
            aria-label="AI Rename Layers"
            className="p-1 text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 rounded transition-all group relative ml-2"
          >
            <Icons.Wand className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
          </button>
        )}
      </PanelHeader>

      {activeTab === 'layers' && layers.length > 0 && (
        <div className="px-3 pt-2">
          <div className="relative">
            <Icons.Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
              placeholder="Search layers…"
              aria-label="Search layers"
              data-testid="layer-search-input"
              className="w-full bg-surface-dark-3 border border-gray-700 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            {layerSearch && (
              <button
                onClick={() => setLayerSearch('')}
                aria-label="Clear layer search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs leading-none"
              >
                &times;
              </button>
            )}
          </div>
          {/* All / Overlapping filter toggle */}
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setShowOverlapping(false)}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${!showOverlapping ? 'bg-brand-600 text-white' : 'bg-surface-dark-3 text-gray-500 hover:text-gray-300'}`}
            >
              All ({layers.length})
            </button>
            <button
              onClick={() => setShowOverlapping(true)}
              title="Show only layers that overlap with the selected layer"
              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${showOverlapping ? 'bg-brand-600 text-white' : 'bg-surface-dark-3 text-gray-500 hover:text-gray-300'}`}
            >
              Overlapping{showOverlapping && selectedLayerIds.length > 0 ? ` (${filteredLayers.length})` : ''}
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 py-2 overflow-y-auto no-scrollbar"
        style={{ maxHeight: listHeight || '100%' }}
      >
        {activeTab === 'layers' ? (
          <div className="flex flex-col" role="tree" aria-label="Layers">
            {reversedLayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-surface-dark-3 flex items-center justify-center mb-3">
                  <Icons.Layers className="w-7 h-7 text-gray-600" />
                </div>
                <h4 className="text-xs font-bold text-gray-400 mb-1">No Layers Yet</h4>
                <p className="text-[10px] text-gray-500 max-w-[180px]">
                  Add text, shapes, or images to start creating.
                </p>
              </div>
            ) : filteredLayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Icons.Search className="w-6 h-6 text-gray-600 mb-2" />
                <p className="text-[10px] text-gray-500">No layers match “{layerSearch}”</p>
              </div>
            ) : (
              filteredLayers.map((layer, index) => (
                <LayerItem
                  key={layer.id}
                  layer={layer}
                  index={index}
                  isSelected={selectedLayerIds.includes(layer.id)}
                  onSelect={() => selectLayer(layer.id)}
                  onSelectMultiple={() => multiSelectLayer(layer.id, true)}
                  onUpdate={(c) => updateLayer(layer.id, c)}
                  onDelete={() => deleteLayer(layer.id)}
                  onDrop={(id, target, pos) =>
                    reorderLayer(id, layers.findIndex((l) => l.id === target) + (pos === 'above' ? 1 : 0))
                  }
                  tabIndex={focusedLayerIndex === index || (focusedLayerIndex === -1 && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleLayerKeyDown(e, index)}
                />
              ))
            )}
            {selectedLayerIds.length === 1 && layers.length > 1 && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/[0.03]">
                <button
                  onClick={() => {
                    const idx = layers.findIndex((l) => l.id === selectedLayerIds[0]);
                    if (idx < layers.length - 1) {
                      reorderLayer(selectedLayerIds[0], idx + 1);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-white bg-surface-dark-3 hover:bg-surface-dark-4 border border-gray-700 rounded-lg transition-all"
                  title="Move layer up"
                >
                  <Icons.ArrowUp className="w-3 h-3" />
                  Up
                </button>
                <button
                  onClick={() => {
                    const idx = layers.findIndex((l) => l.id === selectedLayerIds[0]);
                    if (idx > 0) {
                      reorderLayer(selectedLayerIds[0], idx - 1);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-white bg-surface-dark-3 hover:bg-surface-dark-4 border border-gray-700 rounded-lg transition-all"
                  title="Move layer down"
                >
                  <Icons.ArrowDown className="w-3 h-3" />
                  Down
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full">
            <ArrangePanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default function LayersPanelWrapped() {
  return (
    <PanelErrorBoundary panelName="Layers">
      <LayersPanel />
    </PanelErrorBoundary>
  );
}
