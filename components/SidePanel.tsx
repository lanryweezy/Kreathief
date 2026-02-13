
import React, { useState } from 'react';
import { NavTab, AppMode, AspectRatio, GeneratedImage, TextLayer, ShapeLayer, ImageLayer, Layer, Project, BrandKit, GenerationQuality, BrushType } from '../types';
import { Icons } from '../constants';
import { LayersPanel } from './panels/LayersPanel';
import { DrawPanel } from './panels/DrawPanel';
import { ElementsPanel } from './panels/ElementsPanel';
import { TextPanel } from './panels/TextPanel';
import { UploadsPanel } from './panels/UploadsPanel';
import { AssetsPanel } from './panels/AssetsPanel';

// Lazy load complex panels
const MagicPanel = React.lazy(() => import('./panels/MagicPanel'));
const TemplatesPanel = React.lazy(() => import('./panels/TemplatesPanel'));
const BrandPanel = React.lazy(() => import('./panels/BrandPanel'));
const TexturesPanel = React.lazy(() => import('./panels/TexturesPanel'));
const MockupPanel = React.lazy(() => import('./panels/MockupPanel'));
const AssistantPanel = React.lazy(() => import('./panels/AssistantPanel'));

const PanelLoading = () => (
  <div className="flex h-full w-full items-center justify-center bg-[#13161a]">
    <div className="w-6 h-6 rounded-full border-2 border-[#7d2ae8] border-t-transparent animate-spin"></div>
  </div>
);

