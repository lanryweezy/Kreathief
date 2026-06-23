import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TextLayer, ShapeLayer, ImageLayer, Layer, Artboard } from '../../types';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { ArrangePanel } from './ArrangePanel';
import { PanelErrorBoundary } from './PanelErrorBoundary';

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
  }: LayerItemProps) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [dragOver, setDragOver] = useState<'top' | 'bottom' | null>(null);

    const isGroup = layer.isGroup === true;
    const isExpanded = layer.isExpanded !== false;
    const [localExpanded, setLocalExpanded] = useState(isExpanded);

    useEffect(() => {
      setLocalExpanded(layer.isExpanded !== false);
    }, [layer.isExpanded]);

    const getThumbnail = () => {
      if (layer.type === 'image') {
        return <img src={(layer as ImageLayer).src} className="w-full h-full object-cover" alt="" />;
      }
      if (layer.type === 'text') {
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#0e1318] p-0.5 overflow-hidden">
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
          className={`group relative flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all duration-200 ${isSelected ? 'bg-white/[0.05] border-l-4 border-l-brand-600 shadow-inner' : 'hover:bg-white/[0.03]'}`}
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {layer.maskLayerId && <Icons.ArrowRight className="w-2.5 h-2.5 text-brand-600 rotate-90" />}
              <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-gray-400'}`}>
                {layer.name || getLayerNameFallback(layer)}
              </span>
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
      <div className="flex px-4 pt-4 border-b border-white/5 gap-4">
        <button
          onClick={() => setActiveTab('layers')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'layers'
              ? 'border-brand-600 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          LAYERS ({layers.length})
        </button>
        <button
          onClick={() => setActiveTab('arrange')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'arrange'
              ? 'border-brand-600 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          ARRANGE
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 py-2 overflow-y-auto no-scrollbar"
        style={{ maxHeight: listHeight || '100%' }}
      >
        {activeTab === 'layers' ? (
          <div className="flex flex-col">
            {layers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-surface-dark-3 flex items-center justify-center mb-3">
                  <Icons.Layers className="w-7 h-7 text-gray-600" />
                </div>
                <h4 className="text-xs font-bold text-gray-400 mb-1">No Layers Yet</h4>
                <p className="text-[10px] text-gray-500 max-w-[180px]">
                  Add text, shapes, or images to start creating.
                </p>
              </div>
            ) : (
              [...layers].reverse().map((layer, index) => (
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
