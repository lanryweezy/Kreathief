import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { selectedLayerSelector } from '../store/selectors';
import { NavTab } from '../types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from './ErrorBoundary';
import { SidePanel } from './SidePanel';
import { MobileNavBar } from './MobileNavBar';
import { BottomSheet } from './BottomSheet';
import { Canvas } from './Canvas';
import { User, Project, AnimationSettings } from '../types';
import { useEditorLogic } from '../hooks/useEditorLogic';
import { useFileHandler } from '../hooks/useFileHandler';
import { shareService } from '../services/shareService';
import { storageService } from '../services/storageService';
import { ShareModal } from './modals/ShareModal';
import { ExportModal } from './modals/ExportModal';
import { MockupPanel } from './panels/MockupPanel';

const CommunityModal = React.lazy(() => import('./modals/CommunityModal'));
const CommandPalette = React.lazy(() => import('./modals/CommandPalette').then(module => ({ default: module.CommandPalette })));
import { Toolbar } from './Toolbar';
import { ShortcutOverlay } from './ShortcutOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { haptics } from '../utils/haptics';
import { FeedbackModal } from './modals/FeedbackModal';
import { MobileQuickActions } from './MobileQuickActions';
import { useShakeToUndo } from '../hooks/useShakeToUndo';
import { MobileToolbar } from './MobileToolbar';
import { MobileOnboarding } from './MobileOnboarding';
import { MobileContextMenu } from './MobileContextMenu';
import { MobileTransformController } from './MobileTransformController';

interface EditorProps {
  initialProject?: Project;
  onBack: () => void;
  user: User;
}

