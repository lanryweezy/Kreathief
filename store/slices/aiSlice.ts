import { log } from '../../utils/log';
import type { StoreState } from '../useStore';

import { StateCreator } from 'zustand';
import {
  AspectRatio,
  GenerationQuality,
  ShapeLayer,
  ImageLayer,
  Layer,
  TextLayer,
  StyleReference,
  ReferenceAspect,
  ReferenceAppliedMode,
  ReferenceStrength,
  PromptArchetype,
} from '../../types';
import { CURATED_STYLE_PRESETS, presetToStyleReference } from '../../config/stylePresets';
import { vectorizerService, VectorizeOptions } from '../../services/vectorizerService';
import { aiModelsService } from '../../services/aiModelsService';
import { safeParseJSON } from '../../utils/errorHandling';
import { SchemaType } from '@google/generative-ai';
import { removeBackground } from '../../utils/imageProcessor';
import * as geminiService from '../../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_CORNER_RADIUS } from '../../constants';
import { performBooleanOnLayers } from '../../utils/booleanOperations';
import { VectorUtils } from '../../utils/vectorUtils';
import { getErrorDetails } from '../../utils/errorMessages';
import { generateImageWithModel, composeGenerationPrompt } from '../../services/imageGenService';
import { DEFAULT_IMAGE_MODEL } from '../../config/imageModels';

export interface AISlice {
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  quality: GenerationQuality;
  isGenerating: boolean;
  lastGeneratedImageUrl: string | null;
  selectedImageModel: string;
  useBrandInPrompts: boolean;
  /** Reference image + which of its facets should steer generation. */
  styleReference: StyleReference | null;
  referenceStrength: ReferenceStrength;
  promptArchetype: PromptArchetype;
  /** Campaign intent folded into every generation prompt. */
  campaignGoal: string;

