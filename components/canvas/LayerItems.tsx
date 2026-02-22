/**
 * Layer Item Components
 * Individual wrappers for different layer types with interaction logic
 */

import React, { useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AnimationSettings, ResizeHandle } from '../../types';
import { getLayerClipPath, getAnimationStyle } from '../../utils/layerRendering';
import { renderTextOnPath, renderWarpedText } from '../../utils/textRendering';
import { SelectionHandles } from './SelectionHandles';
import { PathEditorOverlay } from '../VectorEditor/PathEditorOverlay';
import { VectorUtils } from '../../utils/vectorUtils';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent, layer: Layer) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: (id: null) => void;
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
        onMouseEnter,
        onMouseLeave,
        onResize,
        onRotate,
        onContextMenu,
        previewAnimation,
        maskPath,
      },
      ref
    ) => {
      const imgLayer = layer as ImageLayer;
      const scaleX = imgLayer.flipX ? -1 : 1;
      const scaleY = imgLayer.flipY ? -1 : 1;
      const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : imgLayer.animation);

      // Non-destructive cropping rendering logic
      const naturalWidth = imgLayer.naturalWidth || imgLayer.width;
      const naturalHeight = imgLayer.naturalHeight || imgLayer.height;
      const crop = imgLayer.crop || { x: 0, y: 0, width: naturalWidth, height: naturalHeight };

      // Scale for the image within the container
      const imgScale = imgLayer.width / crop.width;

      return (
        <div
          ref={ref}
          onMouseDown={(e) => onMouseDown(e, imgLayer)}
          onMouseEnter={() => onMouseEnter(imgLayer.id)}
          onMouseLeave={() => onMouseLeave(null)}
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

          {/* Masking Logic */}
          <div
            className="w-full h-full overflow-hidden"
            style={{
              borderRadius: `${imgLayer.cornerRadius || 0}px`,
              ...animStyle,
              ...(maskPath ? { clipPath: maskPath } : {}),
            }}
          >
            <img
              src={imgLayer.src}
              className="pointer-events-none block"
              alt=""
              style={{
                width: naturalWidth * imgScale,
                height: naturalHeight * imgScale,
                transform: `translate(${-crop.x * imgScale}px, ${-crop.y * imgScale}px) scale(${scaleX}, ${scaleY})`,
                transformOrigin: 'top left',
                filter: imgLayer.filters
                  ? `brightness(${imgLayer.filters.brightness}%) contrast(${imgLayer.filters.contrast}%) saturate(${imgLayer.filters.saturation}%) grayscale(${imgLayer.filters.grayscale}%) blur(${imgLayer.filters.blur}px) sepia(${imgLayer.filters.sepia}%) hue-rotate(${imgLayer.filters.hueRotate}deg)`
                  : 'none',
              }}
            />
            {imgLayer.filters?.vignette !== undefined && imgLayer.filters.vignette > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, transparent ${Math.max(0, 70 - (imgLayer.filters.vignette || 0) * 0.5)}%, rgba(0,0,0,${(imgLayer.filters.vignette || 0) / 100}))`,
                }}
              />
            )}
          </div>

          {isSelected && <SelectionHandles layer={imgLayer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
      );
    }
  )
);

ImageLayerItem.displayName = 'ImageLayerItem';

/**
 * Shape Layer Item
 */
export const ShapeLayerItem = React.memo(
  React.forwardRef<HTMLDivElement, LayerItemProps>(
    (
      {
        layer,
        isSelected,
        isHovered,
        onMouseDown,
        onMouseEnter,
        onMouseLeave,
        onResize,
        onRotate,
        onContextMenu,
        onDrop,
        previewAnimation,
        editingPathId,
        onDoubleClick,
        onUpdatePath,
        zoom,
        maskPath,
      },
      ref
    ) => {
      const shapeLayer = layer as ShapeLayer;
      const isEditing = shapeLayer.id === editingPathId;
      const clipPath = getLayerClipPath(shapeLayer);

      return (
        <div
          ref={ref}
          onMouseDown={(e) => onMouseDown(e, shapeLayer)}
          onMouseEnter={() => onMouseEnter(shapeLayer.id)}
          onMouseLeave={() => onMouseLeave(null)}
          onContextMenu={(e) => onContextMenu(e, shapeLayer.id)}
          onDoubleClick={(e) => onDoubleClick && onDoubleClick(e, shapeLayer)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop && onDrop(e, shapeLayer.id)}
          className="absolute cursor-move group shape-layer-item"
          data-layer-type="shape"
          data-layer-id={shapeLayer.id}
          style={{
            left: shapeLayer.x,
            top: shapeLayer.y,
            width: shapeLayer.width,
            height: shapeLayer.height,
            transform: `${shapeLayer.perspective ? `perspective(${shapeLayer.perspective}px)` : ''} rotateX(${shapeLayer.rotateX || 0}deg) rotateY(${shapeLayer.rotateY || 0}deg) rotate(${shapeLayer.rotation}deg) skew(${shapeLayer.skewX || 0}deg, ${shapeLayer.skewY || 0}deg)`,
            opacity: shapeLayer.opacity,
            mixBlendMode: shapeLayer.blendMode as any,
            willChange: 'transform',
            zIndex: isSelected ? 100 : isHovered ? 99 : 1,
            overflow: 'visible',
          }}
        >
          {isHovered && !isSelected && !shapeLayer.locked && !isEditing && (
            <div className="absolute -inset-2 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}

          <div
            className="w-full h-full relative"
            style={{
              ...getAnimationStyle(isSelected && previewAnimation ? previewAnimation : shapeLayer.animation),
              backgroundColor: (shapeLayer as any).params?.gradient
                ? 'transparent'
                : shapeLayer.type === 'path'
                  ? 'transparent'
                  : shapeLayer.color,
              backgroundImage: (shapeLayer as any).params?.gradient
                ? `linear-gradient(${(shapeLayer as any).params.gradient.angle}deg, ${(shapeLayer as any).params.gradient.startColor}, ${(shapeLayer as any).params.gradient.endColor})`
                : shapeLayer.backgroundImage
                  ? `url(${shapeLayer.backgroundImage})`
                  : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow:
                shapeLayer.shadow && shapeLayer.type !== 'path'
                  ? `${shapeLayer.shadow.offsetX}px ${shapeLayer.shadow.offsetY}px ${shapeLayer.shadow.blur}px ${shapeLayer.shadow.color}`
                  : 'none',
              borderRadius:
                shapeLayer.type !== 'path' && shapeLayer.type !== 'arrow' ? `${shapeLayer.cornerRadius}px` : undefined,
              clipPath: shapeLayer.type === 'path' ? undefined : clipPath,
              filter: shapeLayer.filters
                ? `
                    brightness(${shapeLayer.filters.brightness}%) 
                    contrast(${shapeLayer.filters.contrast}%) 
                    saturate(${shapeLayer.filters.saturation}%) 
                    grayscale(${shapeLayer.filters.grayscale}%) 
                    blur(${shapeLayer.filters.blur}px) 
                    sepia(${shapeLayer.filters.sepia}%) 
                    hue-rotate(${shapeLayer.filters.hueRotate}deg)
                    ${shapeLayer.shadow && shapeLayer.type === 'path' ? `drop-shadow(${shapeLayer.shadow.offsetX}px ${shapeLayer.shadow.offsetY}px ${shapeLayer.shadow.blur}px ${shapeLayer.shadow.color})` : ''}
                `
                : 'none',
              opacity: shapeLayer.opacity,
              ...(maskPath ? { clipPath: maskPath } : {}),
            }}
          >
            {(shapeLayer.type === 'path' || shapeLayer.vectorPath) && (
              <svg
                width="100%"
                height="100%"
                viewBox={shapeLayer.viewBox || `0 0 ${shapeLayer.width} ${shapeLayer.height}`}
                preserveAspectRatio="none"
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <defs>
                  {shapeLayer.backgroundImage && (
                    <pattern id={`pattern-${shapeLayer.id}`} patternUnits="userSpaceOnUse" width="100%" height="100%">
                      <image
                        href={shapeLayer.backgroundImage}
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </pattern>
                  )}
                </defs>
                <path
                  d={
                    shapeLayer.pathData ||
                    (shapeLayer.vectorPath ? VectorUtils.serializePath(shapeLayer.vectorPath) : '')
                  }
                  fill={shapeLayer.backgroundImage ? `url(#pattern-${shapeLayer.id})` : shapeLayer.color || '#7d2ae8'}
                  fillOpacity={shapeLayer.opacity}
                  stroke={shapeLayer.stroke?.color}
                  strokeWidth={shapeLayer.stroke?.width}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}
          </div>

          {isEditing && shapeLayer.vectorPath && (
            <PathEditorOverlay
              path={shapeLayer.vectorPath}
              zoom={zoom || 1}
              onUpdate={(newPath) => onUpdatePath?.(shapeLayer.id, { vectorPath: newPath })}
              onSelectPoint={() => { }}
              selectedPointIndices={[]}
            />
          )}

          {isSelected && !isEditing && (
            <SelectionHandles layer={shapeLayer} onResize={onResize} onRotate={onRotate} scale={1} />
          )}
        </div>
      );
    }
  )
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
        onMouseEnter,
        onMouseLeave,
        onResize,
        onRotate,
        onContextMenu,
        onDoubleClick,
        isInteracting,
        previewAnimation,
        maskPath,
      },
      ref
    ) => {
      const textLayer = layer as TextLayer;
      const canvasRef = useRef<HTMLCanvasElement>(null);

      useEffect(() => {
        if (isInteracting) {
          return;
        }
        if (textLayer.textPath && canvasRef.current) {
          renderTextOnPath(canvasRef.current, textLayer);
        } else if (textLayer.warpStyle && textLayer.warpStyle !== 'none' && canvasRef.current) {
          renderWarpedText(canvasRef.current, textLayer);
        }
      }, [
        textLayer.text,
        textLayer.color,
        textLayer.fontSize,
        textLayer.fontFamily,
        textLayer.fontWeight,
        textLayer.fontStyle,
        textLayer.warpStyle,
        textLayer.curve,
        textLayer.width,
        textLayer.lineHeight,
        textLayer.textAlign,
        textLayer.textPath,
        isInteracting,
      ]);

      const textStyle: React.CSSProperties = {
        fontFamily: textLayer.fontFamily,
        fontSize: `${textLayer.fontSize}px`,
        fontWeight: textLayer.fontWeight,
        fontStyle: textLayer.fontStyle,
        color: textLayer.gradient && textLayer.gradient.enabled ? 'transparent' : textLayer.color,
        textAlign: textLayer.textAlign,
        letterSpacing: `${textLayer.letterSpacing}px`,
        lineHeight: textLayer.lineHeight,
        textDecoration: textLayer.textDecoration,
        textTransform: textLayer.textTransform,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundImage:
          textLayer.gradient && textLayer.gradient.enabled
            ? `linear-gradient(${textLayer.gradient.angle}deg, ${textLayer.gradient.startColor}, ${textLayer.gradient.endColor})`
            : 'none',
        WebkitBackgroundClip: textLayer.gradient && textLayer.gradient.enabled ? 'text' : 'unset',
        display: 'block',
        // Support both old single shadow and new advanced multi-shadows
        ...(textLayer.shadow || (textLayer.advancedShadows && textLayer.advancedShadows.length > 0)
          ? {
            textShadow: textLayer.advancedShadows && textLayer.advancedShadows.length > 0
              ? textLayer.advancedShadows
                  .map((s) => `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.color}`)
                  .join(', ')
              : textLayer.shadow
                ? `${textLayer.shadow.offsetX}px ${textLayer.shadow.offsetY}px ${textLayer.shadow.blur}px ${textLayer.shadow.color}`
                : undefined,
          }
          : {}),
        // Apply text transformations from TextEffectsPanel
        ...(textLayer.transformType && textLayer.transformType !== 'none'
          ? {
            transform: `
              rotate(${textLayer.transformDirection || 0}deg)
              scaleY(${1 + (textLayer.transformIntensity || 0) / 200})
              scaleX(${1 - (textLayer.transformIntensity || 0) / 200})
            `,
            transformOrigin: 'center',
          }
          : {}),
        position: 'relative',
        zIndex: 1,
      };

      const textureUrl = textLayer.decorations?.textures?.[0];
      const textureIntensity = useStore((state) => state.textureIntensity);

      const textureStyle: React.CSSProperties = textureUrl
        ? {
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${textureUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          zIndex: 2,
          opacity: textureIntensity,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }
        : {};

      const render3DDepth = () => {
        if (!textLayer.depth || textLayer.depth <= 0) {
          return null;
        }
        const depthElements = [];
        for (let i = 1; i <= textLayer.depth; i++) {
          depthElements.push(
            <div
              key={i}
              style={{
                ...textStyle,
                color: textLayer.depthColor || '#333333',
                position: 'absolute',
                top: `${i}px`,
                left: `${i}px`,
                zIndex: 0,
                textShadow: 'none',
                backgroundImage: 'none',
                WebkitBackgroundClip: 'unset',
                pointerEvents: 'none',
              }}
            >
              {textLayer.text}
            </div>
          );
        }
        return depthElements;
      };

      if ((textLayer.warpStyle && textLayer.warpStyle !== 'none') || textLayer.textPath) {
        return (
          <div
            ref={ref}
            onMouseDown={(e) => onMouseDown(e, textLayer)}
            onMouseEnter={() => onMouseEnter(textLayer.id)}
            onMouseLeave={() => onMouseLeave(null)}
            onContextMenu={(e) => onContextMenu(e, textLayer.id)}
            onDoubleClick={(e) => onDoubleClick && onDoubleClick(e, textLayer)}
            className="absolute cursor-move group text-layer-item"
            data-layer-type="text"
            data-layer-id={textLayer.id}
            style={{
              left: textLayer.x,
              top: textLayer.y,
              width: textLayer.width,
              transform: `${textLayer.perspective ? `perspective(${textLayer.perspective}px)` : ''} rotateX(${textLayer.rotateX || 0}deg) rotateY(${textLayer.rotateY || 0}deg) rotate(${textLayer.rotation}deg) skew(${textLayer.skewX || 0}deg, ${textLayer.skewY || 0}deg)`,
              opacity: textLayer.opacity,
              mixBlendMode: textLayer.blendMode as any,
              willChange: 'transform',
            }}
          >
            {isHovered && !isSelected && !textLayer.locked && (
              <div className="absolute -inset-2 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
            )}

            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                ...getAnimationStyle(isSelected && previewAnimation ? previewAnimation : textLayer.animation),
                ...(maskPath ? { clipPath: maskPath } : {}),
              }}
            />
            {isSelected && <SelectionHandles layer={textLayer} onResize={onResize} onRotate={onRotate} scale={1} />}
          </div>
        );
      }

      return (
        <div
          ref={ref}
          onMouseDown={(e) => onMouseDown(e, textLayer)}
          onMouseEnter={() => onMouseEnter(textLayer.id)}
          onMouseLeave={() => onMouseLeave(null)}
          onContextMenu={(e) => onContextMenu(e, textLayer.id)}
          onDoubleClick={(e) => onDoubleClick && onDoubleClick(e, textLayer)}
          className="absolute cursor-move group text-layer-item"
          data-layer-type="text"
          data-layer-id={textLayer.id}
          style={{
            left: textLayer.x,
            top: textLayer.y,
            width: textLayer.width,
            transform: `${textLayer.perspective ? `perspective(${textLayer.perspective}px)` : ''} rotateX(${textLayer.rotateX || 0}deg) rotateY(${textLayer.rotateY || 0}deg) rotate(${textLayer.rotation}deg) skew(${textLayer.skewX || 0}deg, ${textLayer.skewY || 0}deg)`,
            opacity: textLayer.opacity,
            mixBlendMode: textLayer.blendMode as any,
            minHeight: textLayer.fontSize,
            willChange: 'transform',
          }}
        >
          {isHovered && !isSelected && !textLayer.locked && (
            <div className="absolute -inset-2 border border-cyan-400/50 rounded-sm pointer-events-none z-40"></div>
          )}

          {render3DDepth()}

          <div
            style={{
              ...textStyle,
              ...getAnimationStyle(isSelected && previewAnimation ? previewAnimation : textLayer.animation),
              ...(maskPath ? { clipPath: maskPath } : {}),
            }}
          >
            {textLayer.text}
          </div>
          {textureUrl && (
            <div
              style={{
                ...textStyle,
                ...textureStyle,
                ...(maskPath ? { clipPath: maskPath } : {}),
              }}
            >
              {textLayer.text}
            </div>
          )}
          {isSelected && <SelectionHandles layer={textLayer} onResize={onResize} onRotate={onRotate} scale={1} />}
        </div>
      );
    }
  )
);

TextLayerItem.displayName = 'TextLayerItem';
