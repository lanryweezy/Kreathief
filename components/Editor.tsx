
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SidePanel } from './SidePanel';
import { Canvas } from './Canvas';
import { AppMode, AspectRatio, GeneratedImage, NavTab, TextLayer, ShapeLayer, ImageLayer, HistoryState, CanvasFilters, Project, DesignTheme, BrandKit, CanvasSize, GenerationQuality, User } from '../types';
import * as geminiService from '../services/geminiService';
import * as exportService from '../services/exportService';
import { MODEL_FAST, Icons } from '../constants';
import { Toolbar } from './Toolbar'; // Re-import to ensure it is used, though logic is inside Canvas typically or passed down

const DEFAULT_FILTERS: CanvasFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  opacity: 1,
  vignette: 0
};

interface EditorProps {
  initialProject?: Project;
  onBack: () => void;
  user: User;
  onOpenPricing: () => void;
}

export const Editor: React.FC<EditorProps> = ({ initialProject, onBack, user, onOpenPricing }) => {
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
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#ffffff');
  const [canvasFilters, setCanvasFilters] = useState<CanvasFilters>(DEFAULT_FILTERS);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 1080, height: 1080, name: 'Square (IG Post)' });
  
  // UI State
  const [showGrid, setShowGrid] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  
  // Layers State
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [shapeLayers, setShapeLayers] = useState<ShapeLayer[]>([]);
  const [imageLayers, setImageLayers] = useState<ImageLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

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
  const drawingCancelRef = useRef(false);

  // View State
  const [zoom, setZoom] = useState(0.5);

  // Derived State
  const activeImage = history.find(img => img.id === activeImageId) || null;

  // Initialize from project prop
  useEffect(() => {
    if (initialProject) {
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
  }, [initialProject]);

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

  // -- Persistence --
  useEffect(() => {
    try {
      const savedKits = localStorage.getItem('kreathief_brandkits');
      if (savedKits) setBrandKits(JSON.parse(savedKits));
      const savedUploads = localStorage.getItem('kreathief_uploads');
      if (savedUploads) setUploads(JSON.parse(savedUploads));
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kreathief_brandkits', JSON.stringify(brandKits));
    } catch (e) { console.error(e); }
  }, [brandKits]);

  useEffect(() => {
    try {
      localStorage.setItem('kreathief_uploads', JSON.stringify(uploads.slice(0, 10)));
    } catch (e) { console.error(e); }
  }, [uploads]);

  // Auto-save logic
  useEffect(() => {
    const timeout = setTimeout(() => {
        setIsSaving(true);
        const updatedProject: Project = {
            id: projectId,
            name: projectTitle,
            updatedAt: Date.now(),
            thumbnail: thumbnail, // Persist current thumbnail
            state: {
                textLayers,
                shapeLayers,
                imageLayers,
                canvasBackgroundColor,
                canvasFilters,
                canvasSize
            }
        };
        
        // Read current projects, update ours, write back
        try {
            const allProjectsStr = localStorage.getItem('kreathief_projects');
            let allProjects: Project[] = allProjectsStr ? JSON.parse(allProjectsStr) : [];
            const idx = allProjects.findIndex(p => p.id === projectId);
            if (idx >= 0) {
                allProjects[idx] = updatedProject;
            } else {
                allProjects.push(updatedProject);
            }
            localStorage.setItem('kreathief_projects', JSON.stringify(allProjects));
        } catch (e) { console.error(e); }

        setTimeout(() => setIsSaving(false), 500);
    }, 2000); // 2s debounce

    return () => clearTimeout(timeout);
  }, [textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, projectTitle, projectId, canvasSize, thumbnail]);


  // -- History Handlers --

  const saveToHistory = useCallback(() => {
    const currentState: HistoryState = {
      textLayers: JSON.parse(JSON.stringify(textLayers)),
      shapeLayers: JSON.parse(JSON.stringify(shapeLayers)),
      imageLayers: JSON.parse(JSON.stringify(imageLayers)),
      canvasBackgroundColor,
      canvasFilters: { ...canvasFilters },
      canvasSize: { ...canvasSize }
    };
    
    setPast(prev => {
      const newPast = [...prev, currentState];
      if (newPast.length > 50) newPast.shift();
      return newPast;
    });
    setFuture([]);
  }, [textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, canvasSize]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentState: HistoryState = { textLayers, shapeLayers, imageLayers, canvasBackgroundColor, canvasFilters, canvasSize };
    setFuture(prev => [currentState, ...prev]);
    setPast(newPast);
    setTextLayers(previousState.textLayers);
    setShapeLayers(previousState.shapeLayers);
    if(previousState.imageLayers) setImageLayers(previousState.imageLayers);
    setCanvasBackgroundColor(previousState.canvasBackgroundColor);
    setCanvasFilters(previousState.canvasFilters);
    if(previousState.canvasSize) setCanvasSize(previousState.canvasSize);
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
    if(nextState.imageLayers) setImageLayers(nextState.imageLayers);
    setCanvasBackgroundColor(nextState.canvasBackgroundColor);
    setCanvasFilters(nextState.canvasFilters);
    if(nextState.canvasSize) setCanvasSize(nextState.canvasSize);
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
    setSelectedLayerId(newLayer.id);
  };

  const handleAddShape = (type: any, style: Partial<ShapeLayer>) => {
    saveToHistory();
    const w = style.width || 100;
    const h = style.height || 100;
    const newLayer: ShapeLayer = {
      id: `shape_${Date.now()}`,
      type: type,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      x: canvasSize.width / 2 - w/2,
      y: canvasSize.height / 2 - h/2,
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
    setSelectedLayerId(newLayer.id);
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
    setSelectedLayerId(newLayer.id);
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

  const handleDeleteLayer = useCallback((id: string) => {
    saveToHistory();
    if (id.startsWith('text_')) setTextLayers(prev => prev.filter(layer => layer.id !== id));
    else if (id.startsWith('shape_')) setShapeLayers(prev => prev.filter(layer => layer.id !== id));
    else if (id.startsWith('image_')) setImageLayers(prev => prev.filter(layer => layer.id !== id));
    setSelectedLayerId(currentId => currentId === id ? null : currentId);
  }, [saveToHistory]);

  const handleDuplicateLayer = useCallback((id: string) => {
    saveToHistory();
    const copyLayer = (layers: any[], setLayers: Function) => {
        const layerToCopy = layers.find(l => l.id === id);
        if (layerToCopy) {
            const newLayer = { ...layerToCopy, id: `${layerToCopy.type}_${Date.now()}`, x: layerToCopy.x + 20, y: layerToCopy.y + 20, name: layerToCopy.name + ' Copy' };
            setTimeout(() => setSelectedLayerId(newLayer.id), 0);
            setLayers((prev: any[]) => [...prev, newLayer]);
        }
    };
    if (id.startsWith('text_')) copyLayer(textLayers, setTextLayers);
    else if (id.startsWith('shape_')) copyLayer(shapeLayers, setShapeLayers);
    else if (id.startsWith('image_')) copyLayer(imageLayers, setImageLayers);
  }, [saveToHistory, textLayers, shapeLayers, imageLayers]);

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
    if (id.startsWith('text_')) setTextLayers(prev => { const idx = prev.findIndex(l => l.id === id); return idx !== -1 ? moveInArray(prev, idx, direction) : prev; });
    else if (id.startsWith('shape_')) setShapeLayers(prev => { const idx = prev.findIndex(l => l.id === id); return idx !== -1 ? moveInArray(prev, idx, direction) : prev; });
    else if (id.startsWith('image_')) setImageLayers(prev => { const idx = prev.findIndex(l => l.id === id); return idx !== -1 ? moveInArray(prev, idx, direction) : prev; });
  }, []);

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
      ...textLayers.map(l => ({...l, isText: true})),
      ...shapeLayers.map(l => ({...l, isText: false})),
      ...imageLayers.map(l => ({...l, isText: false}))
    ].filter(l => !l.locked && l.visible);

    if (allLayers.length === 0) return;
    allLayers.sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const count = allLayers.length;
    let newPositions: {id: string, x: number, y: number}[] = [];
    const getHeight = (l: any) => l.height || 40;

    if (type === 'row') {
       const totalWidth = allLayers.reduce((acc, l) => acc + l.width, 0);
       const spacing = (CANVAS_W - 2 * PADDING - totalWidth) / (count - 1 > 0 ? count - 1 : 1);
       let currentX = PADDING;
       const centerY = CANVAS_H / 2;
       allLayers.forEach(l => { newPositions.push({ id: l.id, x: count === 1 ? (CANVAS_W - l.width)/2 : currentX, y: centerY - getHeight(l) / 2 }); currentX += l.width + Math.max(0, spacing); });
    } else if (type === 'col') {
       const totalHeight = allLayers.reduce((acc, l) => acc + getHeight(l), 0);
       const spacing = (CANVAS_H - 2 * PADDING - totalHeight) / (count - 1 > 0 ? count - 1 : 1);
       let currentY = PADDING;
       const centerX = CANVAS_W / 2;
       allLayers.forEach(l => { newPositions.push({ id: l.id, x: centerX - l.width / 2, y: count === 1 ? (CANVAS_H - getHeight(l))/2 : currentY }); currentY += getHeight(l) + Math.max(0, spacing); });
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
      return await exportService.exportDesignToImage(canvasSize.width, canvasSize.height, canvasBackgroundColor, backgroundImageUrl, shapeLayers, textLayers, imageLayers, canvasFilters);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { if (e.shiftKey) handleRedo(); else handleUndo(); e.preventDefault(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedLayerId) handleDeleteLayer(selectedLayerId); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { if (selectedLayerId) { e.preventDefault(); handleDuplicateLayer(selectedLayerId); } return; }
      if (e.key === '?') setShowShortcuts(prev => !prev);
      if (selectedLayerId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        let isLocked = false;
        if (selectedLayerId.startsWith('text')) isLocked = textLayers.find(l => l.id === selectedLayerId)?.locked || false;
        else if (selectedLayerId.startsWith('shape')) isLocked = shapeLayers.find(l => l.id === selectedLayerId)?.locked || false;
        else if (selectedLayerId.startsWith('image')) isLocked = imageLayers.find(l => l.id === selectedLayerId)?.locked || false;
        if (isLocked) return;
        saveToHistory(); 
        const step = e.shiftKey ? 10 : 1;
        let dx = 0; let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step; if (e.key === 'ArrowRight') dx = step; if (e.key === 'ArrowUp') dy = -step; if (e.key === 'ArrowDown') dy = step;
        if (selectedLayerId.startsWith('text_')) setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: l.x + dx, y: l.y + dy } : l));
        else if (selectedLayerId.startsWith('shape_')) setShapeLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: l.x + dx, y: l.y + dy } : l));
        else if (selectedLayerId.startsWith('image_')) setImageLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: l.x + dx, y: l.y + dy } : l));
      }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, handleDeleteLayer, handleUndo, handleRedo, saveToHistory, textLayers, shapeLayers, imageLayers, handleDuplicateLayer]);

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
    setIsExporting(true);
    try {
      const dataUrl = await handleExportDataUrl();
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) { console.error("Export failed", error); alert("Failed to export design."); } finally { setIsExporting(false); }
  };

  const handleBack = async () => {
      // Save thumbnail before exit
      try {
          // Generate a small thumbnail
          const thumb = await exportService.exportDesignToImage(300, 300, canvasBackgroundColor, activeImage?.url || uploadedImage, shapeLayers, textLayers, imageLayers, canvasFilters);
          
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
      } catch(e) {
          console.error("Failed to save thumbnail on exit", e);
          onBack();
      }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1f1f1f] overflow-hidden text-[#e5e7eb] font-sans relative">
      <Header 
        onDownload={handleDownload} 
        title={projectTitle}
        onTitleChange={setProjectTitle}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
        isSaving={isSaving}
        onBack={handleBack}
        user={user}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <SidePanel 
          activeTab={activeTab}
          mode={mode}
          prompt={prompt}
          setPrompt={setPrompt}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          isProcessing={isProcessing}
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
          textLayers={textLayers}
          shapeLayers={shapeLayers}
          imageLayers={imageLayers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
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
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          brushOpacity={brushOpacity}
          setBrushOpacity={setBrushOpacity}
          onFinishDrawing={() => { if(!isEraserActive) setIsDrawing(false) }}
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
          onSelectLayer={setSelectedLayerId}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onMoveLayer={handleMoveLayer}
          selectedLayerId={selectedLayerId}
          onInteractionStart={saveToHistory}
          onMagicWrite={handleMagicWrite}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          isDrawing={isDrawing}
          brushColor={brushColor}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          onDrawingComplete={isEraserActive ? handleEraserComplete : handleAddImageLayer}
          onRemix={handleRemix}
          canvasSize={canvasSize}
          onSetCanvasSize={setCanvasSize}
          user={user}
          onOpenPricing={onOpenPricing}
        />
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

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
           <div className="bg-[#252627] p-6 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2"><Icons.Keyboard className="w-5 h-5 text-[#7d2ae8]" /> Keyboard Shortcuts</h3>
                 <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-white">&times;</button>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                 <div className="flex justify-between py-2 border-b border-gray-700"><span>Undo</span><span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Ctrl + Z</span></div>
                 <div className="flex justify-between py-2 border-b border-gray-700"><span>Redo</span><span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Ctrl + Shift + Z</span></div>
                 <div className="flex justify-between py-2 border-b border-gray-700"><span>Delete Layer</span><span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Del / Backspace</span></div>
                 <div className="flex justify-between py-2 border-b border-gray-700"><span>Duplicate</span><span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Ctrl + D</span></div>
                 <div className="flex justify-between py-2 border-b border-gray-700"><span>Nudge</span><span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Arrow Keys</span></div>
                 <div className="flex justify-between py-2 border-b border-gray-700"><span>Nudge (x10)</span><span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Shift + Arrow Keys</span></div>
                 <div className="flex justify-between py-2"><span>Toggle Shortcuts</span><span className="font-mono bg-gray-800 px-2 py-0.5 rounded">?</span></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
