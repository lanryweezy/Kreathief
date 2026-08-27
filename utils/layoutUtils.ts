import { Layer } from '../types';

export type AlignmentType = 'left' | 'h-center' | 'right' | 'top' | 'v-center' | 'bottom';
export type DistributionType = 'h-spacing' | 'v-spacing' | 'h-center' | 'v-center';

/**
 * Aligns a set of layers relative to their selection bounding box or the canvas.
 */
export const alignLayers = (
  layers: Layer[],
  type: AlignmentType,
  canvasSize: { width: number; height: number },
  forceCanvas: boolean = false
): { id: string; changes: Partial<Layer> }[] => {
  if (layers.length === 0) {
    return [];
  }

  // If only one layer OR forceCanvas is true, align to canvas.
  // If multiple and not forced, align to their common bounding box.
  const useCanvas = forceCanvas || layers.length === 1;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  layers.forEach((l) => {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x + l.width);
    maxY = Math.max(maxY, l.y + l.height || l.width); // Fallback for height
  });

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;

  return layers.map((l) => {
    const h = l.height || l.width;
    let newX = l.x;
    let newY = l.y;

    switch (type) {
      case 'left':
        newX = useCanvas ? 0 : minX;
        break;
      case 'h-center':
        newX = useCanvas ? (canvasSize.width - l.width) / 2 : minX + (boxWidth - l.width) / 2;
        break;
      case 'right':
        newX = useCanvas ? canvasSize.width - l.width : maxX - l.width;
        break;
      case 'top':
        newY = useCanvas ? 0 : minY;
        break;
      case 'v-center':
        newY = useCanvas ? (canvasSize.height - h) / 2 : minY + (boxHeight - h) / 2;
        break;
      case 'bottom':
        newY = useCanvas ? canvasSize.height - h : maxY - h;
        break;
    }

    return { id: l.id, changes: { x: newX, y: newY } };
  });
};

/**
 * Distributes layers evenly based on their spacing.
 */
export const distributeLayers = (
  layers: Layer[],
  type: DistributionType
): { id: string; changes: Partial<Layer> }[] => {
  if (layers.length < 3) {
    return [];
  }

  const result: { id: string; changes: Partial<Layer> }[] = [];

  if (type === 'h-spacing') {
    const sorted = [...layers].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Simple equal gap distribution:
    const totalGaps = sorted.length - 1;
    const span = last.x + last.width - first.x;
    const totalContentWidth = sorted.reduce((sum, l) => sum + l.width, 0);
    const gap = (span - totalContentWidth) / totalGaps;

    let currentX = first.x;
    sorted.forEach((l, i) => {
      if (i > 0 && i < sorted.length - 1) {
        result.push({ id: l.id, changes: { x: currentX } });
      }
      currentX += l.width + gap;
    });
  } else if (type === 'v-spacing') {
    const sorted = [...layers].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalGaps = sorted.length - 1;
    const hLast = last.height || last.width;
    const span = last.y + hLast - first.y;
    const totalContentHeight = sorted.reduce((sum, l) => sum + (l.height || l.width), 0);
    const gap = (span - totalContentHeight) / totalGaps;

    let currentY = first.y;
    sorted.forEach((l, i) => {
      const h = l.height || l.width;
      if (i > 0 && i < sorted.length - 1) {
        result.push({ id: l.id, changes: { y: currentY } });
      }
      currentY += h + gap;
    });
  } else if (type === 'h-center') {
    const sorted = [...layers].sort((a, b) => a.x + a.width / 2 - (b.x + b.width / 2));
    if (sorted.length < 2) {
      return [];
    }
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = last.x + last.width / 2 - (first.x + first.width / 2);
    const interval = span / (sorted.length - 1);

    sorted.forEach((l, i) => {
      if (i > 0 && i < sorted.length - 1) {
        const targetCenter = first.x + first.width / 2 + i * interval;
        result.push({ id: l.id, changes: { x: targetCenter - l.width / 2 } });
      }
    });
  } else if (type === 'v-center') {
    const sorted = [...layers].sort(
      (a, b) => a.y + (a.height || a.width) / 2 - (b.y + (b.height || b.width) / 2)
    );
    if (sorted.length < 2) {
      return [];
    }
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const hFirst = first.height || first.width;
    const hLast = last.height || last.width;
    const span = last.y + hLast / 2 - (first.y + hFirst / 2);
    const interval = span / (sorted.length - 1);

    sorted.forEach((l, i) => {
      const h = l.height || l.width;
      if (i > 0 && i < sorted.length - 1) {
        const targetCenter = first.y + hFirst / 2 + i * interval;
        result.push({ id: l.id, changes: { y: targetCenter - h / 2 } });
      }
    });
  }

  return result;
};

