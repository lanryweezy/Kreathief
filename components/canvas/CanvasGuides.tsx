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
            {snapDistance > 0 && (
              <div
                className="absolute pointer-events-none bg-[#ff007f] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap"
                style={{
                  left: isVertical ? `${line.value + 6}px` : `${line.origin + line.extent / 2}px`,
                  top: isVertical ? `${line.origin + line.extent / 2}px` : `${line.value + 6}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10000,
                }}
              >
                {snapDistance}px
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
});
CanvasGuides.displayName = 'CanvasGuides';
