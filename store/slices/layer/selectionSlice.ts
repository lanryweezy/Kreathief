import { StateCreator } from 'zustand';
import { Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createSelectionSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set) => ({
  selectLayer: (id) => set({ selectedLayerIds: id ? [id] : [] }),

  multiSelectLayer: (id, shiftKey) => {
    set((state: any) => {
      const { selectedLayerIds, artboards, activeArtboardId } = state;
      
      if (!shiftKey) {
        // Exclusive selection
        return { selectedLayerIds: [id] };
      }

      // Toggle selection with Shift
      if (selectedLayerIds.includes(id)) {
        return { selectedLayerIds: selectedLayerIds.filter((sid: string) => sid !== id) };
      } else {
        return { selectedLayerIds: [...selectedLayerIds, id] };
      }
    });
  },

  setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),
});
