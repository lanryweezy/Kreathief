import React from 'react';
import { SnapLine } from '../../utils/snappingOracle';

interface CanvasGuidesProps {
  snapLines: SnapLine[];
}

export const CanvasGuides: React.FC<CanvasGuidesProps> = React.memo(({ snapLines }) => {
  if (!snapLines || snapLines.length === 0) {
    return null;
  }

  return (
    <>
      {/* Dynamic Smart Guides */}
      {snapLines.map((line, i) => {
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
                width: isVertical ? '1px' : `${line.extent}px`,
                height: isVertical ? `${line.extent}px` : '1px',
                backgroundColor: '#ff007f',
                boxShadow: '0 0 4px rgba(255, 0, 127, 0.6), 0 0 8px rgba(255, 0, 127, 0.2)',
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
                top: isVertical ? `${line.origin + line.extent}px` : `${line.value - 2}px`,
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
