import { Layer, AutoLayoutSettings } from '../types';

/**
 * Compute auto-layout positions for direct children of a group layer.
 * Returns a map of layerId -> { x, y, width?, height? } overrides.
 * Note: This only computes layout for DIRECT children.
 */
export function computeAutoLayout(
  parentLayer: Layer,
  children: Layer[],
  allLayers: Layer[]
): Record<string, { x: number; y: number; width?: number; height?: number }> {
  const layout = parentLayer.autoLayout;
  if (!layout || !children.length) {
    return {};
  }

  const updates: Record<string, { x: number; y: number; width?: number; height?: number }> = {};
  
  // Parse padding
  let pt = 0, pr = 0, pb = 0, pl = 0;
  if (typeof layout.padding === 'number') {
    pt = pr = pb = pl = layout.padding;
  } else if (layout.padding) {
    pt = layout.padding.top || 0;
    pr = layout.padding.right || 0;
    pb = layout.padding.bottom || 0;
    pl = layout.padding.left || 0;
  }

  const spacing = layout.spacing || 0;
  const isRow = layout.direction === 'row';
  const alignment = layout.alignment || 'start';

  // Compute total size of all children
  let totalAxisSize = 0;
  let maxCrossSize = 0;

  // We only care about DIRECT children. If a child is an auto-layout group itself,
  // it should already have been laid out (if we compute bottom-up), 
  // or it will be laid out. We use its current width/height.
  const sizes = children.map((child) => {
    const w = Number((child as any).width) || 100;
    const h = Number((child as any).height) || 100;
    totalAxisSize += isRow ? w : h;
    maxCrossSize = Math.max(maxCrossSize, isRow ? h : w);
    return { w, h };
  });

  totalAxisSize += spacing * Math.max(0, children.length - 1);

  // Compute parent's inner dimensions based on sizing.
  const sizing = layout.sizing;
  const isWidthHug = sizing?.width === 'hug';
  const isHeightHug = sizing?.height === 'hug';

  // Declared parent box drives child placement
  let parentW = Number((parentLayer as any).width) || 100;
  let parentH = Number((parentLayer as any).height) || 100;

  // Hugged resize updates the parent's own size
  const huggedW = isRow ? totalAxisSize + pl + pr : maxCrossSize + pl + pr;
  const huggedH = isRow ? maxCrossSize + pt + pb : totalAxisSize + pt + pb;
  
  if (isWidthHug) parentW = huggedW;
  if (isHeightHug) parentH = huggedH;

  // Position children along the main axis
  let cursorX = pl;
  let cursorY = pt;
  
  // Handle space-between, space-around, space-evenly for main axis
  let actualSpacing = spacing;
  const availableMainSpace = isRow ? (parentW - pl - pr - totalAxisSize + (spacing * (children.length - 1))) : (parentH - pt - pb - totalAxisSize + (spacing * (children.length - 1)));
  
  if (alignment === 'space-between' && children.length > 1) {
     actualSpacing = availableMainSpace / (children.length - 1);
  } else if (alignment === 'space-around' && children.length > 0) {
     actualSpacing = availableMainSpace / children.length;
     if (isRow) cursorX += actualSpacing / 2;
     else cursorY += actualSpacing / 2;
  } else if (alignment === 'space-evenly' && children.length > 0) {
     actualSpacing = availableMainSpace / (children.length + 1);
     if (isRow) cursorX += actualSpacing;
     else cursorY += actualSpacing;
  } else if (alignment === 'center') {
     if (isRow) cursorX += availableMainSpace / 2;
     else cursorY += availableMainSpace / 2;
  } else if (alignment === 'end') {
     if (isRow) cursorX += availableMainSpace;
     else cursorY += availableMainSpace;
  }

  children.forEach((child, i) => {
    let { w, h } = sizes[i];
    
    // Process fill sizing for children
    const childSizing = child.autoLayout?.sizing;
    let overrideWidth, overrideHeight;
    
    if (childSizing) {
      if (isRow && childSizing.width === 'fill') {
        const fillChildrenCount = children.filter(l => l.autoLayout?.sizing?.width === 'fill').length;
        if (fillChildrenCount > 0) {
           const occupiedSpace = totalAxisSize - w - (spacing * (children.length - 1));
           w = Math.max(0, (parentW - pl - pr - occupiedSpace - (actualSpacing * (children.length - 1))) / fillChildrenCount);
           overrideWidth = w;
        }
      }
      if (!isRow && childSizing.height === 'fill') {
        const fillChildrenCount = children.filter(l => l.autoLayout?.sizing?.height === 'fill').length;
        if (fillChildrenCount > 0) {
           const occupiedSpace = totalAxisSize - h - (spacing * (children.length - 1));
           h = Math.max(0, (parentH - pt - pb - occupiedSpace - (actualSpacing * (children.length - 1))) / fillChildrenCount);
           overrideHeight = h;
        }
      }
      if (isRow && childSizing.height === 'fill') {
        h = parentH - pt - pb;
        overrideHeight = h;
      }
      if (!isRow && childSizing.width === 'fill') {
        w = parentW - pl - pr;
        overrideWidth = w;
      }
    }

    let x: number, y: number;

    if (isRow) {
      x = cursorX;
      if (alignment === 'start') {
        y = pt;
      } else if (alignment === 'end') {
        y = parentH - pb - h;
      } else {
        y = pt + ((parentH - pt - pb) - h) / 2;
      }
      cursorX += w + actualSpacing;
    } else {
      y = cursorY;
      if (alignment === 'start') {
        x = pl;
      } else if (alignment === 'end') {
        x = parentW - pr - w;
      } else {
        x = pl + ((parentW - pl - pr) - w) / 2;
      }
      cursorY += h + actualSpacing;
    }

    updates[child.id] = {
      x: (parentLayer.x || 0) + x,
      y: (parentLayer.y || 0) + y,
      ...(overrideWidth !== undefined ? { width: overrideWidth } : {}),
      ...(overrideHeight !== undefined ? { height: overrideHeight } : {})
    } as any;
  });

  // Apply parent resizing
  const parentUpdates: any = {};
  if (isWidthHug) parentUpdates.width = huggedW;
  if (isHeightHug) parentUpdates.height = huggedH;
  
  if (Object.keys(parentUpdates).length > 0) {
    (updates as any)[parentLayer.id] = parentUpdates;
  }

  return updates;
}

/**
 * Check if any layer in the tree has auto-layout enabled.
 */
export function hasAutoLayoutTree(layers: Layer[]): boolean {
  return layers.some((l) => !!l.autoLayout);
}
