import React from 'react';
import { Icons } from '../constants';
import { User, Project } from '../types';
import { DropdownMenu } from './DropdownMenu';
import { useStore } from '../store/useStore';
import { PublishModal } from './modals/PublishModal';
import { SyncStatus } from './SyncStatus';

interface HeaderProps {
  onDownload: () => void;
  onBack?: () => void;
  onNew?: (project: Project) => void;
  onAddArtboard?: () => void;
  onDeleteArtboard?: () => void;
  onOpenCommunity?: () => void;
  user?: User;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: (show: boolean) => void;
  showRulers: boolean;
  onToggleRulers: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onDownload, 
  onBack, 
  onNew, 
  onAddArtboard,
  onDeleteArtboard,
  onOpenCommunity,
  user,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
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
  const [showZoomMenu, setShowZoomMenu] = React.useState(false);
  const zoomButtonRef = React.useRef<HTMLButtonElement>(null);

  const onShare = () => setShowShareModal(true);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const onShowShortcuts = () => setShowShortcuts(!showShortcuts);

  const getSaveStatus = () => {
    if (isSaving) {return 'Saving...';}
    if (hasUnsavedChanges) {return 'Unsaved changes';}
    if (lastSaved) {
      const now = Date.now();
      const diff = now - lastSaved.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) {return 'Saved just now';}
      if (minutes === 1) {return 'Saved 1 min ago';}
      if (minutes < 60) {return `Saved ${minutes} mins ago`;}
      return 'Saved';
    }
    return 'Not saved';
  };

  return (
    <header className="h-14 bg-[#0a0a0a] text-white flex items-center justify-between px-6 z-50 shrink-0 border-b border-white/5 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Icons.Magic className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tighter uppercase hidden lg:block">Kreathief</span>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-500 hover:text-white group border border-transparent hover:border-white/10"
            title="Back to Dashboard"
            aria-label="Go back to Dashboard"
          >
            <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
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
                onClick: () => onZoomChange(Math.min(5, zoom + 0.1)),
              },
              {
                label: 'Zoom Out',
                icon: <Icons.Minus className="w-3.5 h-3.5" />,
                shortcut: 'Ctrl+-',
                onClick: () => onZoomChange(Math.max(0.1, zoom - 0.1)),
              },
              {
                label: 'Reset Zoom',
                onClick: () => onZoomChange(1),
              },
              { divider: true, label: '' },
              {
                label: 'Toggle Rulers',
                icon: <Icons.Layout className="w-3.5 h-3.5" />,
                onClick: () => onToggleRulers(!showRulers),
              },
              {
                label: 'Toggle Grid',
                icon: <Icons.Grid className="w-3.5 h-3.5" />,
                onClick: () => onToggleGrid(!showGrid),
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
              data-testid="project-title-input"
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {setIsEditingTitle(false);}
                if (e.key === 'Escape') {setIsEditingTitle(false);}
              }}
              autoFocus
              className="bg-transparent border-b border-purple-500 text-white text-sm font-medium px-2 py-1 outline-none w-48"
            />
          ) : (
            <button
              data-testid="project-title-display"
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
        </div>

        <SyncStatus />
      </div>

      <div className="flex items-center gap-4">
        {/* View Controls Group */}
        <div className="flex items-center bg-[#1e1e1e] rounded-xl p-0.5 border border-white/5 shadow-inner">
          <div className="flex items-center px-1">
            <button
              onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
              className="p-1.5 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <Icons.Minus className="w-3.5 h-3.5" />
            </button>
            <button
              ref={zoomButtonRef}
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="px-2 min-w-[50px] text-center text-[10px] font-black text-gray-300 hover:text-white hover:bg-white/5 rounded-md h-7 transition-colors font-mono"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
              className="p-1.5 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-gray-800 mx-0.5" />

          <div className="flex items-center gap-0.5 px-0.5">
            <button
              onClick={() => onToggleGrid(!showGrid)}
              className={`p-1.5 rounded-md transition-all ${showGrid ? 'bg-[#7d2ae8]/20 text-[#7d2ae8]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              title="Toggle Grid"
            >
              <Icons.Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleRulers(!showRulers)}
              className={`p-1.5 rounded-md transition-all ${showRulers ? 'bg-[#7d2ae8]/20 text-[#7d2ae8]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              title="Toggle Rulers"
            >
              <Icons.Layout className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="h-4 w-px bg-gray-800"></div>

        {/* Artboard Management */}
        <div className="flex items-center bg-[#1e1e1e] rounded-xl p-0.5 border border-white/5 shadow-inner">
          <button
            onClick={onDeleteArtboard}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-all"
            title="Remove Artboard"
          >
            <Icons.Minus className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-gray-800 mx-0.5" />
          <button
            onClick={onAddArtboard}
            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-white/5 rounded-md transition-all"
            title="Add Artboard"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-800"></div>

        <button
          onClick={onOpenCommunity}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-white/5"
          title="Community Templates"
        >
          <Icons.Globe className="w-3.5 h-3.5 text-[#7d2ae8]" />
          <span className="hidden lg:inline">Community</span>
        </button>

        <div className="h-4 w-px bg-gray-800"></div>

        <div className="flex items-center gap-1">
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
        </div>

        <div className="h-4 w-px bg-gray-800"></div>

        <button
          id="export-btn"
          data-testid="export-btn"
          onClick={onDownload}
          className="bg-white text-black hover:bg-[#00c4cc] hover:text-white px-5 h-9 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 active:scale-95"
        >
          <Icons.Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export</span>
        </button>

        {user && (
          <div className="w-7 h-7 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden shadow-sm hover:border-[#7d2ae8] transition-colors cursor-pointer">
            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
          </div>
        )}
      </div>

      {/* Zoom Dropdown */}
      {showZoomMenu && (
        <div 
          className="fixed z-[100] mt-2 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 w-32"
          style={{ 
            top: zoomButtonRef.current?.getBoundingClientRect().bottom,
            left: zoomButtonRef.current?.getBoundingClientRect().left
          }}
        >
          {[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5].map((z) => (
            <button
              key={z}
              onClick={() => { onZoomChange(z); setShowZoomMenu(false); }}
              className={`w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-colors rounded-lg ${zoom === z ? 'bg-[#7d2ae8] text-white' : 'text-gray-300 hover:bg-white/10'}`}
            >
              {z * 100}%
            </button>
          ))}
          <div className="h-px bg-white/5 my-1" />
          <button
            onClick={() => { onZoomChange(1); setShowZoomMenu(false); }}
            className="w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
          >
            Fit Screen
          </button>
        </div>
      )}

      {showPublishModal && <PublishModal onClose={() => setShowPublishModal(false)} />}
    </header>
  );
};