export const Editor: React.FC<EditorProps> = ({ initialProject, onBack, user }) => {
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const selectedLayer = useStore(selectedLayerSelector);
  const canvasSize = useStore((state) => state.canvasSize) || { width: 1080, height: 1080, name: 'Square' };
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const zoom = useStore((state) => state.zoom) || 1;
  const setZoom = useStore((state) => state.setZoom);
  const showShortcuts = useStore((state) => state.showShortcuts);
  const setShowShortcuts = useStore((state) => state.setShowShortcuts);
  const showRulers = useStore((state) => state.showRulers);
  const showGrid = useStore((state) => state.showGrid);
  const onToggleGrid = useStore((state) => state.setShowGrid);
  const onToggleRulers = useStore((state) => state.setShowRulers);
  const addArtboard = useStore((state) => state.addArtboard);
  const deleteArtboard = useStore((state) => state.deleteArtboard);

  // Expose store to window for E2E tests
  React.useEffect(() => {
    (window as any).useStore = useStore;
  }, []);

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
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [previewAnimation, setPreviewAnimation] = useState<AnimationSettings | undefined>();
  const [showMobileContextMenu, setShowMobileContextMenu] = useState(false);
  const [contextMenuLayerId, setContextMenuLayerId] = useState<string | null>(null);

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Shake to Undo on Mobile
  useShakeToUndo({
    onShake: () => {
      undo();
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-6 py-3 rounded-2xl shadow-lg z-[500] font-semibold';
      toast.textContent = 'Undo';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1500);
    },
    enabled: isMobile,
  });

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

  // Sync Project from URL ID
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id && id !== projectId) {
      storageService.getProject(id).then(project => {
        if (project) {
          initializeProject(project);
        }
      });
    }
  }, [projectId, initializeProject]);

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
    { key: 'z', ctrl: true, shift: true, action: () => { redo(); haptics.light(); }, description: 'Redo (Alt)' },
    { key: 'c', ctrl: true, action: () => { if (selectedLayerId) { copyLayer(selectedLayerId); haptics.selection(); } }, description: 'Copy Layer' },
    { key: 'v', ctrl: true, action: () => { pasteLayer(); haptics.medium(); }, description: 'Paste Layer' },
    { key: 'd', ctrl: true, action: () => { if (selectedLayerIds.length > 0) { duplicateSelected(); haptics.medium(); } }, description: 'Duplicate Layer(s)' },
    { key: 'Delete', action: () => { if (selectedLayerIds.length > 0) { deleteSelected(); haptics.heavy(); } }, description: 'Delete Layer(s)' },
    { key: 'Backspace', action: () => { if (selectedLayerIds.length > 0) { deleteSelected(); haptics.heavy(); } }, description: 'Delete Layer(s)' },
    { key: 's', ctrl: true, action: () => { saveProject(); haptics.light(); }, description: 'Save Project' },
    { key: 'e', ctrl: true, action: () => { setShowExport(true); haptics.light(); }, description: 'Export Design' },
    { key: 'g', ctrl: true, action: () => { if (selectedLayerIds.length > 1) { groupSelected(); haptics.medium(); } }, description: 'Group Layers' },
    { key: 'g', ctrl: true, shift: true, action: () => { if (selectedLayerIds.length > 0) { ungroupSelected(); } }, description: 'Ungroup Layers' },
    
    // Single-Key Tool Shortcuts (Pro Design Workflow)
    { key: 'v', action: () => { useStore.getState().setSelectedLayerIds([]); useStore.getState().setPenMode(false); }, description: 'Select Tool' },
    { key: 't', action: () => { useStore.getState().setActiveTab(NavTab.TEXT); useStore.getState().addTextLayer(); }, description: 'Text Tool' },
    { key: 'r', action: () => { useStore.getState().setActiveTab(NavTab.ELEMENTS); useStore.getState().addShapeLayer('rectangle'); }, description: 'Rectangle Tool' },
    { key: 'o', action: () => { useStore.getState().setActiveTab(NavTab.ELEMENTS); useStore.getState().addShapeLayer('circle'); }, description: 'Oval Tool' },
    { key: 'p', action: () => { useStore.getState().setActiveTab(NavTab.DRAW); useStore.getState().setPenMode(true); }, description: 'Draw Tool' },
    { key: 'm', action: () => useStore.getState().setActiveTab(NavTab.MAGIC), description: 'Magic/AI Panel' },
    { key: 'l', action: () => useStore.getState().setActiveTab(NavTab.LAYERS), description: 'Layers Panel' },
    { key: 'b', action: () => useStore.getState().setActiveTab(NavTab.BRAND), description: 'Brand Kit' },

    { key: 'ArrowUp', action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, 0, -1); } }, description: 'Nudge Up' },
    { key: 'ArrowDown', action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, 0, 1); } }, description: 'Nudge Down' },
    { key: 'ArrowLeft', action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, -1, 0); } }, description: 'Nudge Left' },
    { key: 'ArrowRight', action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, 1, 0); } }, description: 'Nudge Right' },
    { key: 'ArrowUp', shift: true, action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, 0, -10); } }, description: 'Nudge Up 10px' },
    { key: 'ArrowDown', shift: true, action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, 0, 10); } }, description: 'Nudge Down 10px' },
    { key: 'ArrowLeft', shift: true, action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, -10, 0); } }, description: 'Nudge Left 10px' },
    { key: 'ArrowRight', shift: true, action: () => { if (selectedLayerId) { nudgeLayer(selectedLayerId, 10, 0); } }, description: 'Nudge Right 10px' },
    { key: 'a', ctrl: true, action: () => {
      const layers = useStore.getState().artboards.find((a: any) => a.id === useStore.getState().activeArtboardId)?.layers || [];
      useStore.getState().setSelectedLayerIds(layers.map((l: any) => l.id));
    }, description: 'Select All' },
    { key: 'Escape', action: () => { useStore.getState().setSelectedLayerIds([]); }, description: 'Deselect All' },
    { key: '0', ctrl: true, action: () => { setZoom(1); }, description: 'Zoom to 100%' },
    { key: '=', ctrl: true, action: () => { setZoom(Math.min(10, zoom + 0.25)); }, description: 'Zoom In' },
    { key: '-', ctrl: true, action: () => { setZoom(Math.max(0.05, zoom - 0.25)); }, description: 'Zoom Out' },
    { key: ']', ctrl: true, shift: true, action: () => { if (selectedLayerId) {useStore.getState().moveLayer(selectedLayerId, 'front');} }, description: 'Bring to Front' },
    { key: '[', ctrl: true, shift: true, action: () => { if (selectedLayerId) {useStore.getState().moveLayer(selectedLayerId, 'back');} }, description: 'Send to Back' },
    { key: ']', ctrl: true, action: () => { if (selectedLayerId) {useStore.getState().moveLayer(selectedLayerId, 'forward');} }, description: 'Bring Forward' },
    { key: '[', ctrl: true, action: () => { if (selectedLayerId) {useStore.getState().moveLayer(selectedLayerId, 'backward');} }, description: 'Send Backward' },
    { key: 'h', action: () => { if (selectedLayer && selectedLayer.type !== 'text') { useStore.getState().updateLayer(selectedLayer.id, { flipX: !(selectedLayer as any).flipX }); } }, description: 'Flip Horizontal' },
    { key: 'v', action: () => { if (selectedLayer && selectedLayer.type !== 'text') { useStore.getState().updateLayer(selectedLayer.id, { flipY: !(selectedLayer as any).flipY }); } }, description: 'Flip Vertical' },
    { key: 'k', ctrl: true, action: () => { useStore.getState().setCommandPaletteOpen(true); haptics.light(); }, description: 'Command Palette' },
    { key: '?', shift: true, action: () => setShowShortcuts(!showShortcuts), description: 'Shortcuts' }
  ], [undo, redo, copyLayer, pasteLayer, saveProject, selectedLayerIds, selectedLayerId, duplicateSelected, deleteSelected, groupSelected, ungroupSelected, setShowShortcuts, showShortcuts, nudgeLayer, zoom, setZoom, selectedLayer]);

  useKeyboardShortcuts({ shortcuts, enabled: true });

  const handleApplyLayout = (type: any) => useStore.getState().layoutLayers(type);

  const hideHeaderOnMobile = isMobile && selectedLayerIds.length > 0;

  return (
    <div id="editor-root" className="flex flex-col h-screen bg-[#0e1318] overflow-hidden text-[#e5e7eb] font-sans">
      {!hideHeaderOnMobile && (
        <Header 
          onDownload={() => setShowExport(true)} 
          onBack={onBack} 
          onNew={initializeProject} 
          onOpenCommunity={() => setShowCommunityModal(true)}
          user={user} 
          zoom={zoom}
          onZoomChange={setZoom}
          showGrid={showGrid}
          onToggleGrid={onToggleGrid}
          showRulers={showRulers}
          onToggleRulers={onToggleRulers}
          onAddArtboard={() => addArtboard()}
          onDeleteArtboard={() => deleteArtboard(useStore.getState().activeArtboardId)}
        />
      )}

      <div className={`flex flex-1 overflow-hidden relative ${hideHeaderOnMobile ? 'pb-0' : 'pb-16 md:pb-0'}`}>
        <div id="sidebar-container" className={`hidden md:flex flex-row h-full shrink-0 z-40 border-r border-gray-800 transition-all duration-300 ${isSidebarCollapsed || activeTab === NavTab.MOCKUP ? 'w-[72px]' : 'w-[392px]'}`}>
          <ErrorBoundary componentName="Sidebar" variant="widget">
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              isAutoCollapsed={activeTab === NavTab.MOCKUP}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onExpand={() => {
                if (activeTab === NavTab.MOCKUP) {
                  setActiveTab(NavTab.MAGIC);
                }
                setIsSidebarCollapsed(false);
              }}
            />
            {!isSidebarCollapsed && activeTab !== NavTab.MOCKUP && (
              <SidePanel
                onGenerate={handleGenerate}
                onApplyTheme={applyBrandColors}
                onApplyLayout={handleApplyLayout}
                getCanvasSnapshot={handleExportDataUrl}
                uploadedImage={uploadedImage}
                onStartDesign={handleStartDesign}
                onPreviewMotion={(settings: AnimationSettings) => {
                  setPreviewAnimation(settings);
                  setTimeout(() => setPreviewAnimation(undefined), settings.duration * 1000 + settings.delay * 1000 + 100);
                }}
              />
            )}
          </ErrorBoundary>
        </div>

        <div className="flex-1 relative overflow-hidden bg-[#13161a] flex flex-col">
          {activeTab === NavTab.ASSISTANT && !isMobile && (
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
                previewAnimation={previewAnimation}
              />
            </ErrorBoundary>

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
          </div>
        </div>
      </div>

      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsBottomSheetOpen(true);
          haptics.selection();
        }}
      />
      
      {/* Mobile Transform Controller (Quick Edit) */}
      {isMobile && <MobileTransformController />}

      {/* Mobile Quick Actions FAB */}
      <MobileQuickActions />

      {/* Mobile Toolbar */}
      {isMobile && (
        <MobileToolbar
          onAddText={() => {
            useStore.getState().addTextLayer();
            haptics.success();
          }}
          onAddShape={(shape) => {
            useStore.getState().addShapeLayer(shape);
            haptics.success();
          }}
          onAddImage={() => {
            // Trigger file upload
            haptics.light();
          }}
          onDraw={() => {
            useStore.getState().setPenMode(true);
            setActiveTab(NavTab.DRAW);
            haptics.light();
          }}
        />
      )}

      {/* Mobile Context Menu */}
      {isMobile && contextMenuLayerId && (
        <MobileContextMenu
          isOpen={showMobileContextMenu}
          onClose={() => {
            setShowMobileContextMenu(false);
            setContextMenuLayerId(null);
          }}
          layerId={contextMenuLayerId}
          onDuplicate={() => {
            if (contextMenuLayerId) {
              duplicateSelected();
              haptics.success();
            }
          }}
          onDelete={() => {
            if (contextMenuLayerId) {
              deleteSelected();
              haptics.heavy();
            }
          }}
          onBringToFront={() => {
            if (contextMenuLayerId) {
              useStore.getState().moveLayer(contextMenuLayerId, 'front');
              haptics.medium();
            }
          }}
          onSendToBack={() => {
            if (contextMenuLayerId) {
              useStore.getState().moveLayer(contextMenuLayerId, 'back');
              haptics.medium();
            }
          }}
        />
      )}

      {/* Mobile Onboarding */}
      {isMobile && <MobileOnboarding />}
      
      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)} title={activeTab}>
        <SidePanel
          onGenerate={handleGenerate}
          onApplyTheme={applyBrandColors}
          onApplyLayout={handleApplyLayout}
          getCanvasSnapshot={handleExportDataUrl}
          uploadedImage={uploadedImage}
          onStartDesign={handleStartDesign}
          onPreviewMotion={(settings: AnimationSettings) => {
            setPreviewAnimation(settings);
            setTimeout(() => setPreviewAnimation(undefined), settings.duration * 1000 + settings.delay * 1000 + 100);
          }}
        />
      </BottomSheet>

      <ErrorBoundary componentName="Modals" variant="widget">
        {showExport && (
          <ExportModal
            onClose={() => setShowExport(false)}
            currentSize={canvasSize}
            onExport={(format, quality, size, transparentBg, customFilename, overrideLayers, printOptions) => 
              handleConfirmExport({
                format,
                quality,
                size,
                transparentBg,
                customFilename,
                onComplete: () => setShowExport(false),
                overrideLayers,
                printOptions
              })
            }
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
        <CommandPalette />
      </React.Suspense>
    </div>
  );
};
