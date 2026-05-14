import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavTab, TextLayer, AnimationSettings } from '../types';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from './ErrorBoundary';
import { Icons } from '../constants';

import TemplatesPanel from './panels/TemplatesPanel';
import BrandPanel from './panels/BrandPanel';
import VectorizerPanel from './panels/VectorizerPanel';

// Lazy load other panels
const MagicPanel = React.lazy(() => import('./panels/MagicPanel'));
const TexturesPanel = React.lazy(() => import('./panels/TexturesPanel'));
const AssistantPanel = React.lazy(() => import('./panels/AssistantPanel'));
const LayersPanel = React.lazy(() => import('./panels/LayersPanel'));
const DrawPanel = React.lazy(() => import('./panels/DrawPanel'));
const ElementsPanel = React.lazy(() => import('./panels/ElementsPanel'));
const TextPanel = React.lazy(() => import('./panels/TextPanel'));
const UploadsPanel = React.lazy(() => import('./panels/UploadsPanel'));
const AssetsPanel = React.lazy(() => import('./panels/AssetsPanel'));
const TextEffectsPanel = React.lazy(() => import('./panels/TextEffectsPanel').then(module => ({ default: module.TextEffectsPanel })));
const ArrangePanel = React.lazy(() => import('./panels/ArrangePanel'));
const ComponentsPanel = React.lazy(() => import('./panels/ComponentsPanel'));
const CommentsPanel = React.lazy(() => import('./panels/CommentsPanel'));
const MotionPanel = React.lazy(() => import('./panels/MotionPanel').then(m => ({ default: m.MotionPanel })));
const AccessibilityPanel = React.lazy(() => import('./panels/AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })));
import { MockupPanel } from './panels/MockupPanel';
import { ListSkeleton, GridSkeleton, CardSkeleton } from './Skeleton';

const PanelLoading = ({ tab }: { tab: NavTab }) => {
  switch (tab) {
    case NavTab.LAYERS:
    case NavTab.ARRANGE:
    case NavTab.BRAND:
      return <ListSkeleton items={8} />;
    case NavTab.TEMPLATES:
    case NavTab.ELEMENTS:
    case NavTab.PHOTOS:
    case NavTab.TEXTURES:
      return <GridSkeleton items={6} />;
    case NavTab.MAGIC:
    case NavTab.MOCKUP:
    case NavTab.ASSISTANT:
      return <div className="space-y-4 pt-4"><CardSkeleton /><CardSkeleton /></div>;
    default:
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#13161a]">
          <div className="w-6 h-6 rounded-full border-2 border-[#7d2ae8] border-t-transparent animate-spin"></div>
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
  ({ onGenerate, onApplyTheme, onApplyLayout, getCanvasSnapshot, uploadedImage, onStartDesign, onPreviewMotion }: SidePanelProps) => {
    const artboards = useStore((state) => state.artboards);
    const activeArtboardId = useStore((state) => state.activeArtboardId);
    const activeTab = useStore((state) => state.activeTab);
    const layers = React.useMemo(() => 
      (artboards || []).find(a => a.id === activeArtboardId)?.layers || [], 
      [artboards, activeArtboardId]
    );
    const selectedLayerIds = useStore((state) => state.selectedLayerIds);
    const updateLayer = useStore((state) => state.updateLayer);
    const setPenMode = useStore((state) => state.setPenMode);
    const brushColor = useStore((state) => state.brushColor);
    const setBrushColor = useStore((state) => state.setBrushColor);
    const brushSize = useStore((state) => state.brushSize);
    const setBrushSize = useStore((state) => state.setBrushSize);
    const isPenMode = useStore((state) => state.isPenMode);
    const brushOpacity = useStore((state) => state.brushOpacity);
    const setBrushOpacity = useStore((state) => state.setBrushOpacity);
    const brushType = useStore((state) => state.brushType);
    const setBrushType = useStore((state) => state.setBrushType);
    const brushSmoothing = useStore((state) => state.brushSmoothing);
    const setBrushSmoothing = useStore((state) => state.setBrushSmoothing);
    const brushJitter = useStore((state) => state.brushJitter);
    const setBrushJitter = useStore((state) => state.setBrushJitter);
    const setPrompt = useStore((state) => state.setPrompt);
    const setAspectRatio = useStore((state) => state.setAspectRatio);
    const setMode = useStore((state) => state.setMode);
    const handleApplyTemplate = useStore((state) => state.handleApplyTemplate);

    const selectedLayerId = (selectedLayerIds && selectedLayerIds.length > 0) ? selectedLayerIds[selectedLayerIds.length - 1] : null;
    const selectedLayer = layers?.find((l: any) => l?.id === selectedLayerId) || null;
    const selectedTextLayer = selectedLayer?.type === 'text' ? (selectedLayer as TextLayer) : null;

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    return (
      <ErrorBoundary componentName="SidePanel" variant="widget">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          id="side-panel"
          data-testid="side-panel"
          className="w-full md:w-[320px] bg-transparent md:bg-[#13161a]/95 md:backdrop-blur-xl border-r border-white/5 flex flex-col z-20 shrink-0 shadow-2xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full flex flex-col"
            >
              <React.Suspense fallback={<PanelLoading tab={activeTab} />}>
                {activeTab === NavTab.MAGIC && (
                  <MagicPanel onGenerate={onGenerate} uploadedImage={uploadedImage} fileInputRef={fileInputRef} />
                )}

                {activeTab === NavTab.LAYERS && <LayersPanel />}

                {activeTab === NavTab.TEXT && <TextPanel />}

                {activeTab === NavTab.ELEMENTS && <ElementsPanel />}

                {activeTab === NavTab.UPLOADS && (
                  <UploadsPanel />
                )}

                {activeTab === NavTab.PHOTOS && <AssetsPanel />}

                {activeTab === NavTab.TEXT_EFFECTS && selectedTextLayer && (
                  <TextEffectsPanel effects={{}} onChange={() => {}} />
                )}

                {activeTab === NavTab.TEXT_EFFECTS && !selectedTextLayer && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <Icons.Zap className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Text Effects</h3>
                    <p className="text-sm text-gray-400">Select a text layer to unlock amazing text effects like transformations, shadows, 3D depth, and textures.</p>
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

                {activeTab === NavTab.TEXTURES && (
                  <TexturesPanel
                    onRemoveTexture={() => {
                      if (selectedTextLayer) {
                        updateLayer(selectedTextLayer.id, {
                          decorations: { ...selectedTextLayer.decorations, textures: [] },
                        } as Partial<TextLayer>);
                      }
                    }}
                    currentTexture={selectedTextLayer?.decorations?.textures?.[0]}
                  />
                )}

                {activeTab === NavTab.ASSISTANT && (
                  <AssistantPanel
                    getCanvasSnapshot={getCanvasSnapshot || (async () => '')}
                    onStartDesign={onStartDesign}
                  />
                )}

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

                {activeTab === NavTab.COMPONENTS && <ComponentsPanel />}

                {activeTab === NavTab.COMMENTS && <CommentsPanel />}

                {activeTab === NavTab.VECTORIZER && <VectorizerPanel />}

                {activeTab === NavTab.ARRANGE && <ArrangePanel />}

                {activeTab === NavTab.MOTION && <MotionPanel onPreviewMotion={onPreviewMotion} />}

                {activeTab === NavTab.ACCESSIBILITY && <AccessibilityPanel />}
              </React.Suspense>
            </motion.div>
          </AnimatePresence>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                // handleFileUpload is now used directly in UploadsPanel
              }
            }}
          />
        </motion.div>
      </ErrorBoundary>
    );
  }
);

SidePanel.displayName = 'SidePanel';
