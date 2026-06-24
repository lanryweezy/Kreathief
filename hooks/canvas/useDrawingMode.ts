import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { StrokeSmoother } from '../../utils/variableStroke';

// Ramer-Douglas-Peucker path simplification
function rdpSimplify(points: { x: number; y: number }[], epsilon: number): { x: number; y: number }[] {
  if (points.length <= 2) return points;

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
  if (lineLenSq === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  return Math.hypot(point.x - projX, point.y - projY);
}

interface UseDrawingModeProps {
  zoom: number;
  isDrawing: boolean;
}

export const useDrawingMode = ({ zoom, isDrawing }: UseDrawingModeProps) => {
  const isDrawingInternalRef = useRef(false);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const zoomRef = useRef(zoom);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Eraser cursor preview: show circle matching eraser size
  useEffect(() => {
    const updateCursor = () => {
      if (!canvasRef.current || !isDrawing) return;
      const { brushType, brushSize } = useStore.getState();
      if (brushType === 'eraser') {
        const size = Math.max(4, brushSize * zoom);
        canvasRef.current.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Ccircle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='none' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E") ${size / 2} ${size / 2}, crosshair`;
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    };
    updateCursor();
    const unsub = useStore.subscribe(updateCursor);
    return unsub;
  }, [isDrawing, zoom]);

  const redrawCanvas = useCallback((ctx: CanvasRenderingContext2D, previewX?: number, previewY?: number) => {
    const { brushColor, brushSize, brushType } = useStore.getState();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentPathRef.current.length === 0) {
      return;
    }

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize * 0.75;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
    for (let i = 1; i < currentPathRef.current.length; i++) {
      ctx.lineTo(currentPathRef.current[i].x, currentPathRef.current[i].y);
    }
    if (previewX !== undefined && previewY !== undefined) {
      ctx.lineTo(previewX, previewY);
    }
    ctx.stroke();

    // Draw anchor points for vector pencil
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 1.5;
    currentPathRef.current.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, []);

  const smootherRef = useRef<StrokeSmoother | null>(null);

  const handleDrawingMouseDown = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      if (!isDrawing) {
        return;
      }
      const canvas = e.target as HTMLCanvasElement;
      if (!canvas) {
        return;
      }

      const { brushType } = useStore.getState();
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoomRef.current;
      const y = (e.clientY - rect.top) / zoomRef.current;

      if (brushType === 'vector_pencil') {
        return; // Handled by PathEditorOverlay
      } else {
        isDrawingInternalRef.current = true;
        canvasRef.current = canvas;

        // Initialize the physical velocity stroke smoother using UI slider value
        const { brushSmoothing } = useStore.getState();
        smootherRef.current = new StrokeSmoother(brushSmoothing);
        const smoothed = smootherRef.current.addPoint(x, y);
        currentPathRef.current = [smoothed || { x, y }];

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Eraser mode: use destination-out composite to erase existing content
          if (brushType === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
          }
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
      const x = (e.clientX - rect.left) / zoomRef.current;
      const y = (e.clientY - rect.top) / zoomRef.current;

      // Capture pressure from PointerEvent (0..1), default to 0.5 for MouseEvents
      const pressure = (e as any).pressure ?? 0.5;

      const { brushColor, brushSize, brushOpacity, brushType } = useStore.getState();
      const ctx = canvas.getContext('2d');

      if (brushType === 'vector_pencil') {
        return; // Handled by PathEditorOverlay
      }

      // Smooth out the coordinate stream using velocity-based weighted averaging
      let drawX = x;
      let drawY = y;
      if (smootherRef.current) {
        const smoothed = smootherRef.current.addPoint(x, y);
        if (smoothed) {
          drawX = smoothed.x;
          drawY = smoothed.y;
        }
      }

      // De-duplicate points if the distance is too close to avoid bloated vector paths
      const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
      if (lastPoint) {
        const dist = Math.hypot(drawX - lastPoint.x, drawY - lastPoint.y);
        if (dist < 1.5) {
          return;
        }
      }

      currentPathRef.current.push({ x: drawX, y: drawY });

      if (ctx) {
        // Apply pressure sensitivity: width varies with stylus/tablet pressure
        const pressureWidth = brushSize * (0.3 + pressure * 0.7); // 30% base + 70% pressure

        // Eraser mode: use destination-out composite to erase existing content
        if (brushType === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.lineWidth = brushSize;
          ctx.globalAlpha = 1;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = pressureWidth;
          ctx.globalAlpha = brushOpacity;
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        switch (brushType) {
          case 'calligraphy':
            ctx.lineCap = 'butt';
            ctx.lineWidth = pressureWidth * 1.5;
            break;
          case 'oil':
            ctx.lineWidth = pressureWidth * 1.8;
            ctx.shadowBlur = 4;
            ctx.shadowColor = brushColor;
            break;
          case 'crayon':
            ctx.lineWidth = pressureWidth;
            ctx.setLineDash([2, 5]);
            break;
          case 'pencil':
            ctx.lineWidth = 1;
            ctx.globalAlpha = brushOpacity * 0.7 * (0.5 + pressure * 0.5);
            break;
          case 'watercolor':
            ctx.lineWidth = pressureWidth * 2.5;
            ctx.globalAlpha = brushOpacity * 0.4;
            ctx.shadowBlur = 10;
            ctx.shadowColor = brushColor;
            break;
          case 'splatter':
            ctx.lineWidth = 1;
            ctx.fillStyle = brushColor;
            ctx.beginPath();
            ctx.arc(x, y, pressureWidth * (0.5 + Math.random()), 0, Math.PI * 2);
            ctx.fill();
            return;
          default:
            break;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
      }
    },
    [redrawCanvas]
  );

  const handleDrawingMouseUp = useCallback((e?: React.MouseEvent, forceFinish: boolean = false) => {
    if (!isDrawingInternalRef.current) {
      return;
    }

    const { brushType, brushColor, brushSize, addLayer } = useStore.getState();

    if (brushType === 'vector_pencil') {
      return; // Handled by PathEditorOverlay
    }

    isDrawingInternalRef.current = false;

    if (currentPathRef.current.length < 2) {
      currentPathRef.current = [];
      return;
    }

    // Convert path to VectorPath and calculate bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    currentPathRef.current.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
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

      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}, ${xc.toFixed(2)} ${yc.toFixed(2)}`;
      }
      const last = points[points.length - 1];
      d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
      return d;
    };

    const relativePath = currentPathRef.current.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    // Apply RDP simplification to reduce point count while preserving shape
    const simplified = rdpSimplify(relativePath, 1.5);
    const pathData = simplifyAndSmoothPath(simplified);

    addLayer({
      id: `draw_${uuidv4()}`,
      type: 'path',
      name: `${brushType} Stroke`,
      x: minX,
      y: minY,
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      pathData,
      color: brushColor,
      brushType: brushType,
      stroke: { color: brushColor, width: brushSize },
    } as any);

    // Clear temporary canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Reset composite operation to default
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
    // When drawing mode is turned off, finish any active vector_pencil paths
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
