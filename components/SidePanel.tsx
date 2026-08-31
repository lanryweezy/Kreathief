import { TextEffectsPanel } from './panels/TextEffectsPanel';
import React from 'react';
import { motion } from 'framer-motion';
import { NavTab, TextLayer, AnimationSettings } from '../types';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { ErrorBoundary } from './ErrorBoundary';
import { Icons } from '../constants';

import TemplatesPanel from './panels/TemplatesPanel';
import BrandPanel from './panels/BrandPanel';
import { ElementsPanel } from './panels/ElementsPanel';

const LayersPanel = React.lazy(() => import('./panels/LayersPanel'));
const DrawPanel = React.lazy(() => import('./panels/DrawPanel'));
const MediaPanel = React.lazy(() => import('./panels/MediaPanel'));
const TextPanel = React.lazy(() => import('./panels/TextPanel'));
const UploadsPanel = React.lazy(() => import('./panels/UploadsPanel'));
const AssetsPanel = React.lazy(() => import('./panels/AssetsPanel'));
const ComponentsPanel = React.lazy(() => import('./panels/ComponentsPanel'));
const MotionPanel = React.lazy(() => import('./panels/MotionPanel').then((m) => ({ default: m.MotionPanel })));
const AccessibilityPanel = React.lazy(() =>
  import('./panels/AccessibilityPanel').then((m) => ({ default: m.AccessibilityPanel }))
);
const MockupPanel = React.lazy(() => import('./panels/MockupPanel').then((m) => ({ default: m.MockupPanel })));
const WebsitePanel = React.lazy(() => import('./panels/WebsitePanel'));
const SlidesPanel = React.lazy(() => import('./panels/SlidesPanel'));
const CarouselPanel = React.lazy(() => import('./panels/CarouselPanel').then((m) => ({ default: m.CarouselPanel })));
const DocumentPanel = React.lazy(() => import('./panels/DocumentPanel').then((m) => ({ default: m.DocumentPanel })));
const MagicImagePanel = React.lazy(() => import('./panels/MagicImagePanel').then((m) => ({ default: m.MagicImagePanel })));
const TextAgentPanel = React.lazy(() => import('./panels/TextAgentPanel').then((m) => ({ default: m.TextAgentPanel })));
const VideoAgentPanel = React.lazy(() => import('./panels/VideoAgentPanel').then((m) => ({ default: m.VideoAgentPanel })));
import { ListSkeleton, GridSkeleton, CardSkeleton } from './Skeleton';

