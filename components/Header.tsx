import React from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../constants';
import { User, Project, AnimationSettings } from '../types';
import { DropdownMenu } from './DropdownMenu';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { PresenceBar } from './collaboration/PresenceBar';
import { Button } from './Button';
import { ConnectionStatus } from './ConnectionStatus';

const MagicPanel = React.lazy(() => import('./panels/MagicPanel'));
const AssistantPanel = React.lazy(() => import('./panels/AssistantPanel'));

interface HeaderProps {
  onDownload: () => void;
  onBack?: () => void;
  isNavigating?: boolean;
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
  onGenerate?: () => void;
  uploadedImage?: string | null;
  getCanvasSnapshot?: () => Promise<string>;
  onStartDesign?: (prompt: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onDownload,
  onBack,
  isNavigating,
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
  onGenerate,
  uploadedImage,
  getCanvasSnapshot,
  onStartDesign,
}) => {
  const s = useStore.getState();
  const undo = s.undo;
  const redo = s.redo;
  const saveProject = s.saveProject;
  const showShortcuts = s.showShortcuts;
  const setShowShortcuts = s.setShowShortcuts;
  const setShowShareModal = s.setShowShareModal;
  const setProjectTitle = s.setProjectTitle;

  // ⚡ Bolt Optimization: Use useShallow with an explicit selector object to combine
  // what used to be 8 separate `useStore` subscriptions into a single one. This groups
  // state evaluation and prevents the Header from re-rendering heavily due to
  // fragmented subscriptions.
  const { past, future, isSaving, lastSaved, hasUnsavedChanges, projectTitle, showAIOverlay, aiTab } = useStore(
    useShallow((state) => ({
      past: state.past,
      future: state.future,
      isSaving: state.isSaving,
      lastSaved: state.lastSaved,
      hasUnsavedChanges: state.hasUnsavedChanges,
      projectTitle: state.projectTitle,
      // AI overlay state lives in the store so Command Palette / other surfaces can open it
      showAIOverlay: state.showAIOverlay,
      aiTab: state.aiOverlayTab,
    }))
  );

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [showZoomMenu, setShowZoomMenu] = React.useState(false);
  // AI overlay state lives in the store so Command Palette / other surfaces can open it
  const setShowAIOverlay = s.setShowAIOverlay;
  const setAiTab = s.setAIOverlayTab;

  const zoomButtonRef = React.useRef<HTMLButtonElement>(null);
  const titleSnapshotRef = React.useRef<string>(String(projectTitle || ''));

  const onShare = () => setShowShareModal(true);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const onShowShortcuts = () => setShowShortcuts(!showShortcuts);

  const getSaveStatus = () => {
    if (isSaving) {
      return 'Saving...';
    }
    if (hasUnsavedChanges) {
      return 'Unsaved changes';
    }
    if (lastSaved) {
      const now = Date.now();
      const lastTime =
        typeof lastSaved === 'number'
          ? lastSaved
          : (lastSaved as Date).getTime
            ? (lastSaved as Date).getTime()
            : Number(lastSaved);
      const diff = now - lastTime;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) {
        return 'Saved just now';
      }
      if (minutes === 1) {
        return 'Saved 1 min ago';
      }
      if (minutes < 60) {
        return `Saved ${minutes} mins ago`;
      }
      return 'Saved';
    }
    return 'Not saved';
  };

  return (
    <header className="h-14 bg-surface-dark-1 text-white flex items-center justify-between px-6 z-50 shrink-0 border-b border-white/5 shadow-2xl relative">
      <div className="flex items-center gap-4 relative z-30">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-8 h-8 bg-[#0E1318] border border-white/10 rounded-lg flex items-center justify-center shadow-lg">
            <img src="/logo.svg" alt="Kreathief" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-black text-lg tracking-tighter uppercase hidden lg:block">Kreathief</span>
        </div>

        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={isNavigating}
            title="Back to Dashboard"
            aria-label="Go back to Dashboard"
          >
            {isNavigating ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            )}
          </Button>
        )}

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last action"
            aria-keyshortcuts="Control+z"
          >
            <Icons.Undo className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo last action"
            aria-keyshortcuts="Control+y"
          >
            <Icons.Redo className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Center Section: Project Title & Save Status */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Project Title */}
          <div className="flex items-center max-w-[200px] md:max-w-[240px] shrink-0">
            {isEditingTitle ? (
              <input
                data-testid="project-title-input"
                type="text"
                value={String(projectTitle || 'Untitled')}
                onChange={(e) => setProjectTitle(e.target.value)}
                onFocus={(e) => {
                  e.target.select();
                  titleSnapshotRef.current = String(projectTitle || '');
                }}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                  }
                  if (e.key === 'Escape') {
                    setProjectTitle(String(titleSnapshotRef.current || 'Untitled'));
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="bg-surface-dark-3 border-b-2 border-brand-500 text-white text-sm font-bold px-2 py-0.5 outline-none w-40 rounded shadow-lg text-center"
              />
            ) : (
              <button
                data-testid="project-title-display"
                onClick={() => setIsEditingTitle(true)}
                className="text-sm font-medium text-white hover:text-brand-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5 truncate max-w-[180px] text-center"
                title="Click to rename"
              >
                {String(projectTitle || 'Untitled')}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center w-5 h-5 ml-1 select-none shrink-0" title={getSaveStatus()}>
            {isSaving ? (
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
            ) : hasUnsavedChanges ? (
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
            ) : (
              <Icons.Cloud className="w-3.5 h-3.5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 relative z-30">
        {/* AI Button — unified entry point for all AI features */}
        <Button
          onClick={() => setShowAIOverlay(!showAIOverlay)}
          aria-label="Open AI tools"
          title="AI Tools (Image Gen + Design Agent)"
          variant={showAIOverlay ? 'secondary' : 'ghost'}
          size="sm"
          className="flex items-center gap-1.5 font-bold"
        >
          <Icons.Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-brand-400">Agent</span>
        </Button>

        <div className="h-4 w-px bg-gray-800"></div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Show keyboard shortcuts"
          >
            <Icons.Help className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="hover:text-accent transition-colors"
            title="Share Design"
            aria-label="Share design"
          >
            <Icons.Share className="w-4 h-4" />
          </Button>

          <PresenceBar />
        </div>

        <div className="h-4 w-px bg-gray-800"></div>

        <ConnectionStatus />

        <Button
          id="export-btn"
          data-testid="export-btn"
          variant="primary"
          size="sm"
          onClick={onDownload}
          className="hover:bg-accent hover:text-white hover:shadow-glow-accent active:scale-95"
        >
          <Icons.Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export</span>
        </Button>

        {user && (
          <button
            onClick={() => useStore.getState().setShowProfileModal(true)}
            className="w-7 h-7 rounded-full border border-surface-dark-5 flex items-center justify-center overflow-hidden shadow-sm hover:border-brand-600 transition-colors cursor-pointer relative"
            title="Click to open Account Hub & Profile"
            aria-label="Open Account Hub"
          >
            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
          </button>
        )}
      </div>

      {/* Zoom Dropdown */}
      {showZoomMenu && (
        <div
          className="fixed z-[100] mt-2 bg-surface-dark-3 border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 w-32"
          style={{
            top: zoomButtonRef.current?.getBoundingClientRect().bottom,
            left: zoomButtonRef.current?.getBoundingClientRect().left,
          }}
        >
          {[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5].map((z) => (
            <button
              key={z}
              onClick={() => {
                onZoomChange(z);
                setShowZoomMenu(false);
              }}
              className={`w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-colors rounded-lg ${zoom === z ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
            >
              {z * 100}%
            </button>
          ))}
          <div className="h-px bg-white/5 my-1" />
          <button
            onClick={() => {
              onZoomChange(1);
              setShowZoomMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
          >
            Fit Screen
          </button>
        </div>
      )}
    </header>
  );
};
