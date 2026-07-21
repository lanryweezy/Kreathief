import { useShallow } from 'zustand/react/shallow';
import React, { Suspense, useEffect, useState, lazy } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { RightPanel } from './components/RightPanel';
import { LayoutToolbar } from './components/LayoutToolbar';
import { ToastContainer } from './components/Toast';
import { ShortcutModal } from './components/ShortcutModal';
import { UndoHistoryPanel } from './components/UndoHistoryPanel';
import { MiniMap } from './components/MiniMap';
import { CommandPalette } from './components/CommandPalette';
import { BooleanToolbar } from './components/BooleanToolbar';
import { useKreathiefStore } from './store/useStore';
import { Store, ShoppingBag, User } from 'lucide-react';
import type { Template, Creator } from './services/templateService';

// Lazy-loaded: marketplace & creator components (framer-motion + ag-psd)
// These only load when the user switches away from the editor view.
const UploadModal = lazy(() => import('./components/UploadModal'));
const TemplateGallery = lazy(() => import('./components/TemplateGallery'));
const TemplatePreview = lazy(() => import('./components/TemplatePreview'));
const CreatorRegistration = lazy(() => import('./components/CreatorRegistration'));
const CreatorDashboard = lazy(() => import('./components/CreatorDashboard'));
const PaymentSettings = lazy(() => import('./components/PaymentSettings'));

// Lazy-loaded: editor modals (only loaded on explicit user action)
const ExportModal = lazy(() => import('./components/ExportModal').then((m) => ({ default: m.ExportModal })));
const VersionHistory = lazy(() => import('./components/VersionHistory').then((m) => ({ default: m.VersionHistory })));

type View = 'editor' | 'marketplace' | 'creator';

