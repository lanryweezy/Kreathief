import React from 'react';
import { Icons } from '../constants';
import { User, Project } from '../types';
import { DropdownMenu } from './DropdownMenu';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { PublishModal } from './modals/PublishModal';

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
  } = useStore(
    useShallow((state) => ({
      undo: state.undo,
      redo: state.redo,
      past: state.past,
      future: state.future,
      isSaving: state.isSaving,
      lastSaved: state.lastSaved,
      hasUnsavedChanges: state.hasUnsavedChanges,
      projectTitle: state.projectTitle,
      setProjectTitle: state.setProjectTitle,
      saveProject: state.saveProject,
      showShortcuts: state.showShortcuts,
      setShowShortcuts: state.setShowShortcuts,
      setShowShareModal: state.setShowShareModal,
      zoom: state.zoom,
      setZoom: state.setZoom,
      isCommandPaletteOpen: state.isCommandPaletteOpen,
      setCommandPaletteOpen: state.setCommandPaletteOpen,
      syncStatus: state.syncStatus,
    }))
  );

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
    <header className="h-14 bg-[#0a0a0a] text-white flex items-center justify-between px-6 z-50 shrink-0 border-b border-white/5 shadow-2xl relative">
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

        <div className="flex items-center gap-2 text-[11px] text-gray-400 ml-2 select-none shrink-0 font-medium tracking-wide">
          {isSaving ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
              <span>Saving...</span>
            </>
          ) : hasUnsavedChanges ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>Unsaved</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span>{getSaveStatus()}</span>
            </>
          )}
        </div>

      </div>

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
          <div 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const avatarUrl = evt.target?.result as string;
                    useStore.getState().setUser({
                      ...user,
                      avatar: avatarUrl
                    });
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            className="w-7 h-7 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden shadow-sm hover:border-[#7d2ae8] transition-colors cursor-pointer relative"
            title="Click to update profile image"
          >
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

      {/* Centered Project Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-auto">
        {isEditingTitle ? (
          <input
            data-testid="project-title-input"
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {setIsEditingTitle(false);}
              if (e.key === 'Escape') {setIsEditingTitle(false);}
            }}
            autoFocus
            className="bg-[#1e1e1e] border-b-2 border-purple-500 text-white text-sm font-bold px-2 py-1 outline-none w-48 rounded-t shadow-lg text-center"
          />
        ) : (
          <button
            data-testid="project-title-display"
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-medium text-white hover:text-purple-400 transition-colors px-2 py-1 rounded hover:bg-white/5 text-center"
            title="Click to rename"
          >
            {projectTitle}
          </button>
        )}
      </div>

      {showPublishModal && <PublishModal onClose={() => setShowPublishModal(false)} />}
    </header>
  );
};
