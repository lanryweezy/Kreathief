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
  const containers = layers.filter((l) => !!l.autoLayout);
  if (containers.length === 0) {
    return layers;
  }

  // Calculate depth for each container
  const getDepth = (id: string, currentDepth = 0): number => {
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.groupId || layer.groupId === id) return currentDepth;
    return getDepth(layer.groupId, currentDepth + 1);
  };

  const containersWithDepth = containers.map(c => ({
    container: c,
    depth: getDepth(c.id)
  }));

  // Sort descending by depth (deepest first)
  containersWithDepth.sort((a, b) => b.depth - a.depth);

  const nextLayers = [...layers];
  containersWithDepth.forEach(({ container }) => {
    // Re-fetch container in case it was resized by a child's autolayout
    const currentContainer = nextLayers.find(l => l.id === container.id)!;
    
    // Get visible children
    const children = nextLayers.filter((l) => l.groupId === currentContainer.id && l.id !== currentContainer.id && l.visible !== false);
    if (children.length === 0) {
      return;
    }

    const positions = computeAutoLayout(currentContainer, children, nextLayers);

    Object.entries(positions).forEach(([id, pos]) => {
      const idx = nextLayers.findIndex((l) => l.id === id);
      if (idx !== -1) {
        nextLayers[idx] = { ...nextLayers[idx], ...pos } as any;
      }
    });
  });

  return nextLayers;
}