const App: React.FC = () => {
  const {
    darkMode,
    setTool,
    undo,
    redo,
    showProperties,
    toggleExpertMode,
    initMemory,
    memoryReady,
    selectNode,
    zoom,
    selectedIds,
    nodes,
    autoSave,
    lastSaved,
    activeTool,
  } = useKreathiefStore(
    useShallow((state) => ({
      darkMode: state.darkMode,
      setTool: state.setTool,
      undo: state.undo,
      redo: state.redo,
      showProperties: state.showProperties,
      toggleExpertMode: state.toggleExpertMode,
      initMemory: state.initMemory,
      memoryReady: state.memoryReady,
      selectNode: state.selectNode,
      zoom: state.zoom,
      selectedIds: state.selectedIds,
      nodes: state.nodes,
      autoSave: state.autoSave,
      lastSaved: state.lastSaved,
      activeTool: state.activeTool,
    }))
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentView, setCurrentView] = useState<View>('editor');
  const [showUpload, setShowUpload] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreatorReg, setShowCreatorReg] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [creator, setCreator] = useState<Creator | null>(() => {
    try {
      const d = localStorage.getItem('kreathief_creator');
      return d ? JSON.parse(d) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!memoryReady && initMemory) {
      initMemory();
    }
  }, [memoryReady, initMemory]);

  useEffect(() => {
    const interval = setInterval(() => {
      autoSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  useEffect(() => {
    const saved = localStorage.getItem('kreathief_autosave');
    if (saved) {
      try {
        const workspace = JSON.parse(saved);
        if (workspace.nodes && workspace.nodes.length > 0) {
          const nodesMap = new Map<string, any>(workspace.nodes);
          useKreathiefStore.setState({
            nodes: nodesMap,
            zoom: workspace.zoom || 1,
            panX: workspace.panX || 0,
            panY: workspace.panY || 0,
          });
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        selectNode([]);
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const engine = (window as any).__kreathiefEngine;
        if (e.shiftKey) {
          const { selectedIds } = useKreathiefStore.getState();
          if (selectedIds.size === 1) {
            engine?.focusNode(Array.from(selectedIds)[0]);
          } else {
            engine?.fitAll();
          }
        } else {
          engine?.fitAll();
        }
        return;
      }

      if (e.key === 'e' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        setShowExport(true);
        return;
      }

      if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowHistory((prev) => !prev);
        return;
      }

      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }

      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setShowVersionHistory((prev) => !prev);
        return;
      }

      // Delete/Backspace — remove selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const state = useKreathiefStore.getState();
        const ids = Array.from(state.selectedIds);
        if (ids.length > 0) {
          ids.forEach((id) => state.removeNode(id));
          state.addToast('info', `Deleted ${ids.length} element${ids.length !== 1 ? 's' : ''}`);
        }
        return;
      }

      // Select all
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const { nodes } = useKreathiefStore.getState();
        selectNode(Array.from(nodes.keys()));
        return;
      }

      // Duplicate
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const state = useKreathiefStore.getState();
        const ids = Array.from(state.selectedIds);
        if (ids.length > 0) {
          ids.forEach((id) => {
            const node = state.nodes.get(id);
            if (node) {
              state.addNode({
                ...node,
                id: `${node.id}_dup_${Date.now()}`,
                x: node.x + 20,
                y: node.y + 20,
                name: `${node.name} copy`,
              });
            }
          });
          state.addToast('success', `Duplicated ${ids.length} element${ids.length !== 1 ? 's' : ''}`);
        }
        return;
      }

      // Nudge with arrow keys (1px, 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const state = useKreathiefStore.getState();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
        const dy = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;
        state.selectedIds.forEach((id) => {
          const node = state.nodes.get(id);
          if (node) state.updateNode(id, { x: node.x + dx, y: node.y + dy });
        });
        return;
      }

      const toolMap: Record<string, string> = {
        v: 'select',
        h: 'hand',
        f: 'frame',
        r: 'rectangle',
        o: 'ellipse',
        l: 'line',
        p: 'pen',
        t: 'text',
        i: 'image',
        k: 'component',
        a: 'ai-generate',
        d: 'eyedropper',
      };
      if (toolMap[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
        setTool(toolMap[e.key.toLowerCase()] as any);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, undo, redo, toggleExpertMode, selectNode]);

  useEffect(() => {
    const engine = (window as any).__kreathiefEngine;
    if (!engine) return;
    const shapeTools = ['rectangle', 'ellipse', 'frame'];
    if (shapeTools.includes(activeTool)) {
      engine.setCreationTool(activeTool);
    } else {
      engine.setCreationTool(null);
    }
  }, [activeTool]);

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleUseTemplate = (template: Template) => {
    const nodesMap = new Map(Object.entries(template.nodes));
    useKreathiefStore.setState({
      nodes: nodesMap,
      selectedIds: new Set(),
    });
    setShowPreview(false);
    setCurrentView('editor');
  };

  const handleViewSwitch = (view: View) => {
    if (view === 'creator' && !creator) {
      setShowCreatorReg(true);
      return;
    }
    setCurrentView(view);
  };

  const selectedCount = selectedIds.size;
  const nodeCount = nodes.size;

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden ${darkMode ? 'bg-slate-950 text-white' : 'bg-neutral-50 text-neutral-800'}`}
    >
      {/* Top Navigation */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b shrink-0 ${darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-slate-200'}`}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold bg-gradient-to-r from-neutral-600 to-neutral-800 bg-clip-text text-transparent">
            Kreathief
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewSwitch('editor')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'editor'
                  ? 'bg-neutral-100 dark:bg-neutral-900/20 text-neutral-500'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => handleViewSwitch('marketplace')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                currentView === 'marketplace'
                  ? 'bg-neutral-100 dark:bg-neutral-900/20 text-neutral-500'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Marketplace
            </button>
            <button
              onClick={() => handleViewSwitch('creator')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                currentView === 'creator'
                  ? 'bg-neutral-100 dark:bg-neutral-900/20 text-neutral-500'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Dashboard
            </button>
          </div>
        </div>
        {currentView !== 'editor' && creator && (
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-gradient-to-r from-neutral-600 to-neutral-800 text-white text-xs font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Store className="w-3.5 h-3.5" />
            Upload Template
          </button>
        )}
      </div>

      {/* Main Content */}
      {currentView === 'editor' && (
        <>
          <Toolbar onExport={() => setShowExport(true)} />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative overflow-hidden">
              <Canvas />
              <LayoutToolbar />
              <BooleanToolbar />
              <MiniMap />
              <div className="absolute bottom-4 left-4 text-xs text-neutral-500 pointer-events-none">
                Space+Drag to pan · Scroll to zoom · Click to select · Ctrl+E to export
              </div>
            </div>
            {showProperties && (
              <div className="animate-slide-in-right">
                <RightPanel />
              </div>
            )}
          </div>
          <div
            className={`h-6 flex items-center justify-between px-3 text-xs shrink-0 border-t ${darkMode ? 'bg-neutral-900 border-neutral-700 text-neutral-500' : 'bg-neutral-100 border-slate-200 text-neutral-400'}`}
          >
            <div className="flex items-center gap-3">
              <span>
                {nodeCount} element{nodeCount !== 1 ? 's' : ''}
              </span>
              {selectedCount > 0 && <span className="text-neutral-300">{selectedCount} selected</span>}
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && <span className="text-neutral-600">Saved {formatTimeAgo(lastSaved)}</span>}
              <span className="font-mono">{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </>
      )}

      {currentView === 'marketplace' && (
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
              Loading marketplace...
            </div>
          }
        >
          <div className="flex-1 overflow-hidden">
            <TemplateGallery onSelectTemplate={handlePreviewTemplate} onPreviewTemplate={handlePreviewTemplate} />
          </div>
        </Suspense>
      )}

      {currentView === 'creator' && (
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">Loading dashboard...</div>
          }
        >
          <div className="flex-1 overflow-hidden">
            <CreatorDashboard
              onOpenUpload={() => setShowUpload(true)}
              onOpenPaymentSettings={() => setShowPaymentSettings(true)}
            />
          </div>
        </Suspense>
      )}

      {/* Modals */}
      <ToastContainer />
      <ShortcutModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <Suspense fallback={null}>
        <ExportModal open={showExport} onClose={() => setShowExport(false)} />
        <VersionHistory open={showVersionHistory} onClose={() => setShowVersionHistory(false)} />
      </Suspense>
      <UndoHistoryPanel open={showHistory} onClose={() => setShowHistory(false)} />
      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      <VersionHistory open={showVersionHistory} onClose={() => setShowVersionHistory(false)} />
      <Suspense fallback={null}>
        <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} />
        <TemplatePreview
          template={previewTemplate}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onUseTemplate={handleUseTemplate}
        />
        <CreatorRegistration
          isOpen={showCreatorReg}
          onClose={() => setShowCreatorReg(false)}
          onRegistered={(c) => {
            setCreator(c);
            setShowCreatorReg(false);
            setCurrentView('creator');
          }}
        />
        <PaymentSettings isOpen={showPaymentSettings} onClose={() => setShowPaymentSettings(false)} />
      </Suspense>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default App;
