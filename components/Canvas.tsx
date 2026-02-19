import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  TextLayer,
  ShapeLayer,
  ImageLayer,
  Layer,
  BrushType,
  GeneratedImage,
  AnimationSettings,
  ResizeHandle,
} from '../types';
import { Icons } from '../constants';
import { Ruler } from './Ruler';
import { ContextMenu } from './ContextMenu';
import { GeometryOracle } from '../utils/geometryOracle';
import { GoldenRatioOverlay } from './GoldenRatioOverlay';
import { CropOverlay } from './overlays/CropOverlay';
import { MultiSelectionHandles } from './canvas/MultiSelectionHandles';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem } from './canvas/LayerItems';
import { getLayerClipPath } from '../utils/layerRendering';
import {
  GRID_SIZE,
  SNAP_THRESHOLD,
  ROTATION_SNAP_ANGLE,
  ROTATION_SNAP_SHIFT_ANGLE,
  ANIMATION_STYLES,
} from './canvas/CanvasConstants';
import { ErrorBoundary } from './ErrorBoundary';

// ... existing imports ...

interface CanvasProps {
  zoom: number;
  onZoomChange: (z: number) => void;
  onFileUpload?: (files: File[]) => void;
  onAddLogoToCanvas: (url: string) => void;
  onDoubleClickLayer?: (layer: Layer) => void;
  activeImage?: GeneratedImage;
  uploadedImage?: string | null;
  onInteractionStart?: () => void;
  onUpdateTextLayerProp?: (id: string, changes: Partial<TextLayer>) => void;
  onUpdateShapeLayerProp?: (id: string, changes: Partial<ShapeLayer>) => void;
  onUpdateImageLayerProp?: (id: string, changes: Partial<ImageLayer>) => void;
  onOpenAIPanel?: () => void;
  onOpenTemplates?: () => void;
  previewAnimation?: AnimationSettings;
}

