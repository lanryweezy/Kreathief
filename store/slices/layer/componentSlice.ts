import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createComponentSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set, get) => ({
  convertToComponent: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === id ? { ...l, componentId: `comp_${uuidv4()}` } : l)),
      })),
    }));
  },

  instantiateComponent: (componentId) => {
    get().saveToHistory?.();
    const state = get();
    let master: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l) => l.componentId === componentId);
      if (found) {
        master = found;
      }
    });

    if (!master) {
      return;
    }

    const instance: Layer = {
      ...(structuredClone(master) as any),
      id: `${(master as any).type}_instance_${uuidv4()}`,
      masterId: componentId,
      componentId: undefined,
      overrides: [],
      x: (master as any).x + 40,
      y: (master as any).y + 40,
    };

    const activeArtboardId = state.activeArtboardId;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === activeArtboardId ? { ...a, layers: [...a.layers, instance] } : a
      ),
      selectedLayerIds: [instance.id],
    }));
  },

  detachInstance: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === id ? { ...l, masterId: undefined, overrides: undefined } : l)),
      })),
    }));
  },

  resetOverrides: (id) => {
    get().saveToHistory?.();
    const currentState = get();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const layer = a.layers.find((l: Layer) => l.id === id);
        if (!layer || !layer.masterId) {
          return a;
        }

        let master: any = null;
        currentState.artboards.forEach((art: Artboard) => {
          const m = art.layers.find((l: Layer) => l.componentId === layer.masterId);
          if (m) {
            master = m;
          }
        });

        if (!master) {
          return a;
        }

        return {
          ...a,
          layers: a.layers.map((l: Layer) => {
            if (l.id !== id) {
              return l;
            }
            return {
              ...structuredClone(master),
              id: l.id,
              x: l.x,
              y: l.y,
              rotation: l.rotation,
              masterId: master.componentId,
              componentId: undefined,
              overrides: [],
            };
          }),
        };
      }),
    }));
  },
});
