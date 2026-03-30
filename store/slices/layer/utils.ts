import { Layer, TextLayer, LayerFilters } from '../../../types';

export const DEFAULT_LAYER_FILTERS: LayerFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  vignette: 0,
  hueRotate: 0,
};

export function applyAutoLayout(layers: Layer[]): Layer[] {
  const containers = layers.filter((l) => l.autoLayout && l.groupId);
  if (containers.length === 0) {
    return layers;
  }

  const nextLayers = [...layers];
  containers.forEach((container) => {
    const children = nextLayers.filter((l) => l.groupId === container.groupId && l.id !== container.id);
    if (children.length === 0) {
      return;
    }

    if (container.autoLayout!.direction === 'row') {
      children.sort((a, b) => a.x - b.x);
    } else {
      children.sort((a, b) => a.y - b.y);
    }

    const pad = container.autoLayout!.padding;
    const pt = typeof pad === 'number' ? pad : pad.top;
    const pr = typeof pad === 'number' ? pad : pad.right;
    const pb = typeof pad === 'number' ? pad : pad.bottom;
    const pl = typeof pad === 'number' ? pad : pad.left;
    const spacing = container.autoLayout!.spacing;
    const align = container.autoLayout!.alignment;

    if (container.autoLayout!.direction === 'row') {
      let currentX = container.x + pl;
      let maxH = 0;
      children.forEach((c) => {
        const h = (c as any).height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 0);
        if (h > maxH) {
          maxH = h;
        }
      });

      const containerHeight = maxH + pt + pb;
      const targetCenterY = container.y + containerHeight / 2;

      children.forEach((c) => {
        const w = (c as any).width || 0;
        const h = (c as any).height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 0);

        let targetY = container.y + pt;
        if (align === 'center') {
          targetY = targetCenterY - h / 2;
        } else if (align === 'end') {
          targetY = container.y + containerHeight - pb - h;
        }

        const idx = nextLayers.findIndex((l) => l.id === c.id);
        if (idx !== -1) {
          nextLayers[idx] = { ...nextLayers[idx], x: currentX, y: targetY } as any;
        }
        currentX += w + spacing;
      });

      const cIdx = nextLayers.findIndex((l) => l.id === container.id);
      if (cIdx !== -1) {
        nextLayers[cIdx] = {
          ...nextLayers[cIdx],
          width: currentX - spacing - container.x + pr,
          height: containerHeight,
        } as any;
      }
    } else {
      let currentY = container.y + pt;
      let maxW = 0;
      children.forEach((c) => {
        const w = (c as any).width || 0;
        if (w > maxW) {
          maxW = w;
        }
      });

      const containerWidth = maxW + pl + pr;
      const targetCenterX = container.x + containerWidth / 2;

      children.forEach((c) => {
        const h = (c as any).height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 0);
        const w = (c as any).width || 0;

        let targetX = container.x + pl;
        if (align === 'center') {
          targetX = targetCenterX - w / 2;
        } else if (align === 'end') {
          targetX = container.x + containerWidth - pr - w;
        }

        const idx = nextLayers.findIndex((l) => l.id === c.id);
        if (idx !== -1) {
          nextLayers[idx] = { ...nextLayers[idx], x: targetX, y: currentY } as any;
        }
        currentY += h + spacing;
      });

      const cIdx = nextLayers.findIndex((l) => l.id === container.id);
      if (cIdx !== -1) {
        nextLayers[cIdx] = {
          ...nextLayers[cIdx],
          width: containerWidth,
          height: currentY - spacing - container.y + pb,
        } as any;
      }
    }
  });

  return nextLayers;
}
