import React, { useState } from 'react';
import { NavTab, AppMode, AspectRatio, GeneratedImage, TextLayer, ShapeLayer, ImageLayer, Layer, Project, BrandKit, GenerationQuality, DesignTheme, BrushType } from '../types';
import { Icons } from '../constants';
import { LayersPanel } from './panels/LayersPanel';
import { DrawPanel } from './panels/DrawPanel';
import { ElementsPanel } from './panels/ElementsPanel';
import { TextPanel } from './panels/TextPanel';
import { UploadsPanel } from './panels/UploadsPanel';
import { AssetsPanel } from './panels/AssetsPanel';
import { TextEffectsPanel } from './panels/TextEffectsPanel';
import { ArrangePanel } from './panels/ArrangePanel';
import { MotionPanel } from './panels/MotionPanel';
import { useStore } from '../store/useStore';
import SnapshotsPanel from './SnapshotsPanel';
import CommentsPanel from './CommentsPanel';

// Lazy load complex panels
const MagicPanel = React.lazy(() => import('./panels/MagicPanel'));
const TemplatesPanel = React.lazy(() => import('./panels/TemplatesPanel'));
const BrandPanel = React.lazy(() => import('./panels/BrandPanel'));
const TexturesPanel = React.lazy(() => import('./panels/TexturesPanel'));
const MockupPanel = React.lazy(() => import('./panels/MockupPanel'));
const AssistantPanel = React.lazy(() => import('./panels/AssistantPanel'));
const VectorizerPanel = React.lazy(() => import('./panels/VectorizerPanel'));

const PanelLoading = () => (
  <div className="flex h-full w-full items-center justify-center bg-[#13161a]">
    <div className="w-6 h-6 rounded-full border-2 border-[#7d2ae8] border-t-transparent animate-spin"></div>
  </div>
);

interface SidePanelProps {
  onGenerate: () => void;
  onApplyTheme: (colors: string[]) => void;
  onApplyLayout: (typeOrShapes: any) => void;
  getCanvasSnapshot?: () => Promise<string>;
  onPreviewMotion: (settings: any) => void;
  onOpenPricing: () => void;
  uploadedImage: string | null;
  onFileUpload: (files: File[]) => void;
}

export const SidePanel = React.memo(({
  onGenerate,
  onApplyTheme,
  onApplyLayout,
  getCanvasSnapshot,
  onPreviewMotion,
  onOpenPricing,
  uploadedImage,
  onFileUpload,
}: SidePanelProps) => {
  const {
    activeTab,
    layers,
    selectedLayerIds,
    projects,
    updateLayer,
    addLayers,
    deleteProject,
    loadProject,
    handleFileUpload,
    setPenMode,
    moveLayer,
    textLayers,
    shapeLayers,
    imageLayers,
    addShapeLayer,
    addImageLayer,
    handleApplyTemplate,
    brandKits,
    addBrandKit,
    deleteBrandKit,
    updateBrandKit,
    applyBrandFonts,
    applyBrandColors,
    deleteUpload,
    canvasFilters,
    setCanvasFilters,
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    isPenMode,
    brushOpacity,
    setBrushOpacity,
    brushType,
    setBrushType,
    setPrompt,
    setAspectRatio,
    setMode
  } = useStore();

  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;
  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const selectedTextLayer = selectedLayer?.type === 'text' ? selectedLayer as TextLayer : null;

  const onApplyTexture = (url: string) => {
    if (selectedTextLayer) {
      updateLayer(selectedTextLayer.id, {
        decorations: { ...selectedTextLayer.decorations, textures: [url] }
      } as Partial<TextLayer>);
    }
  };

  const onRemoveTexture = () => {
    if (selectedTextLayer) {
      updateLayer(selectedTextLayer.id, {
        decorations: { ...selectedTextLayer.decorations, textures: [] }
      } as Partial<TextLayer>);
    }
  };

  // Helper actions moved internal or kept as props if they rely on side effects
  const onUpdateTextLayer = (id: string, changes: Partial<TextLayer>) => updateLayer(id, changes);
  const onUpdateShapeLayer = (id: string, changes: Partial<ShapeLayer>) => updateLayer(id, changes);
  const onUpdateImageLayer = (id: string, changes: Partial<ImageLayer>) => updateLayer(id, changes);

  const fileInputRef = React.useRef<HTMLInputElement>(null);


  return (
    <div className="w-[320px] bg-[#13161a] border-r border-[#1f1f1f] flex flex-col z-20 shrink-0 shadow-xl relative overflow-hidden">
      <div key={activeTab} className="h-full flex flex-col animate-panel-crossfade">
        <React.Suspense fallback={<PanelLoading />}>
          {activeTab === NavTab.MAGIC && (
            <MagicPanel
              onGenerate={onGenerate}
              uploadedImage={uploadedImage}
              fileInputRef={fileInputRef}
            />
          )}

          {activeTab === NavTab.LAYERS && (
            <LayersPanel />
          )}

          {activeTab === NavTab.TEXT && (
            <TextPanel />
          )}

          {activeTab === NavTab.ELEMENTS && (
            <ElementsPanel />
          )}

          {activeTab === NavTab.UPLOADS && (
            <UploadsPanel
              onFileUpload={onFileUpload}
              onDeleteUpload={deleteUpload}
            />
          )}

          {activeTab === NavTab.PHOTOS && (
            <AssetsPanel />
          )}

          {activeTab === NavTab.TEXT_EFFECTS && selectedTextLayer && (
            <TextEffectsPanel
              selectedLayer={selectedTextLayer}
              onUpdateLayer={onUpdateTextLayer}
            />
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

          {activeTab === NavTab.BRAND && (
            <BrandPanel />
          )}

          {activeTab === NavTab.TEXTURES && (
            <TexturesPanel
              onRemoveTexture={onRemoveTexture}
              currentTexture={selectedTextLayer?.decorations?.textures?.[0]}
            />
          )}

          {activeTab === NavTab.ASSISTANT && (
            <AssistantPanel
              getCanvasSnapshot={getCanvasSnapshot || (async () => "")}
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
              onFinishDrawing={() => { }}
            />
          )}

          {activeTab === NavTab.MOCKUP && (
            <MockupPanel
              onExportForMockup={getCanvasSnapshot || (async () => "")}
            />
          )}

          {activeTab === NavTab.VECTORIZER && (
            <VectorizerPanel />
          )}

          {activeTab === NavTab.ARRANGE && (
            <ArrangePanel />
          )}

          {activeTab === NavTab.MOTION && (
            <MotionPanel
              onPreviewMotion={onPreviewMotion}
            />
          )}


          {activeTab === NavTab.SNAPSHOTS && <SnapshotsPanel />}
          {activeTab === NavTab.COMMENTS && <CommentsPanel />}
        </React.Suspense>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(Array.from(e.target.files));
          }
        }}
      />
    </div>
  );
});
