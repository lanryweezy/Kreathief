import React from 'react';

interface SelectionMarqueeProps {
  box: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  panOffset?: { x: number; y: number };
  zoom?: number;
}

export const SelectionMarquee: React.FC<SelectionMarqueeProps> = React.memo(({ box, panOffset, zoom }) => {
  const z = zoom || 1;
  const px = panOffset?.x || 0;
  const py = panOffset?.y || 0;

  const x = Math.min(box.start.x, box.end.x);
  const y = Math.min(box.start.y, box.end.y);
  const width = Math.abs(box.start.x - box.end.x);
  const height = Math.abs(box.start.y - box.end.y);

  if (width < 2 && height < 2) {
    return null;
  }

  return (
    <div
      className="absolute border-2 border-dashed border-brand-600 bg-brand-600/10 pointer-events-none z-[100]"
      style={{
        left: (x - px) / z,
        top: (y - py) / z,
        width: width / z,
        height: height / z,
        boxShadow: '0 0 10px rgba(125, 42, 232, 0.2)',
      }}
    />
  );
});
SelectionMarquee.displayName = 'SelectionMarquee';
