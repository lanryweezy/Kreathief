/**
 * Layer Item Components
 * Individual wrappers for different layer types with interaction logic
 */

import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AnimationSettings, ResizeHandle } from '../../types';
import { getLayerClipPath, getAnimationStyle } from '../../utils/layerRendering';
import { SelectionHandles } from './SelectionHandles';

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
}

/**
 * Custom equality check for Dirty Rectangle Tracking
 */
const layerPropsAreEqual = (prevProps: LayerItemProps, nextProps: LayerItemProps) => {
  if (nextProps.layer.dirty) {
    return false;
  }
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

  const p = prevProps.layer;
  const n = nextProps.layer;

  return (
    p.id === n.id &&
    p.x === n.x &&
    p.y === n.y &&
    p.width === n.width &&
    p.height === n.height &&
    p.rotation === n.rotation &&
    p.opacity === n.opacity &&
    p.visible === n.visible &&
    p.locked === n.locked &&
    p.blendMode === n.blendMode
  );
};

/**
 * Image Layer Item
 */
export const ImageLayerItem = React.memo(
  React.forwardRef<HTMLDivElement, LayerItemProps>(
    (
      { layer, isSelected, isHovered, onMouseDown, onResize, onRotate, onContextMenu, previewAnimation, maskPath },
      ref
    ) => {
      const resetDirty = useStore((state) => state.resetDirty);

      useEffect(() => {
        if (layer.dirty) {
          resetDirty(layer.id);
        }
      }, [layer.dirty, layer.id, resetDirty]);

      const imgLayer = layer as ImageLayer;
      const scaleX = imgLayer.flipX ? -1 : 1;
      const scaleY = imgLayer.flipY ? -1 : 1;
      const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : imgLayer.animation);

      const naturalWidth = imgLayer.naturalWidth || imgLayer.width;
      const naturalHeight = imgLayer.naturalHeight || imgLayer.height;
      const crop = imgLayer.crop || { x: 0, y: 0, width: naturalWidth, height: naturalHeight };
      const imgScale = imgLayer.width / crop.width;

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
        }),
        [imgLayer.cornerRadius, animStyle, imgLayer.maskType, imgLayer.maskPath, imgLayer.maskDataURL, maskPath]
      );

      const imgStyle = React.useMemo(
        () => ({
          width: naturalWidth * imgScale,
          height: naturalHeight * imgScale,
          transform: `translate(${-crop.x * imgScale}px, ${-crop.y * imgScale}px) scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
          filter: imgLayer.filters
            ? `${imgLayer.filters.artisticFilter ? `url(#${imgLayer.filters.artisticFilter}) ` : ''}brightness(${imgLayer.filters.brightness}%) contrast(${imgLayer.filters.contrast}%) saturate(${imgLayer.filters.saturation}%) grayscale(${imgLayer.filters.grayscale}%) blur(${imgLayer.filters.blur}px) sepia(${imgLayer.filters.sepia}%) hue-rotate(${imgLayer.filters.hueRotate}deg)`
            : 'none',
        }),
        [naturalWidth, imgScale, crop.x, crop.y, scaleX, scaleY, imgLayer.filters]
      );

      return (
        <div
          ref={ref}
          onMouseDown={(e) => onMouseDown(e, imgLayer)}
          onContextMenu={(e) => onContextMenu(e, imgLayer.id)}
          className="absolute cursor-move group image-layer-item"
          data-layer-type="image"
          data-layer-id={imgLayer.id}
          style={{
            left: imgLayer.x,
            top: imgLayer.y,
            width: imgLayer.width,
            height: imgLayer.height,
            transform: `${imgLayer.perspective ? `perspective(${imgLayer.perspective}px)` : ''} rotateX(${imgLayer.rotateX || 0}deg) rotateY(${imgLayer.rotateY || 0}deg) rotate(${imgLayer.rotation}deg) skew(${imgLayer.skewX || 0}deg, ${imgLayer.skewY || 0}deg)`,
            opacity: imgLayer.opacity,
            mixBlendMode: imgLayer.blendMode as any,
            boxShadow: imgLayer.shadow
              ? `${imgLayer.shadow.offsetX}px ${imgLayer.shadow.offsetY}px ${imgLayer.shadow.blur}px ${imgLayer.shadow.color}`
              : 'none',
            border: imgLayer.stroke ? `${imgLayer.stroke.width}px solid ${imgLayer.stroke.color}` : 'none',
            borderRadius: `${imgLayer.cornerRadius || 0}px`,
            willChange: 'transform',
          }}
        >
          {isHovered && !isSelected && !imgLayer.locked && (
            <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}

          <div className="w-full h-full overflow-hidden" style={maskWrapperStyle}>
            <img src={imgLayer.src} className="pointer-events-none block" alt="" style={imgStyle} />
          </div>

          {isSelected && <SelectionHandles layer={imgLayer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
      );
    }
  ),
  layerPropsAreEqual
);

ImageLayerItem.displayName = 'ImageLayerItem';

/**
 * Shape Layer Item
 */
export const ShapeLayerItem = React.memo(
  React.forwardRef<HTMLDivElement, LayerItemProps>(
    (
      { layer, isSelected, isHovered, onMouseDown, onResize, onRotate, onContextMenu, previewAnimation, maskPath },
      ref
    ) => {
      const resetDirty = useStore((state) => state.resetDirty);

      useEffect(() => {
        if (layer.dirty) {
          resetDirty(layer.id);
        }
      }, [layer.dirty, layer.id, resetDirty]);

      const shapeLayer = layer as ShapeLayer;
      const clipPath = getLayerClipPath(shapeLayer);
      const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : shapeLayer.animation);

      const containerStyle = React.useMemo(
        () => ({
          left: shapeLayer.x,
          top: shapeLayer.y,
          width: shapeLayer.width,
          height: shapeLayer.height,
          transform: `${shapeLayer.perspective ? `perspective(${shapeLayer.perspective}px)` : ''} rotateX(${shapeLayer.rotateX || 0}deg) rotateY(${shapeLayer.rotateY || 0}deg) rotate(${shapeLayer.rotation}deg) skew(${shapeLayer.skewX || 0}deg, ${shapeLayer.skewY || 0}deg)`,
          opacity: shapeLayer.opacity,
          mixBlendMode: shapeLayer.blendMode as any,
          willChange: 'transform',
          zIndex: isSelected ? 100 : isHovered ? 99 : 1,
        }),
        [
          shapeLayer.x,
          shapeLayer.y,
          shapeLayer.width,
          shapeLayer.height,
          shapeLayer.perspective,
          shapeLayer.rotateX,
          shapeLayer.rotateY,
          shapeLayer.rotation,
          shapeLayer.skewX,
          shapeLayer.skewY,
          shapeLayer.opacity,
          shapeLayer.blendMode,
          isSelected,
          isHovered,
        ]
      );

      const innerStyle = React.useMemo(
        () => ({
          ...animStyle,
          backgroundColor: shapeLayer.color,
          backgroundImage: shapeLayer.imageFill
            ? `url(${shapeLayer.imageFill.src})`
            : shapeLayer.backgroundImage
              ? `url(${shapeLayer.backgroundImage})`
              : 'none',
          backgroundSize: shapeLayer.imageFill?.fit === 'contain' ? 'contain' : 'cover',
          borderRadius: shapeLayer.type !== 'path' ? `${shapeLayer.cornerRadius}px` : undefined,
          clipPath: shapeLayer.type === 'path' ? undefined : clipPath,
          filter: shapeLayer.filters
            ? `brightness(${shapeLayer.filters.brightness}%) contrast(${shapeLayer.filters.contrast}%) saturate(${shapeLayer.filters.saturation}%) grayscale(${shapeLayer.filters.grayscale}%) blur(${shapeLayer.filters.blur}px)`
            : 'none',
          ...(maskPath ? { clipPath: maskPath } : {}),
        }),
        [animStyle, shapeLayer, clipPath, maskPath]
      );

      return (
        <div
          ref={ref}
          onMouseDown={(e) => onMouseDown(e, shapeLayer)}
          onContextMenu={(e) => onContextMenu(e, shapeLayer.id)}
          className="absolute cursor-move group shape-layer-item"
          style={containerStyle}
        >
          {isHovered && !isSelected && !shapeLayer.locked && (
            <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}
          <div className="w-full h-full relative" style={innerStyle}>
            {shapeLayer.type === 'path' && (
              <svg width="100%" height="100%" viewBox={shapeLayer.viewBox} style={{ overflow: 'visible' }}>
                <path d={shapeLayer.pathData} fill={shapeLayer.color} />
              </svg>
            )}
          </div>
          {isSelected && <SelectionHandles layer={shapeLayer} onResize={onResize} onRotate={onRotate} scale={1} />}
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
      },
      ref
    ) => {
      const resetDirty = useStore((state) => state.resetDirty);

      useEffect(() => {
        if (layer.dirty) {
          resetDirty(layer.id);
        }
      }, [layer.dirty, layer.id, resetDirty]);

      const textLayer = layer as TextLayer;
      const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : textLayer.animation);

      return (
        <div
          ref={ref}
          onMouseDown={(e) => onMouseDown(e, textLayer)}
          onContextMenu={(e) => onContextMenu(e, textLayer.id)}
          onDoubleClick={(e) => onDoubleClick && onDoubleClick(e, textLayer)}
          className="absolute cursor-move group text-layer-item"
          style={{
            left: textLayer.x,
            top: textLayer.y,
            width: textLayer.width,
            transform: `rotate(${textLayer.rotation}deg)`,
            opacity: textLayer.opacity,
            ...animStyle,
          }}
        >
          {isHovered && !isSelected && !textLayer.locked && (
            <div className="absolute -inset-0.5 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}
          <div
            style={{
              fontFamily: textLayer.fontFamily,
              fontSize: `${textLayer.fontSize}px`,
              color: textLayer.color,
              textAlign: textLayer.textAlign,
              ...(maskPath ? { clipPath: maskPath } : {}),
            }}
          >
            {textLayer.text}
          </div>
          {isSelected && <SelectionHandles layer={textLayer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
      );
    }
  ),
  layerPropsAreEqual
);

TextLayerItem.displayName = 'TextLayerItem';
