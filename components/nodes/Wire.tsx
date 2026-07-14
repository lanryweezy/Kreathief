import { memo, useState, useCallback } from 'react';

interface WireProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function Wire({ fromX, fromY, toX, toY, isActive, onMouseEnter, onMouseLeave, onClick }: WireProps) {
  const [isHovered, setIsHovered] = useState(false);

  const dx = Math.abs(toX - fromX) * 0.5;
  const path = `M ${fromX},${fromY} C ${fromX + dx},${fromY} ${toX - dx},${toY} ${toX},${toY}`;
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onMouseEnter();
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onMouseLeave();
  }, [onMouseLeave]);

  const strokeColor = isHovered
    ? '#ef4444'
    : isActive
    ? 'var(--color-brand-600, #7D2AE8)'
    : 'rgba(255,255,255,0.2)';

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <circle
        cx={midX}
        cy={midY}
        r={6}
        fill="transparent"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
}

export default memo(Wire);
