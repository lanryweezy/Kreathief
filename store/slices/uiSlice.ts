import { StateCreator } from 'zustand';
import {
  NavTab,
  AppMode,
  DesignComment,
  Toast,
  ToastType,
  ImageLayer,
  GeneratedImage,
} from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../../services/storageService';

export interface UISlice {
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
  snapToObjects: boolean;
  showShortcuts: boolean;
  fontPreview: string | null;
  customFonts: string[];
  uploads: string[];
  history: GeneratedImage[];
  showShareModal: boolean;
  showFeedbackModal: boolean;
  comments: DesignComment[];
  isCropMode: boolean;
  croppingLayerId: string | null;
  cropArea: { x: number; y: number; width: number; height: number };
  cropAspectRatio: number | null; // null for Free, or width/height ratio
  isLassoMode: boolean;
  lassoPoints: { x: number; y: number }[];
  refineBrushMode: 'none' | 'erase' | 'restore';
  refineBrushSize: number;
  showGoldenRatio: boolean;

  favoriteTemplates: string[];
  favoriteProjects: string[];
  toasts: Toast[];
  snapshots: any[];
  tags: string[];
  isPublished: boolean;

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
  setSnapToGrid: (snap: boolean) => void;
  setSnapToObjects: (snap: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowShareModal: (show: boolean) => void;
  setShowFeedbackModal: (show: boolean) => void;
  setPreviewFontFamily: (font: string | null) => void;
  addCustomFont: (font: string) => void;
  setShowGoldenRatio: (show: boolean) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setIsPublished: (isPublished: boolean) => void;
  addToast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }, details?: string) => void;
  removeToast: (id: string) => void;

  // Crop Actions
  onCrop: (id: string) => Promise<void>;
  setIsCropMode: (active: boolean) => void;
  setCropArea: (area: { x: number; y: number; width: number; height: number }) => void;
  applyCrop: () => Promise<void>;
  cancelCrop: () => void;
  setCropAspectRatio: (ratio: number | null) => void;
  setIsLassoMode: (active: boolean) => void;
  setLassoPoints: (points: { x: number; y: number }[]) => void;
  applyLasso: () => Promise<void>;
  cancelLasso: () => void;
  doneLasso: () => void;
  setRefineBrushMode: (mode: 'none' | 'erase' | 'restore') => void;
  setRefineBrushSize: (size: number) => void;

  // Collaboration
  fetchComments: () => Promise<void>;
  addComment: (text: string, user: any) => Promise<void>;

  // Favorites
  toggleFavoriteTemplate: (id: string) => void;
  toggleFavoriteProject: (id: string) => void;
}

