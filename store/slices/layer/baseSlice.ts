import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { Layer, TextLayer, ShapeLayer, Artboard } from '../../../types';

export interface LayerSlice {
  artboards: Artboard[];
  activeArtboardId: string;
  selectedLayerIds: string[];
  clipboardLayer: Layer | null;
  editingPathId: string | null;

  setArtboards: (artboards: Artboard[]) => void;
  setActiveArtboardId: (id: string) => void;
  addArtboard: (name?: string, width?: number, height?: number) => void;
  deleteArtboard: (id: string) => void;
  updateArtboard: (id: string, partial: Partial<Artboard>) => void;
  magicResize: (newWidth: number, newHeight: number, newName?: string) => void;
  magicResizeAll: (formats: { width: number; height: number; name: string }[]) => void;

  setLayers: (layers: Layer[] | ((prev: Layer[]) => Layer[])) => void;
  addLayer: (layer: Layer) => void;
  addLayers: (layers: Layer[]) => void;
  addTextLayer: (style?: Partial<TextLayer>) => void;
  addAdjustmentLayer: () => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  updateLayers: (updates: Record<string, Partial<Layer>>) => void;
  deleteLayer: (id: string) => void;
  deleteSelected: () => void;
  duplicateLayer: (id: string) => void;
  duplicateSelected: () => void;
  selectLayer: (id: string | null) => void;
  multiSelectLayer: (id: string, shiftKey: boolean) => void;
  setSelectedLayerIds: (ids: string[]) => void;
  reorderLayer: (id: string, newIndex: number) => void;
  moveLayer: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  nudgeLayer: (id: string, dx: number, dy: number) => void;
  alignLayers: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeLayers: (type: 'horizontal' | 'vertical') => void;
  layoutLayers: (
    typeOrShapes: 'grid' | 'row' | 'col' | 'golden_v' | 'golden_h' | 'golden_grid' | Partial<ShapeLayer>[]
  ) => void;
  addImageLayer: (src: string, name?: string, x?: number, y?: number, width?: number, height?: number) => void;
  addShapeLayer: (type: ShapeLayer['type'], style?: Partial<ShapeLayer>) => void;
  copyLayer: (id: string) => void;
  pasteLayer: (style?: Partial<Layer>) => void;
  applyTexture: (textureUrl: string, intensity?: number) => void;
  removeTexture: () => void;
  setEditingPathId: (id: string | null) => void;
  onUpdatePath: (id: string, updates: Partial<ShapeLayer>) => void;
  applyMask: (targetId: string, maskId: string | null) => void;

  convertToComponent: (id: string) => void;
  instantiateComponent: (masterId: string) => void;
  detachInstance: (id: string) => void;
  resetOverrides: (id: string) => void;
  syncComponentInstances: (masterId: string) => void;
  markOverride: (instanceId: string, propertyName: string) => void;
  updateInstanceLayer: (id: string, partial: Partial<Layer>) => void;
  swapInstance: (instanceId: string, newMasterId: string) => void;
  getComponentInstances: (componentId: string) => Layer[];
  getComponentDefinition: (componentId: string) => any;
  addVariant: (componentId: string, variantName: string, properties: Record<string, any>) => void;
  applyVariant: (instanceId: string, variantId: string) => void;
  autoNameLayer: (id: string) => Promise<void>;
}

export const initialLayerState = {
  artboards: [
    {
      id: 'default',
      name: 'Artboard 1',
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      layers: [],
    },
  ],
  activeArtboardId: 'default',
  selectedLayerIds: [],
  clipboardLayer: null,
  editingPathId: null,
};

export const createBaseLayerSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, _get) => ({
  ...initialLayerState,

  setArtboards: (artboards) => {
    set({ artboards });
  },
  setActiveArtboardId: (id) =>
    set((state: any) => {
      if (state.activeArtboardId === id) {
        return { activeArtboardId: id };
      }
      return { activeArtboardId: id, selectedLayerIds: [] };
    }),

  updateArtboard: (id, partial) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => (a.id === id ? { ...a, ...partial } : a)),
    })),

  setLayers: (layersOrFn) =>
    set((state: any) => {
      const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
      if (!artboard) {
        return {};
      }
      const newLayers = typeof layersOrFn === 'function' ? layersOrFn(artboard.layers) : layersOrFn;
      return {
        artboards: state.artboards.map((a: Artboard) =>
          a.id === state.activeArtboardId ? { ...a, layers: newLayers } : a
        ),
      };
    }),

  updateLayers: (updates) =>
    set((state: any) => {
      const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
      if (!artboard) {
        return {};
      }

      const newLayers = artboard.layers.map((l: Layer) => {
        if (updates[l.id]) {
          return { ...l, ...updates[l.id], dirty: true };
        }
        return l;
      });

      return {
        artboards: state.artboards.map((a: Artboard) =>
          a.id === state.activeArtboardId ? { ...a, layers: newLayers } : a
        ),
      };
    }),
});
