import { Layer } from '../../types';

/**
 * Generates a unique layer ID
 */
export const generateLayerId = (type: string): string => {
  return `${type}_${Date.now()}_${crypto.randomUUID().substring(0, 5)}`;
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
