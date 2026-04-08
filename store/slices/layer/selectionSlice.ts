import { StateCreator } from 'zustand';
import { Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createSelectionSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set) => ({
  selectLayer: (id) => set({ selectedLayerIds: id ? [id] : [] }),

  multiSelectLayer: (id, shiftKey) => {
    set((state: any) => {
      const { selectedLayerIds, artboards, activeArtboardId } = state;
      const activeArtboard = artboards.find((a: Artboard) => a.id === activeArtboardId);
      if (!activeArtboard) {
        return { selectedLayerIds };
      }

      if (!shiftKey) {
        if (selectedLayerIds.includes(id)) {
          return { selectedLayerIds: selectedLayerIds.filter((sid: string) => sid !== id) };
        } else {
          return { selectedLayerIds: [...selectedLayerIds, id] };
        }
      } else {
        // Range selection
        if (selectedLayerIds.length === 0) {
          return { selectedLayerIds: [id] };
        }
        const lastSelectedId = selectedLayerIds[selectedLayerIds.length - 1];
        const lastIdx = activeArtboard.layers.findIndex((l: any) => l.id === lastSelectedId);
        const currIdx = activeArtboard.layers.findIndex((l: any) => l.id === id);

        if (lastIdx === -1 || currIdx === -1) {
          return { selectedLayerIds: [...selectedLayerIds, id] };
        }

        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeIds = activeArtboard.layers.slice(start, end + 1).map((l: any) => l.id);

        return { selectedLayerIds: Array.from(new Set([...selectedLayerIds, ...rangeIds])) };
      }
    });
  },

  setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),
});
