import React from 'react';
import { SnapLine } from '../../utils/snappingOracle';

interface CanvasGuidesProps {
  snapLines: SnapLine[];
}

export const CanvasGuides: React.FC<CanvasGuidesProps> = React.memo(({ snapLines }) => {
  return (
    <>
      {/* Dynamic Smart Guides */}
      {snapLines.map((line, i) => {
        const snapDistance = Math.round(Math.abs(line.value - line.origin));
        return (
          <React.Fragment key={i}>
            <div
              className="absolute bg-brand-600 z-[100] pointer-events-none transition-opacity duration-150"
              style={{
                left: line.type === 'vertical' ? line.value : line.origin,
                top: line.type === 'horizontal' ? line.value : line.origin,
                width: line.type === 'vertical' ? '1px' : line.extent,
                height: line.type === 'horizontal' ? '1px' : line.extent,
                opacity: 0.8,
                boxShadow: '0 0 4px rgba(125, 42, 232, 0.4)',
              }}
            />
            {snapDistance > 0 && (
              <div
                className="absolute z-[101] pointer-events-none bg-brand-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap"
                style={{
                  left: line.type === 'vertical' ? line.value + 4 : line.origin,
                  top: line.type === 'horizontal' ? line.value + 4 : line.origin,
                  transform: line.type === 'horizontal' ? 'translateX(-50%)' : 'translateY(-50%)',
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
