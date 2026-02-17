import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { pxToUnit, unitToPx } from '../utils/unitUtils';

interface RulerProps {
    type: 'horizontal' | 'vertical';
    length: number;
    zoom: number;
    size?: number; // Thickness of ruler
}

export const Ruler: React.FC<RulerProps> = ({ type, length, zoom, size = 24 }) => {
    const isHorizontal = type === 'horizontal';
    const unit = useStore(state => state.unit);

    // Dynamic step calculation based on unit and zoom
    const settings = useMemo(() => {
        if (unit === 'px') {
            const step = zoom <= 0.25 ? 200 : zoom <= 0.5 ? 100 : zoom <= 1.5 ? 50 : 20;
            return { step, minor: 10, labelMod: step };
        }

        if (unit === 'in') {
            const step = zoom <= 0.25 ? 2 : zoom <= 0.5 ? 1 : 0.5;
            return { step: unitToPx(step, 'in'), minor: unitToPx(step / 4, 'in'), labelMod: step };
        }

        if (unit === 'cm') {
            const step = zoom <= 0.5 ? 5 : zoom <= 1.5 ? 1 : 0.5;
            return { step: unitToPx(step, 'cm'), minor: unitToPx(step / 5, 'cm'), labelMod: step };
        }

        if (unit === 'mm') {
            const step = zoom <= 0.5 ? 50 : zoom <= 1.5 ? 10 : 5;
            return { step: unitToPx(step, 'mm'), minor: unitToPx(step / 5, 'mm'), labelMod: step };
        }

        return { step: 50, minor: 10, labelMod: 50 };
    }, [unit, zoom]);

    const ticks = useMemo(() => {
        const items = [];
        const { step, minor } = settings;

        // Iterate by minor ticks for better coverage
        const increment = minor || 10;
        for (let i = 0; i <= length; i += increment) {
            const isMajor = Math.abs(i % step) < 0.1;
            if (isMajor) {
                const label = pxToUnit(i, unit).toString();
                items.push({ pos: i, type: 'major', label });
            } else if (zoom > 0.5) {
                items.push({ pos: i, type: 'minor', label: null });
            }
        }
        return items;
    }, [length, settings, unit, zoom]);

    return (
        <div
            className={`absolute bg-[#1e1e1e] border-gray-700 flex select-none pointer-events-none opacity-80 z-50
        ${isHorizontal ? 'border-b left-0 right-0 -top-[24px]' : 'border-r top-0 -left-[24px] bottom-0'}
      `}
            style={{
                width: isHorizontal ? '100%' : `${size}px`,
                height: isHorizontal ? `${size}px` : '100%',
                transform: `scale(${1 / zoom})`,
                transformOrigin: isHorizontal ? 'bottom left' : 'top right',
                minWidth: isHorizontal ? `${length * zoom}px` : undefined,
                minHeight: !isHorizontal ? `${length * zoom}px` : undefined,
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={isHorizontal ? `0 0 ${length} ${size}` : `0 0 ${size} ${length}`}
                preserveAspectRatio="none"
                className="overflow-visible"
            >
                {ticks.map((tick, idx) => (
                    <g key={idx} transform={isHorizontal ? `translate(${tick.pos}, 0)` : `translate(0, ${tick.pos})`}>
                        <line
                            x1={0} y1={isHorizontal ? size : 0}
                            x2={isHorizontal ? 0 : size}
                            y2={isHorizontal ? size - (tick.type === 'major' ? 6 : 4) : (tick.type === 'major' ? 6 : 4)}
                            stroke="#666"
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                        {tick.label && (
                            <text
                                x={isHorizontal ? 2 : 2}
                                y={isHorizontal ? size - 8 : 8}
                                fill="#888"
                                fontSize={10}
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                                {tick.label}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
};
