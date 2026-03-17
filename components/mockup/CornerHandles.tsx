// Interactive Corner Handles Component for Mockup Preview
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CornerPoints } from '../../services/perspectiveTransform';

interface CornerHandlesProps {
  cornerPoints: CornerPoints;
  onCornerChange: (corner: keyof CornerPoints, point: { x: number; y: number }) => void;
  containerWidth: number;
  containerHeight: number;
  isVisible: boolean;
}

interface HandlePosition {
  x: number;
  y: number;
  corner: keyof CornerPoints;
}

export const CornerHandles: React.FC<CornerHandlesProps> = ({
  cornerPoints,
  onCornerChange,
  containerWidth,
  containerHeight,
  isVisible,
}) => {
  const [draggingCorner, setDraggingCorner] = useState<keyof CornerPoints | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert pixels to percentage
  const toPercentage = useCallback(
    (point: { x: number; y: number }) => ({
      x: (point.x / containerWidth) * 100,
      y: (point.y / containerHeight) * 100,
    }),
    [containerWidth, containerHeight]
  );

  // Get handle positions in pixels
  const handlePositions: HandlePosition[] = [
    { x: cornerPoints.topLeft.x, y: cornerPoints.topLeft.y, corner: 'topLeft' },
    { x: cornerPoints.topRight.x, y: cornerPoints.topRight.y, corner: 'topRight' },
    { x: cornerPoints.bottomLeft.x, y: cornerPoints.bottomLeft.y, corner: 'bottomLeft' },
    { x: cornerPoints.bottomRight.x, y: cornerPoints.bottomRight.y, corner: 'bottomRight' },
  ];

  // Handle mouse/touch events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, corner: keyof CornerPoints) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingCorner(corner);
    },
    []
  );

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingCorner || !containerRef.current) {return;}

      const rect = containerRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Clamp to container bounds
      const clampedX = Math.max(0, Math.min(x, rect.width));
      const clampedY = Math.max(0, Math.min(y, rect.height));

      // Convert to percentage
      const percentage = toPercentage({ x: clampedX, y: clampedY });

      onCornerChange(draggingCorner, percentage);
    };

    const handleMouseUp = () => {
      setDraggingCorner(null);
    };

    if (draggingCorner) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [draggingCorner, onCornerChange, toPercentage]);

  if (!isVisible) {return null;}

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <polygon
          points={`${cornerPoints.topLeft.x}%,${cornerPoints.topLeft.y}% ${cornerPoints.topRight.x}%,${cornerPoints.topRight.y}% ${cornerPoints.bottomRight.x}%,${cornerPoints.bottomRight.y}% ${cornerPoints.bottomLeft.x}%,${cornerPoints.bottomLeft.y}%`}
          fill="rgba(125, 42, 232, 0.1)"
          stroke="rgba(125, 42, 232, 0.5)"
          strokeWidth="1"
          strokeDasharray="4,2"
        />
        {/* Diagonal lines for visual guide */}
        <line
          x1={`${cornerPoints.topLeft.x}%`}
          y1={`${cornerPoints.topLeft.y}%`}
          x2={`${cornerPoints.bottomRight.x}%`}
          y2={`${cornerPoints.bottomRight.y}%`}
          stroke="rgba(125, 42, 232, 0.2)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={`${cornerPoints.topRight.x}%`}
          y1={`${cornerPoints.topRight.y}%`}
          x2={`${cornerPoints.bottomLeft.x}%`}
          y2={`${cornerPoints.bottomLeft.y}%`}
          stroke="rgba(125, 42, 232, 0.2)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      </svg>

      {/* Corner handles */}
      {handlePositions.map((handle, idx) => (
        <div
          key={idx}
          className={`absolute pointer-events-auto cursor-move transition-transform ${
            draggingCorner === handle.corner ? 'scale-125' : 'scale-100'
          }`}
          style={{
            left: `${handle.x}%`,
            top: `${handle.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: draggingCorner === handle.corner ? 100 : 10,
          }}
          onMouseDown={(e) => handleMouseDown(e, handle.corner)}
          onTouchStart={(e) => handleMouseDown(e, handle.corner)}
        >
          {/* Handle visual */}
          <div
            className={`relative w-6 h-6 rounded-full border-2 shadow-lg ${
              draggingCorner === handle.corner
                ? 'bg-purple-500 border-purple-300 shadow-purple-500/50'
                : 'bg-[#7d2ae8] border-white/80 shadow-black/30 hover:bg-purple-400'
            }`}
          >
            {/* Inner glow */}
            <div className="absolute inset-1.5 rounded-full bg-white/30" />

            {/* Corner label */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
              {String(handle.corner).replace(/([A-Z])/g, ' $1').trim()}
            </div>

            {/* Position indicator */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-mono text-white whitespace-nowrap bg-black/60 px-1 py-0.5 rounded">
              {Math.round(handle.x)},{Math.round(handle.y)}
            </div>
          </div>

          {/* Ripple effect when dragging */}
          {draggingCorner === handle.corner && (
            <div className="absolute inset-0 rounded-full animate-ping bg-purple-500/30" />
          )}
        </div>
      ))}

      {/* Center indicator */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${(cornerPoints.topLeft.x + cornerPoints.topRight.x + cornerPoints.bottomLeft.x + cornerPoints.bottomRight.x) / 4}%`,
          top: `${(cornerPoints.topLeft.y + cornerPoints.topRight.y + cornerPoints.bottomLeft.y + cornerPoints.bottomRight.y) / 4}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-2 h-2 rounded-full bg-purple-400/50" />
      </div>
    </div>
  );
};

export default CornerHandles;
