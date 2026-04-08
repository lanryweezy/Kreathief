/**
 * Mask Worker
 * Handles precise hit-testing and complex mask generation in a background thread.
 */

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

/**
 * Returns the CSS clip-path for a shape layer (Worker-safe version)
 */
function getLayerClipPath(layer: any): string | undefined {
  if (!layer || layer.type === 'text' || layer.type === 'image') {
    return undefined;
  }

  switch (layer.type) {
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
    case 'path':
      return layer.pathData ? `path('${layer.pathData}')` : undefined;
    default:
      return undefined;
  }
}
