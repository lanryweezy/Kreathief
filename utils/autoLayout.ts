import { Layer, TextLayer } from '../types';

export interface AutoLayoutConfig {
  direction: 'row' | 'col';
  padding: number;
  spacing: number;
  alignment: 'start' | 'center' | 'end';
  sizing?: {
    width?: 'fixed' | 'hug' | 'fill';
    height?: 'fixed' | 'hug' | 'fill';
  };
}

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

  // Recursive post-order size computation
  function computeSize(layerId: string) {
    if (processed.has(layerId)) return;
    processed.add(layerId);

    const layer = layerMap.get(layerId);
    if (!layer) return;

    const children = childrenMap.get(layerId) || [];
    children.forEach((c) => computeSize(c.id));

    if (layer.type === 'group' && layer.autoLayout) {
      const layout = layer.autoLayout;
      const pad = typeof layout.padding === 'number' ? layout.padding : 0;
      const spacing = layout.spacing || 0;
      const isRow = layout.direction === 'row';

      const sizing = layout.sizing;
      const isWidthHug = !sizing || sizing.width === 'hug';
      const isHeightHug = !sizing || sizing.height === 'hug';

      let totalAxisSize = 0;
      let maxCrossSize = 0;

      children.forEach((c) => {
        const cw = c.width || (c.type === 'text' ? (c as TextLayer).fontSize * 0.6 * ((c as TextLayer).text?.length || 1) : 100);
        const ch = c.height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 100);
        totalAxisSize += isRow ? cw : ch;
        maxCrossSize = Math.max(maxCrossSize, isRow ? ch : cw);
      });

      totalAxisSize += spacing * Math.max(0, children.length - 1);

      let newW = layer.width || 100;
      let newH = layer.height || 100;

      if (isRow) {
        if (isWidthHug) newW = totalAxisSize + pad * 2;
        if (isHeightHug) newH = maxCrossSize + pad * 2;
      } else {
        if (isHeightHug) newH = totalAxisSize + pad * 2;
        if (isWidthHug) newW = maxCrossSize + pad * 2;
      }

      const updated = { ...layer, width: newW, height: newH };
      layerMap.set(layerId, updated);
      
      const idx = nextLayers.findIndex(l => l.id === layerId);
      if (idx !== -1) nextLayers[idx] = updated;
    }
  }

  // Position children (Pre-order, top-down)
  function computePositions(layerId: string, parentX: number, parentY: number) {
    const layer = layerMap.get(layerId);
    if (!layer) return;

    if (layer.type === 'group' && layer.autoLayout) {
      const layout = layer.autoLayout;
      const pad = typeof layout.padding === 'number' ? layout.padding : 0;
      const spacing = layout.spacing || 0;
      const isRow = layout.direction === 'row';
      const alignment = layout.alignment || 'center';
      const children = childrenMap.get(layerId) || [];
      
      let cursor = pad;
      
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
          const fillCount = children.filter(ch => isRow ? ch.autoLayout?.sizing?.width === 'fill' : ch.autoLayout?.sizing?.height === 'fill').length;
          if (fillCount > 0) {
            const avail = (isRow ? (layer.width||0) : (layer.height||0)) - pad * 2 - (totalAxisSize - (isRow ? cw : ch));
            if (isRow && childSizing.width === 'fill') cw = Math.max(0, avail / fillCount);
            if (!isRow && childSizing.height === 'fill') ch = Math.max(0, avail / fillCount);
          }
          if (isRow && childSizing.height === 'fill') ch = (layer.height||0) - pad * 2;
          if (!isRow && childSizing.width === 'fill') cw = (layer.width||0) - pad * 2;
        }

        let relX = 0;
        let relY = 0;

        if (isRow) {
          relX = cursor;
          if (alignment === 'start') relY = pad;
          else if (alignment === 'end') relY = (layer.height || 0) - pad - ch;
          else relY = ((layer.height || 0) - ch) / 2;
          cursor += cw + spacing;
        } else {
          relY = cursor;
          if (alignment === 'start') relX = pad;
          else if (alignment === 'end') relX = (layer.width || 0) - pad - cw;
          else relX = ((layer.width || 0) - cw) / 2;
          cursor += ch + spacing;
        }

        const absX = layer.x + relX;
        const absY = layer.y + relY;

        const updatedChild = { ...c, x: absX, y: absY, width: cw, height: ch };
        layerMap.set(c.id, updatedChild);
        
        const cIdx = nextLayers.findIndex(l => l.id === c.id);
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
