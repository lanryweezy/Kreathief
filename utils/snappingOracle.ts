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

    // 3. FIX: Find closest snaps for X - track best snap separately
    let bestDiffX = adjustedThreshold;
    let bestSnapX: { value: number; origin: number; extent: number } | null = null;
    const selectionXEdges = [minX, maxX, selectionCenterX];

    selectionXEdges.forEach((edge) => {
      targetsX.forEach((target) => {
        const diff = Math.abs(edge - target.value);
        if (diff < bestDiffX) {
          bestDiffX = diff;
          bestSnapX = target;
          result.x = target.value - (edge - minX);
        }
      });
    });

    // FIX: Add snap line AFTER finding best snap (not during iteration)
    if (bestSnapX) {
      const snap = bestSnapX as any;
      result.lines.push({
        type: 'vertical',
        value: snap.value,
        origin: Math.min(minY, snap.origin),
        extent: Math.max(maxY, snap.origin + snap.extent) - Math.min(minY, snap.origin),
      });
    }

    // 4. FIX: Find closest snaps for Y - track best snap separately
    let bestDiffY = adjustedThreshold;
    let bestSnapY: { value: number; origin: number; extent: number } | null = null;
    const selectionYEdges = [minY, maxY, selectionCenterY];

    selectionYEdges.forEach((edge) => {
      targetsY.forEach((target) => {
        const diff = Math.abs(edge - target.value);
        if (diff < bestDiffY) {
          bestDiffY = diff;
          bestSnapY = target;
          result.y = target.value - (edge - minY);
        }
      });
    });

    // FIX: Add snap line AFTER finding best snap (not during iteration)
    if (bestSnapY) {
      const snap = bestSnapY as any;
      result.lines.push({
        type: 'horizontal',
        value: snap.value,
        origin: Math.min(minX, snap.origin),
        extent: Math.max(maxX, snap.origin + snap.extent) - Math.min(minX, snap.origin),
      });
    }

    return result;
  }
}
