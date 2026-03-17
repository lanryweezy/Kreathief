import React, { useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';

interface ContextMenuProps {
  x: number;
  y: number;
  layerId: string;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  layerId,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    duplicateLayer,
    deleteLayer,
    moveLayer,
    updateLayer,
    artboards,
    activeArtboardId,
    convertToComponent,
    instantiateComponent,
    detachInstance,
    resetOverrides,
  } = useStore();

  const layers = React.useMemo(() => 
    artboards.find(a => a.id === activeArtboardId)?.layers || [], 
    [artboards, activeArtboardId]
  );

  const layer = layers.find((l: any) => l.id === layerId);
  const isLocked = layer?.locked || false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to not overflow screen
  const style: React.CSSProperties = {
    top: y,
    left: x,
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-48 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl py-1 animate-fadeIn flex flex-col"
      style={style}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 mb-1">
        Layer Actions
      </div>

      <button onClick={() => { duplicateLayer(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#7d2ae8] hover:text-white transition-colors text-left">
        <Icons.Copy className="w-4 h-4" /> Duplicate
      </button>

      <button 
        onClick={() => {
          const layerIndex = layers.findIndex((l: any) => l.id === layerId);
          if (layerIndex > 0) {
            useStore.getState().applyMask(layerId, layers[layerIndex - 1].id);
          }
          onClose();
        }} 
        disabled={layers.findIndex((l: any) => l.id === layerId) === 0}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Icons.Layers className="w-4 h-4" /> Mask with Layer Below
      </button>

      <button 
        onClick={() => { 
          (useStore.getState() as any).pasteLayer();
          onClose(); 
        }} 
        disabled={!(useStore.getState() as any).clipboardLayer}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Icons.Copy className="w-4 h-4" /> Paste
      </button>

      <button onClick={() => { moveLayer(layerId, 'forward'); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
        <Icons.ArrowUp className="w-4 h-4" /> Bring Forward
      </button>

      <button onClick={() => { moveLayer(layerId, 'backward'); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
        <Icons.ArrowDown className="w-4 h-4" /> Send Backward
      </button>

      <div className="h-px bg-gray-700 my-1"></div>

      <button onClick={() => { updateLayer(layerId, { locked: !isLocked }); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
        {isLocked ? <Icons.Unlock className="w-4 h-4" /> : <Icons.Lock className="w-4 h-4" />}
        {isLocked ? "Unlock" : "Lock"}
      </button>

      <div className="h-px bg-gray-700 my-1"></div>

      {layer?.componentId && (
        <button onClick={() => { instantiateComponent(layer.componentId!); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#7d2ae8] hover:text-white transition-colors text-left">
          <Icons.Plus className="w-4 h-4" /> Create Instance
        </button>
      )}

      {layer && !layer.componentId && !layer.masterId && (
        <button onClick={() => { convertToComponent(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-[#a855f7] hover:bg-[#a855f7]/10 hover:text-[#c084fc] transition-colors text-left">
          <Icons.LayoutGrid className="w-4 h-4" /> Create Component
        </button>
      )}

      {layer?.masterId && (
        <>
          <button onClick={() => { resetOverrides(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
            <Icons.Undo className="w-4 h-4" /> Reset Overrides
          </button>
          <button onClick={() => { detachInstance(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
            <Icons.Scissors className="w-4 h-4" /> Detach Instance
          </button>
        </>
      )}

      <div className="h-px bg-gray-700 my-1"></div>

      <button onClick={() => { deleteLayer(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors text-left">
        <Icons.Trash className="w-4 h-4" /> Delete
      </button>
    </div>
  );
};