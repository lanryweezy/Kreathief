import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { NavTab, TextLayer, ShapeLayer, ImageLayer, Layer, CanvasFilters, CanvasSize, User, BrushType, GeneratedImage } from '../types';
import { VectorUtils } from '../utils/vectorUtils';
import { unitToPx } from '../utils/unitUtils';
import { Icons } from '../constants';
import { PathEditorOverlay } from './VectorEditor/PathEditorOverlay';
import { ColorPicker } from './ColorPicker';
import { Ruler } from './Ruler';
import { ContextMenu } from './ContextMenu';
import { GeometryOracle } from '../utils/geometryOracle';
import { AnimationSettings } from '../types';
import { GoldenRatioOverlay } from './GoldenRatioOverlay';

const getAnimationStyle = (anim?: AnimationSettings): React.CSSProperties => {
    if (!anim || anim.type === 'none') return {};
    return {
        animationName: anim.type,
        animationDuration: `${anim.duration}s`,
        animationDelay: `${anim.delay}s`,
        animationTimingFunction: anim.easing,
        animationIterationCount: anim.iterationCount === 'infinite' ? 'infinite' : anim.iterationCount,
        animationFillMode: 'both',
    };
};

const getLayerClipPath = (layer: Layer): string | undefined => {
    switch (layer.type) {
        case 'triangle': return 'polygon(50% 0%, 0% 100%, 100% 100%)';
        case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        case 'hexagon': return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        case 'arrow': return 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)';
        case 'heart': return 'polygon(50% 85%, 15% 50%, 15% 25%, 30% 10%, 50% 25%, 70% 10%, 85% 25%, 85% 50%)';
        case 'speech_bubble': return 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)';
        case 'shield': return 'polygon(50% 0, 100% 10%, 100% 80%, 50% 100%, 0 80%, 0 10%)';
        case 'ribbon': return 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%, 10% 50%)';
        case 'banner': return 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)';
        case 'pentagon': return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
        case 'octagon': return 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
        case 'plus': return 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)';
        case 'star_4': return 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)';
        case 'star_8': return 'polygon(50% 0%, 61% 22%, 85% 15%, 72% 35%, 100% 50%, 72% 65%, 85% 85%, 61% 72%, 50% 100%, 39% 72%, 15% 85%, 28% 65%, 0% 50%, 28% 35%, 15% 15%, 39% 22%)';
        case 'path':
            if ((layer as any).pathData) {
                return `path('${(layer as any).pathData}')`;
            }
            return undefined;
        default: return undefined;
    }
};

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
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 pointer-events-auto group/rotate z-50">
                        <div className="w-px h-6 bg-[#7d2ae8]"></div>
                        <div
                            onMouseDown={(e) => onRotate(e, layer)}
                            className="w-7 h-7 bg-white border-2 border-[#7d2ae8] rounded-full cursor-grab flex items-center justify-center hover:bg-[#7d2ae8] hover:text-white shadow-lg transition-all active:cursor-grabbing hover:scale-110"
                            title="Rotate"
                        >
                            <Icons.RotateCw className="w-3.5 h-3.5 text-[#7d2ae8] group-hover/rotate:text-white" />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

// This is a placeholder for a multi-selection SelectionHandles component.
// The original SelectionHandles component is designed for a single layer.
// If multi-selection handles are truly needed, a new component or a significant
// refactor of the existing one would be required to handle an array of layers.
// For now, this will be a basic bounding box around multiple selected layers.
interface MultiSelectionHandlesProps {
    layers: Layer[];
    zoom: number;
    onResize: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
    onRotate: (e: React.MouseEvent, layer: Layer) => void;
}