interface SidePanelProps {
  activeTab: NavTab;
  // State from App
  mode: AppMode;
  prompt: string;
  setPrompt: (s: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;
  isProcessing: boolean;
  onGenerate: () => void;
  onSetMode: (m: AppMode) => void;
  history: GeneratedImage[];
  onSelectImage: (img: GeneratedImage) => void;
  onClearHistory: () => void;
  onFileUpload: (files: File[]) => void;
  uploadedImage: string | null;
  // Text & Shape Props
  onAddText: (style: Partial<TextLayer>) => void;
  onAddShape: (type: any, style: Partial<ShapeLayer>) => void;
  onAddImageLayer?: (src: string) => void;
  onApplyTemplate?: (templateId: string, confirmReplace?: boolean) => void;
  // Layer Management
  layers?: Layer[]; // Unified layers prop
  textLayers: TextLayer[];
  shapeLayers: ShapeLayer[];
  imageLayers?: ImageLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onDeleteLayer: (id: string) => void;
  onUpdateTextLayer: (id: string, changes: Partial<TextLayer>) => void;
  onUpdateShapeLayer: (id: string, changes: Partial<ShapeLayer>) => void;
  onUpdateImageLayer: (id: string, changes: Partial<ImageLayer>) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
  onLayoutLayers?: (type: 'grid' | 'row' | 'col') => void;
  // Copy/Paste (missing in props but used in LayersPanel)
  onCopyLayer?: (id: string) => void;
  onPasteLayer?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  // Projects
  projects?: Project[];
  onLoadProject?: (p: Project) => void;
  onDeleteProject?: (id: string) => void;
  onCreateProject?: () => void;
  // Drawing
  brushColor?: string;
  setBrushColor?: (c: string) => void;
  brushSize?: number;
  setBrushSize?: (s: number) => void;
  isDrawing?: boolean;
  setIsDrawing?: (b: boolean) => void;
  brushOpacity?: number;
  setBrushOpacity?: (o: number) => void;
  brushType?: BrushType;
  setBrushType?: (t: BrushType) => void;
  onFinishDrawing?: () => void;
  onApplyLayout?: (shapes: Partial<ShapeLayer>[]) => void;
  // Brand
  brandKits?: BrandKit[];
  onAddBrandKit?: (kit: BrandKit) => void;
  onDeleteBrandKit?: (id: string) => void;
  onApplyBrandColors?: (colors: string[]) => void;
  onApplyBrandFonts?: (heading: string, body: string) => void;
  onUpdateBrandKit?: (id: string, updates: Partial<BrandKit>) => void;
  // Textures
  onApplyTexture?: (url: string) => void;
  onRemoveTexture?: () => void;
  currentTexture?: string;
  // Snapshot for AI Vision
  getCanvasSnapshot?: () => Promise<string>;
  // Generation Quality
  quality?: GenerationQuality;
  setQuality?: (q: GenerationQuality) => void;
  // Uploads Library
  uploads?: string[];
  onDeleteUpload?: (index: number) => void;
  // Added for High Priority Enhancements
  onOpenPricing?: () => void;
  onToggleDesignSuggestions?: () => void;
  onToggleSmartContent?: () => void;
  onToggleQualityScore?: () => void;
  onHoverFont?: (fontFamily: string | null) => void;
}

export const SidePanel = React.memo(({ ...props }: SidePanelProps) => {
  const {
    activeTab,
    mode,
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    isProcessing,
    onOpenPricing,
    onToggleDesignSuggestions,
    onToggleSmartContent,
    onToggleQualityScore,
    onGenerate,
    onSetMode,
    history,
    onSelectImage,
    onClearHistory,
    onFileUpload,
    uploadedImage,
    onAddText,
    onAddShape,
    onAddImageLayer,
    onApplyTemplate,
    layers, // Unified layers
    textLayers,
    shapeLayers,
    imageLayers = [],
    selectedLayerId,
    onSelectLayer,
    onDeleteLayer,
    onUpdateTextLayer,
    onUpdateShapeLayer,
    onUpdateImageLayer,
    onDuplicateLayer,
    onMoveLayer,
    onLayoutLayers,
    projects = [],
    onLoadProject,
    onDeleteProject,
    onCreateProject,
    brushColor = '#000000',
    setBrushColor = () => { },
    brushSize = 5,
    setBrushSize = () => { },
    isDrawing = false,
    setIsDrawing = () => { },
    brushOpacity = 1,
    setBrushOpacity = () => { },
    brushType = BrushType.BASIC,
    setBrushType = () => { },
    onFinishDrawing = () => { },
    onApplyLayout,
    brandKits = [],
    onAddBrandKit,
    onDeleteBrandKit,
    onApplyBrandColors,
    onApplyBrandFonts,
    onUpdateBrandKit,
    onApplyTexture,
    onRemoveTexture,
    currentTexture,
    getCanvasSnapshot,
    quality = 'standard',
    setQuality = () => { },
    uploads = [],
    onDeleteUpload,
    onCopyLayer,
    onPasteLayer,
    onGroup,
    onUngroup,
    onHoverFont,
  } = props;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Note: Projects render logic is simple enough to stay here or could be moved to ProjectsPanel if needed later.
  const renderProjects = () => (
    <div className="flex flex-col h-full p-4 bg-[#13161a]">
      <h3 className="font-bold text-white mb-6">Projects</h3>
      <button
        className="w-full bg-[#7d2ae8] hover:bg-[#6b23c5] text-white py-2 rounded text-sm font-bold mb-6 transition-colors"
        onClick={onCreateProject}
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
              onClick={onCreateProject}
              className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Icons.Magic className="w-3.5 h-3.5" /> New Design
            </button>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 group hover:border-[#7d2ae8] transition-colors relative">
              <div className="cursor-pointer" onClick={() => onLoadProject && onLoadProject(project)}>
                <h5 className="text-sm font-bold text-white truncate pr-6">{project.name}</h5>
                <p className="text-[10px] text-gray-500 mt-1">
                  Edited {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteProject && onDeleteProject(project.id); }}
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
              mode={mode}
              prompt={prompt}
              setPrompt={setPrompt}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              onGenerate={onGenerate}
              isProcessing={isProcessing}
              onSetMode={onSetMode}
              uploadedImage={uploadedImage}
              fileInputRef={fileInputRef}
              selectedLayerId={selectedLayerId}
              imageLayers={imageLayers}
              onUpdateImageLayer={onUpdateImageLayer}
              quality={quality}
              setQuality={setQuality}
            />
          )}

          {activeTab === NavTab.ELEMENTS && (
            <ElementsPanel
              onAddShape={onAddShape}
              onAddImageLayer={onAddImageLayer}
            />
          )}

          {activeTab === NavTab.TEXT && (
            <TextPanel onAddText={onAddText} onHoverFont={onHoverFont} />
          )}

          {activeTab === NavTab.UPLOADS && (
            <UploadsPanel
              onFileUpload={onFileUpload}
              uploads={uploads}
              onAddImageLayer={onAddImageLayer}
              onDeleteUpload={onDeleteUpload}
            />
          )}

          {activeTab === NavTab.PHOTOS && (
            <AssetsPanel onAddImageLayer={onAddImageLayer || (() => { })} />
          )}

          {activeTab === NavTab.ASSISTANT && (
            <AssistantPanel
              getCanvasSnapshot={getCanvasSnapshot || (async () => "")}
              onAddText={onAddText}
              onAddShape={onAddShape}
            />
          )}

          {activeTab === NavTab.BRAND && (
            <BrandPanel
              brandKits={brandKits}
              onAddBrandKit={onAddBrandKit || (() => { })}
              onDeleteBrandKit={onDeleteBrandKit || (() => { })}
              onApplyBrandColors={onApplyBrandColors || (() => { })}
              onApplyBrandFonts={onApplyBrandFonts || (() => { })}
              onUpdateBrandKit={onUpdateBrandKit || (() => { })}
              onAddLogoToCanvas={onAddImageLayer || (() => { })}
            />
          )}

          {activeTab === NavTab.TEXTURES && (
            <TexturesPanel
              onApplyTexture={onApplyTexture || (() => { })}
              currentTexture={currentTexture}
              onRemoveTexture={onRemoveTexture || (() => { })}
            />
          )}

          {activeTab === NavTab.TEMPLATES && (
            <TemplatesPanel
              setPrompt={setPrompt}
              setAspectRatio={setAspectRatio}
              onSetMode={onSetMode}
              onApplyLayout={onApplyLayout}
              onApplyTemplate={onApplyTemplate}
              onApplyTheme={onApplyBrandColors}
            />
          )}

          {activeTab === NavTab.LAYERS && (
            <LayersPanel
              layers={layers || []}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
              onDeleteLayer={onDeleteLayer}
              onUpdateTextLayer={onUpdateTextLayer}
              onUpdateShapeLayer={onUpdateShapeLayer}
              onUpdateImageLayer={onUpdateImageLayer}
              onDuplicateLayer={onDuplicateLayer}
              onMoveLayer={onMoveLayer}
              onLayoutLayers={onLayoutLayers}
              onCopyLayer={onCopyLayer}
              onPasteLayer={onPasteLayer}
              onGroup={onGroup}
              onUngroup={onUngroup}
            />
          )}

          {activeTab === NavTab.DRAW && (
            <DrawPanel
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              isDrawing={isDrawing}
              setIsDrawing={setIsDrawing}
              brushOpacity={brushOpacity}
              setBrushOpacity={setBrushOpacity}
              brushType={brushType}
              setBrushType={setBrushType}
              onFinishDrawing={onFinishDrawing}
            />
          )}

          {activeTab === NavTab.MOCKUP && (
            <MockupPanel
              onExportForMockup={getCanvasSnapshot || (async () => "")}
              onAddToCanvas={onAddImageLayer}
            />
          )}

          {activeTab === NavTab.PROJECTS && renderProjects()}
        </React.Suspense>
      </div>

      {/* Hidden File Input placed at Root to ensure it always exists for MagicPanel Refs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileUpload(Array.from(e.target.files));
          }
        }}
      />
    </div>
  );
});
