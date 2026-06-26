import { log } from '../../utils/log';

import { StateCreator } from 'zustand';
import { AspectRatio, GenerationQuality, ShapeLayer, ImageLayer, Layer, TextLayer } from '../../types';
import { vectorizerService, VectorizeOptions } from '../../services/vectorizerService';
import { aiModelsService } from '../../services/aiModelsService';
import { removeBackground } from '../../utils/imageProcessor';
import * as geminiService from '../../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_CORNER_RADIUS } from '../../constants';

export interface AISlice {
  prompt: string;
  aspectRatio: AspectRatio;
  quality: GenerationQuality;
  isGenerating: boolean;
  lastGeneratedImageUrl: string | null;

  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setQuality: (quality: GenerationQuality) => void;

  // Refactored Core AI Actions with redundancy
  generateImage: () => Promise<void>;
  vectorizeLayer: (id: string, options: VectorizeOptions) => Promise<void>;
  onRmBg: (id: string) => Promise<void>;
  onRemix: (id: string) => Promise<void>;
  onMagicExpand: (id: string) => Promise<void>;
  onEnhance: (id: string) => Promise<void>;
  onUpscale: (id: string) => Promise<void>;
  onRetouch: (id: string) => Promise<void>;
  suggestFontPairing: (textLayerId: string) => Promise<void>;
  generateAutoLayouts: () => Promise<void>;
  applyStyleFromImage: (base64Image: string) => Promise<void>;

  handleConvertToPath: (id: string) => void;
  handleUpdateCanvasSize: (size: any) => void;
  handleApplyTemplate: (template: any) => void;
  handleDrawingComplete: (pathData: string) => void;
  handleVectorDrawingComplete: (pathData: string, stroke: any) => void;

  // Vector editing operations
  handleBooleanOperation: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
  handleJoinPaths: () => void;
}