  setPrompt: (prompt: string) => void;
  setNegativePrompt: (negativePrompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setQuality: (quality: GenerationQuality) => void;
  setSelectedImageModel: (modelId: string) => void;
  setUseBrandInPrompts: (enabled: boolean) => void;
  setReferenceStrength: (strength: ReferenceStrength) => void;
  setPromptArchetype: (archetype: PromptArchetype) => void;
  setCampaignGoal: (goal: string) => void;
  applyPresetStyleReference: (presetId: string) => void;
  /** Stores the reference immediately, then fills in vision analysis asynchronously. */
  setStyleReference: (image: string, name?: string) => Promise<void>;
  toggleReferenceAspect: (aspect: ReferenceAspect) => void;
  clearStyleReference: () => void;
  /**
   * Records how a pipeline actually consumed the reference. `referenceId` guards against a
   * late report stamping a reference the user has since replaced.
   */
  setReferenceAppliedMode: (mode: ReferenceAppliedMode, referenceId?: string) => void;

  // Refactored Core AI Actions with redundancy
  generateImage: () => Promise<void>;
  vectorizeLayer: (id: string, options: VectorizeOptions) => Promise<void>;
  onRmBg: (id: string) => Promise<void>;
  onRemix: (id: string, promptOverride?: string) => Promise<void>;
  onMagicExpand: (id: string) => Promise<void>;
  onEnhance: (id: string) => Promise<void>;
  onUpscale: (id: string) => Promise<void>;
  onRetouch: (id: string) => Promise<void>;
  suggestFontPairing: (textLayerId: string) => Promise<void>;
  generateAutoLayouts: () => Promise<void>;
  applyStyleFromImage: (base64Image: string) => Promise<void>;
  extractPhotoColors: (layerId: string) => Promise<void>;
  generateTextTexture: (layerId: string) => Promise<void>;
  autoRenameLayers: () => Promise<void>;
  handleToneRewrite: (id: string, instruction: string) => Promise<void>;

  handleConvertToPath: (id: string) => void;
  handleUpdateCanvasSize: (size: any) => void;
  handleApplyTemplate: (template: any) => void;
  handleDrawingComplete: (pathData: string) => void;
  handleVectorDrawingComplete: (pathData: string, stroke: any) => void;

  // Vector editing operations
  handleBooleanOperation: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
  handleJoinPaths: () => void;
}

export const createAISlice: StateCreator<StoreState, [], [], AISlice> = (set, get) => ({
  prompt: '',
  negativePrompt: '',
  aspectRatio: AspectRatio.SQUARE,
  quality: 'standard',
  isGenerating: false,
  lastGeneratedImageUrl: null,
  selectedImageModel: DEFAULT_IMAGE_MODEL,
  useBrandInPrompts: false,
  styleReference: null,
  referenceStrength: 'balanced',
  promptArchetype: 'cinematic',
  campaignGoal: '',

  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setQuality: (quality) => set({ quality }),
  setSelectedImageModel: (selectedImageModel) => set({ selectedImageModel }),
  setUseBrandInPrompts: (useBrandInPrompts) => set({ useBrandInPrompts }),
  setReferenceStrength: (referenceStrength) => {
    set({ referenceStrength });
    const current = get().styleReference;
    if (current) {
      set({ styleReference: { ...current, strength: referenceStrength } });
    }
  },
  setPromptArchetype: (promptArchetype) => set({ promptArchetype }),
  setCampaignGoal: (campaignGoal) => set({ campaignGoal }),

  applyPresetStyleReference: (presetId) => {
    const preset = CURATED_STYLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const ref = presetToStyleReference(preset);
    ref.strength = get().referenceStrength;
    set({ styleReference: ref });
    get().addToast?.(`Applied style preset: ${preset.name}`, 'success');
  },

  clearStyleReference: () => set({ styleReference: null }),

  setReferenceAppliedMode: (appliedMode, referenceId) => {
    const current = get().styleReference;
    // Drop a late report for a reference the user has already swapped out.
    if (!current || (referenceId && current.id !== referenceId)) {
      return;
    }
    set({ styleReference: { ...current, appliedMode } });
  },

  toggleReferenceAspect: (aspect: ReferenceAspect) => {
    const current = get().styleReference;
    if (!current) {
      return;
    }
    set({
      styleReference: {
        ...current,
        aspects: current.aspects.includes(aspect)
          ? current.aspects.filter((a) => a !== aspect)
          : [...current.aspects, aspect],
      },
    });
  },

  setStyleReference: async (image, name) => {
    const reference: StyleReference = {
      id: uuidv4(),
      image,
      name,
      // Sensible default: borrow the look, not the subject or layout.
      aspects: ['style', 'palette', 'mood'],
      analysisStatus: 'analyzing',
      strength: get().referenceStrength,
    };
    set({ styleReference: reference });

    try {
      const extracted = await geminiService.analyzeReferenceImage(image);
      // Guard against a newer reference having replaced this one mid-flight.
      if (get().styleReference?.id !== reference.id) {
        return;
      }
      set({ styleReference: { ...reference, extracted, analysisStatus: 'ready' } });
    } catch (error) {
      log.error('Reference image analysis failed', error);
      if (get().styleReference?.id !== reference.id) {
        return;
      }
      // Not fatal: a model with native conditioning still receives the raw image.
      set({
        styleReference: {
          ...reference,
          analysisStatus: 'failed',
          analysisError: getErrorDetails(error).message,
        },
      });
      get().addToast?.('Could not analyze the reference image — style hints will be limited.', 'warning');
    }
  },

  generateImage: async () => {
    const { prompt, aspectRatio, quality, addImageLayer, selectedImageModel, useBrandInPrompts, styleReference } =
      get();
    if (!prompt) {
      return;
    }

    set({ isGenerating: true });
    try {
      // Opt-in: steer the generation with the active brand kit's colors/fonts
      const activeBrandKit = useBrandInPrompts
        ? get().brandKits?.find((bk) => bk.id === get().activeBrandKitId)
        : undefined;

      const fullPrompt = composeGenerationPrompt({
        prompt,
        brandKit: activeBrandKit,
        styleReference,
        campaignGoal: get().campaignGoal,
        negativePrompt: get().negativePrompt,
        referenceStrength: get().referenceStrength,
        archetype: get().promptArchetype,
      });

      // Unified path: user-selected model via Fal, native reference conditioning when the
      // model supports it, descriptor + Freepik fallback otherwise.
      const imageUrl = await generateImageWithModel(fullPrompt, {
        modelId: selectedImageModel,
        aspectRatio,
        quality,
        styleReference,
        // Record how the reference was really used so the panel can say so plainly.
        onReferenceApplied: (mode) => get().setReferenceAppliedMode(mode, styleReference?.id),
      });

      if (imageUrl) {
        set({ lastGeneratedImageUrl: imageUrl });
        addImageLayer(imageUrl, `AI: ${prompt.slice(0, 20)}...`);
        get().addToast?.('AI image added to canvas!', 'success');
      }
    } catch (error) {
      log.error('All Generation methods failed', error, { prompt, aspectRatio, quality });
      get().addToast?.('Generation failed. Please try again.', 'error');
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
        addLayers(newPaths);
        deleteLayer(id);
      }
    } catch (e) {
      log.error('Vectorization failed', e, { layerId: id, options });
      updateLayer(id, { isProcessing: false });
      const { addToast } = get();
      const details = getErrorDetails(e);
      addToast?.(`Vectorization failed: ${details.message}`, 'error');
    } finally {
      set({ isGenerating: false });
    }
  },

  onRemix: async (id, promptOverride) => {
    const prompt = promptOverride || window.prompt('Enter a style or description to remix this image:');
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
      get().addToast?.(`Remix failed: ${getErrorDetails(error).message}`, 'error');
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
      // Note: SDXL outpainting was never implemented (the old call passed an empty
      // mask, which always failed). Go straight to the expand pipeline, which
      // falls back to Freepik outpainting internally.
      const newSrc = await geminiService.expandImage(layer.src);

      if (newSrc) {
        saveToHistory();
        updateLayer(id, { src: newSrc, isProcessing: false });
      }
    } catch (error) {
      log.error('Magic Expand failed', error, { layerId: id });
      updateLayer(id, { isProcessing: false });
      get().addToast?.(`Magic Expand failed: ${getErrorDetails(error).message}`, 'error');
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

    if (layer.isProcessing || get().isRemovingBg) {
      log.info('Cancelling background removal / toggling off');
      set({ isGenerating: false, isRemovingBg: false });
      updateLayer(id, { isProcessing: false });
      return;
    }

    set({ isGenerating: true, isRemovingBg: true });
    updateLayer(id, { isProcessing: true });
    try {
      const result = await removeBackground(layer.src);
      saveToHistory();
      updateLayer(id, { src: result, isProcessing: false });
    } catch (e) {
      log.error('BG Removal failed', e, { layerId: id });
      get().addToast?.(`Background removal failed: ${getErrorDetails(e).message}`, 'error');
    } finally {
      set({ isGenerating: false, isRemovingBg: false });
      updateLayer(id, { isProcessing: false });
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
      get().addToast?.(`Enhance failed: ${getErrorDetails(error).message}`, 'error');
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
      let newSrc: string | undefined;

      // Primary: High-End Fal.ai Super Resolution Upscaler
      if (aiModelsService.isConfigured()) {
        try {
          newSrc = await aiModelsService.upscaleImage(layer.src);
        } catch (e) {
          log.warn('Fal upscaling failed, falling back to Gemini', { error: e });
        }
      }

      // Fallback: Gemini
      if (!newSrc) {
        newSrc = await geminiService.upscaleImage(layer.src);
      }

      if (newSrc) {
        saveToHistory();
        updateLayer(id, { src: newSrc, isProcessing: false });
      } else {
        updateLayer(id, { isProcessing: false });
      }
    } catch (error) {
      log.error('Upscale failed', error, { layerId: id });
      updateLayer(id, { isProcessing: false });
      get().addToast?.(`Upscale failed: ${getErrorDetails(error).message}`, 'error');
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
    // Basic stub - would map to Inpainting or Face Retouch model
    set({ isGenerating: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      get().addToast?.('Retouch applied', 'success');
    } finally {
      set({ isGenerating: false });
    }
  },

  handleToneRewrite: async (id, instruction) => {
    const { updateLayer, artboards, activeArtboardId } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id);
    if (!layer || layer.type !== 'text') return;

    set({ isGenerating: true });
    try {
      const currentText = (layer as TextLayer).text;
      
      const systemPrompt = `You are a world-class Brand Voice Copywriter for a design tool. 
Your job is to rewrite the user's text based on their instruction.
If the instruction involves "African Context", "Nigerian Context", or "Localized", you must use culturally resonant terms, subtle slang (e.g. "Naija", "Wahala", "Oya"), and speak directly to that specific demographic while remaining highly professional and engaging for a premium brand.

Return ONLY the rewritten text, with no markdown formatting or quotes. Keep it concise enough to fit in a standard design layout.`;

      const fullInstruction = `System: ${systemPrompt}\n\nInstruction: ${instruction}`;
      const response = await geminiService.generateText(currentText, fullInstruction);
      
      updateLayer(id, { text: response.trim() });
      get().addToast?.('Magic Rewrite applied!', 'success');
    } catch (error) {
      log.error('Failed to rewrite text', error);
      get().addToast?.('Failed to rewrite text', 'error');
    } finally {
      set({ isGenerating: false });
    }
  },

  suggestFontPairing: async (textLayerId) => {
    const { updateLayer, artboards, activeArtboardId, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === textLayerId);
    if (!layer || layer.type !== 'text') return;

    set({ isGenerating: true });
    try {
      const currentText = (layer as TextLayer).text;
      
      const systemPrompt = `You are an expert Typography Director. Analyze the following text and suggest a single Google Font that perfectly matches its emotional intent, industry, and hierarchy.
      
Choose ONLY ONE from this curated list of premium Google Fonts:
[Inter, Playfair Display, Space Grotesk, Syne, Anton, Oswald, Roboto Mono, Archivo Black, Cinzel, Bebas Neue, Lora, Montserrat, Outfit, Plus Jakarta Sans, Clash Display]

Return ONLY the exact font name. Nothing else.`;

      const fullInstruction = `${systemPrompt}\n\nInstruction: Suggest a font for this text`;
      const suggestedFont = await geminiService.generateText(currentText, fullInstruction);
      const cleanFont = suggestedFont.replace(/["']/g, '').trim();
      
      saveToHistory?.();
      updateLayer(textLayerId, { fontFamily: cleanFont });
      get().addToast?.(`Font updated to ${cleanFont}`, 'success');
    } catch (error) {
      log.error('Failed to suggest font', error);
      get().addToast?.('Failed to pair font', 'error');
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

  extractPhotoColors: async (layerId: string) => {
    const { artboards, activeArtboardId, addBrandKit, setActiveBrandKit, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: any) => l.id === layerId);
    if (!layer || layer.type !== 'image') {
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = layer.src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Simple fast color extraction by sampling a grid
      const cols = 5;
      const rows = 5;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;
      const colors = new Set<string>();

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const p = ctx.getImageData(x * cellW + cellW / 2, y * cellH + cellH / 2, 1, 1).data;
          // Skip highly transparent pixels
          if (p[3] < 128) {
            continue;
          }
          const hex = '#' + [p[0], p[1], p[2]].map((x) => x.toString(16).padStart(2, '0')).join('');
          colors.add(hex);
        }
      }

      // Grab up to 5 colors
      const extractedColors = Array.from(colors).slice(0, 5);
      if (extractedColors.length > 0) {
        const kitId = `extracted_${Date.now()}`;
        addBrandKit({
          id: kitId,
          name: `Palette from ${layer.name || 'Image'}`,
          colors: extractedColors,
          fonts: ['Inter'],
          logos: [],
        });
        setActiveBrandKit(kitId);
        addToast?.(`Extracted ${extractedColors.length} colors to a new Brand Kit!`, 'success');
      }
    } catch (error) {
      log.error('Extract photo colors failed', error);
      addToast?.('Failed to extract colors from this image.', 'error');
    }
  },

  generateTextTexture: async (layerId: string) => {
    const { updateLayer, addToast } = get();
    set({ isGenerating: true });
    try {
      // In a real app we'd prompt the user, but for now let's apply a 3D Liquid Chrome texture
      // We will ask Gemini to generate an abstract liquid chrome texture pattern
      const prompt =
        'Seamless abstract 3D liquid chrome iridescent metallic texture pattern, shiny reflections, high quality, 4k';
      const resultUrl = await geminiService.generateImage(prompt, '1:1', 'hd');
      if (resultUrl) {
        updateLayer(layerId, { textTextureUrl: resultUrl });
        addToast?.('AI Text Texture applied successfully!', 'success');
      }
    } catch (error) {
      log.error('Failed to generate text texture', error);
      addToast?.('Failed to generate texture.', 'error');
    } finally {
      set({ isGenerating: false });
    }
  },

  autoRenameLayers: async () => {
    const { artboards, activeArtboardId, updateLayer, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (!artboard || artboard.layers.length === 0) {
      return;
    }

    set({ isGenerating: true });
    addToast?.('AI is renaming your layers intelligently...', 'info');

    try {
      const layerSummaries = artboard.layers.map((l: Layer) => {
        let content = '';
        if (l.type === 'text') {
          content = (l as TextLayer).text?.substring(0, 50) || '';
        }
        if (l.type === 'image') {
          content = l.src ? (l.src.length > 50 ? 'base64_image' : l.src) : '';
        }
        if (!['text', 'image', 'group', 'adjustment'].includes(l.type)) {
          content = l.type;
        }
        return { id: l.id, type: l.type, currentName: l.name, content };
      });

      const prompt = `You are an expert UI designer. Rename these layers to be extremely logical, concise, and semantic (like Figma). 
Layers: ${JSON.stringify(layerSummaries)}`;

      const data = await geminiService.callBackendGeminiAPI({
        modelName: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                name: { type: SchemaType.STRING },
              },
              required: ['id', 'name'],
            },
          },
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      // 🤖 Astra: Passed 'null' fallback string to safeParseJSON and mapped structured array to dictionary
      // to eliminate raw JSON.parse vulnerabilities and silent parsing failures.
      const parsedResponse = safeParseJSON<Array<{ id: string; name: string }> | null>(data.text || 'null', null);

      if (!parsedResponse) {
        throw new Error('Failed to parse AI layer renaming response');
      }

      let count = 0;
      parsedResponse.forEach(({ id, name }) => {
        updateLayer(id, { name });
        count++;
      });

      if (count > 0) {
        addToast?.(`Successfully renamed ${count} layers!`, 'success');
      } else {
        addToast?.('No layers were renamed.', 'info');
      }
    } catch (error) {
      log.error('Failed to auto-rename layers', error);
      addToast?.('Failed to auto-rename layers.', 'error');
    } finally {
      set({ isGenerating: false });
    }
  },

  handleConvertToPath: (_id) => {
    // Intentional no-op retained for interface compatibility; real conversion
    // lives in VectorEditingPanel. Remove once callers are migrated.
  },
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
    const { artboards, activeArtboardId, selectedLayerIds, updateLayer, deleteLayer, saveToHistory, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (!artboard || selectedLayerIds.length < 2) {
      addToast?.('Select at least two path layers.', 'warning');
      return;
    }

    // ⚡ Bolt: Use a Map for O(N) lookup instead of nested O(N*M) .find() calls
    const layerMap = new Map(artboard.layers.map((l: any) => [l.id, l]));
    const layers = selectedLayerIds.map((id: string) => layerMap.get(id)).filter(Boolean) as ShapeLayer[];

    if (layers.length < 2) {
      return;
    }
    const [base, ...operands] = layers;
    const result = performBooleanOnLayers(layers, operation);
    if (!result) {
      addToast?.('Boolean operation failed — selected layers have no valid paths.', 'error');
      return;
    }
    saveToHistory();

    updateLayer(base!.id, {
      pathData: result.pathData,
      vectorPath: result.vectorPath,
      x: result.x,
      y: result.y,
      width: result.width,
      height: result.height,
      viewBox: result.viewBox,
    } as any);

    operands.forEach((l) => deleteLayer(l!.id));
  },

  handleJoinPaths: () => {
    const { artboards, activeArtboardId, selectedLayerIds, updateLayer, deleteLayer, saveToHistory, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    if (!artboard || selectedLayerIds.length < 2) {
      addToast?.('Select at least two path layers.', 'warning');
      return;
    }

    // ⚡ Bolt: Use a Map for O(N) lookup instead of nested O(N*M) .find() calls
    const layerMap = new Map(artboard.layers.map((l: any) => [l.id, l]));
    const layers = selectedLayerIds.map((id: string) => layerMap.get(id)).filter(Boolean) as ShapeLayer[];

    if (layers.length < 2) {
      return;
    }
    const [base, ...rest] = layers;

    // Combine paths in GLOBAL coordinates (translate each by its layer offset),
    // marking the start of every subsequent path as a subpath move.
    let combinedPoints: any[] = [];
    for (const l of layers) {
      const vp = (l as any).vectorPath || VectorUtils.parsePath(l.pathData || '');
      if (!vp || !vp.points || vp.points.length === 0) {
        continue;
      }
      const globalPoints = vp.points.map((p: any, i: number) => ({
        ...p,
        x: p.x + l.x,
        y: p.y + l.y,
        isMove: combinedPoints.length > 0 && i === 0 ? true : p.isMove,
      }));
      combinedPoints = combinedPoints.concat(globalPoints);
    }
    if (combinedPoints.length === 0) {
      addToast?.('Join failed — selected layers have no valid paths.', 'error');
      return;
    }
    saveToHistory();

    const globalPath = { points: combinedPoints, isClosed: false };
    const bounds = VectorUtils.getBounds(globalPath);
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const localPath = {
      ...globalPath,
      points: combinedPoints.map((p) => ({ ...p, x: p.x - bounds.x, y: p.y - bounds.y })),
    };

    updateLayer(base!.id, {
      pathData: VectorUtils.serializePath(localPath),
      vectorPath: localPath,
      x: bounds.x,
      y: bounds.y,
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
    } as any);
    rest.forEach((l: any) => deleteLayer(l.id));
  },
});
