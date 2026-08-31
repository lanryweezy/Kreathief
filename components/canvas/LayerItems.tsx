/**
 * Layer Item Components
 * Individual wrappers for different layer types with interaction logic
 */

import React from 'react';
import {
  Layer,
  TextLayer,
  ShapeLayer,
  ImageLayer,
  AdjustmentLayer,
  AnimationSettings,
  ResizeHandle,
  CanvasFilters,
} from '../../types';
import { getLayerClipPath, getAnimationStyle } from '../../utils/layerRendering';
import { buildVariableStrokeOutline, profileWidthFn } from '../../utils/variableStroke';
import { buildFilterString, getLayerStyle } from '../../utils/layers';
import { hexToRgba } from '../../lib/utils';
import { SelectionHandles } from './SelectionHandles';

import { BrushStrokeRenderer } from '../../services/brushEngine';

export const StickerFilter = ({ layerId, effect }: { layerId: string; effect: any }) => {
  if (!effect || !effect.enabled) {
    return null;
  }
  return (
    <svg
      width="0"
      height="0"
      className="absolute pointer-events-none"
      style={{ position: 'absolute', width: 0, height: 0 }}
    >
      <filter id={`sticker-${layerId}`} x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={effect.width} result="dilated" />
        <feFlood floodColor={effect.color} result="flood" />
        <feComposite in="flood" in2="dilated" operator="in" result="outline" />
        <feDropShadow dx="0" dy="0" stdDeviation={effect.shadowBlur} floodColor={effect.shadowColor} result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </svg>
  );
};

const safeStr = (v: any, fallback = ''): string => {
  if (v === null || v === undefined) {
    return fallback;
  }
  if (typeof v === 'string') {
    return v;
  }
  if (typeof v === 'number') {
    return String(v);
  }
  return fallback;
};

// Builds the CSS text-shadow for a text layer. Precedence: neon glow > explicit shadow > styleType effects.
const getTextShadowStyle = (textLayer: TextLayer): React.CSSProperties => {
  if (textLayer.neonGlow?.enabled) {
    const alpha = Math.max(0.15, Math.min(1, (textLayer.neonGlow.intensity ?? 50) / 100));
    const spread = Math.max(1, textLayer.neonGlow.spread ?? 30);
    const color = safeStr(textLayer.neonGlow.color, '#7d2ae8');
    return {
      textShadow: `0 0 ${spread}px ${hexToRgba(color, alpha)}, 0 0 ${spread * 2}px ${hexToRgba(color, alpha * 0.8)}, 0 0 ${spread * 3}px ${hexToRgba(color, alpha * 0.6)}`,
    };
  }
  if (textLayer.textShadow && typeof textLayer.textShadow === 'object') {
    return {
      textShadow: `${textLayer.textShadow.offsetX}px ${textLayer.textShadow.offsetY}px ${textLayer.textShadow.blur}px ${safeStr(textLayer.textShadow.color, '#000000')}`,
    };
  }
  const depth = textLayer.depth || 4;
  switch (textLayer.styleType) {
    case 'emboss':
      return { textShadow: '-1px -1px 1px rgba(255,255,255,0.8), 1px 1px 2px rgba(0,0,0,0.6)' };
    case 'deboss':
      return { textShadow: '1px 1px 1px rgba(255,255,255,0.8), -1px -1px 2px rgba(0,0,0,0.6)' };
    case 'lift':
      return { textShadow: `0 ${depth}px ${depth * 2}px rgba(0,0,0,0.45)` };
    case 'echo': {
      const echoColor = safeStr(textLayer.depthColor, '') || safeStr(textLayer.color, '#000000');
      return {
        textShadow: `${depth}px ${depth}px 0 ${hexToRgba(echoColor, 0.4)}, ${depth * 2}px ${depth * 2}px 0 ${hexToRgba(echoColor, 0.2)}`,
      };
    }
    default:
      return {};
  }
};

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent, layer: Layer) => void;
  onResize: (e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => void;
  onRotate: (e: React.MouseEvent, layer: Layer) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  previewAnimation?: AnimationSettings;
  maskPath?: string;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDoubleClick?: (e: React.MouseEvent, layer: any) => void;
  editingPathId?: string | null;
  onUpdatePath?: (id: string, updates: any) => void;
  zoom?: number;
  isInteracting?: boolean;
  optimizedSrc?: string | null;
  // Text specific
  isEditing?: boolean;
  textEditRef?: React.RefObject<HTMLDivElement>;
  onFinishEditing?: () => void;
}

/**
 * Custom equality check for Dirty Rectangle Tracking
 */
