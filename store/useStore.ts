import { create } from 'zustand';
import { Layer, CanvasSize, CanvasUnit, CanvasFilters, HistoryState, Project, NavTab, AppMode, BrushType, AspectRatio, GenerationQuality, ShapeLayer, TextLayer, ImageLayer, LayerFilters, BrandKit, GeneratedImage, DesignComment, DesignSnapshot, VectorPath } from '../types';
import { vectorizerService } from '../services/vectorizerService';
import { removeBackground } from '../utils/imageProcessor';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';
import * as geminiService from '../services/geminiService';

const DEFAULT_CANVAS_FILTERS: CanvasFilters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    grayscale: 0,
    blur: 0,
    opacity: 1,
    vignette: 0,
    hueRotate: 0
};

const DEFAULT_LAYER_FILTERS: LayerFilters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    grayscale: 0,
    blur: 0,
    opacity: 1,
    vignette: 0,
    hueRotate: 0
};

interface EditorState {
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

    // --- Drawing State ---
    isPenMode: boolean;
    brushColor: string;
    brushSize: number;
    brushOpacity: number;
    brushType: BrushType;

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

    // Golden Ratio State
    showGoldenRatio: boolean;
    setShowGoldenRatio: (show: boolean) => void;

    // Drawing Actions
    setPenMode: (isDrawing: boolean) => void;

    // Brand Actions
    addBrandKit: (kit: BrandKit) => void;
    deleteBrandKit: (id: string) => void;
    updateBrandKit: (id: string, updates: Partial<BrandKit>) => void;
    applyBrandColors: (colors: string[]) => void;
    applyBrandFonts: (heading: string, body: string) => void;
    setBrushColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    setBrushOpacity: (opacity: number) => void;
    setBrushType: (type: BrushType) => void;

    // AI Actions
    setPrompt: (prompt: string) => void;
    setAspectRatio: (ratio: AspectRatio) => void;
    setQuality: (quality: GenerationQuality) => void;

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
    layoutLayers: (type: 'grid' | 'row' | 'col') => void;
    addImageLayer: (src: string, name?: string) => void;
    addShapeLayer: (type: ShapeLayer['type'], style?: Partial<ShapeLayer>) => void;
    duplicateSelected: () => void;
    nudgeLayer: (id: string, dx: number, dy: number) => void;
    alignLayers: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
    distributeLayers: (type: 'horizontal' | 'vertical') => void;
    createProject: (name: string, size?: CanvasSize) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    duplicateProject: (project: Project) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    loadProject: (id: string) => void;
    loadAllProjects: () => Promise<void>;
    setProjects: (projects: Project[]) => void;
    handleNew: () => void;
    handleApplyBrandColors: (colors: string[]) => void;
    handleConvertToPath: (id: string) => void;
    handleDrawingComplete: (pathData: string) => void;
    handleUpdateCanvasSize: (size: CanvasSize) => void;
    handleApplyTemplate: (template: any) => void;
    vectorizeLayer: (id: string, options: any) => Promise<void>;
    onCrop: (id: string) => void;
    onRmBg: (id: string) => Promise<void>;
    onEnhance: (id: string) => void;
    onUpscale: (id: string) => void;
    onRetouch: (id: string) => void;
    onRemix: (id: string) => void;
    onMagicExpand: (id: string) => void;
    toggleEraser: () => void;
    applyMask: (targetId: string, maskId: string | null) => void;
    handleVectorDrawingComplete: (pathData: string, stroke: any) => void;
    setEditingPathId: (id: string | null) => void;
    onUpdatePath: (id: string, updates: Partial<ShapeLayer>) => void;
    // --- Clipboard ---
    clipboardLayer: Layer | null;
    copyLayer: (id: string) => void;
    pasteLayer: () => void;
}

const DEFAULT_CANVAS_SIZE: CanvasSize = { width: 1080, height: 1080, name: 'Square (IG Post)' };

