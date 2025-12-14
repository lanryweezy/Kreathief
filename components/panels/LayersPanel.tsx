
import React, { useState } from 'react';
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
}

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (changes: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: 'forward' | 'backward') => void;
}

const LayerItem: React.FC<LayerItemProps> = ({ 
  layer, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  onDuplicate, 
  onMove 
}) => {
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
       return <img src={(layer as ImageLayer).src} className="w-full h-full object-cover" />;
    }
    if (layer.type === 'text') {
        return (
           <div className="w-full h-full flex items-center justify-center bg-white/5 text-gray-400 font-serif font-bold text-[10px]">
              T
           </div>
        );
    }
    
    // Shape Layer
    const l = layer as ShapeLayer;
    return (
         <div 
            className="w-full h-full flex items-center justify-center text-[8px]" 
            style={{ 
               backgroundColor: l.color, 
               borderRadius: l.type === 'circle' ? '50%' : '2px',
               // Simple visual approx for shape types
               clipPath: l.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
            }} 
         />
    );
  };

  return (
    <div 
      onClick={onSelect}
      className={`group relative flex items-center gap-3 p-2 border-b border-gray-800/50 cursor-pointer transition-colors select-none ${
        isSelected 
          ? 'bg-[#7d2ae8]/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#7d2ae8]' 
          : 'hover:bg-[#252627]'
      }`}
    >
      {/* Visibility Toggle (Left Gutter) */}
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
                <span className={`text-xs truncate font-medium ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {layer.name || getLayerNameFallback(layer)}
                </span>
                {layer.locked && <Icons.Lock className="w-2.5 h-2.5 text-gray-500" />}
             </div>
             
             <div className="flex items-center gap-2">
                {/* Blend Mode Badge */}
                {layer.blendMode && layer.blendMode !== 'normal' && (
                   <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded uppercase font-bold tracking-wider">
                      {layer.blendMode}
                   </span>
                )}
                {/* Opacity Badge */}
                {layer.opacity < 1 && (
                   <span className="text-[9px] text-gray-600">
                      {Math.round(layer.opacity * 100)}%
                   </span>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Quick Actions (Right Gutter) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
};

export const LayersPanel: React.FC<LayersPanelProps> = ({
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
  onLayoutLayers
}) => {
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
              <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400" title="Collapse All"><Icons.MinusSquare className="w-3.5 h-3.5" /></button>
           </div>
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
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Helper to render list if empty */}
        {textLayers.length === 0 && shapeLayers.length === 0 && imageLayers.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 opacity-30 gap-2">
                <Icons.Layers className="w-10 h-10 text-gray-500" />
                <p className="text-xs font-medium">Empty Canvas</p>
            </div>
        )}

        {/* Text Layers (Front) */}
        {textLayers.length > 0 && (
          <div>
            <div className="px-3 py-1.5 bg-[#1a1d21] border-y border-gray-800 flex items-center justify-between sticky top-0 z-10">
               <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Icons.Text className="w-3 h-3" /> Typography
               </span>
               <span className="text-[9px] text-gray-600 bg-gray-800 px-1.5 rounded-full">{textLayers.length}</span>
            </div>
            <div>
              {[...textLayers].reverse().map(layer => (
                <LayerItem 
                   key={layer.id}
                   layer={layer}
                   isSelected={selectedLayerId === layer.id}
                   onSelect={() => onSelectLayer(layer.id)}
                   onUpdate={(c) => onUpdateTextLayer(layer.id, c)}
                   onDelete={() => onDeleteLayer(layer.id)}
                   onDuplicate={() => onDuplicateLayer(layer.id)}
                   onMove={(dir) => onMoveLayer(layer.id, dir)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Image Layers (Middle) */}
        {imageLayers.length > 0 && (
          <div>
             <div className="px-3 py-1.5 bg-[#1a1d21] border-y border-gray-800 flex items-center justify-between sticky top-0 z-10">
               <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Icons.Image className="w-3 h-3" /> Media
               </span>
               <span className="text-[9px] text-gray-600 bg-gray-800 px-1.5 rounded-full">{imageLayers.length}</span>
            </div>
             <div>
              {[...imageLayers].reverse().map(layer => (
                <LayerItem 
                   key={layer.id}
                   layer={layer}
                   isSelected={selectedLayerId === layer.id}
                   onSelect={() => onSelectLayer(layer.id)}
                   onUpdate={(c) => onUpdateImageLayer(layer.id, c)}
                   onDelete={() => onDeleteLayer(layer.id)}
                   onDuplicate={() => onDuplicateLayer(layer.id)}
                   onMove={(dir) => onMoveLayer(layer.id, dir)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Shape Layers (Back) */}
        {shapeLayers.length > 0 && (
          <div>
             <div className="px-3 py-1.5 bg-[#1a1d21] border-y border-gray-800 flex items-center justify-between sticky top-0 z-10">
               <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Icons.Shapes className="w-3 h-3" /> Elements
               </span>
               <span className="text-[9px] text-gray-600 bg-gray-800 px-1.5 rounded-full">{shapeLayers.length}</span>
            </div>
             <div>
              {[...shapeLayers].reverse().map(layer => (
                <LayerItem 
                   key={layer.id}
                   layer={layer}
                   isSelected={selectedLayerId === layer.id}
                   onSelect={() => onSelectLayer(layer.id)}
                   onUpdate={(c) => onUpdateShapeLayer(layer.id, c)}
                   onDelete={() => onDeleteLayer(layer.id)}
                   onDuplicate={() => onDuplicateLayer(layer.id)}
                   onMove={(dir) => onMoveLayer(layer.id, dir)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