const layerPropsAreEqual = (prevProps: LayerItemProps, nextProps: LayerItemProps) => {
  if (prevProps.isSelected !== nextProps.isSelected) {
    return false;
  }
  if (prevProps.isHovered !== nextProps.isHovered) {
    return false;
  }
  if (prevProps.zoom !== nextProps.zoom) {
    return false;
  }
  if (prevProps.maskPath !== nextProps.maskPath) {
    return false;
  }
  if (prevProps.isInteracting !== nextProps.isInteracting) {
    return false;
  }
  if (prevProps.previewAnimation !== nextProps.previewAnimation) {
    return false;
  }
  if (prevProps.editingPathId !== nextProps.editingPathId) {
    return false;
  }
  // Worker-processed image src arrives async with an unchanged layer ref, and
  // text edit mode toggles without touching the layer — both must bust the memo.
  if (prevProps.optimizedSrc !== nextProps.optimizedSrc) {
    return false;
  }
  if (prevProps.isEditing !== nextProps.isEditing) {
    return false;
  }

  const p = prevProps.layer;
  const n = nextProps.layer;

  if (p === n) {
    return true;
  }

  // Comprehensive deep equality check for nested objects (gradient, pathEffects, filters, stroke, animation, etc.)
  const deepEqual = (o1: any, o2: any, depth = 0): boolean => {
    if (o1 === o2) {
      return true;
    }
    if (!o1 || !o2 || typeof o1 !== 'object' || typeof o2 !== 'object' || depth > 5) {
      return o1 === o2;
    }
    if (Array.isArray(o1) && Array.isArray(o2)) {
      if (o1.length !== o2.length) {
        return false;
      }
      for (let i = 0; i < o1.length; i++) {
        if (!deepEqual(o1[i], o2[i], depth + 1)) {
          return false;
        }
      }
      return true;
    }
    const keys1 = Object.keys(o1);
    const keys2 = Object.keys(o2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (const key of keys1) {
      if (!deepEqual(o1[key], o2[key], depth + 1)) {
        return false;
      }
    }
    return true;
  };

  return deepEqual(p, n);
};

/**
 * Image Layer Item
 */
export const ImageLayerItem = React.memo(
  React.forwardRef<HTMLDivElement, LayerItemProps>(
    (
      {
        layer,
        isSelected,
        isHovered,
        onMouseDown,
        onResize,
        onRotate,
        onContextMenu,
        previewAnimation,
        maskPath,
        optimizedSrc,
        onDoubleClick,
        zoom,
      },
      ref
    ) => {
      const imgLayer = layer as ImageLayer;
      const scaleX = imgLayer.flipX ? -1 : 1;
      const scaleY = imgLayer.flipY ? -1 : 1;
      const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : imgLayer.animation);

      const naturalWidth = imgLayer.naturalWidth || imgLayer.width;
      const naturalHeight = imgLayer.naturalHeight || imgLayer.height;
      const crop = imgLayer.crop || { x: 0, y: 0, width: naturalWidth, height: naturalHeight };
      const imgScale = imgLayer.width / crop.width;

      // Image reposition mode: drag to move image within crop bounds
      const [repositioning, setRepositioning] = React.useState(false);
      const repositionStart = React.useRef({ x: 0, y: 0, cropX: 0, cropY: 0 });

      // Exit reposition mode on Escape key
      React.useEffect(() => {
        if (!repositioning) {
          return;
        }
        const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            setRepositioning(false);
          }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
      }, [repositioning]);

      const handleImageRepositionStart = React.useCallback(
        (e: React.PointerEvent) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          setRepositioning(true);
          repositionStart.current = { x: e.clientX, y: e.clientY, cropX: crop.x, cropY: crop.y };
        },
        [crop.x, crop.y]
      );

      const handleImageRepositionMove = React.useCallback(
        (e: React.PointerEvent) => {
          if (!repositioning) {
            return;
          }
          const dx = (e.clientX - repositionStart.current.x) / (zoom || 1);
          const dy = (e.clientY - repositionStart.current.y) / (zoom || 1);
          const newCropX = Math.max(0, Math.min(naturalWidth - crop.width, repositionStart.current.cropX + dx));
          const newCropY = Math.max(0, Math.min(naturalHeight - crop.height, repositionStart.current.cropY + dy));
          // Direct DOM update for performance during drag
          const imgEl = (e.currentTarget as HTMLElement).querySelector('img');
          if (imgEl) {
            imgEl.style.transform = `translate(${-newCropX * imgScale}px, ${-newCropY * imgScale}px) scale(${scaleX}, ${scaleY})`;
          }
        },
        [repositioning, naturalWidth, naturalHeight, crop.width, crop.height, imgScale, scaleX, scaleY, zoom]
      );

      const handleImageRepositionEnd = React.useCallback(
        (e: React.PointerEvent) => {
          if (!repositioning) {
            return;
          }
          setRepositioning(false);
          const dx = (e.clientX - repositionStart.current.x) / (zoom || 1);
          const dy = (e.clientY - repositionStart.current.y) / (zoom || 1);
          const newCropX = Math.max(0, Math.min(naturalWidth - crop.width, repositionStart.current.cropX + dx));
          const newCropY = Math.max(0, Math.min(naturalHeight - crop.height, repositionStart.current.cropY + dy));
          // Persist the new crop position
          if (onDoubleClick) {
            onDoubleClick(e, { ...imgLayer, crop: { ...crop, x: newCropX, y: newCropY } });
          }
        },
        [repositioning, naturalWidth, naturalHeight, crop, imgLayer, scaleX, scaleY, zoom, onDoubleClick]
      );

      const maskWrapperStyle = React.useMemo(
        () => ({
          borderRadius: `${imgLayer.cornerRadius || 0}px`,
          ...animStyle,
          ...(imgLayer.maskType === 'lasso' && imgLayer.maskPath
            ? { clipPath: `path('${imgLayer.maskPath}')` }
            : imgLayer.maskType === 'bitmap' && imgLayer.maskDataURL
              ? {
                  WebkitMaskImage: `url(${imgLayer.maskDataURL})`,
                  maskImage: `url(${imgLayer.maskDataURL})`,
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }
              : maskPath
                ? { clipPath: maskPath }
                : {}),
          backdropFilter: imgLayer.filters?.backdropBlur ? `blur(${imgLayer.filters.backdropBlur}px)` : 'none',
          WebkitBackdropFilter: imgLayer.filters?.backdropBlur ? `blur(${imgLayer.filters.backdropBlur}px)` : 'none',
        }),
        [imgLayer.cornerRadius, animStyle, imgLayer.maskType, imgLayer.maskPath, imgLayer.maskDataURL, maskPath]
      );

      const filtersJson = imgLayer.filters ? JSON.stringify(imgLayer.filters) : '';
      const imgStyle = React.useMemo(
        () => ({
          width: naturalWidth * imgScale,
          height: naturalHeight * imgScale,
          transform: `translate(${-crop.x * imgScale}px, ${-crop.y * imgScale}px) scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
          filter: imgLayer.filters
            ? optimizedSrc
              ? // Pixel filters are baked into optimizedSrc; keep only the SVG artistic filter
                imgLayer.filters.artisticFilter
                ? `url(#${imgLayer.filters.artisticFilter})`
                : 'none'
              : `${imgLayer.filters.artisticFilter ? `url(#${imgLayer.filters.artisticFilter}) ` : ''}${buildFilterString(imgLayer.filters)}`
            : 'none',
        }),
        [naturalWidth, imgScale, crop.x, crop.y, scaleX, scaleY, filtersJson, optimizedSrc]
      );

      return (
        <div
          ref={ref}
          role="img"
          aria-label={imgLayer.name || 'Image layer'}
          onMouseDown={(e) => onMouseDown(e, imgLayer)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setRepositioning(true);
          }}
          onContextMenu={(e) => onContextMenu(e, imgLayer.id)}
          className="absolute cursor-move group image-layer-item"
          data-layer-type="image"
          data-layer-id={imgLayer.id}
          style={(() => {
            const base = getLayerStyle(imgLayer);
            return {
              ...base,
              transform: `${imgLayer.perspective ? `perspective(${imgLayer.perspective}px)` : ''} rotateX(${imgLayer.rotateX || 0}deg) rotateY(${imgLayer.rotateY || 0}deg) ${base.transform} skew(${imgLayer.skewX || 0}deg, ${imgLayer.skewY || 0}deg)`,
              boxShadow:
                imgLayer.shadow && typeof imgLayer.shadow === 'object'
                  ? `${imgLayer.shadow.offsetX}px ${imgLayer.shadow.offsetY}px ${imgLayer.shadow.blur}px ${safeStr(imgLayer.shadow.color, '#000000')}`
                  : 'none',
              border:
                imgLayer.stroke && typeof imgLayer.stroke === 'object'
                  ? `${imgLayer.stroke.width}px solid ${safeStr(imgLayer.stroke.color, '#000000')}`
                  : 'none',
              borderRadius: `${imgLayer.cornerRadius || 0}px`,
              willChange: 'transform',
              zIndex: isSelected ? 100 : isHovered ? 99 : 1,
            };
          })()}
        >
          {isHovered && !isSelected && !imgLayer.locked && (
            <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}
          <StickerFilter layerId={imgLayer.id} effect={(imgLayer as any).stickerEffect} />

          <div
            className="w-full h-full overflow-hidden relative"
            style={{
              ...maskWrapperStyle,
              filter: (imgLayer as any).stickerEffect?.enabled ? `url(#sticker-${imgLayer.id})` : 'none',
            }}
            onPointerDown={repositioning ? handleImageRepositionStart : undefined}
            onPointerMove={repositioning ? handleImageRepositionMove : undefined}
            onPointerUp={repositioning ? handleImageRepositionEnd : undefined}
          >
            <img
              src={optimizedSrc || imgLayer.src}
              className={`pointer-events-none block ${repositioning ? 'cursor-grab' : ''}`}
              alt=""
              style={imgStyle}
              draggable={false}
            />
            {imgLayer.inpaintNodes
              ?.filter((node) => node.enabled)
              .map((node) => {
                // Patch covers the crop region it was captured with; legacy nodes
                // (no capturedCrop) keep the old fill-the-frame behavior
                const cap = node.capturedCrop || crop;
                return (
                  <img
                    key={node.id}
                    src={node.patchSrc}
                    className="absolute pointer-events-none block"
                    style={{
                      left: (cap.x - crop.x) * imgScale,
                      top: (cap.y - crop.y) * imgScale,
                      width: cap.width * imgScale,
                      height: cap.height * imgScale,
                      maxWidth: 'none',
                      opacity: node.opacity,
                      transform: `scale(${scaleX}, ${scaleY})`,
                      transformOrigin: 'center center',
                    }}
                    alt=""
                  />
                );
              })}
            {imgLayer.isProcessing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-lg animate-pulse pointer-events-none">
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {repositioning && (
              <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none z-10" />
            )}
          </div>

          {isSelected && <SelectionHandles layer={imgLayer} onResize={onResize} onRotate={onRotate} />}
        </div>
      );
    }
  ),
  layerPropsAreEqual
);

ImageLayerItem.displayName = 'ImageLayerItem';

const parseCssGradient = (colorStr: string | undefined) => {
  if (!colorStr || typeof colorStr !== 'string') {
    return null;
  }
  const isLinear = colorStr.startsWith('linear-gradient(');
  const isRadial = colorStr.startsWith('radial-gradient(');
  if (!isLinear && !isRadial) {
    return null;
  }

  try {
    const content = colorStr.slice(colorStr.indexOf('(') + 1, colorStr.lastIndexOf(')'));
    const parts = content.split(/,(?![^(]*\))/).map((s) => s.trim());
    let angle = 90;
    let colorParts = parts;

    if (isLinear && parts[0].includes('deg')) {
      angle = parseFloat(parts[0].replace('deg', '').trim()) || 90;
      colorParts = parts.slice(1);
    } else if (isRadial && (parts[0].includes('circle') || parts[0].includes('ellipse') || parts[0].includes('at '))) {
      colorParts = parts.slice(1);
    }

    const colors = colorParts.map((part, idx) => {
      const tokens = part.trim().split(/\s+/);
      const color = tokens[0] || '#000000';
      let position = idx / Math.max(1, colorParts.length - 1);
      if (tokens[1] && tokens[1].endsWith('%')) {
        position = parseFloat(tokens[1].replace('%', '')) / 100;
      }
      return { color, position: isNaN(position) ? idx / Math.max(1, colorParts.length - 1) : position };
    });

    return {
      enabled: true,
      type: isRadial ? ('radial' as const) : ('linear' as const),
      angle,
      colors,
    };
  } catch {
    return null;
  }
};

/**
 * Shape Layer Item
 */
export const ShapeLayerItem = React.memo(
  React.forwardRef<HTMLDivElement, LayerItemProps>(
    (
      { layer, isSelected, isHovered, onMouseDown, onResize, onRotate, onContextMenu, previewAnimation, maskPath },
      ref
    ) => {
      const shapeLayer = layer as ShapeLayer;
      const activeGrad =
        shapeLayer.gradient && shapeLayer.gradient.enabled ? shapeLayer.gradient : parseCssGradient(shapeLayer.color);
      const clipPath = getLayerClipPath(shapeLayer);
      const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : shapeLayer.animation);

      const containerStyle = React.useMemo(() => {
        const base = getLayerStyle(shapeLayer);
        const flipX = shapeLayer.flipX ? -1 : 1;
        const flipY = shapeLayer.flipY ? -1 : 1;
        return {
          ...base,
          transform: `${shapeLayer.perspective ? `perspective(${shapeLayer.perspective}px)` : ''} rotateX(${shapeLayer.rotateX || 0}deg) rotateY(${shapeLayer.rotateY || 0}deg) ${base.transform} scale(${flipX}, ${flipY}) skew(${shapeLayer.skewX || 0}deg, ${shapeLayer.skewY || 0}deg)`,
          willChange: 'transform',
          zIndex: isSelected ? 100 : isHovered ? 99 : 1,
        };
      }, [shapeLayer, isSelected, isHovered]);

      const innerStyle = React.useMemo(() => {
        const getRadius = () => {
          if (shapeLayer.type === 'circle') {
            return '50%';
          }
          if (shapeLayer.type === 'path') {
            return undefined;
          }
          if ((shapeLayer as ShapeLayer).cornerRadiusPerCorner) {
            const r = (shapeLayer as ShapeLayer).cornerRadiusPerCorner!;
            return `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
          }
          return `${shapeLayer.cornerRadius}px`;
        };

        const buildShadow = () => {
          if (!shapeLayer.shadow || typeof shapeLayer.shadow !== 'object') {
            return 'none';
          }
          const s = shapeLayer.shadow;
          const opacity = s.opacity ?? 1;
          const color = safeStr(s.color, '#000000');
          const inset = s.inset ? 'inset ' : '';
          return `${inset}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${color}`;
        };

        return {
          ...animStyle,
          backgroundColor: shapeLayer.type === 'path' ? 'transparent' : safeStr(shapeLayer.color, '#7d2ae8'),
          backgroundImage:
            shapeLayer.type === 'path'
              ? 'none'
              : shapeLayer.imageFill
                ? `url(${shapeLayer.imageFill.src})`
                : shapeLayer.backgroundImage
                  ? `url(${shapeLayer.backgroundImage})`
                  : 'none',
          backgroundSize: shapeLayer.imageFill?.fit === 'contain' ? 'contain' : 'cover',
          borderRadius: getRadius(),
          clipPath: shapeLayer.type === 'path' ? undefined : clipPath,
          WebkitClipPath: shapeLayer.type === 'path' ? undefined : clipPath,
          filter: shapeLayer.filters ? buildFilterString(shapeLayer.filters) : 'none',
          backdropFilter: shapeLayer.filters?.backdropBlur ? `blur(${shapeLayer.filters.backdropBlur}px)` : 'none',
          WebkitBackdropFilter: shapeLayer.filters?.backdropBlur
            ? `blur(${shapeLayer.filters.backdropBlur}px)`
            : 'none',
          boxShadow: buildShadow(),
          ...(maskPath ? { clipPath: maskPath, WebkitClipPath: maskPath } : {}),
        };
      }, [animStyle, shapeLayer, clipPath, maskPath]);

      const hasStickerEffect = (shapeLayer as any).stickerEffect?.enabled;

      return (
        <div
          ref={ref}
          role="img"
          data-testid={`shape-layer-${shapeLayer.id}`}
          data-layer-id={shapeLayer.id}
          aria-label={shapeLayer.name || 'Shape layer'}
          onMouseDown={(e) => onMouseDown(e, shapeLayer)}
          onContextMenu={(e) => onContextMenu(e, shapeLayer.id)}
          className="absolute cursor-move group shape-layer-item shape-layer"
          style={containerStyle}
        >
          <StickerFilter layerId={shapeLayer.id} effect={(shapeLayer as any).stickerEffect} />
          {isHovered && !isSelected && !shapeLayer.locked && (
            <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}
          <div
            className="w-full h-full relative"
            style={{ ...innerStyle, filter: hasStickerEffect ? `url(#sticker-${shapeLayer.id})` : innerStyle.filter }}
          >
            {shapeLayer.pathData &&
              (() => {
                const brushType = shapeLayer.brushType;
                const isDrawingPath = shapeLayer.id?.startsWith('draw_') || !!brushType;

                if (isDrawingPath) {
                  return (
                    <BrushStrokeRenderer
                      id={shapeLayer.id}
                      pathData={shapeLayer.pathData}
                      width={shapeLayer.width}
                      height={shapeLayer.height}
                      viewBox={shapeLayer.viewBox}
                      brushType={brushType}
                      color={shapeLayer.color}
                      strokeWidth={shapeLayer.stroke?.width}
                      opacity={shapeLayer.opacity}
                      mode="canvas"
                    />
                  );
                }

                return (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={shapeLayer.viewBox || `0 0 ${shapeLayer.width} ${shapeLayer.height}`}
                    style={{ overflow: 'visible' }}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      {activeGrad &&
                        activeGrad.enabled &&
                        (activeGrad.type === 'radial' ? (
                          <radialGradient id={`gradient-${shapeLayer.id}`} cx="50%" cy="50%" r="50%">
                            {activeGrad.colors.map((c: any, idx: number) => (
                              <stop key={idx} offset={`${c.position * 100}%`} stopColor={c.color} />
                            ))}
                          </radialGradient>
                        ) : (
                          <linearGradient
                            id={`gradient-${shapeLayer.id}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                            gradientTransform={activeGrad.angle ? `rotate(${activeGrad.angle}, 0.5, 0.5)` : undefined}
                          >
                            {activeGrad.colors.map((c: any, idx: number) => (
                              <stop key={idx} offset={`${c.position * 100}%`} stopColor={c.color} />
                            ))}
                          </linearGradient>
                        ))}
                      {(shapeLayer.pathEffects?.roughen?.amount ?? 0) > 0 && (
                        <filter id={`roughen-${shapeLayer.id}`}>
                          <feTurbulence type="turbulence" baseFrequency="0.8" numOctaves="1" result="noise" />
                          <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale={shapeLayer.pathEffects?.roughen?.amount || 0}
                            xChannelSelector="R"
                            yChannelSelector="G"
                          />
                        </filter>
                      )}
                      {(shapeLayer.pathEffects?.zigzag?.amplitude ?? 0) > 0 && (
                        <filter id={`zigzag-${shapeLayer.id}`}>
                          <feTurbulence
                            type="turbulence"
                            baseFrequency={(shapeLayer.pathEffects?.zigzag?.frequency || 1) / 100}
                            numOctaves="1"
                            result="noise"
                          />
                          <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale={shapeLayer.pathEffects?.zigzag?.amplitude || 0}
                            xChannelSelector="R"
                            yChannelSelector="G"
                          />
                        </filter>
                      )}
                      {shapeLayer.strokeProfile && shapeLayer.strokeProfile !== 'uniform' && (
                        <>
                          <linearGradient id={`taper-mask-${shapeLayer.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            {shapeLayer.strokeProfile === 'taper-start' || shapeLayer.strokeProfile === 'taper-both' ? (
                              <stop offset="0%" stopColor="#000" stopOpacity="0" />
                            ) : (
                              <stop offset="0%" stopColor="#000" stopOpacity="1" />
                            )}
                            <stop offset="50%" stopColor="#000" stopOpacity="1" />
                            {shapeLayer.strokeProfile === 'taper-end' || shapeLayer.strokeProfile === 'taper-both' ? (
                              <stop offset="100%" stopColor="#000" stopOpacity="0" />
                            ) : (
                              <stop offset="100%" stopColor="#000" stopOpacity="1" />
                            )}
                          </linearGradient>
                          <mask id={`taper-${shapeLayer.id}`}>
                            <rect width="100%" height="100%" fill={`url(#taper-mask-${shapeLayer.id})`} />
                          </mask>
                        </>
                      )}
                    </defs>
                    {(shapeLayer.pathEffects?.offset?.distance ?? 0) > 0 && (
                      <path
                        d={shapeLayer.pathData}
                        fill="none"
                        stroke={shapeLayer.color}
                        strokeWidth={(shapeLayer.pathEffects?.offset?.distance || 0) * 2}
                        opacity={0.35}
                      />
                    )}
                    <path
                      d={shapeLayer.pathData}
                      fill={
                        activeGrad && activeGrad.enabled
                          ? `url(#gradient-${shapeLayer.id})`
                          : shapeLayer.color === 'transparent' || shapeLayer.color === 'none'
                            ? 'none'
                            : shapeLayer.color || '#7d2ae8'
                      }
                      filter={
                        (shapeLayer.pathEffects?.zigzag?.amplitude ?? 0) > 0
                          ? `url(#zigzag-${shapeLayer.id})`
                          : (shapeLayer.pathEffects?.roughen?.amount ?? 0) > 0
                            ? `url(#roughen-${shapeLayer.id})`
                            : undefined
                      }
                    />
                    {(() => {
                      const stroke = shapeLayer.stroke;
                      let w = stroke?.width || 0;
                      // Fallback: If it's a vector path with transparent/no fill, ensure minimum 2px stroke visibility
                      if (
                        w <= 0 &&
                        (shapeLayer.type === 'path' ||
                          shapeLayer.color === 'transparent' ||
                          shapeLayer.color === 'none')
                      ) {
                        w = 2;
                      }
                      if (w <= 0) {
                        return null;
                      }
                      const profile = shapeLayer.strokeProfile || 'uniform';
                      const alignment = stroke?.alignment || 'center';

                      if (profile === 'uniform') {
                        if (alignment === 'inside') {
                          return (
                            <path
                              d={shapeLayer.pathData}
                              fill={
                                activeGrad && activeGrad.enabled
                                  ? `url(#gradient-${shapeLayer.id})`
                                  : shapeLayer.color || '#7d2ae8'
                              }
                              stroke={stroke?.color || shapeLayer.color}
                              strokeWidth={w}
                              strokeLinecap={stroke?.cap || 'round'}
                              strokeLinejoin={stroke?.join || 'round'}
                              strokeDasharray={shapeLayer.strokeDasharray}
                              paintOrder="stroke fill"
                            />
                          );
                        }
                        if (alignment === 'outside') {
                          return (
                            <path
                              d={shapeLayer.pathData}
                              fill="none"
                              stroke={stroke?.color || shapeLayer.color}
                              strokeWidth={w * 2}
                              strokeLinecap={stroke?.cap || 'round'}
                              strokeLinejoin={stroke?.join || 'round'}
                              strokeDasharray={shapeLayer.strokeDasharray}
                            />
                          );
                        }
                        return (
                          <path
                            d={shapeLayer.pathData}
                            fill="none"
                            stroke={stroke?.color || shapeLayer.color}
                            strokeWidth={w}
                            strokeLinecap={stroke?.cap || 'round'}
                            strokeLinejoin={stroke?.join || 'round'}
                            strokeDasharray={shapeLayer.strokeDasharray}
                          />
                        );
                      } else {
                        const widthFn = profileWidthFn(profile, w);
                        const samples = shapeLayer.strokeQuality === 'fast' ? 48 : 128;
                        const outline = buildVariableStrokeOutline(shapeLayer.pathData!, widthFn, samples);
                        if (!outline) {
                          return null;
                        }
                        return <path d={outline} fill={stroke?.color || shapeLayer.color} />;
                      }
                    })()}
                  </svg>
                );
              })()}
          </div>
          {isSelected && <SelectionHandles layer={shapeLayer} onResize={onResize} onRotate={onRotate} />}
        </div>
      );
    }
  ),
  layerPropsAreEqual
);

ShapeLayerItem.displayName = 'ShapeLayerItem';

/**
 * Text Layer Item
 */
export const TextLayerItem = React.memo(
  React.forwardRef<HTMLDivElement, LayerItemProps>(
    (
      {
        layer,
        isSelected,
        isHovered,
        onMouseDown,
        onResize,
        onRotate,
        onContextMenu,
        onDoubleClick,
        previewAnimation,
        maskPath,
        isEditing,
        textEditRef,
        onFinishEditing,
      },
      ref
    ) => {
      const textLayer = layer as TextLayer;
      const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : textLayer.animation);
      const grad: any = textLayer.gradient;
      const isGradientColor =
        textLayer.color?.startsWith('linear-gradient') ||
        textLayer.color?.startsWith('radial-gradient') ||
        (grad && grad.enabled);
      const gradientStr =
        textLayer.color?.startsWith('linear-gradient') || textLayer.color?.startsWith('radial-gradient')
          ? textLayer.color
          : grad && grad.colors
            ? `${grad.type === 'radial' ? 'radial-gradient' : 'linear-gradient'}(${grad.angle || 90}deg, ${grad.colors.map((c: any) => `${c.color} ${c.position * 100}%`).join(', ')})`
            : grad && grad.startColor && grad.endColor
              ? `linear-gradient(${grad.angle || 90}deg, ${grad.startColor} 0%, ${grad.endColor} 100%)`
              : '';

      return (
        <div
          ref={ref}
          role="textbox"
          data-testid={`text-layer-${textLayer.id}`}
          data-layer-id={textLayer.id}
          aria-label={textLayer.name || 'Text layer'}
          onMouseDown={(e) => {
            if (isEditing) {
              e.stopPropagation();
              return;
            }
            onMouseDown(e, textLayer);
          }}
          onContextMenu={(e) => onContextMenu(e, textLayer.id)}
          onDoubleClick={(e) => {
            if (onDoubleClick) {
              onDoubleClick(e, textLayer);
            }
          }}
          className={`absolute group text-layer-item text-layer ${isEditing ? 'cursor-text select-text z-50' : 'cursor-move'}`}
          style={{
            ...getLayerStyle(textLayer),
            height: 'auto', // Override getLayerStyle height for TextLayers which auto-flow
            ...animStyle,
          }}
        >
          {isHovered && !isSelected && !textLayer.locked && (
            <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}
          <StickerFilter layerId={textLayer.id} effect={(textLayer as any).stickerEffect} />
          <div
            ref={isEditing ? textEditRef : undefined}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onBlur={onFinishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                onFinishEditing?.();
              }
            }}
            className={`${isEditing ? 'min-w-[30px] select-text outline-dashed outline-2 outline-brand-500/60 outline-offset-4 bg-brand-500/[0.02] caret-brand-500' : 'outline-none'} ${textLayer.neonGlow?.enabled && textLayer.neonGlow?.flicker ? 'animate-neon-flicker' : ''}`.trim()}
            style={{
              fontFamily: safeStr(textLayer.fontFamily, 'sans-serif'),
              fontSize: `${typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 16}px`,
              fontWeight: textLayer.fontWeight,
              fontStyle: textLayer.fontStyle,
              color:
                isGradientColor || (textLayer as any).textTextureUrl
                  ? 'transparent'
                  : safeStr(textLayer.color, '#000000'),
              backgroundImage: (textLayer as any).textTextureUrl
                ? `url(${(textLayer as any).textTextureUrl})`
                : isGradientColor
                  ? gradientStr
                  : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              WebkitBackgroundClip: isGradientColor || (textLayer as any).textTextureUrl ? 'text' : undefined,
              WebkitTextFillColor: isGradientColor || (textLayer as any).textTextureUrl ? 'transparent' : undefined,
              textAlign: textLayer.textAlign,
              letterSpacing:
                textLayer.letterSpacing !== null && textLayer.letterSpacing !== undefined
                  ? `${textLayer.letterSpacing}px`
                  : undefined,
              lineHeight: textLayer.lineHeight || 1.5,
              fontKerning: textLayer.kerning && textLayer.kerning > 0 ? 'normal' : 'none',
              fontFeatureSettings: textLayer.ligatures !== false ? '"liga" 1, "kern" 1' : '"liga" 0, "kern" 0',
              textDecoration: textLayer.textDecoration,
              textTransform: textLayer.textTransform,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              ...getTextShadowStyle(textLayer),
              ...(textLayer.textStroke && typeof textLayer.textStroke === 'object'
                ? {
                    WebkitTextStroke: `${textLayer.textStroke.width}px ${safeStr(textLayer.textStroke.color, '#7d2ae8')}`,
                  }
                : textLayer.styleType === 'hollow'
                  ? { WebkitTextStroke: '1px #7d2ae8' }
                  : {}),
              ...(textLayer.warpStyle && textLayer.warpStyle !== 'none'
                ? textLayer.warpStyle === 'flag' || (isEditing && textLayer.warpStyle === 'wave')
                  ? {
                      transform: `perspective(600px) rotateY(${(textLayer.curve ?? 45) * 0.45}deg) skewY(${(textLayer.curve ?? 45) * 0.3}deg)`,
                    }
                  : textLayer.warpStyle === 'rise' || textLayer.warpStyle === 'fish'
                    ? {
                        transform: `perspective(600px) rotateX(${(textLayer.curve ?? 45) * 0.55}deg) scaleX(${1 + (textLayer.curve ?? 45) * 0.005})`,
                      }
                    : isEditing && textLayer.warpStyle === 'arc'
                      ? {
                          transform: `perspective(600px) rotateX(${-(textLayer.curve ?? 45) * 0.5}deg) translateY(${-(textLayer.curve ?? 45) * 0.25}px)`,
                        }
                      : textLayer.warpStyle === 'bulge' ||
                          textLayer.warpStyle === 'squeeze' ||
                          textLayer.warpStyle === 'perspective'
                        ? {
                            transform: `perspective(${textLayer.warpParams?.perspective || 800}px) rotateX(${textLayer.warpParams?.rotateX || (textLayer.curve || 0) * 0.4}deg) rotateY(${textLayer.warpParams?.rotateY || (textLayer.curve || 0) * 0.4}deg)`,
                          }
                        : {}
                : {}),
              ...(maskPath ? { clipPath: maskPath } : {}),
              filter: (textLayer as any).stickerEffect?.enabled ? `url(#sticker-${textLayer.id})` : 'none',
            }}
          >
            {!isEditing && (textLayer.warpStyle === 'arc' || textLayer.warpStyle === 'wave') ? (
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${textLayer.width || 300} ${Math.max(120, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 2.5)}`}
                className="overflow-visible pointer-events-none"
              >
                <defs>
                  <path
                    id={`path-${textLayer.id}`}
                    d={
                      textLayer.warpStyle === 'arc'
                        ? `M 10 ${Math.max(60, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 1.25)} Q ${(textLayer.width || 300) / 2} ${Math.max(60, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 1.25) - (textLayer.curve ?? 45) * 1.8} ${(textLayer.width || 300) - 10} ${Math.max(60, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 1.25)}`
                        : `M 10 ${Math.max(60, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 1.25)} Q ${(textLayer.width || 300) / 4} ${Math.max(60, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 1.25) - (textLayer.curve ?? 45) * 1.2} ${(textLayer.width || 300) / 2} ${Math.max(60, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 1.25)} T ${(textLayer.width || 300) - 10} ${Math.max(60, (typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40) * 1.25)}`
                    }
                    fill="none"
                  />
                </defs>
                <text
                  fill={safeStr(textLayer.color, '#000000')}
                  fontSize={typeof textLayer.fontSize === 'number' ? textLayer.fontSize : 40}
                  fontFamily={safeStr(textLayer.fontFamily, 'sans-serif')}
                  fontWeight={textLayer.fontWeight}
                  fontStyle={textLayer.fontStyle}
                  textAnchor="middle"
                  letterSpacing={`${textLayer.letterSpacing || 0}px`}
                  style={{
                    ...getTextShadowStyle(textLayer),
                  }}
                >
                  <textPath href={`#path-${textLayer.id}`} startOffset="50%">
                    {safeStr(textLayer.text, '')}
                  </textPath>
                </text>
              </svg>
            ) : (
              safeStr(textLayer.text, '')
            )}
          </div>
          {isSelected && !isEditing && <SelectionHandles layer={textLayer} onResize={onResize} onRotate={onRotate} />}
        </div>
      );
    }
  ),
  layerPropsAreEqual
);

TextLayerItem.displayName = 'TextLayerItem';

/**
 * Adjustment Layer Item
 * Applies non-destructive CSS backdrop-filters to elements below it.
 */
export const AdjustmentLayerItem = React.memo(
  React.forwardRef<HTMLDivElement, LayerItemProps>(
    ({ layer, isSelected, isHovered, onMouseDown, onResize, onRotate, onContextMenu }, ref) => {
      const adjLayer = layer as AdjustmentLayer;
      const filters = adjLayer.adjustmentFilters || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        hueRotate: 0,
        sepia: 0,
        invert: 0,
      };

      // We apply a backdrop filter to affect everything rendered underneath
      const backdropFilter = buildFilterString(filters as CanvasFilters);

      return (
        <div
          ref={ref}
          onMouseDown={(e) => onMouseDown(e, adjLayer)}
          onContextMenu={(e) => onContextMenu(e, adjLayer.id)}
          className="absolute cursor-move group adjustment-layer-item z-50 pointer-events-auto"
          style={{
            ...getLayerStyle(adjLayer),
            backdropFilter: backdropFilter,
            WebkitBackdropFilter: backdropFilter, // For Safari support
            // Visual indicator when selected/hovered so it's not completely invisible
            backgroundColor: isSelected || isHovered ? 'rgba(125, 42, 232, 0.05)' : 'transparent',
            border: isSelected
              ? '1px dashed rgba(125, 42, 232, 0.5)'
              : isHovered
                ? '1px dashed rgba(125, 42, 232, 0.3)'
                : 'none',
          }}
        >
          {isSelected && (
            <div className="absolute top-2 left-2 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              ADJUSTMENT
            </div>
          )}
          {isSelected && <SelectionHandles layer={adjLayer} onResize={onResize} onRotate={onRotate} />}
        </div>
      );
    }
  ),
  layerPropsAreEqual
);

AdjustmentLayerItem.displayName = 'AdjustmentLayerItem';
