import { Layer, Artboard } from '../types';

export interface SnapLine {
  type: 'vertical' | 'horizontal';
  value: number;
  origin: number; // For rendering the line from point A to point B
  extent: number;
}

export interface SnapResult {
  x: number | null;
  y: number | null;
  lines: SnapLine[];
}

export class SnappingOracle {
  /**
   * Calculates the best snapping positions and lines for a set of moving layers
   */
  static calculateSnaps(
    movingLayers: Layer[],
    allLayers: Layer[],
    activeArtboard: Artboard,
    threshold: number = 5,
    zoom: number = 1
  ): SnapResult {
    const result: SnapResult = { x: null, y: null, lines: [] };
    if (movingLayers.length === 0) {
      return result;
    }

    // 1. Get bounds of moving selection
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    movingLayers.forEach((l) => {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      const w = (l as any).width || 0;
      const h = (l as any).height || 0;
      maxX = Math.max(maxX, l.x + w);
      maxY = Math.max(maxY, l.y + h);
    });

    const selectionWidth = maxX - minX;
    const selectionHeight = maxY - minY;
    const selectionCenterX = minX + selectionWidth / 2;
    const selectionCenterY = minY + selectionHeight / 2;

    const movingIds = new Set(movingLayers.map((l) => l.id));

    // 2. Define targets (Artboard edges + other layers)
    const targetsX: { value: number; origin: number; extent: number }[] = [
      { value: 0, origin: 0, extent: activeArtboard.height }, // Artboard Left
      { value: activeArtboard.width, origin: 0, extent: activeArtboard.height }, // Artboard Right
      { value: activeArtboard.width / 2, origin: 0, extent: activeArtboard.height }, // Artboard Center
    ];

    const targetsY: { value: number; origin: number; extent: number }[] = [
      { value: 0, origin: 0, extent: activeArtboard.width }, // Artboard Top
      { value: activeArtboard.height, origin: 0, extent: activeArtboard.width }, // Artboard Bottom
      { value: activeArtboard.height / 2, origin: 0, extent: activeArtboard.width }, // Artboard Center
    ];

    allLayers.forEach((l) => {
      if (movingIds.has(l.id) || l.locked || !l.visible || l.groupId) {
        return;
      }
      const w = (l as any).width || 0;
      const h = (l as any).height || 0;

      // X Targets
      targetsX.push({ value: l.x, origin: l.y, extent: h });
      targetsX.push({ value: l.x + w, origin: l.y, extent: h });
      targetsX.push({ value: l.x + w / 2, origin: l.y, extent: h });

      // Y Targets
      targetsY.push({ value: l.y, origin: l.x, extent: w });
      targetsY.push({ value: l.y + h, origin: l.x, extent: w });
      targetsY.push({ value: l.y + h / 2, origin: l.x, extent: w });
    });

    const adjustedThreshold = threshold / zoom;

    // 3. Find closest snaps for X
    let bestDiffX = adjustedThreshold;
    const selectionXEdges = [minX, maxX, selectionCenterX];

    selectionXEdges.forEach((edge) => {
      targetsX.forEach((target) => {
        const diff = Math.abs(edge - target.value);
        if (diff < bestDiffX) {
          bestDiffX = diff;
          result.x = target.value - (edge - minX);
          result.lines = result.lines.filter((l) => l.type !== 'vertical');
          result.lines.push({
            type: 'vertical',
            value: target.value,
            origin: Math.min(minY, target.origin),
            extent: Math.max(maxY, target.origin + target.extent) - Math.min(minY, target.origin),
          });
        }
      });
    });

    // 4. Find closest snaps for Y
    let bestDiffY = adjustedThreshold;
    const selectionYEdges = [minY, maxY, selectionCenterY];

    selectionYEdges.forEach((edge) => {
      targetsY.forEach((target) => {
        const diff = Math.abs(edge - target.value);
        if (diff < bestDiffY) {
          bestDiffY = diff;
          result.y = target.value - (edge - minY);
          result.lines = result.lines.filter((l) => l.type !== 'horizontal');
          result.lines.push({
            type: 'horizontal',
            value: target.value,
            origin: Math.min(minX, target.origin),
            extent: Math.max(maxX, target.origin + target.extent) - Math.min(minX, target.origin),
          });
        }
      });
    });

    return result;
  }
}
