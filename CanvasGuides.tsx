import React from 'react';
import { SnapLine } from '../../utils/snappingOracle';

interface CanvasGuidesProps {
  snapLines: SnapLine[];
  panOffset?: { x: number; y: number };
  zoom?: number;
}

export const CanvasGuides: React.FC<CanvasGuidesProps> = React.memo(({ snapLines, panOffset, zoom }) => {
  const z = zoom || 1;
  const px = panOffset?.x || 0;
  const py = panOffset?.y || 0;

  return (
    <>
      {/* Dynamic Smart Guides */}
      {snapLines.map((line, i) => {
        const snapDistance = Math.round(Math.abs(line.value - line.origin));
        const adjustedValue = (line.value - (line.type === 'vertical' ? px : py)) / z;
        const adjustedOrigin = (line.origin - (line.type === 'vertical' ? px : py)) / z;
        return (
          <React.Fragment key={i}>
            <div
              className="absolute bg-brand-600 z-[100] pointer-events-none transition-opacity duration-150"
              style={{
                left: line.type === 'vertical' ? adjustedValue : adjustedOrigin,
                top: line.type === 'horizontal' ? adjustedValue : adjustedOrigin,
                width: line.type === 'vertical' ? '1px' : line.extent / z,
                height: line.type === 'horizontal' ? '1px' : line.extent / z,
                opacity: 0.8,
                boxShadow: '0 0 4px rgba(125, 42, 232, 0.4)',
              }}
            />
            {snapDistance > 0 && (
              <div
                className="absolute z-[101] pointer-events-none bg-brand-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap"
                style={{
                  left: line.type === 'vertical' ? adjustedValue + 4 : adjustedOrigin,
                  top: line.type === 'horizontal' ? adjustedValue + 4 : adjustedOrigin,
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
