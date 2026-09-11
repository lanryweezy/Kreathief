import React, { useRef, useEffect, useCallback } from 'react';

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
}

/**
 * Fixed viewport rulers (Horizontal & Vertical) for precise measurement & positioning.
 * Stays docked to the viewport edges without shifting or distorting the canvas.
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
}) => {
  const horizontalRef = useRef<HTMLCanvasElement>(null);
  const verticalRef = useRef<HTMLCanvasElement>(null);
  const rulerSize = 20;

  const actualWidth = viewportWidth || width || window.innerWidth;
  const actualHeight = viewportHeight || height || window.innerHeight;

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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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

      // Calculate the start & end ticks in artboard world coordinates
      // Screen coord: screen = (world + artboardOffset) * zoom + pan
      // In ruler canvas (offset by rulerSize on viewport): rulerScreen = screen - rulerSize
      // Therefore: world = (rulerScreen + rulerSize - pan) / zoom - artboardOffset
      const startWorld = Math.floor(((0 + rulerSize - pan) / zoom - artboardOffset) / tickSpacing) * tickSpacing;
      const endWorld = Math.ceil(((displayLength + rulerSize - pan) / zoom - artboardOffset) / tickSpacing) * tickSpacing;

      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let val = startWorld; val <= endWorld; val += tickSpacing) {
        const screenPos = (val + artboardOffset) * zoom + pan - rulerSize;

        if (screenPos < -50 || screenPos > displayLength + 50) {
          continue;
        }

        // Major Tick
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
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
    };

    drawRuler(horizontalRef.current, true);
    drawRuler(verticalRef.current, false);
  }, [actualWidth, actualHeight, zoom, panX, panY, artboardX, artboardY, visible, getTickSpacing]);

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-[95] overflow-hidden" aria-hidden="true">
      {/* Top-Left Origin Corner Square */}
      <div
        className="absolute top-0 left-0 bg-[#12161a] border-r border-b border-white/10 flex items-center justify-center pointer-events-auto select-none"
        style={{ width: rulerSize, height: rulerSize }}
        title={`Unit: ${unit}`}
      >
        <span className="text-[8px] font-black text-gray-500 font-mono leading-none">
          {unit.slice(0, 2)}
        </span>
      </div>

      {/* Horizontal Ruler Canvas */}
      <canvas
        ref={horizontalRef}
        className="absolute top-0 pointer-events-none"
        style={{
          left: rulerSize,
          width: actualWidth - rulerSize,
          height: rulerSize,
        }}
      />

      {/* Vertical Ruler Canvas */}
      <canvas
        ref={verticalRef}
        className="absolute left-0 pointer-events-none"
        style={{
          top: rulerSize,
          width: rulerSize,
          height: actualHeight - rulerSize,
        }}
      />
    </div>
  );
});

Rulers.displayName = 'Rulers';
export default Rulers;
