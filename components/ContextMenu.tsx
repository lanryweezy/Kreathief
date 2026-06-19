import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
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

  // ⚡ Bolt: Using useShallow to prevent unnecessary re-renders when unrelated store properties change.
  // This ensures ContextMenu only re-renders when the specific properties/actions destructured below actually update.
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
    addToast,
    groupSelected,
    ungroupSelected,
  } = useStore(
    useShallow((state) => ({
      duplicateLayer: state.duplicateLayer,
      deleteLayer: state.deleteLayer,
      moveLayer: state.moveLayer,
      updateLayer: state.updateLayer,
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      convertToComponent: state.convertToComponent,
      instantiateComponent: state.instantiateComponent,
      detachInstance: state.detachInstance,
      resetOverrides: state.resetOverrides,
      addToast: state.addToast,
      groupSelected: state.groupSelected,
      ungroupSelected: state.ungroupSelected,
    }))
  );

  const clipboardLayer = useStore((s) => s.clipboardLayer);
  const pasteLayer = useStore((s) => s.pasteLayer);

  const layers = React.useMemo(
    () => artboards.find((a: any) => a.id === activeArtboardId)?.layers || [],
    [artboards, activeArtboardId]
  );

  const layer = layers.find((l: any) => l.id === layerId);
  const isLocked = layer?.locked || false;

  useEffect(() => {
    if (layer) {
      setRenameValue(layer.name || '');
    }
  }, [layer]);

  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => renameInputRef.current?.select(), 50);
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('click', handleOut);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleOut);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleRename = () => {
    if (renameValue.trim()) {
      updateLayer(layerId, { name: renameValue.trim() });
    }
    setIsRenaming(false);
    onClose();
  };

  const handleExportAsPng = async () => {
    const layerEl = document.querySelector(`[data-layer-id="${layerId}"]`) as HTMLElement;
    if (!layerEl) {
      addToast?.('Could not find layer.', 'error');
      onClose();
      return;
    }
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

  const adjustedX = Math.min(x, window.innerWidth - 272);
  const adjustedY = Math.min(y, window.innerHeight - 450);

  const MI = ({ onClick, icon: Icon, children, red = false, purple = false, disabled = false }: any) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-all text-left rounded-lg mx-1 group/mi ${
        disabled
          ? 'text-gray-700 cursor-not-allowed'
          : red
            ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
            : purple
              ? 'text-[#a855f7] hover:bg-[#a855f7]/15 hover:text-[#c084fc]'
              : 'text-gray-300 hover:bg-[#7d2ae8] hover:text-white'
      }`}
      style={{ width: 'calc(100% - 8px)' }}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-70 group-hover/mi:opacity-100" />
      <span className="flex-1">{children}</span>
    </button>
  );

  const Div = () => <div className="h-px bg-white/5 my-1 mx-3" />;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-72 bg-[#1e1e1e]/98 border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] py-4 flex flex-col backdrop-blur-2xl overflow-hidden select-none"
      style={{ top: adjustedY, left: adjustedX }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="px-5 pb-3 mb-2 border-b border-white/5">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] truncate italic">
          {layer?.type || 'CORE NODE'} · {layer?.name || layerId.slice(0, 8)}
        </p>
      </div>

      {/* Rename */}
      {isRenaming ? (
        <div className="px-4 pb-3">
          <input
            ref={renameInputRef}
            value={renameValue}
            aria-label="Rename layer"
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRename();
              }
              if (e.key === 'Escape') {
                setIsRenaming(false);
                onClose();
              }
            }}
            onBlur={handleRename}
            className="w-full bg-black/40 border border-[#7d2ae8] rounded-xl px-4 py-2.5 text-sm text-white outline-none font-bold"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setIsRenaming(true)}
          className="w-full flex items-center gap-3.5 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-[#7d2ae8] hover:text-white transition-all rounded-xl mx-2 group"
          style={{ width: 'calc(100% - 16px)' }}
        >
          <Icons.Edit className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
          <span className="flex-1">Rename</span>
          <span className="text-[10px] text-slate-600 font-mono group-hover:text-white/50">F2</span>
        </button>
      )}

      <MI
        onClick={() => {
          duplicateLayer(layerId);
          onClose();
        }}
        icon={Icons.Copy}
      >
        Duplicate{' '}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+D</span>
      </MI>

      <Div />

      <MI
        onClick={() => {
          groupSelected();
          onClose();
        }}
        icon={Icons.Group}
      >
        Group <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+G</span>
      </MI>
      <MI
        onClick={() => {
          ungroupSelected();
          onClose();
        }}
        icon={Icons.Ungroup}
      >
        Ungroup{' '}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">⇧Ctrl+G</span>
      </MI>

      <Div />

      <MI
        onClick={() => {
          pasteLayer();
          onClose();
        }}
        icon={Icons.Copy}
        disabled={!clipboardLayer}
      >
        Paste Above
      </MI>
      <MI onClick={handleExportAsPng} icon={Icons.Download}>
        Snap as PNG
      </MI>

      <Div />

      <MI
        onClick={() => {
          moveLayer(layerId, 'front');
          onClose();
        }}
        icon={Icons.ArrowUp}
      >
        Bring to Front{' '}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">⇧]</span>
      </MI>
      <MI
        onClick={() => {
          moveLayer(layerId, 'back');
          onClose();
        }}
        icon={Icons.ArrowDown}
      >
        Send to Back{' '}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">⇧[</span>
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
          Use as Mask
        </MI>
      )}

      <Div />

      <MI
        onClick={() => {
          deleteLayer(layerId);
          onClose();
        }}
        icon={Icons.Trash}
        red
      >
        Delete Node{' '}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Del</span>
      </MI>
    </div>
  );
};
