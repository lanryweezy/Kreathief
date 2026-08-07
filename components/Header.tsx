import React from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../constants';
import { User, Project, AnimationSettings } from '../types';
import { DropdownMenu } from './DropdownMenu';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { PublishModal } from './modals/PublishModal';
import { PresenceBar } from './collaboration/PresenceBar';
import { Button } from './Button';
import { ConnectionStatus } from './ConnectionStatus';

const MagicPanel = React.lazy(() => import('./panels/MagicPanel'));
const AssistantPanel = React.lazy(() => import('./panels/AssistantPanel'));
const KiroChatPanel = React.lazy(() => import('./panels/KiroChatPanel'));

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

  const [showPublishModal, setShowPublishModal] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [showZoomMenu, setShowZoomMenu] = React.useState(false);
  const [showResizeMenu, setShowResizeMenu] = React.useState(false);
  // AI overlay state lives in the store so Command Palette / other surfaces can open it
  const setShowAIOverlay = s.setShowAIOverlay;
  const setAiTab = s.setAIOverlayTab;
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const zoomButtonRef = React.useRef<HTMLButtonElement>(null);
  const resizeMenuRef = React.useRef<HTMLDivElement>(null);
  const titleSnapshotRef = React.useRef<string>(String(projectTitle || ''));

  // Magic Resize target formats — one click adapts the design to every channel
  const RESIZE_FORMATS = [
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Story / Reel', width: 1080, height: 1920 },
    { name: 'YouTube Thumbnail', width: 1280, height: 720 },
    { name: 'Facebook Post', width: 1200, height: 630 },
    { name: 'X / Twitter Post', width: 1600, height: 900 },
    { name: 'Presentation', width: 1920, height: 1080 },
  ];

  // Close resize menu on outside click
  React.useEffect(() => {
    if (!showResizeMenu) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (resizeMenuRef.current && !resizeMenuRef.current.contains(e.target as Node)) {
        setShowResizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showResizeMenu]);

  // Close AI overlay on outside click or Escape
  React.useEffect(() => {
    if (!showAIOverlay) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setShowAIOverlay(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAIOverlay(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showAIOverlay]);

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
      <div className="flex items-center gap-4">
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

      <div className="flex items-center gap-2 md:gap-4 relative z-10">
        {/* AI Button — unified entry point for all AI features */}
        <button
          onClick={() => setShowAIOverlay(!showAIOverlay)}
          aria-label="Open AI tools"
          title="AI Tools (Image Gen + Design Agent)"
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
            transition-all duration-150 border
            ${
              showAIOverlay
                ? 'bg-brand-600/20 border-brand-600/50 text-brand-400 shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                : 'bg-brand-600/10 border-brand-600/20 text-brand-400 hover:bg-brand-600/20 hover:border-brand-600/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]'
            }
          `}
        >
          <Icons.Sparkles className="w-3.5 h-3.5" />
          <span>AI</span>
        </button>

        {/* Magic Resize — adapt current design to other formats */}
        <div className="relative" ref={resizeMenuRef}>
          <button
            onClick={() => setShowResizeMenu(!showResizeMenu)}
            aria-label="Magic Resize"
            title="Magic Resize — adapt design to other formats"
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
              transition-all duration-150 border
              ${
                showResizeMenu
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <Icons.Maximize className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Resize</span>
          </button>

          {showResizeMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-surface-dark-3 border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 z-[200]">
              <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">
                Magic Resize
              </div>
              {RESIZE_FORMATS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    useStore.getState().magicResizeAll([f]);
                    setShowResizeMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span>{f.name}</span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {f.width}×{f.height}
                  </span>
                </button>
              ))}
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  useStore.getState().magicResizeAll(RESIZE_FORMATS);
                  setShowResizeMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-400 hover:bg-brand-600/10 rounded-lg transition-colors"
              >
                <Icons.Grid className="w-3.5 h-3.5" />
                Resize for all formats
              </button>
            </div>
          )}
        </div>

        <Button variant="secondary" size="sm" onClick={onOpenCommunity} title="Community Templates">
          <Icons.Globe className="w-3.5 h-3.5 text-brand-600" />
          <span className="hidden lg:inline">Community</span>
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
            onClick={() => setShowPublishModal(true)}
            title="Publish to Community"
            aria-label="Publish design"
          >
            <Icons.Globe className="w-4 h-4" />
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

      {/* Centered Project Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 pointer-events-auto z-0 max-w-[35vw] md:max-w-[300px] overflow-hidden whitespace-nowrap">
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
            className="bg-surface-dark-3 border-b-2 border-brand-500 text-white text-sm font-bold px-2 py-1 outline-none w-48 rounded-t shadow-lg text-center"
          />
        ) : (
          <button
            data-testid="project-title-display"
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-medium text-white hover:text-brand-400 transition-colors px-2 py-1 rounded hover:bg-white/5 text-center"
            title="Click to rename"
          >
            {String(projectTitle || 'Untitled')}
          </button>
        )}
      </div>

      {showPublishModal && <PublishModal onClose={() => setShowPublishModal(false)} />}

      {/* Floating AI Overlay — portaled above all editor chrome */}
      {showAIOverlay &&
        createPortal(
          <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="AI Tools"
            className="fixed z-[500] top-[60px] right-4 w-[340px] max-h-[calc(100vh-80px)] flex flex-col bg-[#111118] border border-brand-600/20 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{ animation: 'ai-overlay-in 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Accent glow top border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-600/60 to-transparent" />

            {/* Tab header */}
            <div className="flex items-center gap-1 p-3 border-b border-white/5 shrink-0">
              <button
                onClick={() => setAiTab('generate')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${aiTab === 'generate' ? 'bg-brand-600/20 text-brand-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              >
                <Icons.Sparkles className="w-3.5 h-3.5" />
                Image Gen
              </button>
              <button
                onClick={() => setAiTab('assistant')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${aiTab === 'assistant' ? 'bg-brand-600/20 text-brand-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              >
                <Icons.Bot className="w-3.5 h-3.5" />
                Design Agent
              </button>
              <button
                onClick={() => setAiTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${aiTab === 'chat' ? 'bg-brand-600/20 text-brand-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              >
                <Icons.Magic className="w-3.5 h-3.5" />
                Kiro
              </button>
              <button
                onClick={() => setShowAIOverlay(false)}
                aria-label="Close AI panel"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all ml-1"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <React.Suspense
                fallback={
                  <div className="flex items-center justify-center h-32">
                    <div className="w-5 h-5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                  </div>
                }
              >
                {aiTab === 'generate' && (
                  <MagicPanel onGenerate={onGenerate || (() => {})} uploadedImage={uploadedImage ?? null} />
                )}
                {aiTab === 'assistant' && (
                  <AssistantPanel
                    getCanvasSnapshot={getCanvasSnapshot || (async () => '')}
                    onStartDesign={onStartDesign}
                  />
                )}
                {aiTab === 'chat' && <KiroChatPanel />}
              </React.Suspense>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
