import { Layer, Artboard } from '../types';

export interface SnapLine {
  type: 'vertical' | 'horizontal';
  value: number;
  origin: number;
  extent: number;
}

export interface SnapResult {
  x: number | null;
  y: number | null;
  lines: SnapLine[];
}

interface SortedTarget {
  value: number;
  origin: number;
  extent: number;
}

let cachedArtboardId: string | null = null;
let cachedLayerCount = -1;
let cachedLayerPositions: string | null = null;
let cachedSortedX: SortedTarget[] = [];
let cachedSortedY: SortedTarget[] = [];

function buildTargets(
  allLayers: Layer[],
  movingIds: Set<string>,
  activeArtboard: Artboard
): { sortedX: SortedTarget[]; sortedY: SortedTarget[] } {
  const targetsX: SortedTarget[] = [
    { value: 0, origin: 0, extent: activeArtboard.height },
    { value: activeArtboard.width, origin: 0, extent: activeArtboard.height },
    { value: activeArtboard.width / 2, origin: 0, extent: activeArtboard.height },
  ];

  const targetsY: SortedTarget[] = [
    { value: 0, origin: 0, extent: activeArtboard.width },
    { value: activeArtboard.height, origin: 0, extent: activeArtboard.width },
    { value: activeArtboard.height / 2, origin: 0, extent: activeArtboard.width },
  ];

  for (const l of allLayers) {
    if (movingIds.has(l.id) || l.locked || !l.visible || l.groupId) continue;
    const w = (l as any).width || 0;
    const h = (l as any).height || 0;

    targetsX.push({ value: l.x, origin: l.y, extent: h });
    targetsX.push({ value: l.x + w, origin: l.y, extent: h });
    targetsX.push({ value: l.x + w / 2, origin: l.y, extent: h });

    targetsY.push({ value: l.y, origin: l.x, extent: w });
    targetsY.push({ value: l.y + h, origin: l.x, extent: w });
    targetsY.push({ value: l.y + h / 2, origin: l.x, extent: w });
  }

  targetsX.sort((a, b) => a.value - b.value);
  targetsY.sort((a, b) => a.value - b.value);

  return { sortedX: targetsX, sortedY: targetsY };
}

function binarySearchLower(arr: SortedTarget[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].value < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function findBestSnap(
  sorted: SortedTarget[],
  edges: number[],
  threshold: number
): { bestEdge: number; bestTarget: SortedTarget; bestDiff: number } | null {
  let bestDiff = threshold;
  let bestEdgeIdx = -1;
  let bestTargetIdx = -1;

  for (let e = 0; e < edges.length; e++) {
    const edge = edges[e];
    const lo = binarySearchLower(sorted, edge - threshold);
    const hi = binarySearchLower(sorted, edge + threshold);

    for (let i = lo; i < hi; i++) {
      const diff = Math.abs(edge - sorted[i].value);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestEdgeIdx = e;
        bestTargetIdx = i;
      }
    }
  }

  if (bestEdgeIdx === -1) return null;
  return { bestEdge: bestEdgeIdx, bestTarget: sorted[bestTargetIdx], bestDiff };
}

export class SnappingOracle {
  static calculateSnaps(
    movingLayers: Layer[],
    allLayers: Layer[],
    activeArtboard: Artboard,
    threshold: number = 5,
    zoom: number = 1
  ): SnapResult {
    const result: SnapResult = { x: null, y: null, lines: [] };
    if (movingLayers.length === 0) return result;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const l of movingLayers) {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      const w = (l as any).width || 0;
      const h = (l as any).height || 0;
      maxX = Math.max(maxX, l.x + w);
      maxY = Math.max(maxY, l.y + h);
    }

    const selectionWidth = maxX - minX;
    const selectionHeight = maxY - minY;

    const movingIds = new Set(movingLayers.map((l) => l.id));
    const layerCount = allLayers.length;
    const layerPositionHash = allLayers.map((l) => `${l.id}:${l.x}:${l.y}`).join(',');

    if (cachedArtboardId !== activeArtboard.id || cachedLayerCount !== layerCount || cachedLayerPositions !== layerPositionHash) {
      const targets = buildTargets(allLayers, movingIds, activeArtboard);
      cachedSortedX = targets.sortedX;
      cachedSortedY = targets.sortedY;
      cachedArtboardId = activeArtboard.id;
      cachedLayerCount = layerCount;
      cachedLayerPositions = layerPositionHash;
    }

    const adjustedThreshold = threshold / zoom;
    const selectionXEdges = [minX, maxX, minX + selectionWidth / 2];
    const selectionYEdges = [minY, maxY, minY + selectionHeight / 2];

    const xSnap = findBestSnap(cachedSortedX, selectionXEdges, adjustedThreshold);
    if (xSnap) {
      result.x = xSnap.bestTarget.value - (selectionXEdges[xSnap.bestEdge] - minX);
      result.lines.push({
        type: 'vertical',
        value: xSnap.bestTarget.value,
        origin: Math.min(minY, xSnap.bestTarget.origin),
        extent:
          Math.max(maxY, xSnap.bestTarget.origin + xSnap.bestTarget.extent) - Math.min(minY, xSnap.bestTarget.origin),
      });
    }

    const ySnap = findBestSnap(cachedSortedY, selectionYEdges, adjustedThreshold);
    if (ySnap) {
      result.y = ySnap.bestTarget.value - (selectionYEdges[ySnap.bestEdge] - minY);
      result.lines.push({
        type: 'horizontal',
        value: ySnap.bestTarget.value,
        origin: Math.min(minX, ySnap.bestTarget.origin),
        extent:
          Math.max(maxX, ySnap.bestTarget.origin + ySnap.bestTarget.extent) - Math.min(minX, ySnap.bestTarget.origin),
      });
    }

    return result;
  }

  static invalidateCache(): void {
    cachedArtboardId = null;
    cachedLayerCount = -1;
  }
}
