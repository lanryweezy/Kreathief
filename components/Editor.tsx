import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
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
  // Connect minimal global state needed for Layout
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
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
  const addArtboard = useStore((state) => state.addArtboard);
  const deleteArtboard = useStore((state) => state.deleteArtboard);
  const addToast = useStore((state) => state.addToast);
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
          onAddArtboard={addArtboard}
          onDeleteArtboard={() => {
            if (artboards.length > 1) {
              deleteArtboard(activeArtboardId);
              haptics.heavy();
            } else {
              addToast('Cannot delete the last artboard.', 'warning');
            }
          }}
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
              />
            )}
          </ErrorBoundary>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative overflow-hidden bg-[#13161a] flex flex-col">
          <Toolbar
            documentColors={documentColors}
            onBooleanOperation={handleBooleanOperation}
            onBooleanHover={handleBooleanHover}
            uploadedImage={uploadedImage}
          />
          
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

          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-4 left-4 z-40 bg-[#1e1e1e] border border-white/10 rounded-full shadow-xl flex items-center p-1 backdrop-blur-md hidden md:flex">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <Icons.Minus className="w-4 h-4" />
            </button>
            <button
              ref={zoomButtonRef}
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="px-2 w-14 text-center text-[10px] font-bold text-white hover:bg-white/10 rounded transition-colors"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <Icons.Plus className="w-4 h-4" />
            </button>
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