export const createUISlice: StateCreator<any, [], [], UISlice> = (set, get) => ({
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
  snapToGrid: true,
  snapToObjects: true,
  showShortcuts: false,
  fontPreview: null,
  customFonts: [],
  uploads: [],
  history: [],
  showShareModal: false,
  showFeedbackModal: false,
  comments: [],
  snapshots: [],
  tags: [],
  isPublished: false,
  showGoldenRatio: false,
  toasts: [],
  isCropMode: false,
  croppingLayerId: null,
  cropArea: { x: 0, y: 0, width: 0, height: 0 },
  cropAspectRatio: null,
  isLassoMode: false,
  lassoPoints: [],
  refineBrushMode: 'none',
  refineBrushSize: 30,

  favoriteTemplates: [],
  favoriteProjects: [],

  setActiveTab: (activeTab) => set({ activeTab }),
  setMode: (mode) => set({ mode }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setHistory: (input) =>
    set((state: any) => ({
      history: typeof input === 'function' ? input(state.history) : input,
    })),
  clearHistory: () => set({ history: [] }),
  handleFileUpload: (files) => {
    const newUploads = files.map((file) => URL.createObjectURL(file));
    set((state: any) => ({ uploads: [...state.uploads, ...newUploads] }));
  },
  deleteUpload: (index) =>
    set((state: any) => {
      const url = state.uploads[index];
      if (url?.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      return {
        uploads: state.uploads.filter((_: any, i: number) => i !== index),
      };
    }),
  setIsShapeBuilderActive: (isShapeBuilderActive) => set({ isShapeBuilderActive }),
  setZoom: (zoom) => set((state: any) => ({ zoom: typeof zoom === 'function' ? zoom(state.zoom) : zoom })),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowRulers: (show) => set({ showRulers: show }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setSnapToObjects: (snap) => set({ snapToObjects: snap }),
  setShowShortcuts: (show) => set({ showShortcuts: show }),
  setShowShareModal: (show) => set({ showShareModal: show }),
  setShowFeedbackModal: (show) => set({ showFeedbackModal: show }),
  setPreviewFontFamily: (font) => set({ fontPreview: font }),
  addCustomFont: (font: string) => set((state: any) => ({ customFonts: [...state.customFonts, font] })),
  setShowGoldenRatio: (show) => set({ showGoldenRatio: show }),
  setTags: (tags) => set({ tags }),
  addTag: (tag) =>
    set((state: any) => ({
      tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag],
    })),
  removeTag: (tag) =>
    set((state: any) => ({
      tags: state.tags.filter((t: string) => t !== tag),
    })),
  setIsPublished: (isPublished) => set({ isPublished }),
  addToast: (message, type = 'info', action, details) => {
    const id = uuidv4();
    set((state: any) => ({
      toasts: [...state.toasts, { id, message, type, action, details }],
    }));
    // If no action, auto-remove after 5s. If action exists, keep it longer (15s).
    setTimeout(() => get().removeToast(id), action ? 15000 : 5000);
  },
  removeToast: (id) =>
    set((state: any) => ({
      toasts: state.toasts.filter((t: Toast) => t.id !== id),
    })),

  // Crop Implementation
  onCrop: async (id) => {
    const { layers } = get();
    const layer = layers.find((l: any) => l.id === id);
    if (!layer || layer.type !== 'image') {
      return;
    }

    const img = new Image();
    img.src = layer.src;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    const naturalWidth = img.width || (layer as ImageLayer).width;
    const naturalHeight = img.height || (layer as ImageLayer).height;

    if (!(layer as ImageLayer).naturalWidth) {
      set((state: any) => ({
        layers: state.layers.map((l: any) => (l.id === id ? { ...l, naturalWidth, naturalHeight } : l)),
      }));
    }

    const initialCropArea = (layer as ImageLayer).crop || {
      x: 0,
      y: 0,
      width: naturalWidth,
      height: naturalHeight,
    };

    set({
      isCropMode: true,
      croppingLayerId: id,
      cropArea: initialCropArea,
    });
  },

  setIsCropMode: (isCropMode) => set({ isCropMode }),
  setCropArea: (cropArea) => set({ cropArea }),

  applyCrop: async () => {
    const { croppingLayerId, cropArea, layers, saveToHistory } = get();
    if (!croppingLayerId) {
      return;
    }

    const layer = layers.find((l: any) => l.id === croppingLayerId) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    saveToHistory?.();

    const naturalWidth = layer.naturalWidth || layer.width;
    const previousCropWidth = layer.crop?.width || naturalWidth;
    const canvasScale = layer.width / previousCropWidth;

    set((state: any) => ({
      layers: state.layers.map((l: any) => {
        if (l.id !== croppingLayerId || l.type !== 'image') {
          return l;
        }
        const il = l as ImageLayer;
        const oldCropX = il.crop?.x || 0;
        const oldCropY = il.crop?.y || 0;

        return {
          ...il,
          crop: { ...cropArea },
          x: il.x + (cropArea.x - oldCropX) * canvasScale,
          y: il.y + (cropArea.y - oldCropY) * canvasScale,
          width: cropArea.width * canvasScale,
          height: cropArea.height * canvasScale,
        };
      }),
      isCropMode: false,
      croppingLayerId: null,
    }));
  },

  cancelCrop: () => set({ isCropMode: false, croppingLayerId: null }),
  setCropAspectRatio: (cropAspectRatio) => set({ cropAspectRatio }),

  setIsLassoMode: (isLassoMode) => set({ isLassoMode, lassoPoints: [] }),
  setLassoPoints: (lassoPoints) => set({ lassoPoints }),
  applyLasso: async () => {
    const { croppingLayerId, lassoPoints, layers, saveToHistory } = get();
    if (!croppingLayerId || lassoPoints.length < 3) {
      set({ isLassoMode: false, lassoPoints: [] });
      return;
    }

    const layer = layers.find((l: any) => l.id === croppingLayerId) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    saveToHistory?.();

    // Convert lasso points to SVG path data
    const pathData = `M ${lassoPoints[0].x} ${lassoPoints[0].y} ` +
      lassoPoints.slice(1).map((p: { x: number; y: number }) => `L ${p.x} ${p.y}`).join(' ') + ' Z';

    set((state: any) => ({
      layers: state.layers.map((l: any) =>
        l.id === croppingLayerId ? { ...l, maskPath: pathData, maskType: 'lasso' } : l
      ),
      isLassoMode: false,
      lassoPoints: [],
      croppingLayerId: null,
    }));
  },
  cancelLasso: () => set({
    isLassoMode: false,
    lassoPoints: [],
    croppingLayerId: null,
    refineBrushMode: 'none'
  }),
  doneLasso: () => set({
    isLassoMode: false,
    lassoPoints: [],
    croppingLayerId: null,
    refineBrushMode: 'none'
  }),

  setRefineBrushMode: (refineBrushMode) => set({ refineBrushMode }),
  setRefineBrushSize: (refineBrushSize) => set({ refineBrushSize }),

  fetchComments: async () => {
    const { projectId } = get();
    if (!projectId) {
      return;
    }
    const comments = await storageService.getComments(projectId);
    set({ comments });
  },

  addComment: async (text, user) => {
    const { projectId } = get();
    if (!projectId) {
      return;
    }
    const newComment: DesignComment = {
      id: uuidv4(),
      projectId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text,
      timestamp: Date.now(),
    };
    await storageService.saveComment(newComment);
    set((state: any) => ({ comments: [...state.comments, newComment] }));
  },

  toggleFavoriteTemplate: (id: string) =>
    set((state: any) => ({
      favoriteTemplates: state.favoriteTemplates.includes(id)
        ? state.favoriteTemplates.filter((tid: string) => tid !== id)
        : [...state.favoriteTemplates, id],
    })),

  toggleFavoriteProject: (id: string) =>
    set((state: any) => ({
      favoriteProjects: state.favoriteProjects.includes(id)
        ? state.favoriteProjects.filter((pid: string) => pid !== id)
        : [...state.favoriteProjects, id],
    })),
});
