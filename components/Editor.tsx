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
import { AppMode, TextLayer, ShapeLayer, ImageLayer, Layer, Project, User, VectorPath, CanvasFilters } from '../types';
import * as geminiService from '../services/geminiService';
import * as exportService from '../services/exportService';
import * as psdService from '../services/psdService';
import { storageService } from '../services/storageService';
import { shareService } from '../services/shareService';
import { ShareModal } from './modals/ShareModal';
import { ExportModal } from './modals/ExportModal';
import { Toolbar } from './Toolbar';
import { ShortcutOverlay } from './ShortcutOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { loadFonts } from '../services/FontLoader';
import { BooleanOperations } from '../utils/booleanOperations';
import { VectorUtils } from '../utils/vectorUtils';
import { PathEditorOverlay } from './VectorEditor/PathEditorOverlay';

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

interface EditorProps {
  initialProject?: Project;
  onBack: () => void;
  user: User;
}

export const Editor: React.FC<EditorProps> = ({ initialProject, onBack, user }) => {
  // Essential store state using fine-grained selectors for performance
  const layers = useStore((state) => state.layers);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const canvasSize = useStore((state) => state.canvasSize);
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);
  const canvasFilters = useStore((state) => state.canvasFilters);
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const mode = useStore((state) => state.mode);
  const prompt = useStore((state) => state.prompt);
  const aspectRatio = useStore((state) => state.aspectRatio);
  const quality = useStore((state) => state.quality);
  const isProcessing = useStore((state) => state.isProcessing);
  const setIsProcessing = useStore((state) => state.setIsProcessing);
  const zoom = useStore((state) => state.zoom);
  const setZoom = useStore((state) => state.setZoom);
  const showShortcuts = useStore((state) => state.showShortcuts);
  const setShowShortcuts = useStore((state) => state.setShowShortcuts);
  const setLayers = useStore((state) => state.setLayers);
  const setCanvasSize = useStore((state) => state.setCanvasSize);
  const setCanvasBackgroundColor = useStore((state) => state.setCanvasBackgroundColor);
  const setCanvasFilters = useStore((state) => state.setCanvasFilters);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const initializeProject = useStore((state) => state.initializeProject);
  const addLayers = useStore((state) => state.addLayers);
  const addLayer = useStore((state) => state.addLayer);
  const deleteLayer = useStore((state) => state.deleteLayer);
  const addImageLayer = useStore((state) => state.addImageLayer);
  const copyLayer = useStore((state) => state.copyLayer);
  const pasteLayer = useStore((state) => state.pasteLayer);
  const duplicateSelected = useStore((state) => state.duplicateSelected);
  const deleteSelected = useStore((state) => state.deleteSelected);
  const groupSelected = useStore((state) => state.groupSelected);
  const ungroupSelected = useStore((state) => state.ungroupSelected);
  const nudgeLayer = useStore((state) => state.nudgeLayer);
  const applyBrandColors = useStore((state) => state.applyBrandColors);
  const saveProject = useStore((state) => state.saveProject);
  const projectId = useStore((state) => state.projectId);
  const setProjectId = useStore((state) => state.setProjectId);
  const projectTitle = useStore((state) => state.projectTitle);
  const setProjectTitle = useStore((state) => state.setProjectTitle);
  const showShareModal = useStore((state) => state.showShareModal);
  const setShowShareModal = useStore((state) => state.setShowShareModal);
  const showGoldenRatio = useStore((state) => state.showGoldenRatio);
  const setShowGoldenRatio = useStore((state) => state.setShowGoldenRatio);
  const editingPathId = useStore((state) => state.editingPathId);
  const setEditingPathId = useStore((state) => state.setEditingPathId);
  const onUpdatePath = useStore((state) => state.onUpdatePath);
  const setIsCropMode = useStore((state) => state.setIsCropMode);
  const setDrawingMode = useStore((state) => state.setPenMode);
  const history = useStore((state) => state.history);
  const uploads = useStore((state) => state.uploads);
  const setIsExporting = useStore((state) => state.setIsExporting);
  const brandKits = useStore((state) => state.brandKits);
  const addToast = useStore((state) => state.addToast);

  // Local UI State
  const selectedLayerId = selectedLayerIds.length > 0 ? selectedLayerIds[selectedLayerIds.length - 1] || null : null;
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const activeImage = history.length > 0 ? history[history.length - 1] || null : null;
  const uploadedImage = uploads.length > 0 ? uploads[uploads.length - 1] || null : null;

  // Initialize from project prop
  useEffect(() => {
    if (initialProject && initialProject.id !== projectId) {
      setProjectId(initialProject.id);
      setProjectTitle(initialProject.name);
      initializeProject(initialProject);
    }
  }, [initialProject, projectId, setProjectId, setProjectTitle, initializeProject]);

  // Load fonts used in text layers
  const lastFontsRef = useRef<string>('');
  useEffect(() => {
    const textLayers = layers.filter((l) => l.type === 'text') as TextLayer[];
    const uniqueFonts = Array.from(new Set(textLayers.map((l) => l.fontFamily))).sort();
    const fontsKey = uniqueFonts.join(',');
    if (fontsKey !== lastFontsRef.current && uniqueFonts.length > 0) {
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

  // Crash Recovery on mount
  useEffect(() => {
    const recoverSession = async () => {
      const savedState = await storageService.getSetting('kreathief_autosave_v1', null);
      if (savedState && !initialProject) {
        try {
          const parsed = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
          if (parsed.layers?.length > 0) {
            setLayers(parsed.layers);
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
          console.error('Failed to recover session', e);
        }
      }
    };
    recoverSession();
  }, [initialProject, setLayers, setCanvasBackgroundColor, setCanvasFilters, setCanvasSize, setProjectTitle]);

  // Silent Autosave Logic (10s debounce)
  useEffect(() => {
    if (layers.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      saveProject();
    }, 10000);
    return () => clearTimeout(timer);
  }, [layers, canvasBackgroundColor, canvasFilters, canvasSize, projectTitle, saveProject]);

  // Extract Document Colors
  const documentColors = useMemo(() => {
    const colors = new Set<string>();
    colors.add(canvasBackgroundColor);
    layers.forEach((l) => {
      if (l.type === 'text') {
        const tl = l as TextLayer;
        if (tl.color) {
          colors.add(tl.color);
        }
      } else if (l.type !== 'image') {
        const sl = l as ShapeLayer;
        if (sl.color) {
          colors.add(sl.color);
        }
      }

      if (l.stroke?.color) {
        colors.add(l.stroke.color);
      }
      if (l.shadow?.color) {
        colors.add(l.shadow.color);
      }
    });
    brandKits.forEach((kit) => kit.colors.forEach((c) => colors.add(c)));
    return Array.from(colors);
  }, [layers, canvasBackgroundColor, brandKits]);

  // -- Event Handlers --
  const handleExportDataUrl = async (): Promise<string> => {
    const backgroundImageUrl = activeImage?.url || uploadedImage || null;
    return await exportService.exportDesignToImage(
      canvasSize.width,
      canvasSize.height,
      canvasBackgroundColor,
      backgroundImageUrl,
      layers,
      canvasFilters
    );
  };

  const handleExportBlob = async (): Promise<Blob | null> => {
    const backgroundImageUrl = activeImage?.url || uploadedImage || null;
    return await exportService.exportDesignToBlob(
      canvasSize.width,
      canvasSize.height,
      canvasBackgroundColor,
      backgroundImageUrl,
      layers,
      canvasFilters
    );
  };

  const handleAddLogoToCanvas = (url: string) => {
    addImageLayer(url, 'Logo');
  };

  const handleFileUploads = (files: File[]) => {
    const readers: Promise<string>[] = [];
    Array.from(files).forEach((file) => {
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsDataURL(file);
        })
      );
    });

    Promise.all(readers).then((urls) => {
      const validUrls = urls.filter((u) => u);
      if (validUrls.length > 0) {
        addLayers(
          validUrls.map(
            (url) =>
              ({
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
              }) as ImageLayer
          )
        );
        setCanvasFilters(DEFAULT_FILTERS);
      }
    });
  };

  // -- Keyboard Shortcuts --
  const shortcuts = useMemo(
    () => [
      { key: 'z', ctrl: true, action: undo, description: 'Undo' },
      { key: 'y', ctrl: true, action: redo, description: 'Redo' },
      { key: 'c', ctrl: true, action: () => selectedLayerId && copyLayer(selectedLayerId), description: 'Copy Layer' },
      { key: 'v', ctrl: true, action: pasteLayer, description: 'Paste Layer' },
      {
        key: 'd',
        ctrl: true,
        action: () => selectedLayerIds.length > 0 && duplicateSelected(),
        description: 'Duplicate Layer(s)',
      },
      { key: 'Delete', action: () => selectedLayerIds.length > 0 && deleteSelected(), description: 'Delete Layer(s)' },
      { key: 's', ctrl: true, action: () => saveProject(), description: 'Save Project' },
      { key: 'e', ctrl: true, action: () => setShowExport(true), description: 'Export Design' },
      {
        key: 'g',
        ctrl: true,
        action: () => {
          if (selectedLayerIds.length > 1) {
            groupSelected();
          }
        },
        description: 'Group Layers',
      },
      {
        key: 'g',
        ctrl: true,
        shift: true,
        action: () => {
          if (selectedLayerIds.length > 0) {
            ungroupSelected();
          }
        },
        description: 'Ungroup Layers',
      },
      { key: '?', action: () => setShowShortcuts(!showShortcuts), description: 'Toggle Shortcuts Help' },
      {
        key: 'ArrowUp',
        action: () => {
          if (selectedLayerId) {
            nudgeLayer(selectedLayerId, 0, -1);
          }
        },
        description: 'Move Layer Up',
      },
      {
        key: 'ArrowDown',
        action: () => {
          if (selectedLayerId) {
            nudgeLayer(selectedLayerId, 0, 1);
          }
        },
        description: 'Move Layer Down',
      },
      {
        key: 'ArrowLeft',
        action: () => {
          if (selectedLayerId) {
            nudgeLayer(selectedLayerId, -1, 0);
          }
        },
        description: 'Move Layer Left',
      },
      {
        key: 'ArrowRight',
        action: () => {
          if (selectedLayerId) {
            nudgeLayer(selectedLayerId, 1, 0);
          }
        },
        description: 'Move Layer Right',
      },
    ],
    [
      undo,
      redo,
      copyLayer,
      pasteLayer,
      saveProject,
      selectedLayerIds,
      selectedLayerId,
      duplicateSelected,
      deleteSelected,
      groupSelected,
      ungroupSelected,
      setShowShortcuts,
      showShortcuts,
      nudgeLayer,
    ]
  );

  useKeyboardShortcuts({ shortcuts, enabled: true });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }
    setIsProcessing(true);

    // Create optimistic ID for replacement later
    const tempId = `gen_${Date.now()}`;

    try {
      if (mode === AppMode.THEME) {
        const theme = await geminiService.generateDesignTheme(prompt);
        applyBrandColors([theme.primaryColor, theme.secondaryColor, theme.accentColor]);
      } else {
        // Add optimistic placeholder layer
        addLayer({
          id: tempId,
          type: 'image',
          name: 'Generating...',
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Transparent 1x1
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
          skewX: 0,
          skewY: 0,
        });

        const resultBase64 = await geminiService.generateImage(prompt, aspectRatio, quality);

        // Remove placeholder and add real image
        deleteLayer(tempId);
        addImageLayer(resultBase64, 'AI Generated');
      }
    } catch (error: any) {
      console.error(error);
      deleteLayer(tempId);
      addToast(error.message || 'Failed to generate content', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

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
    const selectedPaths = layers.filter((l) => selectedLayerIds.includes(l.id) && l.type === 'path') as ShapeLayer[];
    if (selectedPaths.length < 2) {
      addToast('Select at least two path layers to perform a boolean operation.', 'warning');
      return;
    }
    saveToHistory();
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
      ...selectedPaths[selectedPaths.length - 1]!,
      id: `path_${Date.now()}`,
      type: 'path',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pathData: VectorUtils.serializePath(localPath),
      name: 'Boolean Result',
    };
    const newLayers = layers.filter((l) => !selectedLayerIds.includes(l.id));
    setLayers([...newLayers, newLayer]);
    useStore.getState().setSelectedLayerIds([newLayer.id]);
  };

  const handleLayerDoubleClick = useCallback(
    (layer: Layer) => {
      if (layer.type === 'text') {
        window.dispatchEvent(new CustomEvent('editor-edit-text', { detail: { layerId: layer.id } }));
      } else if (['rectangle', 'circle', 'path', 'star'].includes(layer.type)) {
        setEditingPathId(layer.id);
        useStore.getState().setSelectedLayerIds([layer.id]);
      }
    },
    [setEditingPathId]
  );

  const handleConfirmExport = async (
    format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd' = 'png',
    quality: number = 0.95,
    size?: { width: number; height: number },
    transparentBg?: boolean
  ) => {
    setIsExporting(true);
    try {
      const exportWidth = size?.width || canvasSize.width;
      const exportHeight = size?.height || canvasSize.height;
      const fileName = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${format}`;
      const scaleX = exportWidth / canvasSize.width;
      const scaleY = exportHeight / canvasSize.height;
      const scaledLayers = layers.map((l) => ({
        ...l,
        x: l.x * scaleX,
        y: l.y * scaleY,
        width: l.width * scaleX,
        height: (l as any).height ? (l as any).height * scaleY : l.width * scaleX,
        ...(l.type === 'text' ? { fontSize: (l as TextLayer).fontSize * scaleY } : {}),
      })) as Layer[];

      // Use transparent background if requested (PNG only)
      const bgColor = transparentBg && format === 'png' ? 'transparent' : canvasBackgroundColor;

      let downloadUrl = '';
      if (format === 'psd') {
        const psdBlob = await psdService.exportLayersToPsd(exportWidth, exportHeight, scaledLayers);
        downloadUrl = URL.createObjectURL(psdBlob);
      } else if (format === 'svg') {
        const svgString = await exportService.exportToSVG(
          exportWidth,
          exportHeight,
          bgColor,
          scaledLayers
        );
        downloadUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
      } else if (format === 'pdf') {
        const imgDataUrl = await exportService.exportDesignToImage(
          exportWidth,
          exportHeight,
          bgColor,
          activeImage?.url || uploadedImage || null,
          scaledLayers,
          canvasFilters,
          'png',
          1.0
        );
        await exportService.exportToPDF(exportWidth, exportHeight, imgDataUrl, fileName);
        setShowExport(false);
        return;
      } else {
        downloadUrl = await exportService.exportDesignToImage(
          exportWidth,
          exportHeight,
          bgColor,
          activeImage?.url || uploadedImage || null,
          scaledLayers,
          canvasFilters,
          format,
          quality
        );
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
      if (format === 'psd' || format === 'svg') {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      }
      setShowExport(false);
    } catch (error) {
      console.error(error);
      addToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyLayout = (type: 'row' | 'col' | 'grid') => {
    useStore.getState().layoutLayers(type);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0e1318] overflow-hidden text-[#e5e7eb] font-sans">
      <Header onDownload={() => setShowExport(true)} onBack={onBack} onNew={initializeProject} user={user} />
      <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
        <div className="hidden md:flex flex-row h-full shrink-0 z-40 border-r border-gray-800">
          <ErrorBoundary componentName="Sidebar" variant="widget">
            <Sidebar />
            <SidePanel
              onGenerate={handleGenerate}
              onApplyTheme={(colors) => applyBrandColors(colors)}
              onApplyLayout={handleApplyLayout}
              getCanvasSnapshot={handleExportDataUrl}
              uploadedImage={activeImage?.url || uploadedImage}
              onFileUpload={handleFileUploads}
            />
          </ErrorBoundary>
        </div>

        <div className="flex-1 relative overflow-hidden bg-[#13161a] flex flex-col">
          <Toolbar
            uploadedImage={uploadedImage}
            documentColors={documentColors}
            onToggleEraser={() => setIsEraserActive(!isEraserActive)}
            isEraserActive={isEraserActive}
            onCompletePath={() => setDrawingMode(false)}
            onBooleanOperation={handleBooleanOperation}
            onCrop={() => setIsCropMode(true)}
          />
          <ErrorBoundary componentName="Canvas" variant="widget">
            <Canvas
              zoom={zoom}
              onZoomChange={setZoom}
              onFileUpload={handleFileUploads}
              onAddLogoToCanvas={handleAddLogoToCanvas}
              onDoubleClickLayer={handleLayerDoubleClick}
              activeImage={activeImage || undefined}
              uploadedImage={uploadedImage}
              onInteractionStart={() => {}}
            />
            {editingPathId &&
              (() => {
                const layer = layers.find((l) => l.id === editingPathId) as ShapeLayer;
                if (layer?.vectorPath) {
                  return (
                    <PathEditorOverlay
                      path={layer.vectorPath}
                      zoom={zoom}
                      onUpdate={handleUpdatePath}
                      onSelectPoint={() => {}}
                      selectedPointIndices={[]}
                    />
                  );
                }
                return null;
              })()}
          </ErrorBoundary>

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

      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsBottomSheetOpen(true);
        }}
      />
      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)} title={activeTab}>
        <SidePanel
          onGenerate={handleGenerate}
          onApplyTheme={applyBrandColors}
          onApplyLayout={handleApplyLayout}
          getCanvasSnapshot={handleExportDataUrl}
          onFileUpload={handleFileUploads}
          uploadedImage={uploadedImage}
        />
      </BottomSheet>

      <ErrorBoundary componentName="Modals" variant="widget">
        {showExport && (
          <ExportModal
            onClose={() => setShowExport(false)}
            currentSize={canvasSize}
            onExport={handleConfirmExport}
            onGetPngBlob={handleExportBlob}
          />
        )}
        {showShareModal && (
          <ShareModal
            onClose={() => setShowShareModal(false)}
            designTitle={projectTitle}
            onGetShareLink={() => shareService.generateShareLink(projectId)}
          />
        )}
      </ErrorBoundary>

      <ShortcutOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
};
