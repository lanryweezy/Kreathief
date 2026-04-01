import { StateCreator } from 'zustand';
import { Layer, TextLayer, ShapeLayer, Artboard } from '../../../types';

export interface LayerSlice {
  artboards: Artboard[];
  activeArtboardId: string;
  selectedLayerIds: string[];
  clipboardLayer: Layer | null;
  editingPathId: string | null;

  // FIX: Layer cache for O(1) lookups
  layerCache: Map<string, Layer> | null;
  rebuildLayerCache: () => void;
  getLayerById: (id: string) => Layer | undefined;

  // Artboard Actions
  setArtboards: (artboards: Artboard[]) => void;
  setActiveArtboardId: (id: string) => void;
  addArtboard: (name?: string, width?: number, height?: number) => void;
  deleteArtboard: (id: string) => void;
  updateArtboard: (id: string, partial: Partial<Artboard>) => void;
  magicResize: (newWidth: number, newHeight: number, newName?: string) => void;

  // Layer Actions
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

  // Design Systems
  convertToComponent: (id: string) => void;
  instantiateComponent: (masterId: string) => void;
  detachInstance: (id: string) => void;
  resetOverrides: (id: string) => void;
  resetDirty: (id: string) => void;
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
  layerCache: null,
};

export const createBaseLayerSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set, get) => ({
  ...initialLayerState,

  // FIX: Layer cache methods for O(1) lookups
  rebuildLayerCache: () => {
    const state = get();
    const allLayers = state.artboards.flatMap((a: Artboard) => a.layers);
    const cache = new Map<string, Layer>();
    
    allLayers.forEach((layer: Layer) => {
      cache.set(layer.id, layer);
    });
    
    set({ layerCache: cache });
  },

  getLayerById: (id: string) => {
    const cache = get().layerCache;
    if (cache?.has(id)) {
      return cache.get(id);
    }
    
    // Fallback to slow path and rebuild cache
    const allLayers = get().artboards.flatMap((a: Artboard) => a.layers);
    const layer = allLayers.find((l: Layer) => l.id === id);
    
    // Rebuild cache after fallback
    get().rebuildLayerCache();
    
    return layer;
  },

  setArtboards: (artboards) => {
    set({ artboards, layerCache: null }); // Invalidate cache on change
  },
  setActiveArtboardId: (activeArtboardId) => set({ activeArtboardId, selectedLayerIds: [] }),

  updateArtboard: (id, partial) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => (a.id === id ? { ...a, ...partial } : a)),
    })),

  setLayers: (input) =>
    set((state: any) => {
      const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
      if (!artboard) {
        return {};
      }
      const layers = typeof input === 'function' ? input(artboard.layers) : input;
      // FIX: Invalidate cache when layers change
      return {
        artboards: state.artboards.map((a: Artboard) => (a.id === state.activeArtboardId ? { ...a, layers } : a)),
        layerCache: null,
      };
    }),

  resetDirty: (id) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l: Layer) => (l.id === id ? { ...l, dirty: false } : l)),
      })),
      layerCache: null, // FIX: Invalidate cache
    })),
});
