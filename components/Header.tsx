import React from 'react';
import { Icons } from '../constants';
import { Button } from './Button';
import { User, Project } from '../types';
import { DropdownMenu } from './DropdownMenu';
import { useStore } from '../store/useStore';
import { PublishModal } from './modals/PublishModal';

interface HeaderProps {
  onDownload: () => void;
  onBack?: () => void;
  onNew?: (project: Project) => void;
  onAddArtboard?: () => void;
  onDeleteArtboard?: () => void;
  onOpenCommunity?: () => void;
  user?: User;
}

export const Header: React.FC<HeaderProps> = ({ 
  onDownload, 
  onBack, 
  onNew, 
  onAddArtboard,
  onDeleteArtboard,
  onOpenCommunity,
  user 
}) => {
  const {
    undo,
    redo,
    past,
    future,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    projectTitle,
    setProjectTitle,
    saveProject: onSave,
    showShortcuts,
    setShowShortcuts,
    setShowShareModal,
  } = useStore();

  const [showPublishModal, setShowPublishModal] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);

  const onShare = () => setShowShareModal(true);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const onShowShortcuts = () => setShowShortcuts(!showShortcuts);

  const getSaveStatus = () => {
    if (isSaving) return 'Saving...';
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (lastSaved) {
      const now = Date.now();
      const diff = now - lastSaved.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Saved just now';
      if (minutes === 1) return 'Saved 1 min ago';
      if (minutes < 60) return `Saved ${minutes} mins ago`;
      return 'Saved';
    }
    return 'Not saved';
  };

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
                        artboards: [{
                          id: 'artboard_1',
                          name: 'Artboard 1',
                          x: 0,
                          y: 0,
                          width: 1080,
                          height: 1080,
                          layers: [],
                        }],
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
          {/* Project Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              autoFocus
              className="bg-transparent border-b border-purple-500 text-white text-sm font-medium px-2 py-1 outline-none w-48"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-medium text-white hover:text-purple-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
              title="Click to rename"
            >
              {projectTitle}
            </button>
          )}

          {/* Save Status */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isSaving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span>Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Unsaved</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{getSaveStatus()}</span>
              </>
            )}
          </div>

          {/* Artboard Management */}
          <div className="flex items-center bg-[#1e1e1e] rounded-lg p-0.5 border border-white/5 shadow-inner ml-4">
            <button
              onClick={onDeleteArtboard}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-all"
              title="Remove Artboard"
            >
              <Icons.Minus className="w-3 h-3" />
            </button>
            <div className="w-px h-3 bg-gray-800 mx-0.5" />
            <button
              onClick={onAddArtboard}
              className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-white/5 rounded-md transition-all"
              title="Add Artboard"
            >
              <Icons.Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommunity}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-white/5"
          title="Community Templates"
        >
          <Icons.Globe className="w-3.5 h-3.5 text-[#7d2ae8]" />
          <span className="hidden lg:inline">Community</span>
        </button>

        <div className="h-4 w-px bg-gray-800"></div>

        <button
          onClick={onShowShortcuts}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Keyboard Shortcuts (?)"
          aria-label="Show keyboard shortcuts"
        >
          <Icons.Help className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowPublishModal(true)}
          className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
          title="Publish to Community"
          aria-label="Publish design"
        >
          <Icons.Globe className="w-4 h-4" />
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

      {showPublishModal && <PublishModal onClose={() => setShowPublishModal(false)} />}
    </header>
  );
};
