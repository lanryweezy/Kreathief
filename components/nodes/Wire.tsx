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
  const pathId = `${fromX}-${fromY}-${toX}-${toY}`.replace(/\./g, '-');

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onMouseEnter();
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onMouseLeave();
  }, [onMouseLeave]);

  const strokeColor = isHovered ? '#ef4444' : isActive ? '#7D2AE8' : 'rgba(255,255,255,0.2)';

  return (
    <g>
      <path
        id={`path-${pathId}`}
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={4}
        className="opacity-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        className="transition-all duration-300"
        style={{ pointerEvents: 'none' }}
      />
      {isActive && (
        <path
          d={path}
          fill="none"
          stroke="#7D2AE8"
          strokeWidth={2}
          strokeDasharray="4,12"
          className="animate-[dash_1s_linear_infinite]"
          style={{ pointerEvents: 'none', opacity: 0.5 }}
        />
      )}
      {/* Animated Flowing Neon Particle */}
      {isActive && (
        <circle r="3.5" fill="#00C4CC" style={{ filter: 'drop-shadow(0 0 3px #00C4CC)' }}>
          <animateMotion dur="1.8s" repeatCount="indefinite">
            <mpath href={`#path-${pathId}`} />
          </animateMotion>
        </circle>
      )}
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
