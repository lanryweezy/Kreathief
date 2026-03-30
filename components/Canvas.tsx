import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  TextLayer,
  ShapeLayer,
  ImageLayer,
  Layer,
  BrushType,
  AnimationSettings,
  ResizeHandle,
  VectorPath,
} from '../types';
import { Icons } from '../constants';
import { ContextMenu } from './ContextMenu';
import { GeometryOracle } from '../utils/geometryOracle';
import { MultiSelectionHandles } from './canvas/MultiSelectionHandles';
import { CanvasLayerRenderer } from './CanvasLayerRenderer';
import {
  GRID_SIZE,
  SNAP_THRESHOLD,
  ROTATION_SNAP_ANGLE,
  ROTATION_SNAP_SHIFT_ANGLE,
  ANIMATION_STYLES,
} from './canvas/CanvasConstants';
import { ErrorBoundary } from './ErrorBoundary';

// ... existing imports ...

const EditableZoom = ({ zoom, onZoomChange }: { zoom: number; onZoomChange: (z: number) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(Math.round(zoom * 100)));

  if (isEditing) {
    return (
      <input
        autoFocus
        className="text-xs text-white bg-black/40 border border-[#7d2ae8] w-14 text-center font-mono rounded outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const num = parseInt(value);
          if (!isNaN(num)) {onZoomChange(num / 100);}
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {e.currentTarget.blur();}
          if (e.key === 'Escape') {setIsEditing(false);}
        }}
      />
    );
  }

  return (
    <span
      className="text-xs text-gray-300 w-14 text-center font-mono cursor-edit hover:text-white transition-colors select-none"
      onClick={() => {
        setValue(String(Math.round(zoom * 100)));
        setIsEditing(true);
      }}
    >
      {Math.round(zoom * 100)}%
    </span>
  );
};

interface CanvasProps {
  zoom: number;
  onZoomChange: (z: number) => void;
  onFileUpload?: (files: File[]) => void;
  onAddLogoToCanvas: (url: string) => void;
  onDoubleClickLayer?: (layer: Layer) => void;
  uploadedImage?: string | null;
  onInteractionStart?: () => void;
  onUpdateTextLayerProp?: (id: string, changes: Partial<TextLayer>) => void;
  onUpdateShapeLayerProp?: (id: string, changes: Partial<ShapeLayer>) => void;
  onUpdateImageLayerProp?: (id: string, changes: Partial<ImageLayer>) => void;
  onOpenAIPanel?: () => void;
  onOpenTemplates?: () => void;
  booleanPreview?: { path: string; operation: string } | null;
  onUpdatePath?: (path: VectorPath) => void;
  onSelectLayer?: (id: string | null) => void;
  previewAnimation?: AnimationSettings;
}

