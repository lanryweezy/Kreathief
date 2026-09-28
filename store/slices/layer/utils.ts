import { Layer, LayerFilters, Artboard } from '../../../types';

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
  return findLayerInArtboards(artboards, (layer) => layer.id === id);
}

export function findLayerByComponentId(artboards: Artboard[], componentId: string): Layer | null {
  const result = findLayerInArtboards(artboards, (layer) => layer.componentId === componentId);
  return result ? result.layer : null;
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

export { applyAutoLayout } from '../../../utils/autoLayout';
