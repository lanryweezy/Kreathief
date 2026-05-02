/**
 * Layer Rendering Utilities
 * Helper functions for rendering different layer types
 */

import React from 'react';
import { Layer, ShapeLayer, AnimationSettings } from '../types';

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
  switch (layer.type) {
    case 'circle':
      return 'circle(50% at 50% 50%)';

    case 'triangle':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';

    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';

    case 'arrow':
      return 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)';

    case 'heart':
      return 'polygon(50% 85%, 15% 50%, 15% 25%, 30% 10%, 50% 25%, 70% 10%, 85% 25%, 85% 50%)';

    case 'speech_bubble':
      return 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)';

    case 'shield':
      return 'polygon(50% 0, 100% 10%, 100% 80%, 50% 100%, 0 80%, 0 10%)';

    case 'ribbon':
      return 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%, 10% 50%)';

    case 'banner':
      return 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)';

    case 'pentagon':
      return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';

    case 'octagon':
      return 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

    case 'plus':
      return 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)';

    case 'star_4':
      return 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)';

    case 'star_8':
      return 'polygon(50% 0%, 61% 22%, 85% 15%, 72% 35%, 100% 50%, 72% 65%, 85% 85%, 61% 72%, 50% 100%, 39% 72%, 15% 85%, 28% 65%, 0% 50%, 28% 35%, 15% 15%, 39% 22%)';

    case 'path': {
      const shapeLayer = layer as ShapeLayer;
      if (shapeLayer.pathData) {
        return `path('${shapeLayer.pathData}')`;
      }
      return undefined;
    }

    default:
      return undefined;
  }
};

/**
 * Gets the default color for a shape type
 */
export const getShapeDefaultColor = (type: ShapeLayer['type']): string => {
  switch (type) {
    case 'rectangle':
    case 'circle':
      return '#333333';
    case 'triangle':
    case 'star':
      return '#7d2ae8';
    default:
      return '#00c4cc';
  }
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
