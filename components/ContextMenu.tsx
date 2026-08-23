import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';
import { log } from '../utils/log';
import { exportToReactCode } from '../utils/codeExport';
import { cleanSvgMarkup } from '../services/exportService';

// 2026 AI Actions available on selected layers via delegative UX pattern
const AI_ACTIONS = [
  {
    id: 'remove-bg',
    label: 'AI Subject Cutout',
    hint: 'Instantly remove background with AI',
    icon: 'Wand',
    type: 'image',
  },
  {
    id: 'extract-colors',
    label: 'Extract Photo Colors',
    hint: 'Auto-extract dominant palette',
    icon: 'Palette',
    type: 'image',
  },
  {
    id: 'vectorize',
    label: 'Convert to Vector',
    hint: 'Convert photo to editable vector paths',
    icon: 'Pen',
    type: 'image',
  },
  { id: 'upscale', label: 'AI Upscale (4x)', hint: 'Make image crisp and high-res', icon: 'Zap', type: 'image' },
  { id: 'fix-contrast', label: 'Fix Contrast', hint: 'AI adjusts colors for WCAG AA', icon: 'Sun', type: 'text' },
  {
    id: 'text-texture',
    label: 'AI Text Texture',
    hint: 'Generate realistic 3D texture for this text',
    icon: 'Sparkles',
    type: 'text',
  },
  {
    id: 'auto-layout',
    label: 'Auto-Layout Layer',
    hint: 'AI applies smart alignment',
    icon: 'LayoutTemplate',
    type: 'all',
  },
] as const;

interface ContextMenuProps {
  x: number;
  y: number;
  layerId: string;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, layerId, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLButtonElement[]>([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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
    undo,
    groupSelected,
    ungroupSelected,
    setActivePanel,
    removeBackground,
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
      undo: state.undo,
      groupSelected: state.groupSelected,
      ungroupSelected: state.ungroupSelected,
      setActivePanel: (state as any).setActivePanel,
      removeBackground: (state as any).removeBackground,
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
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (visible) {
      menuItemsRef.current[0]?.focus();
    }
  }, [visible]);

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

