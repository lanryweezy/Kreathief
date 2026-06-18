import React from 'react';
import { SnapLine } from '../../utils/snappingOracle';

interface CanvasGuidesProps {
  snapLines: SnapLine[];
}

export const CanvasGuides: React.FC<CanvasGuidesProps> = React.memo(({ snapLines }) => {
  return (
    <>
      {/* Dynamic Smart Guides */}
      {snapLines.map((line, i) => (
        <div
          key={i}
          className="absolute bg-[#7d2ae8] z-[100] pointer-events-none transition-opacity duration-150"
          style={{
            left: line.type === 'vertical' ? line.value : line.origin,
            top: line.type === 'horizontal' ? line.value : line.origin,
            width: line.type === 'vertical' ? '1px' : line.extent,
            height: line.type === 'horizontal' ? '1px' : line.extent,
            opacity: 0.8,
            boxShadow: '0 0 4px rgba(125, 42, 232, 0.4)',
          }}
        />
      ))}
    </>
  );
});
-e
CanvasGuides.displayName = 'CanvasGuides';
