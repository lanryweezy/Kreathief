import React from 'react';
import { Icons } from '../constants';
import { Button } from './Button';
import { User, Project } from '../types';
import { DropdownMenu } from './DropdownMenu';
import { useStore } from '../store/useStore';

interface HeaderProps {
  onDownload: () => void;
  onBack?: () => void;
  onNew?: (project: Project) => void;
  user?: User;
}

export const Header: React.FC<HeaderProps> = ({ onDownload, onBack, onNew, user }) => {
  const {
    undo,
    redo,
    past,
    future,
    projectTitle: title,
    setProjectTitle: onTitleChange,
    isSaving,
    saveProject: onSave,
    showShortcuts,
    setShowShortcuts,
    setShowShareModal,
  } = useStore();

  const onShare = () => setShowShareModal(true);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const onShowShortcuts = () => setShowShortcuts(!showShortcuts);

  return (
    <header className="h-12 bg-[#0e1318] text-white flex items-center justify-between px-4 shadow-lg z-50 shrink-0 border-b border-gray-800">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-md transition-all text-gray-400 hover:text-white"
            title="Back"
            aria-label="Go back to Dashboard"
          >
            <Icons.ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="hidden md:flex items-center gap-1 px-2">
          <DropdownMenu
            label="File"
            items={[
              {
                label: 'New Design',
                icon: <Icons.FolderPlus className="w-3.5 h-3.5" />,
                onClick: () => {
                  if (onNew) {
                    onNew({
                      id: `project_${Date.now()}`,
                      name: 'Untitled Design',
                      updatedAt: Date.now(),
                      state: {
                        layers: [],
                        canvasBackgroundColor: '#ffffff',
                        canvasFilters: {
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          sepia: 0,
                          grayscale: 0,
                          blur: 0,
                          opacity: 1,
                          vignette: 0,
                          hueRotate: 0,
                        },
                        canvasSize: { width: 1080, height: 1080, name: 'Square (IG Post)' },
                      },
                    });
                  }
                },
              },
              {
                label: 'Save (Ctrl+S)',
                icon: <Icons.CheckSquare className="w-3.5 h-3.5" />,
                onClick: onSave || (() => {}),
              },
              { divider: true, label: '' },
              { label: 'Export...', icon: <Icons.Download className="w-3.5 h-3.5" />, onClick: onDownload },
            ]}
          />
          <DropdownMenu
            label="Edit"
            items={[
              {
                label: 'Undo',
                icon: <Icons.Undo className="w-3.5 h-3.5" />,
                shortcut: 'Ctrl+Z',
                disabled: !canUndo,
                onClick: undo || (() => {}),
              },
              {
                label: 'Redo',
                icon: <Icons.Redo className="w-3.5 h-3.5" />,
                shortcut: 'Ctrl+Y',
                disabled: !canRedo,
                onClick: redo || (() => {}),
              },
              { divider: true, label: '' },
              {
                label: 'Keyboard Shortcuts',
                icon: <Icons.Help className="w-3.5 h-3.5" />,
                shortcut: '?',
                onClick: onShowShortcuts || (() => {}),
              },
            ]}
          />
          <DropdownMenu
            label="View"
            items={[
              {
                label: 'Zoom In',
                icon: <Icons.Plus className="w-3.5 h-3.5" />,
                shortcut: 'Ctrl++',
                onClick: () => (window as any).dispatchEvent(new CustomEvent('editor-zoom-in')),
              },
              {
                label: 'Zoom Out',
                icon: <Icons.Minus className="w-3.5 h-3.5" />,
                shortcut: 'Ctrl+-',
                onClick: () => (window as any).dispatchEvent(new CustomEvent('editor-zoom-out')),
              },
              {
                label: 'Reset Zoom',
                onClick: () => (window as any).dispatchEvent(new CustomEvent('editor-zoom-reset')),
              },
              { divider: true, label: '' },
              {
                label: 'Toggle Rulers',
                icon: <Icons.Layout className="w-3.5 h-3.5" />,
                onClick: () => (window as any).dispatchEvent(new CustomEvent('editor-toggle-rulers')),
              },
              {
                label: 'Toggle Grid',
                icon: <Icons.Grid className="w-3.5 h-3.5" />,
                onClick: () => (window as any).dispatchEvent(new CustomEvent('editor-toggle-grid')),
              },
              {
                label: 'Toggle Golden Ratio',
                icon: <Icons.Maximize className="w-3.5 h-3.5" />,
                onClick: () => (window as any).dispatchEvent(new CustomEvent('editor-toggle-golden-ratio')),
              },
            ]}
          />
        </div>

        <div className="hidden md:block h-4 w-px bg-gray-800 mx-1"></div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-all ${canUndo ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last action"
          >
            <Icons.Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-all ${canRedo ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
            title="Redo (Ctrl+Y)"
            aria-label="Redo last action"
          >
            <Icons.Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-800 mx-1"></div>

        <div className="flex items-center gap-2 px-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <button onClick={onBack} className="hover:text-[#7d2ae8] transition-colors">
              Home
            </button>
            <Icons.ArrowRight className="w-2.5 h-2.5" />
            <span className="text-gray-400 truncate max-w-[100px]">{title}</span>
          </div>
          <div className="h-4 w-px bg-gray-800 mx-2"></div>
          <div className={`sync-dot ${isSaving ? 'sync-dot-saving' : ''}`}></div>
          <span className="hidden md:block text-[9px] uppercase tracking-wider font-bold text-gray-500">
            {isSaving ? 'Saving...' : 'Saved'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 max-w-sm">
        <div className="relative w-full flex justify-center group">
          <input
            id="header-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent text-center font-bold text-sm text-gray-200 border-b border-transparent hover:border-gray-700 focus:border-[#7d2ae8] focus:outline-none transition-all px-2 truncate w-full"
            placeholder="Untitled Design"
            aria-label="Design Title"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onShowShortcuts}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Keyboard Shortcuts (?)"
          aria-label="Show keyboard shortcuts"
        >
          <Icons.Help className="w-4 h-4" />
        </button>

        <button
          onClick={onShare}
          className="p-2 text-gray-400 hover:text-[#00c4cc] transition-colors"
          title="Share Design"
          aria-label="Share design"
        >
          <Icons.Share className="w-4 h-4" />
        </button>

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
