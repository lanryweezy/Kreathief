import { Layer } from '../types';

export interface AutoLayoutConfig {
  direction: 'row' | 'col';
  padding: number;
  spacing: number;
  alignment: 'start' | 'center' | 'end';
}

/**
 * Compute auto-layout positions for children of a group layer.
 * Returns a map of layerId -> { x, y } overrides.
 */
export function computeAutoLayout(
  parentLayer: Layer,
  children: Layer[],
  allLayers: Layer[]
): Record<string, { x: number; y: number }> {
  const layout = parentLayer.autoLayout;
  if (!layout || !children.length) return {};

  const updates: Record<string, { x: number; y: number }> = {};
  const padding = layout.padding || 0;
  const spacing = layout.spacing || 0;
  const isRow = layout.direction === 'row';
  const alignment = layout.alignment || 'center';

  // Recursively find all descendant leaves (non-group layers)
  const leaves = collectLeaves(children, allLayers);

  // Compute total size of all children
  let totalAxisSize = 0;
  let maxCrossSize = 0;

  const sizes = leaves.map((child) => {
    const w = (child as any).width || 100;
    const h = (child as any).height || 100;
    totalAxisSize += isRow ? w : h;
    maxCrossSize = Math.max(maxCrossSize, isRow ? h : w);
    return { w, h };
  });

  totalAxisSize += spacing * Math.max(0, leaves.length - 1);

  // Compute parent's inner dimensions
  const parentW = (parentLayer as any).width || totalAxisSize + padding * 2;
  const parentH = (parentLayer as any).height || maxCrossSize + padding * 2;

  // Position children along the main axis
  let cursor = padding;

  leaves.forEach((child, i) => {
    const { w, h } = sizes[i];
    let x: number, y: number;

    if (isRow) {
      x = cursor;
      // Cross-axis alignment
      switch (alignment) {
        case 'start':
          y = padding;
          break;
        case 'end':
          y = parentH - padding - h;
          break;
        case 'center':
        default:
          y = (parentH - h) / 2;
          break;
      }
      cursor += w + spacing;
    } else {
      y = cursor;
      // Cross-axis alignment
      switch (alignment) {
        case 'start':
          x = padding;
          break;
        case 'end':
          x = parentW - padding - w;
          break;
        case 'center':
        default:
          x = (parentW - w) / 2;
          break;
      }
      cursor += h + spacing;
    }

    // Offset by parent position
    updates[child.id] = {
      x: (parentLayer.x || 0) + x,
      y: (parentLayer.y || 0) + y,
    };
  });

  // Resize parent to fit if needed
  const totalContentSize = cursor - spacing;
  if (isRow) {
    updates[parentLayer.id] = {
      x: parentLayer.x,
      y: parentLayer.y,
      width: totalContentSize + padding,
      height: parentH,
    } as any;
  } else {
    updates[parentLayer.id] = {
      x: parentLayer.x,
      y: parentLayer.y,
      width: parentW,
      height: totalContentSize + padding,
    } as any;
  }

  return updates;
}

/**
 * Collect all leaf (non-group) layers from a set of children, recursively.
 */
function collectLeaves(children: Layer[], allLayers: Layer[]): Layer[] {
  const leaves: Layer[] = [];
  for (const child of children) {
    if (child.autoLayout) {
      // This child is itself an auto-layout group — recurse
      const grandChildren = allLayers.filter((l) => l.groupId === child.id);
      leaves.push(...collectLeaves(grandChildren, allLayers));
    } else {
      leaves.push(child);
    }
  }
  return leaves;
}

/**
 * Check if any layer in the tree has auto-layout enabled.
 */
export function hasAutoLayoutTree(layers: Layer[]): boolean {
  return layers.some((l) => !!l.autoLayout);
}