const MultiSelectionHandles = React.memo(({ layers, zoom, onResize, onRotate }: MultiSelectionHandlesProps) => {
    if (layers.length === 0) return null;

    // Calculate bounding box for all selected layers using centralized logic
    const bounds = useMemo(() => GeometryOracle.getGroupBounds(layers), [layers]);

    // Create a proxy layer representing the group for the handles
    // We intentionally ignore rotation for AABB-based group resizing for now
    const groupLayer: Layer = {
        id: 'group_proxy',
        type: 'rectangle', // Dummy type
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        cornerRadius: 0,
        color: 'transparent'
    } as any;

    return (
        <div id="multi-selection-box" className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
            {/* Visual Bounding Box */}
            <div
                className="absolute border-2 border-[#7d2ae8] border-dashed"
                style={{
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    pointerEvents: 'none'
                }}
            />

            {/* Reuse SelectionHandles UI logic manually for the group */}
            <div className="absolute" style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }}>
                {/* Corner Handles */}
                <div onMouseDown={(e) => onResize(e, groupLayer, 'nw')} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-nw-resize shadow-md z-50"></div>
                <div onMouseDown={(e) => onResize(e, groupLayer, 'ne')} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-ne-resize shadow-md z-50"></div>
                <div onMouseDown={(e) => onResize(e, groupLayer, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-sw-resize shadow-md z-50"></div>
                <div onMouseDown={(e) => onResize(e, groupLayer, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#7d2ae8] rounded-full pointer-events-auto cursor-se-resize shadow-md z-50"></div>

                {/* Edge Handles */}
                {bounds.width > 30 && (
                    <>
                        <div onMouseDown={(e) => onResize(e, groupLayer, 'n')} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#7d2ae8] rounded-full pointer-events-auto cursor-ns-resize shadow-sm z-40"></div>
                        <div onMouseDown={(e) => onResize(e, groupLayer, 's')} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white border border-[#7d2ae8] rounded-full pointer-events-auto cursor-ns-resize shadow-sm z-40"></div>
                    </>
                )}
                {/* Rotate Handle for Multi-Selection */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 pointer-events-auto group/rotate z-50">
                    <div className="w-px h-6 bg-[#7d2ae8]"></div>
                    <div
                        onMouseDown={(e) => onRotate(e, groupLayer)}
                        className="w-7 h-7 bg-white border-2 border-[#7d2ae8] rounded-full cursor-grab flex items-center justify-center hover:bg-[#7d2ae8] hover:text-white shadow-lg transition-all active:cursor-grabbing hover:scale-110"
                        title="Rotate Selection"
                    >
                        <Icons.RotateCw className="w-3.5 h-3.5 text-[#7d2ae8] group-hover/rotate:text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
});


const ImageLayerItem = React.memo(React.forwardRef<HTMLDivElement, any>(({ layer, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onResize, onRotate, onContextMenu, previewAnimation, ...props }, ref) => {
    const scaleX = layer.flipX ? -1 : 1;
    const scaleY = layer.flipY ? -1 : 1;
    const animStyle = getAnimationStyle((isSelected && previewAnimation) ? previewAnimation : layer.animation);

    return (
        <div
            ref={ref}
            onMouseDown={(e) => onMouseDown(e, layer)}
            onMouseEnter={() => onMouseEnter(layer.id)}
            onMouseLeave={() => onMouseLeave(null)}
            onContextMenu={(e) => onContextMenu(e, layer.id)}
            className="absolute cursor-move group"
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

            {/* Masking Logic */}
            <div className="w-full h-full overflow-hidden" style={{
                borderRadius: `${layer.cornerRadius || 0}px`,
                ...animStyle,
                ...(props.maskPath ? { clipPath: props.maskPath } : {})
            }}>
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
}));

const ShapeLayerItem = React.memo(React.forwardRef<HTMLDivElement, any>((props, ref) => {
    const { layer, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onResize, onRotate, onContextMenu, onDrop, previewAnimation, editingPathId, onDoubleClick, onUpdatePath, zoom } = props;

    // Debug logging for properties

    const isEditing = layer.id === editingPathId;

    const clipPath = getLayerClipPath(layer);


    return (
        <div
            ref={ref}
            onMouseDown={(e) => onMouseDown(e, layer)}
            onMouseEnter={() => onMouseEnter(layer.id)}
            onMouseLeave={() => onMouseLeave(null)}
            onContextMenu={(e) => onContextMenu(e, layer.id)}
            onDoubleClick={(e) => onDoubleClick && onDoubleClick(layer)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, layer.id)}
            className="absolute cursor-move group"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `${layer.perspective ? `perspective(${layer.perspective}px)` : ''} rotateX(${layer.rotateX || 0}deg) rotateY(${layer.rotateY || 0}deg) rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                opacity: layer.opacity,
                mixBlendMode: layer.blendMode as any,
                willChange: 'transform',
                zIndex: isSelected ? 100 : (isHovered ? 99 : 1),
                overflow: 'visible' // Ensure handles are visible outside bounds
            }}
        >
            {/* Visual Hover Feedback - Larger inset to avoid conflicting with handles */}
            {isHovered && !isSelected && !layer.locked && !isEditing && (
                <div className="absolute -inset-2 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
            )}

            {/* Content Container with Clipping and Effects */}
            <div className="w-full h-full relative" style={{
                ...getAnimationStyle((isSelected && previewAnimation) ? previewAnimation : layer.animation),
                backgroundColor: layer.params?.gradient ? 'transparent' : (layer.type === 'path' ? 'transparent' : layer.color),
                backgroundImage: layer.params?.gradient ? `linear-gradient(${layer.params.gradient.angle}deg, ${layer.params.gradient.startColor}, ${layer.params.gradient.endColor})` : (layer.backgroundImage ? `url(${layer.backgroundImage})` : 'none'),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: layer.shadow && layer.type !== 'path' ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}` : 'none',
                borderRadius: (layer.type !== 'path' && layer.type !== 'arrow') ? `${layer.cornerRadius}px` : undefined,
                clipPath: layer.type === 'path' ? undefined : clipPath,
                filter: layer.filters ? `
                    brightness(${layer.filters.brightness}%) 
                    contrast(${layer.filters.contrast}%) 
                    saturate(${layer.filters.saturation}%) 
                    grayscale(${layer.filters.grayscale}%) 
                    blur(${layer.filters.blur}px) 
                    sepia(${layer.filters.sepia}%) 
                    hue-rotate(${layer.filters.hueRotate}deg)
                    ${layer.shadow && layer.type === 'path' ? `drop-shadow(${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color})` : ''}
                ` : 'none',
                opacity: layer.opacity,
                ...(props.maskPath ? { clipPath: props.maskPath } : {})
            }}>
                {/* SVG Path Rendering (for 'path' type or vectorPath property) */}
                {(layer.type === 'path' || layer.vectorPath) && (
                    <svg width="100%" height="100%" viewBox={layer.viewBox || `0 0 ${layer.width} ${layer.height}`} preserveAspectRatio="none" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                        {/* If there's a background image, we can use a mask or just clip-path. 
                             For simplicity and wide support, we'll keep the background image on the div 
                             and use clip-path if it's the 'path' type, but CSS clip-path (path('...')) is complex for raw SVG data.
                             Instead, if we have an image, we use an SVG pattern or mask.
                         */}
                        <defs>
                            {layer.backgroundImage && (
                                <pattern id={`pattern-${layer.id}`} patternUnits="userSpaceOnUse" width="100%" height="100%">
                                    <image href={layer.backgroundImage} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
                                </pattern>
                            )}
                        </defs>
                        <path
                            d={layer.pathData || (layer.vectorPath ? VectorUtils.serializePath(layer.vectorPath) : '')}
                            fill={layer.backgroundImage ? `url(#pattern-${layer.id})` : (layer.color || '#7d2ae8')}
                            fillOpacity={layer.opacity}
                            stroke={layer.stroke?.color}
                            strokeWidth={layer.stroke?.width}
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                )}
            </div>

            {/* Path Editing Overlay */}
            {isEditing && layer.vectorPath && (
                <PathEditorOverlay
                    path={layer.vectorPath}
                    zoom={zoom}
                    onUpdate={onUpdatePath}
                    onSelectPoint={() => { }}
                    selectedPointIndices={[]}
                />
            )}

            {/* Selection Handles - OUTSIDE the content container to prevent clipping */}
            {isSelected && !isEditing && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
    );
}));

// Helper for rendering text along a path
const renderTextOnPath = (canvas: HTMLCanvasElement, layer: TextLayer) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !layer.textPath) return;

    const { text, color, fontSize, fontFamily, fontWeight, fontStyle, width } = layer;
    const dpr = 2; // High DPI

    canvas.width = width * dpr;
    canvas.height = (width) * dpr; // Square aspect for paths usually
    ctx.scale(dpr, dpr);
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const pathMetrics = GeometryOracle.measurePath(layer.textPath);
    const textWidth = ctx.measureText(text).width;

    // Center text on path
    const startOffset = (pathMetrics.totalLength - textWidth) / 2;

    let currentDistance = startOffset;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charWidth = ctx.measureText(char).width;

        // Position at center of character
        const charMiddleDistance = currentDistance + charWidth / 2;

        if (charMiddleDistance >= 0 && charMiddleDistance <= pathMetrics.totalLength) {
            const { x, y, angle } = pathMetrics.getPointAt(charMiddleDistance);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }

        currentDistance += charWidth;
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
    const align = textAlign === 'justify' ? 'left' : textAlign;
    tempCtx.textAlign = align as CanvasTextAlign;

    if (layer.shadow) {
        tempCtx.shadowColor = layer.shadow.color;
        tempCtx.shadowBlur = layer.shadow.blur;
        tempCtx.shadowOffsetX = layer.shadow.offsetX;
        tempCtx.shadowOffsetY = layer.shadow.offsetY;
    }

    if (layer.stroke) {
        tempCtx.strokeStyle = layer.stroke.color;
        tempCtx.lineWidth = layer.stroke.width;
        tempCtx.lineJoin = 'round';
    }

    lines.forEach((line, i) => {
        let x = 0;
        if (textAlign === 'center') x = width / 2;
        if (textAlign === 'right') x = width;

        if (layer.stroke) {
            tempCtx.strokeText(line, x, i * totalLineHeight);
        }
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

const TextLayerItem = React.memo(React.forwardRef<HTMLDivElement, any>(({ layer, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onResize, onRotate, onContextMenu, onDoubleClick, isInteracting, previewAnimation, ...props }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isInteracting) return;
        if (layer.textPath && canvasRef.current) {
            renderTextOnPath(canvasRef.current, layer);
        } else if (layer.warpStyle && layer.warpStyle !== 'none' && canvasRef.current) {
            renderWarpedText(canvasRef.current, layer);
        }
    }, [layer.text, layer.color, layer.fontSize, layer.fontFamily, layer.fontWeight, layer.fontStyle, layer.warpStyle, layer.curve, layer.width, layer.lineHeight, layer.textAlign, layer.textPath, isInteracting]);

    const textStyle: React.CSSProperties = {
        fontFamily: layer.fontFamily,
        fontSize: `${layer.fontSize}px`,
        fontWeight: layer.fontWeight,
        fontStyle: layer.fontStyle,
        color: (layer.gradient && layer.gradient.enabled) ? 'transparent' : layer.color,
        textAlign: layer.textAlign,
        letterSpacing: `${layer.letterSpacing}px`,
        lineHeight: layer.lineHeight,
        textDecoration: layer.textDecoration,
        textTransform: layer.textTransform,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundImage: (layer.gradient && layer.gradient.enabled) ? `linear-gradient(${layer.gradient.angle}deg, ${layer.gradient.startColor}, ${layer.gradient.endColor})` : 'none',
        WebkitBackgroundClip: (layer.gradient && layer.gradient.enabled) ? 'text' : 'unset',
        display: 'block',
        ...(layer.shadow ? { textShadow: `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}` } : {}),
        position: 'relative',
        zIndex: 1,
    };

    const render3DDepth = () => {
        if (!layer.depth || layer.depth <= 0) return null;
        const depthElements = [];
        for (let i = 1; i <= layer.depth; i++) {
            depthElements.push(
                <div key={i} style={{
                    ...textStyle,
                    color: layer.depthColor || '#333333',
                    position: 'absolute',
                    top: `${i}px`,
                    left: `${i}px`,
                    zIndex: 0,
                    textShadow: 'none',
                    backgroundImage: 'none',
                    WebkitBackgroundClip: 'unset',
                    pointerEvents: 'none',
                }}>
                    {layer.text}
                </div>
            );
        }
        return depthElements;
    };

    if ((layer.warpStyle && layer.warpStyle !== 'none') || layer.textPath) {
        return (
            <div
                ref={ref}
                onMouseDown={(e) => onMouseDown(e, layer)}
                onMouseEnter={() => onMouseEnter(layer.id)}
                onMouseLeave={() => onMouseLeave(null)}
                onContextMenu={(e) => onContextMenu(e, layer.id)}
                onDoubleClick={(e) => onDoubleClick(e, layer)}
                className="absolute cursor-move group"
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

                <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', ...getAnimationStyle((isSelected && previewAnimation) ? previewAnimation : layer.animation), ...(props.maskPath ? { clipPath: props.maskPath } : {}) }} />
                {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            onMouseDown={(e) => onMouseDown(e, layer)}
            onMouseEnter={() => onMouseEnter(layer.id)}
            onMouseLeave={() => onMouseLeave(null)}
            onContextMenu={(e) => onContextMenu(e, layer.id)}
            onDoubleClick={(e) => onDoubleClick(e, layer)}
            className="absolute cursor-move group"
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

            <div style={{
                ...textStyle,
                ...getAnimationStyle((isSelected && previewAnimation) ? previewAnimation : layer.animation),
                ...(props.maskPath ? { clipPath: props.maskPath } : {})
            }}>{layer.text}</div>
            {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
    );
}));

interface CanvasProps {
    zoom: number;
    onZoomChange: (z: number) => void;
    documentColors?: string[];
    user: User;
    onOpenPricing: () => void;
    onFileUpload?: (files: File[]) => void;
    previewAnimation?: AnimationSettings | null;
    onAddLogoToCanvas: (url: string) => void;
    onDoubleClickLayer?: (layer: Layer) => void;
    activeImage?: GeneratedImage;
    uploadedImage?: string | null;
    onToggleDesignSuggestions?: () => void;
    onToggleSmartContent?: () => void;
    onToggleQualityScore?: () => void;
    onInteractionStart?: () => void;
    onUpdateTextLayerProp?: (id: string, changes: Partial<TextLayer>) => void;
    onUpdateShapeLayerProp?: (id: string, changes: Partial<ShapeLayer>) => void;
    onUpdateImageLayerProp?: (id: string, changes: Partial<ImageLayer>) => void;
}

const CanvasComponent: React.FC<CanvasProps> = ({
    zoom,
    onZoomChange,
    documentColors,
    user,
    onOpenPricing,
    onFileUpload,
    previewAnimation,
    onAddLogoToCanvas,
    onDoubleClickLayer,
    activeImage,
    uploadedImage,
    onToggleDesignSuggestions,
    onToggleSmartContent,
    onToggleQualityScore,
    onInteractionStart,
    onUpdateTextLayerProp,
    onUpdateShapeLayerProp,
    onUpdateImageLayerProp
}) => {
    const {
        isProcessing,
        canvasBackgroundColor,
        setCanvasBackgroundColor: onSetCanvasBackgroundColor,
        canvasFilters,
        setCanvasFilters: onUpdateCanvasFilters,
        layers,
        updateLayers: onUpdateLayers,
        selectLayer: onSelectLayer,
        multiSelectLayer: onMultiSelectLayer,
        deleteLayer: onDeleteLayer,
        duplicateLayer: onDuplicateLayer,
        moveLayer: onMoveLayer,
        selectedLayerIds,
        showGrid,
        setShowGrid: onToggleGrid,
        showRulers,
        setShowRulers: onToggleRulers,
        isPenMode: isDrawing,
        brushColor,
        brushSize,
        brushOpacity,
        brushType = BrushType.BASIC,
        handleDrawingComplete: onDrawingComplete,
        handleVectorDrawingComplete: onVectorDrawingComplete,
        canvasSize,
        setCanvasSize: onSetCanvasSize,
        groupSelected: onGroup,
        ungroupSelected: onUngroup,
        toggleEraser: onToggleEraser,
        addLayer: onAddLayer,
        editingPathId,
        updateLayer: onUpdatePath, // or specialized path update
        unit,
        showGoldenRatio
    } = useStore();


    // Moved up to avoid ReferenceError in getEffectiveLayer
    const bulkDragPreviewManualRef = useRef<Record<string, { x: number, y: number }>>({});
    const dragPreviewRef = useRef<{ id: string, x: number, y: number, width?: number, height?: number, rotation?: number } | null>(null);

    const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;
    // Shared derived slices for legacy code within Canvas
    const textLayers = useMemo(() => layers.filter((l: Layer) => l.type === 'text') as TextLayer[], [layers]);
    const shapeLayers = useMemo(() => layers.filter((l: Layer) => l.type !== 'text' && l.type !== 'image') as ShapeLayer[], [layers]);
    const imageLayers = useMemo(() => layers.filter((l: Layer) => l.type === 'image') as ImageLayer[], [layers]);

    // Provided update handlers or fallback to onUpdateLayers
    const onUpdateTextLayer = useCallback((id: string, changes: Partial<TextLayer>) => {
        if (onUpdateTextLayerProp) onUpdateTextLayerProp(id, changes);
        else onUpdateLayers?.({ [id]: changes });
    }, [onUpdateTextLayerProp, onUpdateLayers]);

    const onUpdateShapeLayer = useCallback((id: string, changes: Partial<ShapeLayer>) => {
        if (onUpdateShapeLayerProp) onUpdateShapeLayerProp(id, changes);
        else onUpdateLayers?.({ [id]: changes });
    }, [onUpdateShapeLayerProp, onUpdateLayers]);

    const onUpdateImageLayer = useCallback((id: string, changes: Partial<ImageLayer>) => {
        if (onUpdateImageLayerProp) onUpdateImageLayerProp(id, changes);
        else onUpdateLayers?.({ [id]: changes });
    }, [onUpdateImageLayerProp, onUpdateLayers]);

    // Pre-compute effective layers
    const getEffectiveLayer = useCallback(<T extends Layer>(layer: T): T => {
        if (bulkDragPreviewManualRef.current[layer.id]) {
            return { ...layer, ...bulkDragPreviewManualRef.current[layer.id] };
        }
        if (dragPreviewRef.current && dragPreviewRef.current.id === layer.id) {
            return { ...layer, ...dragPreviewRef.current };
        }
        return layer;
    }, []);

    const effectiveLayers = useMemo(() => layers.map((l: Layer) => getEffectiveLayer(l)), [layers, getEffectiveLayer]);
    const effectiveTextLayers = useMemo(() => effectiveLayers.filter((l: Layer) => l.type === 'text') as TextLayer[], [effectiveLayers]);
    const effectiveShapeLayers = useMemo(() => effectiveLayers.filter((l: Layer) => l.type !== 'text' && l.type !== 'image') as ShapeLayer[], [effectiveLayers]);
    const effectiveImageLayers = useMemo(() => effectiveLayers.filter((l: Layer) => l.type === 'image') as ImageLayer[], [effectiveLayers]);
    const containerRef = useRef<HTMLDivElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

    // Interaction State
    const [dragState, setDragState] = useState<{ isDragging: boolean, startX: number, startY: number, initialPositions: Record<string, { x: number, y: number }> } | null>(null);
    const [resizeState, setResizeState] = useState<{ isResizing: boolean, handle: ResizeHandle, startX: number, startY: number, initialLayer?: Layer, initialBounds?: { x: number, y: number, width: number, height: number }, initialLayers?: Record<string, Layer> } | null>(null);
    const [rotateState, setRotateState] = useState<{ isRotating: boolean, startX: number, startY: number, initialRotation: number, centerX: number, centerY: number, canvasCenterX?: number, canvasCenterY?: number, initialLayers?: Record<string, Layer> } | null>(null);


    const [drawingState, setDrawingState] = useState({ isDrawingPath: false });
    const drawingLastPos = useRef({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, layerId: string } | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Pro Features: Pan & Snap
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const panOffsetRef = useRef(panOffset);
    panOffsetRef.current = panOffset;
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [snapLines, setSnapLines] = useState<{ vertical?: number, horizontal?: number }>({});
    const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Performance Refs
    const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const panContainerRef = useRef<HTMLDivElement>(null);
    const snapVerticalRef = useRef<HTMLDivElement>(null);
    const snapHorizontalRef = useRef<HTMLDivElement>(null);
    // Track current preview values without state to avoid re-renders during drag


    // Use ResizeObserver for stable viewport measurements
    useEffect(() => {
        if (!viewportRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setViewportSize({ width, height });
            }
        });
        observer.observe(viewportRef.current);
        return () => observer.disconnect();
    }, []);

    // Block Safari gesture events for the canvas viewport
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const handleGesture = (e: any) => e.preventDefault();
        viewport.addEventListener('gesturestart', handleGesture);
        viewport.addEventListener('gesturechange', handleGesture);
        return () => {
            viewport.removeEventListener('gesturestart', handleGesture);
            viewport.removeEventListener('gesturechange', handleGesture);
        };
    }, []);
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;

    // Trackpad Pinch-to-Zoom and Pan
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                // Pinch-to-zoom
                e.preventDefault();
                const zoomFactor = 0.01;
                const newZoom = Math.min(3, Math.max(0.1, zoomRef.current - e.deltaY * zoomFactor));
                onZoomChange(newZoom);
            } else if (!isSpacePressed) {
                // Natural Panning (if not drawing)
                if (isDrawing) return;
                e.preventDefault();
                setPanOffset(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        };

        viewport.addEventListener('wheel', handleWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', handleWheel);
    }, [onZoomChange, isSpacePressed, isDrawing]);

    const [dragPreview, setDragPreview] = useState<{ id: string, x: number, y: number, width?: number, height?: number, rotation?: number } | null>(null);
    const [bulkDragPreview, setBulkDragPreview] = useState<Record<string, { x: number, y: number }>>({});

    const selectedLayer = layers.find((l: Layer) => l.id === selectedLayerId) || null;
    const bgImage = activeImage?.url || uploadedImage;

    const isMultiSelect = selectedLayerIds.length > 1;

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
    const bulkDragPreviewRef = useRef(bulkDragPreview);
    bulkDragPreviewRef.current = bulkDragPreview;
    // dragPreviewRef declared at top
    dragPreviewRef.current = dragPreview;
    const isSpacePressedRef = useRef(isSpacePressed);
    isSpacePressedRef.current = isSpacePressed;
    const isDrawingRef = useRef(isDrawing);
    isDrawingRef.current = isDrawing;
    const onSelectLayerRef = useRef(onSelectLayer);
    onSelectLayerRef.current = onSelectLayer;
    const onInteractionStartRef = useRef(onInteractionStart);
    onInteractionStartRef.current = onInteractionStart;
    const onMultiSelectLayerRef = useRef(onMultiSelectLayer);
    onMultiSelectLayerRef.current = onMultiSelectLayer;



    const getSnapLines = useCallback((currentLayer: Layer, currentX: number, currentY: number) => {
        const SNAP_THRESHOLD = 5 / zoomRef.current;
        const layerWidth = currentLayer.width;
        let layerHeight = (currentLayer as any).height || 0;
        let currentAscent = 0;

        if (currentLayer.type === 'text') {
            // For text, height might not be fully accurate from prop, measure it or trust it?
            // Trust prop if updated, but for baseline we need metric
            const metric = GeometryOracle.measureText(currentLayer as TextLayer);
            // layerHeight = metric.height; // Optionally use metric height
            currentAscent = metric.ascent;
        }

        const centerY = currentY + layerHeight / 2;
        const centerX = currentX + layerWidth / 2;

        let snapX: number | undefined = undefined;
        let snapY: number | undefined = undefined;
        let newX = currentX;
        let newY = currentY;

        // Snap to Canvas Center
        const canvasCenterX = canvasSize.width / 2;
        const canvasCenterY = canvasSize.height / 2;

        if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) {
            snapX = canvasCenterX;
            newX = canvasCenterX - layerWidth / 2;
        }
        if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) {
            snapY = canvasCenterY;
            newY = canvasCenterY - layerHeight / 2;
        }

        // Snap to Canvas Edges
        if (Math.abs(currentX) < SNAP_THRESHOLD) {
            snapX = 0;
            newX = 0;
        }
        if (Math.abs(currentX + layerWidth - canvasSize.width) < SNAP_THRESHOLD) {
            snapX = canvasSize.width;
            newX = canvasSize.width - layerWidth;
        }
        if (Math.abs(currentY) < SNAP_THRESHOLD) {
            snapY = 0;
            newY = 0;
        }
        if (Math.abs(currentY + layerHeight - canvasSize.height) < SNAP_THRESHOLD) {
            snapY = canvasSize.height;
            newY = canvasSize.height - layerHeight;
        }

        // Snap to Canvas Thirds (Rule of Thirds)
        const thirdX1 = canvasSize.width / 3;
        const thirdX2 = (canvasSize.width * 2) / 3;
        const thirdY1 = canvasSize.height / 3;
        const thirdY2 = (canvasSize.height * 2) / 3;

        if (snapX === undefined) {
            if (Math.abs(centerX - thirdX1) < SNAP_THRESHOLD) { snapX = thirdX1; newX = thirdX1 - layerWidth / 2; }
            else if (Math.abs(centerX - thirdX2) < SNAP_THRESHOLD) { snapX = thirdX2; newX = thirdX2 - layerWidth / 2; }
        }
        if (snapY === undefined) {
            if (Math.abs(centerY - thirdY1) < SNAP_THRESHOLD) { snapY = thirdY1; newY = thirdY1 - layerHeight / 2; }
            else if (Math.abs(centerY - thirdY2) < SNAP_THRESHOLD) { snapY = thirdY2; newY = thirdY2 - layerHeight / 2; }
        }

        // Snap to Margin Guides (20px from edges)
        const MARGIN = 20;
        if (snapX === undefined) {
            if (Math.abs(currentX - MARGIN) < SNAP_THRESHOLD) { snapX = MARGIN; newX = MARGIN; }
            else if (Math.abs(currentX + layerWidth - (canvasSize.width - MARGIN)) < SNAP_THRESHOLD) { snapX = canvasSize.width - MARGIN; newX = canvasSize.width - MARGIN - layerWidth; }
        }
        if (snapY === undefined) {
            if (Math.abs(currentY - MARGIN) < SNAP_THRESHOLD) { snapY = MARGIN; newY = MARGIN; }
            else if (Math.abs(currentY + layerHeight - (canvasSize.height - MARGIN)) < SNAP_THRESHOLD) { snapY = canvasSize.height - MARGIN; newY = canvasSize.height - MARGIN - layerHeight; }
        }

        // Snap to Other Layers
        const otherLayers = [...effectiveShapeLayers, ...effectiveImageLayers, ...effectiveTextLayers].filter(l => l.id !== currentLayer.id);

        for (const other of otherLayers) {
            const otherHeight = (other as any).height || 0;
            const otherCenterY = other.y + otherHeight / 2;
            const otherCenterX = other.x + other.width / 2;

            // X snapping (edges and centers)
            if (Math.abs(currentX - other.x) < SNAP_THRESHOLD) { snapX = other.x; newX = other.x; }
            else if (Math.abs(currentX + layerWidth - (other.x + other.width)) < SNAP_THRESHOLD) { snapX = other.x + other.width; newX = other.x + other.width - layerWidth; }
            else if (Math.abs(centerX - otherCenterX) < SNAP_THRESHOLD) { snapX = otherCenterX; newX = otherCenterX - layerWidth / 2; }
            else if (Math.abs(currentX - (other.x + other.width)) < SNAP_THRESHOLD) { snapX = other.x + other.width; newX = other.x + other.width; } // Left to Right
            else if (Math.abs(currentX + layerWidth - other.x) < SNAP_THRESHOLD) { snapX = other.x; newX = other.x - layerWidth; } // Right to Left


            // Y snapping (edges, centers, baselines)
            if (Math.abs(currentY - other.y) < SNAP_THRESHOLD) { snapY = other.y; newY = other.y; }
            else if (Math.abs(currentY + layerHeight - (other.y + otherHeight)) < SNAP_THRESHOLD) { snapY = other.y + otherHeight; newY = other.y + otherHeight - layerHeight; }
            else if (Math.abs(centerY - otherCenterY) < SNAP_THRESHOLD) { snapY = otherCenterY; newY = otherCenterY - layerHeight / 2; }
            else if (Math.abs(currentY - (other.y + otherHeight)) < SNAP_THRESHOLD) { snapY = other.y + otherHeight; newY = other.y + otherHeight; } // Top to Bottom
            else if (Math.abs(currentY + layerHeight - other.y) < SNAP_THRESHOLD) { snapY = other.y; newY = other.y - layerHeight; } // Bottom to Top

            // Baseline Snapping (Text Only)
            if (currentLayer.type === 'text' && other.type === 'text') {
                const otherMetric = GeometryOracle.measureText(other as TextLayer);
                const otherBaseline = other.y + otherMetric.ascent;
                const currentBaseline = currentY + currentAscent;

                if (Math.abs(currentBaseline - otherBaseline) < SNAP_THRESHOLD) {
                    snapY = otherBaseline;
                    newY = otherBaseline - currentAscent;
                }
            }

            if (snapX !== undefined || snapY !== undefined) break; // Priority snapping (first found wins for now)
        }

        return { snapX, snapY, newX, newY };
    }, [canvasSize.width, canvasSize.height, effectiveShapeLayers, effectiveImageLayers, effectiveTextLayers]);

    // -- Global Space Key for Panning --
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !editingTextId) {
                setIsSpacePressed(true);
            }

            // Don't capture shortcuts while editing text
            if (editingTextId) return;

            const isCtrl = e.ctrlKey || e.metaKey;

            // Ctrl+G: Group selected layers
            if (isCtrl && e.key === 'g' && !e.shiftKey) {
                e.preventDefault();
                if (onGroup && selectedLayerIds.length > 1) onGroup();
            }
            // Ctrl+Shift+G: Ungroup
            if (isCtrl && e.key === 'g' && e.shiftKey) {
                e.preventDefault();
                if (onUngroup) onUngroup();
            }
            // Delete or Backspace: Delete selected layer(s)
            // Delete or Backspace: Delete selected layer(s)
            if ((e.key === 'Delete' || e.key === 'Backspace') && !isDrawing) {
                if (selectedLayerId && onDeleteLayer) {
                    onDeleteLayer(selectedLayerId);
                }
            }

            // Ctrl+D: Duplicate selected
            if (isCtrl && e.key === 'd') {
                e.preventDefault();
                if (selectedLayerId && onDuplicateLayer) {
                    onDuplicateLayer(selectedLayerId);
                }
            }

            // Ctrl+L: Lock/Mask (Mask to previous layer)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                if (selectedLayerId) {
                    const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
                    if (layerIndex > 0) {
                        useStore.getState().applyMask(selectedLayerId, layers[layerIndex - 1].id);
                    }
                }
            }

            // Ctrl+A: Select All (defers to multi-select of all layers)
            if (isCtrl && e.key === 'a') {
                e.preventDefault();
                if (onMultiSelectLayer && layers.length > 0) {
                    // We need to implement select all logic. 
                    // If multiSelectLayer adds to selection, we can just loop.
                    // But usually we want to clear and select all. 
                    // For now, let's just loop.
                    layers.forEach((l: Layer) => onMultiSelectLayer(l.id, true));
                }
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
    }, [editingTextId, selectedLayerId, selectedLayerIds, onGroup, onUngroup, onDeleteLayer, onDuplicateLayer, layers, onMultiSelectLayer]);

    // -- Mouse Handlers --

    const handleMouseDownContainer = useCallback((e: React.MouseEvent) => {
        if (isSpacePressedRef.current) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        } else {
            onSelectLayerRef.current(null);
            setEditingTextId(null);
        }
    }, []);

    const handleMouseDownLayer = useCallback((e: React.MouseEvent, layer: Layer) => {
        if (isSpacePressedRef.current || isDrawingRef.current || layer.locked) return;
        e.stopPropagation();

        if (e.shiftKey && onMultiSelectLayerRef.current) {
            onMultiSelectLayerRef.current(layer.id, true);
        } else {
            onSelectLayerRef.current(layer.id);
        }

        // saveToHistory now schedules itself asynchronously with requestIdleCallback
        onInteractionStartRef.current?.();

        // Capture initial positions for all selected layers
        const currentSelectedLayerIds = selectedLayerIdsRef.current;
        const currentLayers = layersRef.current;
        const initialPositions: Record<string, { x: number, y: number }> = {};
        const idsToMove = (e.shiftKey || (currentSelectedLayerIds && currentSelectedLayerIds.includes(layer.id))) && currentSelectedLayerIds ? [...new Set([...currentSelectedLayerIds, layer.id])] : [layer.id];

        currentLayers.forEach((l: Layer) => {
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
    }, []);

    const handleResizeStart = useCallback((e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => {
        e.stopPropagation();
        onInteractionStartRef.current?.();

        const currentSelectedLayerIds = selectedLayerIdsRef.current;
        const currentLayers = layersRef.current;

        if (currentSelectedLayerIds && currentSelectedLayerIds.length > 1) {
            // Multi-selection resize
            const selectedLayers = currentLayers.filter((l: Layer) => currentSelectedLayerIds.includes(l.id));
            const bounds = GeometryOracle.getGroupBounds(selectedLayers);
            const initialLayers: Record<string, Layer> = {};
            selectedLayers.forEach((l: Layer) => initialLayers[l.id] = { ...l });

            setResizeState({
                isResizing: true,
                handle,
                startX: e.clientX,
                startY: e.clientY,
                initialBounds: bounds,
                initialLayers
            });
        } else {
            // Single layer resize
            setResizeState({ isResizing: true, handle, startX: e.clientX, startY: e.clientY, initialLayer: { ...layer } });
        }
    }, []);

    const handleRotateStart = useCallback((e: React.MouseEvent, layer: Layer) => {
        e.stopPropagation();
        onInteractionStartRef.current?.();

        const currentSelectedLayerIds = selectedLayerIdsRef.current;
        const currentLayers = layersRef.current;
        const currentZoom = zoomRef.current;

        if (currentSelectedLayerIds && currentSelectedLayerIds.length > 1) {
            const selectedLayers = currentLayers.filter((l: Layer) => currentSelectedLayerIds.includes(l.id));
            const bounds = GeometryOracle.getGroupBounds(selectedLayers);
            const canvasCenterX = bounds.x + bounds.width / 2;
            const canvasCenterY = bounds.y + bounds.height / 2;

            // Get Screen Space Center from DOM for accurate mouse angle delta
            const selectionBox = document.getElementById('multi-selection-box');
            let centerX = 0, centerY = 0;
            if (selectionBox) {
                const innerBox = selectionBox.firstElementChild as HTMLElement;
                if (innerBox) {
                    const rect = innerBox.getBoundingClientRect();
                    centerX = rect.left + rect.width / 2;
                    centerY = rect.top + rect.height / 2;
                }
            }

            // Fallback if DOM not found
            if (centerX === 0) {
                if (viewportRef.current) {
                    const rect = viewportRef.current.getBoundingClientRect();
                    // Very rough approximation if DOM fails
                    centerX = rect.left + rect.width / 2;
                    centerY = rect.top + rect.height / 2;
                }
            }

            const initialLayers: Record<string, Layer> = {};
            selectedLayers.forEach((l: Layer) => initialLayers[l.id] = { ...l });

            setRotateState({
                isRotating: true,
                startX: e.clientX,
                startY: e.clientY,
                initialRotation: 0,
                centerX, // Screen Space
                centerY,  // Screen Space
                canvasCenterX, // Canvas Space
                canvasCenterY, // Canvas Space
                initialLayers
            });

        } else {
            const selectionBox = (e.target as HTMLElement).closest('.group');
            if (selectionBox) {
                const boxRect = selectionBox.getBoundingClientRect();
                setRotateState({ isRotating: true, startX: e.clientX, startY: e.clientY, initialRotation: layer.rotation, centerX: boxRect.left + boxRect.width / 2, centerY: boxRect.top + boxRect.height / 2 });
            }
        }
    }, [panOffset]);

    const mouseMoveRequestRef = useRef<number>();
    const lastMousePosRef = useRef<{ x: number, y: number, time: number } | null>(null);
    const velocityRef = useRef<number>(0);

    const handleMouseMove = useCallback((e: any) => {
        const reqId = mouseMoveRequestRef.current;
        if (reqId) {
            cancelAnimationFrame(reqId);
        }

        const currentTime = Date.now();
        if (lastMousePosRef.current) {
            const dt = currentTime - lastMousePosRef.current.time;
            if (dt > 0) {
                const dist = Math.sqrt(Math.pow(e.clientX - lastMousePosRef.current.x, 2) + Math.pow(e.clientY - lastMousePosRef.current.y, 2));
                const instantVelocity = dist / dt;
                velocityRef.current = velocityRef.current * 0.8 + instantVelocity * 0.2;
            }
        }
        lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: currentTime };

        mouseMoveRequestRef.current = requestAnimationFrame(() => {
            if (isPanningRef.current) {
                const dx = e.clientX - panStartRef.current.x;
                const dy = e.clientY - panStartRef.current.y;

                // Direct DOM Update for Panning
                if (panContainerRef.current) {
                    const newX = panOffsetRef.current.x + dx;
                    const newY = panOffsetRef.current.y + dy;
                    panContainerRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
                    // Still update ref for next frame
                    panOffsetRef.current = { x: newX, y: newY };
                }

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

                // Predictive Throttling: If moving fast (> 2.5px/ms), disable snapping for performance & feel
                // 2.5px/ms is roughly 2500px/s, a swift flick
                const isMovingFast = velocityRef.current > 2.5;

                let finalDx = dx;
                let finalDy = dy;
                let snapVertical: number | undefined;
                let snapHorizontal: number | undefined;

                if (!isMovingFast) {
                    if (currentSelectedLayerIds.length > 1) {
                        // Group Snapping
                        const selectedLayers = currentLayers.filter((l: Layer) => currentSelectedLayerIds.includes(l.id));
                        const groupBounds = GeometryOracle.getGroupBounds(selectedLayers);

                        // Construct a proxy layer for the group to reuse getSnapLines logic
                        // We need the *current* position of the group, which is initial + delta
                        const currentGroupX = groupBounds.x + dx;
                        const currentGroupY = groupBounds.y + dy;

                        const groupProxy: Layer = {
                            id: 'group_proxy',
                            type: 'rectangle',
                            x: currentGroupX,
                            y: currentGroupY,
                            width: groupBounds.width,
                            height: groupBounds.height,
                            rotation: 0,
                            opacity: 1,
                            locked: false,
                            visible: true,
                            cornerRadius: 0,
                            color: 'transparent'
                        } as any;

                        const { snapX, snapY, newX, newY } = getSnapLines(groupProxy, currentGroupX, currentGroupY);

                        if (newX !== currentGroupX) finalDx = newX - groupBounds.x;
                        if (newY !== currentGroupY) finalDy = newY - groupBounds.y;

                        snapVertical = snapX;
                        snapHorizontal = snapY;

                    } else {
                        // Single Layer Snapping
                        const primaryLayerId = currentSelectedLayerId || currentSelectedLayerIds[0];
                        const primaryLayer = currentLayers.find(l => l.id === primaryLayerId);

                        if (primaryLayer && currentDragState.initialPositions[primaryLayer.id]) {
                            const initial = currentDragState.initialPositions[primaryLayer.id];
                            let proposedX = initial.x + dx;
                            let proposedY = initial.y + dy;

                            const { snapX, snapY, newX, newY } = getSnapLines({ ...primaryLayer, x: proposedX, y: proposedY } as any, proposedX, proposedY);

                            if (newX !== proposedX) finalDx = newX - initial.x;
                            if (newY !== proposedY) finalDy = newY - initial.y;

                            snapVertical = snapX;
                            snapHorizontal = snapY;
                        }
                    }
                }

                // Direct DOM Update for Snapping
                if (snapVerticalRef.current) {
                    snapVerticalRef.current.style.display = snapVertical !== undefined ? 'block' : 'none';
                    if (snapVertical !== undefined) snapVerticalRef.current.style.left = `${snapVertical}px`;
                }
                if (snapHorizontalRef.current) {
                    snapHorizontalRef.current.style.display = snapHorizontal !== undefined ? 'block' : 'none';
                    if (snapHorizontal !== undefined) snapHorizontalRef.current.style.top = `${snapHorizontal}px`;
                }

                // Direct DOM Update for Dragging Layers
                const newBulkPreview: Record<string, { x: number, y: number }> = {};
                Object.entries(currentDragState.initialPositions).forEach(([id, initialPos]) => {
                    const nx = initialPos.x + finalDx;
                    const ny = initialPos.y + finalDy;
                    newBulkPreview[id] = { x: nx, y: ny };

                    const domNode = layerRefs.current[id];
                    if (domNode) {
                        domNode.style.left = `${nx}px`;
                        domNode.style.top = `${ny}px`;
                    }
                });
                bulkDragPreviewManualRef.current = newBulkPreview;
                // bulkDragPreviewRef.current = newBulkPreview; // Keep tracking for MouseUp
            } else {
                if (snapVerticalRef.current) snapVerticalRef.current.style.display = 'none';
                if (snapHorizontalRef.current) snapHorizontalRef.current.style.display = 'none';
            }

            const currentResizeState = resizeStateRef.current;
            if (currentResizeState?.isResizing) {
                const dx = (e.clientX - currentResizeState.startX) / currentZoom;
                const dy = (e.clientY - currentResizeState.startY) / currentZoom;
                const { handle, initialLayer, initialBounds, initialLayers } = currentResizeState;

                if (initialBounds && initialLayers) {
                    // Group Resizing
                    let { x, y, width, height } = initialBounds;
                    let newX = x, newY = y, newW = width, newH = height;

                    if (handle.includes('e')) newW += dx;
                    if (handle.includes('w')) { newX += dx; newW -= dx; }
                    if (handle.includes('s')) newH += dy;
                    if (handle.includes('n')) { newY += dy; newH -= dy; }

                    // Construct bulk updates
                    const scaleX = newW / width;
                    const scaleY = newH / height;

                    const newBulkPreview: Record<string, { x: number, y: number, width: number, height: number, fontSize?: number }> = {};
                    Object.entries(initialLayers).forEach(([id, layer]) => {
                        // Calculate relative position
                        const relX = (layer.x - x);
                        const relY = (layer.y - y);

                        const nx = newX + relX * scaleX;
                        const ny = newY + relY * scaleY;
                        const nw = layer.width * scaleX;
                        const nh = (layer as any).height ? (layer as any).height * scaleY : undefined;

                        const preview = { x: nx, y: ny, width: nw, height: nh } as any;
                        if (layer.type === 'text') preview.fontSize = (layer as TextLayer).fontSize * scaleY;
                        newBulkPreview[id] = preview;

                        // Direct DOM Update for resizing
                        const domNode = layerRefs.current[id];
                        if (domNode) {
                            domNode.style.left = `${nx}px`;
                            domNode.style.top = `${ny}px`;
                            domNode.style.width = `${nw}px`;
                            if (nh) domNode.style.height = `${nh}px`;
                            if (layer.type === 'text' && preview.fontSize) {
                                (domNode.firstChild as HTMLElement).style.fontSize = `${preview.fontSize}px`;
                            }
                        }
                    });
                    bulkDragPreviewManualRef.current = newBulkPreview as any;

                    // Render updates live for immediate feedback
                    if (onUpdateLayers) {
                        onUpdateLayers(newBulkPreview);
                    }

                    // Also update the selection box visual by calculating its new bounds conceptually?
                    // The MultiSelectionHandles will update as layers change.
                } else if (initialLayer && currentSelectedLayerId) {
                    // Single Layer Resizing
                    let { x, y, width } = initialLayer;
                    let height = (initialLayer as any).height || 0;

                    if (handle.includes('e')) width += dx;
                    if (handle.includes('w')) { x += dx; width -= dx; }
                    if (handle.includes('s')) height += dy;
                    if (handle.includes('n')) { y += dy; height -= dy; }

                    const nw = Math.max(10, width);
                    const nh = Math.max(10, height);

                    const domNode = layerRefs.current[currentSelectedLayerId];
                    if (domNode) {
                        domNode.style.left = `${x}px`;
                        domNode.style.top = `${y}px`;
                        domNode.style.width = `${nw}px`;
                        domNode.style.height = `${nh}px`;
                    }

                    bulkDragPreviewManualRef.current[currentSelectedLayerId] = { x, y, width: nw, height: nh } as any;
                }
            }

            const currentRotateState = rotateStateRef.current;
            if (currentRotateState?.isRotating) {
                const { initialLayers, centerX, centerY, canvasCenterX, canvasCenterY, initialRotation, startX, startY } = currentRotateState;

                if (initialLayers && canvasCenterX !== undefined && canvasCenterY !== undefined) {
                    // Group Rotation
                    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                    const startAngle = Math.atan2(startY - centerY, startX - centerX);
                    const deltaAngle = (angle - startAngle) * (180 / Math.PI);

                    const updates: Record<string, any> = {};

                    const rad = deltaAngle * (Math.PI / 180);
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);

                    Object.entries(initialLayers).forEach(([id, layer]) => {
                        const lHeight = (layer as any).height || 0;
                        // Center of layer relative to group center
                        const cx = layer.x + layer.width / 2;
                        const cy = layer.y + lHeight / 2;

                        const rx = cx - canvasCenterX;
                        const ry = cy - canvasCenterY;

                        // Rotate center
                        const nx = rx * cos - ry * sin;
                        const ny = rx * sin + ry * cos;

                        const fx = canvasCenterX + nx - layer.width / 2;
                        const fy = canvasCenterY + ny - lHeight / 2;
                        const fr = (layer.rotation + deltaAngle) % 360;

                        updates[id] = { x: fx, y: fy, rotation: fr };
                        bulkDragPreviewManualRef.current[id] = updates[id];

                        // Direct DOM Update for rotation (Performance)
                        const domNode = layerRefs.current[id];
                        if (domNode) {
                            const l = layer as any;
                            domNode.style.left = `${fx}px`;
                            domNode.style.top = `${fy}px`;
                            // transform is a bit complex since it includes skew, etc.
                            // but we can update the 'rotate' part of the transform string or just the rotation property if used
                            // The original style used transform template strings.
                            domNode.style.transform = `${l.perspective ? `perspective(${l.perspective}px)` : ''} rotateX(${l.rotateX || 0}deg) rotateY(${l.rotateY || 0}deg) rotate(${fr}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`;
                        }
                    });

                    if (onUpdateLayers) onUpdateLayers(updates);

                } else if (currentSelectedLayerId && currentRotateState) {
                    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                    const startAngle = Math.atan2(startY - centerY, startX - centerX);
                    const rotation = initialRotation + (angle - startAngle) * (180 / Math.PI);

                    const domNode = layerRefs.current[currentSelectedLayerId];
                    const layer = layersRef.current.find(l => l.id === currentSelectedLayerId);
                    if (domNode && layer) {
                        const l = layer as any;
                        const transformStr = `${l.perspective ? `perspective(${l.perspective}px)` : ''} rotateX(${l.rotateX || 0}deg) rotateY(${l.rotateY || 0}deg) rotate(${rotation}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`;
                        domNode.style.transform = transformStr;
                    }

                    const update = { rotation };
                    bulkDragPreviewManualRef.current[currentSelectedLayerId] = update as any;

                    if (onUpdateLayers) {
                        onUpdateLayers({ [currentSelectedLayerId]: update });
                    }
                }
            }
        });
    }, [getSnapLines, onUpdateLayers]);

    const handleMouseUp = useCallback(() => {
        if (mouseMoveRequestRef.current) {
            cancelAnimationFrame(mouseMoveRequestRef.current);
            mouseMoveRequestRef.current = undefined;
        }

        const currentDragState = dragStateRef.current;
        const currentBulkDragPreview = bulkDragPreviewManualRef.current;
        const currentResizeState = resizeStateRef.current;
        const currentRotateState = rotateStateRef.current;
        // const currentLayers = layersRef.current; // Not used

        // Commit changes in a batch if onUpdateLayers is available
        const accumulatedUpdates: Record<string, any> = {};

        if (currentDragState?.isDragging || currentResizeState?.isResizing || currentRotateState?.isRotating) {
            Object.entries(currentBulkDragPreview).forEach(([id, changes]) => {
                accumulatedUpdates[id] = changes;
            });
        }

        // Final Pan Offset Commit
        if (panOffsetRef.current.x !== panOffset.x || panOffsetRef.current.y !== panOffset.y) {
            setPanOffset(panOffsetRef.current);
        }

        const updatedIds = Object.keys(accumulatedUpdates);
        if (updatedIds.length > 0 && onUpdateLayers) {
            onUpdateLayers(accumulatedUpdates);
        }

        setDragState(null);
        setResizeState(null);
        setRotateState(null);
        setSnapLines({});
        setIsPanning(false);
        setDragPreview(null);
        setBulkDragPreview({});
        bulkDragPreviewManualRef.current = {};
    }, [onUpdateLayers, panOffset.x, panOffset.y]);

    // Global MouseUp listener to catch releases outside the canvas
    const handleMouseUpRef = useRef(handleMouseUp);
    handleMouseUpRef.current = handleMouseUp;

    useEffect(() => {
        const onUp = () => handleMouseUpRef.current();
        window.addEventListener('mouseup', onUp);
        return () => window.removeEventListener('mouseup', onUp);
    }, []);

    const [vectorPoints, setVectorPoints] = useState<{ x: number, y: number }[]>([]);
    const lastTouchDistance = useRef<number | null>(null);
    const lastTouchCenter = useRef<{ x: number, y: number } | null>(null);

    // Gesture Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        const isTwoFinger = e.touches.length === 2;
        if ((isDrawing && !isTwoFinger) || (e.target !== viewportRef.current && e.target !== containerRef.current && !isTwoFinger)) return;

        if (isTwoFinger) {
            e.preventDefault();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
            lastTouchDistance.current = dist;
            lastTouchCenter.current = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2
            };
        } else if (e.touches.length === 1) {
            // Pan logic
            const t = e.touches[0];
            dragStateRef.current = {
                isDragging: false,
                startX: t.clientX,
                startY: t.clientY,
                initialPositions: {},
            };
            setIsPanning(true);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY;
            const newZoom = Math.min(Math.max(0.1, zoom + delta * 0.001), 5);
            onZoomChange(newZoom);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const isTwoFinger = e.touches.length === 2;
        if (isDrawing && !isTwoFinger) return;

        // Throttle using the same ref mechanism as mouse move or a simplified rAF
        if (mouseMoveRequestRef.current) {
            cancelAnimationFrame(mouseMoveRequestRef.current);
        }

        e.persist(); // React pooling (though likely not needed in newer React, good safety)

        // Prevention must happen synchronously
        if ((isTwoFinger && lastTouchDistance.current) || (e.touches.length === 1 && isPanning && dragStateRef.current)) {
            e.preventDefault();
        }

        mouseMoveRequestRef.current = requestAnimationFrame(() => {
            if (isTwoFinger && lastTouchDistance.current) {
                // e.preventDefault() cannot be called async, so we must call it synchronously outside rAF
                // However, rAF is for the state updates.
                // We must separate the event prevention from the logic.
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));

                // Zoom
                const scaleFactor = dist / lastTouchDistance.current;
                const newZoom = Math.min(Math.max(0.1, zoom * scaleFactor), 5);

                // Apply zoom
                if (Math.abs(newZoom - zoom) > 0.01) {
                    onZoomChange(newZoom);
                    lastTouchDistance.current = dist;
                }
            } else if (e.touches.length === 1 && isPanning && dragStateRef.current) {
                const t = e.touches[0];
                const dx = t.clientX - dragStateRef.current.startX;
                const dy = t.clientY - dragStateRef.current.startY;

                // Direct DOM Update for Panning (Touch)
                if (panContainerRef.current) {
                    const newX = panOffsetRef.current.x + dx;
                    const newY = panOffsetRef.current.y + dy;
                    panContainerRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
                    panOffsetRef.current = { x: newX, y: newY };
                }

                dragStateRef.current.startX = t.clientX;
                dragStateRef.current.startY = t.clientY;
            }
        });
    };

    const handleTouchEnd = () => {
        lastTouchDistance.current = null;
        lastTouchCenter.current = null;
        setIsPanning(false);
        setDragState(null);
    };

    // Drawing Handlers
    const handleDrawingMouseDown = (e: React.MouseEvent) => {
        if (!isDrawing || !drawingCanvasRef.current) return;

        // Hit Test for Existing Paths/Shapes
        const hitElements = document.elementsFromPoint(e.clientX, e.clientY);
        const layerElement = hitElements.find(el => el.hasAttribute('data-layer-id'));
        if (layerElement) {
            const layerId = layerElement.getAttribute('data-layer-id');
            const layerType = layerElement.getAttribute('data-layer-type');

            // If clicking a Path or Shape in Pen Mode, we probably want to EDIT it, not draw over it.
            // Unless the user explicitly wants to draw a new path (maybe hold Alt?)
            // For now, prioritize editing for Paths.
            if (layerId && (layerType === 'path' || layerType === 'shape' || layerType === 'rectangle' || layerType === 'circle' || layerType === 'triangle')) {
                // Determine if we should switch to edit mode
                if (brushType === BrushType.VECTOR_PENCIL) {
                    onUpdatePath(layerId, { /* trigger edit mode side effects if needed, mostly handled by Editor state */ });
                    useStore.getState().setEditingPathId(layerId); // Explicitly enter edit mode
                    return; // Stop drawing new path
                }
            }
        }

        const rect = drawingCanvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        drawingLastPos.current = { x, y };
        startDrawing(x, y);
    };

    const handleDrawingTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length > 1) return;
        if (!isDrawing || !drawingCanvasRef.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = drawingCanvasRef.current.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / zoom;
        const y = (touch.clientY - rect.top) / zoom;
        drawingLastPos.current = { x, y };
        startDrawing(x, y);
    };

    const startDrawing = (x: number, y: number) => {
        if (brushType === BrushType.VECTOR_PENCIL) {
            setDrawingState({ isDrawingPath: true });
            setVectorPoints([{ x, y }]);
            const ctx = drawingCanvasRef.current?.getContext('2d');
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
        const ctx = drawingCanvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = brushOpacity;
        }
    };

    const handleDrawingMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !drawingState.isDrawingPath || !drawingCanvasRef.current) return;
        const rect = drawingCanvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        continueDrawing(x, y);
    };

    const handleDrawingTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length > 1) return;
        if (!isDrawing || !drawingState.isDrawingPath || !drawingCanvasRef.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = drawingCanvasRef.current.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / zoom;
        const y = (touch.clientY - rect.top) / zoom;
        continueDrawing(x, y);
    };

    const continueDrawing = (x: number, y: number) => {
        const { x: lastX, y: lastY } = drawingLastPos.current;
        const ctx = drawingCanvasRef.current?.getContext('2d');
        if (!ctx) return;

        if (brushType === BrushType.VECTOR_PENCIL) {
            setVectorPoints(prev => [...prev, { x, y }]);
            ctx.lineTo(x, y);
            ctx.stroke();
            drawingLastPos.current = { x, y };
            return;
        }

        const distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
        const angle = Math.atan2(y - lastY, x - lastX);

        drawBrushStroke(ctx, x, y, lastX, lastY, distance, angle);
        drawingLastPos.current = { x, y };
    };

    const drawBrushStroke = (ctx: CanvasRenderingContext2D, x: number, y: number, lastX: number, lastY: number, distance: number, angle: number) => {
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
            ctx.lineWidth = 1;
            for (let i = 0; i < distance; i += 0.5) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                ctx.save();
                ctx.translate(ix, iy);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-brushSize / 2, -1, brushSize, 2);
                ctx.restore();
            }
        } else if (brushType === BrushType.OIL) {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = brushOpacity * 0.8;
            for (let i = 0; i < distance; i += 2) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                ctx.beginPath();
                ctx.arc(ix, iy, brushSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (brushType === BrushType.CRAYON) {
            ctx.globalAlpha = brushOpacity * 0.6;
            for (let i = 0; i < distance; i += 3) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                ctx.save();
                ctx.translate(ix, iy);
                const noise = Math.random() * 2 - 1;
                ctx.fillRect(-brushSize / 2 + noise, -brushSize / 2 + noise, brushSize, brushSize);
                ctx.restore();
            }
        } else if (brushType === BrushType.PENCIL) {
            ctx.lineWidth = 1;
            ctx.globalAlpha = brushOpacity;
            for (let i = 0; i < distance; i += 1) {
                const ix = lastX + Math.cos(angle) * i + (Math.random() - 0.5);
                const iy = lastY + Math.sin(angle) * i + (Math.random() - 0.5);
                ctx.fillRect(ix, iy, 1, 1);
            }
        } else if (brushType === BrushType.WATERCOLOR) {
            ctx.globalAlpha = 0.1;
            ctx.shadowBlur = brushSize;
            ctx.shadowColor = brushColor;
            for (let i = 0; i < distance; i += 5) {
                const ix = lastX + Math.cos(angle) * i;
                const iy = lastY + Math.sin(angle) * i;
                ctx.beginPath();
                ctx.arc(ix, iy, brushSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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
    const handleContextMenu = useCallback((e: React.MouseEvent, layerId: string) => {
        e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, layerId });
    }, []);
    const handleDropShape = useCallback((e: React.DragEvent, layerId: string) => {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to canvas drop handler

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const imageUrl = ev.target?.result as string;
                    if (imageUrl && layerId && onUpdateLayers) onUpdateLayers({ [layerId]: { backgroundImage: imageUrl, color: 'transparent' } });
                };
                reader.readAsDataURL(file);
            }
            return;
        }

        const imageUrl = e.dataTransfer.getData('text/plain');
        if (imageUrl && layerId && onUpdateLayers) onUpdateLayers({ [layerId]: { backgroundImage: imageUrl, color: 'transparent' } });
    }, [onUpdateLayers]);
    const handleMouseLeaveLayer = useCallback(() => setHoveredLayerId(null), []);
    const handleSetHoveredLayerId = useCallback((id: string | null) => setHoveredLayerId(id), []);

    const textEditRef = useRef<HTMLDivElement>(null);

    const finishEditingText = () => {
        if (editingTextId && textEditRef.current) {
            const newText = textEditRef.current.innerText || '';
            if (newText.trim() && onUpdateLayers) {
                onUpdateLayers({ [editingTextId]: { text: newText } });

            }
            setEditingTextId(null);
        } else {
            setEditingTextId(null);
        }
    };

    const handleTextDoubleClick = useCallback((e: React.MouseEvent, layer: TextLayer) => {
        e.stopPropagation();
        setEditingTextId(layer.id);
        setEditText(layer.text);

        // Focus the contenteditable div after it renders and place caret at click position
        const clickX = e.clientX;
        const clickY = e.clientY;
        setTimeout(() => {
            if (textEditRef.current) {
                textEditRef.current.focus();
                // Try to place caret at the exact mouse click position
                try {
                    if (document.caretRangeFromPoint) {
                        const range = document.caretRangeFromPoint(clickX, clickY);
                        if (range) {
                            const sel = window.getSelection();
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                            return;
                        }
                    }
                } catch (_) { }
                // Fallback: place caret at end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(textEditRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    }, []);

    // Animation Keyframes Injection
    const animationStyles = `
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slide { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes zoom { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes rotate { from { transform: rotate(-180deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }
      @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-20px);} 60% {transform: translateY(-10px);} }
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
      @keyframes flip { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0deg); opacity: 1; } }
      @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
    `;

    return (
        <div className="flex-1 relative bg-[#13161a] overflow-hidden flex flex-col">
            <style>{animationStyles}</style>
            {/* Top Bar */}
            <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between px-4 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))} className="p-1 hover:bg-gray-700 rounded text-gray-400"><Icons.ZoomOut className="w-4 h-4" /></button>
                    <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => onZoomChange(Math.min(3, zoom + 0.1))} className="p-1 hover:bg-gray-700 rounded text-gray-400"><Icons.ZoomIn className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggleGrid(!showGrid)}
                        className={`p-2 rounded hover:bg-gray-800 transition-colors ${showGrid ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-400'}`}
                        title="Toggle Grid (G)"
                    >
                        <Icons.Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onToggleRulers(!showRulers)}
                        className={`p-2 rounded hover:bg-gray-800 transition-colors ${showRulers ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-400'}`}
                        title="Toggle Rulers (R)"
                    >
                        <Icons.Layout className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            className="w-12 bg-[#252627] border border-gray-600 rounded px-1 py-0.5 text-[10px] text-gray-300 text-center focus:outline-none focus:border-[#7d2ae8] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            defaultValue={canvasSize.width}
                            key={`w-${canvasSize.width}`}
                            onBlur={(e) => {
                                const v = Math.max(100, Math.min(5000, parseInt(e.target.value) || canvasSize.width));
                                if (v !== canvasSize.width) onSetCanvasSize({ ...canvasSize, width: v });
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                        <span className="text-[10px] text-gray-500">×</span>
                        <input
                            type="number"
                            className="w-12 bg-[#252627] border border-gray-600 rounded px-1 py-0.5 text-[10px] text-gray-300 text-center focus:outline-none focus:border-[#7d2ae8] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            defaultValue={canvasSize.height}
                            key={`h-${canvasSize.height}`}
                            onBlur={(e) => {
                                const v = Math.max(100, Math.min(5000, parseInt(e.target.value) || canvasSize.height));
                                if (v !== canvasSize.height) onSetCanvasSize({ ...canvasSize, height: v });
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                        <span className="text-[10px] text-gray-500">px</span>
                    </div>
                </div>
            </div>


            {/* Main Workspace with Infinite Canvas Feel */}
            <div
                ref={viewportRef}
                className="flex-1 overflow-hidden relative bg-gray-900 cursor-grab active:cursor-grabbing touch-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDownContainer}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={(e) => {
                    if (isPanning) setIsPanning(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0 && onFileUpload) {
                        const validFiles: File[] = [];
                        for (let i = 0; i < files.length; i++) {
                            if (files[i].type.startsWith('image/')) {
                                validFiles.push(files[i]);
                            }
                        }
                        if (validFiles.length > 0) {
                            onFileUpload(validFiles);
                        }
                    } else {
                        const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('url');
                        if (url && (url.startsWith('http') || url.startsWith('data:'))) {
                            onAddLogoToCanvas(url);
                        }
                    }
                }}
            >
                <div
                    ref={panContainerRef}
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
                        {showRulers && (
                            <>
                                <Ruler type="horizontal" length={canvasSize.width} zoom={zoom} />
                                <Ruler type="vertical" length={canvasSize.height} zoom={zoom} />
                            </>
                        )}

                        {/* Grid Overlay */}
                        {showGrid && (
                            <div
                                className="absolute inset-0 pointer-events-none z-[60]"
                                style={{
                                    backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                                    backgroundSize: unit === 'px' ? '20px 20px' :
                                        unit === 'in' ? `${unitToPx(0.25, 'in')}px ${unitToPx(0.25, 'in')}px` :
                                            unit === 'cm' ? `${unitToPx(0.5, 'cm')}px ${unitToPx(0.5, 'cm')}px` :
                                                `${unitToPx(5, 'mm')}px ${unitToPx(5, 'mm')}px`,
                                    opacity: 0.2
                                }}
                            ></div>
                        )}

                        {/* Golden Ratio Overlay */}
                        {showGoldenRatio && (
                            <GoldenRatioOverlay width={canvasSize.width} height={canvasSize.height} />
                        )}

                        {/* Snap Lines */}
                        <div
                            ref={snapVerticalRef}
                            className="absolute top-0 bottom-0 w-px bg-cyan-400 z-[100] pointer-events-none shadow-[0_0_4px_rgba(34,211,238,0.8)]"
                            style={{ left: snapLines.vertical, display: snapLines.vertical !== undefined ? 'block' : 'none' }}>
                        </div>
                        <div
                            ref={snapHorizontalRef}
                            className="absolute left-0 right-0 h-px bg-cyan-400 z-[100] pointer-events-none shadow-[0_0_4px_rgba(34,211,238,0.8)]"
                            style={{ top: snapLines.horizontal, display: snapLines.horizontal !== undefined ? 'block' : 'none' }}>
                        </div>

                        {/* Background Image Block */}
                        {bgImage && (
                            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                                <img src={bgImage} className="w-full h-full object-contain" style={{ filter: `opacity(${canvasFilters.opacity})` }} />
                                {canvasFilters.vignette > 0 && <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle, transparent ${100 - canvasFilters.vignette}%, black 150%)` }}></div>}
                            </div>
                        )}

                        {/* Overlay Texture (Canvas Wide) */}
                        {canvasFilters.overlayTexture && (
                            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50 z-[5] overflow-hidden"
                                style={{ backgroundImage: `url(${canvasFilters.overlayTexture})`, backgroundSize: 'cover' }}>
                            </div>
                        )}

                        {/* Layers — using pre-computed effective layers for stable React.memo references */}
                        {effectiveLayers.filter((l: Layer) => !l.groupId).map((l: Layer) => {
                            const setLayerRef = (el: HTMLDivElement | null) => {
                                layerRefs.current[l.id] = el;
                            };

                            let maskPath = undefined;
                            if (l.maskLayerId) {
                                const maskLayer = layers.find(ml => ml.id === l.maskLayerId);
                                if (maskLayer) maskPath = getLayerClipPath(maskLayer);
                            }

                            if (l.type === 'image') return (
                                <div key={l.id} data-layer-id={l.id} data-layer-type={l.type} className="contents">
                                    <ImageLayerItem ref={setLayerRef} layer={l} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={handleSetHoveredLayerId} onMouseLeave={handleMouseLeaveLayer} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} previewAnimation={previewAnimation} maskPath={maskPath} />
                                </div>
                            );
                            if (l.type === 'text') return (
                                <React.Fragment key={l.id}>
                                    {editingTextId === l.id ? (
                                        // ... existing editing logic ...
                                        <div
                                            ref={textEditRef}
                                            data-layer-id={l.id}
                                            data-layer-type={l.type}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={finishEditingText}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    textEditRef.current?.blur();
                                                }
                                                if (e.key === 'Escape') {
                                                    setEditingTextId(null);
                                                }
                                            }}
                                            className="absolute bg-transparent border-2 border-[#7d2ae8] outline-none overflow-visible z-[100] cursor-text min-w-[50px]"
                                            style={{
                                                left: l.x,
                                                top: l.y,
                                                width: l.width,
                                                fontSize: l.fontSize,
                                                fontFamily: l.fontFamily,
                                                fontWeight: l.fontWeight as any,
                                                fontStyle: l.fontStyle,
                                                textAlign: l.textAlign,
                                                color: l.color,
                                                lineHeight: l.lineHeight,
                                                transform: `rotate(${l.rotation}deg)`,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                ...(maskPath ? { clipPath: maskPath } : {})
                                            }}
                                        >
                                            {l.text}
                                        </div>
                                    ) : (
                                        <div data-layer-id={l.id} data-layer-type={l.type} className="contents">
                                            <TextLayerItem ref={setLayerRef} layer={l} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={handleSetHoveredLayerId} onMouseLeave={handleMouseLeaveLayer} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} onDoubleClick={handleTextDoubleClick} isInteracting={!!dragState || !!resizeState || !!rotateState} previewAnimation={previewAnimation} maskPath={maskPath} />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                            return (
                                <div key={l.id} data-layer-id={l.id} data-layer-type={l.type} className="contents">
                                    <ShapeLayerItem
                                        ref={setLayerRef}
                                        layer={l}
                                        isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))}
                                        isHovered={hoveredLayerId === l.id}
                                        onMouseDown={handleMouseDownLayer}
                                        onMouseEnter={handleSetHoveredLayerId}
                                        onMouseLeave={handleMouseLeaveLayer}
                                        onResize={handleResizeStart}
                                        onRotate={handleRotateStart}
                                        onContextMenu={handleContextMenu}
                                        onDrop={handleDropShape}
                                        onDoubleClick={onDoubleClickLayer}
                                        editingPathId={editingPathId}
                                        onUpdatePath={onUpdatePath}
                                        zoom={zoom}
                                        previewAnimation={previewAnimation}
                                        maskPath={maskPath}
                                    />
                                </div>
                            );
                        })}


                        {/* Drawing & Processing Overlays */}
                        {/* Multi-selection handles */}
                        {isMultiSelect && (
                            <div className="absolute inset-0 pointer-events-none z-[80]">
                                <MultiSelectionHandles
                                    layers={layers.filter(l => selectedLayerIds.includes(l.id))}
                                    zoom={zoom}
                                    onResize={handleResizeStart}
                                    onRotate={handleRotateStart}
                                />
                            </div>
                        )}
                        <canvas
                            ref={drawingCanvasRef}
                            width={canvasSize.width}
                            height={canvasSize.height}
                            className={`absolute inset-0 z-[100] touch-none ${isDrawing ? 'cursor-crosshair opacity-100' : 'pointer-events-none opacity-0'}`}
                            onMouseDown={handleDrawingMouseDown}
                            onMouseMove={handleDrawingMouseMove}
                            onMouseUp={handleDrawingMouseUp}
                            onTouchStart={handleDrawingTouchStart}
                            onTouchMove={handleDrawingTouchMove}
                            onTouchEnd={handleDrawingMouseUp}
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
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    layerId={contextMenu.layerId}
                    onClose={() => setContextMenu(null)}
                />
            )}


        </div>
    );
};

export const Canvas = React.memo(CanvasComponent);
