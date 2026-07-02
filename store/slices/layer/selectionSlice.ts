import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { LayerSlice } from './baseSlice';

export const createSelectionSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set) => ({
  selectLayer: (id) => set({ selectedLayerIds: id ? [id] : [] }),

  multiSelectLayer: (id, shiftKey) => {
    set((state: any) => {
      const { selectedLayerIds } = state;
      if (!shiftKey) return { selectedLayerIds: [id] };
      if (selectedLayerIds.includes(id)) {
        return { selectedLayerIds: selectedLayerIds.filter((sid: string) => sid !== id) };
      } else {
        return { selectedLayerIds: [...selectedLayerIds, id] };
      }
    });
  },

  setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),
});
