import {
  Layer,
  CanvasSize,
  CanvasUnit,
  CanvasFilters,
  HistoryState,
  Project,
  NavTab,
  AppMode,
  BrushType,
  AspectRatio,
  GenerationQuality,
  ShapeLayer,
  TextLayer,
  ImageLayer,
  BrandKit,
  GeneratedImage,
  DesignComment,
  DesignSnapshot,
  Toast,
  ToastType,
} from '../types';

export interface EditorState {
  // --- Data ---
  layers: Layer[];
  selectedLayerIds: string[];
  canvasSize: CanvasSize;
  canvasBackgroundColor: string;
  canvasFilters: CanvasFilters;
  unit: CanvasUnit;

  // --- UI State ---
  activeTab: NavTab;
  mode: AppMode;
  isProcessing: boolean;
  isExporting: boolean;
  isRemovingBg: boolean;
  isExpanding: boolean;
  isEraserActive: boolean;
  isShapeBuilderActive: boolean;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  snapToObjects: boolean;
  setSnapToObjects: (snap: boolean) => void;
  showShortcuts: boolean;
  fontPreview: string | null;
  customFonts: string[];
  brandKits: BrandKit[];
  uploads: string[];
  history: GeneratedImage[];
  showShareModal: boolean;
  comments: DesignComment[];
  snapshots: DesignSnapshot[];
  tags: string[];
  isPublished: boolean;
  isCropMode: boolean;
  croppingLayerId: string | null;
  cropArea: { x: number; y: number; width: number; height: number };
  showGoldenRatio: boolean;
  toasts: Toast[];

  // --- Drawing State ---
  isPenMode: boolean;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  brushType: BrushType;
  textureIntensity: number;

  // --- AI/Generation State ---
  prompt: string;
  aspectRatio: AspectRatio;
  quality: GenerationQuality;

  projects: Project[];
  projectId: string;
  projectTitle: string;
  isSaving: boolean;
  textLayers: TextLayer[];
  shapeLayers: ShapeLayer[];
  imageLayers: ImageLayer[];

  // --- History ---
  past: HistoryState[];
  future: HistoryState[];
  editingPathId: string | null;

  // --- Actions ---
  setProjectId: (id: string) => void;
  setProjectTitle: (title: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  saveProject: () => Promise<void>;
  setLayers: (layers: Layer[] | ((prev: Layer[]) => Layer[])) => void;
  addLayer: (layer: Layer) => void;
  addLayers: (layers: Layer[]) => void;
  addTextLayer: (style?: Partial<TextLayer>) => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  updateLayers: (updates: Record<string, Partial<Layer>>) => void;
  applyTexture: (textureUrl: string, intensity?: number) => void;

  selectLayer: (id: string | null) => void;
  multiSelectLayer: (id: string, shiftKey: boolean) => void;
  setSelectedLayerIds: (ids: string[]) => void;

  setCanvasSize: (size: CanvasSize) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setCanvasFilters: (filters: CanvasFilters | ((prev: CanvasFilters) => CanvasFilters)) => void;
  setUnit: (unit: CanvasUnit) => void;

  // UI Actions
  setActiveTab: (tab: NavTab) => void;
  setMode: (mode: AppMode) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  setHistory: (history: GeneratedImage[] | ((prev: GeneratedImage[]) => GeneratedImage[])) => void;
  clearHistory: () => void;
  handleFileUpload: (files: File[]) => void;
  deleteUpload: (index: number) => void;
  setIsShapeBuilderActive: (active: boolean) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setShowGrid: (show: boolean) => void;
  setShowRulers: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowShareModal: (show: boolean) => void;
  setPreviewFontFamily: (font: string | null) => void;
  addCustomFont: (font: string) => void;
  setShowGoldenRatio: (show: boolean) => void;

  // Drawing Actions
  setPenMode: (isDrawing: boolean) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushType: (type: BrushType) => void;
  setTextureIntensity: (val: number) => void;
  toggleEraser: () => void;

  // Brand Actions
  addBrandKit: (kit: BrandKit) => void;
  deleteBrandKit: (id: string) => void;
  updateBrandKit: (id: string, updates: Partial<BrandKit>) => void;
  applyBrandColors: (colors: string[]) => void;
  applyBrandFonts: (heading: string, body: string) => void;

  // AI Actions
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setQuality: (quality: GenerationQuality) => void;
  handleConvertToPath: (id: string) => void;
  vectorizeLayer: (id: string, options: any) => Promise<void>;
  onRmBg: (id: string) => Promise<void>;
  handleUpdateCanvasSize: (size: CanvasSize) => void;
  handleApplyTemplate: (template: any) => void;
  handleDrawingComplete: (pathData: string) => void;
  handleVectorDrawingComplete: (pathData: string, stroke: any) => void;

  // Collaboration & Versioning
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setIsPublished: (isPublished: boolean) => void;
  fetchComments: () => Promise<void>;
  addComment: (text: string, user: any) => Promise<void>;
  fetchSnapshots: () => Promise<void>;
  createSnapshot: (name: string, thumbnail?: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;
  deleteSnapshot: (snapshotId: string) => Promise<void>;

  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;

  initializeProject: (project: Project) => void;
  reset: () => void;

  // --- Complex Actions ---
  deleteLayer: (id: string) => void;
  deleteSelected: () => void;
  duplicateLayer: (id: string) => void;
  moveLayer: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  reorderLayer: (id: string, newIndex: number) => void;
  nudgeLayer: (id: string, dx: number, dy: number) => void;
  alignLayers: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeLayers: (type: 'horizontal' | 'vertical') => void;
  layoutLayers: (
    typeOrShapes: 'grid' | 'row' | 'col' | 'golden_v' | 'golden_h' | 'golden_grid' | Partial<ShapeLayer>[]
  ) => void;
  addImageLayer: (src: string, name?: string) => void;
  addShapeLayer: (type: ShapeLayer['type'], style?: Partial<ShapeLayer>) => void;
  createProject: (name: string, size?: CanvasSize) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  loadProject: (id: string) => void;
  loadAllProjects: () => Promise<void>;
  setProjects: (projects: Project[]) => void;
  handleNew: () => void;
  handleApplyBrandColors: (colors: string[]) => void;

  // --- Crop ---
  onCrop: (id: string) => void;
  setIsCropMode: (active: boolean) => void;
  setCropArea: (area: { x: number; y: number; width: number; height: number }) => void;
  applyCrop: () => Promise<void>;
  cancelCrop: () => void;

  // --- Clipboard ---
  clipboardLayer: Layer | null;
  copyLayer: (id: string) => void;
  pasteLayer: () => void;

  // --- Toasts ---
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;

  // --- Additional Gemini Features ---
  onEnhance: (id: string) => void;
  onUpscale: (id: string) => void;
  onRetouch: (id: string) => void;
  onRemix: (id: string) => void;
  onMagicExpand: (id: string) => void;
  applyMask: (targetId: string, maskId: string | null) => void;
}
