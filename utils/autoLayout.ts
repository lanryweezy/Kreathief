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
  if (!layout || !children.length) {
    return {};
  }

  const updates: Record<string, { x: number; y: number }> = {};
  const pad = typeof layout.padding === 'number' ? layout.padding : 0;
  const spacing = layout.spacing || 0;
  const isRow = layout.direction === 'row';
  const alignment = layout.alignment || 'center';

  // Recursively find all descendant leaves (non-group layers)
  const leaves = collectLeaves(children, allLayers);

  // Compute total size of all children
  let totalAxisSize = 0;
  let maxCrossSize = 0;

  const sizes = leaves.map((child) => {
    const w = Number((child as any).width) || 100;
    const h = Number((child as any).height) || 100;
    totalAxisSize += isRow ? w : h;
    maxCrossSize = Math.max(maxCrossSize, isRow ? h : w);
    return { w, h };
  });

  totalAxisSize += spacing * Math.max(0, leaves.length - 1);

  // Compute parent's inner dimensions
  const parentW = Number((parentLayer as any).width) || totalAxisSize + pad * 2;
  const parentH = Number((parentLayer as any).height) || maxCrossSize + pad * 2;

  // Position children along the main axis
  let cursor = pad;

  leaves.forEach((child, i) => {
    const { w, h } = sizes[i];
    let x: number, y: number;

    if (isRow) {
      x = cursor;
      switch (alignment) {
        case 'start':
          y = pad;
          break;
        case 'end':
          y = parentH - pad - h;
          break;
        case 'center':
        default:
          y = (parentH - h) / 2;
          break;
      }
      cursor += w + spacing;
    } else {
      y = cursor;
      switch (alignment) {
        case 'start':
          x = pad;
          break;
        case 'end':
          x = parentW - pad - w;
          break;
        case 'center':
        default:
          x = (parentW - w) / 2;
          break;
      }
      cursor += h + spacing;
    }

    updates[child.id] = {
      x: (parentLayer.x || 0) + x,
      y: (parentLayer.y || 0) + y,
    };
  });

  // Resize parent to fit if needed
  const totalContentSize = cursor - spacing;
  if (isRow) {
    (updates as any)[parentLayer.id] = {
      width: totalContentSize + pad,
      height: maxCrossSize + pad * 2,
    };
  } else {
    (updates as any)[parentLayer.id] = {
      width: maxCrossSize + pad * 2,
      height: totalContentSize + pad,
    };
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
