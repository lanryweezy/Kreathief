
import React, { useMemo } from 'react';

interface RulerProps {
    type: 'horizontal' | 'vertical';
    length: number;
    zoom: number;
    size?: number; // Thickness of ruler
}

export const Ruler: React.FC<RulerProps> = ({ type, length, zoom, size = 24 }) => {
    const isHorizontal = type === 'horizontal';

    // Calculate dynamic tick interval based on zoom to avoid collecting clutter
    const step = useMemo(() => {
        if (zoom <= 0.25) return 200;
        if (zoom <= 0.5) return 100;
        if (zoom <= 1.5) return 50;
        return 20;
    }, [zoom]);

    const ticks = useMemo(() => {
        const items = [];
        const tickLen = size / 3;
        const majorTickLen = size / 1.5;

        for (let i = 0; i <= length; i += 10) {
            if (i % step === 0) {
                // Major tick with label
                items.push({ pos: i, type: 'major', label: i.toString() });
            } else if (zoom > 0.5 && i % (step / 2) === 0) {
                // Minor tick (only if zoomed in enough)
                items.push({ pos: i, type: 'minor', label: null });
            } else if (zoom > 2 && i % 10 === 0) {
                // Tiny tick
                items.push({ pos: i, type: 'tiny', label: null });
            }
        }
        return items;
    }, [length, step, size, zoom]);

    // We inverse scale the text to keep it readable if we were inside a scaled container
    // BUT current plan is putting Ruler *inside* the scaled Canvas 'paper' container for alignment simplicity.
    // This means the SVG coordinate system is ALREADY scaled by `zoom`.
    // So:
    // - A line at x=100 is drawn at 100 units.
    // - The visual thickness of the ruler itself will scale (get huge when zoomed in).
    // To fix this visual issue, we can apply `transform: scale(1/zoom)` to the ruler container? 
    // If we do that, `width` becomes `length * zoom`.
    // Let's try simple SVG first inside the paper. If it looks bad (too thick borders), we might refine.
    // Actually, standard behavior in tools: Rulers are UI => Fixed pixel size.
    // If I put it inside the scaled div, it IS content.
    // Let's rely on `vector-effect="non-scaling-stroke"` for lines!
    // For text, we can use `transform="scale(${1/zoom})"` on the text elements?

    const textScale = 1 / Math.max(0.1, zoom);

    return (
        <div
            className={`absolute bg-[#1e1e1e] border-gray-700 flex select-none pointer-events-none opacity-80 z-50
        ${isHorizontal ? 'border-b left-0 right-0 -top-[24px]' : 'border-r top-0 -left-[24px] bottom-0'}
      `}
            style={{
                width: isHorizontal ? '100%' : `${size}px`,
                height: isHorizontal ? `${size}px` : '100%',
                // We do NOT inverse scale the container itself because positioning is tricky.
                // We will just let it scale but try to keep content readable?
                // Actually, if we are inside `scale(zoom)`, a 24px height becomes 24*zoom px.
                // If zoom=0.1, ruler is 2.4px height. Unreadable.
                // If zoom=4, ruler is 100px height. Huge.

                // BETTER APPROACH:
                // Use `transform: scale(${1/zoom})` and `transform-origin: bottom left` (for horizontal).
                transform: `scale(${1 / zoom})`,
                transformOrigin: isHorizontal ? 'bottom left' : 'top right',
                // We need to adjust width/height to cover the full paper length
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
                            vectorEffect="non-scaling-stroke" // Keep line crisp
                        />
                        {tick.label && (
                            <text
                                x={isHorizontal ? 2 : 2}
                                y={isHorizontal ? size - 8 : 8}
                                fill="#888"
                                fontSize={10}
                                // Force text to stay consistent size regardless of zoom
                                // vector-effect="non-scaling-size" doesn't exist for text via CSS usually?
                                // We can manually scale text
                                // transform={`scale(${textScale})`} // Wait, we already scaled the parent div to 1/zoom.
                                // So inside here, the coordinate system is `1 unit = 1 visual pixel` ? No.
                                // If parent div is scaled 1/zoom, and it lives in a div scaled zoom...
                                // Then the net scale is 1. One CSS pixel = 1 Screen pixel.
                                // So we don't need magic for text!
                                // BUT, we need to map the viewBox correctly.
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
