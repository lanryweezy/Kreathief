import { createSelector } from 'reselect';
import { StoreState } from './useStore';
import { Artboard, Layer } from '../types';

const getArtboards = (state: StoreState) => state.artboards || [];
const getActiveArtboardId = (state: StoreState) => state.activeArtboardId;
const getSelectedLayerIds = (state: StoreState) => state.selectedLayerIds || [];

export const activeArtboardSelector = createSelector(
  [getArtboards, getActiveArtboardId],
  (artboards, activeArtboardId) => {
    if (!Array.isArray(artboards) || artboards.length === 0) {
      return undefined;
    }
    return artboards.find((a: Artboard) => a.id === activeArtboardId) || artboards[0];
  }
);

export const selectedLayerIdSelector = createSelector([getSelectedLayerIds], (ids) => {
  if (!ids || ids.length === 0) {
    return null;
  }
  return ids[ids.length - 1] || null;
});

export const selectedLayerSelector = createSelector(
  [activeArtboardSelector, selectedLayerIdSelector],
  (artboard, id) => {
    if (!artboard || !id) {
      return null;
    }
    return (artboard?.layers || []).find((l: Layer) => l.id === id) || null;
  }
);

export const selectedLayersSelector = createSelector([activeArtboardSelector, getSelectedLayerIds], (artboard, ids) => {
  if (!artboard || ids.length === 0) {
    return [];
  }
  const idSet = new Set(ids);
  return (artboard?.layers || []).filter((l: Layer) => idSet.has(l.id));
});
