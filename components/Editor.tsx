
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from './ErrorBoundary';
import { SidePanel } from './SidePanel';
import { MobileNavBar } from './MobileNavBar';
import { BottomSheet } from './BottomSheet';
import { Canvas } from './Canvas';
import { AIAssistant } from './AIAssistant';
import { DesignSuggestions } from './DesignSuggestions';
import { SmartContentGenerator } from './SmartContentGenerator';
import { DesignQualityScorer } from './DesignQualityScorer';
import { AppMode, AspectRatio, GeneratedImage, NavTab, TextLayer, ShapeLayer, ImageLayer, HistoryState, CanvasFilters, Project, DesignTheme, BrandKit, CanvasSize, GenerationQuality, User, BrushType } from '../types';
import * as geminiService from '../services/geminiService';
import * as exportService from '../services/exportService';
import { storageService } from '../services/storageService';
import { MODEL_FAST, Icons } from '../constants';
import { STARTER_TEMPLATES } from '../data/templates';
import { ShareModal } from './modals/ShareModal';
import { ExportModal } from './modals/ExportModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { loadFont, loadFonts } from '../services/FontLoader';

const DEFAULT_FILTERS: CanvasFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  vignette: 0
};

interface EditorProps {
  initialProject?: Project;
  onBack: () => void;
  user: User;
  onOpenPricing: () => void;
  onRestartTour?: () => void;
}

