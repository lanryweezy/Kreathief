import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { generateLayerId } from '../../utils/layers/layerUtils';
import { StrokeSmoother } from '../../utils/variableStroke';
import { recognizeShape } from '../../utils/shapeRecognition';

/**
 * Extensibility Point: Canvas Brush Strategy Registry
 * Evidence of pressure: The `useDrawingMode` hook used a hardcoded switch statement
 * inside the `handleDrawingMouseMove` loop to handle 8 different brush types.
 * Adding new custom brushes would require modifying this core hook continuously.
 * Contract: Implementors provide an `apply` method that modifies the CanvasRenderingContext2D
 * for the current stroke. It must return a boolean `skipDefaultPathing` to indicate if the core
 * loop should skip the default `lineTo` and `stroke` operations (e.g., for splatter brushes).
 */
export interface CanvasBrushStrategy {
  id: string;
  apply(params: {
    ctx: CanvasRenderingContext2D;
    brushColor: string;
    brushOpacity: number;
    brushSize: number;
    pressureWidth: number;
    ptPressure: number;
    drawX: number;
    drawY: number;
  }): boolean;
}

export const canvasBrushStrategies = new Map<string, CanvasBrushStrategy>();

canvasBrushStrategies.set('eraser', {
  id: 'eraser',
  apply({ ctx, brushSize }) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = brushSize;
    return false;
  },
});

canvasBrushStrategies.set('calligraphy', {
  id: 'calligraphy',
  apply({ ctx, pressureWidth }) {
    ctx.lineCap = 'butt';
    ctx.lineWidth = pressureWidth * 1.5;
    return false;
  },
});

canvasBrushStrategies.set('oil', {
  id: 'oil',
  apply({ ctx, pressureWidth, brushColor }) {
    ctx.lineWidth = pressureWidth * 1.8;
    ctx.shadowBlur = 4;
    ctx.shadowColor = brushColor;
    return false;
  },
});

canvasBrushStrategies.set('crayon', {
  id: 'crayon',
  apply({ ctx, pressureWidth }) {
    ctx.lineWidth = pressureWidth;
    ctx.setLineDash([2, 5]);
    return false;
  },
});

canvasBrushStrategies.set('pencil', {
  id: 'pencil',
  apply({ ctx, brushOpacity, ptPressure }) {
    ctx.lineWidth = 1;
    ctx.globalAlpha = brushOpacity * 0.7 * (0.5 + ptPressure * 0.5);
    return false;
  },
});

canvasBrushStrategies.set('watercolor', {
  id: 'watercolor',
  apply({ ctx, pressureWidth, brushOpacity, brushColor }) {
    ctx.lineWidth = pressureWidth * 2.5;
    ctx.globalAlpha = brushOpacity * 0.4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = brushColor;
    return false;
  },
});

canvasBrushStrategies.set('splatter', {
  id: 'splatter',
  apply({ ctx, pressureWidth, brushColor, drawX, drawY }) {
    ctx.lineWidth = 1;
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(drawX, drawY, pressureWidth * (0.5 + Math.random()), 0, Math.PI * 2);
    ctx.fill();
    return true; // Skip default lineTo/stroke
  },
});

canvasBrushStrategies.set('texture', {
  id: 'texture',
  apply({ ctx, pressureWidth, brushOpacity, brushColor }) {
    ctx.lineWidth = pressureWidth * 2.0;
    ctx.globalAlpha = brushOpacity * 0.85;
    ctx.shadowBlur = 6;
    ctx.shadowColor = brushColor;
    ctx.setLineDash([1, 2]);
    return false;
  },
});

