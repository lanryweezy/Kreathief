import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { activeArtboardSelector, selectedLayerIdSelector, selectedLayersSelector } from '../store/selectors';
import { TextLayer, ShapeLayer, ImageLayer, Layer, AnimationSettings } from '../types';
import { ANIMATION_STYLES } from './canvas/CanvasConstants';
import { ErrorBoundary } from './ErrorBoundary';
import { useTouchGestures } from '../hooks/useTouchGestures';

// Specialized Sub-components & Hooks
import { useCanvasInteractions } from './canvas/useCanvasInteractions';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import { CanvasControls } from './canvas/CanvasControls';
import { CanvasGuides } from './canvas/CanvasGuides';
import { ContextualToolbar } from './canvas/ContextualToolbar';

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
  onUpdatePath?: (path: any) => void;
  onSelectLayer?: (id: string | null) => void;
  previewAnimation?: AnimationSettings;
}

const CanvasComponent: React.FC<CanvasProps> = (props) => {
  const { zoom, onZoomChange, onDoubleClickLayer, onInteractionStart, booleanPreview = null } = props;

  // Defensive check for required props
  if (!onZoomChange) {
    console.error('[Canvas] onZoomChange is required');
    return null;
  }

  // Local state for specialized modes
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [previousZoom, setPreviousZoom] = useState<number | null>(null);

  // Essential store state
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboard = useStore(activeArtboardSelector);
  const activeArtboardId = activeArtboard?.id || (artboards[0]?.id ?? '');

  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor) || '#ffffff';
  const canvasFilters = useStore((state) => state.canvasFilters) || {};
  const layers = useMemo(() => activeArtboard?.layers || [], [activeArtboard]);
  const allLayers = useMemo(() => artboards?.flatMap(a => a.layers || []) || [], [artboards]);
  const selectedLayers = useStore(selectedLayersSelector) || [];

  const onUpdateLayers = useStore((state) => state.updateLayers);
  const onSelectLayer = useStore((state) => state.selectLayer);
  const onMultiSelectLayer = useStore((state) => state.multiSelectLayer);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const showGrid = useStore((state) => state.showGrid) || false;
  const isDrawing = useStore((state) => state.isPenMode) || false;

  const viewportRef = useRef<HTMLDivElement>(null);
  const textEditRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const refineCanvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction Hook - with defensive checks
  const {
    panOffset,
    isPanning,
    isSpacePressed,
    handleMouseDownContainer,
    handleMouseDownLayer,
    layerRefs,
    snapLines,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    selectionBox
  } = useCanvasInteractions({
      zoom: zoom || 1,
      onZoomChangeValue: onZoomChange || (() => {}),
      activeArtboard,
      layers,
      selectedLayerIds,
      onUpdateLayers,
      onSelectLayer: (id) => onSelectLayer?.(id) || null,
      onMultiSelectLayer,
      onInteractionStart,
      onContextMenu: (pos, id) => setContextMenu({ x: pos.clientX, y: pos.clientY, layerId: id }),
      isDrawing,
      viewportRef,
    });

  // Mobile Touch Gestures Integration
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const initialZoom = useRef(zoom);
  const initialRotation = useRef(0);

  useTouchGestures(viewportRef, {
    enabled: isMobile,
    onPinchZoom: (scale) => {
      const newZoom = initialZoom.current * scale;
      const clampedZoom = Math.max(0.1, Math.min(10, newZoom));
      onZoomChange(clampedZoom);
    },
    onRotate: (angle) => {
      if (selectedLayerIds.length === 1) {
        const selectedLayer = layers.find(l => l.id === selectedLayerIds[0]);
        if (selectedLayer && selectedLayer.type !== 'text') {
          const newRotation = (initialRotation.current + angle) % 360;
          onUpdateLayers({ [selectedLayer.id]: { rotation: newRotation } });
        }
      }
    },
    onPan: (_deltaX, _deltaY) => {
      // Pan handled by useCanvasInteractions
    },
    minZoom: 0.1,
    maxZoom: 10,
  });

  // Reset initial values on gesture end
  useEffect(() => {
    const handleTouchEnd = () => {
      initialZoom.current = zoom;
      if (selectedLayerIds.length === 1) {
        const selectedLayer = layers.find(l => l.id === selectedLayerIds[0]);
        if (selectedLayer) {
          initialRotation.current = (selectedLayer as any).rotation || 0;
        }
      }
    };

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
    if (isMobile && viewportRef.current) {
      viewportRef.current.addEventListener('touchend', handleTouchEnd);
      return () => {
        viewportRef.current?.removeEventListener('touchend', handleTouchEnd);
      };
    }
    // Return an empty cleanup function if conditions are not met
    return () => {};
  }, [zoom, selectedLayerIds, layers, isMobile]);

  // Use props.previewAnimation to avoid unused warning
  const currentPreviewAnimation = props.previewAnimation;

  const selectedLayerId = useStore(selectedLayerIdSelector);

  const handleDrawingMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingState.isDrawingPath || !drawingCanvasRef.current) {
      return;
    }
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left);
    let y = (e.clientY - rect.top);

    // Apply Smoothing/Stabilization (Lerp between last and current)
    const smoothFactor = 1 - (brushSmoothing / 100) * 0.9; // 1.0 (none) to 0.1 (high)
    x = drawingLastPos.current.x + (x - drawingLastPos.current.x) * smoothFactor;
    y = drawingLastPos.current.y + (y - drawingLastPos.current.y) * smoothFactor;

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

    if (brushType === BrushType.VECTOR_PENCIL) {
      setVectorPoints((prev) => [...prev, { x, y }]);
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
  // Handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, layerId });
  }, []);

  const handleTextDoubleClick = useCallback((e: React.MouseEvent, layer: TextLayer) => {
    e.stopPropagation();
    setPreviousZoom(zoom);
    onZoomChange(Math.max(1.5, zoom)); // Focus zoom
    setEditingTextId(layer.id);
    setTimeout(() => textEditRef.current?.focus(), 0);
  }, [zoom, onZoomChange]);

  // FIX: Add rotation handler with snapping
  const handleRotateStart = useCallback((e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    
    const ROTATION_SNAP_ANGLE = 15;
    const ROTATION_SNAP_SHIFT_ANGLE = 45;
    
    const centerX = layer.x + (layer as any).width / 2;
    const centerY = layer.y + (layer as any).height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    // FIX: Add rotation snapping
    const isShiftKey = e.shiftKey;
    const snapAngle = isShiftKey ? ROTATION_SNAP_SHIFT_ANGLE : ROTATION_SNAP_ANGLE;
    
    // Snap to nearest increment
    const snappedAngle = Math.round(angle / snapAngle) * snapAngle;
    
    // Apply snapped rotation
    const finalRotation = snappedAngle;
    
    onUpdateLayers({ [layer.id]: { rotation: finalRotation } });
  }, [onUpdateLayers]);

  const finishEditingText = useCallback(() => {
    if (editingTextId && textEditRef.current) {
      const newText = textEditRef.current.innerText || textEditRef.current.textContent || '';
      const currentLayer = allLayers.find((l: Layer) => l.id === editingTextId);
      if (currentLayer && currentLayer.type === 'text' && currentLayer.text !== newText) {
        useStore.getState().saveToHistory();
        const updates: Partial<TextLayer> = {
          text: newText,
          name: newText.length > 20 ? newText.slice(0, 20) + '...' : newText,
        };
        onUpdateLayers?.({ [editingTextId]: updates });
      }
    }
    setEditingTextId(null);
    if (previousZoom !== null) {
      onZoomChange(previousZoom);
      setPreviousZoom(null);
    }
  }, [editingTextId, allLayers, onUpdateLayers, previousZoom, onZoomChange]);

  // Calculate Viewport Bounds for Culling
  const viewportBounds = useMemo(() => {
    const el = viewportRef.current;
    if (!el) {return null;}
    
    // Convert screen viewport to canvas coordinates
    return {
      x: -panOffset.x / zoom,
      y: -panOffset.y / zoom,
      width: el.clientWidth / zoom,
      height: el.clientHeight / zoom,
    };
  }, [panOffset, zoom]);

  // Simplified render
  return (
    <ErrorBoundary componentName="Canvas" variant="widget">
      <div className="flex-1 relative bg-[#13161a] overflow-hidden flex flex-col">
        <style>{ANIMATION_STYLES}</style>
        <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors"
              title="Zoom Out"
            >
              <Icons.ZoomOut className="w-4 h-4" />
            </button>
            {/* Editable Zoom Input for #4 */}
            <EditableZoom zoom={zoom} onZoomChange={onZoomChange} />
            <button
              onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors"
              title="Zoom In"
            >
              <Icons.ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (activeArtboard) {
                  // Auto-fit zoom
                  const minZoomX = viewportSize.width / activeArtboard.width;
                  const minZoomY = viewportSize.height / activeArtboard.height;
                  const fitZoom = Math.min(minZoomX, minZoomY, 1);
                  onZoomChange(Math.max(0.1, fitZoom));
                }
              }}
              className="ml-2 px-2 py-1 text-xs bg-[#7d2ae8]/20 text-[#7d2ae8] rounded hover:bg-[#7d2ae8]/30 transition-colors"
              title="Fit to Screen"
            >
              Fit
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
          </div>
        </div>

        <div
          ref={viewportRef}
          className="flex-1 overflow-hidden relative bg-gray-900 touch-none select-none canvas-container"
          style={{ cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default' }}
          onMouseDown={handleMouseDownContainer}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <CanvasRenderer
              artboards={artboards}
              activeArtboardId={activeArtboardId}
              canvasBackgroundColor={canvasBackgroundColor}
              canvasFilters={canvasFilters}
              zoom={zoom}
              viewportBounds={viewportBounds}
              getEffectiveLayer={(l) => l}
              onLayerRef={(id, el) => {
                layerRefs.current[id] = el;
              }}
              handleMouseDownLayer={handleMouseDownLayer}
              handleResizeStart={() => {}}
              handleRotateStart={handleRotateStart}
              handleContextMenu={handleContextMenu}
              handleTextDoubleClick={handleTextDoubleClick}
              handleDropShape={() => {}}
              onDoubleClickLayer={onDoubleClickLayer}
              editingTextId={editingTextId}
              textEditRef={textEditRef}
              finishEditingText={finishEditingText}
              editingPathId={null}
              previewAnimation={currentPreviewAnimation || undefined}
              isInteracting={false}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              hoveredLayerId={hoveredLayerId}
              setHoveredLayerId={setHoveredLayerId}
              setActiveArtboardId={(id) => useStore.getState().setActiveArtboardId(id)}
              onAddArtboard={() => useStore.getState().addArtboard()}
              onDeleteArtboard={(id) => useStore.getState().deleteArtboard(id)}
              showGrid={showGrid}
              isDrawing={isDrawing}
              isRefining={false}
              drawingCanvasRef={drawingCanvasRef}
              refineCanvasRef={refineCanvasRef}
              handleDrawingMouseDown={handleDrawingMouseDown}
              handleDrawingMouseMove={handleDrawingMouseMove}
              handleDrawingMouseUp={() => (handleDrawingMouseUp as any)()}
              isLassoMode={false}
              localLassoPoints={[]}
              booleanPreview={booleanPreview}
            />

                        <CanvasControls
              selectedLayerIds={selectedLayerIds}
              selectedLayers={selectedLayers}
              zoom={zoom}
              handleResizeStart={() => {}}
              handleRotateStart={() => {}}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
            />

            <CanvasGuides snapLines={snapLines} />

            <ContextualToolbar
              selectedLayerIds={selectedLayerIds}
              layers={allLayers}
              zoom={zoom}
            />

            {/* Selection Marquee */}
            {selectionBox && (
              <div
                className="absolute border border-[#7d2ae8] bg-[#7d2ae8]/10 z-[100] pointer-events-none"
                style={{
                  left: Math.min(selectionBox.start.x, selectionBox.end.x),
                  top: Math.min(selectionBox.start.y, selectionBox.end.y),
                  width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                  height: Math.abs(selectionBox.end.y - selectionBox.start.y),
                  borderStyle: 'dashed',
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
              />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const Canvas = React.memo(CanvasComponent);
