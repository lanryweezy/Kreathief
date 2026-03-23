import { StateCreator } from 'zustand';
import { AspectRatio, GenerationQuality, ShapeLayer, ImageLayer, Layer } from '../../types';
import { vectorizerService, VectorizeOptions } from '../../services/vectorizerService';
import { removeBackground } from '../../utils/imageProcessor';
import * as geminiService from '../../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

export interface AISlice {
  prompt: string;
  aspectRatio: AspectRatio;
  quality: GenerationQuality;

  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setQuality: (quality: GenerationQuality) => void;
  handleConvertToPath: (id: string) => void;
  vectorizeLayer: (id: string, options: VectorizeOptions) => Promise<void>;
  onRmBg: (id: string) => Promise<void>;
  handleUpdateCanvasSize: (size: any) => void;
  handleApplyTemplate: (template: any) => void;
  handleDrawingComplete: (pathData: string) => void;
  handleVectorDrawingComplete: (pathData: string, stroke: any) => void;
  onEnhance: (id: string) => Promise<void>;
  onUpscale: (id: string) => Promise<void>;
  onRetouch: (id: string) => Promise<void>;
  onRemix: (id: string) => Promise<void>;
  onMagicExpand: (id: string) => Promise<void>;
}

export const createAISlice: StateCreator<any, [], [], AISlice> = (set, get) => ({
  prompt: '',
  aspectRatio: AspectRatio.SQUARE,
  quality: 'standard',

  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setQuality: (quality) => set({ quality }),

  handleConvertToPath: (_id) => {},

  vectorizeLayer: async (id, options) => {
    const { layers, deleteLayer, addLayers, saveToHistory, updateLayer } = get();
    const layer = layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isProcessing: true });
    updateLayer(id, { isProcessing: true });
    try {
      const svgString = await vectorizerService.traceImage(layer.src, options);
      const pathElements = vectorizerService.extractPaths(svgString);

      if (pathElements.length === 0) {
        throw new Error('No paths generated');
      }

      saveToHistory();
      const groupId = uuidv4();
      const newPaths: ShapeLayer[] = pathElements.map((p) => ({
        id: uuidv4(),
        type: 'path',
        name: 'Vector Path',
        pathData: p.d,
        color: p.fill,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation,
        opacity: layer.opacity,
        visible: true,
        locked: false,
        groupId: groupId,
        cornerRadius: 0,
        filters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: 0,
          blur: 0,
          sepia: 0,
          hueRotate: 0,
          vignette: 0,
          opacity: 1,
        },
        blendMode: 'normal',
        skewX: 0,
        skewY: 0,
        perspective: 0,
        rotateX: 0,
        rotateY: 0,
      }));

      deleteLayer(id);
      addLayers(newPaths);
    } catch (e) {
      console.error('Vectorization failed', e);
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isProcessing: false });
    }
  },

  onRmBg: async (id) => {
    const { layers, updateLayer, saveToHistory } = get();
    const layer = layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isProcessing: true, isRemovingBg: true });
    updateLayer(id, { isProcessing: true });
    try {
      const result = await removeBackground(layer.src);
      saveToHistory();
      updateLayer(id, { src: result, isProcessing: false });
    } catch (e) {
      console.error('BG Removal failed', e);
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isProcessing: false, isRemovingBg: false });
    }
  },

  onEnhance: async (id) => {
    const { layers, updateLayer, saveToHistory } = get();
    const layer = layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isProcessing: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.enhanceImage(layer.src);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      console.error('Enhance failed', error);
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isProcessing: false });
    }
  },

  onUpscale: async (id) => {
    const { layers, updateLayer, saveToHistory } = get();
    const layer = layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isProcessing: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.upscaleImage(layer.src);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      console.error('Upscale failed', error);
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isProcessing: false });
    }
  },

  onRetouch: async (id) => {
    const { layers, updateLayer, saveToHistory } = get();
    const layer = layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isProcessing: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.retouchImage(layer.src);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      console.error('Retouch failed', error);
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isProcessing: false });
    }
  },

  onRemix: async (id) => {
    const prompt = window.prompt('Enter a style or description to remix this image:');
    if (!prompt) {
      return;
    }

    const { layers, updateLayer, saveToHistory } = get();
    const layer = layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isProcessing: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.editImage(layer.src, prompt);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      console.error('Remix failed', error);
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isProcessing: false });
    }
  },

  onMagicExpand: async (id) => {
    const { layers, updateLayer, saveToHistory } = get();
    const layer = layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isExpanding: true, isProcessing: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.expandImage(layer.src);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      console.error('Magic Expand failed', error);
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isExpanding: false, isProcessing: false });
    }
  },

  handleUpdateCanvasSize: (size) => {
    get().saveToHistory();
    set({ canvasSize: size });
  },

  handleApplyTemplate: (template) => {
    get().saveToHistory();
    set({
      layers: structuredClone(template.state.layers),
      canvasBackgroundColor: template.state.canvasBackgroundColor,
      canvasFilters: { ...template.state.canvasFilters },
      canvasSize: { ...template.state.canvasSize },
      selectedLayerIds: [],
    });
  },

  handleDrawingComplete: (pathData) => {
    const { artboards, activeArtboardId, addImageLayer, setPenMode } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (artboard) {
      addImageLayer(pathData, 'Drawing', 0, 0, artboard.width, artboard.height);
    } else {
      addImageLayer(pathData, 'Drawing');
    }
    setPenMode(false);
  },

  handleVectorDrawingComplete: (pathData, stroke) => {
    const { artboards, activeArtboardId, addShapeLayer, setPenMode } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (artboard) {
      addShapeLayer('path', {
        pathData,
        stroke,
        color: 'transparent',
        x: 0,
        y: 0,
        width: artboard.width,
        height: artboard.height,
      });
    } else {
      addShapeLayer('path', {
        pathData,
        stroke,
        color: 'transparent',
      });
    }
    setPenMode(false);
  },
});
