/**
 * LayerContent Component
 * Renders the content of a layer based on its type (text, image, shape)
 */

import React from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, AnimationSettings } from '../../types';
import { getLayerClipPath } from '../../utils/layerRendering';
import { BrushStrokeRenderer } from '../../services/brushEngine';

interface LayerContentProps {
  layer: Layer;
  isSelected: boolean;
  previewAnimation?: AnimationSettings;
}

/**
 * Gets animation styles for a layer
 */
const getAnimationStyle = (anim?: AnimationSettings): React.CSSProperties => {
  if (!anim || anim.type === 'none') {
    return {};
  }

  return {
    animationName: anim.type,
    animationDuration: `${anim.duration}s`,
    animationDelay: `${anim.delay}s`,
    animationTimingFunction: anim.easing,
    animationIterationCount: anim.iterationCount === 'infinite' ? 'infinite' : anim.iterationCount,
    animationFillMode: 'both',
  };
};

/**
 * Text Layer Content
 */
const TextLayerContent = React.memo(({ layer }: { layer: TextLayer }) => {
  const {
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    color,
    textAlign,
    letterSpacing,
    lineHeight,
    textDecoration,
    textTransform,
    gradient,
  } = layer;

  const style: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontFamily,
    fontWeight,
    fontStyle,
    color,
    textAlign,
    letterSpacing: `${letterSpacing}px`,
    lineHeight,
    textDecoration,
    textTransform,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflow: 'hidden',
  };

  // Apply gradient if enabled
  if (gradient?.enabled) {
    style.backgroundImage = `linear-gradient(${gradient.angle}deg, ${gradient.startColor}, ${gradient.endColor})`;
    style.backgroundClip = 'text';
    style.WebkitBackgroundClip = 'text';
    style.color = 'transparent';
  }

  return <div style={style}>{text}</div>;
});

TextLayerContent.displayName = 'TextLayerContent';

/**
 * Image Layer Content
 */
const ImageLayerContent = React.memo(({ layer }: { layer: ImageLayer }) => {
  const { src, width, height, flipX, flipY, cornerRadius, crop } = layer;

  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
    borderRadius: cornerRadius ? `${cornerRadius}px` : undefined,
  };

  // Apply crop if present
  if (crop) {
    style.clipPath = `inset(${crop.y}px ${width - crop.x - crop.width}px ${height - crop.y - crop.height}px ${crop.x}px)`;
  }

  return <img src={src} alt="" style={style} draggable={false} />;
});

ImageLayerContent.displayName = 'ImageLayerContent';

/**
 * Shape Layer Content
 */
const ShapeLayerContent = React.memo(({ layer }: { layer: ShapeLayer }) => {
  const { type, width, height, color, cornerRadius, gradient, pathData, viewBox, imageFill } = layer;

  // Custom SVG path
  if (type === 'path' && pathData) {
    const isDrawingPath = layer.id.startsWith('draw_') || !!(layer as any).brushType;
    const brushType = (layer as any).brushType;

    if (isDrawingPath) {
      return (
        <BrushStrokeRenderer
          id={layer.id}
          pathData={pathData}
          width={width}
          height={height}
          viewBox={viewBox}
          brushType={brushType}
          color={color}
          strokeWidth={layer.stroke?.width}
          opacity={layer.opacity}
          mode="thumbnail"
        />
      );
    }

    const fill: string | undefined = gradient?.enabled ? undefined : color;
    const strokeColor = layer.stroke?.color || color;
    const strokeWidth = layer.stroke?.width || 1;
    const strokeDasharray: string | undefined = undefined;
    const strokeLinecap: 'butt' | 'round' | 'square' | undefined = 'round';

    return (
      <svg
        width={width}
        height={height}
        viewBox={viewBox || `0 0 ${width} ${height}`}
        style={{ overflow: 'visible', opacity: layer.opacity }}
      >
        <path
          d={pathData}
          fill={fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap={strokeLinecap}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Image fill
  if (imageFill?.src) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${imageFill.src})`,
          backgroundSize: imageFill.fit || 'cover',
          backgroundPosition: 'center',
          borderRadius: cornerRadius ? `${cornerRadius}px` : undefined,
        }}
      />
    );
  }

  // Gradient fill
  if (gradient?.enabled) {
    const gradientStyle: React.CSSProperties = {
      background: `linear-gradient(${gradient.angle || 0}deg, ${gradient.colors.map((c) => `${c.color} ${c.position * 100}%`).join(', ')})`,
      width: '100%',
      height: '100%',
      borderRadius: cornerRadius ? `${cornerRadius}px` : undefined,
    };
    return <div style={gradientStyle} />;
  }

  // Solid color with clip-path for shapes
  const clipPath = getLayerClipPath(layer);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: color,
        borderRadius: type === 'rectangle' || type === 'path' ? `${cornerRadius}px` : undefined,
        clipPath,
      }}
    />
  );
});

ShapeLayerContent.displayName = 'ShapeLayerContent';

const ProcessingOverlay = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] overflow-hidden rounded-[inherit]">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
    <div className="relative flex flex-col items-center gap-2">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-[8px] font-black text-white uppercase tracking-widest drop-shadow-md">Processing</span>
    </div>
  </div>
);

/**
 * Main LayerContent Component
 */
export const LayerContent = React.memo(({ layer, isSelected, previewAnimation }: LayerContentProps) => {
  const animStyle = getAnimationStyle(isSelected && previewAnimation ? previewAnimation : layer.animation);

  const renderContent = () => {
    switch (layer.type) {
      case 'text':
        return <TextLayerContent layer={layer as TextLayer} />;
      case 'image':
        return <ImageLayerContent layer={layer as ImageLayer} />;
      default:
        return <ShapeLayerContent layer={layer as ShapeLayer} />;
    }
  };

  return (
    <div style={animStyle} className="relative w-full h-full">
      {renderContent()}
      {layer.isProcessing && <ProcessingOverlay />}
    </div>
  );
});

LayerContent.displayName = 'LayerContent';
