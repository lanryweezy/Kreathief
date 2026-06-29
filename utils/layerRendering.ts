/**
 * Layer Rendering Utilities
 * Helper functions for rendering different layer types
 */

import React from 'react';
import { Layer, ShapeLayer, AnimationSettings } from '../types';
import { getShapeDefinition, getShapeDefaultColor as registryGetShapeDefaultColor } from './layers/shapeRegistry';

/**
 * Gets animation styles for a layer
 */
export const getAnimationStyle = (anim?: AnimationSettings): React.CSSProperties => {
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
 * Returns the CSS clip-path for a shape layer
 */
export const getLayerClipPath = (layer: Layer): string | undefined => {
  if (layer.type === 'path') {
    const shapeLayer = layer as ShapeLayer;
    if (shapeLayer.pathData) {
      return `path('${shapeLayer.pathData}')`;
    }
    return undefined;
  }

  const clipPath = getShapeDefinition(layer.type);
  if (clipPath) {
    return clipPath;
  }

  return undefined;
};

/**
 * Gets the default color for a shape type
 */
export const getShapeDefaultColor = (type: ShapeLayer['type']): string => {
  return registryGetShapeDefaultColor(type);
};

/**
 * Calculates the aspect ratio for a layer
 */
export const getLayerAspectRatio = (layer: Layer): number => {
  if (!('width' in layer) || !('height' in layer)) {
    return 1;
  }

  const width = layer.width || 0;
  const height = layer.height || 0;

  if (height === 0) {
    return 1;
  }
  return width / height;
};

/**
 * Checks if a point is inside a layer's bounding box
 */
export const isPointInLayer = (x: number, y: number, layer: Layer): boolean => {
  if (!('width' in layer) || !('height' in layer)) {
    return false;
  }

  return x >= layer.x && x <= layer.x + (layer as any).width && y >= layer.y && y <= layer.y + (layer as any).height;
};

/**
 * Gets the visible bounds of a layer considering rotation
 */
export const getLayerVisibleBounds = (layer: Layer): { x: number; y: number; width: number; height: number } => {
  const width = (layer as any).width || 0;
  const height = (layer as any).height || 0;

  // Simple bounding box (ignores rotation for performance)
  return {
    x: layer.x,
    y: layer.y,
    width,
    height,
  };
};

/**
 * Traces a CSS polygon path onto a Canvas 2D context.
 * Coordinates are computed relative to the center of the bounding box (-width/2, -height/2 to width/2, height/2)
 */
export const applyShapePolygonToContext = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  def: string,
  width: number,
  height: number
): boolean => {
  if (!def || !def.startsWith('polygon')) {
    return false;
  }

  const points = def.match(/[\d.]+% [\d.]+/g);
  if (!points || points.length === 0) {
    return false;
  }

  const hw = width / 2;
  const hh = height / 2;

  ctx.beginPath();
  points.forEach((p, i) => {
    const [xPerc, yPerc] = p.split(' ').map((s) => parseFloat(s));
    const x = (xPerc / 100) * width - hw;
    const y = (yPerc / 100) * height - hh;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();

  return true;
};
