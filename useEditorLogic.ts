import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Project, AppMode, ShapeLayer, TextLayer, VectorPath, CanvasFilters } from '../types';
import * as geminiService from '../services/geminiService';
import { storageService } from '../services/storageService';
import { loadFonts } from '../services/FontLoader';
import { BooleanOperations } from '../utils/booleanOperations';
import { VectorUtils } from '../utils/vectorUtils';
import { getAIErrorMessage } from '../utils/errorMessages';
import { log } from '../utils/log';
import { debounce } from '../utils/debounce';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_FILTERS: CanvasFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  vignette: 0,
  hueRotate: 0,
};

const EMPTY_ARRAY: any[] = [];
const DEFAULT_SIZE = { width: 1080, height: 1080 };

export const useEditorLogic = (initialProject?: Project) => {
  const layers = useStore((state) => {
    const active = state.artboards.find((a: any) => a.id === state.activeArtboardId);
    return active?.layers || EMPTY_ARRAY;
  });

  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || EMPTY_ARRAY;
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor) || '#ffffff';

  const activeArtboard = useStore((state) => state.artboards.find((a: any) => a.id === state.activeArtboardId));

  const canvasSize = useMemo(
    () => (activeArtboard ? { width: activeArtboard.width, height: activeArtboard.height } : DEFAULT_SIZE),
    [activeArtboard]
  );

  const canvasFilters = useStore((state) => state.canvasFilters) || DEFAULT_FILTERS;
  const projectTitle = useStore((state) => state.projectTitle);
  const brandKits = useStore((state) => state.brandKits) || [];
  const mode = useStore((state) => state.mode);
  const prompt = useStore((state) => state.prompt);
  const aspectRatio = useStore((state) => state.aspectRatio);
  const quality = useStore((state) => state.quality);
  const editingPathId = useStore((state) => state.editingPathId);

  // Store Setters / Actions
  const setProjectId = useStore((state) => state.setProjectId);
  const setProjectTitle = useStore((state) => state.setProjectTitle);
  const initializeProject = useStore((state) => state.initializeProject);
  const setLayers = useStore((state) => state.setLayers);
  const setCanvasBackgroundColor = useStore((state) => state.setCanvasBackgroundColor);
  const setCanvasFilters = useStore((state) => state.setCanvasFilters);
  const setCanvasSize = useStore((state) => state.setCanvasSize);
  const saveProject = useStore((state) => state.saveProject);
  const setIsProcessing = useStore((state) => state.setIsProcessing);
  const applyBrandColors = useStore((state) => state.applyBrandColors);
  const addLayer = useStore((state) => state.addLayer);
  const addImageLayer = useStore((state) => state.addImageLayer);
  const deleteLayer = useStore((state) => state.deleteLayer);
  const addToast = useStore((state) => state.addToast);
  const setEditingPathId = useStore((state) => state.setEditingPathId);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const onUpdatePath = useStore((state) => state.onUpdatePath);
  const setSelectedLayerIds = useStore((state) => state.setSelectedLayerIds);

  const [booleanPreview, setBooleanPreview] = useState<{ path: string; operation: string } | null>(null);

  // Sync Initial Project
  const initializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialProject && initialProject.id !== initializedRef.current) {
      initializedRef.current = initialProject.id;
      setProjectId(initialProject.id);
      setProjectTitle(initialProject.name);
      initializeProject(initialProject);
    }
  }, [initialProject, setProjectId, setProjectTitle, initializeProject]);

  // Autosave Recovery
  useEffect(() => {
    const recoverSession = async () => {
      const savedState = await storageService.getSetting('kreathief_autosave_v1', null);
      if (savedState && !initialProject) {
        try {
          const parsed = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
          if (parsed.layers?.length > 0) {
            const sanitized = parsed.layers.map((l: any) => {
              if (!l || typeof l !== 'object') return l;
              const safe = { ...l };
              if (typeof safe.text === 'object') safe.text = String(safe.text ?? '');
              if (typeof safe.fontFamily === 'object') safe.fontFamily = String(safe.fontFamily ?? '');
              if (typeof safe.color === 'object') safe.color = String(safe.color ?? '#000000');
              if (typeof safe.fill === 'object' && typeof safe.fill !== 'string') safe.fill = String(safe.fill ?? '');
              if (typeof safe.stroke === 'object' && safe.stroke !== null && typeof safe.stroke?.color !== 'string') {
                safe.stroke = { ...safe.stroke, color: String(safe.stroke?.color ?? '#000000') };
              }
              if (typeof safe.src === 'object') safe.src = String(safe.src ?? '');
              return safe;
            });
            setLayers(sanitized);
            if (parsed.canvasBackgroundColor) {
              setCanvasBackgroundColor(parsed.canvasBackgroundColor);
            }
            if (parsed.canvasFilters) {
              setCanvasFilters(parsed.canvasFilters);
            }
            if (parsed.canvasSize) {
              setCanvasSize(parsed.canvasSize);
            }
            if (parsed.projectTitle) {
              setProjectTitle(parsed.projectTitle);
            }
          }
        } catch (e) {
          log.error('[EditorLogic] Failed to recover session', e);
        }
      }
    };
    recoverSession();
  }, [initialProject, setLayers, setCanvasBackgroundColor, setCanvasFilters, setCanvasSize, setProjectTitle]);

  // Autosave Runner
  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        try {
          saveProject();
        } catch (error) {
          log.error('[EditorLogic] Autosave failed', error);
        }
      }, 10000),
    [saveProject]
  );

  useEffect(() => {
    if (layers.length === 0) {
      return;
    }
    debouncedSave();
    return () => debouncedSave.cancel();
  }, [layers, canvasBackgroundColor, canvasFilters, canvasSize, projectTitle, debouncedSave]);

  // Font Auto-Loader
  const prevFontsKeyRef = useRef<string>('');
  const debouncedFontLoad = useMemo(
    () =>
      debounce((fonts: string[]) => {
        if (fonts.length > 0) {
          loadFonts(fonts);
        }
      }, 300),
    []
  );

  const fontsKey = useMemo(() => {
    const textLayers = layers.filter((l) => l.type === 'text') as TextLayer[];
    return Array.from(new Set(textLayers.map((l) => l.fontFamily)))
      .sort()
      .join(',');
  }, [layers]);

  useEffect(() => {
    if (fontsKey !== prevFontsKeyRef.current && fontsKey.length > 0) {
      prevFontsKeyRef.current = fontsKey;
      debouncedFontLoad(fontsKey.split(',').filter(Boolean));
    }
  }, [fontsKey, debouncedFontLoad]);

  // Extract Document Colors
  const documentColors = useMemo(() => {
    const colors = new Set<string>();
    const addColor = (c: any) => {
      if (typeof c === 'string') colors.add(c);
      else if (c !== null && c !== undefined) colors.add(String(c));
    };
    addColor(canvasBackgroundColor);
    layers.forEach((l) => {
      if (l.type === 'text') {
        const tl = l as TextLayer;
        if (tl.color) addColor(tl.color);
      } else if (l.type !== 'image') {
        const sl = l as ShapeLayer;
        if (sl.color) addColor(sl.color);
      }
      if (l.stroke?.color) addColor(l.stroke.color);
      if (l.shadow?.color) addColor(l.shadow.color);
    });
    brandKits.forEach((kit) => kit.colors.forEach((c) => addColor(c)));
    return Array.from(colors);
  }, [layers, canvasBackgroundColor, brandKits]);

  // AI Generation
  const handleGenerate = async (negativePrompt?: string) => {
    if (!prompt.trim()) {
      return;
    }
    const apiPrompt = prompt + (negativePrompt?.trim() ? ` | negative: ${negativePrompt.trim()}` : '');
    setIsProcessing(true);
    const tempId = uuidv4();
    try {
      if (mode === AppMode.THEME) {
        const theme = await geminiService.generateDesignTheme(prompt);
        applyBrandColors([theme.primaryColor, theme.secondaryColor, theme.accentColor]);
      } else {
        saveToHistory();
        addLayer({
          id: tempId,
          type: 'image',
          name: 'Generating...',
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          x: canvasSize.width / 2 - 256,
          y: canvasSize.height / 2 - 256,
          width: 512,
          height: 512,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          flipX: false,
          flipY: false,
          isProcessing: true,
          filters: DEFAULT_FILTERS,
          blendMode: 'normal',
          skewX: 0,
          skewY: 0,
          perspective: 0,
          rotateX: 0,
          rotateY: 0,
        } as any);
        const resultBase64 = await geminiService.generateImage(apiPrompt, aspectRatio, quality);
        deleteLayer(tempId);
        addImageLayer(resultBase64, 'AI Generated');
      }
    } catch (error: any) {
      log.error('[EditorLogic] AI image generation failed', error, { prompt: prompt.substring(0, 100) });
      deleteLayer(tempId);
      addToast(getAIErrorMessage(error), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Vector Path Logic
  const handleUpdatePath = useCallback(
    (path: VectorPath) => {
      if (!editingPathId) {
        return;
      }
      saveToHistory();
      onUpdatePath(editingPathId, { vectorPath: path, pathData: VectorUtils.lastPathData || undefined });
    },
    [editingPathId, saveToHistory, onUpdatePath]
  );

  const handleBooleanOperation = (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => {
    const selectedPaths = layers.filter(
      (l: any) => selectedLayerIds.includes(l.id) && l.type === 'path'
    ) as ShapeLayer[];
    if (selectedPaths.length < 2) {
      addToast('Select at least two path layers.', 'warning');
      return;
    }
    saveToHistory();
    const selectedIndices = selectedPaths.map((p) => layers.findIndex((l: any) => l.id === p.id));
    const lowestIndex = Math.min(...selectedIndices);
    const baseLayer = selectedPaths[0]!;
    const globalPaths = selectedPaths.map((layer) => {
      const path = VectorUtils.parsePath(layer.pathData || '');
      return { ...path, points: path.points.map((p) => ({ ...p, x: p.x + layer.x, y: p.y + layer.y })) };
    });
    let resultPath = globalPaths[0]!;
    for (let i = 1; i < globalPaths.length; i++) {
      switch (operation) {
        case 'union':
          resultPath = BooleanOperations.union(resultPath, globalPaths[i]!);
          break;
        case 'subtract':
          resultPath = BooleanOperations.subtract(resultPath, globalPaths[i]!);
          break;
        case 'intersect':
          resultPath = BooleanOperations.intersect(resultPath, globalPaths[i]!);
          break;
        case 'exclude':
          resultPath = BooleanOperations.exclude(resultPath, globalPaths[i]!);
          break;
      }
    }
    const bounds = VectorUtils.getBounds(resultPath);
    const localPath = {
      ...resultPath,
      points: resultPath.points.map((p) => ({ ...p, x: p.x - bounds.x, y: p.y - bounds.y })),
    };
    const newLayer: ShapeLayer = {
      ...baseLayer,
      id: uuidv4(),
      type: 'path',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pathData: VectorUtils.serializePath(localPath),
      name: 'Boolean Result',
    };

    setLayers((prev) => {
      const filtered = prev.filter((l) => !selectedLayerIds.includes(l.id));
      const next = [...filtered];
      next.splice(lowestIndex, 0, newLayer);
      return next;
    });
    setSelectedLayerIds([newLayer.id]);
  };

  const handleBooleanHover = (operation: 'union' | 'subtract' | 'intersect' | 'exclude' | null) => {
    if (!operation) {
      setBooleanPreview(null);
      return;
    }
    const selectedPaths = layers.filter(
      (l: any) => selectedLayerIds.includes(l.id) && l.type === 'path'
    ) as ShapeLayer[];
    if (selectedPaths.length < 2) {
      return;
    }
    const globalPaths = selectedPaths.map((layer) => {
      const path = VectorUtils.parsePath(layer.pathData || '');
      return { ...path, points: path.points.map((p) => ({ ...p, x: p.x + layer.x, y: p.y + layer.y })) };
    });
    let resultPath = globalPaths[0]!;
    for (let i = 1; i < globalPaths.length; i++) {
      try {
        switch (operation) {
          case 'union':
            resultPath = BooleanOperations.union(resultPath, globalPaths[i]!);
            break;
          case 'subtract':
            resultPath = BooleanOperations.subtract(resultPath, globalPaths[i]!);
            break;
          case 'intersect':
            resultPath = BooleanOperations.intersect(resultPath, globalPaths[i]!);
            break;
          case 'exclude':
            resultPath = BooleanOperations.exclude(resultPath, globalPaths[i]!);
            break;
        }
      } catch (e) {
        log.warn('[EditorLogic] Boolean operation failed', { error: e, operation });
      }
    }
    setBooleanPreview({ path: VectorUtils.serializePath(resultPath), operation });
  };

  const handleLayerDoubleClick = useCallback(
    (layer: any) => {
      if (layer.type === 'text') {
        window.dispatchEvent(new CustomEvent('editor-edit-text', { detail: { layerId: layer.id } }));
      } else if (['rectangle', 'circle', 'path', 'star'].includes(layer.type)) {
        setEditingPathId(layer.id);
        setSelectedLayerIds([layer.id]);
      }
    },
    [setEditingPathId, setSelectedLayerIds]
  );

  const toggleShapeBuilder = useCallback(() => {
    const active = useStore.getState().isShapeBuilderActive;
    useStore.getState().setIsShapeBuilderActive(!active);
    addToast(active ? 'Shape Builder deactivated.' : 'Shape Builder activated (BETA).', 'info');
  }, [addToast]);

  const handleJoinPaths = () => {
    const selectedPaths = layers.filter(
      (l: any) => selectedLayerIds.includes(l.id) && l.type === 'path'
    ) as ShapeLayer[];
    if (selectedPaths.length < 2) {
      addToast('Select at least two path layers to join.', 'warning');
      return;
    }
    saveToHistory();
    const selectedIndices = selectedPaths.map((p) => layers.findIndex((l: any) => l.id === p.id));
    const lowestIndex = Math.min(...selectedIndices);
    const baseLayer = selectedPaths[0]!;

    // Parse the paths in global space
    const globalPaths = selectedPaths.map((layer) => {
      const path = VectorUtils.parsePath(layer.pathData || '');
      return { ...path, points: path.points.map((p) => ({ ...p, x: p.x + layer.x, y: p.y + layer.y })) };
    });

    // Join them sequentially
    let resultPath = globalPaths[0]!;
    for (let i = 1; i < globalPaths.length; i++) {
      resultPath = VectorUtils.joinPaths(resultPath, globalPaths[i]!);
    }

    // Recenter result
    const bounds = VectorUtils.getBounds(resultPath);
    const localPath = {
      ...resultPath,
      points: resultPath.points.map((p) => ({ ...p, x: p.x - bounds.x, y: p.y - bounds.y })),
    };

    const newLayer: ShapeLayer = {
      ...baseLayer,
      id: uuidv4(),
      type: 'path',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pathData: VectorUtils.serializePath(localPath),
      name: 'Joined Path',
    };

    setLayers((prev) => {
      const filtered = prev.filter((l) => !selectedLayerIds.includes(l.id));
      const next = [...filtered];
      next.splice(lowestIndex, 0, newLayer);
      return next;
    });
    setSelectedLayerIds([newLayer.id]);
    addToast('Paths joined successfully.', 'success');
  };

  return {
    documentColors,
    booleanPreview,
    handleGenerate,
    handleJoinPaths,
    handleUpdatePath,
    handleBooleanOperation,
    handleBooleanHover,
    handleLayerDoubleClick,
  };
};
