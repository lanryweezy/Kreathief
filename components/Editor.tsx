interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from './ErrorBoundary';
import { SidePanel } from './SidePanel';
import { MobileNavBar } from './MobileNavBar';
import { BottomSheet } from './BottomSheet';
import { Canvas } from './Canvas';
import { AIAssistant } from './AIAssistant';
import { AppMode, AspectRatio, GeneratedImage, NavTab, TextLayer, ShapeLayer, ImageLayer, Layer, HistoryState, CanvasFilters, Project, DesignTheme, BrandKit, CanvasSize, GenerationQuality, User, BrushType, AnimationSettings, VectorPath, VectorPoint } from '../types';
import * as geminiService from '../services/geminiService';
import * as photoService from '../services/photoService';
import * as exportService from '../services/exportService';
import * as psdService from '../services/psdService';
import { storageService } from '../services/storageService';
import { shareService } from '../services/shareService';
import { MODEL_FAST, Icons, FONT_FAMILIES, CANVAS_W, CANVAS_H, DEFAULT_FILTERS as CONST_DEFAULT_FILTERS } from '../constants';
import { vectorizerService } from '../services/vectorizerService';
import { STARTER_TEMPLATES } from '../data/templates';
import { ShareModal } from './modals/ShareModal';
import { ExportModal } from './modals/ExportModal';
import { Toolbar } from './Toolbar';
import { ShortcutOverlay } from './ShortcutOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { loadFont, loadFonts, registerCustomFont, getAllAvailableFonts } from '../services/FontLoader';
import { BooleanOperations } from '../utils/booleanOperations';
import { VectorUtils } from '../utils/vectorUtils';
import { PathEditorOverlay } from './VectorEditor/PathEditorOverlay';
import { v4 as uuidv4 } from 'uuid';

const PADDING = 20;