const CanvasComponent: React.FC<CanvasProps> = ({
  zoom,
  onZoomChange,
  onFileUpload,
  onAddLogoToCanvas,
  onDoubleClickLayer,
  onInteractionStart,
  activeImage,
  uploadedImage,
  previewAnimation,
}) => {
  // Essential state using fine-grained selectors for performance
  const isProcessing = useStore((state) => state.isProcessing);
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);
  const canvasFilters = useStore((state) => state.canvasFilters);
  const layers = useStore((state) => state.layers);
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
  const onDrawingComplete = useStore((state) => state.handleDrawingComplete);
  const onVectorDrawingComplete = useStore((state) => state.handleVectorDrawingComplete);
  const canvasSize = useStore((state) => state.canvasSize);
  const onSetCanvasSize = useStore((state) => state.setCanvasSize);
  const onGroup = useStore((state) => state.groupSelected);
  const onUngroup = useStore((state) => state.ungroupSelected);
  const editingPathId = useStore((state) => state.editingPathId);
  const onUpdatePath = useStore((state) => state.updateLayer);
  const showGoldenRatio = useStore((state) => state.showGoldenRatio);
  const isCropMode = useStore((state) => state.isCropMode);
  const snapToGrid = useStore((state) => state.snapToGrid);
  const snapToObjects = useStore((state) => state.snapToObjects);

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

  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

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
  const drawingLastPos = useRef({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [vectorPoints, setVectorPoints] = useState<{ x: number; y: number }[]>([]);

  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const panContainerRef = useRef<HTMLDivElement>(null);
  const snapVerticalRef = useRef<HTMLDivElement>(null);
  const snapHorizontalRef = useRef<HTMLDivElement>(null);
  const textEditRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const bgImage = activeImage?.url || uploadedImage;

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

  // Refs for state sync in handlers
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;
  const resizeStateRef = useRef(resizeState);
  resizeStateRef.current = resizeState;
  const rotateStateRef = useRef(rotateState);
  rotateStateRef.current = rotateState;
  const selectedLayerIdsRef = useRef(selectedLayerIds);
  selectedLayerIdsRef.current = selectedLayerIds;
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const isPanningRef = useRef(isPanning);
  isPanningRef.current = isPanning;
  const panStartRef = useRef(panStart);
  panStartRef.current = panStart;
  const isSpacePressedRef = useRef(isSpacePressed);
  isSpacePressedRef.current = isSpacePressed;
  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;

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

      const canvasCenterX = canvasSize.width / 2;
      const canvasCenterY = canvasSize.height / 2;

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
      if (Math.abs(currentX + layerWidth - canvasSize.width) < threshold) {
        snapX.push(canvasSize.width);
        newX = canvasSize.width - layerWidth;
      }
      if (Math.abs(currentY) < threshold) {
        snapY.push(0);
        newY = 0;
      }
      if (Math.abs(currentY + layerHeight - canvasSize.height) < threshold) {
        snapY.push(canvasSize.height);
        newY = canvasSize.height - layerHeight;
      }

      if (snapToObjects) {
        const otherLayers = [...effectiveShapeLayers, ...effectiveImageLayers, ...effectiveTextLayers].filter(
          (l) => l.id !== currentLayer.id
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
      canvasSize.width,
      canvasSize.height,
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
          (l) => l.id !== currentLayer.id
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
      if (isSpacePressedRef.current) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      } else {
        onSelectLayer(null);
        setEditingTextId(null);
      }
    },
    [onSelectLayer]
  );

  const handleMouseDownLayer = useCallback(
    (e: React.MouseEvent, layer: Layer) => {
      if (isSpacePressedRef.current || isDrawingRef.current || layer.locked) {
        return;
      }
      e.stopPropagation();

      if (e.shiftKey && onMultiSelectLayer) {
        onMultiSelectLayer(layer.id, true);
      } else {
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
        const selectionBox = (e.target as HTMLElement).closest('.group');
        if (selectionBox) {
          const boxRect = selectionBox.getBoundingClientRect();
          setRotateState({
            isRotating: true,
            startX: e.clientX,
            startY: e.clientY,
            initialRotation: layer.rotation,
            centerX: boxRect.left + boxRect.width / 2,
            centerY: boxRect.top + boxRect.height / 2,
          });
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
              const primaryLayerId = currentSelectedLayerId || currentSelectedLayerIds[0];
              const primaryLayer = currentLayers.find((l) => l.id === primaryLayerId);

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
            const ny = initialPos.y + finalDy;
            newBulkPreview[id] = { x: nx, y: ny };

            const domNode = layerRefs.current[id];
            if (domNode) {
              domNode.style.left = `${nx}px`;
              domNode.style.top = `${ny}px`;
            }
          });
          bulkDragPreviewManualRef.current = newBulkPreview;
        } else {
          if (snapVerticalRef.current) {
            snapVerticalRef.current.style.display = 'none';
          }
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
                  (domNode.firstChild as HTMLElement).style.fontSize = `${preview.fontSize}px`;
                }
              }
            });
            bulkDragPreviewManualRef.current = newBulkPreview;
            if (onUpdateLayers) {
              onUpdateLayers(newBulkPreview);
            }
          } else if (initialLayer && currentSelectedLayerId) {
            const { x: ix, y: iy, width: iw } = initialLayer;
            const ih = (initialLayer as any).height || 0;
            let nx = ix,
              ny = iy,
              nw = iw,
              nh = ih;

            if (handle.includes('e')) {
              nw += dx;
            }
            if (handle.includes('w')) {
              nx += dx;
              nw -= dx;
            }
            if (handle.includes('s')) {
              nh += dy;
            }
            if (handle.includes('n')) {
              ny += dy;
              nh -= dy;
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

            bulkDragPreviewManualRef.current[currentSelectedLayerId] = { x: nx, y: ny, width: nw, height: nh } as any;
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
            const layer = layersRef.current.find((l) => l.id === currentSelectedLayerId);
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
      canvasSize,
      getResizeSnapLines,
      snapToGrid,
      snapToObjects,
      effectiveShapeLayers,
      effectiveImageLayers,
      effectiveTextLayers,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (mouseMoveRequestRef.current) {
      cancelAnimationFrame(mouseMoveRequestRef.current);
      mouseMoveRequestRef.current = undefined;
    }

    const currentDragState = dragStateRef.current;
    const currentBulkDragPreview = bulkDragPreviewManualRef.current;
    const currentResizeState = resizeStateRef.current;
    const currentRotateState = rotateStateRef.current;

    const accumulatedUpdates: Record<string, any> = {};
    if (currentDragState?.isDragging || currentResizeState?.isResizing || currentRotateState?.isRotating) {
      Object.entries(currentBulkDragPreview).forEach(([id, changes]) => {
        accumulatedUpdates[id] = changes;
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
  }, [onUpdateLayers, panOffset.x, panOffset.y]);

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

  // Drawing Logic
  const handleDrawingMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingCanvasRef.current) {
      return;
    }
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom,
      y = (e.clientY - rect.top) / zoom;
    drawingLastPos.current = { x, y };
    setDrawingState({ isDrawingPath: true });
    if (brushType === BrushType.VECTOR_PENCIL) {
      setVectorPoints([{ x, y }]);
    }
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = brushOpacity;
    }
  };

  const handleDrawingMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingState.isDrawingPath || !drawingCanvasRef.current) {
      return;
    }
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom,
      y = (e.clientY - rect.top) / zoom;
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    if (brushType === BrushType.VECTOR_PENCIL) {
      setVectorPoints((prev) => [...prev, { x, y }]);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    drawingLastPos.current = { x, y };
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawing) {
      return;
    }
    setDrawingState({ ...drawingState, isDrawingPath: false });
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

  const finishEditingText = () => {
    if (editingTextId && textEditRef.current) {
      const newText = textEditRef.current.innerText || '';
      if (newText.trim()) {
        onUpdateLayers?.({ [editingTextId]: { text: newText } });
      }
    }
    setEditingTextId(null);
  };

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
        <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
              className="p-1 hover:bg-gray-700 rounded text-gray-400"
            >
              <Icons.ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
              className="p-1 hover:bg-gray-700 rounded text-gray-400"
            >
              <Icons.ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleGrid(!showGrid)}
              className={`p-2 rounded ${showGrid ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-400'}`}
            >
              <Icons.Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => onToggleRulers(!showRulers)}
              className={`p-2 rounded ${showRulers ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-400'}`}
            >
              <Icons.Layout className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="w-12 bg-[#252627] border border-gray-600 rounded px-1 py-0.5 text-[10px] text-gray-300 text-center"
                defaultValue={canvasSize.width}
                onBlur={(e) => onSetCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || canvasSize.width })}
              />
              <span className="text-[10px] text-gray-500">×</span>
              <input
                type="number"
                className="w-12 bg-[#252627] border border-gray-600 rounded px-1 py-0.5 text-[10px] text-gray-300 text-center"
                defaultValue={canvasSize.height}
                onBlur={(e) =>
                  onSetCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || canvasSize.height })
                }
              />
              <span className="text-[10px] text-gray-500">px</span>
            </div>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="flex-1 overflow-hidden relative bg-gray-900 cursor-grab active:cursor-grabbing touch-none"
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
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
          >
            <div
              ref={containerRef}
              className="relative shadow-2xl origin-center bg-white pointer-events-auto"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
                transform: `scale(${zoom})`,
                backgroundColor: canvasBackgroundColor,
                filter: `brightness(${canvasFilters.brightness}%) contrast(${canvasFilters.contrast}%) saturate(${canvasFilters.saturation}%) sepia(${canvasFilters.sepia}%) grayscale(${canvasFilters.grayscale}%) blur(${canvasFilters.blur}px)`,
                opacity: canvasFilters.opacity,
              }}
            >
              {showRulers && (
                <>
                  <Ruler type="horizontal" length={canvasSize.width} zoom={zoom} />
                  <Ruler type="vertical" length={canvasSize.height} zoom={zoom} />
                </>
              )}

              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none z-[60] opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
              )}

              {showGoldenRatio && <GoldenRatioOverlay width={canvasSize.width} height={canvasSize.height} />}

              <div
                ref={snapVerticalRef}
                className="absolute top-0 bottom-0 w-px bg-cyan-400 z-[100] pointer-events-none hidden shadow-[0_0_4px_rgba(34,211,238,0.8)]"
              />
              <div
                ref={snapHorizontalRef}
                className="absolute left-0 right-0 h-px bg-cyan-400 z-[100] pointer-events-none hidden shadow-[0_0_4px_rgba(34,211,238,0.8)]"
              />

              {bgImage && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                  <img
                    src={bgImage}
                    className="w-full h-full object-contain"
                    style={{ filter: `opacity(${canvasFilters.opacity})` }}
                  />
                </div>
              )}

              {effectiveLayers
                .filter((l) => !l.groupId)
                .map((l) => {
                  const setLayerRef = (el: HTMLDivElement | null) => {
                    layerRefs.current[l.id] = el;
                  };
                  const maskLayer = l.maskLayerId ? layers.find((ml) => ml.id === l.maskLayerId) : null;
                  const maskPath = maskLayer ? getLayerClipPath(maskLayer) : undefined;
                  const isSelected = selectedLayerId === l.id || selectedLayerIds.includes(l.id);

                  if (l.type === 'image') {
                    return (
                      <ImageLayerItem
                        key={l.id}
                        ref={setLayerRef}
                        layer={l as ImageLayer}
                        isSelected={isSelected}
                        isHovered={hoveredLayerId === l.id}
                        onMouseDown={handleMouseDownLayer}
                        onMouseEnter={setHoveredLayerId}
                        onMouseLeave={() => setHoveredLayerId(null)}
                        onResize={handleResizeStart}
                        onRotate={handleRotateStart}
                        onContextMenu={handleContextMenu}
                        previewAnimation={previewAnimation}
                        maskPath={maskPath}
                      />
                    );
                  }

                  if (l.type === 'text') {
                    return (
                      <React.Fragment key={l.id}>
                        {editingTextId === l.id ? (
                          <div
                            ref={textEditRef}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={finishEditingText}
                            className="absolute bg-transparent border-2 border-[#7d2ae8] outline-none z-[100] cursor-text min-w-[50px]"
                            style={{
                              left: l.x,
                              top: l.y,
                              width: l.width,
                              fontSize: (l as TextLayer).fontSize,
                              fontFamily: (l as TextLayer).fontFamily,
                              fontWeight: (l as TextLayer).fontWeight,
                              textAlign: (l as TextLayer).textAlign,
                              color: (l as TextLayer).color,
                              transform: `rotate(${l.rotation}deg)`,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              clipPath: maskPath,
                            }}
                          >
                            {l.text}
                          </div>
                        ) : (
                          <TextLayerItem
                            ref={setLayerRef}
                            layer={l as TextLayer}
                            isSelected={isSelected}
                            isHovered={hoveredLayerId === l.id}
                            onMouseDown={handleMouseDownLayer}
                            onMouseEnter={setHoveredLayerId}
                            onMouseLeave={() => setHoveredLayerId(null)}
                            onResize={handleResizeStart}
                            onRotate={handleRotateStart}
                            onContextMenu={handleContextMenu}
                            onDoubleClick={handleTextDoubleClick}
                            isInteracting={!!dragState || !!resizeState || !!rotateState}
                            previewAnimation={previewAnimation}
                            maskPath={maskPath}
                          />
                        )}
                      </React.Fragment>
                    );
                  }

                  return (
                    <ShapeLayerItem
                      key={l.id}
                      ref={setLayerRef}
                      layer={l as ShapeLayer}
                      isSelected={isSelected}
                      isHovered={hoveredLayerId === l.id}
                      onMouseDown={handleMouseDownLayer}
                      onMouseEnter={setHoveredLayerId}
                      onMouseLeave={() => setHoveredLayerId(null)}
                      onResize={handleResizeStart}
                      onRotate={handleRotateStart}
                      onContextMenu={handleContextMenu}
                      onDrop={handleDropShape}
                      onDoubleClick={(_e, layer) => onDoubleClickLayer?.(layer)}
                      editingPathId={editingPathId}
                      onUpdatePath={onUpdatePath}
                      zoom={zoom}
                      previewAnimation={previewAnimation}
                      maskPath={maskPath}
                    />
                  );
                })}

              {selectedLayerIds.length > 1 && (
                <div className="absolute inset-0 pointer-events-none z-[80]">
                  <MultiSelectionHandles
                    layers={layers.filter((l) => selectedLayerIds.includes(l.id))}
                    zoom={zoom}
                    onResize={handleResizeStart}
                    onRotate={handleRotateStart}
                  />
                </div>
              )}

              {isCropMode && (
                <div className="absolute inset-0 pointer-events-none z-[1002]">
                  <CropOverlay zoom={zoom} canvasSize={canvasSize} />
                </div>
              )}

              <canvas
                ref={drawingCanvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className={`absolute inset-0 z-[100] touch-none ${isDrawing ? 'cursor-crosshair opacity-100' : 'pointer-events-none opacity-0'}`}
                onMouseDown={handleDrawingMouseDown}
                onMouseMove={handleDrawingMouseMove}
                onMouseUp={handleDrawingMouseUp}
              />

              {/* Zero State / Empty Canvas Helper */}
              {!bgImage && layers.length === 0 && !isDrawing && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center z-[50]">
                  <div
                    className="flex flex-col items-center gap-6 p-10 rounded-3xl"
                    style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <h2 className="text-xl font-black text-gray-800 tracking-tight">Your canvas is empty</h2>
                      <p className="text-sm text-gray-500">Pick a starting point to begin creating</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full min-w-[220px]">
                      <button
                        className="flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.03] active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #7d2ae8, #00c4cc)' }}
                        onClick={() => {
                          const event = new CustomEvent('open-panel', { detail: 'MAGIC' });
                          window.dispatchEvent(event);
                        }}
                      >
                        <span className="text-xl">✨</span>
                        <span>Generate with AI</span>
                      </button>
                      <button
                        className="flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-sm text-gray-700 bg-white border border-gray-200 shadow hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-[1.03] active:scale-[0.98]"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || []);
                            if (files.length > 0) {
                              onFileUpload?.(files);
                            }
                          };
                          input.click();
                        }}
                      >
                        <span className="text-xl"></span>
                        <span>Upload an Image</span>
                      </button>
                    </div>
                    <div className="flex gap-4 text-[10px] text-gray-400 font-mono">
                      <span>
                        <kbd className="bg-gray-100 border border-gray-300 rounded px-1">T</kbd> Text
                      </span>
                      <span>
                        <kbd className="bg-gray-100 border border-gray-300 rounded px-1">R</kbd> Rect
                      </span>
                      <span>
                        <kbd className="bg-gray-100 border border-gray-300 rounded px-1">C</kbd> Circle
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
