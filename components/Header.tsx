
import React from 'react';
import { Icons } from '../constants';
import { Button } from './Button';
import { User } from '../types';
import { DropdownMenu } from './DropdownMenu';

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
  onShare?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onToggleGrid?: () => void;
  showGrid?: boolean;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onResetZoom?: () => void;
  onCut?: () => void;
  onCopyToClipboard?: () => void;
  onRestartTour?: () => void;
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
  user,
  onShare,
  onNew,
  onOpen,
  onSave,
  onZoomIn,
  onZoomOut,
  onToggleGrid,
  showGrid = false,
  onCopy,
  onPaste,
  onDelete,
  onDuplicate,
  onResetZoom,
  onCut,
  onCopyToClipboard,
  onRestartTour
}) => {
  const fileItems = [
    { label: 'New Design', icon: <Icons.Plus className="w-3.5 h-3.5" />, shortcut: 'Ctrl + N', onClick: onNew || (() => { }) },
    { label: 'Open...', icon: <Icons.Folder className="w-3.5 h-3.5" />, shortcut: 'Ctrl + O', onClick: onOpen || (() => { }) },
    { label: 'Save As...', icon: <Icons.Download className="w-3.5 h-3.5" />, shortcut: 'Ctrl + S', onClick: onSave || (() => { }) },
    { label: 'Copy Image', icon: <Icons.Copy className="w-3.5 h-3.5" />, shortcut: 'Ctrl+Shift+C', onClick: onCopyToClipboard || (() => { }) },
    { label: 'Export...', icon: <Icons.Image className="w-3.5 h-3.5" />, shortcut: 'Ctrl + E', onClick: onDownload, divider: true },
  ];

  const editItems = [
    { label: 'Undo', icon: <Icons.Undo className="w-3.5 h-3.5" />, shortcut: 'Ctrl + Z', onClick: onUndo || (() => { }), disabled: !canUndo },
    { label: 'Redo', icon: <Icons.Redo className="w-3.5 h-3.5" />, shortcut: 'Ctrl + Shift + Z', onClick: onRedo || (() => { }), disabled: !canRedo },
    { label: 'Cut', icon: <Icons.Scissors className="w-3.5 h-3.5" />, shortcut: 'Ctrl + X', onClick: onCut || (() => { }), divider: true },
    { label: 'Copy', icon: <Icons.Copy className="w-3.5 h-3.5" />, shortcut: 'Ctrl + C', onClick: onCopy || (() => { }) },
    { label: 'Paste', icon: <Icons.Download className="w-3.5 h-3.5" />, shortcut: 'Ctrl + V', onClick: onPaste || (() => { }) },
    { label: 'Duplicate', icon: <Icons.Magic className="w-3.5 h-3.5" />, shortcut: 'Ctrl + D', onClick: onDuplicate || (() => { }) },
    { label: 'Delete', icon: <Icons.Trash className="w-3.5 h-3.5" />, shortcut: 'Del', onClick: onDelete || (() => { }), danger: true },
  ];

  const viewItems = [
    { label: 'Zoom In', icon: <Icons.Plus className="w-3.5 h-3.5" />, shortcut: 'Ctrl + +', onClick: onZoomIn || (() => { }) },
    { label: 'Zoom Out', icon: <Icons.Minus className="w-3.5 h-3.5" />, shortcut: 'Ctrl + -', onClick: onZoomOut || (() => { }) },
    { label: 'Reset Zoom', onClick: onResetZoom || (() => { }), divider: true },
    { label: showGrid ? 'Hide Grid' : 'Show Grid', icon: <Icons.Grid className="w-3.5 h-3.5" />, shortcut: 'G', onClick: onToggleGrid || (() => { }) },
    { label: 'Keyboard Shortcuts', icon: <Icons.Keyboard className="w-3.5 h-3.5" />, shortcut: '?', onClick: onToggleShortcuts || (() => { }) },
    { label: 'Take Tour', icon: <Icons.Magic className="w-3.5 h-3.5" />, onClick: onRestartTour || (() => { }) },
  ];

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

        <div className="flex items-center gap-1 text-sm font-medium hidden sm:flex">
          <DropdownMenu label="File" items={fileItems} />
          <DropdownMenu label="Edit" items={editItems} />
          <DropdownMenu label="View" items={viewItems} />
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

        <div className="flex items-center gap-2 ml-2 min-w-[100px] hidden lg:flex">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSaving ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"}`}></div>
          <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${isSaving ? "text-amber-200" : "text-emerald-200 opacity-80"}`}>
            {isSaving ? "Syncing..." : "Synced"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 group/title relative">
        {onTitleChange ? (
          <div className="relative max-w-md w-full flex justify-center">
            <input
              id="header-title"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-transparent text-center font-bold text-base border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none transition-all px-2 truncate cursor-edit"
              placeholder="Enter design name"
            />
            <Icons.Scissors className="w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/title:opacity-40 transition-opacity pointer-events-none rotate-45" />
          </div>
        ) : (
          <div className="font-bold text-base opacity-90 truncate max-w-md px-4">
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

        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all border border-white/20"
          >
            <Icons.Send className="w-4 h-4" /> Share
          </button>
        )}

        <Button
          id="export-btn"
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