const DEFAULT_FILTERS: CanvasFilters = {
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

interface EditorProps {
  initialProject?: Project;
  onBack: () => void;
  user: User;
  onRestartTour?: () => void;
}

export const Editor: React.FC<EditorProps> = ({ initialProject, onBack, user, onRestartTour }) => {
  // Data State
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploads, setUploads] = useState<string[]>([]);
  const {
    layers, selectedLayerIds, canvasSize, canvasBackgroundColor, canvasFilters,
    past, future,
    activeTab, setActiveTab,
    mode, setMode,
    prompt, setPrompt,
    aspectRatio, setAspectRatio,
    quality, setQuality,
    isProcessing, setIsProcessing,
    isExporting, setIsExporting,
    isShapeBuilderActive, setIsShapeBuilderActive,
    isPenMode, setPenMode,
    brushColor, setBrushColor,
    brushSize, setBrushSize,
    brushOpacity, setBrushOpacity,
    brushType, setBrushType,
    zoom, setZoom,
    showGrid, setShowGrid,
    showRulers, setShowRulers,
    showShortcuts, setShowShortcuts,
    addLayer, updateLayer, updateLayers, setLayers,
    selectLayer, setSelectedLayerIds, multiSelectLayer,
    setCanvasSize, setCanvasBackgroundColor, setCanvasFilters,
    undo, redo, saveToHistory, initializeProject,
    projects,
    addLayers,
    addTextLayer,
    addShapeLayer,
    addImageLayer,
    copyLayer,
    pasteLayer,
    duplicateLayer,
    duplicateSelected,
    deleteLayer,
    deleteSelected,
    groupSelected,
    ungroupSelected,
    moveLayer,
    nudgeLayer,
    alignLayers,
    distributeLayers,
    layoutLayers,
    vectorizeLayer,
    onRmBg,
    handleFileUpload,
    createProject,
    deleteProject,
    loadProject,
    handleNew,
    applyBrandColors,
    handleConvertToPath,
    handleDrawingComplete,
    handleApplyTemplate,
    layoutLayers: handleApplyLayout,
    addBrandKit: handleAddBrandKit,
    deleteBrandKit: handleDeleteBrandKit,
    updateBrandKit: handleUpdateBrandKit,
    applyBrandFonts: handleApplyBrandFonts,
    deleteUpload: handleDeleteUpload,
    saveProject,
    projectId, setProjectId,
    projectTitle, setProjectTitle,
    isSaving, setIsSaving,
    textLayers,
    shapeLayers,
    imageLayers,
    showShareModal,
    setShowShareModal,
    showGoldenRatio,
    setShowGoldenRatio,
    editingPathId,
    setEditingPathId,
    onUpdatePath,
    isCropMode,
    setIsCropMode,
    onCrop,
    applyCrop,
    cancelCrop,
    cropArea,
    setCropArea
  } = useStore();

  const selectedLayerId = selectedLayerIds.length > 0 ? selectedLayerIds[selectedLayerIds.length - 1] : null;

  // AI Features State
  const [showAIAssistant, setShowAIAssistant] = useState(false);


  // Project Management State - Local to Editor for saving
  const [thumbnail, setThumbnail] = useState<string | undefined>(initialProject?.thumbnail);

  // Brand Kits State
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);

  // Drawing State is now in useStore
  const drawingCancelRef = useRef(false);

  // Clipboard State for copy/paste
  const [clipboardLayer, setClipboardLayer] = useState<any>(null);

  const [isEraserActive, setIsEraserActive] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportQuality, setExportQuality] = useState(0.95);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  // Derived State
  const activeImage = history.find(img => img.id === activeImageId) || null;

  // Initialize from project prop
  useEffect(() => {
    if (initialProject && initialProject.id !== projectId) {
      setProjectId(initialProject.id);
      setProjectTitle(initialProject.name);
      if (initialProject.thumbnail) setThumbnail(initialProject.thumbnail);

      // Initialize Store
      initializeProject(initialProject);
    }
  }, [initialProject, projectId, initializeProject]);

  // Load fonts used in text layers - optimized to avoid excessive checks
  const lastFontsRef = useRef<string>('');
  useEffect(() => {
    const textLayers = layers.filter(l => l.type === 'text') as TextLayer[];
    const uniqueFonts = Array.from(new Set(textLayers.map(l => l.fontFamily))).sort();
    const fontsKey = uniqueFonts.join(',');
    if (fontsKey !== lastFontsRef.current && uniqueFonts.length > 0) {
      lastFontsRef.current = fontsKey;
      lastFontsRef.current = fontsKey;
      loadFonts(uniqueFonts);
    }
  }, [layers]);

  // Golden Ratio Toggle Listener
  useEffect(() => {
    const handleToggleGoldenRatio = () => setShowGoldenRatio(!showGoldenRatio);
    window.addEventListener('editor-toggle-golden-ratio', handleToggleGoldenRatio);
    return () => window.removeEventListener('editor-toggle-golden-ratio', handleToggleGoldenRatio);
  }, [showGoldenRatio, setShowGoldenRatio]);

  // -- Auto-Save & Crash Recovery --

  // 1. Recover on mount
  useEffect(() => {
    const recoverSession = async () => {
      const savedState = await storageService.getSetting('kreathief_autosave_v1', null);
      if (savedState && !initialProject) {
        try {
          const parsed = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
          if (parsed.layers?.length > 0) {
            setLayers(parsed.layers);
            if (parsed.canvasBackgroundColor) setCanvasBackgroundColor(parsed.canvasBackgroundColor);
            if (parsed.canvasFilters) setCanvasFilters(parsed.canvasFilters);
            if (parsed.canvasSize) setCanvasSize(parsed.canvasSize);
            if (parsed.projectTitle) setProjectTitle(parsed.projectTitle);
          }
        } catch (e) {
          console.error("Failed to recover session", e);
        }
      }
    };
    recoverSession();
  }, [initialProject, setLayers, setCanvasBackgroundColor, setCanvasFilters, setCanvasSize]);

  // Silent Autosave Logic
  useEffect(() => {
    if (layers.length === 0) return;

    const timer = setTimeout(() => {
      saveProject();
    }, 10000);

    return () => clearTimeout(timer);
  }, [layers, canvasBackgroundColor, canvasFilters, canvasSize, projectTitle, saveProject]);

  // Extract Document Colors
  const documentColors = useMemo(() => {
    const colors = new Set<string>();
    colors.add(canvasBackgroundColor);
    layers.forEach(l => {
      if ('color' in l) colors.add((l as any).color);
      if ('stroke' in l && (l as any).stroke) colors.add((l as any).stroke.color);
      if ('shadow' in l && (l as any).shadow) colors.add((l as any).shadow.color);
    });
    brandKits.forEach(kit => kit.colors.forEach(c => colors.add(c)));
    return Array.from(colors);
  }, [layers, canvasBackgroundColor, brandKits]);

  // Helper to find which layer array a given ID belongs to
  const findLayerType = useCallback((id: string): 'text' | 'shape' | 'image' | null => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return null;
    return layer.type === 'text' ? 'text' : layer.type === 'image' ? 'image' : 'shape';
  }, [layers]);

  // -- Persistence --
  useEffect(() => {
    const loadPersistentData = async () => {
      try {
        const savedKits = await storageService.getSetting('kreathief_brandkits', []);
        setBrandKits(savedKits);
        const savedUploads = await storageService.getSetting('kreathief_uploads', []);
        setUploads(savedUploads);
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    };
    loadPersistentData();
  }, []);

  useEffect(() => {
    try {
      storageService.setSetting('kreathief_brandkits', brandKits);
    } catch (e) { console.error(e); }
  }, [brandKits]);

  useEffect(() => {
    try {
      storageService.setSetting('kreathief_uploads', uploads);
    } catch (e) { console.error(e); }
  }, [uploads]);

  const [showSavedToast, setShowSavedToast] = useState(false);

  // -- Layer Management Helpers --

  // (Removed redundant local saveProject as it is now in useStore)

  const handleRemix = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId && l.type === 'image') as ImageLayer | undefined;
    if (layer) { setUploadedImage(layer.src); setMode(AppMode.EDIT); setActiveTab(NavTab.MAGIC); setPrompt(''); }
  };

  const handleExportDataUrl = async (): Promise<string> => {
    const backgroundImageUrl = activeImage?.url || uploadedImage;
    return await exportService.exportDesignToImage(
      canvasSize.width,
      canvasSize.height,
      canvasBackgroundColor,
      backgroundImageUrl,
      layers,
      canvasFilters
    );
  }

  const handleApplyCrop = async (id: string, cropArea: { x: number; y: number; width: number; height: number }) => {
    // This is now handled by the store's applyCrop, but we'll keep the signature for compatibility if needed
    // or just call the store's applyCrop.
    // Actually, the new plan is to use the store's applyCrop which already has the state.
    await applyCrop();
  };

  const handleCrop = (id: string) => {
    onCrop(id);
  };

  const handleAddLogoToCanvas = (url: string) => {
    addImageLayer(url, 'Logo');
  };

  const handleDoubleClickLayer = (layer: Layer) => {
    if (layer.type === 'text') {
      window.dispatchEvent(new CustomEvent('editor-edit-text', { detail: { layerId: layer.id } }));
    }
  };

  const handleRemoveBackground = async (id: string) => {
    const layer = layers.find(l => l.id === id && l.type === 'image') as ImageLayer;
    if (!layer) return;
    setIsProcessing(true);
    try {
      const newSrc = await geminiService.removeBackground(layer.src);
      updateLayer(id, { src: newSrc });
    } catch (e) {
      console.error(e);
      alert("Background removal failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpscale = async (id: string) => {
    const layer = layers.find(l => l.id === id && l.type === 'image') as ImageLayer;
    if (!layer) return;
    setIsProcessing(true);
    try {
      const newSrc = await geminiService.upscaleImage(layer.src);
      updateLayer(id, { src: newSrc });
    } catch (e) {
      console.error(e);
      alert("Upscaling failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhance = async (id: string) => {
    const layer = layers.find(l => l.id === id && l.type === 'image') as ImageLayer;
    if (!layer) return;
    setIsProcessing(true);
    try {
      // Use algorithmic enhancement first (faster, free)
      const newSrc = await photoService.algorithmicEnhance(layer.src);
      updateLayer(id, { src: newSrc });
    } catch (e) {
      console.error(e);
      alert("Enhancement failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetouch = async (id: string) => {
    const layer = layers.find(l => l.id === id && l.type === 'image') as ImageLayer;
    if (!layer) return;
    setIsProcessing(true);
    try {
      const newSrc = await geminiService.retouchImage(layer.src);
      updateLayer(id, { src: newSrc });
    } catch (e) {
      console.error(e);
      alert("Retouching failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleEraser = () => {
    if (isEraserActive) { drawingCancelRef.current = true; setIsEraserActive(false); setPenMode(false); }
    else {
      if (!selectedLayerId || !layers.find(l => l.id === selectedLayerId && l.type === 'image')) { alert("Please select an image layer first."); return; }
      drawingCancelRef.current = false; setIsEraserActive(true); setPenMode(true); setBrushColor('rgba(255, 0, 0, 0.5)'); setBrushSize(20); setBrushOpacity(0.5);
    }
  };

  const handleEraserComplete = async (maskDataUrl: string) => {
    if (drawingCancelRef.current) { drawingCancelRef.current = false; return; }
    const layer = layers.find(l => l.id === selectedLayerId && l.type === 'image') as ImageLayer | undefined;
    if (!layer) return;
    setIsProcessing(true); setIsEraserActive(false); setPenMode(false);
    try {
      const canvas = document.createElement('canvas'); canvas.width = layer.width; canvas.height = layer.height;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error("Context failed");
      const img = new Image(); img.src = layer.src; await new Promise(r => img.onload = r);
      const mask = new Image(); mask.src = maskDataUrl; await new Promise(r => mask.onload = r);
      ctx.drawImage(img, 0, 0, layer.width, layer.height);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(mask, 0, 0, layer.width, layer.height);
      const compositeData = canvas.toDataURL('image/png');
      const newSrc = await geminiService.editImage(compositeData, "Fill in the transparent deleted areas to match the background seamlessly.");
      updateLayer(layer.id, { src: newSrc } as Partial<ImageLayer>);
    } catch (e) { console.error(e); alert("Magic Eraser failed."); } finally { setIsProcessing(false); }
  };

  const handleFileUploads = (files: File[]) => {
    const readers: Promise<string>[] = [];

    Array.from(files).forEach(file => {
      readers.push(new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) resolve(e.target.result as string);
          else resolve('');
        };
        reader.readAsDataURL(file);
      }));
    });

    Promise.all(readers).then(urls => {
      const validUrls = urls.filter(u => u);
      if (validUrls.length > 0) {
        // Add to uploads gallery
        setUploads(prev => {
          const combined = [...validUrls, ...prev];
          // Deduplicate
          const unique = Array.from(new Set(combined));
          return unique.slice(0, 20);
        });

        addLayers(validUrls.map(url => ({
          id: `img_${Date.now()}_${Math.random()}`,
          type: 'image',
          name: 'Image',
          src: url,
          x: canvasSize.width / 2 - 100,
          y: canvasSize.height / 2 - 100,
          width: 200,
          height: 200,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          filters: { ...DEFAULT_FILTERS }
        } as ImageLayer)));
        setCanvasFilters(DEFAULT_FILTERS);
        if (activeTab === NavTab.MAGIC) { setMode(AppMode.EDIT); }
      }
    });
  };


  // -- Keyboard Shortcuts --
  const shortcuts = useMemo(() => [
    { key: 'z', ctrl: true, action: undo, description: 'Undo' },
    { key: 'y', ctrl: true, action: redo, description: 'Redo' },
    { key: 'z', ctrl: true, shift: true, action: redo, description: 'Redo' },
    { key: 'c', ctrl: true, action: () => selectedLayerId && copyLayer(selectedLayerId), description: 'Copy Layer' },
    { key: 'v', ctrl: true, action: pasteLayer, description: 'Paste Layer' },
    { key: 'd', ctrl: true, action: () => selectedLayerIds.length > 0 && duplicateSelected(), description: 'Duplicate Layer(s)' },
    { key: 'Delete', action: () => selectedLayerIds.length > 0 && deleteSelected(), description: 'Delete Layer(s)' },
    { key: 'Backspace', action: () => selectedLayerIds.length > 0 && deleteSelected(), description: 'Delete Layer(s)' },
    { key: 's', ctrl: true, action: () => saveProject(), description: 'Save Project' },
    { key: 'e', ctrl: true, action: () => setShowExport(true), description: 'Export Design' },
    { key: 'g', ctrl: true, action: () => { if (selectedLayerIds.length > 1) groupSelected(); }, description: 'Group Layers' },
    { key: 'g', ctrl: true, shift: true, action: () => { if (selectedLayerIds.length > 0) ungroupSelected(); }, description: 'Ungroup Layers' },
    { key: '?', action: () => setShowShortcuts(!showShortcuts), description: 'Toggle Shortcuts Help' },
    // Nudge Shortcuts
    { key: 'ArrowUp', action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, 0, -1); }, description: 'Move Layer Up' },
    { key: 'ArrowDown', action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, 0, 1); }, description: 'Move Layer Down' },
    { key: 'ArrowLeft', action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, -1, 0); }, description: 'Move Layer Left' },
    { key: 'ArrowRight', action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, 1, 0); }, description: 'Move Layer Right' },
    { key: 'ArrowUp', shift: true, action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, 0, -10); }, description: 'Move Layer Up (Large)' },
    { key: 'ArrowDown', shift: true, action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, 0, 10); }, description: 'Move Layer Down (Large)' },
    { key: 'ArrowLeft', shift: true, action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, -10, 0); }, description: 'Move Layer Left (Large)' },
    { key: 'ArrowRight', shift: true, action: () => { if (selectedLayerId) nudgeLayer(selectedLayerId, 10, 0); }, description: 'Move Layer Right (Large)' },
  ], [undo, redo, copyLayer, pasteLayer, saveProject, selectedLayerIds, selectedLayerId, duplicateSelected, deleteSelected, groupSelected, ungroupSelected, setShowShortcuts, showShortcuts, nudgeLayer]);

  useKeyboardShortcuts({
    shortcuts,
    enabled: shortcutsEnabled
  });



  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      if (mode === AppMode.THEME) {
        const theme = await geminiService.generateDesignTheme(prompt);
        applyBrandColors([theme.primaryColor, theme.secondaryColor, theme.accentColor]);
      } else {
        let resultBase64: string;
        const timestamp = Date.now();
        const newId = `img_${timestamp}`;
        const selectedImageLayer = imageLayers.find(l => l.id === selectedLayerId);
        if (mode === AppMode.GENERATE) {
          resultBase64 = await geminiService.generateImage(prompt, aspectRatio, quality);
        } else {
          let sourceImage = uploadedImage;
          if (selectedImageLayer) sourceImage = selectedImageLayer.src;
          if (!sourceImage) throw new Error("No image source found to edit.");
          resultBase64 = await geminiService.editImage(sourceImage, prompt, quality);
        }
        const newImage: GeneratedImage = { id: newId, url: resultBase64, prompt: prompt, timestamp, mode: mode, aspectRatio: aspectRatio };
        setHistory(prev => [newImage, ...prev]);
        setActiveImageId(newId);
        setCanvasFilters(DEFAULT_FILTERS);
      }
    } catch (error: any) { console.error(error); alert(`Error: ${error.message || "Failed to generate content"}`); } finally { setIsProcessing(false); }
  };

  const handleApplyTheme = useCallback((theme: DesignTheme) => {
    saveToHistory();
    setCanvasBackgroundColor(theme.backgroundColor);
    setLayers((prev: Layer[]) => prev.map((layer, index) => {
      if (layer.type === 'text') {
        const isHeading = (layer as TextLayer).fontSize > 24;
        return { ...layer, color: isHeading ? theme.primaryColor : theme.secondaryColor, fontFamily: isHeading ? theme.headingFont : theme.bodyFont } as Layer;
      } else if (layer.type !== 'image') {
        const colors = [theme.primaryColor, theme.secondaryColor, theme.accentColor];
        return { ...layer, color: colors[index % colors.length] } as Layer;
      }
      return layer;
    }));
    setProjectTitle(`${theme.name} Design`);
  }, [saveToHistory, setCanvasBackgroundColor, setLayers, setProjectTitle]);

  const handleMagicWrite = async (layerId: string) => {
    const layer = textLayers.find(l => l.id === layerId);
    if (!layer || !layer.text.trim()) return;
    setIsProcessing(true);
    try {
      const newText = await geminiService.generateText(layer.text);
      saveToHistory();
      updateLayer(layerId, { text: newText });
    } catch (error) { console.error(error); alert("Magic Write failed. Please try again."); } finally { setIsProcessing(false); }
  };

  const handleVectorize = useCallback(async (layerId: string, options: any) => {
    const layer = imageLayers.find(l => l.id === layerId);
    if (!layer) return;

    setIsProcessing(true);
    try {
      // Get SVG string
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
        width: layer.width, // Approximate, vectors are scale independent but need base size
        height: layer.height,
        rotation: layer.rotation,
        opacity: layer.opacity,
        visible: true,
        locked: false,
        cornerRadius: 0,
        groupId: groupId // Group them together
      }));

      saveToHistory();
      // Remove old image
      deleteLayer(layerId);
      // Add new paths
      addLayers(newPaths);

    } catch (error) {
      console.error("Vectorization failed", error);
      alert("Failed to vectorize image.");
    } finally {
      setIsProcessing(false);
    }
  }, [imageLayers, saveToHistory, deleteLayer, addLayers]);

  const handleVectorDrawingComplete = (pathData: string, stroke: any) => {
    saveToHistory();
    // Parse path to get bounds for tight fit
    const vectorPath = VectorUtils.parsePath(pathData);
    const bounds = VectorUtils.getBounds(vectorPath);

    // Normalize path to 0,0 relative to bounds if valid
    let finalPathData = pathData;
    let x = 0;
    let y = 0;
    let w = canvasSize.width;
    let h = canvasSize.height;

    if (bounds.width > 0 && bounds.height > 0) {
      x = bounds.x;
      y = bounds.y;
      w = bounds.width;
      h = bounds.height;

      // Translate points to local
      const localPoints = vectorPath.points.map(p => ({
        ...p,
        x: p.x - x,
        y: p.y - y
      }));
      finalPathData = VectorUtils.serializePath({ ...vectorPath, points: localPoints });
    }

    const newLayer: ShapeLayer = {
      id: `path_${Date.now()}`,
      type: 'path',
      name: 'Path',
      x,
      y,
      width: w,
      height: h,
      rotation: 0,
      pathData: finalPathData,
      color: 'transparent',
      stroke: {
        color: stroke?.color || '#000000',
        width: stroke?.width || 2
      },
      opacity: stroke?.opacity || 1,
      visible: true,
      locked: false,
      cornerRadius: 0
    };

    setLayers((prev: Layer[]) => [...prev, newLayer]);
    selectLayer(newLayer.id);
  };

  const handleBooleanOperation = (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => {
    const selectedPaths = layers.filter(l => selectedLayerIds.includes(l.id) && l.type === 'path') as ShapeLayer[];
    if (selectedPaths.length < 2) {
      alert("Select at least two path layers to perform boolean operations.");
      return;
    }

    saveToHistory();

    // 1. Convert to global coordinates
    const globalPaths = selectedPaths.map(layer => {
      const path = VectorUtils.parsePath(layer.pathData || '');
      return {
        ...path,
        points: path.points.map(p => ({
          ...p,
          x: p.x + layer.x,
          y: p.y + layer.y
        }))
      };
    });

    // 2. Perform operation
    let resultPath = globalPaths[0];
    for (let i = 1; i < globalPaths.length; i++) {
      switch (operation) {
        case 'union': resultPath = BooleanOperations.union(resultPath, globalPaths[i]); break;
        case 'subtract': resultPath = BooleanOperations.subtract(resultPath, globalPaths[i]); break;
        case 'intersect': resultPath = BooleanOperations.intersect(resultPath, globalPaths[i]); break;
        case 'exclude': resultPath = BooleanOperations.exclude(resultPath, globalPaths[i]); break;
      }
    }

    // 3. Normalize to new layer bounds
    const bounds = VectorUtils.getBounds(resultPath);
    const localPath = {
      ...resultPath,
      points: resultPath.points.map(p => ({
        ...p,
        x: p.x - bounds.x,
        y: p.y - bounds.y
      }))
    };

    const newPathData = VectorUtils.serializePath(localPath);

    // 4. Create new layer (inherit from top-most layer)
    const topLayer = selectedPaths[selectedPaths.length - 1];
    const newLayer: ShapeLayer = {
      ...topLayer,
      id: `path_${Date.now()}`,
      type: 'path',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pathData: newPathData,
      cornerRadius: 0,
      visible: true,
      locked: false,
      opacity: 1,
      rotation: topLayer.rotation,
      name: 'Boolean Result'
    };

    // 5. Update layers: remove old, add new
    const newLayers = layers.filter(l => !selectedLayerIds.includes(l.id));
    setLayers([...newLayers, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  };

  // -- Core Handlers --
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const thumb = await handleExportDataUrl();
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        updatedAt: Date.now(),
        thumbnail: thumb,
        state: {
          layers,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize
        }
      };
      await storageService.saveProject(updatedProject);
      setThumbnail(thumb);
    } catch (e) {
      console.error("Manual save failed", e);
    } finally {
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    }
  };

  // Silent auto-save every 30 seconds — prevents "restore old design" prompts
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (layers.length === 0) return; // Don't auto-save empty canvases
      try {
        const updatedProject: Project = {
          id: projectId,
          name: projectTitle,
          updatedAt: Date.now(),
          thumbnail: thumbnail || '',
          state: {
            layers,
            canvasBackgroundColor,
            canvasFilters,
            canvasSize
          }
        };
        await storageService.saveProject(updatedProject);
        localStorage.removeItem('kreathief_last_session');
      } catch (e) {
        // Silent fail — don't interrupt user
      }
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [layers, projectId, projectTitle, canvasBackgroundColor, canvasFilters, canvasSize, thumbnail]);

  const handleExport = () => setShowExport(true);

  const handleConfirmExport = async (
    format: 'png' | 'jpeg' | 'webp' | 'pdf' | 'svg' | 'psd' = 'png',
    quality: number = 0.95,
    size?: { width: number, height: number }
  ) => {
    console.log('Starting export:', { format, quality, size });
    setIsExporting(true);
    try {
      const backgroundImageUrl = activeImage?.url || uploadedImage;
      const exportWidth = size?.width || canvasSize.width;
      const exportHeight = size?.height || canvasSize.height;

      if (!exportWidth || !exportHeight) {
        throw new Error(`Invalid export dimensions: ${exportWidth}x${exportHeight}`);
      }

      console.log('Export context:', { exportWidth, exportHeight, backgroundImageUrl, layersCount: layers.length });

      let downloadUrl = "";
      let fileName = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${format}`;

      // Calculate Scale Factor
      const scaleX = exportWidth / canvasSize.width;
      const scaleY = exportHeight / canvasSize.height;

      // Create scaled copies of layers for SVG/PSD/PDF
      const scaledLayers = layers.map(l => ({
        ...l,
        x: l.x * scaleX,
        y: l.y * scaleY,
        width: l.width * scaleX,
        height: (l as any).height ? (l as any).height * scaleY : l.width * scaleX,
        ...(l.type === 'text' ? { fontSize: (l as TextLayer).fontSize * scaleY } : {})
      })) as Layer[];

      if (format === 'psd') {
        console.log('Exporting as PSD...');
        const psdBlob = await psdService.exportLayersToPsd(exportWidth, exportHeight, scaledLayers);
        downloadUrl = URL.createObjectURL(psdBlob);
      } else if (format === 'svg') {
        console.log('Exporting as SVG...');
        // Now async
        const svgString = await exportService.exportToSVG(
          exportWidth, exportHeight, canvasBackgroundColor, scaledLayers
        );
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadUrl = URL.createObjectURL(svgBlob);
      } else if (format === 'pdf') {
        console.log('Exporting as PDF...');
        // Generate high-res image first for PDF embedding
        // (Or we could implement vector PDF if exportToPDF supported it, but our current impl uses image)
        const imgDataUrl = await exportService.exportDesignToImage(
          exportWidth,
          exportHeight,
          canvasBackgroundColor,
          backgroundImageUrl,
          scaledLayers,
          canvasFilters,
          'png',
          1.0 // High quality for PDF
        );

        await exportService.exportToPDF(exportWidth, exportHeight, imgDataUrl, fileName);
        setIsExporting(false);
        setShowExport(false);
        return; // PDF export handles its own download/save
      } else {
        // Pixel-based (PNG, JPEG, WebP)
        console.log(`Exporting as ${format}...`);
        downloadUrl = await exportService.exportDesignToImage(
          exportWidth,
          exportHeight,
          canvasBackgroundColor,
          backgroundImageUrl,
          scaledLayers,
          canvasFilters,
          format,
          quality
        );
      }

      console.log('Export URL generated:', downloadUrl ? 'YES' : 'NO');

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();

      if (format === 'psd' || format === 'svg') {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      }

      setShowExport(false);
    } catch (error) {
      console.error("Export failed", error);
      alert("Export failed. Please check console for details.");
    } finally {
      setIsExporting(false);
    }
  };


  const handleSelectImage = (img: GeneratedImage) => {
    setActiveImageId(img.id);
    setCanvasFilters(DEFAULT_FILTERS);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const step = 0.1;
      const newZoom = direction === 'in' ? prev + step : prev - step;
      return Math.min(Math.max(newZoom, 0.1), 3);
    });
  };

  // Mobile State
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const handleManualSave = handleSave;



  const handleUpdatePath = useCallback((path: VectorPath) => {
    if (!editingPathId) return;
    saveToHistory();
    onUpdatePath(editingPathId, { vectorPath: path, pathData: VectorUtils.lastPathData || undefined });
  }, [editingPathId, saveToHistory, onUpdatePath]);

  const handleLayerDoubleClick = useCallback((layer: Layer) => {
    if (layer.type === 'rectangle' || layer.type === 'circle' || layer.type === 'path' || layer.type === 'star') {
      // Convert to path if needed (if it's a primitive without a vectorPath)
      if (!(layer as ShapeLayer).vectorPath) {
        // Optional: Auto-convert logic here or just warn
        // For now, we assume only existing paths or converted shapes can be edited
        // But let's allow setting it to trigger the overlay if it has one
      }
      setEditingPathId(layer.id);
      // Also select it
      setSelectedLayerIds([layer.id]);
    }
  }, [setSelectedLayerIds]);


  // -- Final Professional Render --
  return (
    <div className="flex flex-col h-screen bg-[#0e1318] overflow-hidden text-[#e5e7eb] font-sans">
      <Header
        onDownload={() => setShowExport(true)}
        onBack={onBack}
        user={user}
      />

      <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
        <div className="hidden md:flex flex-row h-full shrink-0 z-40 border-r border-gray-800">
          <ErrorBoundary componentName="Sidebar" variant="widget">
            <Sidebar />
            <SidePanel
              onGenerate={handleGenerate}
              onApplyTheme={applyBrandColors}
              onApplyLayout={handleApplyLayout}
              getCanvasSnapshot={handleExportDataUrl}
              uploadedImage={activeImage?.url || uploadedImage}
              onFileUpload={handleFileUploads}
            />
          </ErrorBoundary>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative overflow-hidden bg-[#13161a] flex flex-col">
          <Toolbar
            uploadedImage={uploadedImage}
            documentColors={documentColors}
            onToggleEraser={() => setIsEraserActive(!isEraserActive)}
            isEraserActive={isEraserActive}
            onCompletePath={() => setPenMode(false)}
            onBooleanOperation={handleBooleanOperation}
            onCrop={() => setIsCropMode(true)}
          />
          <ErrorBoundary componentName="Canvas" variant="widget">
            <Canvas
              zoom={zoom}
              onZoomChange={setZoom}
              documentColors={documentColors}
              onFileUpload={handleFileUpload}
              onAddLogoToCanvas={handleAddLogoToCanvas}
              onDoubleClickLayer={handleDoubleClickLayer}
              activeImage={activeImage || undefined}
              uploadedImage={uploadedImage}
            />
            {editingPathId && (
              (() => {
                const layer = layers.find(l => l.id === editingPathId) as ShapeLayer;
                if (layer && layer.vectorPath) {
                  return (
                    <PathEditorOverlay
                      path={layer.vectorPath}
                      zoom={zoom}
                      onUpdate={handleUpdatePath}
                      onSelectPoint={(indices) => { /* Optional: handle point selection state if needed */ }}
                      selectedPointIndices={[]} // You might want to track this in state too if you want it to persist
                    />
                  );
                }
                return null;
              })()
            )}
          </ErrorBoundary>

          {/* Assistant Panel Overlay */}
          {showAIAssistant && (
            <div className="absolute right-6 top-6 w-[400px] z-[100] animate-in slide-in-from-right duration-300">
              <AIAssistant
                isOpen={showAIAssistant}
                onClose={() => setShowAIAssistant(false)}
                isProcessing={isProcessing}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile NavBar */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsBottomSheetOpen(true);
        }}
      />

      {/* Bottom Sheet for Mobile Tools */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={activeTab}
      >
        <SidePanel
          onGenerate={handleGenerate}
          onApplyTheme={applyBrandColors}
          onApplyLayout={handleApplyLayout}
          getCanvasSnapshot={handleExportDataUrl}
          onFileUpload={handleFileUploads}
          uploadedImage={uploadedImage}
        />
      </BottomSheet>

      {/* Overlays & Utility Modals */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          currentSize={canvasSize}
          onExport={handleConfirmExport}
        />
      )}

      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          designTitle={projectTitle}
          onGetShareLink={() => shareService.generateShareLink(projectId)}
        />
      )}

      <ShortcutOverlay
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />



      {showSavedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-[#1e1e1e]/90 backdrop-blur-md border border-gray-700 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Icons.Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold text-white">Project Saved</span>
        </div>
      )}
    </div>
  );
};
