import React, { useEffect, useRef } from 'react';
import { Icons } from '../constants';

interface ContextMenuProps {
  x: number;
  y: number;
  layerId: string;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveForward: (id: string) => void;
  onMoveBackward: (id: string) => void;
  onLock: (id: string) => void;
  isLocked: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  layerId,
  onClose,
  onDuplicate,
  onDelete,
  onMoveForward,
  onMoveBackward,
  onLock,
  isLocked
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

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
      
      <button onClick={() => { onDuplicate(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#7d2ae8] hover:text-white transition-colors text-left">
        <Icons.Copy className="w-4 h-4" /> Duplicate
      </button>
      
      <button onClick={() => { onMoveForward(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
        <Icons.ArrowUp className="w-4 h-4" /> Bring Forward
      </button>
      
      <button onClick={() => { onMoveBackward(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
        <Icons.ArrowDown className="w-4 h-4" /> Send Backward
      </button>

      <div className="h-px bg-gray-700 my-1"></div>

      <button onClick={() => { onLock(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors text-left">
        {isLocked ? <Icons.Unlock className="w-4 h-4" /> : <Icons.Lock className="w-4 h-4" />}
        {isLocked ? "Unlock" : "Lock"}
      </button>

      <div className="h-px bg-gray-700 my-1"></div>

      <button onClick={() => { onDelete(layerId); onClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors text-left">
        <Icons.Trash className="w-4 h-4" /> Delete
      </button>
    </div>
  );
};