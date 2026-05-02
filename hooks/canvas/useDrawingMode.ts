import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

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

  const handleDrawingMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = e.target as HTMLCanvasElement;
    if (!canvas) return;
    isDrawingInternalRef.current = true;
    canvasRef.current = canvas;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomRef.current;
    const y = (e.clientY - rect.top) / zoomRef.current;
    currentPathRef.current = [{ x, y }];
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [isDrawing]);

  const handleDrawingMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingInternalRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomRef.current;
    const y = (e.clientY - rect.top) / zoomRef.current;
    
    // De-duplicate points if the distance is too close to avoid bloated vector paths
    const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
    if (lastPoint) {
      const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y);
      if (dist < 1.5) return;
    }

    currentPathRef.current.push({ x, y });
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const { brushColor, brushSize, brushOpacity, brushType } = useStore.getState();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = brushOpacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      switch (brushType) {
        case 'calligraphy':
          ctx.lineCap = 'butt';
          ctx.lineWidth = brushSize * 1.5;
          break;
        case 'oil':
          ctx.lineWidth = brushSize * 1.8;
          ctx.shadowBlur = 4;
          ctx.shadowColor = brushColor;
          break;
        case 'crayon':
          ctx.lineWidth = brushSize;
          ctx.setLineDash([2, 5]);
          break;
        case 'pencil':
          ctx.lineWidth = 1;
          ctx.globalAlpha = brushOpacity * 0.7;
          break;
        case 'watercolor':
          ctx.lineWidth = brushSize * 2.5;
          ctx.globalAlpha = brushOpacity * 0.4;
          ctx.shadowBlur = 10;
          ctx.shadowColor = brushColor;
          break;
        case 'vector_pencil':
          ctx.lineWidth = brushSize * 0.75;
          ctx.lineCap = 'square';
          break;
        case 'splatter':
          ctx.lineWidth = 1;
          ctx.fillStyle = brushColor;
          ctx.beginPath();
          ctx.arc(x, y, brushSize * (0.5 + Math.random()), 0, Math.PI * 2);
          ctx.fill();
          return;
        default:
          break;
      }

      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, []);


  const handleDrawingMouseUp = useCallback((e?: React.MouseEvent) => {
    if (!isDrawingInternalRef.current) return;
    isDrawingInternalRef.current = false;
    
    const { brushType, brushColor, brushSize, addLayer } = useStore.getState();
    
    if (currentPathRef.current.length < 2) {
      currentPathRef.current = [];
      return;
    }

    // Convert path to VectorPath and calculate bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    currentPathRef.current.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    
    // Midpoint quadratic Bézier smoothing for beautiful, smooth curves
    const simplifyAndSmoothPath = (points: { x: number; y: number }[]) => {
      if (points.length < 2) return '';
      if (points.length === 2) {
        return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
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

    const relativePath = currentPathRef.current.map(p => ({
      x: p.x - minX,
      y: p.y - minY
    }));

    const pathData = simplifyAndSmoothPath(relativePath);
    
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
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    currentPathRef.current = [];
    canvasRef.current = null;
  }, []);

  return {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    isDrawingInternalRef
  };
};

