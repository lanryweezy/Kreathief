import { Layer, TextLayer, LayerFilters, Artboard } from '../../../types';
import { computeAutoLayout } from '../../../utils/autoLayout';

export function findLayerInArtboards(
  artboards: Artboard[],
  predicate: (layer: Layer) => boolean
): { layer: Layer; artboard: Artboard; index: number } | null {
  for (const artboard of artboards) {
    const layers = artboard.layers;
    for (let i = 0; i < layers.length; i++) {
      if (predicate(layers[i])) {
        return { layer: layers[i], artboard, index: i };
      }
    }
  }
  return null;
}

export function findLayerById(
  artboards: Artboard[],
  id: string
): { layer: Layer; artboard: Artboard; index: number } | null {
  for (const artboard of artboards) {
    const layers = artboard.layers;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].id === id) {
        return { layer: layers[i], artboard, index: i };
      }
    }
  }
  return null;
}

export function findLayerByComponentId(artboards: Artboard[], componentId: string): Layer | null {
  for (const artboard of artboards) {
    const layers = artboard.layers;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].componentId === componentId) {
        return layers[i];
      }
    }
  }
  return null;
}

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

    const positions = computeAutoLayout(container, children, nextLayers);

    Object.entries(positions).forEach(([id, pos]) => {
      if (id === container.id) {
        const idx = nextLayers.findIndex((l) => l.id === id);
        if (idx !== -1) {
          const updatedChild = nextLayers[idx];
          const allChildren = nextLayers.filter((l) => l.groupId === container.groupId && l.id !== container.id);
          if (container.autoLayout!.direction === 'row') {
            const maxH = allChildren.reduce(
              (mx, c) => Math.max(mx, c.height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 0)),
              0
            );
            const pad =
              typeof container.autoLayout!.padding === 'number'
                ? container.autoLayout!.padding
                : (container.autoLayout!.padding.top || 0) + (container.autoLayout!.padding.bottom || 0);
            const totalWidth =
              allChildren.reduce((acc, c) => acc + (c.width || 0), 0) +
              (container.autoLayout!.spacing || 0) * Math.max(0, allChildren.length - 1) +
              pad;
            nextLayers[idx] = {
              ...updatedChild,
              width: totalWidth,
              height: maxH + pad,
            } as any;
          } else {
            const maxW = allChildren.reduce((mx, c) => Math.max(mx, c.width || 0), 0);
            const pad =
              typeof container.autoLayout!.padding === 'number'
                ? container.autoLayout!.padding
                : (container.autoLayout!.padding.left || 0) + (container.autoLayout!.padding.right || 0);
            const totalHeight =
              allChildren.reduce((acc, c) => acc + (c.height || 0), 0) +
              (container.autoLayout!.spacing || 0) * Math.max(0, allChildren.length - 1) +
              pad;
            nextLayers[idx] = {
              ...updatedChild,
              width: maxW + pad,
              height: totalHeight,
            } as any;
          }
        }
      } else {
        const idx = nextLayers.findIndex((l) => l.id === id);
        if (idx !== -1) {
          nextLayers[idx] = { ...nextLayers[idx], x: pos.x, y: pos.y } as any;
        }
      }
    });
  });

  return nextLayers;
}