export const useStore = create<EditorState>((set, get) => ({
    layers: [],
    selectedLayerIds: [],
    canvasSize: DEFAULT_CANVAS_SIZE,
    canvasBackgroundColor: '#ffffff',
    canvasFilters: DEFAULT_CANVAS_FILTERS,
    unit: 'px',

    // UI Initial State
    activeTab: NavTab.MAGIC,
    mode: AppMode.GENERATE,
    isProcessing: false,
    isExporting: false,
    isRemovingBg: false,
    isExpanding: false,
    isEraserActive: false,
    isShapeBuilderActive: false,
    zoom: 0.5,
    showGrid: false,
    showRulers: false,
    showShortcuts: false,
    fontPreview: null,
    customFonts: [],
    showShareModal: false,
    showGoldenRatio: false,
    setShowGoldenRatio: (show: boolean) => set({ showGoldenRatio: show }),

    // Drawing Initial State
    isPenMode: false,
    brushColor: '#000000',
    brushSize: 5,
    brushOpacity: 1,
    brushType: BrushType.BASIC,
    comments: [],
    snapshots: [],
    tags: [],
    isPublished: false,

    // AI Initial State
    prompt: '',
    aspectRatio: AspectRatio.SQUARE,
    quality: 'standard',

    brandKits: [],
    uploads: [],
    history: [],
    projects: [],
    projectId: `proj_${Date.now()}`,
    projectTitle: 'Untitled Design',
    isSaving: false,
    textLayers: [],
    shapeLayers: [],
    imageLayers: [],

    past: [],
    future: [],
    editingPathId: null,

    setProjectId: (projectId) => set({ projectId }),
    setProjectTitle: (projectTitle) => set({ projectTitle }),
    setIsSaving: (isSaving) => set({ isSaving }),

    saveProject: async () => {
        const { projectId, projectTitle, layers, canvasBackgroundColor, canvasFilters, canvasSize } = get();
        if (layers.length === 0 && projectTitle === 'Untitled Design') return;

        set({ isSaving: true });
        try {
            const updatedProject: Project = {
                id: projectId,
                name: projectTitle,
                updatedAt: Date.now(),
                state: {
                    layers,
                    canvasBackgroundColor,
                    canvasFilters,
                    canvasSize
                }
            };
            await storageService.saveProject(updatedProject);
            set(state => ({
                isSaving: false,
                projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
            }));
        } catch (e) {
            console.error("Save failed", e);
            set({ isSaving: false });
        }
    },

    setLayers: (input) => set((state) => {
        const layers = typeof input === 'function' ? input(state.layers) : input;
        return {
            layers,
            textLayers: layers.filter(l => l.type === 'text') as TextLayer[],
            shapeLayers: layers.filter(l => l.type !== 'text' && l.type !== 'image') as ShapeLayer[],
            imageLayers: layers.filter(l => l.type === 'image') as ImageLayer[]
        };
    }),

    addLayer: (layer) => {
        get().saveToHistory();
        set((state) => ({
            layers: [...state.layers, layer],
            selectedLayerIds: [layer.id]
        }));
    },

    addLayers: (newLayers) => {
        get().saveToHistory();
        set((state) => ({
            layers: [...state.layers, ...newLayers],
            selectedLayerIds: newLayers.map(l => l.id)
        }));
    },

    addTextLayer: (style = {}) => {
        get().saveToHistory();
        const state = get();
        const newLayer: TextLayer = {
            id: `text_${Date.now()}`,
            type: 'text',
            name: 'Text',
            text: style.text || 'Add your text',
            x: state.canvasSize.width / 2 - 100,
            y: state.canvasSize.height / 2 - 25,
            width: 200,
            height: style.fontSize || 40,
            rotation: 0,
            fontSize: style.fontSize || 40,
            fontWeight: style.fontWeight || '700',
            fontFamily: style.fontFamily || 'Inter',
            fontStyle: style.fontStyle || 'normal',
            textDecoration: style.textDecoration || 'none',
            textAlign: style.textAlign || 'center',
            color: style.color || '#000000',
            opacity: style.opacity ?? 1,
            locked: false,
            visible: true,
            filters: { ...DEFAULT_LAYER_FILTERS },
            lineHeight: style.lineHeight || 1.2,
            letterSpacing: style.letterSpacing || 0,
            textTransform: style.textTransform || 'none',
            warpStyle: style.warpStyle || 'none',
            curve: style.curve || 0,
            ...style
        };
        set((state) => ({
            layers: [...state.layers, newLayer],
            selectedLayerIds: [newLayer.id]
        }));
    },

    updateLayer: (id, partial) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, ...partial } as Layer : l)
    })),

    updateLayers: (updates) => set((state) => ({
        layers: state.layers.map(l => updates[l.id] ? { ...l, ...updates[l.id] } as Layer : l)
    })),

    selectLayer: (id) => set({ selectedLayerIds: id ? [id] : [] }),

    multiSelectLayer: (id, shiftKey) => set((state) => {
        if (!shiftKey) return { selectedLayerIds: [id] };
        if (state.selectedLayerIds.includes(id)) {
            return { selectedLayerIds: state.selectedLayerIds.filter(i => i !== id) };
        }
        return { selectedLayerIds: [...state.selectedLayerIds, id] };
    }),

    setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),

    setCanvasSize: (size) => {
        get().saveToHistory();
        set({ canvasSize: size });
    },

    setCanvasBackgroundColor: (color) => {
        set({ canvasBackgroundColor: color });
    },

    setCanvasFilters: (input) => set((state) => ({
        canvasFilters: typeof input === 'function' ? input(state.canvasFilters) : input
    })),

    setUnit: (unit) => set({ unit }),

    // UI Actions
    setActiveTab: (activeTab) => set({ activeTab }),
    setMode: (mode) => set({ mode }),
    setIsProcessing: (isProcessing) => set({ isProcessing }),
    setIsExporting: (isExporting) => set({ isExporting }),
    setHistory: (input) => set((state) => ({
        history: typeof input === 'function' ? input(state.history) : input
    })),
    clearHistory: () => set({ history: [] }),
    setIsShapeBuilderActive: (isShapeBuilderActive) => set({ isShapeBuilderActive }),
    setZoom: (zoom) => set(state => ({ zoom: typeof zoom === 'function' ? zoom(state.zoom) : zoom })),
    setShowGrid: (show) => set({ showGrid: show }),
    setShowRulers: (show) => set({ showRulers: show }),
    setShowShortcuts: (show) => set({ showShortcuts: show }),
    setShowShareModal: (show) => set({ showShareModal: show }),
    setPreviewFontFamily: (font) => set({ fontPreview: font }),
    addCustomFont: (font: string) => set(state => ({ customFonts: [...state.customFonts, font] })),

    // Drawing Actions
    setPenMode: (isPenMode) => set({ isPenMode }),
    setBrushColor: (brushColor) => set({ brushColor }),
    setBrushSize: (brushSize) => set({ brushSize }),
    setBrushOpacity: (brushOpacity) => set({ brushOpacity }),
    setBrushType: (brushType) => set({ brushType }),

    // AI Actions
    setPrompt: (prompt) => set({ prompt }),
    setAspectRatio: (aspectRatio) => set({ aspectRatio }),
    setQuality: (quality) => set({ quality }),

    // Brand Actions
    addBrandKit: (kit) => set(state => ({ brandKits: [...state.brandKits, kit] })),
    deleteBrandKit: (id) => set(state => ({ brandKits: state.brandKits.filter(k => k.id !== id) })),
    updateBrandKit: (id, updates) => set(state => ({
        brandKits: state.brandKits.map(k => k.id === id ? { ...k, ...updates } : k)
    })),
    applyBrandColors: (colors) => {
        get().saveToHistory();
        get().setCanvasBackgroundColor(colors[0]);
    },
    applyBrandFonts: (heading, body) => {
        get().saveToHistory();
        const { layers, updateLayer } = get();
        layers.forEach(l => {
            if (l.type === 'text') {
                updateLayer(l.id, { fontFamily: (l as TextLayer).fontWeight === '700' ? heading : body });
            }
        });
    },

    handleFileUpload: (files) => {
        const newUploads = files.map(file => URL.createObjectURL(file));
        set(state => ({ uploads: [...state.uploads, ...newUploads] }));
    },
    deleteUpload: (index) => set(state => ({
        uploads: state.uploads.filter((_, i) => i !== index)
    })),

    saveToHistory: () => {
        set((state) => {
            const currentState: HistoryState = {
                layers: JSON.parse(JSON.stringify(state.layers)),
                canvasBackgroundColor: state.canvasBackgroundColor,
                canvasFilters: { ...state.canvasFilters },
                canvasSize: { ...state.canvasSize }
            };
            const newPast = [...state.past, currentState];
            if (newPast.length > 50) newPast.shift();
            return {
                past: newPast,
                future: []
            };
        });
    },

    // --- Legacy Handlers Removal ---


    // Collaboration & Versioning
    setTags: (tags) => set({ tags }),
    addTag: (tag) => set((state) => ({
        tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag]
    })),
    removeTag: (tag) => set((state) => ({
        tags: state.tags.filter(t => t !== tag)
    })),
    setIsPublished: (isPublished) => set({ isPublished }),

    fetchComments: async () => {
        const { projectId } = get();
        if (!projectId) return;
        const comments = await storageService.getComments(projectId);
        set({ comments });
    },
    addComment: async (text, user) => {
        const { projectId } = get();
        if (!projectId) return;
        const newComment: DesignComment = {
            id: uuidv4(),
            projectId,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            text,
            timestamp: Date.now()
        };
        await storageService.saveComment(newComment);
        set((state) => ({ comments: [...state.comments, newComment] }));
    },
    fetchSnapshots: async () => {
        const { projectId } = get();
        if (!projectId) return;
        const snapshots = await storageService.getSnapshots(projectId);
        set({ snapshots });
    },
    createSnapshot: async (name, thumbnail) => {
        const { projectId, past, future, layers, canvasBackgroundColor, canvasFilters, canvasSize } = get();
        if (!projectId) return;

        const snapshot: DesignSnapshot = {
            id: uuidv4(),
            projectId,
            name,
            timestamp: Date.now(),
            state: {
                layers: JSON.parse(JSON.stringify(layers)),
                canvasBackgroundColor,
                canvasFilters: { ...canvasFilters },
                canvasSize: canvasSize ? { ...canvasSize } : undefined
            },
            thumbnail
        };

        await storageService.saveSnapshot(snapshot);
        set((state) => ({ snapshots: [snapshot, ...state.snapshots] }));
    },
    restoreSnapshot: async (snapshotId) => {
        const { snapshots } = get();
        const snapshot = snapshots.find(s => s.id === snapshotId);
        if (!snapshot) return;

        get().saveToHistory(); // Save current state to undo stack before restoring

        set({
            layers: JSON.parse(JSON.stringify(snapshot.state.layers)),
            canvasBackgroundColor: snapshot.state.canvasBackgroundColor,
            canvasFilters: { ...snapshot.state.canvasFilters },
            canvasSize: snapshot.state.canvasSize ? { ...snapshot.state.canvasSize } : get().canvasSize,
            selectedLayerIds: []
        });
    },
    deleteSnapshot: async (snapshotId) => {
        // storageService deleteSnapshot not implemented yet, using common pattern
        set((state) => ({ snapshots: state.snapshots.filter(s => s.id !== snapshotId) }));
    },

    undo: () => set((state) => {
        if (state.past.length === 0) return {};
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        const current: HistoryState = {
            layers: state.layers,
            canvasBackgroundColor: state.canvasBackgroundColor,
            canvasFilters: state.canvasFilters,
            canvasSize: state.canvasSize
        };
        return {
            past: newPast,
            future: [current, ...state.future],
            layers: previous.layers,
            canvasBackgroundColor: previous.canvasBackgroundColor,
            canvasFilters: previous.canvasFilters,
            canvasSize: previous.canvasSize || state.canvasSize
        };
    }),

    redo: () => set((state) => {
        if (state.future.length === 0) return {};
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        const current: HistoryState = {
            layers: state.layers,
            canvasBackgroundColor: state.canvasBackgroundColor,
            canvasFilters: state.canvasFilters,
            canvasSize: state.canvasSize
        };
        return {
            past: [...state.past, current],
            future: newFuture,
            layers: next.layers,
            canvasBackgroundColor: next.canvasBackgroundColor,
            canvasFilters: next.canvasFilters,
            canvasSize: next.canvasSize || state.canvasSize
        };
    }),

    initializeProject: (project) => set({
        projectId: project.id,
        projectTitle: project.name,
        layers: project.state.layers || [],
        canvasBackgroundColor: project.state.canvasBackgroundColor || '#ffffff',
        canvasFilters: project.state.canvasFilters || DEFAULT_CANVAS_FILTERS,
        canvasSize: project.state.canvasSize || DEFAULT_CANVAS_SIZE,
        selectedLayerIds: [],
        past: [],
        future: []
    }),

    reset: () => set({
        layers: [],
        selectedLayerIds: [],
        canvasBackgroundColor: '#ffffff',
        past: [],
        future: []
    }),

    // --- Complex Actions Implementation ---

    deleteLayer: (id) => {
        get().saveToHistory();
        set((state) => ({
            layers: state.layers.filter(l => l.id !== id),
            selectedLayerIds: state.selectedLayerIds.filter(sid => sid !== id)
        }));
    },

    deleteSelected: () => {
        const { selectedLayerIds } = get();
        if (selectedLayerIds.length === 0) return;
        get().saveToHistory();
        set((state) => ({
            layers: state.layers.filter(l => !state.selectedLayerIds.includes(l.id)),
            selectedLayerIds: []
        }));
    },

    duplicateLayer: (id) => {
        const { layers } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer) return;
        get().saveToHistory();
        const newLayer = {
            ...layer,
            id: `${layer.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            x: layer.x + 20,
            y: layer.y + 20,
            name: layer.name + ' Copy'
        };
        set((state) => ({
            layers: [...state.layers, newLayer],
            selectedLayerIds: [newLayer.id]
        }));
    },

    reorderLayer: (id, newIndex) => {
        const { layers, saveToHistory } = get();
        const oldIndex = layers.findIndex(l => l.id === id);
        if (oldIndex === -1 || newIndex < 0 || newIndex >= layers.length || oldIndex === newIndex) return;

        saveToHistory();
        const newLayers = [...layers];
        const [removed] = newLayers.splice(oldIndex, 1);
        newLayers.splice(newIndex, 0, removed);

        set({ layers: newLayers });
    },

    moveLayer: (id, direction) => {
        get().saveToHistory();
        set((state) => {
            const idx = state.layers.findIndex(l => l.id === id);
            if (idx === -1) return {};
            const newLayers = [...state.layers];
            const item = newLayers.splice(idx, 1)[0];
            let newIndex = idx;
            if (direction === 'front') newIndex = newLayers.length;
            if (direction === 'back') newIndex = 0;
            if (direction === 'forward') newIndex = Math.min(newLayers.length, idx + 1);
            if (direction === 'backward') newIndex = Math.max(0, idx - 1);
            newLayers.splice(newIndex, 0, item);
            return { layers: newLayers };
        });
    },

    groupSelected: () => {
        const { selectedLayerIds } = get();
        if (selectedLayerIds.length < 2) return;
        get().saveToHistory();
        const newGroupId = `group_${Date.now()}`;
        set((state) => ({
            layers: state.layers.map(l => state.selectedLayerIds.includes(l.id) ? { ...l, groupId: newGroupId } : l)
        }));
    },

    ungroupSelected: () => {
        const { selectedLayerIds, layers } = get();
        if (selectedLayerIds.length === 0) return;
        const selectedItems = layers.filter(l => selectedLayerIds.includes(l.id));
        const targetGroupId = selectedItems.find(l => l.groupId)?.groupId;
        if (!targetGroupId) return;

        get().saveToHistory();
        set((state) => ({
            layers: state.layers.map(l => l.groupId === targetGroupId ? { ...l, groupId: undefined } : l)
        }));
    },

    layoutLayers: (type) => {
        const { layers } = get();
        const visibleLayers = layers.filter(l => !l.locked && l.visible);
        if (visibleLayers.length === 0) return;
        get().saveToHistory();
        // Simple implementation - ideally imported from utils to avoid duplication, but inline for now to match Editor.tsx logic
        const sorted = [...visibleLayers].sort((a, b) => (a.y - b.y) || (a.x - b.x));
        const count = sorted.length;
        const PADDING = 20;
        const CANVAS_W = get().canvasSize.width;
        const CANVAS_H = get().canvasSize.height;
        const getHeight = (l: any) => l.height || (l.type === 'text' ? l.fontSize * 1.2 : 100);

        const newPositions = new Map<string, { x: number, y: number }>();

        if (type === 'row') {
            const totalWidth = sorted.reduce((acc, l) => acc + l.width, 0);
            const spacing = (CANVAS_W - 2 * PADDING - totalWidth) / (Math.max(1, count - 1));
            let currentX = PADDING;
            const centerY = CANVAS_H / 2;
            sorted.forEach(l => {
                newPositions.set(l.id, { x: count === 1 ? (CANVAS_W - l.width) / 2 : currentX, y: centerY - getHeight(l) / 2 });
                currentX += l.width + Math.max(0, spacing);
            });
        } else if (type === 'col') {
            const totalHeight = sorted.reduce((acc, l) => acc + getHeight(l), 0);
            const spacing = (CANVAS_H - 2 * PADDING - totalHeight) / (Math.max(1, count - 1));
            let currentY = PADDING;
            const centerX = CANVAS_W / 2;
            sorted.forEach(l => {
                newPositions.set(l.id, { x: centerX - l.width / 2, y: count === 1 ? (CANVAS_H - getHeight(l)) / 2 : currentY });
                currentY += getHeight(l) + Math.max(0, spacing);
            });
        } else if (type === 'grid') {
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            const cellW = (CANVAS_W - 2 * PADDING) / cols;
            const cellH = (CANVAS_H - 2 * PADDING) / rows;
            sorted.forEach((l, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                newPositions.set(l.id, {
                    x: PADDING + col * cellW + cellW / 2 - l.width / 2,
                    y: PADDING + row * cellH + cellH / 2 - getHeight(l) / 2
                });
            });
        }

        set((state) => ({
            layers: state.layers.map(l => {
                const pos = newPositions.get(l.id);
                return pos ? { ...l, ...pos } : l;
            })
        }));
    },

    clipboardLayer: null,
    copyLayer: (id) => {
        const layer = get().layers.find(l => l.id === id);
        if (layer) set({ clipboardLayer: JSON.parse(JSON.stringify(layer)) });
    },
    pasteLayer: () => {
        const { clipboardLayer } = get();
        if (!clipboardLayer) return;
        get().saveToHistory();
        const newLayer = {
            ...clipboardLayer,
            id: `${clipboardLayer.type}_${Date.now()}`,
            x: clipboardLayer.x + 20,
            y: clipboardLayer.y + 20,
            name: clipboardLayer.name + ' Copy'
        };
        set((state) => ({
            layers: [...state.layers, newLayer],
            selectedLayerIds: [newLayer.id]
        }));
    },

    addImageLayer: (src, name = 'Image') => {
        get().saveToHistory();
        const state = get();
        const newLayer: ImageLayer = {
            id: `image_${Date.now()}`,
            type: 'image',
            name,
            src,
            x: state.canvasSize.width / 2 - 100,
            y: state.canvasSize.height / 2 - 100,
            width: 200,
            height: 200,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            flipX: false,
            flipY: false,
            filters: { ...DEFAULT_LAYER_FILTERS },
            blendMode: 'normal'
        };
        set(state => ({
            layers: [...state.layers, newLayer],
            selectedLayerIds: [newLayer.id],
            imageLayers: [...state.imageLayers, newLayer]
        }));
    },

    addShapeLayer: (type, style = {}) => {
        get().saveToHistory();
        const state = get();
        const newLayer: ShapeLayer = {
            id: `${type}_${Date.now()}`,
            type: type as any,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            x: state.canvasSize.width / 2 - 50,
            y: state.canvasSize.height / 2 - 50,
            width: 100,
            height: 100,
            rotation: 0,
            color: '#000000',
            cornerRadius: 0,
            opacity: 1,
            locked: false,
            visible: true,
            filters: { ...DEFAULT_LAYER_FILTERS },
            ...style
        };
        set(state => ({
            layers: [...state.layers, newLayer],
            selectedLayerIds: [newLayer.id],
            shapeLayers: [...state.shapeLayers, newLayer]
        }));
    },

    duplicateSelected: () => {
        const { selectedLayerIds, layers } = get();
        if (selectedLayerIds.length === 0) return;
        get().saveToHistory();
        const newLayers: Layer[] = [];
        const newIds: string[] = [];
        selectedLayerIds.forEach(id => {
            const layer = layers.find(l => l.id === id);
            if (layer) {
                const newLayer = {
                    ...JSON.parse(JSON.stringify(layer)),
                    id: `${layer.type}_${Date.now()}_${Math.random()}`,
                    x: layer.x + 20,
                    y: layer.y + 20
                };
                newLayers.push(newLayer);
                newIds.push(newLayer.id);
            }
        });
        set(state => ({
            layers: [...state.layers, ...newLayers],
            selectedLayerIds: newIds
        }));
    },

    nudgeLayer: (id, dx, dy) => set(state => ({
        layers: state.layers.map(l => l.id === id ? { ...l, x: l.x + dx, y: l.y + dy } : l)
    })),

    alignLayers: (type) => {
        const { selectedLayerIds, layers } = get();
        if (selectedLayerIds.length < 2) return;
        get().saveToHistory();
        const selected = layers.filter(l => selectedLayerIds.includes(l.id));
        let value = 0;
        if (type === 'left') value = Math.min(...selected.map(l => l.x));
        if (type === 'right') value = Math.max(...selected.map(l => l.x + l.width));
        if (type === 'top') value = Math.min(...selected.map(l => l.y));
        if (type === 'bottom') value = Math.max(...selected.map(l => l.y + (l.height || 0)));
        if (type === 'center') value = selected.reduce((acc, l) => acc + l.x + l.width / 2, 0) / selected.length;
        if (type === 'middle') value = selected.reduce((acc, l) => acc + l.y + (l.height || 0) / 2, 0) / selected.length;

        set(state => ({
            layers: state.layers.map(l => {
                if (!selectedLayerIds.includes(l.id)) return l;
                if (type === 'left') return { ...l, x: value };
                if (type === 'right') return { ...l, x: value - l.width };
                if (type === 'top') return { ...l, y: value };
                if (type === 'bottom') return { ...l, y: value - (l.height || 0) };
                if (type === 'center') return { ...l, x: value - l.width / 2 };
                if (type === 'middle') return { ...l, y: value - (l.height || 0) / 2 };
                return l;
            })
        }));
    },

    distributeLayers: (type) => {
        const { selectedLayerIds, layers } = get();
        if (selectedLayerIds.length < 3) return;
        get().saveToHistory();
        const selected = layers.filter(l => selectedLayerIds.includes(l.id));
        if (type === 'horizontal') {
            const sorted = [...selected].sort((a, b) => a.x - b.x);
            const totalWidth = sorted.reduce((acc, l) => acc + l.width, 0);
            const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
            const spacing = (span - totalWidth) / (sorted.length - 1);
            let currentX = sorted[0].x;
            set(state => ({
                layers: state.layers.map(l => {
                    const idx = sorted.findIndex(s => s.id === l.id);
                    if (idx === -1) return l;
                    const res = { ...l, x: currentX };
                    currentX += l.width + spacing;
                    return res;
                })
            }));
        } else {
            const sorted = [...selected].sort((a, b) => a.y - b.y);
            const totalHeight = sorted.reduce((acc, l) => acc + (l.height || 0), 0);
            const span = sorted[sorted.length - 1].y + (sorted[sorted.length - 1].height || 0) - sorted[0].y;
            const spacing = (span - totalHeight) / (sorted.length - 1);
            let currentY = sorted[0].y;
            set(state => ({
                layers: state.layers.map(l => {
                    const idx = sorted.findIndex(s => s.id === l.id);
                    if (idx === -1) return l;
                    const res = { ...l, y: currentY };
                    currentY += (l.height || 0) + spacing;
                    return res;
                })
            }));
        }
    },

    createProject: async (name, size) => {
        const id = uuidv4();
        const newProject: Project = {
            id,
            name,
            updatedAt: Date.now(),
            state: {
                layers: [],
                canvasBackgroundColor: '#ffffff',
                canvasFilters: DEFAULT_CANVAS_FILTERS,
                canvasSize: size || DEFAULT_CANVAS_SIZE
            }
        };
        await storageService.saveProject(newProject);
        set(state => ({ projects: [newProject, ...state.projects] }));
        get().initializeProject(newProject);
    },
    deleteProject: async (id) => {
        await storageService.deleteProject(id);
        set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
    },
    duplicateProject: async (project) => {
        const newProject: Project = {
            ...project,
            id: uuidv4(),
            name: `${project.name} (Copy)`,
            updatedAt: Date.now()
        };
        await storageService.saveProject(newProject);
        set(state => ({ projects: [newProject, ...state.projects] }));
    },
    updateProject: async (id, updates) => {
        const { projects } = get();
        const project = projects.find(p => p.id === id);
        if (!project) return;
        const updatedProject = { ...project, ...updates, updatedAt: Date.now() };
        await storageService.saveProject(updatedProject);
        set(state => ({
            projects: state.projects.map(p => p.id === id ? updatedProject : p)
        }));
    },
    loadProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        if (project) get().initializeProject(project);
    },
    loadAllProjects: async () => {
        try {
            const projects = await storageService.getAllProjects();
            set({ projects: projects.sort((a, b) => b.updatedAt - a.updatedAt) });
        } catch (e) {
            console.error("Failed to load projects", e);
        }
    },
    setProjects: (projects) => set({ projects }),
    handleNew: () => get().reset(),
    handleApplyBrandColors: (colors) => get().applyBrandColors(colors),
    handleConvertToPath: (id) => { },
    handleDrawingComplete: (dataUrl) => {
        get().addImageLayer(dataUrl, 'Drawing');
    },
    handleVectorDrawingComplete: (pathData: string, stroke: any) => {
        get().addShapeLayer('path', { pathData, stroke } as any);
    },
    handleUpdateCanvasSize: (size) => get().setCanvasSize(size),
    handleApplyTemplate: (template) => {
        get().saveToHistory();
        set({
            layers: template.layers,
            canvasBackgroundColor: template.canvasBackgroundColor || '#ffffff'
        });
    },

    vectorizeLayer: async (id, options) => {
        const { layers } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type !== 'image') return; // Type guard

        set({ isProcessing: true });

        try {
            // @ts-ignore
            const svgString = await vectorizerService.traceImage(layer.src, options);
            const pathElements = vectorizerService.extractPaths(svgString);

            if (pathElements.length === 0) throw new Error("No paths generated");

            const groupId = uuidv4();
            const newPaths: ShapeLayer[] = pathElements.map((p, i) => ({
                id: uuidv4(),
                type: 'path',
                pathData: p.d,
                color: p.fill || '#000000',
                x: layer.x,
                y: layer.y,
                width: layer.width,
                height: layer.height,
                rotation: layer.rotation,
                opacity: layer.opacity,
                visible: true,
                locked: false,
                cornerRadius: 0,
                groupId: groupId
            }));

            get().saveToHistory();
            set(state => ({
                layers: [...state.layers, ...newPaths],
                isProcessing: false
            }));

        } catch (error) {
            console.error(error);
            set({ isProcessing: false });
        }
    },
    setEditingPathId: (id) => set({ editingPathId: id }),
    onUpdatePath: (id, updates) => {
        set(state => ({
            layers: state.layers.map(l => {
                if (l.id === id && (l.type === 'path' || l.type === 'rectangle' || l.type === 'circle' || l.type === 'triangle' || l.type === 'star')) {
                    return { ...l, ...updates };
                }
                return l;
            })
        }));
    },

    onCrop: (id) => {
        console.warn("onCrop not implemented yet");
        alert("Crop feature coming soon!");
    },

    onRmBg: async (id) => {
        const { layers, saveToHistory } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type !== 'image') return;

        set({ isRemovingBg: true, isProcessing: true });
        try {
            const newSrc = await removeBackground(layer.src);
            saveToHistory();
            set(state => ({
                layers: state.layers.map(l => l.id === id ? { ...l, src: newSrc } : l),
                isRemovingBg: false,
                isProcessing: false
            }));
        } catch (error) {
            console.error("Failed to remove background", error);
            set({ isRemovingBg: false, isProcessing: false });
            alert("Failed to remove background.");
        }
    },

    onEnhance: async (id) => {
        const { layers, saveToHistory } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type !== 'image') return;

        set({ isProcessing: true });
        try {
            const newSrc = await geminiService.enhanceImage(layer.src);
            saveToHistory();
            set(state => ({
                layers: state.layers.map(l => l.id === id ? { ...l, src: newSrc } : l),
                isProcessing: false
            }));
        } catch (error) {
            console.error("Enhance failed", error);
            set({ isProcessing: false });
            alert("Failed to enhance image.");
        }
    },

    onUpscale: async (id) => {
        const { layers, saveToHistory } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type !== 'image') return;

        set({ isProcessing: true });
        try {
            const newSrc = await geminiService.upscaleImage(layer.src);
            saveToHistory();
            set(state => ({
                layers: state.layers.map(l => l.id === id ? { ...l, src: newSrc } : l),
                isProcessing: false
            }));
        } catch (error) {
            console.error("Upscale failed", error);
            set({ isProcessing: false });
            alert("Failed to upscale image.");
        }
    },

    onRetouch: async (id) => {
        const { layers, saveToHistory } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type !== 'image') return;

        set({ isProcessing: true });
        try {
            const newSrc = await geminiService.retouchImage(layer.src);
            saveToHistory();
            set(state => ({
                layers: state.layers.map(l => l.id === id ? { ...l, src: newSrc } : l),
                isProcessing: false
            }));
        } catch (error) {
            console.error("Retouch failed", error);
            set({ isProcessing: false });
            alert("Failed to retouch image.");
        }
    },

    onRemix: async (id) => {
        const prompt = window.prompt("Enter a style or description to remix this image:");
        if (!prompt) return;

        const { layers, saveToHistory } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type !== 'image') return;

        set({ isProcessing: true });
        try {
            // Remix usually means editing the image based on a prompt
            const newSrc = await geminiService.editImage(layer.src, prompt);
            saveToHistory();
            set(state => ({
                layers: state.layers.map(l => l.id === id ? { ...l, src: newSrc } : l),
                isProcessing: false
            }));
        } catch (error) {
            console.error("Remix failed", error);
            set({ isProcessing: false });
            alert("Failed to remix image.");
        }
    },

    onMagicExpand: async (id) => {
        const { layers, saveToHistory } = get();
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type !== 'image') return;

        set({ isExpanding: true, isProcessing: true });
        try {
            const newSrc = await geminiService.expandImage(layer.src);
            saveToHistory();
            set(state => ({
                layers: state.layers.map(l => l.id === id ? { ...l, src: newSrc } : l),
                isExpanding: false,
                isProcessing: false
            }));
        } catch (error) {
            console.error("Magic Expand failed", error);
            set({ isExpanding: false, isProcessing: false });
            alert("Failed to expand image.");
        }
    },

    toggleEraser: () => {
        set(state => ({ isEraserActive: !state.isEraserActive, isPenMode: !state.isEraserActive }));
    },

    applyMask: (targetId, maskId) => {
        get().saveToHistory();
        set(state => ({
            layers: state.layers.map(l => l.id === targetId ? { ...l, maskLayerId: maskId ?? undefined } : l)
        }));
    },

}));
