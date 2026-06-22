import { getShapeDefinition } from '../utils/layers/shapeRegistry';
/**
 * Mask Worker
 * Handles precise hit-testing and complex mask generation in a background thread.
 */

import { getLayerClipPath } from '../utils/layerRendering';

self.onmessage = async (e: MessageEvent) => {
  const { type, id, payload } = e.data;

  try {
    switch (type) {
      case 'HIT_TEST_ALL': {
        const { x, y, layers } = payload;
        const result = findLayerAtPoint(x, y, layers);
        self.postMessage({ type: 'SUCCESS', id, payload: result });
        break;
      }

      case 'HIT_TEST': {
        const { x, y, layer } = payload;
        const result = isPointInLayer(x, y, layer);
        self.postMessage({ type: 'SUCCESS', id, payload: result });
        break;
      }

      case 'GENERATE_MASK': {
        const { layer } = payload;
        const maskData = getLayerClipPath(layer);
        self.postMessage({ type: 'SUCCESS', id, payload: maskData });
        break;
      }

      default:
        self.postMessage({ type: 'ERROR', id, error: `Unknown task type: ${type}` });
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', id, error: error.message || 'Worker task failed' });
  }
};

/**
 * Finds the topmost layer at a given point
 */
function findLayerAtPoint(x: number, y: number, layers: any[]): string | null {
  // Iterate backwards to find topmost layer
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.locked || !layer.visible) {
      continue;
    }

    if (isPointInLayer(x, y, layer)) {
      return layer.id;
    }
  }
  return null;
}

/**
 * Precise hit-testing for various layer types
 */
function isPointInLayer(x: number, y: number, layer: any): boolean {
  if (!layer) {
    return false;
  }

  const width = layer.width || 0;
  const height = layer.height || (layer.type === 'text' ? layer.fontSize : 0);
  const rotation = layer.rotation || 0;

  // 1. Transform point (x, y) to local space relative to layer center
  const centerX = width / 2;
  const centerY = height / 2;
  const rad = (rotation * Math.PI) / 180;

  const dx = x - (layer.x + centerX);
  const dy = y - (layer.y + centerY);

  // Rotate point back by -rotation
  const localX = dx * Math.cos(-rad) - dy * Math.sin(-rad);
  const localY = dx * Math.sin(-rad) + dy * Math.cos(-rad);

  // 2. Check local AABB
  const inAABB = localX >= -centerX && localX <= centerX && localY >= -centerY && localY <= centerY;
  if (!inAABB) {
    return false;
  }

  // 3. Shape-specific precision hit-testing (Polygon checks)
  const clipPath = getLayerClipPath(layer);
  if (clipPath && clipPath.startsWith('polygon')) {
    // Convert percentage polygon points to local coord array
    const points = parsePolygon(clipPath, width, height);
    return isPointInPolygon(localX + centerX, localY + centerY, points);
  }

  return true;
}

/**
 * Parses CSS polygon() string into local coordinate points
 */
function parsePolygon(clipPath: string, width: number, height: number): { x: number; y: number }[] {
  const match = clipPath.match(/polygon\((.*)\)/);
  if (!match) {
    return [];
  }

  const pointsStr = match[1].split(',');
  return pointsStr.map((p) => {
    const [xp, yp] = p.trim().split(/\s+/);
    return {
      x: (parseFloat(xp) / 100) * width,
      y: (parseFloat(yp) / 100) * height,
    };
  });
}

/**
 * Standard Winding Number or Ray Casting algorithm for point-in-polygon
 */
function isPointInPolygon(x: number, y: number, points: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x,
      yi = points[i].y;
    const xj = points[j].x,
      yj = points[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}
