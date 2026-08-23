import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { log } from '../utils/log';
import { exportToReactCode } from '../utils/codeExport';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ x, y, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLButtonElement[]>([]);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    addArtboard,
    showGrid,
    setShowGrid,
    showRulers,
    setShowRulers,
    clipboardLayer,
    pasteLayer,
    undo,
    redo,
    past,
    future,
  } = useStore(
    useShallow((s) => ({
      addArtboard: s.addArtboard,
      showGrid: s.showGrid,
      setShowGrid: s.setShowGrid,
      showRulers: s.showRulers,
      setShowRulers: s.setShowRulers,
      clipboardLayer: s.clipboardLayer,
      pasteLayer: s.pasteLayer,
      undo: s.undo,
      redo: s.redo,
      past: s.past,
      future: s.future,
    }))
  );

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

  let miIndex = 0;

  const MI = ({ onClick, icon: Icon, children, disabled = false }: any) => {
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
          disabled ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 hover:bg-brand-600 hover:text-white'
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
      className={`fixed z-[9999] w-72 bg-surface-dark-3/98 border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] py-4 flex flex-col backdrop-blur-2xl overflow-hidden select-none transition-opacity duration-150 pointer-events-auto ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ top: adjustedY, left: adjustedX }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-5 pb-3 mb-2 border-b border-white/5">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] truncate italic">WORKSPACE</p>
      </div>

      <MI
        onClick={() => {
          pasteLayer();
          onClose();
        }}
        icon={Icons.Copy}
        disabled={!clipboardLayer}
      >
        Paste Here
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+V</span>
      </MI>

      <Div />

      <MI
        onClick={() => {
          addArtboard();
          onClose();
        }}
        icon={Icons.Plus}
      >
        Add Canvas
      </MI>

      <Div />

      <MI
        onClick={() => {
          setShowGrid(!showGrid);
          onClose();
        }}
        icon={showGrid ? Icons.CheckSquare : Icons.Square}
      >
        {showGrid ? 'Hide Grid' : 'Show Grid'}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+'</span>
      </MI>
      <MI
        onClick={() => {
          setShowRulers(!showRulers);
          onClose();
        }}
        icon={showRulers ? Icons.CheckSquare : Icons.Square}
      >
        {showRulers ? 'Hide Rulers' : 'Show Rulers'}
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Shift+R</span>
      </MI>

      <Div />

      <MI
        onClick={() => {
          undo();
          onClose();
        }}
        icon={Icons.Undo}
        disabled={past.length === 0}
      >
        Undo
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+Z</span>
      </MI>
      <MI
        onClick={() => {
          redo();
          onClose();
        }}
        icon={Icons.Redo}
        disabled={future.length === 0}
      >
        Redo
        <span className="ml-auto text-[10px] text-slate-600 font-mono group-hover/mi:text-white/50">Ctrl+Y</span>
      </MI>
    </div>,
    document.body
  );
};
