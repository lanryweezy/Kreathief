
import React from 'react';
import { Icons } from '../constants';
import { Button } from './Button';
import { User } from '../types';

interface HeaderProps {
  onDownload: () => void;
  onSave?: () => void;
  onNew?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  isSaving?: boolean;
  onBack?: () => void;
  user?: User;
  onShare?: () => void;
  onRestartTour?: () => void;
  onShowShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onDownload,
  onSave,
  onNew,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  title = "Untitled Design",
  onTitleChange,
  isSaving = false,
  onBack,
  user,
  onShare,
  onRestartTour,
  onShowShortcuts
}) => {
  return (
    <header className="h-12 bg-[#0e1318] text-white flex items-center justify-between px-4 shadow-lg z-50 shrink-0 border-b border-gray-800">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-md transition-all text-gray-400 hover:text-white"
            title="Back"
          >
            <Icons.ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="hidden md:flex items-center gap-1 px-2">
          <button className="px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors">File</button>
          <button className="px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors" onClick={() => (window as any).dispatchEvent(new CustomEvent('editor-edit-menu'))}>Edit</button>
          <button className="px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors">View</button>
        </div>

        <div className="hidden md:block h-4 w-px bg-gray-800 mx-1"></div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-all ${canUndo ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
            title="Undo (Ctrl+Z)"
          >
            <Icons.Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-all ${canRedo ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
            title="Redo (Ctrl+Y)"
          >
            <Icons.Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-800 mx-1"></div>

        <div className="flex items-center gap-2 px-2">
          <div className={`sync-dot ${isSaving ? "sync-dot-saving" : ""}`}></div>
          <span className="hidden md:block text-[9px] uppercase tracking-wider font-bold text-gray-500">
            {isSaving ? "Saving..." : "Saved"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 max-w-sm">
        {onTitleChange ? (
          <div className="relative w-full flex justify-center group">
            <input
              id="header-title"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-transparent text-center font-bold text-sm text-gray-200 border-b border-transparent hover:border-gray-700 focus:border-[#7d2ae8] focus:outline-none transition-all px-2 truncate w-full"
              placeholder="Untitled Design"
            />
          </div>
        ) : (
          <div className="font-bold text-sm text-gray-200 truncate">{title}</div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Icons.Help className="w-4 h-4" />
          </button>
        )}

        {onShare && (
          <button
            onClick={onShare}
            className="p-2 text-gray-400 hover:text-[#00c4cc] transition-colors"
            title="Share Design"
          >
            <Icons.Share className="w-4 h-4" />
          </button>
        )}

        <div className="h-4 w-px bg-gray-800"></div>

        <Button
          id="export-btn"
          variant="secondary"
          size="sm"
          className="bg-[#7d2ae8] text-white hover:bg-[#6b23c5] font-bold border-none shadow-lg h-8 px-4"
          onClick={onDownload}
        >
          <Icons.Download className="w-3.5 h-3.5 md:mr-2" />
          <span className="hidden md:inline">Export</span>
        </Button>

        {user && (
          <div className="w-7 h-7 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden shadow-sm hover:border-[#7d2ae8] transition-colors cursor-pointer">
            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
          </div>
        )}
      </div>
    </header>
  );
};
