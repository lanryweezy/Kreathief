/**
 * Canvas Utilities
 * Common utilities for canvas operations to reduce duplication
 */

import { Layer, CanvasFilters, TextLayer, ShapeLayer, ImageLayer } from '../types';

/**
 * Builds a CSS filter string from a CanvasFilters or LayerFilters object
 */
export const buildFilterString = (filters: CanvasFilters): string => {
  const parts: string[] = [];

  if (filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`);
  }
  if (filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`);
  }
  if (filters.saturation !== 100) {
    parts.push(`saturate(${filters.saturation}%)`);
  }
  if (filters.grayscale !== 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }
  if (filters.sepia !== 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }
  if (filters.blur !== 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.hueRotate !== 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  }

  return parts.join(' ') || 'none';
};

/**
 * Builds inline styles for a layer element
 */
export const getLayerStyle = (layer: Layer, zoom: number = 1): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: layer.x * zoom,
    top: layer.y * zoom,
    width: 'width' in layer ? layer.width * zoom : undefined,
    height: 'height' in layer ? layer.height * zoom : undefined,
    transform: `rotate(${layer.rotation}deg)`,
    opacity: layer.opacity,
    filter: layer.filters ? buildFilterString(layer.filters) : undefined,
    mixBlendMode: layer.blendMode as React.CSSProperties['mixBlendMode'],
    pointerEvents: layer.locked ? 'none' : 'auto',
    zIndex: layer.locked ? 49 : 50,
  };

  // Add shadow if present
  if (layer.shadow) {
    const { color, blur, offsetX, offsetY } = layer.shadow;
    baseStyle.boxShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }

  return baseStyle;
};

/**
 * Checks if a layer is a text layer
 */
export const isTextLayer = (layer: Layer): layer is TextLayer => {
  return layer.type === 'text';
};

/**
 * Checks if a layer is a shape layer
 */
export const isShapeLayer = (layer: Layer): layer is ShapeLayer => {
  return [
    'rectangle',
    'circle',
    'triangle',
    'star',
    'hexagon',
    'diamond',
    'arrow',
    'heart',
    'speech_bubble',
    'ribbon',
    'shield',
    'banner',
    'pentagon',
    'octagon',
    'plus',
    'star_4',
    'star_8',
    'path',
  ].includes(layer.type);
};

/**
 * Checks if a layer is an image layer
 */
export const isImageLayer = (layer: Layer): layer is ImageLayer => {
  return layer.type === 'image';
};

/**
 * Generates a unique layer ID
 */
export const generateLayerId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Clones a layer with a new ID and offset position
 */
export const cloneLayer = <T extends Layer>(layer: T, offset: number = 20): T => {
  return {
    ...layer,
    id: generateLayerId(layer.type),
    x: layer.x + offset,
    y: layer.y + offset,
    name: `${layer.name || 'Layer'} Copy`,
  };
};

/**
 * Calculates the bounding box of multiple layers
 */
export const getLayersBoundingBox = (layers: Layer[]): { x: number; y: number; width: number; height: number } => {
  if (layers.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  layers.forEach((layer) => {
    const width = 'width' in layer ? layer.width : 0;
    const height = 'height' in layer ? layer.height : 0;

    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + width);
    maxY = Math.max(maxY, layer.y + height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Sanitizes a layer name to prevent XSS
 */
export const sanitizeLayerName = (name: string): string => {
  return name.replace(/[<>"'&]/g, '');
};

/**
 * Validates that a layer has all required properties
 */
export const isValidLayer = (layer: any): layer is Layer => {
  if (!layer || typeof layer !== 'object') {
    return false;
  }
  if (typeof layer.id !== 'string') {
    return false;
  }
  if (typeof layer.type !== 'string') {
    return false;
  }
  if (typeof layer.x !== 'number') {
    return false;
  }
  if (typeof layer.y !== 'number') {
    return false;
  }
  if (typeof layer.rotation !== 'number') {
    return false;
  }
  if (typeof layer.opacity !== 'number') {
    return false;
  }
  if (typeof layer.locked !== 'boolean') {
    return false;
  }
  if (typeof layer.visible !== 'boolean') {
    return false;
  }

  return true;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
