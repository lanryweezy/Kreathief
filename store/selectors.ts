import { StoreState } from './useStore';
import { Artboard, Layer } from '../types';

export const activeArtboardSelector = (state: StoreState): Artboard | undefined => {
  const { artboards, activeArtboardId } = state as any;
  if (!Array.isArray(artboards) || artboards.length === 0) {
    return undefined;
  }
  return artboards.find((a: Artboard) => a.id === activeArtboardId) || artboards[0];
};

export const selectedLayerIdSelector = (state: StoreState): string | null => {
  const ids = (state as any).selectedLayerIds as string[] | undefined;
  if (!ids || ids.length === 0) {
    return null;
  }
  return ids[ids.length - 1] || null;
};

export const selectedLayerSelector = (state: StoreState): Layer | null => {
  const artboard = activeArtboardSelector(state);
  const id = selectedLayerIdSelector(state);
  if (!artboard || !id) {
    return null;
  }
  return (artboard.layers || []).find((l: Layer) => l.id === id) || null;
};

export const selectedLayersSelector = (state: StoreState): Layer[] => {
  const artboard = activeArtboardSelector(state);
  const ids = ((state as any).selectedLayerIds as string[]) || [];
  if (!artboard || ids.length === 0) {
    return [];
  }
  const idSet = new Set(ids);
  return (artboard.layers || []).filter((l: Layer) => idSet.has(l.id));
};
