import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';

interface ContextMenuProps {
  x: number;
  y: number;
  layerId: string;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, layerId, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const {
    duplicateLayer, deleteLayer, moveLayer, updateLayer,
    artboards, activeArtboardId,
    convertToComponent, instantiateComponent, detachInstance, resetOverrides,
    addToast, groupSelected, ungroupSelected,
  } = useStore();

  const clipboardLayer = useStore(s => s.clipboardLayer);
  const pasteLayer = useStore(s => s.pasteLayer);

  const layers = React.useMemo(() =>
    artboards.find((a: any) => a.id === activeArtboardId)?.layers || [],
    [artboards, activeArtboardId]
  );

  const layer = layers.find((l: any) => l.id === layerId);
  const isLocked = layer?.locked || false;

  useEffect(() => {
    if (layer) {setRenameValue(layer.name || '');}
  }, [layer]);

  useEffect(() => {
    if (isRenaming) {setTimeout(() => renameInputRef.current?.select(), 50);}
  }, [isRenaming]);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {onClose();}
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') {onClose();} };
    document.addEventListener('mousedown', handleOut);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOut);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleRename = () => {
    if (renameValue.trim()) {updateLayer(layerId, { name: renameValue.trim() });}
    setIsRenaming(false);
    onClose();
  };

  const handleExportAsPng = async () => {
    const layerEl = document.querySelector(`[data-layer-id="${layerId}"]`) as HTMLElement;
    if (!layerEl) { addToast?.('Could not find layer.', 'error'); onClose(); return; }
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(layerEl, { backgroundColor: null, useCORS: true });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${layer?.name || 'layer'}.png`;
      a.click();
      addToast?.('Layer exported as PNG!', 'success');
    } catch {
      addToast?.('Export failed. Use the main Export button.', 'error');
    }
    onClose();
  };

  const adjustedX = Math.min(x, window.innerWidth - 232);
  const adjustedY = Math.min(y, window.innerHeight - 420);

  const MI = ({ onClick, icon: Icon, children, red = false, purple = false, disabled = false }: any) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-all text-left rounded mx-1 group/mi ${
        disabled ? 'text-gray-700 cursor-not-allowed' :
        red ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300' :
        purple ? 'text-[#a855f7] hover:bg-[#a855f7]/15 hover:text-[#c084fc]' :
        'text-gray-300 hover:bg-[#7d2ae8] hover:text-white'}`}
      style={{ width: 'calc(100% - 8px)' }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover/mi:opacity-100" />
      <span className="flex-1">{children}</span>
    </button>
  );


  const Div = () => <div className="h-px bg-white/5 my-1 mx-3" />;

  return (
    <div
      ref={menuRef}
      className="fixed z-[300] w-56 bg-[#181818]/95 border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col backdrop-blur-xl overflow-hidden"
      style={{ top: adjustedY, left: adjustedX }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Header */}
      <div className="px-3 pb-2 mb-1 border-b border-white/5">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">
          {layer?.type || 'layer'} · {layer?.name || layerId.slice(0, 8)}
        </p>
      </div>

      {/* Rename */}
      {isRenaming ? (
        <div className="px-2 pb-2">
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') {handleRename();} if (e.key === 'Escape') { setIsRenaming(false); onClose(); } }}
            onBlur={handleRename}
            className="w-full bg-[#0e1318] border border-[#7d2ae8] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setIsRenaming(true)}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-[#7d2ae8] hover:text-white transition-all rounded mx-1 text-left"
          style={{ width: 'calc(100% - 8px)' }}
        >
          <Icons.Edit className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className="flex-1">Rename</span>
          <span className="text-[9px] text-gray-600 font-mono">F2</span>
        </button>
      )}

      <MI onClick={() => { duplicateLayer(layerId); onClose(); }} icon={Icons.Copy} label="Duplicate">
        Duplicate <span className="ml-auto text-[9px] text-gray-600 font-mono">Ctrl+D</span>
      </MI>
      
      <Div />

      <MI onClick={() => { groupSelected(); onClose(); }} icon={Icons.Group}>
        Group Selection <span className="ml-auto text-[9px] text-gray-600 font-mono">Ctrl+G</span>
      </MI>
      <MI onClick={() => { ungroupSelected(); onClose(); }} icon={Icons.Ungroup}>
        Ungroup <span className="ml-auto text-[9px] text-gray-600 font-mono">⇧Ctrl+G</span>
      </MI>

      <Div />

      <MI onClick={() => { pasteLayer(); onClose(); }} icon={Icons.Copy} disabled={!clipboardLayer}>
        Paste Above
      </MI>
      <MI onClick={handleExportAsPng} icon={Icons.Download}>Export as PNG</MI>

      <Div />

      <MI onClick={() => { moveLayer(layerId, 'front'); onClose(); }} icon={Icons.ArrowUp}>
        Bring to Front <span className="ml-auto text-[9px] text-gray-600 font-mono">⇧]</span>
      </MI>
      <MI onClick={() => { moveLayer(layerId, 'forward'); onClose(); }} icon={Icons.ChevronUp}>Bring Forward</MI>
      <MI onClick={() => { moveLayer(layerId, 'backward'); onClose(); }} icon={Icons.ChevronDown}>Send Backward</MI>
      <MI onClick={() => { moveLayer(layerId, 'back'); onClose(); }} icon={Icons.ArrowDown}>
        Send to Back <span className="ml-auto text-[9px] text-gray-600 font-mono">⇧[</span>
      </MI>

      <Div />

      {layer?.isMasking ? (
         <MI
          onClick={() => {
            updateLayer(layerId, { isMasking: false });
            onClose();
          }}
          icon={Icons.Layers}
          purple
        >
          Release Mask
        </MI>
      ) : (
        <MI
          onClick={() => {
            updateLayer(layerId, { isMasking: true, clippingMaskType: 'clipping' });
            onClose();
          }}
          icon={Icons.Layers}
          disabled={layers.findIndex((l: any) => l.id === layerId) === layers.length - 1}
        >
          Use as Clipping Mask
        </MI>
      )}

      <Div />

      <MI onClick={() => { updateLayer(layerId, { locked: !isLocked }); onClose(); }} icon={isLocked ? Icons.Unlock : Icons.Lock}>
        {isLocked ? 'Unlock Layer' : 'Lock Layer'}
      </MI>

      {layer && !layer.componentId && !layer.masterId && (
        <MI onClick={() => { convertToComponent(layerId); onClose(); }} icon={Icons.LayoutGrid} purple>
          Convert to Component
        </MI>
      )}
      {layer?.componentId && (
        <MI onClick={() => { instantiateComponent(layer.componentId!); onClose(); }} icon={Icons.Plus}>Create Instance</MI>
      )}
      {layer?.masterId && (
        <>
          <MI onClick={() => { resetOverrides(layerId); onClose(); }} icon={Icons.Undo}>Reset Overrides</MI>
          <MI onClick={() => { detachInstance(layerId); onClose(); }} icon={Icons.Scissors}>Detach Instance</MI>
        </>
      )}

      <Div />

      <MI onClick={() => { deleteLayer(layerId); onClose(); }} icon={Icons.Trash} red>
        Delete <span className="ml-auto text-[9px] text-gray-600 font-mono">Del</span>
      </MI>
    </div>
  );
};