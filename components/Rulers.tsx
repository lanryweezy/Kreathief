import React, { useRef, useEffect, useCallback } from 'react';

interface RulersProps {
  width: number;
  height: number;
  zoom: number;
  panX?: number;
  panY?: number;
  visible?: boolean;
  unit?: 'px' | 'in' | 'cm';
}

/**
 * Horizontal and vertical rulers for precise positioning
 * Shows measurement marks at current zoom level
 */
export const Rulers: React.FC<RulersProps> = ({
  width,
  height,
  zoom,
  panX = 0,
  panY = 0,
  visible = true,
  unit: _unit = 'px',
}) => {
  const horizontalRef = useRef<HTMLCanvasElement>(null);
  const verticalRef = useRef<HTMLCanvasElement>(null);
  const rulerSize = 20;

  // Calculate tick spacing based on zoom
  const getTickSpacing = useCallback(() => {
    // Find appropriate interval
    const intervals = [10, 20, 25, 50, 100, 200, 500, 1000];
    for (const interval of intervals) {
      if (interval * zoom >= 50) {
        return interval;
      }
    }
    return 100;
  }, [zoom]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const drawRuler = (canvas: HTMLCanvasElement | null, isHorizontal: boolean) => {
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const length = isHorizontal ? width : height;
      canvas.width = isHorizontal ? width : rulerSize;
      canvas.height = isHorizontal ? rulerSize : height;

      // Background
      ctx.fillStyle = '#1a1d21';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      if (isHorizontal) {
        ctx.beginPath();
        ctx.moveTo(0, rulerSize - 0.5);
        ctx.lineTo(width, rulerSize - 0.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(rulerSize - 0.5, 0);
        ctx.lineTo(rulerSize - 0.5, height);
        ctx.stroke();
      }

      // Tick marks and labels
      const tickSpacing = getTickSpacing();
      const offset = isHorizontal ? panX : panY;
      const startTick = Math.floor(-offset / (tickSpacing * zoom)) * tickSpacing;
      const endTick = startTick + Math.ceil(length / (tickSpacing * zoom)) * tickSpacing + tickSpacing;

      ctx.fillStyle = '#888';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let i = startTick; i <= endTick; i += tickSpacing) {
        const pos = i * zoom + offset;

        if (pos < 0 || pos > length) {
          continue;
        }

        // Major tick
        ctx.strokeStyle = '#666';
        ctx.beginPath();
        if (isHorizontal) {
          ctx.moveTo(pos, rulerSize);
          ctx.lineTo(pos, rulerSize - 10);
        } else {
          ctx.moveTo(rulerSize, pos);
          ctx.lineTo(rulerSize - 10, pos);
        }
        ctx.stroke();

        // Label
        const label = i.toString();
        if (isHorizontal) {
          ctx.fillText(label, pos, 2);
        } else {
          ctx.save();
          ctx.translate(10, pos);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }

        // Minor ticks
        const minorSpacing = tickSpacing / 5;
        for (let j = 1; j < 5; j++) {
          const minorPos = (i + j * minorSpacing) * zoom + offset;
          if (minorPos < 0 || minorPos > length) {
            continue;
          }

          ctx.strokeStyle = '#444';
          ctx.beginPath();
          if (isHorizontal) {
            ctx.moveTo(minorPos, rulerSize);
            ctx.lineTo(minorPos, rulerSize - 5);
          } else {
            ctx.moveTo(rulerSize, minorPos);
            ctx.lineTo(rulerSize - 5, minorPos);
          }
          ctx.stroke();
        }
      }
    };

    drawRuler(horizontalRef.current, true);
    drawRuler(verticalRef.current, false);
  }, [width, height, zoom, panX, panY, visible, getTickSpacing]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Corner square */}
      <div
        className="absolute top-0 left-0 bg-[#1a1d21] border-r border-b border-[#333] z-20"
        style={{ width: rulerSize, height: rulerSize }}
      />

      {/* Horizontal ruler */}
      <canvas
        ref={horizontalRef}
        className="absolute top-0 z-10 pointer-events-none"
        style={{ left: rulerSize, height: rulerSize }}
        aria-hidden="true"
      />

      {/* Vertical ruler */}
      <canvas
        ref={verticalRef}
        className="absolute left-0 z-10 pointer-events-none"
        style={{ top: rulerSize, width: rulerSize }}
        aria-hidden="true"
      />
    </>
  );
};

export default Rulers;
