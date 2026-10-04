import React, { useState } from 'react';
import { SnapLine } from '../../utils/snappingOracle';
import { GuideLine } from '../../types';

interface CanvasGuidesProps {
  snapLines: SnapLine[];
  guides?: GuideLine[];
  artboardWidth?: number;
  artboardHeight?: number;
  onUpdateGuide?: (id: string, position: number) => void;
  onRemoveGuide?: (id: string) => void;
}

export const CanvasGuides: React.FC<CanvasGuidesProps> = React.memo(({
  snapLines,
  guides = [],
  artboardWidth = 2000,
  artboardHeight = 2000,
  onUpdateGuide,
  onRemoveGuide,
}) => {
  const [hoveredGuideId, setHoveredGuideId] = useState<string | null>(null);
  const [activeDraggingGuideId, setActiveDraggingGuideId] = useState<string | null>(null);

  const handleGuidePointerDown = (e: React.PointerEvent, guide: GuideLine) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDraggingGuideId(guide.id);

    const isHorizontal = guide.type === 'horizontal';
    const startClient = isHorizontal ? e.clientY : e.clientX;
    const startPos = guide.position;

    const handlePointerMove = (ev: PointerEvent) => {
      const currentClient = isHorizontal ? ev.clientY : ev.clientX;
      const delta = currentClient - startClient;
      onUpdateGuide?.(guide.id, startPos + delta);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setActiveDraggingGuideId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <>
      {/* Persistent User Guides (Cyan / Accent) */}
      {guides.map((guide) => {
        const isHorizontal = guide.type === 'horizontal';
        const isHovered = hoveredGuideId === guide.id || activeDraggingGuideId === guide.id;

        return (
          <div
            key={guide.id}
            onPointerEnter={() => setHoveredGuideId(guide.id)}
            onPointerLeave={() => setHoveredGuideId(null)}
            onPointerDown={(e) => handleGuidePointerDown(e, guide)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onRemoveGuide?.(guide.id);
            }}
            className={`group absolute pointer-events-auto transition-colors ${
              isHorizontal ? 'cursor-row-resize' : 'cursor-col-resize'
            }`}
            style={{
              ...(isHorizontal
                ? {
                    left: -2000,
                    top: guide.position - 4,
                    width: artboardWidth + 4000,
                    height: 9,
                  }
                : {
                    top: -2000,
                    left: guide.position - 4,
                    height: artboardHeight + 4000,
                    width: 9,
                  }),
              zIndex: 90,
            }}
            title={`${isHorizontal ? 'Horizontal' : 'Vertical'} Guide: ${guide.position}px (Drag to move, Double-click to delete)`}
          >
            {/* Guide line indicator */}
            <div
              className={`absolute transition-all ${
                isHovered
                  ? 'bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)]'
                  : 'bg-[#00e5ff]/80 shadow-[0_0_4px_rgba(0,229,255,0.4)]'
              }`}
              style={{
                ...(isHorizontal
                  ? {
                      top: 4,
                      left: 0,
                      right: 0,
                      height: isHovered ? '2px' : '1px',
                    }
                  : {
                      left: 4,
                      top: 0,
                      bottom: 0,
                      width: isHovered ? '2px' : '1px',
                    }),
              }}
            />

            {/* Coordinate pill on hover or drag */}
            {isHovered && (
              <div
                className="absolute bg-[#00e5ff] text-gray-950 text-[9px] font-mono font-black px-1.5 py-0.5 rounded shadow-lg pointer-events-none select-none whitespace-nowrap z-50"
                style={{
                  ...(isHorizontal
                    ? {
                        left: 2020,
                        top: 6,
                      }
                    : {
                        top: 2020,
                        left: 6,
                      }),
                }}
              >
                {guide.position}px
              </div>
            )}
          </div>
        );
      })}

      {/* Dynamic Smart Snap Guides (Magenta / Pink) */}
      {snapLines &&
        snapLines.map((line, i) => {
          const snapDistance = Math.round(Math.abs(line.value - line.origin));
          const isVertical = line.type === 'vertical';

          return (
            <React.Fragment key={i}>
              {/* Main Guide Line */}
              <div
                className="absolute pointer-events-none transition-opacity duration-75"
                style={{
                  left: isVertical ? `${line.value}px` : `${line.origin}px`,
                  top: isVertical ? `${line.origin}px` : `${line.value}px`,
                  width: isVertical ? '1.5px' : `${line.extent}px`,
                  height: isVertical ? `${line.extent}px` : '1.5px',
                  backgroundColor: '#ff007f',
                  boxShadow: '0 0 6px rgba(255, 0, 127, 0.9), 0 0 12px rgba(255, 0, 127, 0.5)',
                  zIndex: 9999,
                }}
              />
              {/* Guide Endpoint Markers (Subtle Crosshairs/Ticks) */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: isVertical ? `${line.value - 2}px` : `${line.origin}px`,
                  top: isVertical ? `${line.origin}px` : `${line.value - 2}px`,
                  width: isVertical ? '5px' : '1px',
                  height: isVertical ? '1px' : '5px',
                  backgroundColor: '#ff007f',
                  zIndex: 9999,
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  left: isVertical ? `${line.value - 2}px` : `${line.origin + line.extent}px`,
                  top: isVertical ? `${line.origin}px` : `${line.value - 2}px`,
                  width: isVertical ? '5px' : '1px',
                  height: isVertical ? '1px' : '5px',
                  backgroundColor: '#ff007f',
                  zIndex: 9999,
                }}
              />

              {/* Measurement Tooltip */}
              {snapDistance > 0 && (
                <div
                  className="absolute pointer-events-none bg-surface-dark-1/90 backdrop-blur-md border border-brand-500/30 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-[0_4px_12px_rgba(255,0,127,0.3)] whitespace-nowrap"
                  style={{
                    left: isVertical ? `${line.value + 12}px` : `${line.origin + line.extent / 2}px`,
                    top: isVertical ? `${line.origin + line.extent / 2}px` : `${line.value + 12}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10000,
                    letterSpacing: '0.05em',
                  }}
                >
                  <span className="text-brand-400">{snapDistance}</span>
                  <span className="text-gray-400 text-[8px] ml-0.5 uppercase">px</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
    </>
  );
});

CanvasGuides.displayName = 'CanvasGuides';
export default CanvasGuides;