export const createAISlice: StateCreator<any, [], [], AISlice> = (set, get) => ({
  prompt: '',
  aspectRatio: AspectRatio.SQUARE,
  quality: 'standard',
  isGenerating: false,
  lastGeneratedImageUrl: null,

  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setQuality: (quality) => set({ quality }),

  generateImage: async () => {
    const { prompt, aspectRatio, quality, addImageLayer } = get();
    if (!prompt) {
      return;
    }

    set({ isGenerating: true });
    try {
      let imageUrl: string | undefined;

      // Primary: High-End Flux.1
      if (aiModelsService.isConfigured()) {
        try {
          imageUrl = await aiModelsService.generateFluxImage(prompt, aspectRatio);
        } catch (e) {
          log.warn('Flux failed, falling back to Gemini', { error: e });
        }
      }

      // Fallback: Gemini / Freepik
      if (!imageUrl) {
        imageUrl = await geminiService.generateImage(prompt, aspectRatio, quality);
      }

      if (imageUrl) {
        set({ lastGeneratedImageUrl: imageUrl });
        addImageLayer(imageUrl, `AI: ${prompt.slice(0, 20)}...`);
      }
    } catch (error) {
      log.error('All Generation methods failed', error, { prompt, aspectRatio, quality });
    } finally {
      set({ isGenerating: false });
    }
  },

  vectorizeLayer: async (id, options) => {
    const { artboards, activeArtboardId, deleteLayer, addLayers, saveToHistory, updateLayer } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isGenerating: true });
    updateLayer(id, { isProcessing: true });
    try {
      let result: string | undefined;

      // Primary: Recraft V3 Vector (Professional quality)
      if (aiModelsService.isConfigured()) {
        try {
          // We prompt the AI to reconstruct the image as a vector
          const prompt = `Convert this image perfectly into a vector: ${layer.name || 'graphic'}`;
          result = await aiModelsService.generateVectorRecraft(prompt);
        } catch (e) {
          log.warn('Recraft failed, falling back to local tracer', { error: e });
        }
      }

      saveToHistory();

      if (result && !result.startsWith('http')) {
        // Raw SVG from Recraft
        addLayers([
          {
            id: uuidv4(),
            type: 'path',
            name: 'AI Vector Path',
            pathData: result,
            color: '#000000',
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            rotation: layer.rotation,
            opacity: layer.opacity,
            visible: true,
            locked: false,
            cornerRadius: DEFAULT_CORNER_RADIUS,
            blendMode: 'normal',
          } as any,
        ]);
        deleteLayer(id);
      } else {
        // Fallback: Local ImageTracer
        const svgString = await vectorizerService.traceImage(layer.src, options);
        const pathElements = vectorizerService.extractPaths(svgString);

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
          cornerRadius: DEFAULT_CORNER_RADIUS,
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
            ...(layer.filters || {}),
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
      }
    } catch (e) {
      log.error('Vectorization failed', e, { layerId: id, options });
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  onRemix: async (id) => {
    const prompt = window.prompt('Enter a style or description to remix this image:');
    if (!prompt) {
      return;
    }

    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isGenerating: true });
    updateLayer(id, { isProcessing: true });
    try {
      let newSrc: string | undefined;

      // Primary: SDXL / Flux Edit
      if (aiModelsService.isConfigured()) {
        try {
          // Using generative fill with a full mask acts as a remix
          const fullWhiteMask =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
          newSrc = await aiModelsService.generativeFillSDXL(layer.src, fullWhiteMask, prompt);
        } catch (e) {
          log.warn('High-end remix failed, falling back to Gemini', { error: e });
        }
      }

      // Fallback: Gemini
      if (!newSrc) {
        newSrc = await geminiService.editImage(layer.src, prompt);
      }

      if (newSrc) {
        saveToHistory();
        updateLayer(id, { src: newSrc, isProcessing: false });
      }
    } catch (error) {
      log.error('Remix failed', error, { layerId: id, prompt });
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  onMagicExpand: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isGenerating: true });
    updateLayer(id, { isProcessing: true });
    try {
      let newSrc: string | undefined;

      // Primary: SDXL Outpainting (The industry standard for expansion)
      if (aiModelsService.isConfigured()) {
        try {
          const prompt = 'Extend the background naturally, maintaining style and lighting.';
          // SDXL Outpainting logic would go here, using generative fill service
          newSrc = await aiModelsService.generativeFillSDXL(layer.src, '', prompt);
        } catch (e) {
          log.warn('SDXL Expand failed, falling back to Gemini', { error: e });
        }
      }

      // Fallback: Gemini / Freepik
      if (!newSrc) {
        newSrc = await geminiService.expandImage(layer.src);
      }

      if (newSrc) {
        saveToHistory();
        updateLayer(id, { src: newSrc, isProcessing: false });
      }
    } catch (error) {
      log.error('Magic Expand failed', error, { layerId: id });
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  onRmBg: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isGenerating: true });
    updateLayer(id, { isProcessing: true });
    try {
      const result = await removeBackground(layer.src);
      saveToHistory();
      updateLayer(id, { src: result, isProcessing: false });
    } catch (e) {
      log.error('BG Removal failed', e, { layerId: id });
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  onEnhance: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isGenerating: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.enhanceImage(layer.src);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      log.error('Enhance failed', error, { layerId: id });
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  onUpscale: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isGenerating: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.upscaleImage(layer.src);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      log.error('Upscale failed', error, { layerId: id });
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  onRetouch: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }

    set({ isGenerating: true });
    updateLayer(id, { isProcessing: true });
    try {
      const newSrc = await geminiService.retouchImage(layer.src);
      saveToHistory();
      updateLayer(id, { src: newSrc, isProcessing: false });
    } catch (error) {
      log.error('Retouch failed', error, { layerId: id });
      updateLayer(id, { isProcessing: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  suggestFontPairing: async (textLayerId) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === textLayerId) as TextLayer;
    if (!layer || layer.type !== 'text') {
      return;
    }

    set({ isGenerating: true });
    try {
      const suggestedFont = await geminiService.suggestFontPairing(layer.fontFamily);
      if (suggestedFont && suggestedFont !== layer.fontFamily) {
        // We don't replace the current font, we might want to add a new text layer or just notify
        // For now, let's update the current one to show the result
        saveToHistory();
        updateLayer(textLayerId, { fontFamily: suggestedFont });
      }
    } catch (error) {
      log.error('Font pairing failed', error, { layerId: textLayerId });
    } finally {
      set({ isGenerating: false });
    }
  },

  generateAutoLayouts: async () => {
    const { artboards, activeArtboardId, updateLayers, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (!artboard || artboard.layers.length === 0) {
      return;
    }

    set({ isGenerating: true });
    try {
      const suggestions = await geminiService.generateAutoLayoutSuggestions(
        artboard.layers,
        artboard.width,
        artboard.height
      );
      if (suggestions && suggestions.length > 0) {
        // For simplicity, we apply the first one immediately.
        // In a real UI, we would show a carousel of options.
        saveToHistory();
        updateLayers(suggestions[0]);
      }
    } catch (error) {
      log.error('Auto-layout suggestion failed', error);
    } finally {
      set({ isGenerating: false });
    }
  },

  applyStyleFromImage: async (base64Image) => {
    const { setCanvasBackgroundColor, updateLayer, artboards, activeArtboardId, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (!artboard) {
      return;
    }

    set({ isGenerating: true });
    try {
      const theme = await geminiService.extractStyleFromImage(base64Image);
      if (theme) {
        saveToHistory();
        setCanvasBackgroundColor(theme.backgroundColor);

        // Map theme to layers
        artboard.layers.forEach((l: any) => {
          if (l.type === 'text') {
            updateLayer(l.id, {
              color: theme.primaryColor,
              fontFamily: (l as TextLayer).fontSize > 30 ? theme.headingFont : theme.bodyFont,
            });
          } else if (l.type !== 'image' && l.type !== 'adjustment') {
            updateLayer(l.id, { color: theme.secondaryColor });
          }
        });
      }
    } catch (error) {
      log.error('Style transfer failed', error);
    } finally {
      set({ isGenerating: false });
    }
  },

  handleConvertToPath: (_id) => {},
  handleUpdateCanvasSize: (size) => {
    get().saveToHistory();
    set({ canvasSize: size });
  },
  handleApplyTemplate: (template) => {
    get().saveToHistory();
    const currentArtboards = get().artboards;
    const activeId = get().activeArtboardId;
    const templateLayers = structuredClone(template.state.layers || []);
    const updatedArtboards = currentArtboards.map((a: any) =>
      a.id === activeId ? { ...a, layers: templateLayers } : a
    );
    set({
      artboards: updatedArtboards,
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
      addShapeLayer('path', { pathData, stroke, color: 'transparent' });
    }
    setPenMode(false);
  },

  handleBooleanOperation: (operation) => {
    const { artboards, activeArtboardId, selectedLayerIds, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (!artboard || selectedLayerIds.length < 2) return;
    saveToHistory();
    const layers = selectedLayerIds.map((id: string) => artboard.layers.find((l: any) => l.id === id)).filter(Boolean);
    if (layers.length < 2) return;
    const [base, ...operands] = layers;
    updateLayer(base.id, {
      pathData: (base as any).pathData || '',
      vectorPath: (base as any).vectorPath,
    } as any);
  },

  handleJoinPaths: () => {
    const { artboards, activeArtboardId, selectedLayerIds, updateLayer, deleteLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (!artboard || selectedLayerIds.length < 2) return;
    saveToHistory();
    const layers = selectedLayerIds.map((id: string) => artboard.layers.find((l: any) => l.id === id)).filter(Boolean);
    if (layers.length < 2) return;
    const [base, ...rest] = layers;
    const combinedPath = [base, ...rest].map((l: any) => l.pathData || '').join(' ');
    updateLayer(base.id, { pathData: combinedPath } as any);
    rest.forEach((l: any) => deleteLayer(l.id));
  },
});
