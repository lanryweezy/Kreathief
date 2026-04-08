import { StateCreator } from 'zustand';
import { Artboard, TextLayer } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createStyleSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set) => ({
  applyTexture: (textureUrl, _intensity) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (state.selectedLayerIds.includes(l.id) && l.type === 'text') {
            return {
              ...l,
              decorations: { ...(l as TextLayer).decorations, textures: [textureUrl] },
            } as TextLayer;
          }
          return l;
        }),
      })),
    })),

  removeTexture: () =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (state.selectedLayerIds.includes(l.id) && l.type === 'text') {
            const { textures: _, ...remaining } = (l as TextLayer).decorations || {};
            return { ...l, decorations: remaining } as TextLayer;
          }
          return l;
        }),
      })),
    })),

  setEditingPathId: (id) => set({ editingPathId: id }),

  onUpdatePath: (id, updates) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      })),
    })),

  applyMask: (targetId, maskId) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === targetId ? { ...l, maskLayerId: maskId || undefined } : l)),
      })),
    })),
});