const CanvasComponent: React.FC<CanvasProps> = ({
  zoom,
  onZoomChange,
  onFileUpload,
  onAddLogoToCanvas,
  onDoubleClickLayer,
  onInteractionStart,
  previewAnimation,
  booleanPreview,
}) => {
  // Essential state from Artboard system
  const artboards = useStore((state) => state.artboards);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const activeArtboard = useMemo(() => 
    (artboards || []).find(a => a.id === activeArtboardId) || (artboards || [])[0], 
    [artboards, activeArtboardId]
  );
  
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);
  const canvasFilters = useStore((state) => state.canvasFilters);
  
  // Flatten all layers for global interaction if needed, or just work with active
  const layers = useMemo(() => activeArtboard?.layers || [], [activeArtboard]);
  
  const onUpdateLayers = useStore((state) => state.updateLayers);
  const onSelectLayer = useStore((state) => state.selectLayer);
  const onMultiSelectLayer = useStore((state) => state.multiSelectLayer);
  const onDeleteLayer = useStore((state) => state.deleteLayer);
  const onDuplicateLayer = useStore((state) => state.duplicateLayer);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const showGrid = useStore((state) => state.showGrid);
  const onToggleGrid = useStore((state) => state.setShowGrid);
  const showRulers = useStore((state) => state.showRulers);
  const onToggleRulers = useStore((state) => state.setShowRulers);
  const isDrawing = useStore((state) => state.isPenMode);
  const brushColor = useStore((state) => state.brushColor);
  const brushSize = useStore((state) => state.brushSize);
  const brushOpacity = useStore((state) => state.brushOpacity);
  const brushType = useStore((state) => state.brushType ?? BrushType.BASIC);
  const brushSmoothing = useStore((state) => state.brushSmoothing ?? 50);
  const brushJitter = useStore((state) => state.brushJitter ?? 0);
  const onDrawingComplete = useStore((state) => state.handleDrawingComplete);
  const onVectorDrawingComplete = useStore((state) => state.handleVectorDrawingComplete);
  const onAddArtboard = useStore((state) => state.addArtboard);
  const onGroup = useStore((state) => state.groupSelected);
  const onUngroup = useStore((state) => state.ungroupSelected);
  const editingPathId = useStore((state) => state.editingPathId);
  const onUpdatePath = useStore((state) => state.updateLayer);
  const snapToGrid = useStore((state) => state.snapToGrid);
  const snapToObjects = useStore((state) => state.snapToObjects);
  const isLassoMode = useStore((state) => state.isLassoMode);
  const lassoPoints = useStore((state) => state.lassoPoints);
  const setLassoPoints = useStore((state) => state.setLassoPoints);
  const applyLasso = useStore((state) => state.applyLasso);
  const refineBrushMode = useStore((state) => state.refineBrushMode);
  const refineBrushSize = useStore((state) => state.refineBrushSize);
  const croppingLayerId = useStore((state) => state.croppingLayerId);

  // Interaction Refs
  const bulkDragPreviewManualRef = useRef<Record<string, { x: number; y: number }>>({});
  const dragPreviewRef = useRef<{
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
  } | null>(null);

  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

  // Pre-compute effective layers
  const getEffectiveLayer = useCallback(<T extends Layer>(layer: T): T => {
    if (bulkDragPreviewManualRef.current[layer.id]) {
      return { ...layer, ...bulkDragPreviewManualRef.current[layer.id] };
    }
    if (dragPreviewRef.current && dragPreviewRef.current.id === layer.id) {
      return { ...layer, ...dragPreviewRef.current };
    }
    return layer;
  }, []);

  const effectiveLayers = useMemo(() => layers.map((l: Layer) => getEffectiveLayer(l)), [layers, getEffectiveLayer]);
  const effectiveTextLayers = useMemo(
    () => effectiveLayers.filter((l: Layer) => l.type === 'text') as TextLayer[],
    [effectiveLayers]
  );
  const effectiveShapeLayers = useMemo(
    () => effectiveLayers.filter((l: Layer) => l.type !== 'text' && l.type !== 'image') as ShapeLayer[],
    [effectiveLayers]
  );
  const effectiveImageLayers = useMemo(
    () => effectiveLayers.filter((l: Layer) => l.type === 'image') as ImageLayer[],
    [effectiveLayers]
  );

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const refineCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Calculate minimum zoom to fit canvas in viewport on mobile
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initialLayer?: Layer;
    initialBounds?: { x: number; y: number; width: number; height: number };
    initialLayers?: Record<string, Layer>;
  } | null>(null);
  const [rotateState, setRotateState] = useState<{
    isRotating: boolean;
    startX: number;
    startY: number;
    initialRotation: number;
    centerX: number;
    centerY: number;
    canvasCenterX?: number;
    canvasCenterY?: number;
    initialLayers?: Record<string, Layer>;
  } | null>(null);
  const [drawingState, setDrawingState] = useState({ isDrawingPath: false });
  const [isDrawingLasso, setIsDrawingLasso] = useState(false);
  const [localLassoPoints, setLocalLassoPoints] = useState<{ x: number; y: number }[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const drawingLastPos = useRef({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const panStartRef = useRef(panStart);
  panStartRef.current = panStart;
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(isPanning);
  isPanningRef.current = isPanning;
  const [vectorPoints, setVectorPoints] = useState<{ x: number; y: number }[]>([]);
  const drawingBuffer = useRef<{ x: number; y: number }[]>([]);

  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const panContainerRef = useRef<HTMLDivElement>(null);
  const snapVerticalRef = useRef<HTMLDivElement>(null);
  const snapHorizontalRef = useRef<HTMLDivElement>(null);
  const textEditRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Refs for state sync in high-frequency handlers
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const selectedLayerIdsRef = useRef(selectedLayerIds);
  selectedLayerIdsRef.current = selectedLayerIds;
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;
  const resizeStateRef = useRef(resizeState);
  resizeStateRef.current = resizeState;
  const rotateStateRef = useRef(rotateState);
  rotateStateRef.current = rotateState;
  const isDrawingSyncRef = useRef(isDrawing);
  isDrawingSyncRef.current = isDrawing;
  const isSpacePressedRef = useRef(isSpacePressed);
  isSpacePressedRef.current = isSpacePressed;


  const handleContextMenu = useCallback((e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, layerId });
  }, []);

  // Gesture Blocking
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const handleGesture = (e: any) => e.preventDefault();
    viewport.addEventListener('gesturestart', handleGesture);
    viewport.addEventListener('gesturechange', handleGesture);
    return () => {
      viewport.removeEventListener('gesturestart', handleGesture);
      viewport.removeEventListener('gesturechange', handleGesture);
    };
  }, []);

  // Trackpad Pinch-to-Zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomFactor = 0.01;
        const newZoom = Math.min(3, Math.max(0.1, zoomRef.current - e.deltaY * zoomFactor));
        onZoomChange(newZoom);
      } else if (!isSpacePressed) {
        if (isDrawing) {
          return;
        }
        e.preventDefault();
        setPanOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [onZoomChange, isSpacePressed, isDrawing]);

  // Calculate minimum zoom to fit canvas in viewport (especially for mobile)
  useEffect(() => {
    const calculateMinZoom = () => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const rect = viewport.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });

      if (activeArtboard) {
        // Calculate minimum zoom to fit the active artboard
        const minZoomX = rect.width / activeArtboard.width;
        const minZoomY = rect.height / activeArtboard.height;
        const minZoom = Math.min(minZoomX, minZoomY);

        // Auto-zoom to fit on initial load if zoom is too small
        if (zoom < minZoom && minZoom < 1) {
          onZoomChange(minZoom);
        }
      }
    };

    calculateMinZoom();
    window.addEventListener('resize', calculateMinZoom);
    return () => window.removeEventListener('resize', calculateMinZoom);
  }, [activeArtboard, onZoomChange, zoom]);

  // Handle rotation reset for #2
  useEffect(() => {
    const handleReset = (e: any) => {
      const { id, ids } = e.detail;
      const targetIds = ids || [id];
      const updates: Record<string, Partial<Layer>> = {};
      targetIds.forEach((tid: string) => {
        updates[tid] = { rotation: 0 };
      });
      onUpdateLayers(updates);
    };
    window.addEventListener('canvas-reset-rotation', handleReset);
    return () => window.removeEventListener('canvas-reset-rotation', handleReset);
  }, [onUpdateLayers]);

  const getSnapLines = useCallback(
    (currentLayer: Layer, currentX: number, currentY: number) => {
      const threshold = SNAP_THRESHOLD / zoomRef.current;
      const layerWidth = currentLayer.width;
      const layerHeight = (currentLayer as any).height || 0;
      let currentAscent = 0;

      if (currentLayer.type === 'text') {
        const metric = GeometryOracle.measureText(currentLayer as TextLayer);
        currentAscent = metric.ascent;
      }

      const centerY = currentY + layerHeight / 2;
      const centerX = currentX + layerWidth / 2;

      const snapX: number[] = [];
      const snapY: number[] = [];
      let newX = currentX;
      let newY = currentY;

      const canvasCenterX = activeArtboard.width / 2;
      const canvasCenterY = activeArtboard.height / 2;

      if (Math.abs(centerX - canvasCenterX) < threshold) {
        snapX.push(canvasCenterX);
        newX = canvasCenterX - layerWidth / 2;
      }
      if (Math.abs(centerY - canvasCenterY) < threshold) {
        snapY.push(canvasCenterY);
        newY = canvasCenterY - layerHeight / 2;
      }

      if (Math.abs(currentX) < threshold) {
        snapX.push(0);
        newX = 0;
      }
      if (Math.abs(currentX + layerWidth - activeArtboard.width) < threshold) {
        snapX.push(activeArtboard.width);
        newX = activeArtboard.width - layerWidth;
      }
      if (Math.abs(currentY) < threshold) {
        snapY.push(0);
        newY = 0;
      }
      if (Math.abs(currentY + layerHeight - activeArtboard.height) < threshold) {
        snapY.push(activeArtboard.height);
        newY = activeArtboard.height - layerHeight;
      }

      if (snapToObjects) {
        const otherLayers = ([...effectiveShapeLayers, ...effectiveImageLayers, ...effectiveTextLayers] as Layer[]).filter(
          (l: Layer) => l.id !== currentLayer.id
        );

        for (const other of otherLayers) {
          const otherHeight = (other as any).height || 0;
          const otherCenterX = other.x + other.width / 2;

          if (Math.abs(currentX - other.x) < threshold) {
            snapX.push(other.x);
            newX = other.x;
          }
          if (Math.abs(currentX + layerWidth - (other.x + other.width)) < threshold) {
            snapX.push(other.x + other.width);
            newX = other.x + other.width - layerWidth;
          }
          if (Math.abs(centerX - otherCenterX) < threshold) {
            snapX.push(otherCenterX);
            newX = otherCenterX - layerWidth / 2;
          }

          if (Math.abs(currentY - other.y) < threshold) {
            snapY.push(other.y);
            newY = other.y;
          }
          if (Math.abs(currentY + layerHeight - (other.y + otherHeight)) < threshold) {
            snapY.push(other.y + otherHeight);
            newY = other.y + otherHeight - layerHeight;
          }
          if (Math.abs(currentY + layerHeight - other.y) < threshold) {
            snapY.push(other.y);
            newY = other.y - layerHeight;
          }

          if (currentLayer.type === 'text' && other.type === 'text') {
            const otherMetric = GeometryOracle.measureText(other as TextLayer);
            const otherBaseline = other.y + otherMetric.ascent;
            const currentBaseline = currentY + currentAscent;
            if (Math.abs(currentBaseline - otherBaseline) < threshold) {
              snapY.push(otherBaseline);
              newY = otherBaseline - currentAscent;
            }
          }
        }
      }

      return { snapX, snapY, newX, newY };
    },
    [
      activeArtboard.width,
      activeArtboard.height,
      effectiveShapeLayers,
      effectiveImageLayers,
      effectiveTextLayers,
      snapToObjects,
    ]
  );

  const getResizeSnapLines = useCallback(
    (currentLayer: Layer, newX: number, newY: number, newWidth: number, newHeight: number, handle: ResizeHandle) => {
      const threshold = SNAP_THRESHOLD / zoomRef.current;
      const snapX: number[] = [];
      const snapY: number[] = [];
      let snappedX = newX;
      let snappedY = newY;
      let snappedWidth = newWidth;
      let snappedHeight = newHeight;

      if (snapToGrid) {
        if (handle.includes('e') || handle.includes('w')) {
          const right = snappedX + snappedWidth;
          const snappedRight = Math.round(right / GRID_SIZE) * GRID_SIZE;
          const snappedLeft = Math.round(snappedX / GRID_SIZE) * GRID_SIZE;

          if (handle.includes('e')) {
            if (Math.abs(right - snappedRight) < threshold) {
              snappedWidth = snappedRight - snappedX;
            }
          } else if (handle.includes('w')) {
            if (Math.abs(snappedX - snappedLeft) < threshold) {
              const dx = snappedLeft - snappedX;
              snappedX = snappedLeft;
              snappedWidth -= dx;
            }
          }
        }
        if (handle.includes('s') || handle.includes('n')) {
          const bottom = snappedY + snappedHeight;
          const snappedBottom = Math.round(bottom / GRID_SIZE) * GRID_SIZE;
          const snappedTop = Math.round(snappedY / GRID_SIZE) * GRID_SIZE;

          if (handle.includes('s')) {
            if (Math.abs(bottom - snappedBottom) < threshold) {
              snappedHeight = snappedBottom - snappedY;
            }
          } else if (handle.includes('n')) {
            if (Math.abs(snappedY - snappedTop) < threshold) {
              const dy = snappedTop - snappedY;
              snappedY = snappedTop;
              snappedHeight -= dy;
            }
          }
        }
      }

      if (snapToObjects) {
        const otherLayers = [...effectiveShapeLayers, ...effectiveImageLayers, ...effectiveTextLayers].filter(
          (l: Layer) => l.id !== currentLayer.id
        );

        for (const other of otherLayers) {
          const otherHeight = (other as any).height || 0;

          if (handle.includes('e')) {
            const right = snappedX + snappedWidth;
            if (Math.abs(right - (other.x + other.width)) < threshold) {
              snappedWidth = other.x + other.width - snappedX;
              snapX.push(other.x + other.width);
            }
            if (Math.abs(right - other.x) < threshold) {
              snappedWidth = other.x - snappedX;
              snapX.push(other.x);
            }
          }
          if (handle.includes('w')) {
            if (Math.abs(snappedX - other.x) < threshold) {
              const dx = other.x - snappedX;
              snappedX = other.x;
              snappedWidth -= dx;
              snapX.push(other.x);
            }
            if (Math.abs(snappedX - (other.x + other.width)) < threshold) {
              const dx = other.x + other.width - snappedX;
              snappedX = other.x + other.width;
              snappedWidth -= dx;
              snapX.push(other.x + other.width);
            }
          }
          if (handle.includes('s')) {
            const bottom = snappedY + snappedHeight;
            if (Math.abs(bottom - (other.y + otherHeight)) < threshold) {
              snappedHeight = other.y + otherHeight - snappedY;
              snapY.push(other.y + otherHeight);
            }
            if (Math.abs(bottom - other.y) < threshold) {
              snappedHeight = other.y - snappedY;
              snapY.push(other.y);
            }
          }
          if (handle.includes('n')) {
            if (Math.abs(snappedY - other.y) < threshold) {
              const dy = other.y - snappedY;
              snappedY = other.y;
              snappedHeight -= dy;
              snapY.push(other.y);
            }
            if (Math.abs(snappedY - (other.y + otherHeight)) < threshold) {
              const dy = other.y + otherHeight - snappedY;
              snappedY = other.y + otherHeight;
              snappedHeight -= dy;
              snapY.push(other.y + otherHeight);
            }
          }
        }
      }

      return { snappedX, snappedY, snappedWidth, snappedHeight, snapX, snapY };
    },
    [snapToObjects, snapToGrid, effectiveShapeLayers, effectiveImageLayers, effectiveTextLayers]
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !editingTextId) {
        setIsSpacePressed(true);
      }

      const target = e.target as HTMLElement;
      if (editingTextId || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (onGroup && selectedLayerIds.length > 1) {
          onGroup();
        }
      }
      if (isCtrl && e.key === 'g' && e.shiftKey) {
        e.preventDefault();
        if (onUngroup) {
          onUngroup();
        }
      }
      if (isCtrl && e.key === 'd') {
        e.preventDefault();
        if (selectedLayerId && onDuplicateLayer) {
          onDuplicateLayer(selectedLayerId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (selectedLayerId) {
          const layerIndex = layers.findIndex((l) => l.id === selectedLayerId);
          if (layerIndex > 0) {
            useStore.getState().applyMask(selectedLayerId, layers[layerIndex - 1].id);
          }
        }
      }
      if (isCtrl && e.key === 'a') {
        e.preventDefault();
        if (onMultiSelectLayer && layers.length > 0) {
          layers.forEach((l: Layer) => onMultiSelectLayer(l.id, true));
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    editingTextId,
    selectedLayerId,
    selectedLayerIds,
    onGroup,
    onUngroup,
    onDeleteLayer,
    onDuplicateLayer,
    layers,
    onMultiSelectLayer,
  ]);

  // Mouse Handlers
  const handleMouseDownContainer = useCallback(
    (e: React.MouseEvent) => {
      if (isLassoMode) {
        setIsDrawingLasso(true);
        const rect = viewportRef.current?.getBoundingClientRect();
        if (rect && activeArtboard) {
          const x = (e.clientX - rect.left - panOffset.x) / zoom - activeArtboard.x;
          const y = (e.clientY - rect.top - panOffset.y) / zoom - activeArtboard.y;
          setLocalLassoPoints([{ x, y }]);
        }
      } else if (refineBrushMode !== 'none' && croppingLayerId) {
        setIsRefining(true);
        // Initialize mask buffer from current layer mask
        const layer = layersRef.current.find((l: Layer) => l.id === croppingLayerId) as ImageLayer;
        if (layer && refineCanvasRef.current) {
          const ctx = refineCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, refineCanvasRef.current.width, refineCanvasRef.current.height);
            // If we have an existing bitmap mask, draw it
            if (layer.maskType === 'bitmap' && layer.maskDataURL) {
              const img = new Image();
              img.onload = () => ctx.drawImage(img, 0, 0);
              img.src = layer.maskDataURL;
            } else if (layer.maskType === 'lasso' && layer.maskPath) {
              // Draw SVG path to mask buffer
              ctx.fillStyle = 'white';
              const p = new Path2D(layer.maskPath);
              ctx.fill(p);
            } else {
              // Default to full mask
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, layer.width, (layer as any).height || 0);
            }
          }
        }
      } else if (isSpacePressedRef.current) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      } else {
        onSelectLayer(null);
        setEditingTextId(null);
      }
    },
    [onSelectLayer, isLassoMode, zoom, setLassoPoints]
  );

  const handleMouseDownLayer = useCallback(
    (e: React.MouseEvent, layer: Layer) => {
      if (isSpacePressedRef.current || isDrawingSyncRef.current || layer.locked) {
        return;
      }

      // Stop propagation to prevent handleMouseDownContainer from deselecting
      e.stopPropagation();

      // Only deselect if not already selected and not using shift
      const isAlreadySelected = selectedLayerIdsRef.current.includes(layer.id);

      if (e.shiftKey && onMultiSelectLayer) {
        onMultiSelectLayer(layer.id, true);
      } else if (!isAlreadySelected) {
        onSelectLayer(layer.id);
      }

      onInteractionStart?.();

      const currentSelectedLayerIds = selectedLayerIdsRef.current;
      const currentLayers = layersRef.current;
      const initialPositions: Record<string, { x: number; y: number }> = {};
      const idsToMove =
        e.shiftKey || (currentSelectedLayerIds && currentSelectedLayerIds.includes(layer.id))
          ? [...new Set([...currentSelectedLayerIds, layer.id])]
          : [layer.id];

      currentLayers.forEach((l: Layer) => {
        if (idsToMove.includes(l.id)) {
          initialPositions[l.id] = { x: l.x, y: l.y };
        }
      });

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        initialPositions,
      });
    },
    [onMultiSelectLayer, onSelectLayer, onInteractionStart]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      onInteractionStart?.();

      const currentSelectedLayerIds = selectedLayerIdsRef.current;
      const currentLayers = layersRef.current;

      if (currentSelectedLayerIds && currentSelectedLayerIds.length > 1) {
        const selectedLayers = currentLayers.filter((l: Layer) => currentSelectedLayerIds.includes(l.id));
        const bounds = GeometryOracle.getGroupBounds(selectedLayers);
        const initialLayers: Record<string, Layer> = {};
        selectedLayers.forEach((l: Layer) => (initialLayers[l.id] = { ...l }));

        setResizeState({
          isResizing: true,
          handle,
          startX: e.clientX,
          startY: e.clientY,
          initialBounds: bounds,
          initialLayers,
        });
      } else {
        setResizeState({ isResizing: true, handle, startX: e.clientX, startY: e.clientY, initialLayer: { ...layer } });
      }
    },
    [onInteractionStart]
  );

  const handleRotateStart = useCallback(
    (e: React.MouseEvent, layer: Layer) => {
      e.stopPropagation();
      onInteractionStart?.();

      const currentSelectedLayerIds = selectedLayerIdsRef.current;
      const currentLayers = layersRef.current;

      if (currentSelectedLayerIds && currentSelectedLayerIds.length > 1) {
        const selectedLayers = currentLayers.filter((l: Layer) => currentSelectedLayerIds.includes(l.id));
        const bounds = GeometryOracle.getGroupBounds(selectedLayers);
        const canvasCenterX = bounds.x + bounds.width / 2;
        const canvasCenterY = bounds.y + bounds.height / 2;

        const selectionBox = document.getElementById('multi-selection-box');
        let centerX = 0,
          centerY = 0;
        if (selectionBox) {
          const innerBox = selectionBox.firstElementChild as HTMLElement;
          if (innerBox) {
            const rect = innerBox.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
          }
        }

        if (centerX === 0 && viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          centerX = rect.left + rect.width / 2;
          centerY = rect.top + rect.height / 2;
        }

        const initialLayers: Record<string, Layer> = {};
        selectedLayers.forEach((l: Layer) => (initialLayers[l.id] = { ...l }));

        setRotateState({
          isRotating: true,
          startX: e.clientX,
          startY: e.clientY,
          initialRotation: 0,
          centerX,
          centerY,
          canvasCenterX,
          canvasCenterY,
          initialLayers,
        });
      } else {
        // Find the layer's DOM element to get its bounding box
        const layerEl = layerRefs.current[layer.id];
        if (layerEl) {
          const boxRect = layerEl.getBoundingClientRect();
          setRotateState({
            isRotating: true,
            startX: e.clientX,
            startY: e.clientY,
            initialRotation: layer.rotation,
            centerX: boxRect.left + boxRect.width / 2,
            centerY: boxRect.top + boxRect.height / 2,
          });
        } else {
          // Fallback: compute center from layer canvas coords
          const panContainerRect = panContainerRef.current?.getBoundingClientRect();
          if (panContainerRect) {
            const zoom = zoomRef.current;
            const centerX = panContainerRect.left + (layer.x + layer.width / 2) * zoom;
            const centerY = panContainerRect.top + (layer.y + ((layer as any).height || layer.width) / 2) * zoom;
            setRotateState({
              isRotating: true,
              startX: e.clientX,
              startY: e.clientY,
              initialRotation: layer.rotation,
              centerX,
              centerY,
            });
          }
        }
      }
    },
    [onInteractionStart]
  );

  const mouseMoveRequestRef = useRef<number>();
  const lastMousePosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const velocityRef = useRef<number>(0);

  const handleMouseMove = useCallback(
    (e: any) => {
      const reqId = mouseMoveRequestRef.current;
      if (reqId) {
        cancelAnimationFrame(reqId);
      }

      const currentTime = Date.now();
      if (lastMousePosRef.current) {
        const dt = currentTime - lastMousePosRef.current.time;
        if (dt > 0) {
          const dist = Math.sqrt(
            Math.pow(e.clientX - lastMousePosRef.current.x, 2) + Math.pow(e.clientY - lastMousePosRef.current.y, 2)
          );
          const instantVelocity = dist / dt;
          velocityRef.current = velocityRef.current * 0.8 + instantVelocity * 0.2;
        }
      }
      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: currentTime };

      mouseMoveRequestRef.current = requestAnimationFrame(() => {
        if (isPanningRef.current) {
          const dx = e.clientX - panStartRef.current.x;
          const dy = e.clientY - panStartRef.current.y;

          if (panContainerRef.current) {
            const newX = panOffsetRef.current.x + dx;
            const newY = panOffsetRef.current.y + dy;
            panContainerRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
            panOffsetRef.current = { x: newX, y: newY };
          }

          setPanStart({ x: e.clientX, y: e.clientY });
          return;
        }

        const currentDragState = dragStateRef.current;
        const currentSelectedLayerId = selectedLayerId;
        const currentSelectedLayerIds = selectedLayerIdsRef.current;
        const currentLayers = layersRef.current;
        const currentZoom = zoomRef.current;

        if (isDrawingSyncRef.current) {
          return;
        }

        if (isRefining && refineCanvasRef.current && croppingLayerId) {
          const rect = viewportRef.current?.getBoundingClientRect();
          if (rect && activeArtboard) {
            const x = (e.clientX - rect.left - panOffset.x) / currentZoom - activeArtboard.x;
            const y = (e.clientY - rect.top - panOffset.y) / currentZoom - activeArtboard.y;
            const ctx = refineCanvasRef.current.getContext('2d');
            if (ctx) {
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.lineWidth = refineBrushSize;
              ctx.strokeStyle = 'white'; // Used for source-over (restore)
              ctx.globalCompositeOperation = refineBrushMode === 'erase' ? 'destination-out' : 'source-over';

              if (drawingLastPos.current.x === 0 && drawingLastPos.current.y === 0) {
                ctx.beginPath();
                ctx.moveTo(x, y);
              } else {
                ctx.beginPath();
                ctx.moveTo(drawingLastPos.current.x, drawingLastPos.current.y);
                ctx.lineTo(x, y);
                ctx.stroke();
              }
              drawingLastPos.current = { x, y };
            }
          }
          return;
        }

        if (isLassoMode && isDrawingLasso) {
          const rect = viewportRef.current?.getBoundingClientRect();
          if (rect && activeArtboard) {
            const x = (e.clientX - rect.left - panOffset.x) / currentZoom - activeArtboard.x;
            const y = (e.clientY - rect.top - panOffset.y) / currentZoom - activeArtboard.y;
            setLocalLassoPoints((prev) => [...prev, { x, y }]);
          }
          return;
        }

        if (currentDragState?.isDragging) {
          const dx = (e.clientX - currentDragState.startX) / currentZoom;
          const dy = (e.clientY - currentDragState.startY) / currentZoom;
          const isMovingFast = velocityRef.current > 2.5;

          let finalDx = dx;
          let finalDy = dy;
          let snapVertical: number[] | undefined;
          let snapHorizontal: number[] | undefined;

          if (!isMovingFast) {
            if (currentSelectedLayerIds.length > 1) {
              const selectedLayers = currentLayers.filter((l: Layer) => currentSelectedLayerIds.includes(l.id));
              const groupBounds = GeometryOracle.getGroupBounds(selectedLayers);
              const currentGroupX = groupBounds.x + dx;
              const currentGroupY = groupBounds.y + dy;

              const groupProxy: Layer = {
                id: 'group_proxy',
                x: currentGroupX,
                y: currentGroupY,
                width: groupBounds.width,
                height: groupBounds.height,
              } as any;

              const { snapX, snapY, newX, newY } = getSnapLines(groupProxy, currentGroupX, currentGroupY);

              if (newX !== currentGroupX) {
                finalDx = newX - groupBounds.x;
              }
              if (newY !== currentGroupY) {
                finalDy = newY - groupBounds.y;
              }
              snapVertical = snapX;
              snapHorizontal = snapY;
            } else {
              const primaryLayerId = currentSelectedLayerId || (currentSelectedLayerIds && currentSelectedLayerIds[0]);
              const primaryLayer = currentLayers.find((l: Layer) => l.id === primaryLayerId);

              if (primaryLayer && currentDragState.initialPositions[primaryLayer.id]) {
                const initial = currentDragState.initialPositions[primaryLayer.id]!;
                const proposedX = initial.x + dx;
                const proposedY = initial.y + dy;

                const { snapX, snapY, newX, newY } = getSnapLines(
                  { ...primaryLayer, x: proposedX, y: proposedY } as any,
                  proposedX,
                  proposedY
                );

                if (newX !== proposedX) {
                  finalDx = newX - initial.x;
                }
                if (newY !== proposedY) {
                  finalDy = newY - initial.y;
                }

                snapVertical = snapX;
                snapHorizontal = snapY;
              }
            }
          }

          if (snapVerticalRef.current) {
            snapVerticalRef.current.style.display = snapVertical && snapVertical.length > 0 ? 'block' : 'none';
            if (snapVertical && snapVertical.length > 0) {
              snapVerticalRef.current.style.left = `${snapVertical[0]}px`;
            }
          }
          if (snapHorizontalRef.current) {
            snapHorizontalRef.current.style.display = snapHorizontal && snapHorizontal.length > 0 ? 'block' : 'none';
            if (snapHorizontal && snapHorizontal.length > 0) {
              snapHorizontalRef.current.style.top = `${snapHorizontal[0]}px`;
            }
          }

          const newBulkPreview: Record<string, { x: number; y: number }> = {};
          Object.entries(currentDragState.initialPositions).forEach(([id, initialPos]) => {
            const nx = initialPos.x + finalDx;
            const ny = (initialPos as { x: number; y: number }).y + finalDy;
            newBulkPreview[id] = { x: nx, y: ny };

            const domNode = layerRefs.current[id];
            if (domNode) {
              domNode.style.left = `${nx}px`;
              domNode.style.top = `${ny}px`;
            }
          });
          bulkDragPreviewManualRef.current = newBulkPreview;
        } else if (snapVerticalRef.current) {
          snapVerticalRef.current.style.display = 'none';
          if (snapHorizontalRef.current) {
            snapHorizontalRef.current.style.display = 'none';
          }
        }

        const currentResizeState = resizeStateRef.current;
        if (currentResizeState?.isResizing) {
          const dx = (e.clientX - currentResizeState.startX) / currentZoom;
          const dy = (e.clientY - currentResizeState.startY) / currentZoom;
          const { handle, initialLayer, initialBounds, initialLayers } = currentResizeState;

          if (initialBounds && initialLayers) {
            const { x, y, width, height } = initialBounds;
            let newX = x,
              newY = y,
              newW = width,
              newH = height;

            if (handle.includes('e')) {
              newW += dx;
            }
            if (handle.includes('w')) {
              newX += dx;
              newW -= dx;
            }
            if (handle.includes('s')) {
              newH += dy;
            }
            if (handle.includes('n')) {
              newY += dy;
              newH -= dy;
            }

            const groupProxy = { id: 'group-proxy', x, y, width, height } as Layer;
            const { snappedX, snappedY, snappedWidth, snappedHeight, snapX, snapY } = getResizeSnapLines(
              groupProxy,
              newX,
              newY,
              newW,
              newH,
              handle
            );

            newX = snappedX;
            newY = snappedY;
            newW = Math.max(10, snappedWidth);
            newH = Math.max(10, snappedHeight);

            if (snapVerticalRef.current) {
              snapVerticalRef.current.style.display = snapX.length > 0 ? 'block' : 'none';
              if (snapX.length > 0) {
                snapVerticalRef.current.style.left = `${snapX[0]}px`;
              }
            }
            if (snapHorizontalRef.current) {
              snapHorizontalRef.current.style.display = snapY.length > 0 ? 'block' : 'none';
              if (snapY.length > 0) {
                snapHorizontalRef.current.style.top = `${snapY[0]}px`;
              }
            }

            const scaleX = newW / width;
            const scaleY = newH / height;

            const newBulkPreview: Record<string, any> = {};
            Object.entries(initialLayers).forEach(([id, layer]) => {
              const relX = layer.x - x;
              const relY = layer.y - y;
              const nx = newX + relX * scaleX;
              const ny = newY + relY * scaleY;
              const nw = layer.width * scaleX;
              const nh = (layer as any).height ? (layer as any).height * scaleY : undefined;

              const preview = { x: nx, y: ny, width: nw, height: nh } as any;
              if (layer.type === 'text') {
                preview.fontSize = (layer as TextLayer).fontSize * scaleY;
              }
              newBulkPreview[id] = preview;

              const domNode = layerRefs.current[id];
              if (domNode) {
                domNode.style.left = `${nx}px`;
                domNode.style.top = `${ny}px`;
                domNode.style.width = `${nw}px`;
                if (nh) {
                  domNode.style.height = `${nh}px`;
                }
                if (layer.type === 'text' && preview.fontSize) {
                  const firstChild = domNode.firstChild as HTMLElement;
                  if (firstChild) {firstChild.style.fontSize = `${preview.fontSize}px`;}
                }
              }
            });
            bulkDragPreviewManualRef.current = newBulkPreview;
          } else if (initialLayer && currentSelectedLayerId) {
            const { x: ix, y: iy, width: iw, rotation: iRotation } = initialLayer;
            const ih = (initialLayer as any).height || 0;
            
            // === OBB MATH: rotate dx/dy into local object space ===
            const angleRad = ((iRotation || 0) * Math.PI) / 180;
            const cosA = Math.cos(-angleRad);
            const sinA = Math.sin(-angleRad);
            // Project screen delta into local (object) space
            const localDx = dx * cosA - dy * sinA;
            const localDy = dx * sinA + dy * cosA;

            let nx = ix,
              ny = iy,
              nw = iw,
              nh = ih;

            // Work in local space — anchor the opposite edge
            if (handle.includes('e')) { nw = Math.max(10, iw + localDx); }
            if (handle.includes('w')) {
              nw = Math.max(10, iw - localDx);
              // Re-project the x shift back to screen space
              const shiftLocal = iw - nw;
              nx = ix + shiftLocal * Math.cos(angleRad);
              ny = iy + shiftLocal * Math.sin(angleRad);
            }
            if (handle.includes('s')) { nh = Math.max(10, ih + localDy); }
            if (handle.includes('n')) {
              nh = Math.max(10, ih - localDy);
              const shiftLocal = ih - nh;
              nx = ix - shiftLocal * Math.sin(angleRad);
              ny = iy + shiftLocal * Math.cos(angleRad);
            }

            // === TEXT SCALING: scale fontSize on corner grabs ===
            const isCorner = handle.length === 2; // e.g. 'nw', 'se'
            let newFontSize: number | undefined;
            if (initialLayer.type === 'text' && isCorner && iw > 0) {
              const scaleRatio = nw / iw;
              const baseFontSize = (initialLayer as TextLayer).fontSize || 24;
              newFontSize = Math.max(8, Math.round(baseFontSize * scaleRatio));
            }

            const { snappedX, snappedY, snappedWidth, snappedHeight, snapX, snapY } = getResizeSnapLines(
              initialLayer,
              nx,
              ny,
              nw,
              nh,
              handle
            );

            nx = snappedX;
            ny = snappedY;
            nw = Math.max(10, snappedWidth);
            nh = Math.max(10, snappedHeight);

            const domNode = layerRefs.current[currentSelectedLayerId];
            if (domNode) {
              domNode.style.left = `${nx}px`;
              domNode.style.top = `${ny}px`;
              domNode.style.width = `${nw}px`;
              domNode.style.height = `${nh}px`;
              if (newFontSize) {
                const firstChild = domNode.firstChild as HTMLElement;
                if (firstChild) { firstChild.style.fontSize = `${newFontSize}px`; }
              }
            }

            if (snapVerticalRef.current) {
              snapVerticalRef.current.style.display = snapX.length > 0 ? 'block' : 'none';
              if (snapX.length > 0) {
                snapVerticalRef.current.style.left = `${snapX[0]}px`;
              }
            }
            if (snapHorizontalRef.current) {
              snapHorizontalRef.current.style.display = snapY.length > 0 ? 'block' : 'none';
              if (snapY.length > 0) {
                snapHorizontalRef.current.style.top = `${snapY[0]}px`;
              }
            }

            const preview: any = { x: nx, y: ny, width: nw, height: nh };
            if (newFontSize) { preview.fontSize = newFontSize; }
            bulkDragPreviewManualRef.current[currentSelectedLayerId] = preview;
          }
        }

        const currentRotateState = rotateStateRef.current;
        if (currentRotateState?.isRotating) {
          const { initialLayers, centerX, centerY, canvasCenterX, canvasCenterY, initialRotation, startX, startY } =
            currentRotateState;
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const startAngle = Math.atan2(startY - centerY, startX - centerX);
          const rawRotationDelta = (angle - startAngle) * (180 / Math.PI);

          const snapAngle = e.shiftKey ? ROTATION_SNAP_SHIFT_ANGLE : ROTATION_SNAP_ANGLE;
          const deltaAngle = Math.round(rawRotationDelta / snapAngle) * snapAngle;

          if (initialLayers && canvasCenterX !== undefined && canvasCenterY !== undefined) {
            const updates: Record<string, any> = {};
            const rad = deltaAngle * (Math.PI / 180);
            const cos = Math.cos(rad),
              sin = Math.sin(rad);

            Object.entries(initialLayers).forEach(([id, layer]) => {
              const lHeight = (layer as any).height || 0;
              const lWidth = layer.width || 0;
              const cx = layer.x + lWidth / 2,
                cy = layer.y + lHeight / 2;
              const rx = cx - canvasCenterX,
                ry = cy - canvasCenterY;
              const nx = rx * cos - ry * sin,
                ny = rx * sin + ry * cos;
              const fx = canvasCenterX + nx - lWidth / 2,
                fy = canvasCenterY + ny - lHeight / 2;
              const fr = (layer.rotation + deltaAngle) % 360;

              updates[id] = { x: fx, y: fy, rotation: fr };
              bulkDragPreviewManualRef.current[id] = updates[id];

              const domNode = layerRefs.current[id];
              if (domNode) {
                const l = layer as any;
                domNode.style.left = `${fx}px`;
                domNode.style.top = `${fy}px`;
                domNode.style.transform = `${l.perspective ? `perspective(${l.perspective}px)` : ''} rotateX(${l.rotateX || 0}deg) rotateY(${l.rotateY || 0}deg) rotate(${fr}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`;
              }
            });
            if (onUpdateLayers) {
              onUpdateLayers(updates);
            }
          } else if (currentSelectedLayerId && currentRotateState) {
            const rotation = Math.round((initialRotation + rawRotationDelta) / snapAngle) * snapAngle;
            const domNode = layerRefs.current[currentSelectedLayerId];
            const layer = layersRef.current.find((l: Layer) => l.id === currentSelectedLayerId);
            if (domNode && layer) {
              const l = layer as any;
              domNode.style.transform = `${l.perspective ? `perspective(${l.perspective}px)` : ''} rotateX(${l.rotateX || 0}deg) rotateY(${l.rotateY || 0}deg) rotate(${rotation}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`;
            }
            const update = { rotation };
            bulkDragPreviewManualRef.current[currentSelectedLayerId] = update as any;
            if (onUpdateLayers) {
              onUpdateLayers({ [currentSelectedLayerId]: update });
            }
          }
        }
      });
    },
    [
      getSnapLines,
      onUpdateLayers,
      selectedLayerId,
      activeArtboard,
      getResizeSnapLines,
      snapToGrid,
      snapToObjects,
      effectiveShapeLayers,
      effectiveImageLayers,
      effectiveTextLayers,
      isLassoMode,
      isDrawingLasso,
      lassoPoints,
      setLassoPoints,
      zoom,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (mouseMoveRequestRef.current) {
      cancelAnimationFrame(mouseMoveRequestRef.current);
      mouseMoveRequestRef.current = undefined;
    }

    if (isLassoMode && isDrawingLasso) {
      setIsDrawingLasso(false);
      if (localLassoPoints.length > 5) {
        setLassoPoints(localLassoPoints);
        // Add timeout to ensure state settles
        setTimeout(() => applyLasso(), 0);
      }
      setLocalLassoPoints([]);
      return;
    }

    if (isRefining && refineCanvasRef.current && croppingLayerId) {
      setIsRefining(false);
      drawingLastPos.current = { x: 0, y: 0 };
      const dataURL = refineCanvasRef.current.toDataURL();
      if (onUpdateLayers) {
        onUpdateLayers({
          [croppingLayerId]: {
            maskDataURL: dataURL,
            maskType: 'bitmap'
          }
        });
      }
      return;
    }

    const currentDragState = dragStateRef.current;
    const currentBulkDragPreview = bulkDragPreviewManualRef.current;
    const currentResizeState = resizeStateRef.current;
    const currentRotateState = rotateStateRef.current;

    const accumulatedUpdates: Record<string, any> = {};
    if (currentDragState?.isDragging || currentResizeState?.isResizing || currentRotateState?.isRotating) {
      Object.entries(currentBulkDragPreview).forEach(([id, changes]) => {
        // === SNAP TO INTEGER PIXELS on mouseUp — prevents blurry subpixel rendering in exports ===
        const snapped: any = { ...changes };
        if (typeof snapped.x === 'number') { snapped.x = Math.round(snapped.x); }
        if (typeof snapped.y === 'number') { snapped.y = Math.round(snapped.y); }
        if (typeof snapped.width === 'number') { snapped.width = Math.round(snapped.width); }
        if (typeof snapped.height === 'number') { snapped.height = Math.round(snapped.height); }
        accumulatedUpdates[id] = snapped;
      });
    }

    if (panOffsetRef.current.x !== panOffset.x || panOffsetRef.current.y !== panOffset.y) {
      setPanOffset(panOffsetRef.current);
    }

    if (Object.keys(accumulatedUpdates).length > 0 && onUpdateLayers) {
      onUpdateLayers(accumulatedUpdates);
    }

    setDragState(null);
    setResizeState(null);
    setRotateState(null);
    if (snapVerticalRef.current) {
      snapVerticalRef.current.style.display = 'none';
    }
    if (snapHorizontalRef.current) {
      snapHorizontalRef.current.style.display = 'none';
    }
    setIsPanning(false);
    bulkDragPreviewManualRef.current = {};
  }, [
    onUpdateLayers,
    panOffset.x,
    panOffset.y,
    isLassoMode,
    isDrawingLasso,
    localLassoPoints,
    applyLasso,
    setLassoPoints,
  ]);

  useEffect(() => {
    const onUp = () => handleMouseUp();
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [handleMouseUp]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0]!,
        t2 = e.touches[1]!;
      const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      lastTouchDistance.current = dist;
    } else if (e.touches.length === 1) {
      const t = e.touches[0]!;
      setPanStart({ x: t.clientX, y: t.clientY });
      setIsPanning(true);
    }
  };

  const lastTouchDistance = useRef<number | null>(null);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current) {
      e.preventDefault();
      const t1 = e.touches[0]!,
        t2 = e.touches[1]!;
      const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      const scaleFactor = dist / lastTouchDistance.current;
      const newZoom = Math.min(Math.max(0.1, zoom * scaleFactor), 5);
      if (Math.abs(newZoom - zoom) > 0.01) {
        onZoomChange(newZoom);
        lastTouchDistance.current = dist;
      }
    } else if (e.touches.length === 1 && isPanning) {
      const t = e.touches[0]!;
      const dx = t.clientX - panStart.x;
      const dy = t.clientY - panStart.y;
      if (panContainerRef.current) {
        const newX = panOffsetRef.current.x + dx;
        const newY = panOffsetRef.current.y + dy;
        panContainerRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
        panOffsetRef.current = { x: newX, y: newY };
      }
      setPanStart({ x: t.clientX, y: t.clientY });
    }
  };

  // Drawing Logic - Enhanced with brush-specific rendering
  const handleDrawingMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingCanvasRef.current) {
      return;
    }
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left),
      y = (e.clientY - rect.top);
    drawingLastPos.current = { x, y };
    drawingBuffer.current = [{ x, y }];
    setDrawingState({ isDrawingPath: true });
    if (brushType === BrushType.VECTOR_PENCIL) {
      setVectorPoints([{ x, y }]);
    }
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = brushOpacity;

      // Brush-specific settings
      switch (brushType) {
        case BrushType.PENCIL:
          ctx.lineWidth = brushSize * zoom * 0.5;
          ctx.globalAlpha = brushOpacity * 0.8;
          break;
        case BrushType.CALLIGRAPHY:
          ctx.lineCap = 'square';
          ctx.lineWidth = brushSize * zoom * 1.5;
          break;
        case BrushType.OIL:
          ctx.lineWidth = brushSize * zoom * 2;
          ctx.globalAlpha = brushOpacity * 0.9;
          break;
        case BrushType.CRAYON:
          ctx.lineWidth = brushSize * zoom * 1.2;
          ctx.setLineDash([2, 1]);
          break;
        case BrushType.WATERCOLOR:
          ctx.globalAlpha = brushOpacity * 0.3;
          ctx.lineWidth = brushSize * zoom * 1.5;
          break;
        case BrushType.SPLATTER:
          ctx.lineWidth = brushSize * zoom * 0.8;
          ctx.globalAlpha = brushOpacity * 0.6;
          break;
        case BrushType.TEXTURE:
          ctx.setLineDash([5, 3]);
          ctx.lineWidth = brushSize * zoom * 1.3;
          break;
        default:
          ctx.setLineDash([]);
      }
    }
  };

  const handleDrawingMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingState.isDrawingPath || !drawingCanvasRef.current) {
      return;
    }
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left);
    let y = (e.clientY - rect.top);

    // Apply Jitter
    if (brushJitter > 0) {
      const jitterAmount = (brushJitter / 100) * brushSize * zoom;
      x += (Math.random() - 0.5) * jitterAmount;
      y += (Math.random() - 0.5) * jitterAmount;
    }

    const ctx = drawingCanvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    // Apply Smoothing/Stabilization
    drawingBuffer.current.push({ x, y });
    if (drawingBuffer.current.length > 1) {
      const smoothingFactor = brushSmoothing / 100;
      const last = drawingBuffer.current[drawingBuffer.current.length - 2]!;
      const current = drawingBuffer.current[drawingBuffer.current.length - 1]!;

      // Basic weighted average smoothing
      x = last.x + (current.x - last.x) * (1 - smoothingFactor * 0.8);
      y = last.y + (current.y - last.y) * (1 - smoothingFactor * 0.8);

      // Update current in buffer with smoothed values
      drawingBuffer.current[drawingBuffer.current.length - 1] = { x, y };
    }

    if (brushType === BrushType.VECTOR_PENCIL) {
      setVectorPoints((prev) => [...prev, { x, y }]);
      ctx.strokeStyle = '#a855f7'; // Distinct vector preview color
      ctx.setLineDash([5, 5]); // Dashed line for vector preview
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Add randomness for certain brushes
      if ([BrushType.SPLATTER, BrushType.CRAYON, BrushType.TEXTURE].includes(brushType)) {
        const randomOffset = (Math.random() - 0.5) * brushSize * zoom * 0.5;
        ctx.lineTo(x + randomOffset, y + randomOffset);
      } else {
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reset line dash for next stroke
      if ([BrushType.CRAYON, BrushType.TEXTURE].includes(brushType)) {
        ctx.setLineDash([]);
      }
    }
    drawingLastPos.current = { x, y };
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawing) {
      return;
    }
    setDrawingState({ ...drawingState, isDrawingPath: false });
    drawingBuffer.current = [];
    if (brushType === BrushType.VECTOR_PENCIL && vectorPoints.length > 2) {
      let d = `M ${vectorPoints[0]!.x} ${vectorPoints[0]!.y}`;
      for (let i = 1; i < vectorPoints.length - 1; i++) {
        const p1 = vectorPoints[i]!,
          p2 = vectorPoints[i + 1]!;
        d += ` Q ${p1.x} ${p1.y} ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2}`;
      }
      d += ` L ${vectorPoints[vectorPoints.length - 1]!.x} ${vectorPoints[vectorPoints.length - 1]!.y}`;
      onVectorDrawingComplete?.(d, { color: brushColor, width: brushSize, opacity: brushOpacity });
      drawingCanvasRef.current
        ?.getContext('2d')
        ?.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      setVectorPoints([]);
    } else {
      onDrawingComplete?.(drawingCanvasRef.current?.toDataURL('image/png') || '');
      drawingCanvasRef.current
        ?.getContext('2d')
        ?.clearRect(0, 0, drawingCanvasRef.current!.width, drawingCanvasRef.current!.height);
    }
  };

  const handleTextDoubleClick = useCallback((e: React.MouseEvent, layer: TextLayer) => {
    e.stopPropagation();
    setEditingTextId(layer.id);
    setTimeout(() => textEditRef.current?.focus(), 0);
  }, []);

  const finishEditingText = useCallback(() => {
    if (editingTextId && textEditRef.current) {
      // Get the text content from the contentEditable div
      // Use trim() to remove trailing newlines but preserve intentional whitespace
      const newText = textEditRef.current.innerText || textEditRef.current.textContent || '';
      
      // Only update if the text has actually changed
      const currentLayer = useStore.getState().artboards.flatMap(a => a.layers).find((l: Layer) => l.id === editingTextId);
      if (currentLayer && currentLayer.type === 'text' && currentLayer.text === newText) {
        // Text hasn't changed, just exit edit mode
        setEditingTextId(null);
        return;
      }
      
      // Save to history before updating to ensure the change is persisted
      useStore.getState().saveToHistory();
      
      // Update the text and also update the layer name to match the text
      const updates: Partial<TextLayer> = { text: newText };
      if (currentLayer && currentLayer.type === 'text') {
        const autoName = newText.length > 20 ? newText.slice(0, 20) + '…' : newText;
        updates.name = autoName;
      }
      onUpdateLayers?.({ [editingTextId]: updates });
    }
    setEditingTextId(null);
  }, [editingTextId, onUpdateLayers]);

  const handleDropShape = useCallback(
    (e: React.DragEvent, layerId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0]!;
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) =>
            onUpdateLayers?.({ [layerId]: { backgroundImage: ev.target?.result as string, color: 'transparent' } });
          reader.readAsDataURL(file);
        }
      }
    },
    [onUpdateLayers]
  );

  return (
    <ErrorBoundary componentName="Canvas" variant="widget">
      <div className="flex-1 relative bg-[#13161a] overflow-hidden flex flex-col">
        <style>{ANIMATION_STYLES}</style>

        <div
          ref={viewportRef}
          className="flex-1 overflow-hidden relative bg-gray-900 touch-none select-none transition-transform duration-300 ease-out"
          style={{
            minHeight: '100%',
            minWidth: '100%',
            WebkitOverflowScrolling: 'touch',
            cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default'
          }}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              onZoomChange(Math.min(Math.max(0.1, zoom - e.deltaY * 0.01), 5));
            }
          }}
          onMouseDown={handleMouseDownContainer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
            if (files.length > 0) {
              onFileUpload?.(files);
            } else {
              const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('url');
              if (url?.startsWith('http') || url?.startsWith('data:')) {
                onAddLogoToCanvas(url);
              }
            }
          }}
        >
          <div
            ref={panContainerRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {artboards.map((artboard) => (
              <div 
                key={artboard.id}
                className="absolute pointer-events-auto"
                style={{
                  left: artboard.x,
                  top: artboard.y,
                  width: artboard.width,
                  height: artboard.height,
                }}
                onClick={() => useStore.getState().setActiveArtboardId(artboard.id)}
              >
                {/* Artboard Header */}
                <div className="absolute -top-10 left-0 flex items-center gap-3 pointer-events-none">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap bg-[#1e1e1e] px-2 py-1 rounded-t-lg border-x border-t border-white/10">
                      {artboard.name}
                    </span>
                    <span className="text-[9px] font-bold text-gray-500 bg-black/40 px-2 py-0.5 rounded-b-lg border-x border-b border-white/5">
                      {artboard.width} × {artboard.height}
                    </span>
                  </div>

                  {/* Artboard Management Buttons on Canvas */}
                  <div className="flex items-center gap-1 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddArtboard();
                      }}
                      className="w-6 h-6 flex items-center justify-center bg-[#1e1e1e] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-[#7d2ae8] transition-all shadow-xl"
                      title="Add Artboard"
                    >
                      <Icons.Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        useStore.getState().deleteArtboard(artboard.id);
                      }}
                      className="w-6 h-6 flex items-center justify-center bg-[#1e1e1e] border border-white/10 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all shadow-xl"
                      title="Delete Artboard"
                    >
                      <Icons.Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div
                  className={`relative shadow-2xl bg-white overflow-hidden ${activeArtboardId === artboard.id ? 'ring-2 ring-[#7d2ae8]/50' : 'ring-1 ring-white/10'}`}
                  style={{
                    width: artboard.width,
                    height: artboard.height,
                    backgroundColor: artboard.backgroundColor || canvasBackgroundColor,
                    filter: activeArtboardId === artboard.id ? 
                      `brightness(${canvasFilters.brightness}%) contrast(${canvasFilters.contrast}%) saturate(${canvasFilters.saturation}%) sepia(${canvasFilters.sepia}%) grayscale(${canvasFilters.grayscale}%) blur(${canvasFilters.blur}px)` : 
                      'none',
                    opacity: activeArtboardId === artboard.id ? canvasFilters.opacity : 1,
                  }}
                >
                  <CanvasLayerRenderer
                    layers={artboard.layers}
                    effectiveLayers={artboard.layers.map((l) => getEffectiveLayer(l))}
                    selectedLayerId={selectedLayerId}
                    selectedLayerIds={selectedLayerIds}
                    hoveredLayerId={hoveredLayerId}
                    setHoveredLayerId={setHoveredLayerId}
                    setLayerRef={(id, el) => {
                      layerRefs.current[id] = el;
                    }}
                    handleMouseDownLayer={handleMouseDownLayer}
                    handleResizeStart={handleResizeStart}
                    handleRotateStart={handleRotateStart}
                    handleContextMenu={handleContextMenu}
                    handleTextDoubleClick={handleTextDoubleClick}
                    handleDropShape={handleDropShape}
                    onDoubleClickLayer={onDoubleClickLayer}
                    editingTextId={editingTextId}
                    textEditRef={textEditRef}
                    finishEditingText={finishEditingText}
                    editingPathId={editingPathId}
                    onUpdatePath={onUpdatePath}
                    zoom={zoom}
                    previewAnimation={previewAnimation}
                    isInteracting={!!dragState || !!resizeState || !!rotateState}
                  />

                  {/* Artboard specific overlays */}
                  {activeArtboardId === artboard.id && (
                    <>
                      {showGrid && (
                        <div
                          className="absolute inset-0 pointer-events-none z-[60] opacity-10"
                          style={{
                            backgroundImage:
                              'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                            backgroundSize: '100px 100px',
                          }}
                        />
                      )}

                      {/* Creative Tool Canvases */}
                      {(isDrawing || isRefining) && (
                        <canvas
                          ref={isRefining ? refineCanvasRef : drawingCanvasRef}
                          className="absolute inset-0 z-[70] cursor-crosshair touch-none"
                          width={artboard.width}
                          height={artboard.height}
                          onMouseDown={isRefining ? undefined : handleDrawingMouseDown}
                          onMouseMove={isRefining ? handleMouseMove : handleDrawingMouseMove}
                          onMouseUp={isRefining ? handleMouseUp : handleDrawingMouseUp}
                        />
                      )}

                      {isLassoMode && (
                        <svg className="absolute inset-0 z-[70] pointer-events-none w-full h-full">
                          {localLassoPoints.length > 1 && (
                            <polyline
                              points={localLassoPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill="rgba(125, 42, 232, 0.2)"
                              stroke="#7d2ae8"
                              strokeWidth={2 / zoom}
                              strokeDasharray="5,5"
                            />
                          )}
                        </svg>
                      )}

                      {booleanPreview && (
                        <svg className="absolute inset-0 z-[75] pointer-events-none w-full h-full">
                          <path
                            d={booleanPreview.path}
                            fill="rgba(168, 85, 247, 0.15)"
                            stroke="#a855f7"
                            strokeWidth={3 / zoom}
                            strokeDasharray={`${6 / zoom},${4 / zoom}`}
                            className="animate-pulse"
                          />
                        </svg>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Global Multi-selection handles across the workspace */}
            {selectedLayerIds.length > 1 && (
              <div className="absolute inset-0 pointer-events-none z-[80]">
                <MultiSelectionHandles
                  layers={artboards.flatMap(a => a.layers).filter((l) => selectedLayerIds.includes(l.id))}
                  zoom={zoom}
                  onResize={handleResizeStart}
                  onRotate={handleRotateStart}
                />
              </div>
            )}
          </div>
        </div>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            layerId={contextMenu.layerId}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export const Canvas = React.memo(CanvasComponent);