// Ramer-Douglas-Peucker path simplification
function rdpSimplify(points: { x: number; y: number }[], epsilon: number): { x: number; y: number }[] {
  if (points.length <= 2) {
    return points;
  }

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLenSq = dx * dx + dy * dy;
  if (lineLenSq === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  return Math.hypot(point.x - projX, point.y - projY);
}

interface UseDrawingModeProps {
  zoom: number;
  isDrawing: boolean;
  panOffset: { x: number; y: number };
}

export const useDrawingMode = ({ zoom, isDrawing, panOffset }: UseDrawingModeProps) => {
  const isDrawingInternalRef = useRef(false);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const altHeldRef = useRef(false);

  useEffect(() => {
    zoomRef.current = zoom;
    panOffsetRef.current = panOffset;
  }, [zoom, panOffset]);

  // Eyedropper: track Alt key state while drawing
  useEffect(() => {
    if (!isDrawing) {
      return;
    }
    const handleAltDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        altHeldRef.current = true;
      }
    };
    const handleAltUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altHeldRef.current = false;
      }
    };
    window.addEventListener('keydown', handleAltDown);
    window.addEventListener('keyup', handleAltUp);
    return () => {
      window.removeEventListener('keydown', handleAltDown);
      window.removeEventListener('keyup', handleAltUp);
      altHeldRef.current = false;
    };
  }, [isDrawing]);

  const redrawCanvas = useCallback((ctx: CanvasRenderingContext2D, previewX?: number, previewY?: number) => {
    const { brushColor, brushSize, brushType } = useStore.getState();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentPathRef.current.length === 0) {
      return;
    }

    ctx.setTransform(zoomRef.current, 0, 0, zoomRef.current, panOffsetRef.current.x, panOffsetRef.current.y);

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize * 0.75;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);

    const { symmetryMode, symmetryCount, activeArtboardId, artboards } = useStore.getState();
    const activeArtboard = artboards.find((a) => a.id === activeArtboardId);

    // Find symmetry center (artboard center, or canvas center)
    const centerX = activeArtboard
      ? activeArtboard.x + activeArtboard.width / 2
      : canvas.width / (2 * zoomRef.current) - panOffsetRef.current.x / zoomRef.current;
    const centerY = activeArtboard
      ? activeArtboard.y + activeArtboard.height / 2
      : canvas.height / (2 * zoomRef.current) - panOffsetRef.current.y / zoomRef.current;

    const iterations = symmetryMode === 'radial' ? symmetryCount : symmetryMode !== 'none' ? 2 : 1;

    for (let s = 0; s < iterations; s++) {
      ctx.save();

      if (symmetryMode === 'radial') {
        ctx.translate(centerX, centerY);
        ctx.rotate((((s * 360) / symmetryCount) * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      } else if (symmetryMode === 'horizontal' && s === 1) {
        ctx.translate(centerX * 2, 0);
        ctx.scale(-1, 1);
      } else if (symmetryMode === 'vertical' && s === 1) {
        ctx.translate(0, centerY * 2);
        ctx.scale(1, -1);
      }

      ctx.beginPath();
      ctx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
      for (let i = 1; i < currentPathRef.current.length; i++) {
        ctx.lineTo(currentPathRef.current[i].x, currentPathRef.current[i].y);
      }
      if (previewX !== undefined && previewY !== undefined) {
        ctx.lineTo(previewX, previewY);
      }
      ctx.stroke();

      ctx.restore();
    }

    // Draw anchor points for vector pencil (only on main stroke for clarity)
    if (brushType === 'vector_pencil') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = 1.5;
      currentPathRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  }, []);

  const smootherRef = useRef<StrokeSmoother | null>(null);

  const handleDrawingMouseDown = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      if (!isDrawing) {
        return;
      }
      // FIX: Defensive check for canvas element to prevent "canvas.getContext is not a function"
      // Drawing handlers should only proceed if clicking directly on a canvas element.
      const canvas = e.target as HTMLCanvasElement;
      if (!canvas || typeof canvas.getContext !== 'function') {
        return;
      }

      // Eyedropper: Alt+click uses native browser EyeDropper API to pick color from any screen element
      if (altHeldRef.current) {
        if (typeof window !== 'undefined' && 'EyeDropper' in (window as any)) {
          try {
            const eyeDropper = new (window as any).EyeDropper();
            eyeDropper.open().then((result: any) => {
              if (result?.sRGBHex) {
                useStore.getState().setBrushColor(result.sRGBHex);
              }
            });
          } catch {
            // User cancelled or EyeDropper failed
          }
        }
        return;
      }

      const { brushType } = useStore.getState();
      const rect = canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const x = (viewportX - panOffsetRef.current.x) / zoomRef.current;
      const y = (viewportY - panOffsetRef.current.y) / zoomRef.current;

      if (brushType === 'vector_pencil') {
        return; // Handled by PathEditorOverlay
      } else {
        isDrawingInternalRef.current = true;
        canvasRef.current = canvas;

        // Initialize the physical velocity stroke smoother using UI slider value
        const { brushSmoothing } = useStore.getState();
        smootherRef.current = new StrokeSmoother(brushSmoothing);
        // Initialize pressure with e.pressure if available
        const pressure = (e as any).pressure ?? 0.5;
        const smoothed = smootherRef.current.addPoint(x, y, pressure);
        currentPathRef.current = [smoothed || { x, y }];

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(zoomRef.current, 0, 0, zoomRef.current, panOffsetRef.current.x, panOffsetRef.current.y);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
    },
    [isDrawing, redrawCanvas]
  );

  const handleDrawingMouseMove = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      if (!isDrawingInternalRef.current || !canvasRef.current) {
        return;
      }
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const x = (viewportX - panOffsetRef.current.x) / zoomRef.current;
      const y = (viewportY - panOffsetRef.current.y) / zoomRef.current;

      // Capture pressure from PointerEvent (0..1), default to 0.5 for MouseEvents
      const pressure = (e as any).pressure ?? 0.5;

      const { brushColor, brushSize, brushOpacity, brushType, brushJitter } = useStore.getState();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(zoomRef.current, 0, 0, zoomRef.current, panOffsetRef.current.x, panOffsetRef.current.y);
      }

      if (brushType === 'vector_pencil') {
        return; // Handled by PathEditorOverlay
      }

      // Smooth out the coordinate stream using Catmull-Rom curve interpolation
      const smoothedPoints = smootherRef.current
        ? smootherRef.current.addPointWithCatmullRom(x, y, pressure, 2.0)
        : [{ x, y, pressure }];

      if (ctx) {
        // Jitter: random scatter proportional to slider (0-100%) and brush size
        const jitterAmount = (brushJitter / 100) * brushSize;
        for (const pt of smoothedPoints) {
          const drawX = pt.x + (jitterAmount > 0 ? (Math.random() - 0.5) * jitterAmount : 0);
          const drawY = pt.y + (jitterAmount > 0 ? (Math.random() - 0.5) * jitterAmount : 0);
          const ptPressure = pt.pressure ?? pressure;

          // De-duplicate points if the distance is too close to avoid bloated vector paths
          const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
          if (lastPoint) {
            const dist = Math.hypot(drawX - lastPoint.x, drawY - lastPoint.y);
            if (dist < 1.0) {
              continue;
            }
          }

          currentPathRef.current.push({ x: drawX, y: drawY });

          // Apply pressure sensitivity: width varies with stylus/tablet pressure
          const pressureWidth = brushSize * (0.3 + ptPressure * 0.7); // 30% base + 70% pressure

          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = pressureWidth;
          ctx.globalAlpha = brushOpacity;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          const strategy = canvasBrushStrategies.get(brushType);
          let skipDefaultPathing = false;
          if (strategy) {
            skipDefaultPathing = strategy.apply({
              ctx,
              brushColor,
              brushOpacity,
              brushSize,
              pressureWidth,
              ptPressure,
              drawX,
              drawY,
            });
          }

          if (skipDefaultPathing) {
            continue;
          }

          ctx.lineTo(drawX, drawY);
          ctx.stroke();
        }
      }
    },
    [redrawCanvas]
  );

  const handleDrawingMouseUp = useCallback((e?: React.MouseEvent, forceFinish: boolean = false) => {
    if (!isDrawingInternalRef.current) {
      return;
    }

    const { brushType, brushColor, brushSize, brushOpacity, addLayer } = useStore.getState();

    if (brushType === 'vector_pencil') {
      return; // Handled by PathEditorOverlay
    }

    isDrawingInternalRef.current = false;

    // Eraser: layers render as DOM/SVG, so "erase" by removing the brush-stroke
    // path layers the eraser trail passed over (vector stroke-eraser semantics).
    if (brushType === 'eraser' || currentPathRef.current.length < 2) {
      if (brushType === 'eraser' && currentPathRef.current.length > 0) {
        const erasePoints = currentPathRef.current;
        const { artboards, activeArtboardId, deleteLayer } = useStore.getState() as any;
        const artboard = artboards.find((a: any) => a.id === activeArtboardId);
        const tolerance = brushSize / 2 + 4;
        const hitIds: string[] = [];
        for (const l of artboard?.layers || []) {
          if (l.type !== 'path' || !l.brushType || l.brushType === 'eraser' || !l.pathData || l.locked) {
            continue;
          }
          const coords = (l.pathData.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
          const strokeTol = tolerance + (l.stroke?.width || 0) / 2;
          let isHit = false;
          for (let i = 0; i + 1 < coords.length && !isHit; i += 2) {
            const px = l.x + coords[i];
            const py = l.y + coords[i + 1];
            for (const ep of erasePoints) {
              if (Math.hypot(px - ep.x, py - ep.y) <= strokeTol) {
                isHit = true;
                break;
              }
            }
          }
          if (isHit) {
            hitIds.push(l.id);
          }
        }
        // deleteLayer saves history itself; rapid calls coalesce via debounce
        hitIds.forEach((id) => deleteLayer(id));
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      currentPathRef.current = [];
      canvasRef.current = null;
      if (smootherRef.current) {
        smootherRef.current.reset();
        smootherRef.current = null;
      }
      return;
    }

    const { symmetryMode, symmetryCount, activeArtboardId, artboards, zoom } = useStore.getState();
    const activeArtboard = artboards.find((a) => a.id === activeArtboardId);

    // Find symmetry center (artboard center, or canvas center)
    const centerX = activeArtboard
      ? activeArtboard.x + activeArtboard.width / 2
      : canvasRef.current
        ? canvasRef.current.width / (2 * zoom) - panOffsetRef.current.x / zoom
        : 0;
    const centerY = activeArtboard
      ? activeArtboard.y + activeArtboard.height / 2
      : canvasRef.current
        ? canvasRef.current.height / (2 * zoom) - panOffsetRef.current.y / zoom
        : 0;

    const iterations = symmetryMode === 'radial' ? symmetryCount : symmetryMode !== 'none' ? 2 : 1;

    // Array of arrays (each is a path segment)
    const allPaths: { x: number; y: number }[][] = [currentPathRef.current];

    if (iterations > 1) {
      for (let s = 1; s < iterations; s++) {
        const mirroredPath = currentPathRef.current.map((p) => {
          if (symmetryMode === 'radial') {
            const angle = (((s * 360) / symmetryCount) * Math.PI) / 180;
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            return {
              x: centerX + dx * Math.cos(angle) - dy * Math.sin(angle),
              y: centerY + dx * Math.sin(angle) + dy * Math.cos(angle),
            };
          } else if (symmetryMode === 'horizontal') {
            return { x: centerX * 2 - p.x, y: p.y };
          } else if (symmetryMode === 'vertical') {
            return { x: p.x, y: centerY * 2 - p.y };
          }
          return p;
        });
        allPaths.push(mirroredPath);
      }
    }

    // Convert paths to VectorPath and calculate combined bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    allPaths.forEach((path) => {
      path.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    // Midpoint quadratic Bézier smoothing for beautiful, smooth curves
    const simplifyAndSmoothPath = (points: { x: number; y: number }[]) => {
      if (points.length < 2) {
        return '';
      }
      if (points.length === 2) {
        return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
      }

      if ((brushType as any) === 'vector_pencil') {
        let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
        for (let i = 1; i < points.length; i++) {
          d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
        }
        return d;
      }

      // Catmull-Rom Cubic Bézier smoothing for beautiful, ultra-smooth vector curves
      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 =
          i > 0 ? points[i - 1] : { x: 2 * points[i].x - points[i + 1].x, y: 2 * points[i].y - points[i + 1].y };
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i + 2 < points.length ? points[i + 2] : { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };

        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      }
      return d;
    };

    let pathData = '';
    let layerName = `${brushType} Stroke`;

    allPaths.forEach((pathSegment, index) => {
      const relativePath = pathSegment.map((p) => ({
        x: p.x - minX,
        y: p.y - minY,
      }));

      // Apply RDP simplification to reduce point count while preserving shape
      const simplified = rdpSimplify(relativePath, 1.5);

      if (index === 0) {
        // Shape Recognition: attempt to snap freehand strokes to perfect geometric shapes (only evaluate main stroke)
        const shapeResult = recognizeShape(relativePath, Math.max(width, height) * 0.15);
        if (shapeResult.type !== 'none' && shapeResult.confidence >= 0.65) {
          pathData += shapeResult.pathData + ' ';
          const shapeNames: Record<string, string> = {
            circle: 'Circle',
            rectangle: 'Rectangle',
            triangle: 'Triangle',
            line: 'Line',
          };
          layerName = shapeNames[shapeResult.type] || `${brushType} Stroke`;
          return; // Skip drawing smoothing if shape recognized
        }
      }

      // Use the original smoothed freehand path
      pathData += simplifyAndSmoothPath(simplified) + ' ';
    });

    pathData = pathData.trim();

    addLayer({
      id: generateLayerId('draw'),
      type: 'path',
      name: layerName,
      x: minX,
      y: minY,
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      rotation: 0,
      opacity: brushOpacity,
      locked: false,
      visible: true,
      pathData,
      color: brushColor,
      brushType: brushType,
      stroke: { color: brushColor, width: brushSize },
    } as any);

    // Clear the temporary drawing canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    currentPathRef.current = [];
    canvasRef.current = null;
    if (smootherRef.current) {
      smootherRef.current.reset();
      smootherRef.current = null;
    }
  }, []);

  useEffect(() => {
    // When drawing mode is turned off, finish any active vector_pencil paths.
    // Don't clear the internal flag first — handleDrawingMouseUp early-returns
    // when it's already false, which would silently discard the stroke.
    if (!isDrawing && isDrawingInternalRef.current) {
      handleDrawingMouseUp(undefined, true);
    }
  }, [isDrawing, handleDrawingMouseUp]);

  return {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isDrawingInternalRef,
  };
};