const PanelLoading = ({ tab }: { tab: NavTab }) => {
  switch (tab) {
    case NavTab.LAYERS:
    case NavTab.BRAND:
      return <ListSkeleton items={8} />;
    case NavTab.TEMPLATES:
    case NavTab.MEDIA:
    case NavTab.TEXTURES:
      return <GridSkeleton items={6} />;
    case NavTab.MAGIC:
    case NavTab.MOCKUP:
    case NavTab.ASSISTANT:
      return (
        <div className="space-y-4 pt-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );
    default:
      return (
        <div className="flex h-full w-full items-center justify-center bg-surface-dark-2">
          <div className="w-6 h-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"></div>
        </div>
      );
  }
};

interface SidePanelProps {
  onGenerate: () => void;
  onApplyTheme: (colors: string[]) => void;
  onApplyLayout: (typeOrShapes: any) => void;
  getCanvasSnapshot?: () => Promise<string>;
  uploadedImage: string | null;
  onStartDesign?: (prompt: string) => void;
  onPreviewMotion: (settings: AnimationSettings) => void;
}

export const SidePanel = React.memo(
  ({
    onGenerate,
    onApplyTheme,
    onApplyLayout,
    getCanvasSnapshot,
    uploadedImage,
    onStartDesign,
    onPreviewMotion,
  }: SidePanelProps) => {
    const {
      activeArtboardId,
      activeTab,
      _selectedLayerIds,
      updateLayer,
      setPenMode,
      brushColor,
      setBrushColor,
      brushSize,
      setBrushSize,
      isPenMode,
      brushOpacity,
      setBrushOpacity,
      brushType,
      setBrushType,
      brushSmoothing,
      setBrushSmoothing,
      brushJitter,
      setBrushJitter,
      setPrompt,
      setAspectRatio,
      setMode,
      handleApplyTemplate,
    } = useStore(
      useShallow((state) => ({
        activeArtboardId: state.activeArtboardId,
        activeTab: state.activeTab,
        _selectedLayerIds: state.selectedLayerIds,
        updateLayer: state.updateLayer,
        setPenMode: state.setPenMode,
        brushColor: state.brushColor,
        setBrushColor: state.setBrushColor,
        brushSize: state.brushSize,
        setBrushSize: state.setBrushSize,
        isPenMode: state.isPenMode,
        brushOpacity: state.brushOpacity,
        setBrushOpacity: state.setBrushOpacity,
        brushType: state.brushType,
        setBrushType: state.setBrushType,
        brushSmoothing: state.brushSmoothing,
        setBrushSmoothing: state.setBrushSmoothing,
        brushJitter: state.brushJitter,
        setBrushJitter: state.setBrushJitter,
        setPrompt: state.setPrompt,
        setAspectRatio: state.setAspectRatio,
        setMode: state.setMode,
        handleApplyTemplate: state.handleApplyTemplate,
      }))
    );

    const selectedLayerIds = _selectedLayerIds || [];

    const activeArtboard = useStore((state) => state.artboards.find((a: any) => a.id === activeArtboardId));
    const layers = activeArtboard?.layers || [];

    const selectedLayerId =
      selectedLayerIds && selectedLayerIds.length > 0 ? selectedLayerIds[selectedLayerIds.length - 1] : null;
    const selectedLayer = layers?.find((l: any) => l?.id === selectedLayerId) || null;
    const selectedTextLayer = selectedLayer?.type === 'text' ? (selectedLayer as TextLayer) : null;

    React.useEffect(() => {
      const handleOpenMagicImage = () => useStore.getState().setActiveTab(NavTab.MAGIC_IMAGE);
      const handleOpenTextAgent = () => useStore.getState().setActiveTab(NavTab.TEXT_AGENT);
      const handleOpenVideoAgent = () => useStore.getState().setActiveTab(NavTab.VIDEO_AGENT);

      document.addEventListener('open-magic-image', handleOpenMagicImage);
      document.addEventListener('open-text-agent', handleOpenTextAgent);
      document.addEventListener('open-video-agent', handleOpenVideoAgent);

      return () => {
        document.removeEventListener('open-magic-image', handleOpenMagicImage);
        document.removeEventListener('open-text-agent', handleOpenTextAgent);
        document.removeEventListener('open-video-agent', handleOpenVideoAgent);
      };
    }, []);

    return (
      <ErrorBoundary componentName="SidePanel" variant="widget">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          id="side-panel"
          data-testid="side-panel"
          className="w-full md:w-[320px] bg-transparent md:bg-surface-dark-2/95 md:backdrop-blur-xl border-r border-white/5 flex flex-col z-dropdown shrink-0 shadow-2xl relative overflow-y-auto overflow-x-hidden custom-scrollbar"
        >
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="min-h-full flex flex-col"
          >
            <React.Suspense fallback={<PanelLoading tab={activeTab} />}>
              {activeTab === NavTab.LAYERS && <LayersPanel />}

              {activeTab === NavTab.TEXT && <TextPanel />}

              {activeTab === NavTab.MEDIA && <MediaPanel />}
              {activeTab === NavTab.ELEMENTS && <ElementsPanel />}

              {activeTab === NavTab.UPLOADS && <UploadsPanel />}

              {activeTab === NavTab.PHOTOS && <AssetsPanel />}

              {activeTab === NavTab.TEXT_EFFECTS && selectedTextLayer && (
                <TextEffectsPanel
                  effects={{
                    styleType: selectedTextLayer.styleType,
                    warpStyle: selectedTextLayer.warpStyle,
                    curve: selectedTextLayer.curve,
                    depth: selectedTextLayer.depth,
                    neonGlow: selectedTextLayer.neonGlow,
                    textShadow: selectedTextLayer.textShadow,
                    textStroke: selectedTextLayer.textStroke,
                    warpParams: (selectedTextLayer as any).warpParams,
                  }}
                  onChange={(newEffects) => {
                    updateLayer(selectedTextLayer.id, newEffects as Partial<TextLayer>);
                  }}
                />
              )}

              {activeTab === NavTab.TEXT_EFFECTS && !selectedTextLayer && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <Icons.Zap className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Text Effects</h3>
                  <p className="text-sm text-gray-400">
                    Select a text layer to unlock amazing text effects like transformations, shadows, 3D depth, and
                    textures.
                  </p>
                </div>
              )}

              {activeTab === NavTab.TEMPLATES && (
                <TemplatesPanel
                  onApplyTemplate={handleApplyTemplate}
                  setPrompt={setPrompt}
                  setAspectRatio={setAspectRatio}
                  onSetMode={setMode}
                  onApplyLayout={onApplyLayout}
                  onApplyTheme={onApplyTheme}
                />
              )}

              {activeTab === NavTab.BRAND && <BrandPanel />}

              {activeTab === NavTab.DRAW && (
                <DrawPanel
                  brushColor={brushColor}
                  setBrushColor={setBrushColor}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  isDrawing={isPenMode}
                  setIsDrawing={setPenMode}
                  brushOpacity={brushOpacity}
                  setBrushOpacity={setBrushOpacity}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSmoothing={brushSmoothing}
                  setBrushSmoothing={setBrushSmoothing}
                  brushJitter={brushJitter}
                  onFinishDrawing={() => {
                    if (useStore.getState().autoSelectAfterDraw) {
                      setPenMode(false);
                      useStore.getState().setActiveTab(NavTab.LAYERS);
                    }
                  }}
                />
              )}

              {activeTab === NavTab.MOCKUP && <MockupPanel onExportForMockup={getCanvasSnapshot || (async () => '')} />}

              {activeTab === NavTab.MOTION && <MotionPanel onPreviewMotion={onPreviewMotion} />}

              {activeTab === NavTab.ACCESSIBILITY && <AccessibilityPanel />}

              {activeTab === NavTab.WEBSITE && <WebsitePanel />}

              {activeTab === NavTab.SLIDES && <SlidesPanel />}

              {activeTab === NavTab.CAROUSEL && <CarouselPanel />}

              {activeTab === NavTab.DOCUMENT && <DocumentPanel />}

              {activeTab === NavTab.MAGIC_IMAGE && <MagicImagePanel selectedLayer={selectedLayer?.type === 'image' ? (selectedLayer as any) : undefined} />}

              {activeTab === NavTab.VIDEO_AGENT && <VideoAgentPanel />}

              {activeTab === NavTab.TEXT_AGENT && <TextAgentPanel selectedLayer={selectedLayer?.type === 'text' ? (selectedLayer as any) : undefined} />}
            </React.Suspense>
          </motion.div>
        </motion.div>
      </ErrorBoundary>
    );
  }
);

SidePanel.displayName = 'SidePanel';
