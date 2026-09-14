import { Layer, TextLayer, AutoLayoutSettings } from '../types';

export interface AutoLayoutPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function normalizePadding(
  padding: number | { top: number; right: number; bottom: number; left: number } | undefined
): AutoLayoutPadding {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  if (padding && typeof padding === 'object') {
    return {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0,
    };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

/**
 * Computes positions for children in an auto-layout container.
 */
export function computeAutoLayout(
  parent: Layer,
  children: Layer[],
  allLayers: Layer[] = []
): Record<string, { x: number; y: number; width?: number; height?: number }> {
  if (!parent.autoLayout || !children || children.length === 0) {
    return {};
  }

  const layout = parent.autoLayout;
  const pad = normalizePadding(layout.padding);
  const spacing = layout.spacing || 0;
  const isRow = layout.direction === 'row';
  const alignment = layout.alignment || 'center';

  const result: Record<string, { x: number; y: number; width?: number; height?: number }> = {};
  let cursorX = pad.left;
  let cursorY = pad.top;

  for (const child of children) {
    const cw = child.width || 100;
    const ch = child.height || 50;

    let relX = 0;
    let relY = 0;

    if (isRow) {
      relX = cursorX;
      if (alignment === 'start') {
        relY = pad.top;
      } else if (alignment === 'end') {
        relY = (parent.height || 0) - pad.bottom - ch;
      } else {
        relY = pad.top + ((parent.height || 0) - pad.top - pad.bottom - ch) / 2;
      }
      cursorX += cw + spacing;
    } else {
      relY = cursorY;
      if (alignment === 'start') {
        relX = pad.left;
      } else if (alignment === 'end') {
        relX = (parent.width || 0) - pad.right - cw;
      } else {
        relX = pad.left + ((parent.width || 0) - pad.left - pad.right - cw) / 2;
      }
      cursorY += ch + spacing;
    }

    result[child.id] = {
      x: parent.x + relX,
      y: parent.y + relY,
      width: cw,
      height: ch,
    };
  }

  return result;
}

/**
 * Traverses layer hierarchy and applies auto layout positioning and sizing recursively.
 */
export function applyAutoLayout(layers: Layer[]): Layer[] {
  const nextLayers = [...layers];
  const layerMap = new Map<string, Layer>();
  const childrenMap = new Map<string, Layer[]>();

  nextLayers.forEach((l) => {
    layerMap.set(l.id, l);
    if (l.groupId) {
      if (!childrenMap.has(l.groupId)) {
        childrenMap.set(l.groupId, []);
      }
      childrenMap.get(l.groupId)!.push(l);
    }
  });

  const processed = new Set<string>();

  // Post-order size calculation (hug contents)
  function computeSize(layerId: string) {
    if (processed.has(layerId)) return;
    processed.add(layerId);

    const layer = layerMap.get(layerId);
    if (!layer) return;

    const children = childrenMap.get(layerId) || [];
    children.forEach((c) => computeSize(c.id));

    if (layer.type === 'group' && layer.autoLayout) {
      const layout = layer.autoLayout;
      const pad = normalizePadding(layout.padding);
      const spacing = layout.spacing || 0;
      const isRow = layout.direction === 'row';

      const sizing = layout.sizing;
      const isWidthHug = !sizing || sizing.width === 'hug';
      const isHeightHug = !sizing || sizing.height === 'hug';

      let totalAxisSize = 0;
      let maxCrossSize = 0;

      children.forEach((c) => {
        const cw =
          c.width ||
          (c.type === 'text'
            ? (c as TextLayer).fontSize * 0.6 * ((c as TextLayer).text?.length || 1)
            : 100);
        const ch = c.height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 100);
        totalAxisSize += isRow ? cw : ch;
        maxCrossSize = Math.max(maxCrossSize, isRow ? ch : cw);
      });

      totalAxisSize += spacing * Math.max(0, children.length - 1);

      let newW = layer.width || 100;
      let newH = layer.height || 100;

      if (isRow) {
        if (isWidthHug) newW = totalAxisSize + pad.left + pad.right;
        if (isHeightHug) newH = maxCrossSize + pad.top + pad.bottom;
      } else {
        if (isHeightHug) newH = totalAxisSize + pad.top + pad.bottom;
        if (isWidthHug) newW = maxCrossSize + pad.left + pad.right;
      }

      const updated = { ...layer, width: newW, height: newH };
      layerMap.set(layerId, updated);

      const idx = nextLayers.findIndex((l) => l.id === layerId);
      if (idx !== -1) nextLayers[idx] = updated;
    }
  }

  // Pre-order child positioning
  function computePositions(layerId: string, parentX: number, parentY: number) {
    const layer = layerMap.get(layerId);
    if (!layer) return;

    if (layer.type === 'group' && layer.autoLayout) {
      const layout = layer.autoLayout;
      const pad = normalizePadding(layout.padding);
      const spacing = layout.spacing || 0;
      const isRow = layout.direction === 'row';
      const alignment = layout.alignment || 'center';
      const children = childrenMap.get(layerId) || [];

      let cursor = isRow ? pad.left : pad.top;

      let totalAxisSize = 0;
      children.forEach((c) => {
        const cw = c.width || 100;
        const ch = c.height || 100;
        totalAxisSize += isRow ? cw : ch;
      });
      totalAxisSize += spacing * Math.max(0, children.length - 1);

      children.forEach((c) => {
        let cw = c.width || 100;
        let ch = c.height || 100;

        const childSizing = c.autoLayout?.sizing;
        if (childSizing) {
          const fillCount = children.filter((ch) =>
            isRow ? ch.autoLayout?.sizing?.width === 'fill' : ch.autoLayout?.sizing?.height === 'fill'
          ).length;

          if (fillCount > 0) {
            const avail =
              (isRow ? (layer.width || 0) - pad.left - pad.right : (layer.height || 0) - pad.top - pad.bottom) -
              (totalAxisSize - (isRow ? cw : ch));
            if (isRow && childSizing.width === 'fill') cw = Math.max(0, avail / fillCount);
            if (!isRow && childSizing.height === 'fill') ch = Math.max(0, avail / fillCount);
          }
          if (isRow && childSizing.height === 'fill') ch = (layer.height || 0) - pad.top - pad.bottom;
          if (!isRow && childSizing.width === 'fill') cw = (layer.width || 0) - pad.left - pad.right;
        }

        let relX = 0;
        let relY = 0;

        if (isRow) {
          relX = cursor;
          if (alignment === 'start') relY = pad.top;
          else if (alignment === 'end') relY = (layer.height || 0) - pad.bottom - ch;
          else relY = pad.top + ((layer.height || 0) - pad.top - pad.bottom - ch) / 2;
          cursor += cw + spacing;
        } else {
          relY = cursor;
          if (alignment === 'start') relX = pad.left;
          else if (alignment === 'end') relX = (layer.width || 0) - pad.right - cw;
          else relX = pad.left + ((layer.width || 0) - pad.left - pad.right - cw) / 2;
          cursor += ch + spacing;
        }

        const absX = layer.x + relX;
        const absY = layer.y + relY;

        const updatedChild = { ...c, x: absX, y: absY, width: cw, height: ch };
        layerMap.set(c.id, updatedChild);

        const cIdx = nextLayers.findIndex((l) => l.id === c.id);
        if (cIdx !== -1) nextLayers[cIdx] = updatedChild;

        computePositions(c.id, absX, absY);
      });
    } else {
      const children = childrenMap.get(layerId) || [];
      children.forEach((c) => computePositions(c.id, c.x, c.y));
    }
  }

  nextLayers.forEach((l) => {
    if (!l.groupId) computeSize(l.id);
  });

  nextLayers.forEach((l) => {
    if (!l.groupId) computePositions(l.id, l.x, l.y);
  });

  return nextLayers;
}

export function hasAutoLayoutTree(layers: Layer[]): boolean {
  return layers.some((l) => !!l.autoLayout);
}

/**
 * Natural language intent parser for AI design commands.
 * Examples:
 * - "stack vertically with 16px gap"
 * - "align horizontally with 24px spacing and hug contents"
 * - "pin to top and stretch full width"
 */
export function parseLayoutIntent(prompt: string): {
  autoLayout?: Partial<AutoLayoutSettings>;
  constraints?: Layer['constraints'];
} {
  const p = prompt.toLowerCase();
  const result: { autoLayout?: Partial<AutoLayoutSettings>; constraints?: Layer['constraints'] } = {};

  // Parse gap / spacing (e.g. "20px gap" or "gap of 20")
  const spacingMatch = p.match(/(?:(\d+)\s*(?:px)?\s*(?:gap|spacing))|(?:(?:gap|spacing)\s*(?:of)?\s*(\d+))/i);
  const spacing = spacingMatch ? parseInt(spacingMatch[1] || spacingMatch[2], 10) : undefined;

  // Parse padding (e.g. "12px padding" or "padding of 12")
  const paddingMatch = p.match(/(?:(\d+)\s*(?:px)?\s*padding)|(?:padding\s*(?:of)?\s*(\d+))/i);
  const padding = paddingMatch ? parseInt(paddingMatch[1] || paddingMatch[2], 10) : undefined;

  // Parse direction
  const isVertical = p.includes('vertical') || p.includes('stack') || p.includes('column');
  const isHorizontal = p.includes('horizontal') || p.includes('row') || p.includes('side by side');

  if (isVertical || isHorizontal || spacing !== undefined || padding !== undefined) {
    result.autoLayout = {
      direction: isVertical ? 'col' : 'row',
      spacing: spacing ?? 16,
      padding: padding ?? 16,
      alignment: p.includes('start') ? 'start' : p.includes('end') ? 'end' : 'center',
      sizing: {
        width: p.includes('hug') ? 'hug' : p.includes('fill') || p.includes('stretch') ? 'fill' : 'fixed',
        height: p.includes('hug') ? 'hug' : p.includes('fill') || p.includes('stretch') ? 'fill' : 'fixed',
      },
    };
  }

  // Parse constraints
  const horizontalConstraint = p.includes('stretch full width') || p.includes('full width')
    ? 'both'
    : p.includes('pin to right') || p.includes('align right')
    ? 'end'
    : p.includes('center horizontally')
    ? 'center'
    : p.includes('scale')
    ? 'scale'
    : 'start';

  const verticalConstraint = p.includes('stretch full height') || p.includes('full height')
    ? 'both'
    : p.includes('pin to bottom') || p.includes('align bottom')
    ? 'end'
    : p.includes('center vertically')
    ? 'center'
    : p.includes('scale')
    ? 'scale'
    : 'start';

  if (
    p.includes('pin') ||
    p.includes('constraint') ||
    p.includes('stretch') ||
    p.includes('full width') ||
    p.includes('full height')
  ) {
    result.constraints = {
      horizontal: horizontalConstraint,
      vertical: verticalConstraint,
    };
  }

  return result;
}
