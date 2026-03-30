import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Layer, TextLayer, ShapeLayer, Artboard, ImageLayer } from '../../../types';
import { LayerSlice } from './baseSlice';
import { DEFAULT_LAYER_FILTERS } from './utils';

export const createCRUDSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set, get) => ({
  addArtboard: (name = 'Artboard', width = 1080, height = 1080) => {
    get().saveToHistory?.();
    const id = uuidv4();
    const lastArtboard = get().artboards[get().artboards.length - 1];
    const x = lastArtboard ? lastArtboard.x + lastArtboard.width + 100 : 0;

    set((state: any) => ({
      artboards: [...state.artboards, { id, name, x, y: 0, width, height, layers: [] }],
      activeArtboardId: id,
    }));
  },

  deleteArtboard: (id) => {
    if (get().artboards.length <= 1) {
      return;
    }
    get().saveToHistory?.();
    set((state: any) => {
      const artboards = state.artboards.filter((a: Artboard) => a.id !== id);
      return {
        artboards,
        activeArtboardId: state.activeArtboardId === id ? artboards[0].id : state.activeArtboardId,
      };
    });
  },

  addLayer: (layer) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === state.activeArtboardId ? { ...a, layers: [...a.layers, layer] } : a
      ),
      selectedLayerIds: [layer.id],
    }));
  },

  addLayers: (newLayers) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === state.activeArtboardId ? { ...a, layers: [...a.layers, ...newLayers] } : a
      ),
      selectedLayerIds: newLayers.map((l) => l.id),
    }));
  },

  addTextLayer: (style = {}) => {
    get().saveToHistory?.();
    const state = get();
    const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!artboard) {
      return;
    }

    const textContent = style.text || 'Add your text';
    const autoName = textContent.length > 20 ? textContent.slice(0, 20) + '…' : textContent;
    const newLayer: TextLayer = {
      id: uuidv4(),
      type: 'text',
      name: autoName,
      text: textContent,
      x: artboard.width / 2 - 100,
      y: artboard.height / 2 - 25,
      width: 200,
      height: style.fontSize || 40,
      rotation: 0,
      fontSize: style.fontSize || 40,
      fontWeight: style.fontWeight || '700',
      fontFamily: style.fontFamily || 'Inter',
      fontStyle: style.fontStyle || 'normal',
      textDecoration: style.textDecoration || 'none',
      textAlign: style.textAlign || 'center',
      color: style.color || '#000000',
      opacity: style.opacity ?? 1,
      locked: false,
      visible: true,
      filters: { ...DEFAULT_LAYER_FILTERS },
      blendMode: 'normal',
      skewX: 0,
      skewY: 0,
      perspective: 0,
      rotateX: 0,
      rotateY: 0,
      lineHeight: style.lineHeight || 1.2,
      letterSpacing: style.letterSpacing || 0,
      textTransform: style.textTransform || 'none',
      warpStyle: style.warpStyle || 'none',
      curve: style.curve || 0,
      ...style,
    };

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === state.activeArtboardId ? { ...a, layers: [...a.layers, newLayer] } : a
      ),
      selectedLayerIds: [newLayer.id],
    }));
  },

  addImageLayer: (src, name = 'Image', x, y, width = 300, height = 300) => {
    get().saveToHistory?.();
    const state = get();
    const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!artboard) {
      return;
    }

    const newLayer: ImageLayer = {
      id: uuidv4(),
      type: 'image',
      name,
      src,
      x: x ?? artboard.width / 2 - width / 2,
      y: y ?? artboard.height / 2 - height / 2,
      width,
      height,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      filters: { ...DEFAULT_LAYER_FILTERS },
      blendMode: 'normal',
      skewX: 0,
      skewY: 0,
      perspective: 0,
      rotateX: 0,
      rotateY: 0,
    };

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === state.activeArtboardId ? { ...a, layers: [...a.layers, newLayer] } : a
      ),
      selectedLayerIds: [newLayer.id],
    }));
  },

  addShapeLayer: (type, style = {}) => {
    get().saveToHistory?.();
    const state = get();
    const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!artboard) {
      return;
    }

    const newLayer: ShapeLayer = {
      id: `${type}_${Date.now()}`,
      type: type as any,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      x: artboard.width / 2 - 50,
      y: artboard.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      color: '#000000',
      cornerRadius: 0,
      opacity: 1,
      locked: false,
      visible: true,
      filters: { ...DEFAULT_LAYER_FILTERS },
      blendMode: 'normal',
      skewX: 0,
      skewY: 0,
      perspective: 0,
      rotateX: 0,
      rotateY: 0,
      ...style,
    };

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === state.activeArtboardId ? { ...a, layers: [...a.layers, newLayer] } : a
      ),
      selectedLayerIds: [newLayer.id],
    }));
  },

  updateLayer: (id, partial) =>
    set((state: any) => {
      let masterComponentId = '';

      state.artboards.forEach((a: Artboard) => {
        const l = a.layers.find((ly: Layer) => ly.id === id);
        if (l?.componentId) {
          masterComponentId = l.componentId;
        }
      });

      return {
        artboards: state.artboards.map((a: Artboard) => ({
          ...a,
          layers: a.layers.map((l: Layer) => {
            if (l.id === id) {
              const overrides = l.masterId ? [...(l.overrides || []), ...Object.keys(partial)] : l.overrides;
              return { ...l, ...partial, overrides, dirty: true };
            }
            if (masterComponentId && l.masterId === masterComponentId) {
              const overrides = l.overrides || [];
              const syncPartial = { ...partial };
              Object.keys(syncPartial).forEach((key) => {
                if (overrides.includes(key)) {
                  delete (syncPartial as any)[key];
                }
              });
              return { ...l, ...syncPartial };
            }
            return l;
          }),
        })),
      };
    }),

  updateLayers: (updates) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l: Layer) => (updates[l.id] ? { ...l, ...updates[l.id], dirty: true } : l)),
      })),
    })),

  deleteLayer: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.filter((l: Layer) => l.id !== id),
      })),
      selectedLayerIds: state.selectedLayerIds.filter((sid: string) => sid !== id),
    }));
  },

  deleteSelected: () => {
    get().saveToHistory?.();
    const { selectedLayerIds } = get();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.filter((l: Layer) => !selectedLayerIds.includes(l.id)),
      })),
      selectedLayerIds: [],
    }));
  },

  duplicateLayer: (id) => {
    get().saveToHistory?.();
    let newLayerId = '';

    set((state: any) => {
      const artboards = state.artboards.map((a: Artboard) => {
        const layer = a.layers.find((l) => l.id === id);
        if (layer) {
          const newLayer = {
            ...structuredClone(layer),
            id: uuidv4(),
            x: layer.x + 20,
            y: layer.y + 20,
            name: (layer.name || 'Layer') + ' Copy',
          };
          newLayerId = newLayer.id;
          return { ...a, layers: [...a.layers, newLayer] };
        }
        return a;
      });
      return { artboards, selectedLayerIds: [newLayerId] };
    });
  },

  duplicateSelected: () => {
    get().saveToHistory?.();
    const { selectedLayerIds, activeArtboardId } = get();
    if (selectedLayerIds.length === 0) {
      return;
    }

    set((state: any) => {
      const newLayers: Layer[] = [];
      const artboards = state.artboards.map((a: Artboard) => {
        if (a.id !== activeArtboardId) {
          return a;
        }

        const duplicated = a.layers
          .filter((l) => selectedLayerIds.includes(l.id))
          .map((l) => {
            const nl = {
              ...structuredClone(l),
              id: uuidv4(),
              x: l.x + 20,
              y: l.y + 20,
              name: (l.name || 'Layer') + ' Copy',
            };
            newLayers.push(nl);
            return nl;
          });

        return { ...a, layers: [...a.layers, ...duplicated] };
      });

      return { artboards, selectedLayerIds: newLayers.map((l) => l.id) };
    });
  },

  copyLayer: (id) => {
    const { artboards } = get();
    artboards.forEach((a: Artboard) => {
      const layer = a.layers.find((l) => l.id === id);
      if (layer) {
        set({ clipboardLayer: structuredClone(layer) });
      }
    });
  },

  pasteLayer: (style = {}) => {
    const { clipboardLayer, activeArtboardId } = get();
    if (!clipboardLayer) {
      return;
    }
    get().saveToHistory?.();
    const newLayer = {
      ...clipboardLayer,
      id: `${clipboardLayer.type}_${Date.now()}`,
      x: clipboardLayer.x + 20,
      y: clipboardLayer.y + 20,
      name: (clipboardLayer.name || 'Layer') + ' Copy',
      ...style,
    };
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === activeArtboardId ? { ...a, layers: [...a.layers, newLayer] } : a
      ),
      selectedLayerIds: [newLayer.id],
    }));
  },
});