  // 2026 delegative AI: handle inline AI actions directly on the selected layer
  const handleAIAction = (actionId: (typeof AI_ACTIONS)[number]['id']) => {
    switch (actionId) {
      case 'remove-bg': {
        if (layer?.type !== 'image') {
          addToast?.('Background removal requires an image layer', 'error');
        } else if (removeBackground) {
          removeBackground(layerId);
          addToast?.('Removing background...', 'info');
        } else {
          addToast?.('Select an image layer to remove its background', 'error');
        }
        break;
      }
      case 'fix-contrast': {
        if (layer?.type === 'text') {
          if (setActivePanel) {
            setActivePanel('accessibility');
          }
          addToast?.('Contrast checker opened — reviewing this layer', 'info');
        } else {
          addToast?.('Contrast fix works on text layers', 'error');
        }
        break;
      }
      case 'text-texture': {
        if (layer?.type === 'text') {
          useStore.getState().generateTextTexture?.(layerId);
          addToast?.('Generating AI texture for text...', 'info');
        }
        break;
      }
      case 'auto-layout': {
        updateLayer(layerId, { x: Math.round((layer?.x ?? 0) / 8) * 8, y: Math.round((layer?.y ?? 0) / 8) * 8 });
        addToast?.('Layer snapped to 8pt grid', 'success');
        break;
      }
      case 'extract-colors': {
        if (layer?.type === 'image') {
          useStore.getState().extractPhotoColors?.(layerId);
          addToast?.('Extracting photo colors to palette...', 'info');
        }
        break;
      }
      case 'vectorize': {
        if (layer?.type === 'image') {
          useStore.getState().vectorizeLayer(layerId, {});
          addToast?.('Converting photo to vector paths...', 'info');
        }
        break;
      }
      case 'upscale': {
        if (layer?.type === 'image') {
          useStore.getState().onUpscale(layerId);
          addToast?.('AI Upscaling started...', 'info');
        }
        break;
      }
    }
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
    } catch (e) {
      log.error('[ContextMenu] Layer export as PNG failed', e, { layerId });
      addToast?.('Export failed. Use the main Export button.', 'error');
    }
    onClose();
  };

  const handleCopyAsReact = async () => {
    try {
      if (!layer) {
        return;
      }
      const fakeArtboard = {
        id: 'fake_export',
        name: layer.name || 'Component',
        x: 0,
        y: 0,
        width: (layer as any).width || 100,
        height: (layer as any).height || 100,
        layers: [layer],
      };
      const code = exportToReactCode(fakeArtboard as any, {
        framework: 'react',
        styling: 'tailwind',
        typescript: true,
      });
      await navigator.clipboard.writeText(code);
      addToast?.('React Tailwind component copied to clipboard!', 'success');
      onClose();
    } catch (e: any) {
      addToast?.('Failed to copy code: ' + e.message, 'error');
    }
  };

  const handleCopyAsSVG = async () => {
    try {
      if (!layer) {
        return;
      }
      const shape = layer as any;
      let svgContent = '';
      const viewBox = shape.pathData
        ? `0 0 ${shape.width || 100} ${shape.height || 100}`
        : `0 0 ${shape.width || 100} ${shape.height || 100}`;
      if (shape.type === 'shape' && shape.pathData) {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${shape.width}" height="${shape.height}"><path d="${shape.pathData}" fill="${shape.color || '#7d2ae8'}"/></svg>`;
      } else {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${shape.width || 100} ${shape.height || 100}" width="${shape.width || 100}" height="${shape.height || 100}"><rect x="0" y="0" width="${shape.width || 100}" height="${shape.height || 100}" fill="${shape.color || '#7d2ae8'}" rx="${shape.cornerRadius || 0}"/></svg>`;
      }
      await navigator.clipboard.writeText(cleanSvgMarkup(svgContent));
      addToast?.('Cleaned SVG copied to clipboard!', 'success');
      onClose();
    } catch (e: any) {
      addToast?.('Failed to copy SVG: ' + e.message, 'error');
    }
  };

  const adjustedX = Math.min(x, window.innerWidth - 272);
  const adjustedY = Math.min(y, window.innerHeight - 450);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = Math.min(prev + 1, menuItemsRef.current.length - 1);
        menuItemsRef.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        menuItemsRef.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      menuItemsRef.current[activeIndex]?.click();
    }
  };

  let miIndex = 1;

  const MI = ({ onClick, icon: Icon, children, red = false, purple = false, disabled = false }: any) => {
    const currentIndex = miIndex++;
    return (
      <button
        ref={(el) => {
          menuItemsRef.current[currentIndex] = el!;
        }}
        role="menuitem"
        tabIndex={currentIndex === activeIndex ? 0 : -1}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-all text-left rounded-lg mx-1 group/mi ${
          disabled
            ? 'text-gray-700 cursor-not-allowed'
            : red
              ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
              : purple
                ? 'text-brand-400 hover:bg-brand-400/15 hover:text-brand-300'
                : 'text-gray-300 hover:bg-brand-600 hover:text-white'
        }`}
        style={{ width: 'calc(100% - 8px)' }}
      >
        <Icon className="w-4 h-4 shrink-0 opacity-70 group-hover/mi:opacity-100" />
        <span className="flex-1">{children}</span>
      </button>
    );
  };

  const Div = () => <div className="h-px bg-white/5 my-1 mx-3" />;

  return createPortal(
    <div
      ref={menuRef}
      data-context-menu
      role="menu"
      onKeyDown={handleKeyDown}
      className={`fixed z-toast w-72 bg-surface-dark-3/98 border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] py-4 flex flex-col backdrop-blur-2xl overflow-hidden select-none transition-opacity duration-150 pointer-events-auto ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ top: adjustedY, left: adjustedX }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="px-5 pb-3 mb-2 border-b border-white/5">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] truncate italic">
          {String(layer?.type || 'CORE NODE')} · {String(layer?.name || layerId.slice(0, 8))}
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
            className="w-full bg-black/40 border border-brand-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none font-bold"
            autoFocus
          />
        </div>
      ) : (
        <button
          ref={(el) => {
            menuItemsRef.current[0] = el!;
          }}
          role="menuitem"
          tabIndex={0 === activeIndex ? 0 : -1}
          onClick={() => setIsRenaming(true)}
          className="w-full flex items-center gap-3.5 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-brand-600 hover:text-white transition-all rounded-xl mx-2 group"
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

      <MI onClick={handleCopyAsReact} icon={Icons.Code}>
        Copy as React (Tailwind)
      </MI>
      {((layer?.type as any) === 'shape' ||
        layer?.type === 'rectangle' ||
        layer?.type === 'circle' ||
        layer?.type === 'path') && (
        <MI onClick={handleCopyAsSVG} icon={Icons.Image}>
          Copy as SVG
        </MI>
      )}

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
          moveLayer(layerId, 'front');
          onClose();
        }}
        icon={Icons.BringToFront}
      >
        Bring to Front
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+]</span>
      </MI>
      <MI
        onClick={() => {
          moveLayer(layerId, 'back');
          onClose();
        }}
        icon={Icons.SendToBack}
      >
        Send to Back
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+[</span>
      </MI>

      <Div />

      <MI
        onClick={() => {
          updateLayer(layerId, { locked: !isLocked });
          onClose();
        }}
        icon={isLocked ? Icons.Unlock : Icons.Lock}
      >
        {isLocked ? 'Unlock Layer' : 'Lock Layer'}
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

      {/* AI Actions Section - 2026 delegative AI UX */}
      <div className="px-5 pb-2 pt-1">
        <p className="text-[10px] font-black text-cyan-500/70 uppercase tracking-[0.2em]">AI Actions</p>
      </div>
      {AI_ACTIONS.filter((a) => a.type === 'all' || a.type === layer?.type).map((action) => {
        const AiIcon = (Icons as any)[action.icon] || Icons.Sparkles;
        return (
          <button
            key={action.id}
            role="menuitem"
            onClick={() => handleAIAction(action.id)}
            className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm transition-all text-left rounded-lg mx-1 group/mi text-cyan-300 hover:bg-cyan-500/15 hover:text-cyan-200`}
            style={{ width: 'calc(100% - 8px)' }}
          >
            <AiIcon className="w-4 h-4 shrink-0 opacity-70 group-hover/mi:opacity-100" />
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-sm leading-none">{action.label}</span>
              <span className="text-[10px] text-cyan-600/70 mt-0.5 group-hover/mi:text-cyan-400/70 leading-none">
                {action.hint}
              </span>
            </div>
          </button>
        );
      })}

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
          if (window.confirm('Delete layer?')) {
            deleteLayer(layerId);
            addToast?.('Layer deleted', 'info', { label: 'Undo', onClick: undo });
          }
          onClose();
        }}
        icon={Icons.Trash}
        red
      >
        Delete Node{' '}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Del</span>
      </MI>
      <Div />
    </div>,
    document.body
  );
};
