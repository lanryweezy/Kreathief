import { Layer, AutoLayoutSettings, GroupLayer, Artboard } from '../types';

/**
 * Recalculates layer bounds for groups that have Auto Layout enabled.
 * This runs iteratively from the deepest nested auto-layout groups up to the root.
 *
 * @param layers The complete flat list of layers for the artboard
 * @returns A new array of layers with updated positioning and dimensions
 */
export const resolveAutoLayouts = (layers: Layer[]): Layer[] => {
  // We need to resolve from bottom-up (innermost groups first).
  // 1. Identify all layers that belong to a group with Auto Layout.
  // 2. Identify all groups that HAVE Auto Layout.

  const layerMap = new Map<string, Layer>();
  layers.forEach((l) => layerMap.set(l.id, { ...l }));

  const groupsWithAutoLayout = layers.filter(
    (l): l is GroupLayer => l.type === 'group' && !!l.autoLayout
  );

  // Simple heuristic for bottom-up: sort by depth if we had a tree, 
  // but we can just resolve iteratively. Since we only have one-level groups typically 
  // or flat layers pointing to groupId, we can just process all groups.
  // In a true deep tree, we'd build a dependency graph.

  groupsWithAutoLayout.forEach((group) => {
    const settings = group.autoLayout!;
    const children = group.children
      .map((childId) => layerMap.get(childId))
      .filter((l): l is Layer => !!l && l.visible); // Only layout visible children

    if (children.length === 0) return;

    // Parse padding
    let pt = 0, pr = 0, pb = 0, pl = 0;
    if (typeof settings.padding === 'number') {
      pt = pr = pb = pl = settings.padding;
    } else if (settings.padding) {
      pt = settings.padding.top || 0;
      pr = settings.padding.right || 0;
      pb = settings.padding.bottom || 0;
      pl = settings.padding.left || 0;
    }

    const spacing = settings.spacing || 0;
    const isRow = settings.direction === 'row';

    // 1. Calculate the intrinsic sizes of children (assuming fixed/hug for now)
    // and total content size
    let currentX = pl;
    let currentY = pt;
    let maxCrossSize = 0;
    
    // We will collect the bounding box of the contents
    let contentWidth = 0;
    let contentHeight = 0;

    children.forEach((child, index) => {
      // Calculate child's new position
      if (isRow) {
        child.x = group.x + currentX;
        // Cross axis alignment (start, center, end)
        if (settings.alignment === 'center') {
           // We will fix cross-axis alignment after finding max cross size
        } else if (settings.alignment === 'end') {
           // Wait for maxCrossSize
        } else {
           child.y = group.y + currentY; // start
        }

        currentX += child.width + (index < children.length - 1 ? spacing : 0);
        maxCrossSize = Math.max(maxCrossSize, child.height);
      } else {
        child.y = group.y + currentY;
        // Cross axis alignment
        if (settings.alignment === 'start') {
           child.x = group.x + currentX;
        }

        currentY += child.height + (index < children.length - 1 ? spacing : 0);
        maxCrossSize = Math.max(maxCrossSize, child.width);
      }
    });

    contentWidth = isRow ? currentX + pr : maxCrossSize + pl + pr;
    contentHeight = !isRow ? currentY + pb : maxCrossSize + pt + pb;

    // 2. Second pass: Cross axis alignment
    children.forEach((child) => {
      if (isRow) {
        if (settings.alignment === 'center' || settings.alignment === 'space-around' || settings.alignment === 'space-evenly') {
          child.y = group.y + pt + (maxCrossSize - child.height) / 2;
        } else if (settings.alignment === 'end') {
          child.y = group.y + pt + maxCrossSize - child.height;
        }
      } else {
        if (settings.alignment === 'center' || settings.alignment === 'space-around' || settings.alignment === 'space-evenly') {
          child.x = group.x + pl + (maxCrossSize - child.width) / 2;
        } else if (settings.alignment === 'end') {
          child.x = group.x + pl + maxCrossSize - child.width;
        }
      }
    });

    // 3. Resize group container if 'hug'
    const sizingWidth = settings.sizing?.width || 'hug';
    const sizingHeight = settings.sizing?.height || 'hug';

    if (sizingWidth === 'hug') {
      group.width = contentWidth;
    }
    if (sizingHeight === 'hug') {
      group.height = contentHeight;
    }
    
    // Save updated group back to map
    layerMap.set(group.id, group);
    children.forEach(c => layerMap.set(c.id, c));
  });

  return Array.from(layerMap.values());
};
