import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import { NavTab } from '../types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from './ErrorBoundary';
import { SidePanel } from './SidePanel';
import { MobileNavBar } from './MobileNavBar';
import { BottomSheet } from './BottomSheet';
import { Canvas } from './Canvas';
import { User, Project } from '../types';
import { useEditorLogic } from '../hooks/useEditorLogic';
import { useFileHandler } from '../hooks/useFileHandler';
import { shareService } from '../services/shareService';
import { ShareModal } from './modals/ShareModal';
import { ExportModal } from './modals/ExportModal';
import { MockupPanel } from './panels/MockupPanel';
import { AssistantPanel } from './panels/AssistantPanel';
const CommunityModal = React.lazy(() => import('./modals/CommunityModal'));
import { Toolbar } from './Toolbar';
import { Dropdown } from './Dropdown';
import { ShortcutOverlay } from './ShortcutOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { haptics } from '../utils/haptics';
import { FeedbackModal } from './modals/FeedbackModal';

interface EditorProps {
  initialProject?: Project;
  onBack: () => void;
  user: User;
}

export const Editor: React.FC<EditorProps> = ({ initialProject, onBack, user }) => {
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const canvasSize = useStore((state) => state.canvasSize) || { width: 1080, height: 1080, name: 'Square' };
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const zoom = useStore((state) => state.zoom) || 1;
  const setZoom = useStore((state) => state.setZoom);
  const showShortcuts = useStore((state) => state.showShortcuts);
  const setShowShortcuts = useStore((state) => state.setShowShortcuts);
  
  // Connect actions needed for Header/UI
  const initializeProject = useStore((state) => state.initializeProject);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const copyLayer = useStore((state) => state.copyLayer);
  const pasteLayer = useStore((state) => state.pasteLayer);
  const duplicateSelected = useStore((state) => state.duplicateSelected);
  const deleteSelected = useStore((state) => state.deleteSelected);
  const groupSelected = useStore((state) => state.groupSelected);
  const ungroupSelected = useStore((state) => state.ungroupSelected);
  const nudgeLayer = useStore((state) => state.nudgeLayer);
  const saveProject = useStore((state) => state.saveProject);
  const projectId = useStore((state) => state.projectId);
  const projectTitle = useStore((state) => state.projectTitle);
  const showShareModal = useStore((state) => state.showShareModal);
  const setShowShareModal = useStore((state) => state.setShowShareModal);
  const applyBrandColors = useStore((state) => state.applyBrandColors);

  // Local UI State
  const selectedLayerId = selectedLayerIds && Array.isArray(selectedLayerIds) && selectedLayerIds.length > 0 
    ? selectedLayerIds[selectedLayerIds.length - 1] || null 
    : null;
  const [showExport, setShowExport] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Use Custom Logic Hooks
  const { 
    documentColors, 
    booleanPreview, 
    handleGenerate,
    handleUpdatePath,
    handleJoinPaths,
    handleBooleanOperation, 
    handleBooleanHover, 
    handleLayerDoubleClick 
  } = useEditorLogic(initialProject);

  const {
    handleFileUploads,
    handleExportDataUrl,
    handleExportBlob,
    handleConfirmExport,
    uploadedImage
  } = useFileHandler();

  const handleAddLogoToCanvas = (url: string) => {
    useStore.getState().addImageLayer(url, 'Logo');
  };

  const handleStartDesign = (prompt: string) => {
    setActiveTab(NavTab.MAGIC);
    useStore.getState().setPrompt(prompt);
  };

  const shortcuts = useMemo(() => [
    { key: 'z', ctrl: true, action: () => { undo(); haptics.light(); }, description: 'Undo' },
    { key: 'y', ctrl: true, action: () => { redo(); haptics.light(); }, description: 'Redo' },
    { key: 'c', ctrl: true, action: () => { if (selectedLayerId) { copyLayer(selectedLayerId); haptics.selection(); } }, description: 'Copy Layer' },
    { key: 'v', ctrl: true, action: () => { pasteLayer(); haptics.medium(); }, description: 'Paste Layer' },
    { key: 'd', ctrl: true, action: () => { if (selectedLayerIds.length > 0) { duplicateSelected(); haptics.medium(); } }, description: 'Duplicate Layer(s)' },
    { key: 'Delete', action: () => { if (selectedLayerIds.length > 0) { deleteSelected(); haptics.heavy(); } }, description: 'Delete Layer(s)' },
    { key: 's', ctrl: true, action: () => { saveProject(); haptics.light(); }, description: 'Save Project' },
    { key: 'e', ctrl: true, action: () => { setShowExport(true); haptics.light(); }, description: 'Export Design' },
    { key: 'g', ctrl: true, action: () => { if (selectedLayerIds.length > 1) { groupSelected(); haptics.medium(); } }, description: 'Group Layers' },
    { key: 'g', ctrl: true, shift: true, action: () => { if (selectedLayerIds.length > 0) {ungroupSelected();} }, description: 'Ungroup Layers' },
    { key: 'ArrowUp', action: () => { if (selectedLayerId) {nudgeLayer(selectedLayerId, 0, -1);} }, description: 'Nudge Up' },
    { key: 'ArrowDown', action: () => { if (selectedLayerId) {nudgeLayer(selectedLayerId, 0, 1);} }, description: 'Nudge Down' },
    { key: 'ArrowLeft', action: () => { if (selectedLayerId) {nudgeLayer(selectedLayerId, -1, 0);} }, description: 'Nudge Left' },
    { key: 'ArrowRight', action: () => { if (selectedLayerId) {nudgeLayer(selectedLayerId, 1, 0);} }, description: 'Nudge Right' },
    { key: '?', shift: true, action: () => setShowShortcuts(!showShortcuts), description: 'Shortcuts' }
  ], [undo, redo, copyLayer, pasteLayer, saveProject, selectedLayerIds, selectedLayerId, duplicateSelected, deleteSelected, groupSelected, ungroupSelected, setShowShortcuts, showShortcuts, nudgeLayer]);

  useKeyboardShortcuts({ shortcuts, enabled: true });

  const handleApplyLayout = (type: any) => useStore.getState().layoutLayers(type);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const hideHeaderOnMobile = isMobile && selectedLayerIds.length > 0;

  return (
    <div className="flex flex-col h-screen bg-[#0e1318] overflow-hidden text-[#e5e7eb] font-sans">
      {!hideHeaderOnMobile && (
        <Header 
          onDownload={() => setShowExport(true)} 
          onBack={onBack} 
          onNew={initializeProject} 
          onOpenCommunity={() => setShowCommunityModal(true)}
          user={user} 
        />
      )}

      <div className={`flex flex-1 overflow-hidden relative ${hideHeaderOnMobile ? 'pb-0' : 'pb-16 md:pb-0'}`}>
        {/* Sidebar */}
        <div className={`hidden md:flex flex-row h-full shrink-0 z-40 border-r border-gray-800 transition-all duration-300 ${isSidebarCollapsed ? 'w-[72px]' : 'w-[392px]'}`}>
          <ErrorBoundary componentName="Sidebar" variant="widget">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            {!isSidebarCollapsed && (
              <SidePanel
                onGenerate={handleGenerate}
                onApplyTheme={applyBrandColors}
                onApplyLayout={handleApplyLayout}
                getCanvasSnapshot={handleExportDataUrl}
                uploadedImage={uploadedImage}
                onStartDesign={handleStartDesign}
              />
            )}
          </ErrorBoundary>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative overflow-hidden bg-[#13161a] flex flex-col">
          {activeTab === NavTab.ASSISTANT && (
            <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-none" />
          )}

          <Toolbar
            documentColors={documentColors}
            onBooleanOperation={handleBooleanOperation}
            onJoinPaths={handleJoinPaths}
            onBooleanHover={handleBooleanHover}
            uploadedImage={uploadedImage}
          />
          
          <div className="flex-1 relative overflow-hidden flex flex-row">
            <ErrorBoundary componentName="Canvas" variant="widget">
              <Canvas
                onDoubleClickLayer={handleLayerDoubleClick}
                zoom={zoom}
                onZoomChange={setZoom}
                onFileUpload={handleFileUploads}
                onAddLogoToCanvas={handleAddLogoToCanvas}
                booleanPreview={booleanPreview}
                onUpdatePath={handleUpdatePath}
              />
            </ErrorBoundary>

            {/* Side-by-side Mockup Preview for #3 */}
            {activeTab === NavTab.MOCKUP && !isMobile && (
              <div className="absolute inset-0 z-[100] bg-[#0e1318] flex animate-in fade-in slide-in-from-right duration-300">
                <div className="flex-1 relative overflow-hidden flex flex-row">
                   <MockupPanel
                      onExportForMockup={handleExportDataUrl}
                      variant="full"
                      onClose={() => setActiveTab(NavTab.MAGIC)}
                   />
                </div>
              </div>
            )}

            {/* AI Assistant Full View for #4 */}
            {activeTab === NavTab.ASSISTANT && !isMobile && (
              <div className="absolute top-0 right-0 bottom-0 w-[400px] z-[120] animate-in slide-in-from-right duration-500 shadow-2xl">
                <AssistantPanel
                  getCanvasSnapshot={handleExportDataUrl}
                  onStartDesign={handleStartDesign}
                />
              </div>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-[#1e1e1e]/80 border border-white/10 rounded-2xl shadow-2xl flex items-center p-1.5 backdrop-blur-xl pointer-events-auto gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-black/20 rounded-xl px-1">
                <button
                  onClick={() => setZoom(Math.max(0.05, zoom - 0.1))}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <Icons.Minus className="w-4 h-4" />
                </button>
                <button
                  ref={zoomButtonRef}
                  onClick={() => setShowZoomMenu(!showZoomMenu)}
                  className="px-2 w-16 text-center text-[11px] font-black text-white hover:bg-white/10 rounded-lg h-8 transition-colors font-mono"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={() => setZoom(Math.min(10, zoom + 0.1))}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <Icons.Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-white/10 mx-1" />

              {/* Quick View Toggles */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => useStore.getState().setShowGrid(!useStore.getState().showGrid)}
                  className={`p-2 rounded-lg transition-all ${useStore.getState().showGrid ? 'bg-[#7d2ae8] text-white shadow-[0_0_15px_rgba(125,42,232,0.4)]' : 'text-gray-400 hover:bg-white/10'}`}
                  title="Toggle Grid"
                >
                  <Icons.Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => useStore.getState().setShowRulers(!useStore.getState().showRulers)}
                  className={`p-2 rounded-lg transition-all ${useStore.getState().showRulers ? 'bg-[#7d2ae8] text-white shadow-[0_0_15px_rgba(125,42,232,0.4)]' : 'text-gray-400 hover:bg-white/10'}`}
                  title="Toggle Rulers"
                >
                  <Icons.Layout className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Dropdown anchorRef={zoomButtonRef} isOpen={showZoomMenu} onClose={() => setShowZoomMenu(false)} align="center" offset={12}>
              <div className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 w-32">
                {[0.25, 0.5, 0.75, 1, 1.5, 2, 3].map((z) => (
                  <button
                    key={z}
                    onClick={() => { setZoom(z); setShowZoomMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors rounded-lg ${zoom === z ? 'bg-[#7d2ae8] text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    {z * 100}%
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsBottomSheetOpen(true);
        }}
      />
      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)} title={activeTab}>
        <SidePanel
          onGenerate={handleGenerate}
          onApplyTheme={applyBrandColors}
          onApplyLayout={handleApplyLayout}
          getCanvasSnapshot={handleExportDataUrl}
          uploadedImage={uploadedImage}
          onStartDesign={handleStartDesign}
        />
      </BottomSheet>

      <ErrorBoundary componentName="Modals" variant="widget">
        {showExport && (
          <ExportModal
            onClose={() => setShowExport(false)}
            currentSize={canvasSize}
            onExport={(...args) => handleConfirmExport(...args, () => setShowExport(false))}
            onGetPngBlob={handleExportBlob}
          />
        )}
        {showShareModal && (
          <ShareModal
            onClose={() => setShowShareModal(false)}
            designTitle={projectTitle}
            onGetShareLink={() => shareService.generateShareLink(projectId)}
          />
        )}
      </ErrorBoundary>

      <ShortcutOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <FeedbackModal />

      <React.Suspense fallback={null}>
        {showCommunityModal && (
          <CommunityModal onClose={() => setShowCommunityModal(false)} />
        )}
      </React.Suspense>
    </div>
  );
};
