
import React from 'react';
import { Icons } from '../constants';
import { Button } from './Button';
import { User } from '../types';

interface HeaderProps {
  onDownload: () => void;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleShortcuts?: () => void;
  isSaving?: boolean;
  onBack?: () => void;
  user?: User;
}

export const Header: React.FC<HeaderProps> = ({ 
  onDownload, 
  title = "Untitled Design",
  onTitleChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleShortcuts,
  isSaving = false,
  onBack,
  user
}) => {
  return (
    <header className="h-14 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white flex items-center justify-between px-4 shadow-md z-50 shrink-0">
      <div className="flex items-center gap-4">
        {onBack ? (
           <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-full transition-colors" title="Back to Dashboard">
              <Icons.ArrowUp className="w-5 h-5 -rotate-90" />
           </button>
        ) : (
           <div className="flex items-center gap-2 cursor-pointer hover:opacity-90">
              <div className="font-bold text-2xl font-display tracking-tight">Kreathief</div>
              <div className="text-[10px] uppercase font-semibold bg-white/20 px-1.5 py-0.5 rounded">AI</div>
           </div>
        )}
        
        <div className="h-6 w-px bg-white/30 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-4 text-sm font-medium hidden sm:flex">
          <button className="hover:text-white/80 transition-colors">File</button>
          <button className="hover:text-white/80 transition-colors">Edit</button>
          <button className="hover:text-white/80 transition-colors">View</button>
        </div>

        <div className="h-6 w-px bg-white/30 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-1">
           <button 
             onClick={onUndo} 
             disabled={!canUndo}
             className="p-1.5 rounded hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors" 
             title="Undo (Ctrl+Z)"
           >
             <Icons.Undo className="w-4 h-4" />
           </button>
           <button 
             onClick={onRedo}
             disabled={!canRedo} 
             className="p-1.5 rounded hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors" 
             title="Redo (Ctrl+Shift+Z)"
           >
             <Icons.Redo className="w-4 h-4" />
           </button>
        </div>
        
        <span className="text-xs text-white/70 ml-2 hidden lg:block min-w-[80px]">
          {isSaving ? "Saving..." : "Saved"}
        </span>
      </div>

      <div className="flex-1 flex justify-center px-4">
        {onTitleChange ? (
          <input 
            type="text" 
            value={title} 
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent text-center font-medium text-sm border-b border-transparent hover:border-white/50 focus:border-white focus:outline-none transition-colors max-w-md px-2 truncate"
          />
        ) : (
          <div className="font-medium text-sm opacity-90 truncate max-w-md px-4">
            {title}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button 
           onClick={onToggleShortcuts}
           className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block"
           title="Keyboard Shortcuts (?)"
        >
           <Icons.Help className="w-5 h-5" />
        </button>
        
        {user && (
           <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
              <img src={user.avatar} className="w-full h-full object-cover" />
           </div>
        )}
        
        <Button 
          variant="secondary" 
          size="sm" 
          className="bg-white text-purple-700 hover:bg-gray-100 font-bold border-none shadow-lg"
          onClick={onDownload}
        >
          <Icons.Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </header>
  );
};
