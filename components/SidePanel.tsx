
import React, { useState } from 'react';
import { NavTab, AppMode, AspectRatio, GeneratedImage, TextLayer, ShapeLayer, ImageLayer, Project, BrandKit, GenerationQuality } from '../types';
import { MagicPanel } from './panels/MagicPanel';
import { LayersPanel } from './panels/LayersPanel';
import { TemplatesPanel } from './panels/TemplatesPanel';
import { DrawPanel } from './panels/DrawPanel';
import { BrandPanel } from './panels/BrandPanel';
import { TexturesPanel } from './panels/TexturesPanel';
import { MockupPanel } from './panels/MockupPanel';
import { AssistantPanel } from './panels/AssistantPanel';
import { ElementsPanel } from './panels/ElementsPanel';
import { TextPanel } from './panels/TextPanel';
import { UploadsPanel } from './panels/UploadsPanel';

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
  onFileUpload: (file: File) => void;
  uploadedImage: string | null;
  // Text & Shape Props
  onAddText: (style: Partial<TextLayer>) => void;
  onAddShape: (type: any, style: Partial<ShapeLayer>) => void;
  onAddImageLayer?: (src: string) => void;
  onApplyTemplate?: (templateId: string, confirmReplace?: boolean) => void;
  // Layer Management
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
  onFinishDrawing?: () => void;
  onApplyLayout?: (shapes: Partial<ShapeLayer>[]) => void;
  // Brand
  brandKits?: BrandKit[];
  onAddBrandKit?: (kit: BrandKit) => void;
  onDeleteBrandKit?: (id: string) => void;
  onApplyBrandColors?: (colors: string[]) => void;
  onApplyBrandFonts?: (heading: string, body: string) => void;
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
}

export const SidePanel: React.FC<SidePanelProps> = ({
  activeTab,
  mode,
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  isProcessing,
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
  setBrushColor = () => {},
  brushSize = 5,
  setBrushSize = () => {},
  isDrawing = false,
  setIsDrawing = () => {},
  brushOpacity = 1,
  setBrushOpacity = () => {},
  onFinishDrawing = () => {},
  onApplyLayout,
  brandKits = [],
  onAddBrandKit,
  onDeleteBrandKit,
  onApplyBrandColors,
  onApplyBrandFonts,
  onApplyTexture,
  onRemoveTexture,
  currentTexture,
  getCanvasSnapshot,
  quality = 'standard',
  setQuality = () => {},
  uploads = [],
  onDeleteUpload
}) => {
  
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
                <div className="text-center text-gray-500 mt-10">
                    <p className="text-xs">No saved projects yet</p>
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
    <div className="w-[320px] bg-[#13161a] border-r border-[#1f1f1f] flex flex-col z-20 shrink-0 shadow-xl relative">
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
      
      {(activeTab === NavTab.ELEMENTS || activeTab === NavTab.STICKERS) && (
        <ElementsPanel 
           onAddShape={onAddShape}
           onAddImageLayer={onAddImageLayer}
        />
      )}

      {activeTab === NavTab.TEXT && (
        <TextPanel onAddText={onAddText} />
      )}

      {activeTab === NavTab.UPLOADS && (
        <UploadsPanel 
           onFileUpload={onFileUpload}
           uploads={uploads}
           onAddImageLayer={onAddImageLayer}
           onDeleteUpload={onDeleteUpload}
        />
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
           onAddBrandKit={onAddBrandKit || (() => {})}
           onDeleteBrandKit={onDeleteBrandKit || (() => {})}
           onApplyBrandColors={onApplyBrandColors || (() => {})}
           onApplyBrandFonts={onApplyBrandFonts || (() => {})}
        />
      )}
      
      {activeTab === NavTab.TEXTURES && (
        <TexturesPanel 
           onApplyTexture={onApplyTexture || (() => {})}
           currentTexture={currentTexture}
           onRemoveTexture={onRemoveTexture || (() => {})}
        />
      )}
      
      {activeTab === NavTab.TEMPLATES && (
        <TemplatesPanel 
            setPrompt={setPrompt} 
            setAspectRatio={setAspectRatio} 
            onSetMode={onSetMode} 
            onApplyLayout={onApplyLayout}
            onApplyTemplate={onApplyTemplate}
        />
      )}
      
      {activeTab === NavTab.LAYERS && (
        <LayersPanel 
          textLayers={textLayers}
          shapeLayers={shapeLayers}
          imageLayers={imageLayers}
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

      {/* Hidden File Input placed at Root to ensure it always exists for MagicPanel Refs */}
      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept="image/*" 
         onChange={(e) => {
           if (e.target.files && e.target.files.length > 0) {
             onFileUpload(e.target.files[0]);
           }
         }} 
       />
    </div>
  );
};
