import React, { useRef, useEffect, useCallback, useState } from 'react';

interface RulersProps {
  viewportWidth?: number;
  viewportHeight?: number;
  width?: number;
  height?: number;
  zoom: number;
  panX?: number;
  panY?: number;
  artboardX?: number;
  artboardY?: number;
  visible?: boolean;
  unit?: string;
  onAddGuide?: (type: 'horizontal' | 'vertical', position: number) => void;
}

/**
 * Interactive fixed viewport rulers (Horizontal & Vertical) for precise measurement & positioning.
 * Features:
 * - Real-time cursor position tracking markers on both axes
 * - Drag-out to create persistent horizontal and vertical guides
 * - Live coordinate tooltips and HiDPI canvas rendering
 */
export const Rulers: React.FC<RulersProps> = React.memo(({
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
  width,
  height,
  zoom,
  panX = 0,
  panY = 0,
  artboardX = 0,
  artboardY = 0,
  visible = true,
  unit = 'px',
  onAddGuide,
}) => {
  const horizontalRef = useRef<HTMLCanvasElement>(null);
  const verticalRef = useRef<HTMLCanvasElement>(null);
  const rulerSize = 20;

  const actualWidth = viewportWidth || width || window.innerWidth;
  const actualHeight = viewportHeight || height || window.innerHeight;

  // Active guide being dragged out from ruler
  const [dragGuide, setDragGuide] = useState<{
    type: 'horizontal' | 'vertical';
    screenPos: number;
    worldPos: number;
  } | null>(null);

  // Mouse cursor position on viewport
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Track global mouse position for ruler crosshair markers
  useEffect(() => {
    if (!visible) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      setCursorPos(null);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [visible]);

  // Calculate tick spacing based on zoom
  const getTickSpacing = useCallback(() => {
    const intervals = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
    for (const interval of intervals) {
      if (interval * zoom >= 40) {
        return interval;
      }
    }
    return 100;
  }, [zoom]);

  // Redraw rulers
  useEffect(() => {
    if (!visible) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    const drawRuler = (canvas: HTMLCanvasElement | null, isHorizontal: boolean) => {
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const displayLength = isHorizontal ? Math.max(10, actualWidth - rulerSize) : Math.max(10, actualHeight - rulerSize);
      const displayThickness = rulerSize;

      // HiDPI backing store setup
      canvas.width = (isHorizontal ? displayLength : displayThickness) * dpr;
      canvas.height = (isHorizontal ? displayThickness : displayLength) * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Ruler Background
      ctx.fillStyle = '#12161a';
      ctx.fillRect(0, 0, isHorizontal ? displayLength : displayThickness, isHorizontal ? displayThickness : displayLength);

      // Outer Border line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (isHorizontal) {
        ctx.moveTo(0, displayThickness - 0.5);
        ctx.lineTo(displayLength, displayThickness - 0.5);
      } else {
        ctx.moveTo(displayThickness - 0.5, 0);
        ctx.lineTo(displayThickness - 0.5, displayLength);
      }
      ctx.stroke();

      const tickSpacing = getTickSpacing();
      const pan = isHorizontal ? panX : panY;
      const artboardOffset = isHorizontal ? artboardX : artboardY;

      // World ticks calculations
      const startWorld = Math.floor(((0 + rulerSize - pan) / zoom - artboardOffset) / tickSpacing) * tickSpacing;
      const endWorld = Math.ceil(((displayLength + rulerSize - pan) / zoom - artboardOffset) / tickSpacing) * tickSpacing;

      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let val = startWorld; val <= endWorld; val += tickSpacing) {
        const screenPos = (val + artboardOffset) * zoom + pan - rulerSize;

        if (screenPos < -50 || screenPos > displayLength + 50) {
          continue;
        }

        // Major Tick
        ctx.strokeStyle = val === 0 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (isHorizontal) {
          ctx.moveTo(screenPos + 0.5, displayThickness);
          ctx.lineTo(screenPos + 0.5, displayThickness - 8);
        } else {
          ctx.moveTo(displayThickness, screenPos + 0.5);
          ctx.lineTo(displayThickness - 8, screenPos + 0.5);
        }
        ctx.stroke();

        // Label
        const label = val.toString();
        if (isHorizontal) {
          ctx.fillStyle = val === 0 ? '#38bdf8' : '#9ca3af';
          ctx.fillText(label, screenPos + (label.length > 3 ? 10 : 0), 2);
        } else {
          ctx.save();
          ctx.fillStyle = val === 0 ? '#38bdf8' : '#9ca3af';
          ctx.translate(2, screenPos - 2);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'right';
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }

        // Minor ticks
        const minorStep = tickSpacing / 5;
        for (let j = 1; j < 5; j++) {
          const minorVal = val + j * minorStep;
          const minorScreen = (minorVal + artboardOffset) * zoom + pan - rulerSize;
          if (minorScreen < 0 || minorScreen > displayLength) {
            continue;
          }

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          if (isHorizontal) {
            ctx.moveTo(minorScreen + 0.5, displayThickness);
            ctx.lineTo(minorScreen + 0.5, displayThickness - 4);
          } else {
            ctx.moveTo(displayThickness, minorScreen + 0.5);
            ctx.lineTo(displayThickness - 4, minorScreen + 0.5);
          }
          ctx.stroke();
        }
      }

      // Cursor position indicator on ruler
      if (cursorPos) {
        const markerPos = isHorizontal ? cursorPos.x - rulerSize : cursorPos.y - rulerSize;
        if (markerPos >= 0 && markerPos <= displayLength) {
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (isHorizontal) {
            ctx.moveTo(markerPos + 0.5, 0);
            ctx.lineTo(markerPos + 0.5, displayThickness);
          } else {
            ctx.moveTo(0, markerPos + 0.5);
            ctx.lineTo(displayThickness, markerPos + 0.5);
          }
          ctx.stroke();
        }
      }
    };

    drawRuler(horizontalRef.current, true);
    drawRuler(verticalRef.current, false);
  }, [actualWidth, actualHeight, zoom, panX, panY, artboardX, artboardY, visible, getTickSpacing, cursorPos]);

  // Handle dragging to create a new guide from horizontal ruler
  const handleHorizontalPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const initialWorldY = Math.round((startY - panY) / zoom - artboardY);

    setDragGuide({
      type: 'horizontal',
      screenPos: startY,
      worldPos: initialWorldY,
    });

    const handlePointerMove = (ev: PointerEvent) => {
      const worldY = Math.round((ev.clientY - panY) / zoom - artboardY);
      setDragGuide({
        type: 'horizontal',
        screenPos: ev.clientY,
        worldPos: worldY,
      });
    };

    const handlePointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Only add guide if dragged out of ruler area into the canvas
      if (ev.clientY > rulerSize) {
        const finalWorldY = Math.round((ev.clientY - panY) / zoom - artboardY);
        onAddGuide?.('horizontal', finalWorldY);
      }
      setDragGuide(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle dragging to create a new guide from vertical ruler
  const handleVerticalPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialWorldX = Math.round((startX - panX) / zoom - artboardX);

    setDragGuide({
      type: 'vertical',
      screenPos: startX,
      worldPos: initialWorldX,
    });

    const handlePointerMove = (ev: PointerEvent) => {
      const worldX = Math.round((ev.clientX - panX) / zoom - artboardX);
      setDragGuide({
        type: 'vertical',
        screenPos: ev.clientX,
        worldPos: worldX,
      });
    };

    const handlePointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Only add guide if dragged out of ruler area into the canvas
      if (ev.clientX > rulerSize) {
        const finalWorldX = Math.round((ev.clientX - panX) / zoom - artboardX);
        onAddGuide?.('vertical', finalWorldX);
      }
      setDragGuide(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-[95] overflow-hidden select-none" aria-hidden="true">
      {/* Top-Left Origin Corner Square */}
      <div
        className="absolute top-0 left-0 bg-[#12161a] border-r border-b border-white/10 flex items-center justify-center pointer-events-auto cursor-default"
        style={{ width: rulerSize, height: rulerSize }}
        title={`Coordinates (0,0) Origin | Unit: ${unit}`}
      >
        <span className="text-[8px] font-black text-gray-500 font-mono leading-none">
          {unit.slice(0, 2)}
        </span>
      </div>

      {/* Horizontal Ruler Canvas */}
      <canvas
        ref={horizontalRef}
        onPointerDown={handleHorizontalPointerDown}
        className="absolute top-0 pointer-events-auto cursor-row-resize"
        style={{
          left: rulerSize,
          width: actualWidth - rulerSize,
          height: rulerSize,
        }}
        title="Click and drag down to create a Horizontal Guide"
      />

      {/* Vertical Ruler Canvas */}
      <canvas
        ref={verticalRef}
        onPointerDown={handleVerticalPointerDown}
        className="absolute left-0 pointer-events-auto cursor-col-resize"
        style={{
          top: rulerSize,
          width: rulerSize,
          height: actualHeight - rulerSize,
        }}
        title="Click and drag right to create a Vertical Guide"
      />

      {/* Dragging Guide Live Preview & Tooltip */}
      {dragGuide && (
        <>
          <div
            className="fixed pointer-events-none z-[9999]"
            style={{
              ...(dragGuide.type === 'horizontal'
                ? {
                    left: 0,
                    top: dragGuide.screenPos,
                    width: '100vw',
                    height: '1px',
                    borderTop: '1px dashed #00e5ff',
                    boxShadow: '0 0 8px rgba(0, 229, 255, 0.7)',
                  }
                : {
                    left: dragGuide.screenPos,
                    top: 0,
                    width: '1px',
                    height: '100vh',
                    borderLeft: '1px dashed #00e5ff',
                    boxShadow: '0 0 8px rgba(0, 229, 255, 0.7)',
                  }),
            }}
          />
          <div
            className="fixed pointer-events-none z-[10000] bg-[#00e5ff] text-gray-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xl whitespace-nowrap"
            style={{
              ...(dragGuide.type === 'horizontal'
                ? {
                    left: Math.max(30, (cursorPos?.x || 100) + 15),
                    top: dragGuide.screenPos - 22,
                  }
                : {
                    left: dragGuide.screenPos + 8,
                    top: Math.max(30, (cursorPos?.y || 100) - 22),
                  }),
            }}
          >
            {dragGuide.worldPos}px
          </div>
        </>
      )}
    </div>
  );
});

Rulers.displayName = 'Rulers';
export default Rulers;
