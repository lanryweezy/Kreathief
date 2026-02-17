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
import CommunityTemplates from './CommunityTemplates';

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
  onApplyTheme: (theme: DesignTheme) => void;
  getCanvasSnapshot?: () => Promise<string>;
  onPreviewMotion: (settings: any) => void;
  onOpenPricing: () => void;
  uploadedImage: string | null;
  onFileUpload: (files: File[]) => void;
}

export const SidePanel = React.memo(({
  onGenerate,
  onApplyTheme,
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
    createProject,
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

  const renderProjects = () => (
    <div className="flex flex-col h-full p-4 bg-[#13161a]">
      <h3 className="font-bold text-white mb-6">Projects</h3>
      <button
        className="w-full bg-[#7d2ae8] hover:bg-[#6b23c5] text-white py-2 rounded text-sm font-bold mb-6 transition-colors"
        onClick={() => createProject('Untitled Design')}
      >
        + New Design
      </button>

      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Saved</h4>
      <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pb-10">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7d2ae8]/20 to-[#00c4cc]/20 flex items-center justify-center mb-4">
              <Icons.Projects className="w-7 h-7 text-[#7d2ae8]" />
            </div>
            <p className="text-sm font-bold text-white mb-1">No Projects Yet</p>
            <p className="text-xs text-gray-500 mb-4 max-w-[200px]">Create your first design to see it here.</p>
            <button
              onClick={() => createProject('Untitled Design')}
              className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Icons.Magic className="w-3.5 h-3.5" /> New Design
            </button>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 group hover:border-[#7d2ae8] transition-colors relative">
              <div className="cursor-pointer" onClick={() => loadProject(project.id)}>
                <h5 className="text-sm font-bold text-white truncate pr-6">{project.name}</h5>
                <p className="text-[10px] text-gray-500 mt-1">
                  Edited {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

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
            />
          )}

          {activeTab === NavTab.BRAND && (
            <BrandPanel />
          )}

          {activeTab === NavTab.TEXTURES && (
            <TexturesPanel
              onApplyTexture={onApplyTexture}
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

          {activeTab === NavTab.PROJECTS && renderProjects()}

          {activeTab === NavTab.SNAPSHOTS && <SnapshotsPanel />}
          {activeTab === NavTab.COMMENTS && <CommentsPanel />}
          {activeTab === NavTab.COMMUNITY && <CommunityTemplates />}
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
