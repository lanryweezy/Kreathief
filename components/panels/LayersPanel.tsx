import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TextLayer, ShapeLayer, ImageLayer, Layer, Artboard } from '../../types';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

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
  if (l.type === 'text') return (l as TextLayer).text.substring(0, 20) || 'Text Layer';
  if (l.type === 'image') return 'Image Layer';
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
            <span className="text-[10px] font-bold" style={{ color: (layer as TextLayer).color }}>T</span>
          </div>
        );
      }
      return <div className="w-full h-full" style={{ backgroundColor: (layer as ShapeLayer).color }} />;
    };

    return (
      <div className="flex flex-col" ref={itemRef} style={style}>
        <div
          draggable={!layer.locked}
          onDragStart={(e) => { e.dataTransfer.setData('layerId', layer.id); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(e.clientY < e.currentTarget.getBoundingClientRect().top + 25 ? 'top' : 'bottom'); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => {
            const draggedId = e.dataTransfer.getData('layerId');
            if (draggedId && draggedId !== layer.id) onDrop(draggedId, layer.id, dragOver === 'top' ? 'above' : 'below');
            setDragOver(null);
          }}
          onClick={(e) => {
            if (isGroup) {
               setLocalExpanded(!localExpanded);
               onUpdate({ isExpanded: !localExpanded });
            } else {
               if (e.shiftKey) onSelectMultiple(e);
               else onSelect();
            }
          }}
          className={`group relative flex items-center gap-3 p-2 border-b border-gray-800/50 cursor-pointer transition-all ${isSelected ? 'bg-[#7d2ae8]/10 border-l-2 border-l-[#7d2ae8]' : 'hover:bg-[#252627]'}`}
          style={{ paddingLeft: isGrouped && !layer.isGroup ? '32px' : '10px' }}
        >
          {/* Mask Indicator Logic */}
          <div className="w-8 h-8 rounded bg-[#13161a] border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
            {getThumbnail()}
            {(layer.maskLayerId || layer.isMasking) && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#7d2ae8] rounded-tl flex items-center justify-center shadow-lg">
                <Icons.Layers className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                {layer.maskLayerId && <Icons.ArrowRight className="w-2.5 h-2.5 text-[#7d2ae8] rotate-90" />}
                <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-gray-400'}`}>
                   {layer.name || getLayerNameFallback(layer)}
                </span>
             </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={(e) => { e.stopPropagation(); onUpdate({ visible: !layer.visible }); }} className="p-1 text-gray-500 hover:text-white">
                {layer.visible ? <Icons.Eye className="w-3.5 h-3.5" /> : <Icons.EyeOff className="w-3.5 h-3.5" />}
             </button>
             <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className={`p-1 rounded ${showSettings ? 'bg-[#7d2ae8] text-white' : 'text-gray-500'}`}>
                <Icons.Settings className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-[#1a1d21] p-3 border-b border-gray-800 space-y-3 text-[10px]">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-gray-500 uppercase font-black">Opacity {Math.round(layer.opacity * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.01" value={layer.opacity} onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })} className="w-full accent-[#7d2ae8]" />
               </div>
               <div>
                  <label className="text-gray-500 uppercase font-black">Masking</label>
                  <button onClick={() => onUpdate({ isMasking: !layer.isMasking, clippingMaskType: 'clipping' })} className={`w-full py-1 rounded border transition-all ${layer.isMasking ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white' : 'border-gray-700 text-gray-400'}`}>
                     {layer.isMasking ? 'Clipping Active' : 'Use as Mask'}
                  </button>
               </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-800">
               <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-300 font-bold uppercase tracking-tighter">Delete Layer</button>
            </div>
          </div>
        )}
      </div>
    );
  },
  areLayerPropsEqual
);
LayerItem.displayName = 'LayerItem';

export const LayersPanel = () => {
  const { artboards, activeArtboardId, selectedLayerIds, selectLayer, multiSelectLayer, updateLayer, deleteLayer, reorderLayer } = useStore();
  const layers = useMemo(() => artboards.find((a: Artboard) => a.id === activeArtboardId)?.layers || [], [artboards, activeArtboardId]);

  return (
    <div className="flex flex-col h-full bg-[#13161a] border-l border-white/5">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Layers List</h3>
         <span className="text-[9px] font-mono text-gray-500">{layers.length} Total</span>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {[...layers].reverse().map((layer, idx) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            index={idx}
            isSelected={selectedLayerIds.includes(layer.id)}
            onSelect={() => selectLayer(layer.id)}
            onSelectMultiple={(_e) => multiSelectLayer(layer.id, true)}
            onUpdate={(c) => updateLayer(layer.id, c)}
            onDelete={() => deleteLayer(layer.id)}
            onDrop={(id, target, pos) => reorderLayer(id, layers.findIndex(l => l.id === target) + (pos === 'above' ? 1 : 0))}
          />
        ))}
      </div>
    </div>
  );
};

export default LayersPanel;
