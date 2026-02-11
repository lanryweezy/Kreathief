
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NavTab, TextLayer, ShapeLayer, ImageLayer, Layer, CanvasFilters, CanvasSize, User, BrushType, GeneratedImage } from '../types';
import { Icons } from '../constants';
import { Ruler } from './Ruler';
import { Toolbar } from './Toolbar';
import { ContextMenu } from './ContextMenu';

// --- Sub-Components (Memoized) ---

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'w' | 'e' | 'n' | 's';

interface SelectionHandlesProps {
    layer: Layer;
    onResize: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
    onRotate: (e: React.MouseEvent, layer: Layer) => void;
    scale: number;
}

const SelectionHandles = React.memo(({ layer, onResize, onRotate, scale }: SelectionHandlesProps) => {
    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
            {/* Border */}
            <div className={`absolute -inset-0.5 border-2 ${layer.locked ? 'border-red-400 border-dashed' : 'border-[#00c4cc]'} shadow-[0_0_8px_rgba(0,196,204,0.25)]`} style={{ borderRadius: `${(layer as any).cornerRadius || 0}px` }}></div>

            {layer.locked && (
                <div className="absolute -top-3 -right-3 bg-red-100 text-red-500 rounded-full p-1 shadow-md border border-red-200 z-50">
                    <Icons.Lock className="w-3 h-3" />
                </div>
            )}

            {!layer.locked && (
                <>
                    {/* Corner Handles */}
                    <div onMouseDown={(e) => onResize(e, layer, 'nw')} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-nw-resize shadow-md hover:scale-125 transition-transform z-50"></div>
                    <div onMouseDown={(e) => onResize(e, layer, 'ne')} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-ne-resize shadow-md hover:scale-125 transition-transform z-50"></div>
                    <div onMouseDown={(e) => onResize(e, layer, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-sw-resize shadow-md hover:scale-125 transition-transform z-50"></div>
                    <div onMouseDown={(e) => onResize(e, layer, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full pointer-events-auto cursor-se-resize shadow-md hover:scale-125 transition-transform z-50"></div>

                    {/* Edge Handles (Middle) */}
                    {layer.width > 30 && (
                        <>
                            <div onMouseDown={(e) => onResize(e, layer, 'n')} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ns-resize shadow-sm hover:scale-110 transition-transform z-40"></div>
                            <div onMouseDown={(e) => onResize(e, layer, 's')} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ns-resize shadow-sm hover:scale-110 transition-transform z-40"></div>
                        </>
                    )}
                    {(layer.type !== 'text' || layer.width > 30) && (
                        <>
                            <div onMouseDown={(e) => onResize(e, layer, 'w')} className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1.5 h-6 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ew-resize shadow-sm hover:scale-110 transition-transform z-40"></div>
                            <div onMouseDown={(e) => onResize(e, layer, 'e')} className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-1.5 h-6 bg-white border border-[#00c4cc] rounded-full pointer-events-auto cursor-ew-resize shadow-sm hover:scale-110 transition-transform z-40"></div>
                        </>
                    )}

                    {/* Rotate Handle */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 pointer-events-auto group/rotate z-50">
                        <div className="w-px h-4 bg-[#00c4cc]"></div>
                        <div
                            onMouseDown={(e) => onRotate(e, layer)}
                            className="w-6 h-6 bg-white border-2 border-[#00c4cc] rounded-full cursor-grab flex items-center justify-center hover:bg-[#00c4cc] hover:text-white shadow-md transition-colors"
                            title="Rotate"
                        >
                            <Icons.Undo className="w-3.5 h-3.5 text-[#00c4cc] group-hover/rotate:text-white rotate-90" />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

const ImageLayerItem = React.memo(({ layer, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onResize, onRotate, onContextMenu }: any) => {
    const scaleX = layer.flipX ? -1 : 1;
    const scaleY = layer.flipY ? -1 : 1;

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, layer)}
            onMouseEnter={() => onMouseEnter(layer.id)}
            onMouseLeave={() => onMouseLeave(null)}
            onContextMenu={(e) => onContextMenu(e, layer.id)}
            className="absolute cursor-move group animate-scaleIn"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `${layer.perspective ? `perspective(${layer.perspective}px)` : ''} rotateX(${layer.rotateX || 0}deg) rotateY(${layer.rotateY || 0}deg) rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                opacity: layer.opacity,
                mixBlendMode: layer.blendMode as any,
                boxShadow: layer.shadow ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}` : 'none',
                border: layer.stroke ? `${layer.stroke.width}px solid ${layer.stroke.color}` : 'none',
                borderRadius: `${layer.cornerRadius || 0}px`,
                willChange: 'transform',
            }}
        >
            {isHovered && !isSelected && !layer.locked && (
                <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
            )}

            <div className="w-full h-full overflow-hidden" style={{ borderRadius: `${layer.cornerRadius || 0}px` }}>
                <img
                    src={layer.src}
                    className="w-full h-full object-cover pointer-events-none block"
                    style={{
                        transform: `scale(${scaleX}, ${scaleY})`,
                        filter: `brightness(${layer.filters.brightness}%) contrast(${layer.filters.contrast}%) saturate(${layer.filters.saturation}%) grayscale(${layer.filters.grayscale}%) blur(${layer.filters.blur}px) sepia(${layer.filters.sepia}%) hue-rotate(${layer.filters.hueRotate}deg)`
                    }}
                />
                {(layer.filters.vignette || 0) > 0 && (
                    <div className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle, transparent ${Math.max(0, 70 - (layer.filters.vignette || 0) * 0.5)}%, rgba(0,0,0,${(layer.filters.vignette || 0) / 100}))`
                        }}
                    />
                )}
            </div>

            {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
    );
});

const ShapeLayerItem = React.memo(({ layer, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onResize, onRotate, onContextMenu, onDrop }: any) => {
    let borderRadius = '0';
    if (layer.type === 'circle') borderRadius = '50%';
    else if (layer.type === 'rectangle') borderRadius = `${layer.cornerRadius || 0}px`;

    let clipPath = undefined;
    switch (layer.type) {
        case 'triangle': clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'; break;
        case 'star': clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'; break;
        case 'hexagon': clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'; break;
        case 'diamond': clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'; break;
        case 'arrow': clipPath = 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)'; break;
        case 'heart': clipPath = 'polygon(50% 85%, 15% 50%, 15% 25%, 30% 10%, 50% 25%, 70% 10%, 85% 25%, 85% 50%)'; break;
        case 'speech_bubble': clipPath = 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)'; break;
        case 'shield': clipPath = 'polygon(50% 0, 100% 10%, 100% 80%, 50% 100%, 0 80%, 0 10%)'; break;
        case 'ribbon': clipPath = 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%, 10% 50%)'; break;
        case 'banner': clipPath = 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)'; break;
    }

    if (layer.type === 'path') {
        return (
            <div
                onMouseDown={(e) => onMouseDown(e, layer)}
                onMouseEnter={() => onMouseEnter(layer.id)}
                onMouseLeave={() => onMouseLeave(null)}
                onContextMenu={(e) => onContextMenu(e, layer.id)}
                className="absolute cursor-move group animate-scaleIn"
                style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    transform: `${layer.perspective ? `perspective(${layer.perspective}px)` : ''} rotateX(${layer.rotateX || 0}deg) rotateY(${layer.rotateY || 0}deg) rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                    opacity: layer.opacity,
                    mixBlendMode: layer.blendMode as any,
                    filter: layer.shadow ? `drop-shadow(${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color})` : 'none',
                    willChange: 'transform',
                }}
            >
                {isHovered && !isSelected && !layer.locked && (
                    <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
                )}

                <svg viewBox={layer.viewBox || "0 0 100 100"} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <path
                        d={layer.pathData}
                        fill={layer.color}
                        stroke={layer.stroke?.color || 'none'}
                        strokeWidth={layer.stroke?.width || 0}
                    />
                </svg>

                {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
            </div>
        );
    }

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, layer)}
            onMouseEnter={() => onMouseEnter(layer.id)}
            onMouseLeave={() => onMouseLeave(null)}
            onContextMenu={(e) => onContextMenu(e, layer.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, layer.id)}
            className="absolute cursor-move group animate-scaleIn"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `${layer.perspective ? `perspective(${layer.perspective}px)` : ''} rotateX(${layer.rotateX || 0}deg) rotateY(${layer.rotateY || 0}deg) rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                backgroundColor: layer.backgroundImage ? 'transparent' : layer.color,
                borderRadius: borderRadius,
                clipPath: clipPath,
                boxShadow: layer.shadow && !clipPath ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}` : 'none',
                border: layer.stroke && !clipPath ? `${layer.stroke.width}px solid ${layer.stroke.color}` : 'none',
                opacity: layer.opacity,
                mixBlendMode: layer.blendMode as any,
                filter: layer.shadow && clipPath ? `drop-shadow(${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundImage: layer.backgroundImage ? `url(${layer.backgroundImage})` : 'none',
                willChange: 'transform',
            }}
        >
            {isHovered && !isSelected && !layer.locked && (
                <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
            )}

            {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
    );
});

// Helper for rendering text along a path
const renderTextOnPath = (canvas: HTMLCanvasElement, layer: TextLayer) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !layer.textPath) return;

    const { text, color, fontSize, fontFamily, fontWeight, fontStyle, width } = layer;
    const dpr = 2; // High DPI

    // Create a path object to measure length
    const path = new Path2D(layer.textPath);
    // Note: Path2D doesn't expose methods to get point at length in standard Canvas API easily without SVG DOM.
    // We will use a hidden SVG element helper to get point at length logic if needed, 
    // OR we can approximate for simple curves (Quad/Arc). 
    // FOR ROBUSTNESS in this environment without heavy libraries:
    // We will use a DOM-based approach: Create a temporary SVG element, measure, and draw.
    // But we are in a Canvas component. 
    // Better approach: Use a helper function that moves characters along the path using vector math for specific presets, 
    // OR simply use the "warp" approach but with path logic.

    // MVP: Approximate the curve logic for the specific presets we added (Curve Q and Circle A).
    // Preset 1: Curve 'M 10,50 Q 50,0 90,50' (Quadratic Bezier)
    // Preset 2: Circle 'M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0'

    // Let's implement a generic "Text on Path" is hard. 
    // Let's implement logic that parses the path if it matches our presets.

    canvas.width = width * dpr;
    canvas.height = (width) * dpr; // Square aspect for paths usually
    ctx.scale(dpr, dpr);
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    if (layer.textPath.includes('Q')) {
        // Quadratic Curve Logic
        // Simple Arc interpolation
        const characters = text.split('');
        const totalAngle = Math.PI; // 180 degree arc
        const startAngle = Math.PI;
        const radius = width / 2;
        const cx = width / 2;
        const cy = width / 2 + radius * 0.5; // Offset to center

        characters.forEach((char, i) => {
            const angle = startAngle + (i / (characters.length - 1 || 1)) * totalAngle;
            // Actually Q curves are not perfect arcs. simpler to map linear x to arc.
            const x = (i / (characters.length - 1 || 1)) * width;
            // Map x to curve y
            // For M 10,50 Q 50,0 90,50 (scaled to width)
            // y = 4 * h * (x/w) * (1 - x/w) parabola roughly
            // Let's just do a simple ARCH effect which we already have in warpStyle='arc'.
            // BUT user wants "Text on Path".

            // True Path Logic:
            // Since we lack a robust path traverser, let's use the simplest approximation:
            // Rotate context and translate.

            // CIRCLE LOGIC (matches our circle preset)
            if (layer.textPath && layer.textPath.includes('a 40,40')) {
                const angleStep = (Math.PI * 2) / (text.length * 1.5);
                const startTheta = -Math.PI / 2 - (text.length * angleStep) / 2;

                ctx.save();
                ctx.translate(width / 2, width / 2);
                ctx.rotate(startTheta + i * angleStep);
                ctx.translate(0, -width / 3); // Radius approximation
                ctx.rotate(-Math.PI / 2); // upright text? no, tangent.
                // Tangent means text sits on line. 
                // For circle, we want text upright relative to center.
                // Normal rotation is tangent.
                ctx.translate(0, 0);
                ctx.fillText(char, 0, 0);
                ctx.restore();
            } else {
                // CURVE LOGIC
                const t = i / (text.length - 1 || 1);
                const x = t * width; // 10 to 90 mapped to 0 to width
                // Parabolic arc: y = a(x-h)^2 + k
                const h = width / 2;
                const k = 0; // top
                // at x=0, y=width/2. width/2 = a(-h)^2 => a = (width/2)/h^2 = 2/width
                const y = (2 / width) * Math.pow(x - h, 2);

                // Slop/Rotation calculation (derivative)
                // dy/dx = 2a(x-h)
                const slope = (4 / width) * (x - h);
                const rot = Math.atan(slope);

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rot);
                ctx.fillText(char, 0, 0);
                ctx.restore();
            }
        });
    } else {
        // default or complex
        ctx.fillText("Complex Path Preview", width / 2, width / 2);
    }
};

// Helper for rendering warped text to a canvas
const renderWarpedText = (canvas: HTMLCanvasElement, layer: TextLayer) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { text, color, fontSize, fontFamily, fontWeight, fontStyle, warpStyle, curve = 0, width, lineHeight = 1.2, textAlign = 'left' } = layer;
    const dpr = 2;
    const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    const lines = text.split('\n');
    const totalLineHeight = fontSize * lineHeight;
    const textBlockHeight = lines.length * totalLineHeight;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = width * dpr;
    tempCanvas.height = textBlockHeight * dpr;
    tempCtx.scale(dpr, dpr);
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    tempCtx.font = font;
    tempCtx.fillStyle = color;
    tempCtx.textBaseline = 'top';
    tempCtx.textAlign = textAlign;

    lines.forEach((line, i) => {
        let x = 0;
        if (textAlign === 'center') x = width / 2;
        if (textAlign === 'right') x = width;
        tempCtx.fillText(line, x, i * totalLineHeight);
    });

    const intensity = curve / 100;
    const maxDisplacement = Math.abs(intensity) * (width / 2);

    canvas.width = width * dpr;
    canvas.height = (textBlockHeight + maxDisplacement * 2) * dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const bufferY = maxDisplacement * dpr;
    const sliceWidth = 2;

    for (let x = 0; x < tempCanvas.width; x += sliceWidth) {
        const normalizedX = (x / tempCanvas.width) * 2 - 1;
        let offsetY = 0;

        if (warpStyle === 'flag') {
            offsetY = Math.sin(normalizedX * Math.PI * 1.5) * (intensity * width * dpr * 0.3);
        } else if (warpStyle === 'rise') {
            offsetY = normalizedX * (intensity * width * dpr * 0.3);
        } else if (warpStyle === 'arc') {
            offsetY = (1 - normalizedX * normalizedX) * (intensity * width * dpr * 0.3) * -1;
        }

        ctx.drawImage(
            tempCanvas,
            x, 0, sliceWidth, tempCanvas.height,
            x, bufferY + offsetY, sliceWidth, tempCanvas.height
        );
    }
};

const TextLayerItem = React.memo(({ layer, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onResize, onRotate, onContextMenu, onDoubleClick, isInteracting }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isInteracting) return; // Optimization: Skip expensive re-renders during drag
        if (layer.textPath && canvasRef.current) {
            renderTextOnPath(canvasRef.current, layer);
        } else if (layer.warpStyle && layer.warpStyle !== 'none' && canvasRef.current) {
            renderWarpedText(canvasRef.current, layer);
        }
    }, [layer.text, layer.color, layer.fontSize, layer.fontFamily, layer.fontWeight, layer.fontStyle, layer.warpStyle, layer.curve, layer.width, layer.lineHeight, layer.textAlign, layer.textPath, isInteracting]);

    const textStyle: React.CSSProperties = {
        fontSize: `${layer.fontSize}px`,
        fontWeight: layer.fontWeight,
        fontStyle: layer.fontStyle,
        textDecoration: layer.textDecoration,
        fontFamily: layer.fontFamily,
        textAlign: layer.textAlign,
        letterSpacing: `${layer.letterSpacing}px`,
        lineHeight: layer.lineHeight,
        textTransform: layer.textTransform,
        color: layer.gradient?.enabled ? 'transparent' : layer.color,
        backgroundImage: layer.gradient?.enabled ? `linear-gradient(${layer.gradient.angle}deg, ${layer.gradient.startColor}, ${layer.gradient.endColor})` : 'none',
        WebkitBackgroundClip: layer.gradient?.enabled ? 'text' : 'unset',
        backgroundClip: layer.gradient?.enabled ? 'text' : 'unset',
        textShadow: layer.shadow ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}` : 'none',
        WebkitTextStroke: layer.stroke ? `${layer.stroke.width}px ${layer.stroke.color}` : 'none',
        width: '100%',
        height: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        userSelect: 'none',
    };

    // 3D Text Depth Effect using stacked text-shadows
    if (layer.depth && layer.depth > 0) {
        const depthColor = layer.depthColor || '#333333';
        const shadows: string[] = [];
        for (let i = 1; i <= layer.depth; i++) {
            shadows.push(`${i}px ${i}px 0px ${depthColor}`);
        }
        // Add main shadow if exists
        if (layer.shadow) {
            shadows.push(`${layer.shadow.offsetX + layer.depth}px ${layer.shadow.offsetY + layer.depth}px ${layer.shadow.blur}px ${layer.shadow.color}`);
        }
        textStyle.textShadow = shadows.join(', ');
    }

    if (layer.styleType === 'hollow') {
        textStyle.color = 'transparent';
        textStyle.WebkitTextStroke = `1px ${layer.color}`;
    }

    if ((layer.warpStyle && layer.warpStyle !== 'none') || layer.textPath) {
        return (
            <div
                onMouseDown={(e) => onMouseDown(e, layer)}
                onMouseEnter={() => onMouseEnter(layer.id)}
                onMouseLeave={() => onMouseLeave(null)}
                onContextMenu={(e) => onContextMenu(e, layer.id)}
                onDoubleClick={(e) => onDoubleClick(e, layer)}
                className="absolute cursor-move group animate-scaleIn"
                style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    transform: `${layer.perspective ? `perspective(${layer.perspective}px)` : ''} rotateX(${layer.rotateX || 0}deg) rotateY(${layer.rotateY || 0}deg) rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                    opacity: layer.opacity,
                    mixBlendMode: layer.blendMode as any,
                    willChange: 'transform',
                }}
            >
                {isHovered && !isSelected && !layer.locked && (
                    <div className="absolute -inset-2 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
                )}

                <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
            </div>
        );
    }

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, layer)}
            onMouseEnter={() => onMouseEnter(layer.id)}
            onMouseLeave={() => onMouseLeave(null)}
            onContextMenu={(e) => onContextMenu(e, layer.id)}
            onDoubleClick={(e) => onDoubleClick(e, layer)}
            className="absolute cursor-move group animate-scaleIn"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                transform: `${layer.perspective ? `perspective(${layer.perspective}px)` : ''} rotateX(${layer.rotateX || 0}deg) rotateY(${layer.rotateY || 0}deg) rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                opacity: layer.opacity,
                mixBlendMode: layer.blendMode as any,
                minHeight: layer.fontSize,
                willChange: 'transform',
            }}
        >
            {isHovered && !isSelected && !layer.locked && (
                <div className="absolute -inset-2 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
            )}

            <div style={textStyle}>{layer.text}</div>
            {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
    );
});

interface CanvasProps {
    activeImage: GeneratedImage | null;
    uploadedImage: string | null;
    isProcessing: boolean;
    zoom: number;
    onZoomChange: (z: number) => void;
    canvasBackgroundColor: string;
    onSetCanvasBackgroundColor: (c: string) => void;
    canvasFilters: CanvasFilters;
    onUpdateCanvasFilters: (f: Partial<CanvasFilters>) => void;
    textLayers: TextLayer[];
    shapeLayers: ShapeLayer[];
    imageLayers: ImageLayer[];
    onUpdateTextLayer: (id: string, c: Partial<TextLayer>) => void;
    onUpdateShapeLayer: (id: string, c: Partial<ShapeLayer>) => void;
    onUpdateImageLayer: (id: string, c: Partial<ImageLayer>) => void;
    onSelectLayer: (id: string | null) => void;
    onDeleteLayer: (id: string) => void;
    onDuplicateLayer: (id: string) => void;
    onMoveLayer: (id: string, dir: 'front' | 'back' | 'forward' | 'backward') => void;
    selectedLayerId: string | null;
    onInteractionStart: () => void;
    onMagicWrite: (id: string) => void;
    showGrid: boolean;
    onToggleGrid: () => void;
    isDrawing: boolean;
    brushColor: string;
    brushSize: number;
    brushOpacity: number;
    brushType?: BrushType;
    onDrawingComplete: (dataUrl: string) => void;
    onRemix: (id: string) => void;
    canvasSize: CanvasSize;
    onSetCanvasSize: (size: CanvasSize) => void;
    documentColors?: string[];
    user: User;
    onOpenPricing: () => void;
    selectedLayerIds?: string[];
    onMultiSelectLayer?: (id: string) => void;
    onGroup?: () => void;
    onUngroup?: () => void;
    onVectorDrawingComplete?: (pathData: string, stroke: any) => void;
    onFileUpload?: (file: File) => void;
    onToggleEraser?: () => void;
    onToggleDesignSuggestions?: () => void;
    onToggleSmartContent?: () => void;
    onToggleQualityScore?: () => void;
}


export const Canvas: React.FC<CanvasProps> = ({
    activeImage,
    uploadedImage,
    isProcessing,
    zoom,
    onZoomChange,
    canvasBackgroundColor,
    onSetCanvasBackgroundColor,
    canvasFilters,
    onUpdateCanvasFilters,
    textLayers,
    shapeLayers,
    imageLayers,
    onUpdateTextLayer,
    onUpdateShapeLayer,
    onUpdateImageLayer,
    onSelectLayer,
    onDeleteLayer,
    onDuplicateLayer,
    onMoveLayer,
    selectedLayerId,
    onInteractionStart,
    onMagicWrite,
    showGrid,
    onToggleGrid,
    isDrawing,
    brushColor,
    brushSize,
    brushOpacity,
    brushType = BrushType.BASIC,
    onDrawingComplete,
    onRemix,
    canvasSize,
    onSetCanvasSize,
    documentColors,
    user,
    onOpenPricing,
    selectedLayerIds = [],
    onMultiSelectLayer,
    onGroup,
    onUngroup,
    onVectorDrawingComplete,
    onFileUpload,
    onToggleEraser,
    onToggleDesignSuggestions,
    onToggleSmartContent,
    onToggleQualityScore
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

    // Interaction State
    const [dragState, setDragState] = useState<{ isDragging: boolean, startX: number, startY: number, initialPositions: Record<string, { x: number, y: number }> } | null>(null);
    const [resizeState, setResizeState] = useState<{ isResizing: boolean, handle: ResizeHandle, startX: number, startY: number, initialLayer: Layer } | null>(null);
    const [rotateState, setRotateState] = useState<{ isRotating: boolean, startX: number, startY: number, initialRotation: number, centerX: number, centerY: number } | null>(null);
    const [drawingState, setDrawingState] = useState({ isDrawingPath: false });
    const drawingLastPos = useRef({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, layerId: string } | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Pro Features: Pan & Snap
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [snapLines, setSnapLines] = useState<{ vertical?: number, horizontal?: number }>({});

    // local drag preview to avoid parent re-renders on every pixel
    const [dragPreview, setDragPreview] = useState<{ id: string, x: number, y: number, width?: number, height?: number, rotation?: number } | null>(null);
    const [bulkDragPreview, setBulkDragPreview] = useState<Record<string, { x: number, y: number }>>({});

    const layers: Layer[] = useMemo(() => [...shapeLayers, ...imageLayers, ...textLayers], [shapeLayers, imageLayers, textLayers]);
    const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;
    const bgImage = activeImage?.url || uploadedImage;

    // Use refs for state accessed in mouse handlers to avoid re-creating callbacks
    const dragStateRef = useRef(dragState);
    dragStateRef.current = dragState;
    const resizeStateRef = useRef(resizeState);
    resizeStateRef.current = resizeState;
    const rotateStateRef = useRef(rotateState);
    rotateStateRef.current = rotateState;
    const selectedLayerRef = useRef(selectedLayer);
    selectedLayerRef.current = selectedLayer;
    const selectedLayerIdRef = useRef(selectedLayerId);
    selectedLayerIdRef.current = selectedLayerId;
    const selectedLayerIdsRef = useRef(selectedLayerIds);
    selectedLayerIdsRef.current = selectedLayerIds;
    const layersRef = useRef(layers);
    layersRef.current = layers;
    const isPanningRef = useRef(isPanning);
    isPanningRef.current = isPanning;
    const panStartRef = useRef(panStart);
    panStartRef.current = panStart;
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;
    const bulkDragPreviewRef = useRef(bulkDragPreview);
    bulkDragPreviewRef.current = bulkDragPreview;
    const dragPreviewRef = useRef(dragPreview);
    dragPreviewRef.current = dragPreview;

    // Helper to get effective layer props (merging original with preview)
    const getEffectiveLayer = <T extends Layer>(layer: T): T => {
        if (bulkDragPreview[layer.id]) {
            return { ...layer, ...bulkDragPreview[layer.id] };
        }
        if (dragPreview && dragPreview.id === layer.id) {
            return { ...layer, ...dragPreview };
        }
        return layer;
    };

    const getSnapLines = useCallback((currentLayer: Layer, currentX: number, currentY: number) => {
        const SNAP_THRESHOLD = 5 / zoomRef.current;
        const layerHeight = (currentLayer as any).height || 0;
        const centerY = currentY + layerHeight / 2;
        const centerX = currentX + currentLayer.width / 2;

        let snapX: number | undefined = undefined;
        let snapY: number | undefined = undefined;
        let newX = currentX;
        let newY = currentY;

        // Snap to Canvas Center
        const canvasCenterX = canvasSize.width / 2;
        const canvasCenterY = canvasSize.height / 2;

        if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) {
            snapX = canvasCenterX;
            newX = canvasCenterX - currentLayer.width / 2;
        }
        if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) {
            snapY = canvasCenterY;
            newY = canvasCenterY - layerHeight / 2;
        }

        return { snapX, snapY, newX, newY };
    }, [canvasSize.width, canvasSize.height]);

    // -- Global Space Key for Panning --
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !editingTextId) {
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [editingTextId]);

    // -- Mouse Handlers --

    const handleMouseDownContainer = (e: React.MouseEvent) => {
        if (isSpacePressed) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        } else {
            onSelectLayer(null);
            setEditingTextId(null);
        }
    };

    const handleMouseDownLayer = (e: React.MouseEvent, layer: Layer) => {
        if (isSpacePressed || isDrawing || layer.locked) return;
        e.stopPropagation();

        if (e.shiftKey && onMultiSelectLayer) {
            onMultiSelectLayer(layer.id);
        } else {
            onSelectLayer(layer.id);
        }

        onInteractionStart();

        // Capture initial positions for all selected layers
        const initialPositions: Record<string, { x: number, y: number }> = {};
        const idsToMove = (e.shiftKey || (selectedLayerIds && selectedLayerIds.includes(layer.id))) && selectedLayerIds ? [...new Set([...selectedLayerIds, layer.id])] : [layer.id];

        layers.forEach(l => {
            if (idsToMove.includes(l.id)) {
                initialPositions[l.id] = { x: l.x, y: l.y };
            }
        });

        setDragState({
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialPositions
        });
    };

    const handleResizeStart = (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => {
        e.stopPropagation();
        onInteractionStart();
        setResizeState({ isResizing: true, handle, startX: e.clientX, startY: e.clientY, initialLayer: { ...layer } });
    };

    const handleRotateStart = (e: React.MouseEvent, layer: Layer) => {
        e.stopPropagation();
        onInteractionStart();
        const selectionBox = (e.target as HTMLElement).closest('.group');
        if (selectionBox) {
            const boxRect = selectionBox.getBoundingClientRect();
            setRotateState({ isRotating: true, startX: e.clientX, startY: e.clientY, initialRotation: layer.rotation, centerX: boxRect.left + boxRect.width / 2, centerY: boxRect.top + boxRect.height / 2 });
        }
    };

    const mouseMoveRequestRef = useRef<number>();
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (mouseMoveRequestRef.current) {
            cancelAnimationFrame(mouseMoveRequestRef.current);
        }

        mouseMoveRequestRef.current = requestAnimationFrame(() => {
            if (isPanningRef.current) {
                const dx = e.clientX - panStartRef.current.x;
                const dy = e.clientY - panStartRef.current.y;
                setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                setPanStart({ x: e.clientX, y: e.clientY });
                return;
            }

            const currentDragState = dragStateRef.current;
            const currentSelectedLayerId = selectedLayerIdRef.current;
            const currentSelectedLayerIds = selectedLayerIdsRef.current;
            const currentLayers = layersRef.current;
            const currentZoom = zoomRef.current;

            if (currentDragState?.isDragging && (currentSelectedLayerId || currentSelectedLayerIds.length > 0)) {
                const dx = (e.clientX - currentDragState.startX) / currentZoom;
                const dy = (e.clientY - currentDragState.startY) / currentZoom;

                const primaryLayerId = currentSelectedLayerId || currentSelectedLayerIds[0];
                const primaryLayer = currentLayers.find(l => l.id === primaryLayerId);

                let finalDx = dx;
                let finalDy = dy;

                if (primaryLayer && currentDragState.initialPositions[primaryLayer.id]) {
                    const initial = currentDragState.initialPositions[primaryLayer.id];
                    let proposedX = initial.x + dx;
                    let proposedY = initial.y + dy;

                    const { snapX, snapY, newX, newY } = getSnapLines({ ...primaryLayer, x: proposedX, y: proposedY } as any, proposedX, proposedY);
                    setSnapLines({ vertical: snapX, horizontal: snapY });

                    if (newX !== proposedX) finalDx = newX - initial.x;
                    if (newY !== proposedY) finalDy = newY - initial.y;
                }

                const newBulkPreview: Record<string, { x: number, y: number }> = {};
                Object.entries(currentDragState.initialPositions).forEach(([id, initialPos]) => {
                    newBulkPreview[id] = { x: initialPos.x + finalDx, y: initialPos.y + finalDy };
                });
                setBulkDragPreview(newBulkPreview);
            } else {
                setSnapLines({}); // Clear snap lines if not dragging
            }

            const currentResizeState = resizeStateRef.current;
            if (currentResizeState?.isResizing && currentSelectedLayerId) {
                const dx = (e.clientX - currentResizeState.startX) / currentZoom;
                const dy = (e.clientY - currentResizeState.startY) / currentZoom;
                const { handle, initialLayer } = currentResizeState;
                let { x, y, width } = initialLayer;
                let height = (initialLayer as any).height || 0;

                if (handle.includes('e')) width += dx;
                if (handle.includes('w')) { x += dx; width -= dx; }
                if (handle.includes('s')) height += dy;
                if (handle.includes('n')) { y += dy; height -= dy; }

                setDragPreview({
                    id: currentSelectedLayerId,
                    x, y,
                    width: Math.max(10, width),
                    height: Math.max(10, height)
                });
            }

            const currentRotateState = rotateStateRef.current;
            const currentSelectedLayer = selectedLayerRef.current;
            if (currentRotateState?.isRotating && currentSelectedLayerId) {
                const angle = Math.atan2(e.clientY - currentRotateState.centerY, e.clientX - currentRotateState.centerX);
                const startAngle = Math.atan2(currentRotateState.startY - currentRotateState.centerY, currentRotateState.startX - currentRotateState.centerX);
                const rotation = currentRotateState.initialRotation + (angle - startAngle) * (180 / Math.PI);
                setDragPreview({ id: currentSelectedLayerId, x: currentSelectedLayer?.x || 0, y: currentSelectedLayer?.y || 0, rotation });
            }
        });
    }, [getSnapLines]);

    const handleMouseUp = useCallback(() => {
        if (mouseMoveRequestRef.current) {
            cancelAnimationFrame(mouseMoveRequestRef.current);
            mouseMoveRequestRef.current = undefined;
        }

        const currentDragState = dragStateRef.current;
        const currentBulkDragPreview = bulkDragPreviewRef.current;
        const currentDragPreview = dragPreviewRef.current;
        const currentResizeState = resizeStateRef.current;
        const currentRotateState = rotateStateRef.current;
        const currentLayers = layersRef.current;

        // Helper to find layer type by id
        const findLayerType = (id: string): 'text' | 'shape' | 'image' | null => {
            const layer = currentLayers.find(l => l.id === id);
            if (!layer) return null;
            if (layer.type === 'text') return 'text';
            if (layer.type === 'image') return 'image';
            return 'shape'; // rectangle, circle, path, etc.
        };

        // Commit changes to parent only on mouseup
        if (currentDragState?.isDragging) {
            Object.entries(currentBulkDragPreview).forEach(([id, pos]) => {
                const type = findLayerType(id);
                if (type === 'text') onUpdateTextLayer(id, pos);
                else if (type === 'shape') onUpdateShapeLayer(id, pos);
                else if (type === 'image') onUpdateImageLayer(id, pos);
            });
        }
        if (currentDragPreview && (currentResizeState?.isResizing || currentRotateState?.isRotating)) {
            const { id, ...changes } = currentDragPreview;
            const type = findLayerType(id);
            if (type === 'text') onUpdateTextLayer(id, changes);
            else if (type === 'shape') onUpdateShapeLayer(id, { ...changes, width: changes.width || 0, height: changes.height || 0 });
            else if (type === 'image') onUpdateImageLayer(id, { ...changes, width: changes.width || 0, height: changes.height || 0 });
        }

        setDragState(null);
        setResizeState(null);
        setRotateState(null);
        setSnapLines({});
        setIsPanning(false);
        setDragPreview(null);
        setBulkDragPreview({});
    }, [onUpdateTextLayer, onUpdateShapeLayer, onUpdateImageLayer]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const [vectorPoints, setVectorPoints] = useState<{ x: number, y: number }[]>([]);

    // Drawing Handlers
    const handleDrawingMouseDown = (e: React.MouseEvent) => {
        if (!isDrawing || !drawingCanvasRef.current) return;
        const rect = drawingCanvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        drawingLastPos.current = { x, y };

        if (brushType === BrushType.VECTOR_PENCIL) {
            setDrawingState({ isDrawingPath: true });
            setVectorPoints([{ x, y }]);
            const ctx = drawingCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.strokeStyle = brushColor;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = brushOpacity;
            }
            return;
        }

        setDrawingState({ isDrawingPath: true });
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (ctx) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.strokeStyle = brushColor; ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = brushOpacity;
        }
    };

    const handleDrawingMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !drawingState.isDrawingPath || !drawingCanvasRef.current) return;
        const rect = drawingCanvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        const { x: lastX, y: lastY } = drawingLastPos.current;
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (!ctx) return;

        if (brushType === BrushType.VECTOR_PENCIL) {
            setVectorPoints(prev => [...prev, { x, y }]);
            ctx.lineTo(x, y);
            ctx.stroke();
            // Optimization: Use requestAnimationFrame for smoother preview if needed
            return;
        }

        const distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
        const angle = Math.atan2(y - lastY, x - lastX);

        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = brushOpacity;

        if (brushType === BrushType.BASIC) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = brushSize;
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (brushType === BrushType.CALLIGRAPHY) {
            // Calligraphy: slanted flat brush
            ctx.lineWidth = 1;
            for (let i = 0; i < distance; i += 0.5) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                ctx.save();
                ctx.translate(ix, iy);
                ctx.rotate(Math.PI / 4); // 45 degree slant
                ctx.fillRect(-brushSize / 2, -1, brushSize, 2);
                ctx.restore();
            }
        } else if (brushType === BrushType.OIL) {
            // Oil: multi-bristle effect
            for (let i = 0; i < distance; i += 1) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                for (let j = 0; j < 5; j++) {
                    const ox = (Math.random() - 0.5) * brushSize;
                    const oy = (Math.random() - 0.5) * brushSize;
                    ctx.globalAlpha = brushOpacity * 0.4;
                    ctx.beginPath();
                    ctx.arc(ix + ox, iy + oy, Math.random() * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (brushType === BrushType.CRAYON) {
            // Crayon: textured/noisy
            ctx.globalAlpha = brushOpacity * 0.5;
            for (let i = 0; i < distance; i += 0.5) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                for (let j = 0; j < brushSize * 2; j++) {
                    const radius = Math.random() * (brushSize / 2);
                    const theta = Math.random() * Math.PI * 2;
                    const ox = Math.cos(theta) * radius;
                    const oy = Math.sin(theta) * radius;
                    ctx.fillRect(ix + ox, iy + oy, 1, 1);
                }
            }
        } else if (brushType === BrushType.PENCIL) {
            // Pencil: grainy thin line
            ctx.lineWidth = 1;
            ctx.globalAlpha = brushOpacity * 0.8;
            for (let i = 0; i < distance; i += 0.2) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                const ox = (Math.random() - 0.5) * 1.5;
                const oy = (Math.random() - 0.5) * 1.5;
                ctx.fillRect(ix + ox, iy + oy, 1, 1);
            }
        } else if (brushType === BrushType.WATERCOLOR) {
            // Watercolor: soft bleeding edges
            ctx.globalAlpha = brushOpacity * 0.05;
            for (let i = 0; i < distance; i += 2) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, brushSize * 1.5);
                grad.addColorStop(0, brushColor);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(ix, iy, brushSize * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawingLastPos.current = { x, y };
    };
    const handleDrawingMouseUp = () => {
        if (!isDrawing) return;
        setDrawingState({ ...drawingState, isDrawingPath: false });

        if (brushType === BrushType.VECTOR_PENCIL && vectorPoints.length > 2) {
            // Simplify and create SVG Path
            // Basic Midpoint Smoothing
            let d = `M ${vectorPoints[0].x} ${vectorPoints[0].y}`;
            for (let i = 1; i < vectorPoints.length - 1; i++) {
                const p1 = vectorPoints[i];
                const p2 = vectorPoints[i + 1];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                d += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`;
            }
            d += ` L ${vectorPoints[vectorPoints.length - 1].x} ${vectorPoints[vectorPoints.length - 1].y}`;

            if (onVectorDrawingComplete) {
                onVectorDrawingComplete(d, {
                    color: brushColor,
                    width: brushSize,
                    opacity: brushOpacity,
                    cap: 'round',
                    join: 'round'
                });
            }
            // Clear temp canvas
            drawingCanvasRef.current?.getContext('2d')?.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
            setVectorPoints([]);
        } else {
            drawingCanvasRef.current?.getContext('2d')?.closePath();
        }
    };

    const prevIsDrawing = useRef(isDrawing);
    useEffect(() => {
        if (prevIsDrawing.current && !isDrawing && drawingCanvasRef.current && brushType !== BrushType.VECTOR_PENCIL) {
            onDrawingComplete(drawingCanvasRef.current.toDataURL('image/png'));
            drawingCanvasRef.current.getContext('2d')?.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }

        prevIsDrawing.current = isDrawing;
    }, [isDrawing, onDrawingComplete]);

    // Context Menu & Text Editing
    const handleContextMenu = (e: React.MouseEvent, layerId: string) => {
        e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, layerId });
    };
    const handleDropShape = (e: React.DragEvent, layerId: string) => {
        e.preventDefault(); const imageUrl = e.dataTransfer.getData('text/plain');
        if (imageUrl && layerId) onUpdateShapeLayer(layerId, { backgroundImage: imageUrl, color: 'transparent' });
    };
    const handleMouseLeaveLayer = useCallback(() => setHoveredLayerId(null), []);
    const handleSetHoveredLayerId = useCallback((id: string | null) => setHoveredLayerId(id), []);

    const finishEditingText = () => {
        if (editingTextId && editText.trim()) {
            onUpdateTextLayer(editingTextId, { text: editText });
            setEditingTextId(null);
        } else {
            setEditingTextId(null);
        }
    };

    const handleTextDoubleClick = (e: React.MouseEvent, layer: TextLayer) => {
        e.stopPropagation();
        setEditingTextId(layer.id);
        setEditText(layer.text);
    };

    return (
        <div className="flex-1 relative bg-[#13161a] overflow-hidden flex flex-col">
            {/* Top Bar */}
            <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between px-4 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))} className="p-1 hover:bg-gray-700 rounded text-gray-400"><Icons.ZoomOut className="w-4 h-4" /></button>
                    <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => onZoomChange(Math.min(3, zoom + 0.1))} className="p-1 hover:bg-gray-700 rounded text-gray-400"><Icons.ZoomIn className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onToggleGrid} className={`p-1 rounded text-xs flex items-center gap-1 ${showGrid ? 'bg-[#7d2ae8] text-white' : 'text-gray-400 hover:bg-gray-700'}`}><Icons.Grid className="w-3 h-3" /> Grid</button>
                    <div className="h-4 w-px bg-gray-600 mx-2"></div>
                    <span className="text-xs text-gray-500">{canvasSize.width} x {canvasSize.height} px</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="h-12 bg-[#1e1e1e] border-b border-gray-700 flex items-center px-4 z-10 shrink-0 overflow-x-auto no-scrollbar">
                <Toolbar
                    selectedLayer={selectedLayer}
                    uploadedImage={uploadedImage}
                    canvasBackgroundColor={canvasBackgroundColor}
                    onSetCanvasBackgroundColor={onSetCanvasBackgroundColor}
                    canvasFilters={canvasFilters}
                    onUpdateCanvasFilters={onUpdateCanvasFilters}
                    onUpdateTextLayer={onUpdateTextLayer}
                    onUpdateShapeLayer={onUpdateShapeLayer}
                    onUpdateImageLayer={onUpdateImageLayer}
                    onDeleteLayer={onDeleteLayer}
                    onDuplicateLayer={onDuplicateLayer}
                    onMoveLayer={onMoveLayer}
                    onMagicWrite={onMagicWrite}
                    onInteractionStart={onInteractionStart}
                    onRemix={onRemix}
                    onToggleEraser={onToggleEraser}
                    isEraserActive={isDrawing && brushColor.includes('255, 0, 0')}
                    canvasSize={canvasSize}
                    documentColors={documentColors}
                    user={user}
                    onOpenPricing={onOpenPricing}
                    onGroup={onGroup}
                    onUngroup={onUngroup}
                    onToggleDesignSuggestions={onToggleDesignSuggestions}
                    onToggleSmartContent={onToggleSmartContent}
                    onToggleQualityScore={onToggleQualityScore}
                />
            </div>

            {/* Main Workspace with Infinite Canvas Feel */}
            <div
                className={`flex-1 overflow-hidden bg-[#0e1318] relative ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
                onMouseDown={handleMouseDownContainer}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onFileUpload) {
                        onFileUpload(e.dataTransfer.files[0]);
                    }
                }}
            >
                {/* Center the canvas initially, then apply panOffset */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
                >
                    <div
                        ref={containerRef}
                        className="relative shadow-2xl transition-transform duration-75 origin-center bg-white pointer-events-auto"
                        style={{
                            width: canvasSize.width,
                            height: canvasSize.height,
                            transform: `scale(${zoom})`,
                            backgroundColor: canvasBackgroundColor,
                            filter: `brightness(${canvasFilters.brightness}%) contrast(${canvasFilters.contrast}%) saturate(${canvasFilters.saturation}%) sepia(${canvasFilters.sepia}%) grayscale(${canvasFilters.grayscale}%) blur(${canvasFilters.blur}px)`,
                            opacity: canvasFilters.opacity,
                        }}
                    >
                        {/* Rulers */}
                        <Ruler type="horizontal" length={canvasSize.width} zoom={zoom} />
                        <Ruler type="vertical" length={canvasSize.height} zoom={zoom} />

                        {/* Grid Overlay */}
                        {showGrid && <div className="absolute inset-0 pointer-events-none z-[60]" style={{ backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.2 }}></div>}

                        {/* Snap Lines */}
                        {snapLines.vertical !== undefined && (
                            <div className="absolute top-0 bottom-0 w-px bg-cyan-400 z-[100] pointer-events-none shadow-[0_0_4px_rgba(34,211,238,0.8)]" style={{ left: snapLines.vertical }}></div>
                        )}
                        {snapLines.horizontal !== undefined && (
                            <div className="absolute left-0 right-0 h-px bg-cyan-400 z-[100] pointer-events-none shadow-[0_0_4px_rgba(34,211,238,0.8)]" style={{ top: snapLines.horizontal }}></div>
                        )}

                        {/* Background Image */}
                        {bgImage && (
                            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                                <img src={bgImage} className="w-full h-full object-contain" style={{ filter: `opacity(${canvasFilters.opacity})` }} />
                                {canvasFilters.vignette > 0 && <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle, transparent ${100 - canvasFilters.vignette}%, black 150%)` }}></div>}
                                {canvasFilters.overlayTexture && <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50" style={{ backgroundImage: `url(${canvasFilters.overlayTexture})`, backgroundSize: 'cover' }}></div>}
                            </div>
                        )}

                        {/* Layers */}
                        {shapeLayers.map(l => (
                            <ShapeLayerItem key={l.id} layer={getEffectiveLayer(l)} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={handleSetHoveredLayerId} onMouseLeave={handleMouseLeaveLayer} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} onDrop={handleDropShape} />
                        ))}
                        {imageLayers.map(l => (
                            <ImageLayerItem key={l.id} layer={getEffectiveLayer(l)} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={handleSetHoveredLayerId} onMouseLeave={handleMouseLeaveLayer} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} />
                        ))}
                        {textLayers.map(l => (
                            <React.Fragment key={l.id}>
                                {editingTextId === l.id ? (
                                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={finishEditingText} autoFocus className="absolute bg-transparent border-2 border-[#7d2ae8] outline-none resize-none overflow-hidden z-[100]" style={{ left: l.x, top: l.y, width: l.width, minHeight: l.fontSize * 1.5, fontSize: l.fontSize, fontFamily: l.fontFamily, fontWeight: l.fontWeight as any, fontStyle: l.fontStyle, textAlign: l.textAlign, color: l.color, lineHeight: l.lineHeight, transform: `rotate(${l.rotation}deg)` }} />
                                ) : (
                                    <TextLayerItem layer={getEffectiveLayer(l)} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={handleSetHoveredLayerId} onMouseLeave={handleMouseLeaveLayer} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} onDoubleClick={handleTextDoubleClick} isInteracting={!!dragState || !!resizeState || !!rotateState} />
                                )}
                            </React.Fragment>
                        ))}

                        {/* Drawing & Processing Overlays */}
                        <canvas
                            ref={drawingCanvasRef}
                            width={canvasSize.width}
                            height={canvasSize.height}
                            className={`absolute inset-0 z-[100] touch-none ${isDrawing ? 'cursor-crosshair opacity-100' : 'pointer-events-none opacity-0'}`}
                            onMouseDown={handleDrawingMouseDown}
                            onMouseMove={handleDrawingMouseMove}
                            onMouseUp={handleDrawingMouseUp}
                        />
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 z-[200] flex flex-col items-center justify-center backdrop-blur-md animate-fadeIn">
                                <div className="w-16 h-16 relative"><div className="absolute inset-0 rounded-full border-4 border-gray-700"></div><div className="absolute inset-0 rounded-full border-4 border-t-[#7d2ae8] animate-spin"></div></div>
                                <span className="text-white font-bold tracking-wider mt-4 text-sm animate-pulse">AI PROCESSING...</span>
                            </div>
                        )}

                        {/* Zero State / Empty Canvas Helper */}
                        {!bgImage && shapeLayers.length === 0 && imageLayers.length === 0 && textLayers.length === 0 && !isDrawing && !isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 hover:opacity-100 transition-opacity duration-300">
                                <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Icons.Uploads className="w-12 h-12 mb-2 opacity-50" />
                                        <span className="font-bold text-lg text-gray-700">Drag & Drop Image</span>
                                        <span className="text-xs uppercase tracking-widest opacity-60">to start creating</span>
                                    </div>
                                    <div className="w-full h-px bg-gray-300"></div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-gray-500 font-mono">
                                        <div className="flex justify-between w-32"><span>Add Text</span><span className="font-bold text-gray-700">T</span></div>
                                        <div className="flex justify-between w-32"><span>Rectangle</span><span className="font-bold text-gray-700">R</span></div>
                                        <div className="flex justify-between w-32"><span>Circle</span><span className="font-bold text-gray-700">C</span></div>
                                        <div className="flex justify-between w-32"><span>AI Magic</span><span className="font-bold text-gray-700">/</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} layerId={contextMenu.layerId} onClose={() => setContextMenu(null)} onDelete={onDeleteLayer} onDuplicate={onDuplicateLayer} onMoveForward={(id) => onMoveLayer(id, 'forward')} onMoveBackward={(id) => onMoveLayer(id, 'backward')} onLock={(id) => { const l = layers.find(la => la.id === id); if (l && selectedLayerId === id) { if (l.type === 'text') onUpdateTextLayer(id, { locked: !l.locked }); else if (l.type === 'image') onUpdateImageLayer(id, { locked: !l.locked }); else onUpdateShapeLayer(id, { locked: !l.locked }); } }} isLocked={layers.find(l => l.id === contextMenu.layerId)?.locked || false} />
            )}
        </div>
    );
};