export const Editor: React.FC<EditorProps> = ({ initialProject, onBack, user, onOpenPricing, onRestartTour }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.MAGIC);

  // Generation State
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATE);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [quality, setQuality] = useState<GenerationQuality>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data State
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploads, setUploads] = useState<string[]>([]);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(initialProject?.state.canvasBackgroundColor || '#ffffff');
  const [canvasFilters, setCanvasFilters] = useState<CanvasFilters>(initialProject?.state.canvasFilters || DEFAULT_FILTERS);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(initialProject?.state.canvasSize || { width: 1080, height: 1080, name: 'Square (IG Post)' });
  // UI State
  const [showGrid, setShowGrid] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportQuality, setExportQuality] = useState(0.95);

  // AI Features State
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showDesignSuggestions, setShowDesignSuggestions] = useState(false);
  const [showSmartContent, setShowSmartContent] = useState(false);
  const [showQualityScore, setShowQualityScore] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Layers State
  const [textLayers, setTextLayers] = useState<TextLayer[]>(initialProject?.state.textLayers || []);
  const [shapeLayers, setShapeLayers] = useState<ShapeLayer[]>(initialProject?.state.shapeLayers || []);
  const [imageLayers, setImageLayers] = useState<ImageLayer[]>(initialProject?.state.imageLayers || []);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);

  // selectedLayerId is now always set explicitly alongside selectedLayerIds
  // (no redundant useEffect needed — both are set in handleSelectLayerWrapper and handleMultiSelectLayer)



  // Undo/Redo State
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // Project Management State - Local to Editor for saving
  const [projectId, setProjectId] = useState<string>(initialProject?.id || `proj_${Date.now()}`);
  const [projectTitle, setProjectTitle] = useState(initialProject?.name || 'Untitled Design');
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | undefined>(initialProject?.thumbnail);

  // Brand Kits State
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushType, setBrushType] = useState<BrushType>(BrushType.BASIC);
  const drawingCancelRef = useRef(false);

  // Clipboard State for copy/paste
  const [clipboardLayer, setClipboardLayer] = useState<any>(null);

  // View State
  const [zoom, setZoom] = useState(0.5);

  // Keyboard Shortcuts State
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  // Derived State
  const activeImage = history.find(img => img.id === activeImageId) || null;

  // Initialize from project prop - skip if already initialized or same project
  useEffect(() => {
    if (initialProject && initialProject.id !== projectId) {
      setProjectId(initialProject.id);
      setProjectTitle(initialProject.name);
      setTextLayers(initialProject.state.textLayers);
      setShapeLayers(initialProject.state.shapeLayers);
      setImageLayers(initialProject.state.imageLayers);
      setCanvasBackgroundColor(initialProject.state.canvasBackgroundColor);
      setCanvasFilters(initialProject.state.canvasFilters);
      if (initialProject.state.canvasSize) setCanvasSize(initialProject.state.canvasSize);
      if (initialProject.thumbnail) setThumbnail(initialProject.thumbnail);
    }
  }, [initialProject, projectId]);

  // Load fonts used in text layers - optimized to avoid excessive checks
  const lastFontsRef = useRef<string>('');
  useEffect(() => {
    const uniqueFonts = Array.from(new Set(textLayers.map(l => l.fontFamily))).sort();
    const fontsKey = uniqueFonts.join(',');
    if (fontsKey !== lastFontsRef.current && uniqueFonts.length > 0) {
      lastFontsRef.current = fontsKey;
      loadFonts(uniqueFonts);
    }
  }, [textLayers]);

  // -- Auto-Save & Crash Recovery --

  // 1. Recover on mount
  // 1. Recover on mount
  useEffect(() => {
    const recoverSession = async () => {
      const savedState = await storageService.getSetting('kreathief_autosave_v1', null);
      if (savedState && !initialProject) {
        try {
          const parsed = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
          if ((parsed.textLayers?.length > 0 || parsed.shapeLayers?.length > 0 || parsed.imageLayers?.length > 0) &&
            window.confirm('We found an unsaved session. Would you like to restore it?')) {

            if (parsed.textLayers) setTextLayers(parsed.textLayers);
            if (parsed.shapeLayers) setShapeLayers(parsed.shapeLayers);
            if (parsed.imageLayers) setImageLayers(parsed.imageLayers);
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
  }, [initialProject]);

  // 2. Optimized persistence (Debounced + Unified)
  // 2. Optimized persistence (Debounced + Unified)
  useEffect(() => {
    // Skip if design is empty or hasn't changed meaningfully
    if (textLayers.length === 0 && shapeLayers.length === 0 && imageLayers.length === 0) return;

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        updatedAt: Date.now(),
        thumbnail: thumbnail, // Note: local thumbnail might be stale, but we don't want to re-export on every auto-save
        state: {
          textLayers,
          shapeLayers,
          imageLayers,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize
        }
      };

      try {
        // Update Project in IndexedDB
        await storageService.saveProject(updatedProject);

        // Update Crash Recovery (Autosave) in IndexedDB Settings
        await storageService.setSetting('kreathief_autosave_v1', {
          ...updatedProject.state,
          projectTitle,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error("Auto-save failed:", e);
      }

      setTimeout(() => {
        setIsSaving(false);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
      }, 500);
    }, 5000); // 5s debounce for heavier state

    return () => clearTimeout(timeout);
  }, [textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, projectTitle, projectId, canvasSize]);

  // Extract Document Colors
  const documentColors = useMemo(() => {
    const colors = new Set<string>();
    colors.add(canvasBackgroundColor);
    textLayers.forEach(l => {
      colors.add(l.color);
      if (l.stroke) colors.add(l.stroke.color);
      if (l.shadow) colors.add(l.shadow.color);
    });
    shapeLayers.forEach(l => {
      colors.add(l.color);
      if (l.stroke) colors.add(l.stroke.color);
      if (l.shadow) colors.add(l.shadow.color);
    });
    brandKits.forEach(kit => kit.colors.forEach(c => colors.add(c)));
    return Array.from(colors);
  }, [textLayers, shapeLayers, canvasBackgroundColor, brandKits]);

  // Helper to find which layer array a given ID belongs to
  const findLayerType = useCallback((id: string): 'text' | 'shape' | 'image' | null => {
    if (textLayers.some(l => l.id === id)) return 'text';
    if (shapeLayers.some(l => l.id === id)) return 'shape';
    if (imageLayers.some(l => l.id === id)) return 'image';
    return null;
  }, [textLayers, shapeLayers, imageLayers]);

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

  // Removed redundant auto-save block (was consolidated above)

  // -- Layer Management Helpers --




  // Refs for layers to avoid saveToHistory dependency churn
  const textLayersRef = useRef(textLayers);
  textLayersRef.current = textLayers;
  const shapeLayersRef = useRef(shapeLayers);
  shapeLayersRef.current = shapeLayers;
  const imageLayersRef = useRef(imageLayers);
  imageLayersRef.current = imageLayers;
  const canvasBgRef = useRef(canvasBackgroundColor);
  canvasBgRef.current = canvasBackgroundColor;
  const canvasFiltersRef = useRef(canvasFilters);
  canvasFiltersRef.current = canvasFilters;
  const canvasSizeRef = useRef(canvasSize);
  canvasSizeRef.current = canvasSize;

  const saveToHistory = useCallback(() => {
    // Use requestIdleCallback to avoid blocking any event handlers (mousedown, mouseup, click)
    const scheduleHistorySnapshot = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 0));

    scheduleHistorySnapshot(() => {
      const currentState: HistoryState = {
        textLayers: textLayersRef.current.map(l => ({ ...l })),
        shapeLayers: shapeLayersRef.current.map(l => ({ ...l })),
        imageLayers: imageLayersRef.current.map(l => ({ ...l })),
        canvasBackgroundColor: canvasBgRef.current,
        canvasFilters: { ...canvasFiltersRef.current },
        canvasSize: { ...canvasSizeRef.current }
      };

      setPast(prev => {
        const newPast = [...prev, currentState];
        if (newPast.length > 50) newPast.shift();
        return newPast;
      });
      setFuture([]);
    });
  }, []); // Stable — never recreated

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentState: HistoryState = { textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, canvasSize };
    setFuture(prev => [currentState, ...prev]);
    setPast(newPast);
    setTextLayers(previousState.textLayers);
    setShapeLayers(previousState.shapeLayers);
    if (previousState.imageLayers) setImageLayers(previousState.imageLayers);
    setCanvasBackgroundColor(previousState.canvasBackgroundColor);
    setCanvasFilters(previousState.canvasFilters);
    if (previousState.canvasSize) setCanvasSize(previousState.canvasSize);
  }, [past, textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, canvasSize]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextState = future[0];
    const newFuture = future.slice(1);
    const currentState: HistoryState = { textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, canvasSize };
    setPast(prev => [...prev, currentState]);
    setFuture(newFuture);
    setTextLayers(nextState.textLayers);
    setShapeLayers(nextState.shapeLayers);
    if (nextState.imageLayers) setImageLayers(nextState.imageLayers);
    setCanvasBackgroundColor(nextState.canvasBackgroundColor);
    setCanvasFilters(nextState.canvasFilters);
    if (nextState.canvasSize) setCanvasSize(nextState.canvasSize);
  }, [future, textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, canvasSize]);


  // -- Layer Handlers --
  const handleAddText = (style: Partial<TextLayer>) => {
    saveToHistory();
    const newLayer: TextLayer = {
      id: `text_${Date.now()}`,
      type: 'text',
      name: 'Text Layer',
      text: style.text || 'New Text',
      x: canvasSize.width / 2 - 125,
      y: canvasSize.height / 2 - 20,
      width: 250,
      rotation: 0,
      fontSize: style.fontSize || 24,
      fontWeight: style.fontWeight || 'normal',
      fontStyle: style.fontStyle || 'normal',
      textDecoration: 'none',
      color: style.color || '#000000',
      fontFamily: style.fontFamily || 'Inter, sans-serif',
      textAlign: style.textAlign || 'left',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      opacity: 1,
      locked: false,
      visible: true,
      curve: 0,
      skewX: 0,
      skewY: 0
    };
    setTextLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  };

  const handleAddShape = (type: any, style: Partial<ShapeLayer>) => {
    saveToHistory();
    const w = style.width || 100;
    const h = style.height || 100;
    const newLayer: ShapeLayer = {
      id: `shape_${Date.now()}`,
      type: type,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      x: canvasSize.width / 2 - w / 2,
      y: canvasSize.height / 2 - h / 2,
      rotation: 0,
      width: w,
      height: h,
      color: style.color || '#00c4cc',
      cornerRadius: 0,
      opacity: 1,
      locked: false,
      visible: true,
      skewX: 0,
      skewY: 0,
      ...style
    };
    setShapeLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  };

  const handleApplyLayout = (shapes: Partial<ShapeLayer>[]) => {
    saveToHistory();
    const newLayers: ShapeLayer[] = shapes.map((s, i) => ({
      id: `shape_${Date.now()}_${Math.random()}`,
      type: s.type || 'rectangle',
      name: `Shape ${i + 1}`,
      x: s.x || 0,
      y: s.y || 0,
      width: s.width || 100,
      height: s.height || 100,
      color: s.color || '#333',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      cornerRadius: 0,
      shadow: s.shadow,
      skewX: 0,
      skewY: 0
    }));
    setShapeLayers(prev => [...prev, ...newLayers]);
  };

  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = STARTER_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    if (textLayers.length > 0 || shapeLayers.length > 0 || imageLayers.length > 0) {
      if (!confirm("Are you sure? This will replace your current design.")) return;
    }

    saveToHistory();
    const { state } = template;
    setCanvasBackgroundColor(state.canvasBackgroundColor);
    if (state.canvasSize) setCanvasSize(state.canvasSize);
    if (state.canvasFilters) setCanvasFilters(state.canvasFilters);

    setTextLayers((state.textLayers || []).map(l => ({ ...l, id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })));
    setShapeLayers((state.shapeLayers || []).map(l => ({ ...l, id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })));
    setImageLayers((state.imageLayers || []).map(l => ({ ...l, id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })));
  }, [textLayers, shapeLayers, imageLayers, saveToHistory]);

  const saveProject = async () => {
    setIsSaving(true);
    try {
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        updatedAt: Date.now(),
        thumbnail: await handleExportDataUrl(),
        state: {
          textLayers,
          shapeLayers,
          imageLayers,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize
        }
      };

      const allProjectsStr = localStorage.getItem('kreathief_projects');
      let allProjects: Project[] = allProjectsStr ? JSON.parse(allProjectsStr) : [];
      const idx = allProjects.findIndex(p => p.id === projectId);
      if (idx >= 0) {
        allProjects[idx] = updatedProject;
      } else {
        allProjects.push(updatedProject);
      }
      localStorage.setItem('kreathief_projects', JSON.stringify(allProjects));
    } catch (e) {
      console.error("Manual save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    if (confirm("Create new design? Unsaved changes might be lost.")) {
      setProjectId(`proj_${Date.now()}`);
      setProjectTitle('Untitled Design');
      setTextLayers([]);
      setShapeLayers([]);
      setImageLayers([]);
      setUploadedImage(null);
      setCanvasBackgroundColor('#ffffff');
      setPast([]);
      setFuture([]);
    }
  };

  const handleAddImageLayer = (src: string) => {
    saveToHistory();
    const newLayer: ImageLayer = {
      id: `image_${Date.now()}`,
      type: 'image',
      name: 'Image Layer',
      src,
      x: 100,
      y: 100,
      width: 300,
      height: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      skewX: 0,
      skewY: 0
    };
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const max = 300;
      const ratio = img.width / img.height;
      let w = max;
      let h = max;
      if (ratio > 1) { h = w / ratio; } else { w = h * ratio; }
      setImageLayers(prev => prev.map(l => l.id === newLayer.id ? { ...l, width: w, height: h } : l));
    };
    setImageLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  };

  const handleDrawingComplete = (src: string) => {
    saveToHistory();
    const newLayer: ImageLayer = {
      id: `drawing_${Date.now()}`,
      type: 'image',
      name: 'Drawing',
      src,
      x: 0,
      y: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      skewX: 0,
      skewY: 0
    };
    setImageLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  };

  const handleVectorDrawingComplete = (pathData: string, stroke: any) => {
    saveToHistory();
    const newLayer: ShapeLayer = {
      id: `vector_${Date.now()}`,
      type: 'path',
      name: 'Vector Path',
      x: 0,
      y: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      rotation: 0,
      color: 'transparent',
      stroke: stroke,
      opacity: 1,
      locked: false,
      visible: true,
      cornerRadius: 0,
      skewX: 0,
      skewY: 0,
      pathData: pathData,
      viewBox: `0 0 ${canvasSize.width} ${canvasSize.height}`
    };
    setShapeLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  };


  const handleUpdateTextLayer = useCallback((id: string, changes: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...changes } : layer));
  }, []);

  const handleUpdateShapeLayer = useCallback((id: string, changes: Partial<ShapeLayer>) => {
    setShapeLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...changes } : layer));
  }, []);

  const handleUpdateImageLayer = useCallback((id: string, changes: Partial<ImageLayer>) => {
    setImageLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...changes } : layer));
  }, []);

  // Optimized batched update for multiple layers
  const handleUpdateLayers = useCallback((updates: Record<string, any>) => {
    const updatedIds = Object.keys(updates);
    if (updatedIds.length === 0) return;

    // Check which arrays need updating
    const textLayerIds = new Set(textLayersRef.current.map(l => l.id));
    const shapeLayerIds = new Set(shapeLayersRef.current.map(l => l.id));
    const imageLayerIds = new Set(imageLayersRef.current.map(l => l.id));

    const needsTextUpdate = updatedIds.some(id => textLayerIds.has(id));
    const needsShapeUpdate = updatedIds.some(id => shapeLayerIds.has(id));
    const needsImageUpdate = updatedIds.some(id => imageLayerIds.has(id));

    if (needsTextUpdate) {
      setTextLayers(prev => prev.map(l => updates[l.id] ? { ...l, ...updates[l.id] } : l));
    }
    if (needsShapeUpdate) {
      setShapeLayers(prev => prev.map(l => updates[l.id] ? { ...l, ...updates[l.id] } : l));
    }
    if (needsImageUpdate) {
      setImageLayers(prev => prev.map(l => updates[l.id] ? { ...l, ...updates[l.id] } : l));
    }
  }, []);

  const handlePasteLayer = useCallback(() => {
    if (!clipboardLayer) return;
    saveToHistory();
    const newLayer = { ...clipboardLayer, id: `${clipboardLayer.type}_${Date.now()}`, x: clipboardLayer.x + 20, y: clipboardLayer.y + 20, name: clipboardLayer.name + ' Copy' };
    if (clipboardLayer.type === 'text') setTextLayers(prev => [...prev, newLayer]);
    else if (clipboardLayer.type === 'image') setImageLayers(prev => [...prev, newLayer]);
    else if (clipboardLayer.type.startsWith('shape') || clipboardLayer.type === 'rectangle' || clipboardLayer.type === 'circle' || clipboardLayer.type === 'triangle' || clipboardLayer.type === 'star' || clipboardLayer.type === 'hexagon' || clipboardLayer.type === 'diamond' || clipboardLayer.type === 'arrow' || clipboardLayer.type === 'heart' || clipboardLayer.type === 'speech_bubble' || clipboardLayer.type === 'ribbon' || clipboardLayer.type === 'shield' || clipboardLayer.type === 'banner' || clipboardLayer.type === 'path') setShapeLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  }, [clipboardLayer, saveToHistory]);

  const handleCopyLayer = useCallback((id?: string) => {
    const targetId = id || selectedLayerId;
    if (!targetId) return;
    const layer = [...textLayers, ...shapeLayers, ...imageLayers].find(l => l.id === targetId);
    if (layer) {
      setClipboardLayer(JSON.parse(JSON.stringify(layer)));
    }
  }, [selectedLayerId, textLayers, shapeLayers, imageLayers]);

  const handleNudgeLayer = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount: number = 1) => {
    if (selectedLayerIds.length === 0) return;
    const updateLayer = (id: string, changes: any) => {
      const type = findLayerType(id);
      if (type === 'text') handleUpdateTextLayer(id, changes);
      else if (type === 'shape') handleUpdateShapeLayer(id, changes);
      else if (type === 'image') handleUpdateImageLayer(id, changes);
    };

    selectedLayerIds.forEach(id => {
      const layer = [...textLayers, ...shapeLayers, ...imageLayers].find(l => l.id === id);
      if (layer) {
        if (direction === 'up') updateLayer(id, { y: layer.y - amount });
        else if (direction === 'down') updateLayer(id, { y: layer.y + amount });
        else if (direction === 'left') updateLayer(id, { x: layer.x - amount });
        else if (direction === 'right') updateLayer(id, { x: layer.x + amount });
      }
    });
  }, [selectedLayerIds, textLayers, shapeLayers, imageLayers, handleUpdateTextLayer, handleUpdateShapeLayer, handleUpdateImageLayer, findLayerType]);

  const handleDeleteLayer = useCallback((id: string) => {
    saveToHistory();
    const type = findLayerType(id);
    if (type === 'text') setTextLayers(prev => prev.filter(layer => layer.id !== id));
    else if (type === 'shape') setShapeLayers(prev => prev.filter(layer => layer.id !== id));
    else if (type === 'image') setImageLayers(prev => prev.filter(layer => layer.id !== id));
    setSelectedLayerIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [saveToHistory, findLayerType]);

  const handleDeleteSelected = useCallback(() => {
    saveToHistory();
    if (selectedLayerIds.length === 0) return;
    setTextLayers(prev => prev.filter(layer => !selectedLayerIds.includes(layer.id)));
    setShapeLayers(prev => prev.filter(layer => !selectedLayerIds.includes(layer.id)));
    setImageLayers(prev => prev.filter(layer => !selectedLayerIds.includes(layer.id)));
    setSelectedLayerIds([]);
    setSelectedLayerId(null);
  }, [selectedLayerIds, saveToHistory]);


  // -- Grouping Logic --
  const handleGroupSelected = useCallback(() => {
    if (selectedLayerIds.length < 2) return;
    saveToHistory();
    const newGroupId = `group_${Date.now()}`;

    const update = (layers: any[]) => layers.map(l => selectedLayerIds.includes(l.id) ? { ...l, groupId: newGroupId } : l);

    setTextLayers(prev => update(prev));
    setShapeLayers(prev => update(prev));
    setImageLayers(prev => update(prev));
  }, [selectedLayerIds, saveToHistory]);

  const handleUngroupSelected = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    saveToHistory();

    // Find if selection has a group ID (use the first one found)
    const allLayers = [...textLayers, ...shapeLayers, ...imageLayers];
    const selectedItems = allLayers.filter(l => selectedLayerIds.includes(l.id));
    const targetGroupId = selectedItems.find(l => l.groupId)?.groupId;

    if (!targetGroupId) return;

    const update = (layers: any[]) => layers.map(l => l.groupId === targetGroupId ? { ...l, groupId: undefined } : l);

    setTextLayers(prev => update(prev));
    setShapeLayers(prev => update(prev));
    setImageLayers(prev => update(prev));
  }, [selectedLayerIds, textLayers, shapeLayers, imageLayers, saveToHistory]);

  // Optimized selection handler using refs for stability
  const handleSelectLayerWrapper = useCallback((id: string | null) => {
    if (!id) {
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
      return;
    }

    const allLayers = [...textLayersRef.current, ...shapeLayersRef.current, ...imageLayersRef.current];
    const targetLayer = allLayers.find(l => l.id === id);

    if (targetLayer?.groupId) {
      // Select all members of this group
      const groupMembers = allLayers.filter(l => l.groupId === targetLayer.groupId);
      setSelectedLayerIds(groupMembers.map(l => l.id));
      setSelectedLayerId(id); // Keep the clicked one as "primary"
    } else {
      setSelectedLayerId(id);
      setSelectedLayerIds([id]);
    }
  }, []); // Stable identity

  const handleCutLayer = useCallback((id: string) => {
    handleCopyLayer(id);
    handleDeleteLayer(id);
  }, [handleDeleteLayer, handleCopyLayer]);

  const handleDuplicateLayer = useCallback((id: string) => {
    saveToHistory();
    const copyLayer = (layers: any[], setLayers: Function) => {
      const layerToCopy = layers.find(l => l.id === id);
      if (layerToCopy) {
        const newLayer = { ...layerToCopy, id: `${layerToCopy.type}_${Date.now()}`, x: layerToCopy.x + 20, y: layerToCopy.y + 20, name: layerToCopy.name + ' Copy' };
        setTimeout(() => setSelectedLayerIds([newLayer.id]), 0);
        setLayers((prev: any[]) => [...prev, newLayer]);
      }
    };
    const type = findLayerType(id);
    if (type === 'text') copyLayer(textLayers, setTextLayers);
    else if (type === 'shape') copyLayer(shapeLayers, setShapeLayers);
    else if (type === 'image') copyLayer(imageLayers, setImageLayers);
  }, [saveToHistory, textLayers, shapeLayers, imageLayers, findLayerType]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    saveToHistory();
    const newIds: string[] = [];

    const processLayers = (layers: any[]) => {
      return layers.map(l => {
        if (selectedLayerIds.includes(l.id)) {
          const newLayer = { ...l, id: `${l.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, x: l.x + 20, y: l.y + 20, name: l.name + ' Copy' };
          newIds.push(newLayer.id);
          return [l, newLayer];
        }
        return [l];
      }).flat();
    };

    setTextLayers(prev => processLayers(prev));
    setShapeLayers(prev => processLayers(prev));
    setImageLayers(prev => processLayers(prev));

    setTimeout(() => setSelectedLayerIds(newIds), 0);
  }, [selectedLayerIds, saveToHistory]);


  const handleMultiSelectLayer = useCallback((id: string) => {
    setSelectedLayerIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(lid => lid !== id)
        : [...prev, id];
      // Keep selectedLayerId in sync (was previously done by useEffect)
      setSelectedLayerId(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  }, []);

  const handleAlignLayers = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedLayerIds.length < 2) return;
    saveToHistory();

    const selectedLayers = [...textLayers, ...shapeLayers, ...imageLayers].filter(l => selectedLayerIds.includes(l.id));
    if (selectedLayers.length === 0) return;

    // Calculate bounds of the selection
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedLayers.forEach(l => {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.width);
      maxY = Math.max(maxY, l.y + (l as any).height || 0); // Handle text layer height if needed, usually handled by finding bounds
    });

    const alignMap = new Map<string, { x?: number, y?: number }>();
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    selectedLayers.forEach(l => {
      let newX = l.x;
      let newY = l.y;
      const h = (l as any).height || (l as any).fontSize || 0; // approximate height for text if not set

      switch (alignment) {
        case 'left': newX = minX; break;
        case 'center': newX = centerX - l.width / 2; break;
        case 'right': newX = maxX - l.width; break;
        case 'top': newY = minY; break;
        case 'middle': newY = centerY - h / 2; break;
        case 'bottom': newY = maxY - h; break;
      }
      alignMap.set(l.id, { x: newX, y: newY });
    });

    // Helper to update specific layers
    const updateLayers = (layers: any[], setLayers: Function) => {
      setLayers(layers.map(l => alignMap.has(l.id) ? { ...l, ...alignMap.get(l.id) } : l));
    };

    updateLayers(textLayers, setTextLayers);
    updateLayers(shapeLayers, setShapeLayers);
    updateLayers(imageLayers, setImageLayers);
  }, [selectedLayerIds, textLayers, shapeLayers, imageLayers, saveToHistory]);

  const handleDistributeLayers = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedLayerIds.length < 3) return; // Need 3 to distribute
    saveToHistory();

    const selectedLayers = [...textLayers, ...shapeLayers, ...imageLayers].filter(l => selectedLayerIds.includes(l.id));

    // Sort layers by position
    if (direction === 'horizontal') selectedLayers.sort((a, b) => a.x - b.x);
    else selectedLayers.sort((a, b) => a.y - b.y);

    if (selectedLayers.length < 3) return;

    const first = selectedLayers[0];
    const last = selectedLayers[selectedLayers.length - 1];

    const alignMap = new Map<string, { x?: number, y?: number }>();

    if (direction === 'horizontal') {
      const totalSpan = (last.x + last.width / 2) - (first.x + first.width / 2);
      const step = totalSpan / (selectedLayers.length - 1);
      selectedLayers.forEach((l, i) => {
        const centerX = (first.x + first.width / 2) + step * i;
        alignMap.set(l.id, { x: centerX - l.width / 2 });
      });
    } else {
      const h1 = (first as any).height || 0;
      const h2 = (last as any).height || 0;
      const totalSpan = (last.y + h2 / 2) - (first.y + h1 / 2);
      const step = totalSpan / (selectedLayers.length - 1);
      selectedLayers.forEach((l, i) => {
        const h = (l as any).height || 0;
        const centerY = (first.y + h1 / 2) + step * i;
        alignMap.set(l.id, { y: centerY - h / 2 });
      });
    }

    const updateLayers = (layers: any[], setLayers: Function) => {
      setLayers(layers.map(l => alignMap.has(l.id) ? { ...l, ...alignMap.get(l.id) } : l));
    };

    updateLayers(textLayers, setTextLayers);
    updateLayers(shapeLayers, setShapeLayers);
    updateLayers(imageLayers, setImageLayers);
  }, [selectedLayerIds, textLayers, shapeLayers, imageLayers, saveToHistory]);

  const handleMoveLayer = useCallback((id: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    const moveInArray = <T extends { id: string }>(arr: T[], idx: number, dir: 'front' | 'back' | 'forward' | 'backward'): T[] => {
      const newArr = [...arr];
      const item = newArr.splice(idx, 1)[0];
      let newIndex = idx;
      if (dir === 'front') newIndex = newArr.length;
      if (dir === 'back') newIndex = 0;
      if (dir === 'forward') newIndex = Math.min(newArr.length, idx + 1);
      if (dir === 'backward') newIndex = Math.max(0, idx - 1);
      newArr.splice(newIndex, 0, item);
      return newArr;
    };
    const type = findLayerType(id);
    if (type === 'text') setTextLayers(prev => { const idx = prev.findIndex(l => l.id === id); return idx !== -1 ? moveInArray(prev, idx, direction) : prev; });
    else if (type === 'shape') setShapeLayers(prev => { const idx = prev.findIndex(l => l.id === id); return idx !== -1 ? moveInArray(prev, idx, direction) : prev; });
    else if (type === 'image') setImageLayers(prev => { const idx = prev.findIndex(l => l.id === id); return idx !== -1 ? moveInArray(prev, idx, direction) : prev; });
  }, [findLayerType]);

  const handleUpdateCanvasFilters = useCallback((changes: Partial<CanvasFilters>) => {
    setCanvasFilters(prev => ({ ...prev, ...changes }));
  }, []);

  // Auto Layout Logic
  const handleLayoutLayers = (type: 'grid' | 'row' | 'col') => {
    saveToHistory();
    const CANVAS_W = canvasSize.width;
    const CANVAS_H = canvasSize.height;
    const PADDING = 40;
    const allLayers = [
      ...textLayers.map(l => ({ ...l, isText: true })),
      ...shapeLayers.map(l => ({ ...l, isText: false })),
      ...imageLayers.map(l => ({ ...l, isText: false }))
    ].filter(l => !l.locked && l.visible);

    if (allLayers.length === 0) return;
    allLayers.sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const count = allLayers.length;
    let newPositions: { id: string, x: number, y: number }[] = [];
    const getHeight = (l: any) => l.height || 40;

    if (type === 'row') {
      const totalWidth = allLayers.reduce((acc, l) => acc + l.width, 0);
      const spacing = (CANVAS_W - 2 * PADDING - totalWidth) / (count - 1 > 0 ? count - 1 : 1);
      let currentX = PADDING;
      const centerY = CANVAS_H / 2;
      allLayers.forEach(l => { newPositions.push({ id: l.id, x: count === 1 ? (CANVAS_W - l.width) / 2 : currentX, y: centerY - getHeight(l) / 2 }); currentX += l.width + Math.max(0, spacing); });
    } else if (type === 'col') {
      const totalHeight = allLayers.reduce((acc, l) => acc + getHeight(l), 0);
      const spacing = (CANVAS_H - 2 * PADDING - totalHeight) / (count - 1 > 0 ? count - 1 : 1);
      let currentY = PADDING;
      const centerX = CANVAS_W / 2;
      allLayers.forEach(l => { newPositions.push({ id: l.id, x: centerX - l.width / 2, y: count === 1 ? (CANVAS_H - getHeight(l)) / 2 : currentY }); currentY += getHeight(l) + Math.max(0, spacing); });
    } else if (type === 'grid') {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = (CANVAS_W - 2 * PADDING) / cols;
      const cellH = (CANVAS_H - 2 * PADDING) / rows;
      allLayers.forEach((l, i) => { const col = i % cols; const row = Math.floor(i / cols); const cellCenterX = PADDING + col * cellW + cellW / 2; const cellCenterY = PADDING + row * cellH + cellH / 2; newPositions.push({ id: l.id, x: cellCenterX - l.width / 2, y: cellCenterY - getHeight(l) / 2 }); });
    }

    setTextLayers(prev => prev.map(l => { const pos = newPositions.find(p => p.id === l.id); return pos ? { ...l, x: pos.x, y: pos.y } : l; }));
    setShapeLayers(prev => prev.map(l => { const pos = newPositions.find(p => p.id === l.id); return pos ? { ...l, x: pos.x, y: pos.y } : l; }));
    setImageLayers(prev => prev.map(l => { const pos = newPositions.find(p => p.id === l.id); return pos ? { ...l, x: pos.x, y: pos.y } : l; }));
  };

  // Brand Kit Handlers
  const handleAddBrandKit = (kit: BrandKit) => { setBrandKits(prev => [...prev, kit]); };
  const handleDeleteBrandKit = (id: string) => { setBrandKits(prev => prev.filter(k => k.id !== id)); };
  const handleApplyBrandColors = (colors: string[]) => {
    saveToHistory();
    if (colors.length > 0) setCanvasBackgroundColor(colors[0]);
    const palette = colors.length > 1 ? colors.slice(1) : colors;
    setShapeLayers(prev => prev.map((l, i) => ({ ...l, color: palette[i % palette.length] })));
    setTextLayers(prev => prev.map((l, i) => ({ ...l, color: palette[(i + 1) % palette.length] })));
  };
  const handleApplyBrandFonts = (headingFont: string, bodyFont: string) => {
    saveToHistory();
    setTextLayers(prev => prev.map(l => { const isHeading = l.fontSize > 24 || l.fontWeight === 'bold' || l.fontWeight === '800'; return { ...l, fontFamily: isHeading ? headingFont : bodyFont }; }));
  };

  const handleRemix = (layerId: string) => {
    const layer = imageLayers.find(l => l.id === layerId);
    if (layer) { setUploadedImage(layer.src); setMode(AppMode.EDIT); setActiveTab(NavTab.MAGIC); setPrompt(''); }
  };

  const handleExportDataUrl = async (): Promise<string> => {
    const backgroundImageUrl = activeImage?.url || uploadedImage;
    return await exportService.exportDesignToImage(
      canvasSize.width,
      canvasSize.height,
      canvasBackgroundColor,
      backgroundImageUrl,
      shapeLayers,
      textLayers,
      imageLayers,
      canvasFilters
    );
  }

  const handleToggleEraser = () => {
    if (isEraserActive) { drawingCancelRef.current = true; setIsEraserActive(false); setIsDrawing(false); }
    else {
      if (!selectedLayerId || !imageLayers.find(l => l.id === selectedLayerId)) { alert("Please select an image layer first."); return; }
      drawingCancelRef.current = false; setIsEraserActive(true); setIsDrawing(true); setBrushColor('rgba(255, 0, 0, 0.5)'); setBrushSize(20); setBrushOpacity(0.5);
    }
  };

  const handleEraserComplete = async (maskDataUrl: string) => {
    if (drawingCancelRef.current) { drawingCancelRef.current = false; return; }
    const layer = imageLayers.find(l => l.id === selectedLayerId);
    if (!layer) return;
    setIsProcessing(true); setIsEraserActive(false); setIsDrawing(false);
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
      handleUpdateImageLayer(layer.id, { src: newSrc });
    } catch (e) { console.error(e); alert("Magic Eraser failed."); } finally { setIsProcessing(false); }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const url = e.target.result as string;
        setUploadedImage(url);
        setUploads(prev => { const newUploads = [url, ...prev.filter(u => u !== url)]; return newUploads.slice(0, 20); });
        setCanvasFilters(DEFAULT_FILTERS);
        if (activeTab === NavTab.MAGIC) { setMode(AppMode.EDIT); }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteUpload = (index: number) => { setUploads(prev => prev.filter((_, i) => i !== index)); };

  // -- Keyboard Shortcuts --
  const shortcuts = useMemo(() => [
    { key: 'z', ctrl: true, action: handleUndo, description: 'Undo' },
    { key: 'y', ctrl: true, action: handleRedo, description: 'Redo' },
    { key: 'z', ctrl: true, shift: true, action: handleRedo, description: 'Redo' },
    { key: 'c', ctrl: true, action: handleCopyLayer, description: 'Copy Layer' },
    { key: 'v', ctrl: true, action: handlePasteLayer, description: 'Paste Layer' },
    { key: 'd', ctrl: true, action: () => selectedLayerIds.length > 0 && handleDuplicateSelected(), description: 'Duplicate Layer(s)' },
    { key: 'Delete', action: () => selectedLayerIds.length > 0 && handleDeleteSelected(), description: 'Delete Layer(s)' },
    { key: 'Backspace', action: () => selectedLayerIds.length > 0 && handleDeleteSelected(), description: 'Delete Layer(s)' },
    { key: 's', ctrl: true, action: () => saveProject(), description: 'Save Project' },
    { key: 'e', ctrl: true, action: () => setShowExport(true), description: 'Export Design' },
    { key: 'g', ctrl: true, action: () => selectedLayerIds.length > 1 && handleGroupSelected(), description: 'Group Layers' },
    { key: 'g', ctrl: true, shift: true, action: () => selectedLayerIds.length > 0 && handleUngroupSelected(), description: 'Ungroup Layers' },
    { key: '?', action: () => setShowShortcuts(prev => !prev), description: 'Toggle Shortcuts Help' },
    // Nudge Shortcuts
    { key: 'ArrowUp', action: () => handleNudgeLayer('up'), description: 'Move Layer Up' },
    { key: 'ArrowDown', action: () => handleNudgeLayer('down'), description: 'Move Layer Down' },
    { key: 'ArrowLeft', action: () => handleNudgeLayer('left'), description: 'Move Layer Left' },
    { key: 'ArrowRight', action: () => handleNudgeLayer('right'), description: 'Move Layer Right' },
    { key: 'ArrowUp', shift: true, action: () => handleNudgeLayer('up', 10), description: 'Move Layer Up (Large)' },
    { key: 'ArrowDown', shift: true, action: () => handleNudgeLayer('down', 10), description: 'Move Layer Down (Large)' },
    { key: 'ArrowLeft', shift: true, action: () => handleNudgeLayer('left', 10), description: 'Move Layer Left (Large)' },
    { key: 'ArrowRight', shift: true, action: () => handleNudgeLayer('right', 10), description: 'Move Layer Right (Large)' },
  ], [handleUndo, handleRedo, handleCopyLayer, handlePasteLayer, handleDuplicateSelected, handleDeleteSelected, saveProject, selectedLayerIds, handleGroupSelected, handleUngroupSelected, handleNudgeLayer]);

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
        handleApplyTheme(theme);
      } else {
        if (quality === 'hd') {
          if (user.plan === 'free') {
            setIsProcessing(false);
            onOpenPricing();
            return;
          }
          // @ts-ignore
          if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
          }
        }
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
    setTextLayers(prev => prev.map(layer => {
      const isHeading = layer.fontSize > 24;
      return { ...layer, color: isHeading ? theme.primaryColor : theme.secondaryColor, fontFamily: isHeading ? theme.headingFont : theme.bodyFont };
    }));
    setShapeLayers(prev => prev.map((layer, index) => {
      const colors = [theme.primaryColor, theme.secondaryColor, theme.accentColor];
      return { ...layer, color: colors[index % colors.length] };
    }));
    setProjectTitle(`${theme.name} Design`);
  }, [saveToHistory]);

  const handleMagicWrite = async (layerId: string) => {
    const layer = textLayers.find(l => l.id === layerId);
    if (!layer || !layer.text.trim()) return;
    setIsProcessing(true);
    try {
      const newText = await geminiService.generateText(layer.text);
      saveToHistory();
      handleUpdateTextLayer(layerId, { text: newText });
    } catch (error) { console.error(error); alert("Magic Write failed. Please try again."); } finally { setIsProcessing(false); }
  };

  const handleDownload = async () => {
    // Open export options dialog
    setShowExport(true);
  };

  const handleConfirmExport = async (
    format: 'png' | 'jpeg' | 'webp' | 'pdf' = 'png',
    quality: number = 0.95,
    size?: { width: number, height: number }
  ) => {
    setIsExporting(true);
    try {
      const backgroundImageUrl = activeImage?.url || uploadedImage;

      if (format === 'pdf') {
        // PDF Export - Simple simulated implementation for now
        // Usually requires jspdf, but we can do a high-res PNG and tell the user it's ready for PDF
        const dataUrl = await exportService.exportDesignToImage(
          size?.width || canvasSize.width,
          size?.height || canvasSize.height,
          canvasBackgroundColor,
          backgroundImageUrl,
          shapeLayers,
          textLayers,
          imageLayers,
          canvasFilters,
          'png',
          1
        );
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
        alert("Preparing PDF... For this demo, we're downloading a high-res design which can be saved as PDF.");
        link.click();
      } else {
        const dataUrl = await exportService.exportDesignToImage(
          size?.width || canvasSize.width,
          size?.height || canvasSize.height,
          canvasBackgroundColor,
          backgroundImageUrl,
          shapeLayers,
          textLayers,
          imageLayers,
          canvasFilters,
          format as 'png' | 'jpeg' | 'webp',
          quality
        );
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setShowExport(false);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export design.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await handleExportDataUrl();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      alert("Design copied to clipboard!");
    } catch (e) {
      console.error(e);
      alert("Failed to copy to clipboard.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBack = async () => {
    // Save thumbnail before exit
    try {
      // Generate a small thumbnail
      const thumb = await exportService.exportDesignToImage(
        300,
        300,
        canvasBackgroundColor,
        activeImage?.url || uploadedImage,
        shapeLayers,
        textLayers,
        imageLayers,
        canvasFilters,
        'png',
        1
      );

      // Update project state in localStorage directly or via state if we had a dedicated project manager hook
      // Since we are exiting, we can just save it.
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        updatedAt: Date.now(),
        thumbnail: thumb,
        state: {
          textLayers,
          shapeLayers,
          imageLayers,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize
        }
      };

      const allProjectsStr = localStorage.getItem('kreathief_projects');
      let allProjects: Project[] = allProjectsStr ? JSON.parse(allProjectsStr) : [];
      const idx = allProjects.findIndex(p => p.id === projectId);
      if (idx >= 0) {
        allProjects[idx] = updatedProject;
      } else {
        allProjects.push(updatedProject);
      }
      localStorage.setItem('kreathief_projects', JSON.stringify(allProjects));

      onBack();
    } catch (e) {
      console.error("Failed to save thumbnail on exit", e);
      onBack();
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const step = 0.1;
      const newZoom = direction === 'in' ? prev + step : prev - step;
      return Math.min(Math.max(newZoom, 0.1), 3); // min 10%, max 300%
    });
  };

  // Mobile State
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-[#121212] overflow-hidden text-[#e5e7eb] font-sans relative">
      <Header
        title={projectTitle}
        onTitleChange={setProjectTitle}
        onBack={onBack}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
        onDownload={() => setShowExport(true)}
        isSaving={isSaving}
        user={user}
        onShare={() => setShowShare(true)}
        onNew={handleNew}
        onSave={saveProject}
        onZoomIn={() => setZoom(prev => Math.min(3, prev + 0.1))}
        onZoomOut={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
        onResetZoom={() => setZoom(1)}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showGrid={showGrid}
        onCopy={() => handleCopyLayer()}
        onPaste={handlePasteLayer}
        onDelete={handleDeleteSelected}
        onDuplicate={handleDuplicateSelected}
        onCut={() => selectedLayerId && handleCutLayer(selectedLayerId)}
        onCopyToClipboard={handleExportDataUrl} // Approximate "Copy Image"
        onRestartTour={onRestartTour}
      />

      <div id="canvas-container" className="flex-1 flex flex-row relative overflow-hidden bg-[#0e1318]">

        {/* Mobile menu trigger is handled by MobileNavBar now, but we keep a floating toggle for convenience if needed, or remove it */}
        <button
          className="md:hidden absolute top-4 left-4 z-30 p-2 bg-[#1e1e1e] border border-gray-700 rounded-lg text-white shadow-xl"
          onClick={() => setIsBottomSheetOpen(true)}
        >
          <Icons.Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar & Panel - Hidden on Mobile */}
        <div className="hidden md:flex flex-row h-full shrink-0 z-40 border-r border-gray-800">
          <ErrorBoundary componentName="Sidebar" variant="widget">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />
            <SidePanel
              activeTab={activeTab}
              mode={mode}
              prompt={prompt}
              setPrompt={setPrompt}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              isProcessing={isProcessing}
              onOpenPricing={onOpenPricing}
              onToggleDesignSuggestions={() => setShowDesignSuggestions(true)}
              onToggleSmartContent={() => setShowSmartContent(true)}
              onToggleQualityScore={() => setShowQualityScore(true)}
              onGenerate={handleGenerate}
              onSetMode={setMode}
              history={history}
              onSelectImage={(img) => { setActiveImageId(img.id); setCanvasFilters(DEFAULT_FILTERS); }}
              onClearHistory={() => setHistory([])}
              onFileUpload={handleFileUpload}
              uploadedImage={uploadedImage}
              onAddText={handleAddText}
              onAddShape={handleAddShape}
              onAddImageLayer={handleAddImageLayer}
              onApplyTemplate={handleApplyTemplate}
              textLayers={textLayers}
              shapeLayers={shapeLayers}
              imageLayers={imageLayers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={handleSelectLayerWrapper}
              onDeleteLayer={handleDeleteLayer}
              onUpdateTextLayer={handleUpdateTextLayer}
              onUpdateShapeLayer={handleUpdateShapeLayer}
              onUpdateImageLayer={handleUpdateImageLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onMoveLayer={handleMoveLayer}
              onLayoutLayers={handleLayoutLayers}
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushType={brushType}
              setBrushType={setBrushType}
              isDrawing={isDrawing}
              setIsDrawing={setIsDrawing}
              brushOpacity={brushOpacity}
              setBrushOpacity={setBrushOpacity}
              onFinishDrawing={() => { if (!isEraserActive) setIsDrawing(false) }}
              onApplyLayout={handleApplyLayout}
              brandKits={brandKits}
              onAddBrandKit={handleAddBrandKit}
              onDeleteBrandKit={handleDeleteBrandKit}
              onApplyBrandColors={handleApplyBrandColors}
              onApplyBrandFonts={handleApplyBrandFonts}
              onApplyTexture={(url) => setCanvasFilters(prev => ({ ...prev, overlayTexture: url }))}
              onRemoveTexture={() => setCanvasFilters(prev => ({ ...prev, overlayTexture: undefined }))}
              currentTexture={canvasFilters.overlayTexture}
              getCanvasSnapshot={handleExportDataUrl}
              quality={quality}
              setQuality={setQuality}
              uploads={uploads}
              onDeleteUpload={handleDeleteUpload}
            />
          </ErrorBoundary>
        </div>

        <ErrorBoundary componentName="Canvas" variant="widget">
          <Canvas
            activeImage={activeImage}
            uploadedImage={uploadedImage}
            isProcessing={isProcessing}
            zoom={zoom}
            onZoomChange={setZoom}
            canvasBackgroundColor={canvasBackgroundColor}
            onSetCanvasBackgroundColor={setCanvasBackgroundColor}
            canvasFilters={canvasFilters}
            onUpdateCanvasFilters={handleUpdateCanvasFilters}
            textLayers={textLayers}
            shapeLayers={shapeLayers}
            imageLayers={imageLayers}
            onUpdateTextLayer={handleUpdateTextLayer}
            onUpdateShapeLayer={handleUpdateShapeLayer}
            onUpdateImageLayer={handleUpdateImageLayer}
            onUpdateLayers={handleUpdateLayers}
            onSelectLayer={handleSelectLayerWrapper}
            onDeleteLayer={handleDeleteLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onMoveLayer={handleMoveLayer}
            onGroup={handleGroupSelected}
            onUngroup={handleUngroupSelected}
            onVectorDrawingComplete={handleVectorDrawingComplete}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            onMultiSelectLayer={handleMultiSelectLayer}
            onInteractionStart={saveToHistory}
            onMagicWrite={handleMagicWrite}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            isDrawing={isDrawing}
            brushColor={brushColor}
            brushSize={brushSize}
            brushType={brushType}
            brushOpacity={brushOpacity}
            onDrawingComplete={isEraserActive ? handleEraserComplete : handleDrawingComplete}
            onRemix={handleRemix}
            canvasSize={canvasSize}
            onSetCanvasSize={setCanvasSize}
            user={user}
            onOpenPricing={onOpenPricing}
            onFileUpload={handleFileUpload}
            onToggleDesignSuggestions={() => setShowDesignSuggestions(true)}
            onToggleSmartContent={() => setShowSmartContent(true)}
            onToggleQualityScore={() => setShowQualityScore(true)}
          />
        </ErrorBoundary>
      </div>

      {isEraserActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-full shadow-2xl z-[60] flex items-center gap-4 animate-bounce-in border border-red-500/50 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-sm font-bold">Magic Eraser Active</span>
            <span className="text-[10px] opacity-80">Paint over object to remove</span>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <button onClick={() => setIsDrawing(false)} className="bg-white text-red-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors">Apply</button>
          <button onClick={handleToggleEraser} className="text-white/80 hover:text-white text-xs font-medium underline">Cancel</button>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center">
          <div className="text-white flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium text-lg">Exporting your design...</p>
          </div>
        </div>
      )}

      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          designTitle={projectTitle}
          onGetShareLink={async () => {
            const projectToShare: Project = {
              id: projectId,
              name: projectTitle,
              updatedAt: Date.now(),
              thumbnail: thumbnail,
              state: {
                textLayers,
                shapeLayers,
                imageLayers,
                canvasBackgroundColor,
                canvasFilters,
                canvasSize
              }
            };
            // Dynamically import to separate chunk
            const { generateShareLink } = await import('../utils/shareUtils');
            return generateShareLink(projectToShare);
          }}
        />
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowShortcuts(false)}>
          <div className="bg-[#1a1c1e] rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-8">
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Keyboard Power</h3>
              <p className="text-gray-400">Master these shortcuts to design at the speed of thought.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Tools</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Select Tool', keys: ['V'] },
                      { label: 'Hand Tool', keys: ['H'] },
                      { label: 'Text Tool', keys: ['T'] },
                      { label: 'Rectangle', keys: ['R'] },
                      { label: 'Circle', keys: ['C'] },
                      { label: 'Image Upload', keys: ['I'] },
                      { label: 'Pencil / Draw', keys: ['P'] },
                      { label: 'Eraser', keys: ['E'] },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{item.label}</span>
                        <div className="flex gap-1.5">
                          {item.keys.map((k, j) => (
                            <kbd key={j} className="min-w-[2.5rem] h-7 flex items-center justify-center bg-[#252627] border-b-2 border-gray-900 rounded-md text-[10px] font-bold text-gray-300 font-mono shadow-sm">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-[#7d2ae8] uppercase tracking-[0.2em] mb-4">Actions</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Undo', keys: ['Ctrl', 'Z'] },
                      { label: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
                      { label: 'Copy Layer', keys: ['Ctrl', 'C'] },
                      { label: 'Paste Layer', keys: ['Ctrl', 'V'] },
                      { label: 'Cut Layer', keys: ['Ctrl', 'X'] },
                      { label: 'Duplicate', keys: ['Ctrl', 'D'] },
                      { label: 'Delete Layer', keys: ['Del'] },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{item.label}</span>
                        <div className="flex gap-1.5">
                          {item.keys.map((k, j) => (
                            <kbd key={j} className="min-w-[2.5rem] h-7 flex items-center justify-center bg-[#252627] border-b-2 border-gray-900 rounded-md text-[10px] font-bold text-gray-300 font-mono shadow-sm">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8 mt-8 md:mt-0">
                <div>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">View</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Zoom In', keys: ['Ctrl', '+'] },
                      { label: 'Zoom Out', keys: ['Ctrl', '-'] },
                      { label: 'Reset Zoom', keys: ['Ctrl', '0'] },
                      { label: 'Toggle Grid', keys: ['G'] },
                      { label: 'Shortcuts Help', keys: ['?'] },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{item.label}</span>
                        <div className="flex gap-1.5">
                          {item.keys.map((k, j) => (
                            <kbd key={j} className="min-w-[2.5rem] h-7 flex items-center justify-center bg-[#252627] border-b-2 border-gray-900 rounded-md text-[10px] font-bold text-gray-300 font-mono shadow-sm">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-4">Canvas Control</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Move Layer', keys: ['Arrows'] },
                      { label: 'Move (x10)', keys: ['Shift', 'Arrows'] },
                      { label: 'Multi-Select', keys: ['Ctrl', 'Click'] },
                      { label: 'Range Select', keys: ['Shift', 'Click'] },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{item.label}</span>
                        <div className="flex gap-1.5">
                          {item.keys.map((k, j) => (
                            <kbd key={j} className="min-w-[2.5rem] h-7 flex items-center justify-center bg-[#252627] border-b-2 border-gray-900 rounded-md text-[10px] font-bold text-gray-300 font-mono shadow-sm">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8 mt-8 md:mt-0">
                <div>
                  <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4">Project</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Save Project', keys: ['Ctrl', 'S'] },
                      { label: 'Export Design', keys: ['Ctrl', 'E'] },
                      { label: 'New Design', keys: ['Ctrl', 'N'] },
                      { label: 'Open Project', keys: ['Ctrl', 'O'] },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{item.label}</span>
                        <div className="flex gap-1.5">
                          {item.keys.map((k, j) => (
                            <kbd key={j} className="min-w-[2.5rem] h-7 flex items-center justify-center bg-[#252627] border-b-2 border-gray-900 rounded-md text-[10px] font-bold text-gray-300 font-mono shadow-sm">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800 flex justify-center">
              <button
                onClick={() => setShowShortcuts(false)}
                className="px-8 py-3 bg-[#7d2ae8] hover:bg-[#6b21c1] text-white rounded-full font-bold text-sm shadow-xl shadow-[#7d2ae8]/20 transition-all active:scale-95"
                autoFocus
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          currentSize={canvasSize}
          onExport={handleConfirmExport}
        />
      )}

      {/* AI Features Modals */}
      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        isProcessing={isProcessing}
      />

      <DesignSuggestions
        isOpen={showDesignSuggestions}
        onClose={() => setShowDesignSuggestions(false)}
        designContext={`${projectTitle} design`}
        layers={[...textLayers, ...shapeLayers, ...imageLayers]}
        canvasSize={canvasSize}
        onApplySuggestion={(suggestion) => {
          if (suggestion.action === 'layout' && suggestion.data) {
            const layoutMap = new Map(suggestion.data.map((l: any) => [l.id, l]));

            // Bulk Update Text
            textLayers.forEach(l => {
              const newL = layoutMap.get(l.id) as any;
              if (newL) handleUpdateTextLayer(l.id, { x: newL.x, y: newL.y, width: newL.width });
            });
            // Bulk Update Shapes
            shapeLayers.forEach(l => {
              const newL = layoutMap.get(l.id) as any;
              if (newL) handleUpdateShapeLayer(l.id, { x: newL.x, y: newL.y, width: newL.width, height: newL.height });
            });
            // Bulk Update Images
            imageLayers.forEach(l => {
              const newL = layoutMap.get(l.id) as any;
              if (newL) handleUpdateImageLayer(l.id, { x: newL.x, y: newL.y, width: newL.width, height: newL.height });
            });
          }
          else if (suggestion.action === 'theme' && suggestion.data) {
            const theme = suggestion.data;
            if (theme.backgroundColor) setCanvasBackgroundColor(theme.backgroundColor);

            // Update shapes with Primary/Secondary randomly if not white/black? 
            // Simple logic: If Shape is 'white' or 'gray', color it?
            // Actually, theme usually implies systematic coloring.
            // Let's just update all shapes to primary/secondary for now to be visible.
            shapeLayers.forEach((l, idx) => {
              handleUpdateShapeLayer(l.id, { color: idx % 2 === 0 ? theme.primaryColor : theme.secondaryColor });
            });
            textLayers.forEach(l => {
              handleUpdateTextLayer(l.id, { color: theme.primaryColor });
            });
          }
          else if (suggestion.action === 'typography' && suggestion.data) {
            const theme = suggestion.data;
            loadFonts([theme.headingFont, theme.bodyFont]); // Lazy load first

            textLayers.forEach(l => {
              // Heuristic: Short text = Heading, Long text = Body
              const isHeading = l.text.length < 20 || l.fontSize > 30;
              handleUpdateTextLayer(l.id, { fontFamily: isHeading ? theme.headingFont : theme.bodyFont });
            });
          }
        }}
      />

      <SmartContentGenerator
        isOpen={showSmartContent}
        onClose={() => setShowSmartContent(false)}
        onSelectContent={(content) => {
          handleAddText({ text: content });
          setShowSmartContent(false);
        }}
        designContext={projectTitle}
      />

      <DesignQualityScorer
        isOpen={showQualityScore}
        onClose={() => setShowQualityScore(false)}
        designImage={activeImage?.url || uploadedImage || undefined}
      />

      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsBottomSheetOpen(true);
        }}
      />

      {/* Mobile Bottom Sheet for Tools */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={activeTab}
      >
        <SidePanel
          activeTab={activeTab}
          mode={mode}
          prompt={prompt}
          setPrompt={setPrompt}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          isProcessing={isProcessing}
          onOpenPricing={onOpenPricing}
          onToggleDesignSuggestions={() => setShowDesignSuggestions(true)}
          onToggleSmartContent={() => setShowSmartContent(true)}
          onToggleQualityScore={() => setShowQualityScore(true)}
          onGenerate={handleGenerate}
          onSetMode={setMode}
          history={history}
          onSelectImage={(img) => { setActiveImageId(img.id); setCanvasFilters(DEFAULT_FILTERS); setIsBottomSheetOpen(false); }}
          onClearHistory={() => setHistory([])}
          onFileUpload={handleFileUpload}
          uploadedImage={uploadedImage}
          onAddText={(style) => { handleAddText(style); setIsBottomSheetOpen(false); }}
          onAddShape={(type, style) => { handleAddShape(type, style); setIsBottomSheetOpen(false); }}
          onAddImageLayer={(src) => { handleAddImageLayer(src); setIsBottomSheetOpen(false); }}
          onApplyTemplate={(id, confirm) => { handleApplyTemplate(id); setIsBottomSheetOpen(false); }}
          textLayers={textLayers}
          shapeLayers={shapeLayers}
          imageLayers={imageLayers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={handleSelectLayerWrapper}
          onDeleteLayer={handleDeleteLayer}
          onUpdateTextLayer={handleUpdateTextLayer}
          onUpdateShapeLayer={handleUpdateShapeLayer}
          onUpdateImageLayer={handleUpdateImageLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onMoveLayer={handleMoveLayer}
          onLayoutLayers={handleLayoutLayers}
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          brushType={brushType}
          setBrushType={setBrushType}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          brushOpacity={brushOpacity}
          setBrushOpacity={setBrushOpacity}
          onFinishDrawing={() => { if (!isEraserActive) setIsDrawing(false) }}
          onApplyLayout={handleApplyLayout}
          brandKits={brandKits}
          onAddBrandKit={handleAddBrandKit}
          onDeleteBrandKit={handleDeleteBrandKit}
          onApplyBrandColors={handleApplyBrandColors}
          onApplyBrandFonts={handleApplyBrandFonts}
          onApplyTexture={(url) => { setCanvasFilters(prev => ({ ...prev, overlayTexture: url })); setIsBottomSheetOpen(false); }}
          onRemoveTexture={() => setCanvasFilters(prev => ({ ...prev, overlayTexture: undefined }))}
          currentTexture={canvasFilters.overlayTexture}
          getCanvasSnapshot={handleExportDataUrl}
          quality={quality}
          setQuality={setQuality}
          uploads={uploads}
          onDeleteUpload={handleDeleteUpload}
        />
      </BottomSheet>

      {showSavedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-[#1e1e1e]/90 backdrop-blur-md border border-gray-700 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Icons.Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold text-white">Project Saved</span>
        </div>
      )}
    </div>
  );
};
