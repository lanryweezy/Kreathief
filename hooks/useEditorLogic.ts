import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Project, AppMode, ShapeLayer, TextLayer, VectorPath, CanvasFilters } from '../types';
import * as geminiService from '../services/geminiService';
import { storageService } from '../services/storageService';
import { loadFonts } from '../services/FontLoader';
import { getAIErrorMessage } from '../utils/errorMessages';
import { VectorUtils } from '../utils/vectorUtils';
import { performBooleanOnLayers, BooleanOperations, getBooleanOperation } from '../utils/booleanOperations';
import { log } from '../utils/log';
import { debounce } from '../utils/debounce';
import { generateLayerId } from '../utils/layers/layerUtils';

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
  const {
    _selectedLayerIds,
    _canvasBackgroundColor,
    activeArtboardId,
    _canvasFilters,
    projectTitle,
    _brandKits,
    mode,
    prompt,
    aspectRatio,
    quality,
    editingPathId,
    setProjectId,
    setProjectTitle,
    initializeProject,
    setLayers,
    setCanvasBackgroundColor,
    setCanvasFilters,
    setCanvasSize,
    saveProject,
    setIsProcessing,
    applyBrandColors,
    addLayer,
    addImageLayer,
    deleteLayer,
    addToast,
    setEditingPathId,
    saveToHistory,
    onUpdatePath,
    setSelectedLayerIds,
  } = useStore(
    useShallow((state) => ({
      _selectedLayerIds: state.selectedLayerIds,
      _canvasBackgroundColor: state.canvasBackgroundColor,
      activeArtboardId: state.activeArtboardId,
      _canvasFilters: state.canvasFilters,
      projectTitle: state.projectTitle,
      _brandKits: state.brandKits,
      mode: state.mode,
      prompt: state.prompt,
      aspectRatio: state.aspectRatio,
      quality: state.quality,
      editingPathId: state.editingPathId,
      setProjectId: state.setProjectId,
      setProjectTitle: state.setProjectTitle,
      initializeProject: state.initializeProject,
      setLayers: state.setLayers,
      setCanvasBackgroundColor: state.setCanvasBackgroundColor,
      setCanvasFilters: state.setCanvasFilters,
      setCanvasSize: state.setCanvasSize,
      saveProject: state.saveProject,
      setIsProcessing: state.setIsProcessing,
      applyBrandColors: state.applyBrandColors,
      addLayer: state.addLayer,
      addImageLayer: state.addImageLayer,
      deleteLayer: state.deleteLayer,
      addToast: state.addToast,
      setEditingPathId: state.setEditingPathId,
      saveToHistory: state.saveToHistory,
      onUpdatePath: state.onUpdatePath,
      setSelectedLayerIds: state.setSelectedLayerIds,
    }))
  );

  const activeArtboard = useStore((state) => state.artboards.find((a: any) => a.id === activeArtboardId));

  const layers = activeArtboard?.layers || EMPTY_ARRAY;
  const selectedLayerIds = _selectedLayerIds || EMPTY_ARRAY;
  const canvasBackgroundColor = _canvasBackgroundColor || '#ffffff';
  const canvasFilters = _canvasFilters || DEFAULT_FILTERS;
  const brandKits = _brandKits || [];

  const canvasSize = useMemo(
    () => (activeArtboard ? { width: activeArtboard.width, height: activeArtboard.height } : DEFAULT_SIZE),
    [activeArtboard]
  );

  const [booleanPreview, setBooleanPreview] = useState<{ path: string; operation: string } | null>(null);

  // Sync Initial Project
  const initializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialProject && initialProject.id !== initializedRef.current) {
      initializedRef.current = initialProject.id;
      setProjectId(initialProject.id);
      setProjectTitle(initialProject.name);
      initializeProject(initialProject);

      // Restore session mirror history stacks if they match the loaded project
      storageService.getSessionMirror().then((mirror) => {
        if (mirror && mirror.projectId === initialProject.id) {
          useStore.setState({
            past: mirror.past || [],
            future: mirror.future || [],
            __lastStateSnapshot: mirror.state,
          } as any);
        }
      });
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
              if (!l || typeof l !== 'object') {
                return l;
              }
              const safe = { ...l };
              if (typeof safe.text === 'object') {
                safe.text = String(safe.text ?? '');
              }
              if (typeof safe.fontFamily === 'object') {
                safe.fontFamily = String(safe.fontFamily ?? '');
              }
              if (typeof safe.color === 'object') {
                safe.color = String(safe.color ?? '#000000');
              }
              if (typeof safe.fill === 'object' && typeof safe.fill !== 'string') {
                safe.fill = String(safe.fill ?? '');
              }
              if (typeof safe.stroke === 'object' && safe.stroke !== null && typeof safe.stroke?.color !== 'string') {
                safe.stroke = { ...safe.stroke, color: String(safe.stroke?.color ?? '#000000') };
              }
              if (typeof safe.src === 'object') {
                safe.src = String(safe.src ?? '');
              }
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
          // Also mirror a lightweight snapshot to the recovery key so the
          // Autosave Recovery effect above has real data to restore from.
          const s = useStore.getState() as any;
          const active = s.artboards.find((a: any) => a.id === s.activeArtboardId);
          storageService
            .setSetting('kreathief_autosave_v1', {
              layers: active?.layers || [],
              canvasBackgroundColor: s.canvasBackgroundColor,
              canvasFilters: s.canvasFilters,
              canvasSize: active ? { width: active.width, height: active.height } : undefined,
              projectTitle: s.projectTitle,
            })
            .catch((err) => log.warn('[EditorLogic] Recovery snapshot failed', { error: err }));
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

  // Flush unsaved work when the tab closes — the 10s autosave debounce would
  // otherwise silently drop the last edits.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const s = useStore.getState() as any;
      if (!s.hasUnsavedChanges) {
        return;
      }
      try {
        s.saveProject();
      } catch (error) {
        log.error('[EditorLogic] Save-on-close failed', error);
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Font Auto-Loader
  const lastFontsRef = useRef<string>('');
  const debouncedFontLoad = useMemo(
    () =>
      debounce((fonts: string[]) => {
        if (fonts.length > 0) {
          loadFonts(fonts);
        }
      }, 300),
    []
  );

  useEffect(() => {
    const textLayers = layers.filter((l) => l.type === 'text') as TextLayer[];
    const uniqueFonts = Array.from(new Set(textLayers.map((l) => l.fontFamily))).sort();
    const fontsKey = uniqueFonts.join(',');
    if (fontsKey !== lastFontsRef.current && uniqueFonts.length > 0) {
      lastFontsRef.current = fontsKey;
      debouncedFontLoad(uniqueFonts);
    }
  }, [layers, debouncedFontLoad]);

  // Extract Document Colors
  const documentColors = useMemo(() => {
    const colors = new Set<string>();
    const addColor = (c: any) => {
      if (typeof c === 'string') {
        colors.add(c);
      } else if (c !== null && c !== undefined) {
        colors.add(String(c));
      }
    };
    addColor(canvasBackgroundColor);
    layers.forEach((l) => {
      if (l.type === 'text') {
        const tl = l as TextLayer;
        if (tl.color) {
          addColor(tl.color);
        }
      } else if (l.type !== 'image') {
        const sl = l as ShapeLayer;
        if (sl.color) {
          addColor(sl.color);
        }
      }
      if (l.stroke?.color) {
        addColor(l.stroke.color);
      }
      if (l.shadow?.color) {
        addColor(l.shadow.color);
      }
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
    const tempId = generateLayerId('temp');
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
    const selectedIdsSet = new Set(selectedLayerIds);
    const selectedPaths = layers.filter((l: any) => selectedIdsSet.has(l.id) && l.type === 'path') as ShapeLayer[];
    if (selectedPaths.length < 2) {
      addToast('Select at least two path layers.', 'warning');
      return;
    }
    const result = performBooleanOnLayers(selectedPaths, operation);
    if (!result) {
      addToast('Boolean operation failed — selected layers have no valid paths.', 'error');
      return;
    }
    saveToHistory();
    // Bolt: O(N) optimization to find the lowest index and prevent Math.min stack overflow
    const pathsIdSet = new Set(selectedPaths.map((p) => p.id));
    const lowestIndex = layers.findIndex((l) => pathsIdSet.has(l.id));
    const baseLayer = selectedPaths[0]!;
    const newLayer: ShapeLayer = {
      ...baseLayer,
      id: generateLayerId('path'),
      type: 'path',
      x: result.x,
      y: result.y,
      width: result.width,
      height: result.height,
      pathData: result.pathData,
      vectorPath: result.vectorPath,
      viewBox: result.viewBox,
      name: 'Boolean Result',
    };

    setLayers((prev) => {
      const filtered = prev.filter((l) => !pathsIdSet.has(l.id));
      const next = [...filtered];
      next.splice(lowestIndex, 0, newLayer);
      return next;
    });
    setSelectedLayerIds([newLayer.id]);
  };

  const handleBooleanHover = (operation: string | null) => {
    if (!operation) {
      setBooleanPreview(null);
      return;
    }
    const selectedIdsSet = new Set(selectedLayerIds);
    const selectedPaths = layers.filter((l: any) => selectedIdsSet.has(l.id) && l.type === 'path') as ShapeLayer[];
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
        const opFn = getBooleanOperation(operation);
        if (opFn) {
          resultPath = opFn(resultPath, globalPaths[i]!);
        } else {
          log.warn('[EditorLogic] Unknown boolean operation', { operation });
          return;
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
      } else if (layer.type === 'image' && layer.crop) {
        // Persist crop reposition from ImageLayerItem's drag-to-move mode
        saveToHistory();
        useStore.getState().updateLayer(layer.id, { crop: layer.crop });
      }
    },
    [setEditingPathId, setSelectedLayerIds, saveToHistory]
  );

  const toggleShapeBuilder = useCallback(() => {
    const active = useStore.getState().isShapeBuilderActive;
    useStore.getState().setIsShapeBuilderActive(!active);
    addToast(active ? 'Shape Builder deactivated.' : 'Shape Builder activated (BETA).', 'info');
  }, [addToast]);

  const handleJoinPaths = () => {
    const selectedIdsSet = new Set(selectedLayerIds);
    const selectedPaths = layers.filter((l: any) => selectedIdsSet.has(l.id) && l.type === 'path') as ShapeLayer[];
    if (selectedPaths.length < 2) {
      addToast('Select at least two path layers to join.', 'warning');
      return;
    }
    saveToHistory();
    // Bolt: O(N) optimization to find the lowest index and prevent Math.min stack overflow
    const pathsIdSet = new Set(selectedPaths.map((p) => p.id));
    const lowestIndex = layers.findIndex((l) => pathsIdSet.has(l.id));
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
      id: generateLayerId('path'),
      type: 'path',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pathData: VectorUtils.serializePath(localPath),
      name: 'Joined Path',
    };

    setLayers((prev) => {
      const filtered = prev.filter((l) => !pathsIdSet.has(l.id));
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
