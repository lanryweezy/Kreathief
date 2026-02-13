
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
import { AppMode, AspectRatio, GeneratedImage, NavTab, TextLayer, ShapeLayer, ImageLayer, Layer, HistoryState, CanvasFilters, Project, DesignTheme, BrandKit, CanvasSize, GenerationQuality, User, BrushType } from '../types';
import * as geminiService from '../services/geminiService';
import * as exportService from '../services/exportService';
import { storageService } from '../services/storageService';
import { MODEL_FAST, Icons, FONT_FAMILIES, CANVAS_W, CANVAS_H } from '../constants';
const PADDING = 20;
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
  const [showRulers, setShowRulers] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [fontPreview, setFontPreview] = useState<string | null>(null);
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

  const [layers, setLayers] = useState<Layer[]>(initialProject?.state.layers || []);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);

  // Derived slices for components that haven't been refactored yet
  const textLayers = useMemo(() => layers.filter(l => l.type === 'text') as TextLayer[], [layers]);
  const shapeLayers = useMemo(() => layers.filter(l => l.type !== 'text' && l.type !== 'image') as ShapeLayer[], [layers]);
  const imageLayers = useMemo(() => layers.filter(l => l.type === 'image') as ImageLayer[], [layers]);

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
      setLayers(initialProject.state.layers || []);
      setCanvasBackgroundColor(initialProject.state.canvasBackgroundColor);
      setCanvasFilters(initialProject.state.canvasFilters);
      if (initialProject.state.canvasSize) setCanvasSize(initialProject.state.canvasSize);
      if (initialProject.thumbnail) setThumbnail(initialProject.thumbnail);
    }
  }, [initialProject, projectId]);

  // Load fonts used in text layers - optimized to avoid excessive checks
  const lastFontsRef = useRef<string>('');
  useEffect(() => {
    const textLayers = layers.filter(l => l.type === 'text') as TextLayer[];
    const uniqueFonts = Array.from(new Set(textLayers.map(l => l.fontFamily))).sort();
    const fontsKey = uniqueFonts.join(',');
    if (fontsKey !== lastFontsRef.current && uniqueFonts.length > 0) {
      lastFontsRef.current = fontsKey;
      loadFonts(uniqueFonts);
    }
  }, [layers]);

  // -- Auto-Save & Crash Recovery --

  // 1. Recover on mount
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
  }, [initialProject]);

  // -- Silent Autosave Logic --
  useEffect(() => {
    // Only save if we have actual content (avoid saving blank initial state over existing project)
    if (layers.length === 0) return;

    const timer = setTimeout(() => {
      saveProject();
    }, 3000); // 3 second debounce

    return () => clearTimeout(timer);
  }, [layers, canvasBackgroundColor, canvasFilters, canvasSize, projectTitle]);

  // 2. Optimized persistence (Debounced + Unified)
  // 2. Optimized persistence (Debounced + Unified)
  useEffect(() => {
    if (layers.length === 0) return;

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        updatedAt: Date.now(),
        thumbnail: thumbnail,
        state: {
          layers,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize
        }
      };

      try {
        await storageService.saveProject(updatedProject);
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
    }, 5000);

    return () => clearTimeout(timeout);
  }, [layers, canvasBackgroundColor, canvasFilters, projectTitle, projectId, canvasSize]);

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

  // Removed redundant auto-save block (was consolidated above)

  // -- Layer Management Helpers --



  // Refs for layers to avoid saveToHistory dependency churn
  const layersRef = useRef(layers);
  layersRef.current = layers;
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
        layers: layersRef.current.map(l => ({ ...l })),
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
    const currentState: HistoryState = { layers, canvasBackgroundColor, canvasFilters, canvasSize };
    setFuture(prev => [currentState, ...prev]);
    setPast(newPast);
    setLayers(previousState.layers);
    setCanvasBackgroundColor(previousState.canvasBackgroundColor);
    setCanvasFilters(previousState.canvasFilters);
    if (previousState.canvasSize) setCanvasSize(previousState.canvasSize);
  }, [past, layers, canvasBackgroundColor, canvasFilters, canvasSize]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextState = future[0];
    const newFuture = future.slice(1);
    const currentState: HistoryState = { layers, canvasBackgroundColor, canvasFilters, canvasSize };
    setPast(prev => [...prev, currentState]);
    setFuture(newFuture);
    setLayers(nextState.layers);
    setCanvasBackgroundColor(nextState.canvasBackgroundColor);
    setCanvasFilters(nextState.canvasFilters);
    if (nextState.canvasSize) setCanvasSize(nextState.canvasSize);
  }, [future, layers, canvasBackgroundColor, canvasFilters, canvasSize]);


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
    setLayers(prev => [...prev, newLayer]);
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
    setLayers(prev => [...prev, newLayer]);
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
    setLayers(prev => [...prev, ...newLayers]);
  };

  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = STARTER_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    if (layers.length > 0) {
      if (!confirm("Are you sure? This will replace your current design.")) return;
    }

    saveToHistory();
    const { state } = template;
    setCanvasBackgroundColor(state.canvasBackgroundColor);
    if (state.canvasSize) setCanvasSize(state.canvasSize);
    if (state.canvasFilters) setCanvasFilters(state.canvasFilters);

    if (state.layers) {
      setLayers(state.layers.map((l: Layer) => ({
        ...l,
        id: `${l.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })));
    }
  }, [layers.length, saveToHistory]);

  const saveProject = async () => {
    setIsSaving(true);
    try {
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        updatedAt: Date.now(),
        thumbnail: await handleExportDataUrl(),
        state: {
          layers,
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
      // Remove any 'last_session' backup to prevent the restore nagging
      localStorage.removeItem('kreathief_last_session');
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
      setLayers([]);
      setUploadedImage(null);
      setCanvasBackgroundColor('#ffffff');
      setPast([]);
      setFuture([]);
    }
  };

  const handleAddImageLayers = (srcs: string[]) => {
    saveToHistory();
    const newLayers: ImageLayer[] = srcs.map((src, index) => ({
      id: `image_${Date.now()}_${index}`,
      type: 'image',
      name: 'Image Layer',
      src,
      x: 100 + (index * 20), // Stagger positions
      y: 100 + (index * 20),
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
    }));

    // Handle aspect ratios asynchronously
    newLayers.forEach(layer => {
      const img = new Image();
      img.src = layer.src;
      img.onload = () => {
        const max = 300;
        const ratio = img.width / img.height;
        let w = max;
        let h = max;
        if (ratio > 1) { h = w / ratio; } else { w = h * ratio; }
        setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, width: w, height: h } as Layer : l));
      };
    });

    setLayers(prev => [...prev, ...newLayers]);
    setSelectedLayerIds(newLayers.map(l => l.id)); // Select all new layers
  };

  const handleAddImageLayer = (src: string) => handleAddImageLayers([src]);

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
    setLayers(prev => [...prev, newLayer]);
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
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  };


  const handleUpdateTextLayer = useCallback((id: string, changes: Partial<TextLayer>) => {
    setLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...changes } as Layer : layer));
  }, []);

  const handleUpdateShapeLayer = useCallback((id: string, changes: Partial<ShapeLayer>) => {
    setLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...changes } as Layer : layer));
  }, []);

  const handleUpdateImageLayer = useCallback((id: string, changes: Partial<ImageLayer>) => {
    setLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...changes } as Layer : layer));
  }, []);

  // Optimized batched update for multiple layers
  const handleUpdateLayers = useCallback((updates: Record<string, any>) => {
    const updatedIds = Object.keys(updates);
    if (updatedIds.length === 0) return;

    setLayers(prev => prev.map(l => updates[l.id] ? { ...l, ...updates[l.id] } : l));
  }, []);

  const handlePasteLayer = useCallback(() => {
    if (!clipboardLayer) return;
    saveToHistory();
    const newLayer = { ...clipboardLayer, id: `${clipboardLayer.type}_${Date.now()}`, x: clipboardLayer.x + 20, y: clipboardLayer.y + 20, name: clipboardLayer.name + ' Copy' };
    if (clipboardLayer.type === 'text') setLayers(prev => [...prev, newLayer]);
    else if (clipboardLayer.type === 'image') setLayers(prev => [...prev, newLayer]);
    else setLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
  }, [clipboardLayer, saveToHistory]);

  const handleCopyLayer = useCallback((id?: string) => {
    const targetId = id || selectedLayerId;
    if (!targetId) return;
    const layer = layers.find(l => l.id === targetId);
    if (layer) {
      setClipboardLayer(JSON.parse(JSON.stringify(layer)));
    }
  }, [selectedLayerId, layers]);

  const handleNudgeLayer = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount: number = 1) => {
    if (selectedLayerIds.length === 0) return;
    const updateLayer = (id: string, changes: any) => {
      const type = findLayerType(id);
      if (type === 'text') handleUpdateTextLayer(id, changes);
      else if (type === 'shape') handleUpdateShapeLayer(id, changes);
      else if (type === 'image') handleUpdateImageLayer(id, changes);
    };

    selectedLayerIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (layer) {
        if (direction === 'up') handleUpdateLayers({ [id]: { y: layer.y - amount } });
        else if (direction === 'down') handleUpdateLayers({ [id]: { y: layer.y + amount } });
        else if (direction === 'left') handleUpdateLayers({ [id]: { x: layer.x - amount } });
        else if (direction === 'right') handleUpdateLayers({ [id]: { x: layer.x + amount } });
      }
    });
  }, [selectedLayerIds, layers, handleUpdateLayers]);

  const handleDeleteLayer = useCallback((id: string) => {
    saveToHistory();
    setLayers(prev => prev.filter(layer => layer.id !== id));
    setSelectedLayerIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [saveToHistory]);

  const handleDeleteSelected = useCallback(() => {
    saveToHistory();
    if (selectedLayerIds.length === 0) return;
    setLayers(prev => prev.filter(layer => !selectedLayerIds.includes(layer.id)));
    setSelectedLayerIds([]);
    setSelectedLayerId(null);
  }, [selectedLayerIds, saveToHistory]);


  // -- Grouping Logic --
  const handleGroupSelected = useCallback(() => {
    if (selectedLayerIds.length < 2) return;
    saveToHistory();
    const newGroupId = `group_${Date.now()}`;

    setLayers(prev => prev.map(l => selectedLayerIds.includes(l.id) ? { ...l, groupId: newGroupId } : l));
  }, [selectedLayerIds, saveToHistory]);

  const handleUngroupSelected = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    saveToHistory();

    // Find if selection has a group ID (use the first one found)
    const selectedItems = layers.filter(l => selectedLayerIds.includes(l.id));
    const targetGroupId = selectedItems.find(l => l.groupId)?.groupId;

    if (!targetGroupId) return;

    setLayers(prev => prev.map(l => l.groupId === targetGroupId ? { ...l, groupId: undefined } : l));
  }, [selectedLayerIds, layers, saveToHistory]);

  // Optimized selection handler using refs for stability
  const handleSelectLayerWrapper = useCallback((id: string | null) => {
    if (!id) {
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
      return;
    }

    const targetLayer = layersRef.current.find(l => l.id === id);

    if (targetLayer?.groupId) {
      // Select all members of this group
      const groupMembers = layersRef.current.filter(l => l.groupId === targetLayer.groupId);
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
    const layerToCopy = layers.find(l => l.id === id);
    if (layerToCopy) {
      const newLayer = { ...layerToCopy, id: `${layerToCopy.type}_${Date.now()}`, x: layerToCopy.x + 20, y: layerToCopy.y + 20, name: layerToCopy.name + ' Copy' };
      setLayers(prev => [...prev, newLayer]);
      setTimeout(() => setSelectedLayerIds([newLayer.id]), 0);
    }
  }, [saveToHistory, layers]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    saveToHistory();
    const newIds: string[] = [];

    const processLayers = (prevLayers: Layer[]) => {
      const result: Layer[] = [];
      prevLayers.forEach(l => {
        result.push(l);
        if (selectedLayerIds.includes(l.id)) {
          const newLayer = { ...l, id: `${l.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, x: l.x + 20, y: l.y + 20, name: l.name + ' Copy' };
          newIds.push(newLayer.id);
          result.push(newLayer);
        }
      });
      return result;
    };

    setLayers(prev => processLayers(prev));

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
    const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));
    if (selectedLayers.length === 0) return;

    // Calculate bounds of the selection
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedLayers.forEach(l => {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.width);
      maxY = Math.max(maxY, l.y + ((l as any).height || (l.type === 'text' ? (l as TextLayer).fontSize : 0)));
    });

    const alignMap = new Map<string, { x?: number, y?: number }>();
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    selectedLayers.forEach(l => {
      let newX = l.x;
      let newY = l.y;
      const h = (l as any).height || (l.type === 'text' ? (l as TextLayer).fontSize : 0);

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

    setLayers(prev => prev.map(l => alignMap.has(l.id) ? { ...l, ...alignMap.get(l.id) } : l));
  }, [selectedLayerIds, layers, saveToHistory]);

  const handleDistributeLayers = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedLayerIds.length < 3) return; // Need 3 to distribute
    saveToHistory();

    const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));

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
      const h1 = (first as any).height || (first.type === 'text' ? (first as TextLayer).fontSize : 0);
      const h2 = (last as any).height || (last.type === 'text' ? (last as TextLayer).fontSize : 0);
      const totalSpan = (last.y + h2 / 2) - (first.y + h1 / 2);
      const step = totalSpan / (selectedLayers.length - 1);
      selectedLayers.forEach((l, i) => {
        const h = (l as any).height || (l.type === 'text' ? (l as TextLayer).fontSize * 1.2 : 0);
        const centerY = (first.y + h1 / 2) + step * i;
        alignMap.set(l.id, { y: centerY - h / 2 });
      });
    }

    setLayers(prev => prev.map(l => alignMap.has(l.id) ? { ...l, ...alignMap.get(l.id) } : l));
  }, [selectedLayerIds, layers, saveToHistory]);

  const handleMoveLayer = useCallback((id: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    saveToHistory();
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const item = newArr.splice(idx, 1)[0];
      let newIndex = idx;
      if (direction === 'front') newIndex = newArr.length;
      if (direction === 'back') newIndex = 0;
      if (direction === 'forward') newIndex = Math.min(newArr.length, idx + 1);
      if (direction === 'backward') newIndex = Math.max(0, idx - 1);
      newArr.splice(newIndex, 0, item);
      return newArr;
    });
  }, [saveToHistory]);

  const handleUpdateCanvasFilters = useCallback((changes: Partial<CanvasFilters>) => {
    saveToHistory();
    setCanvasFilters(prev => ({ ...prev, ...changes }));
  }, [saveToHistory]);

  // Auto Layout Logic
  const handleLayoutLayers = (type: 'grid' | 'row' | 'col') => {
    saveToHistory();
    const allLayers = layers.filter(l => !l.locked && l.visible);

    if (allLayers.length === 0) return;
    const sortedLayers = [...allLayers].sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const count = sortedLayers.length;
    let newPositions: { id: string, x: number, y: number }[] = [];
    const getHeight = (l: any) => l.height || (l.type === 'text' ? l.fontSize * 1.2 : 40);

    if (type === 'row') {
      const totalWidth = sortedLayers.reduce((acc, l) => acc + l.width, 0);
      const spacing = (CANVAS_W - 2 * PADDING - totalWidth) / (count - 1 > 0 ? count - 1 : 1);
      let currentX = PADDING;
      const centerY = CANVAS_H / 2;
      sortedLayers.forEach(l => { newPositions.push({ id: l.id, x: count === 1 ? (CANVAS_W - l.width) / 2 : currentX, y: centerY - getHeight(l) / 2 }); currentX += l.width + Math.max(0, spacing); });
    } else if (type === 'col') {
      const totalHeight = sortedLayers.reduce((acc, l) => acc + getHeight(l), 0);
      const spacing = (CANVAS_H - 2 * PADDING - totalHeight) / (count - 1 > 0 ? count - 1 : 1);
      let currentY = PADDING;
      const centerX = CANVAS_W / 2;
      sortedLayers.forEach(l => { newPositions.push({ id: l.id, x: centerX - l.width / 2, y: count === 1 ? (CANVAS_H - getHeight(l)) / 2 : currentY }); currentY += getHeight(l) + Math.max(0, spacing); });
    } else if (type === 'grid') {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = (CANVAS_W - 2 * PADDING) / cols;
      const cellH = (CANVAS_H - 2 * PADDING) / rows;
      sortedLayers.forEach((l, i) => { const col = i % cols; const row = Math.floor(i / cols); const cellCenterX = PADDING + col * cellW + cellW / 2; const cellCenterY = PADDING + row * cellH + cellH / 2; newPositions.push({ id: l.id, x: cellCenterX - l.width / 2, y: cellCenterY - getHeight(l) / 2 }); });
    }

    setLayers(prev => prev.map(l => { const pos = newPositions.find(p => p.id === l.id); return pos ? { ...l, x: pos.x, y: pos.y } : l; }));
  };

  // Brand Kit Handlers
  const handleAddBrandKit = (kit: BrandKit) => { setBrandKits(prev => [...prev, kit]); };
  const handleUpdateBrandKit = (id: string, updates: Partial<BrandKit>) => {
    setBrandKits(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  };
  const handleDeleteBrandKit = (id: string) => { setBrandKits(prev => prev.filter(k => k.id !== id)); };
  const handleApplyBrandColors = (colors: string[]) => {
    saveToHistory();
    if (colors.length > 0) setCanvasBackgroundColor(colors[0]);
    const palette = colors.length > 1 ? colors.slice(1) : colors;

    setLayers(prev => prev.map(l => {
      if (l.type === 'text') return { ...l, color: palette[0] } as Layer;
      return { ...l, color: palette[Math.floor(Math.random() * palette.length)] } as Layer;
    }));
  };
  const handleApplyBrandFonts = (headingFont: string, bodyFont: string) => {
    saveToHistory();
    setLayers(prev => prev.map(l => {
      if (l.type !== 'text') return l;
      const isHeading = (l as TextLayer).fontSize > 24 || (l as TextLayer).fontWeight === 'bold' || (l as TextLayer).fontWeight === '800';
      return { ...l, fontFamily: isHeading ? headingFont : bodyFont } as Layer;
    }));
  };

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
      layers.filter(l => l.type !== 'text' && l.type !== 'image') as ShapeLayer[],
      layers.filter(l => l.type === 'text') as TextLayer[],
      layers.filter(l => l.type === 'image') as ImageLayer[],
      canvasFilters
    );
  }

  const handleToggleEraser = () => {
    if (isEraserActive) { drawingCancelRef.current = true; setIsEraserActive(false); setIsDrawing(false); }
    else {
      if (!selectedLayerId || !layers.find(l => l.id === selectedLayerId && l.type === 'image')) { alert("Please select an image layer first."); return; }
      drawingCancelRef.current = false; setIsEraserActive(true); setIsDrawing(true); setBrushColor('rgba(255, 0, 0, 0.5)'); setBrushSize(20); setBrushOpacity(0.5);
    }
  };

  const handleEraserComplete = async (maskDataUrl: string) => {
    if (drawingCancelRef.current) { drawingCancelRef.current = false; return; }
    const layer = layers.find(l => l.id === selectedLayerId && l.type === 'image') as ImageLayer | undefined;
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

        handleAddImageLayers(validUrls);
        setCanvasFilters(DEFAULT_FILTERS);
        if (activeTab === NavTab.MAGIC) { setMode(AppMode.EDIT); }
      }
    });
  };

  const handleFileUpload = (files: File[]) => handleFileUploads(files);

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
    setLayers(prev => prev.map((layer, index) => {
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
    format: 'png' | 'jpeg' | 'webp' | 'pdf' = 'png',
    quality: number = 0.95,
    size?: { width: number, height: number }
  ) => {
    setIsExporting(true);
    try {
      const backgroundImageUrl = activeImage?.url || uploadedImage;
      const dataUrl = await exportService.exportDesignToImage(
        size?.width || canvasSize.width,
        size?.height || canvasSize.height,
        canvasBackgroundColor,
        backgroundImageUrl,
        shapeLayers,
        textLayers,
        imageLayers,
        canvasFilters,
        format === 'pdf' ? 'png' : (format as 'png' | 'jpeg' | 'webp'),
        quality
      );
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${format === 'pdf' ? 'png' : format}`;
      link.click();
      setShowExport(false);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddTextLayer = (style: Partial<TextLayer> = {}) => {
    saveToHistory();
    const newLayer: TextLayer = {
      id: `text_${Date.now()}`,
      type: 'text',
      name: 'Text',
      text: style.text || 'Add your text',
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 25,
      width: 200,
      rotation: 0,
      fontSize: style.fontSize || 40,
      fontWeight: style.fontWeight || '700',
      fontStyle: (style.fontStyle as "normal" | "italic") || 'normal',
      color: style.color || '#000000',
      fontFamily: style.fontFamily || 'Inter',
      textAlign: (style.textAlign as "left" | "center" | "right" | "justify") || 'center',
      textDecoration: 'none',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      opacity: 1,
      visible: true,
      locked: false,
      ...style
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
    setSelectedLayerId(newLayer.id);
  };

  const handleAddShapeLayer = (type: any, style: Partial<ShapeLayer> = {}) => {
    saveToHistory();
    const newLayer: ShapeLayer = {
      id: `shape_${Date.now()}`,
      type,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      color: style.color || '#333333',
      opacity: 1,
      visible: true,
      locked: false,
      cornerRadius: 0,
      ...style
    };
    setLayers(prev => [...prev, newLayer]);

    setSelectedLayerIds([newLayer.id]);
    setSelectedLayerId(newLayer.id);
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

  const handleApplyDesignSuggestion = (suggestion: any) => {
    console.log("Applying suggestion:", suggestion);
  };

  // -- Final Professional Render --
  return (
    <div className="flex flex-col h-screen bg-[#0e1318] overflow-hidden text-[#e5e7eb] font-sans">
      <Header
        title={projectTitle}
        onTitleChange={setProjectTitle}
        isSaving={isSaving}
        onSave={handleSave}
        onDownload={handleExport}
        onBack={onBack}
        user={user}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onZoomIn={() => handleZoom('in')}
        onZoomOut={() => handleZoom('out')}
        onResetZoom={() => setZoom(1)}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showGrid={showGrid}
        onRestartTour={onRestartTour}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar & Panel */}
        <div className="hidden md:flex flex-row h-full shrink-0 z-40 border-r border-gray-800">
          <ErrorBoundary componentName="Sidebar" variant="widget">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />
            <SidePanel
              activeTab={activeTab}
              mode={mode}
              onSetMode={setMode}
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
              history={history}
              onSelectImage={handleSelectImage}
              onClearHistory={() => setHistory([])}
              onFileUpload={handleFileUpload}
              uploadedImage={uploadedImage}
              onAddText={handleAddTextLayer}
              onAddShape={handleAddShapeLayer}
              textLayers={textLayers}
              shapeLayers={shapeLayers}
              imageLayers={imageLayers}
              selectedLayerId={selectedLayerId}
              onLayoutLayers={handleLayoutLayers}
              onDeleteLayer={handleDeleteLayer}
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
              onUpdateBrandKit={handleUpdateBrandKit}
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
              onSelectLayer={handleSelectLayerWrapper}
              onUpdateTextLayer={handleUpdateTextLayer}
              onUpdateShapeLayer={handleUpdateShapeLayer}
              onUpdateImageLayer={handleUpdateImageLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onMoveLayer={handleMoveLayer}
              onHoverFont={setFontPreview}
            />
          </ErrorBoundary>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative overflow-hidden bg-[#13161a] flex flex-col">
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
              layers={layers}
              onUpdateCanvasFilters={handleUpdateCanvasFilters}
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
              showRulers={showRulers}
              onToggleRulers={() => setShowRulers(!showRulers)}
              fontPreview={fontPreview}
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
              onAddLogoToCanvas={handleAddImageLayer}
              onToggleDesignSuggestions={() => setShowDesignSuggestions(true)}
              onToggleSmartContent={() => setShowSmartContent(true)}
              onToggleQualityScore={() => setShowQualityScore(true)}
              setFontPreview={setFontPreview}
            />
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
      {isBottomSheetOpen && (
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
            onSelectImage={handleSelectImage}
            onClearHistory={() => setHistory([])}
            onFileUpload={handleFileUpload}
            uploadedImage={uploadedImage}
            onAddText={handleAddTextLayer}
            onAddShape={handleAddShapeLayer}
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
            onUpdateBrandKit={handleUpdateBrandKit}
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
            onHoverFont={setFontPreview}
          />
        </BottomSheet>
      )}

      {/* Overlays & Utility Modals */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          currentSize={canvasSize}
          onExport={handleConfirmExport}
        />
      )}

      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          designTitle={projectTitle}
          onGetShareLink={async () => "https://kreathief.com/share/demo"}
        />
      )}

      {showDesignSuggestions && (
        <DesignSuggestions
          isOpen={showDesignSuggestions}
          onClose={() => setShowDesignSuggestions(false)}
          designContext={projectTitle}
          layers={[...textLayers, ...shapeLayers, ...imageLayers]}
          canvasSize={canvasSize}
          onApplySuggestion={handleApplyDesignSuggestion}
        />
      )}

      {showSmartContent && (
        <SmartContentGenerator
          isOpen={showSmartContent}
          onClose={() => setShowSmartContent(false)}
          onSelectContent={(content) => {
            handleAddTextLayer({ text: content });
            setShowSmartContent(false);
          }}
          designContext={projectTitle}
        />
      )}

      <DesignQualityScorer
        isOpen={showQualityScore}
        onClose={() => setShowQualityScore(false)}
        designImage={activeImage?.url || uploadedImage || undefined}
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
