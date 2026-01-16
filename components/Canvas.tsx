
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavTab, TextLayer, ShapeLayer, ImageLayer, Layer, CanvasFilters, CanvasSize, User, BrushType, GeneratedImage } from '../types';
import { Icons } from '../constants';
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
            className="absolute cursor-move group"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                opacity: layer.opacity,
                mixBlendMode: layer.blendMode as any,
                boxShadow: layer.shadow ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}` : 'none',
                border: layer.stroke ? `${layer.stroke.width}px solid ${layer.stroke.color}` : 'none',
                borderRadius: `${layer.cornerRadius || 0}px`,
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
                className="absolute cursor-move group"
                style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    transform: `rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                    opacity: layer.opacity,
                    mixBlendMode: layer.blendMode as any,
                    filter: layer.shadow ? `drop-shadow(${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color})` : 'none'
                }}
            >
                {isHovered && !isSelected && !layer.locked && (
                    <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
                )}

                <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
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
            className="absolute cursor-move group"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
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
                backgroundImage: layer.backgroundImage ? `url(${layer.backgroundImage})` : 'none'
            }}
        >
            {isHovered && !isSelected && !layer.locked && (
                <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
            )}

            {isSelected && <SelectionHandles layer={layer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
    );
});

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

const TextLayerItem = React.memo(({ layer, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onResize, onRotate, onContextMenu, onDoubleClick }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (layer.warpStyle && layer.warpStyle !== 'none' && canvasRef.current) {
            renderWarpedText(canvasRef.current, layer);
        }
    }, [layer]);

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

    if (layer.styleType === 'hollow') {
        textStyle.color = 'transparent';
        textStyle.WebkitTextStroke = `1px ${layer.color}`;
    }

    if (layer.warpStyle && layer.warpStyle !== 'none') {
        return (
            <div
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
                    transform: `rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                    opacity: layer.opacity,
                    mixBlendMode: layer.blendMode as any,
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
            className="absolute cursor-move group"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                transform: `rotate(${layer.rotation}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                opacity: layer.opacity,
                mixBlendMode: layer.blendMode as any,
                minHeight: layer.fontSize,
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
    onOpenPricing,
    selectedLayerIds = [],
    onMultiSelectLayer,
    onGroup,
    onUngroup
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

    // Interaction State
    const [dragState, setDragState] = useState<{ isDragging: boolean, startX: number, startY: number, initialPositions: Record<string, { x: number, y: number }> } | null>(null);
    const [resizeState, setResizeState] = useState<{ isResizing: boolean, handle: ResizeHandle, startX: number, startY: number, initialLayer: Layer } | null>(null);
    const [rotateState, setRotateState] = useState<{ isRotating: boolean, startX: number, startY: number, initialRotation: number, centerX: number, centerY: number } | null>(null);
    const [drawingState, setDrawingState] = useState({ isDrawingPath: false, lastX: 0, lastY: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, layerId: string } | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Pro Features: Pan & Snap
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [snapLines, setSnapLines] = useState<{ vertical?: number, horizontal?: number }>({});

    const layers: Layer[] = [...shapeLayers, ...imageLayers, ...textLayers];
    const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;
    const bgImage = activeImage?.url || uploadedImage;

    // -- Smart Guide Logic --
    const getSnapLines = (currentLayer: Layer, currentX: number, currentY: number) => {
        const SNAP_THRESHOLD = 5 / zoom;
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
    };

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

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        if (dragState?.isDragging && selectedLayerId) {
            const dx = (e.clientX - dragState.startX) / zoom;
            const dy = (e.clientY - dragState.startY) / zoom;

            // Refined Logic (Bulk Move + Snapping):
            // 1. Calculate raw delta based on mouse movement.
            // 2. Identify primary layer (the one clicked or active).
            // 3. Calculate snap-adjusted delta for the primary layer.
            // 4. Apply this adjusted delta to ALL selected layers, preserving their relative positions.

            const primaryLayer = layers.find(l => l.id === selectedLayerId);
            let finalDx = dx;
            let finalDy = dy;

            if (primaryLayer && dragState.initialPositions[primaryLayer.id]) {
                const initial = dragState.initialPositions[primaryLayer.id];
                let proposedX = initial.x + dx;
                let proposedY = initial.y + dy;

                const { snapX, snapY, newX, newY } = getSnapLines({ ...primaryLayer, x: proposedX, y: proposedY }, proposedX, proposedY);
                setSnapLines({ vertical: snapX, horizontal: snapY });

                if (newX !== proposedX) finalDx = newX - initial.x;
                if (newY !== proposedY) finalDy = newY - initial.y;
            } else {
                setSnapLines({});
            }

            Object.entries(dragState.initialPositions).forEach(([id, initialPos]) => {
                const newX = initialPos.x + finalDx;
                const newY = initialPos.y + finalDy;
                const update = { x: newX, y: newY };

                if (id.startsWith('text')) onUpdateTextLayer(id, update);
                else if (id.startsWith('shape')) onUpdateShapeLayer(id, update);
                else if (id.startsWith('image')) onUpdateImageLayer(id, update);
            });
        } else {
            setSnapLines({});
        }

        if (resizeState?.isResizing && selectedLayerId) {
            const dx = (e.clientX - resizeState.startX) / zoom;
            const dy = (e.clientY - resizeState.startY) / zoom;
            const { handle, initialLayer } = resizeState;
            let { x, y, width } = initialLayer;
            let height = (initialLayer as any).height || 0;

            if (handle.includes('e')) width += dx;
            if (handle.includes('w')) { x += dx; width -= dx; }
            if (handle.includes('s')) height += dy;
            if (handle.includes('n')) { y += dy; height -= dy; }

            const update = { x, y, width: Math.max(10, width), height: Math.max(10, height) };
            if (selectedLayerId.startsWith('text')) onUpdateTextLayer(selectedLayerId, { ...update, width: update.width });
            else if (selectedLayerId.startsWith('shape')) onUpdateShapeLayer(selectedLayerId, update);
            else if (selectedLayerId.startsWith('image')) onUpdateImageLayer(selectedLayerId, update);
        }

        if (rotateState?.isRotating && selectedLayerId) {
            const { centerX, centerY, initialRotation, startX, startY } = rotateState;
            const startAngle = Math.atan2(startY - centerY, startX - centerX) * 180 / Math.PI;
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
            const rotation = initialRotation + (currentAngle - startAngle);

            const update = { rotation };
            if (selectedLayerId.startsWith('text')) onUpdateTextLayer(selectedLayerId, update);
            else if (selectedLayerId.startsWith('shape')) onUpdateShapeLayer(selectedLayerId, update);
            else if (selectedLayerId.startsWith('image')) onUpdateImageLayer(selectedLayerId, update);
        }
    }, [dragState, resizeState, rotateState, selectedLayerId, zoom, isPanning, panStart, canvasSize]);

    const handleMouseUp = useCallback(() => {
        setDragState(null);
        setResizeState(null);
        setRotateState(null);
        setSnapLines({});
        setIsPanning(false);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Drawing Handlers
    const handleDrawingMouseDown = (e: React.MouseEvent) => {
        if (!isDrawing || !drawingCanvasRef.current) return;
        const rect = drawingCanvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        setDrawingState({ isDrawingPath: true, lastX: x, lastY: y });
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
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (!ctx) return;

        const distance = Math.sqrt(Math.pow(x - (drawingState.lastX || x), 2) + Math.pow(y - (drawingState.lastY || y), 2));
        const angle = Math.atan2(y - (drawingState.lastY || y), x - (drawingState.lastX || x));

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
                const ix = (drawingState.lastX || x) + Math.cos(angle) * i;
                const iy = (drawingState.lastY || y) + Math.sin(angle) * i;
                ctx.save();
                ctx.translate(ix, iy);
                ctx.rotate(Math.PI / 4); // 45 degree slant
                ctx.fillRect(-brushSize / 2, -1, brushSize, 2);
                ctx.restore();
            }
        } else if (brushType === BrushType.OIL) {
            // Oil: multi-bristle effect
            for (let i = 0; i < distance; i += 1) {
                const ix = (drawingState.lastX || x) + Math.cos(angle) * i;
                const iy = (drawingState.lastY || y) + Math.sin(angle) * i;
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
                const ix = (drawingState.lastX || x) + Math.cos(angle) * i;
                const iy = (drawingState.lastY || y) + Math.sin(angle) * i;
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
                const ix = (drawingState.lastX || x) + Math.cos(angle) * i;
                const iy = (drawingState.lastY || y) + Math.sin(angle) * i;
                const ox = (Math.random() - 0.5) * 1.5;
                const oy = (Math.random() - 0.5) * 1.5;
                ctx.fillRect(ix + ox, iy + oy, 1, 1);
            }
        } else if (brushType === BrushType.WATERCOLOR) {
            // Watercolor: soft bleeding edges
            ctx.globalAlpha = brushOpacity * 0.05;
            for (let i = 0; i < distance; i += 2) {
                const ix = (drawingState.lastX || x) + Math.cos(angle) * i;
                const iy = (drawingState.lastY || y) + Math.sin(angle) * i;
                const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, brushSize * 1.5);
                grad.addColorStop(0, brushColor);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(ix, iy, brushSize * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        setDrawingState({ ...drawingState, lastX: x, lastY: y });
    };
    const handleDrawingMouseUp = () => { if (!isDrawing) return; setDrawingState({ ...drawingState, isDrawingPath: false }); drawingCanvasRef.current?.getContext('2d')?.closePath(); };

    const prevIsDrawing = useRef(isDrawing);
    useEffect(() => {
        if (prevIsDrawing.current && !isDrawing && drawingCanvasRef.current) {
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
    const handleTextDoubleClick = (e: React.MouseEvent, layer: TextLayer) => {
        e.stopPropagation(); if (layer.locked) return; setEditingTextId(layer.id); setEditText(layer.text);
    };
    const finishEditingText = () => { if (editingTextId) { onUpdateTextLayer(editingTextId, { text: editText }); setEditingTextId(null); } };

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
                    onToggleEraser={() => {/* Handled in parent */ }}
                    isEraserActive={isDrawing && brushColor.includes('255, 0, 0')}
                    canvasSize={canvasSize}
                    documentColors={documentColors}
                    user={user}
                    onOpenPricing={onOpenPricing}
                    onGroup={onGroup}
                    onUngroup={onUngroup}
                />
            </div>

            {/* Main Workspace with Infinite Canvas Feel */}
            <div
                className={`flex-1 overflow-hidden bg-[#0e1318] relative ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
                onMouseDown={handleMouseDownContainer}
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
                            filter: `brightness(${canvasFilters.brightness}%) contrast(${canvasFilters.contrast}%) saturate(${canvasFilters.saturation}%) blur(${canvasFilters.blur}px)`,
                            opacity: canvasFilters.opacity,
                        }}
                    >
                        {/* Rulers (Simplified) */}
                        <div className="absolute -top-6 left-0 right-0 h-6 bg-[#1e1e1e] border-b border-gray-700 flex items-end overflow-hidden opacity-50 text-[8px] text-gray-500 font-mono">
                            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="flex-1 border-l border-gray-600 pl-1">{Math.round(canvasSize.width * (i / 10))}</div>)}
                        </div>
                        <div className="absolute top-0 -left-6 bottom-0 w-6 bg-[#1e1e1e] border-r border-gray-700 flex flex-col overflow-hidden opacity-50 text-[8px] text-gray-500 font-mono pt-2">
                            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="flex-1 border-t border-gray-600 pt-1">{Math.round(canvasSize.height * (i / 10))}</div>)}
                        </div>

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
                            <ShapeLayerItem key={l.id} layer={l} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={setHoveredLayerId} onMouseLeave={() => setHoveredLayerId(null)} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} onDrop={handleDropShape} />
                        ))}
                        {imageLayers.map(l => (
                            <ImageLayerItem key={l.id} layer={l} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={setHoveredLayerId} onMouseLeave={() => setHoveredLayerId(null)} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} />
                        ))}
                        {textLayers.map(l => (
                            <React.Fragment key={l.id}>
                                {editingTextId === l.id ? (
                                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={finishEditingText} autoFocus className="absolute bg-transparent border-2 border-[#7d2ae8] outline-none resize-none overflow-hidden z-[100]" style={{ left: l.x, top: l.y, width: l.width, minHeight: l.fontSize * 1.5, fontSize: l.fontSize, fontFamily: l.fontFamily, fontWeight: l.fontWeight as any, fontStyle: l.fontStyle, textAlign: l.textAlign, color: l.color, lineHeight: l.lineHeight, transform: `rotate(${l.rotation}deg)` }} />
                                ) : (
                                    <TextLayerItem layer={l} isSelected={selectedLayerId === l.id || (selectedLayerIds?.includes(l.id))} isHovered={hoveredLayerId === l.id} onMouseDown={handleMouseDownLayer} onMouseEnter={setHoveredLayerId} onMouseLeave={() => setHoveredLayerId(null)} onResize={handleResizeStart} onRotate={handleRotateStart} onContextMenu={handleContextMenu} onDoubleClick={handleTextDoubleClick} />
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
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} layerId={contextMenu.layerId} onClose={() => setContextMenu(null)} onDelete={onDeleteLayer} onDuplicate={onDuplicateLayer} onMoveForward={(id) => onMoveLayer(id, 'forward')} onMoveBackward={(id) => onMoveLayer(id, 'backward')} onLock={(id) => { const l = layers.find(la => la.id === id); if (l && selectedLayerId === id) { if (id.startsWith('text')) onUpdateTextLayer(id, { locked: !l.locked }); else if (id.startsWith('shape')) onUpdateShapeLayer(id, { locked: !l.locked }); else if (id.startsWith('image')) onUpdateImageLayer(id, { locked: !l.locked }); } }} isLocked={layers.find(l => l.id === contextMenu.layerId)?.locked || false} />
            )}
        </div>
    );
};
