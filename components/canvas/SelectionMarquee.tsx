import React from 'react';

interface SelectionMarqueeProps {
  box: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
}

export const SelectionMarquee: React.FC<SelectionMarqueeProps> = React.memo(({ box }) => {
  const x = Math.min(box.start.x, box.end.x);
  const y = Math.min(box.start.y, box.end.y);
  const width = Math.abs(box.start.x - box.end.x);
  const height = Math.abs(box.start.y - box.end.y);

  if (width < 2 && height < 2) {
    return null;
  }

  return (
    <div
      className="absolute border border-[#7d2ae8] bg-[#7d2ae8]/10 pointer-events-none z-[100]"
      style={{
        left: x,
        top: y,
        width,
        height,
        boxShadow: '0 0 10px rgba(125, 42, 232, 0.2)',
      }}
    />
  );
});
SelectionMarquee.displayName = 'SelectionMarquee';
