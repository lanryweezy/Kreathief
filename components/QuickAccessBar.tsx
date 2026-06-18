import React from 'react';

// Simple inline icons for quick access bar
const SimpleIcons = {
  Undo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  Redo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="13" height="13" x="9" y="9" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Paste: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect width="8" height="4" x="8" y="2" rx="1" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  ZoomIn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <line x1="11" x2="11" y1="8" y2="14" />
      <line x1="8" x2="14" y1="11" y2="11" />
    </svg>
  ),
  ZoomOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <line x1="8" x2="14" y1="11" y2="11" />
    </svg>
  ),
};

interface QuickAccessBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canPaste: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  canUndo,
  canRedo,
  canCopy,
  canPaste,
  zoom,
  onZoomChange,
}) => {
  const QuickButton = ({ onClick, disabled, title, children }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded transition-all ${
        disabled ? 'opacity-30 cursor-not-allowed text-gray-600' : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-1 bg-[#252627] border border-gray-700 rounded-lg p-2 shadow-lg">
      {/* Undo/Redo */}
      <div className="flex gap-1">
        <QuickButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <SimpleIcons.Undo />
        </QuickButton>
        <QuickButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          <SimpleIcons.Redo />
        </QuickButton>
      </div>

      <div className="w-px h-6 bg-gray-700 mx-1"></div>

      {/* Copy/Paste */}
      <div className="flex gap-1">
        <QuickButton onClick={onCopy} disabled={!canCopy} title="Copy (Ctrl+C)">
          <SimpleIcons.Copy />
        </QuickButton>
        <QuickButton onClick={onPaste} disabled={!canPaste} title="Paste (Ctrl+V)">
          <SimpleIcons.Paste />
        </QuickButton>
      </div>

      <div className="w-px h-6 bg-gray-700 mx-1"></div>

      {/* Duplicate/Delete */}
      <div className="flex gap-1">
        <QuickButton onClick={onDuplicate} disabled={!canCopy} title="Duplicate (Ctrl+D)">
          <SimpleIcons.Copy />
        </QuickButton>
        <QuickButton onClick={onDelete} disabled={!canCopy} title="Delete (Del)">
          <SimpleIcons.Trash />
        </QuickButton>
      </div>

      <div className="w-px h-6 bg-gray-700 mx-1"></div>

      {/* Zoom */}
      <div className="flex items-center gap-2 px-2">
        <button
          onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Zoom Out"
        >
          <SimpleIcons.ZoomOut />
        </button>
        <span className="text-xs font-bold text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Zoom In"
        >
          <SimpleIcons.ZoomIn />
        </button>
      </div>
    </div>
  );
};