/**
 * Automatically organizes layers into a neat grid.
 */
export const tidyUpLayers = (layers: Layer[]): { id: string; changes: Partial<Layer> }[] => {
  if (layers.length < 2) {
    return [];
  }

  const count = layers.length;

  // Find general bounds of current selection
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  layers.forEach((l) => {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x + l.width);
    maxY = Math.max(maxY, l.y + (l.height || l.width));
  });

  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;

  // Sort layers by their current position to preserve relative order (top-to-bottom, left-to-right)
  const sorted = [...layers].sort((a, b) => {
    const rowA = Math.round(a.y / 50);
    const rowB = Math.round(b.y / 50);
    if (rowA !== rowB) {
      return rowA - rowB;
    }
    return a.x - b.x;
  });

  // Adaptive grid: if width is much larger than height, prefer more columns
  const aspectRatio = totalWidth / (totalHeight || 1);
  let cols = Math.ceil(Math.sqrt(count * aspectRatio));
  cols = Math.max(1, Math.min(count, cols));

  const horizontalSpacing = Math.max(20, (totalWidth - cols * 100) / Math.max(1, cols - 1));
  const verticalSpacing = 40;

  let currentX = minX;
  let currentY = minY;
  let maxHeightInRow = 0;

  return sorted.map((l, i) => {
    const colIndex = i % cols;

    if (colIndex === 0 && i !== 0) {
      currentX = minX;
      currentY += maxHeightInRow + verticalSpacing;
      maxHeightInRow = 0;
    }

    const h = l.height || l.width;
    maxHeightInRow = Math.max(maxHeightInRow, h);

    const result = {
      id: l.id,
      changes: {
        x: currentX,
        y: currentY,
      },
    };

    currentX += l.width + horizontalSpacing;
    return result;
  });
};

/**
 * Resolves high-level constraints into precise coordinates.
 */
export const resolveConstraints = (
  layer: Partial<Layer>,
  canvasSize: { width: number; height: number }
): { x: number; y: number; width?: number; height?: number } => {
  const { x = 0, y = 0, width = 100, constraints = { horizontal: 'start', vertical: 'start' } } = layer;
  const height = layer.height || 100;

  const resolved = { x, y };

  if (constraints.horizontal === 'scale' && constraints.vertical === 'scale') {
    return { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height };
  }

  if (constraints.horizontal === 'center') {
    resolved.x = (canvasSize.width - width) / 2;
  } else if (constraints.horizontal === 'start') {
    // default, usually handled by absolute positioning but we can pin it
    resolved.x = 20;
  } else if (constraints.horizontal === 'end') {
    resolved.x = canvasSize.width - width - 20;
  }

  if (constraints.vertical === 'center') {
    resolved.y = (canvasSize.height - height) / 2;
  } else if (constraints.vertical === 'start') {
    resolved.y = 20;
  } else if (constraints.vertical === 'end') {
    resolved.y = canvasSize.height - height - 20;
  }

  return resolved;
};

/**
 * Translates simple AI constraints into structured LayerBase constraints.
 */
export const resolveSemanticConstraints = (
  simpleConstraints: string[]
): {
  horizontal: 'start' | 'end' | 'center' | 'scale' | 'both';
  vertical: 'start' | 'end' | 'center' | 'scale' | 'both';
} => {
  const result: {
    horizontal: 'start' | 'end' | 'center' | 'scale' | 'both';
    vertical: 'start' | 'end' | 'center' | 'scale' | 'both';
  } = { horizontal: 'start', vertical: 'start' };

  if (simpleConstraints.includes('center-h')) {
    result.horizontal = 'center';
  }
  if (simpleConstraints.includes('pin-right')) {
    result.horizontal = 'end';
  }
  if (simpleConstraints.includes('fill')) {
    result.horizontal = 'scale';
  }

  if (simpleConstraints.includes('center-v')) {
    result.vertical = 'center';
  }
  if (simpleConstraints.includes('pin-bottom')) {
    result.vertical = 'end';
  }
  if (simpleConstraints.includes('fill')) {
    result.vertical = 'scale';
  }

  return result;
};
