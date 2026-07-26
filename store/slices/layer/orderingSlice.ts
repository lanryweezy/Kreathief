import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createOrderingSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, get) => ({
  reorderLayer: (id, newIndex) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const idx = a.layers.findIndex((l) => l.id === id);
        if (idx === -1) return a;
        const newLayers = [...a.layers];
        const [removed] = newLayers.splice(idx, 1);
        newLayers.splice(newIndex, 0, removed!);
        return { ...a, layers: newLayers };
      }),
    }));
  },

  moveLayer: (id, direction) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const idx = a.layers.findIndex((l) => l.id === id);
        if (idx === -1) return a;
        const newLayers = [...a.layers];
        const item = newLayers.splice(idx, 1)[0];
        let newIndex = idx;
        if (direction === 'front') newIndex = newLayers.length;
        if (direction === 'back') newIndex = 0;
        if (direction === 'forward') newIndex = Math.min(newLayers.length, idx + 1);
        if (direction === 'backward') newIndex = Math.max(0, idx - 1);
        newLayers.splice(newIndex, 0, item!);
        return { ...a, layers: newLayers };
      }),
    }));
  },
});
