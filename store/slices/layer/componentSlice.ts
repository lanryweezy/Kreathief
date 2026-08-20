import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { v4 as uuidv4 } from 'uuid';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export interface ComponentVariant {
  id: string;
  name: string;
  properties: Record<string, any>;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  variants: ComponentVariant[];
  defaultVariantId: string;
  category?: string;
}

export const COMPONENT_SYNCABLE_PROPERTIES = [
  'color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
  'width', 'height', 'cornerRadius', 'opacity', 'visible',
  'stroke', 'shadow', 'blendMode', 'text', 'textAlign',
  'letterSpacing', 'lineHeight', 'gradient',
] as const;

export const createComponentSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, get) => ({
  componentDefinitions: new Map<string, ComponentDefinition>(),

  convertToComponent: (id) => {
    get().saveToHistory?.();
    const componentId = `comp_${uuidv4()}`;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a, layers: a.layers.map((l) => l.id === id ? { ...l, componentId } : l),
      })),
    }));
    const state = get();
    // ⚡ Bolt Optimization: Use nested for loops instead of artboards.flatMap().find()
    // This allows for early termination when searching and avoids the memory overhead of intermediate O(N) array constructions.
    let layer: Layer | undefined;
    for (const artboard of state.artboards) {
      const found = artboard.layers.find((l: Layer) => l.id === id);
      if (found) {
        layer = found;
        break;
      }
    }
    if (layer) {
      const defs = new Map((state as any).componentDefinitions || new Map());
      defs.set(componentId, {
        id: componentId, name: layer.name || 'Component',
        variants: [{ id: `var_${uuidv4()}`, name: 'Default', properties: {}, defaultVariantId: '' }],
        defaultVariantId: `var_${uuidv4()}`,
      });
      set({ componentDefinitions: defs } as any);
    }
  },

  instantiateComponent: (componentId) => {
    get().saveToHistory?.();
    const state = get();
    let master: Layer | null = null;
    state.artboards.forEach((a: Artboard) => { const found = a.layers.find((l) => l.componentId === componentId); if (found) master = found; });
    if (!master) return;
    const instance: Layer = {
      ...(structuredClone(master) as any), id: `${(master as any).type}_instance_${uuidv4()}`,
      masterId: componentId, componentId: undefined, overrides: [],
      x: (master as any).x + 40, y: (master as any).y + 40,
    };
    const activeArtboardId = state.activeArtboardId;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => a.id === activeArtboardId ? { ...a, layers: [...a.layers, instance] } : a),
      selectedLayerIds: [instance.id],
    }));
  },

  syncComponentInstances: (masterId: string) => {
    const state = get();
    let master: Layer | null = null;
    state.artboards.forEach((a: Artboard) => { const found = a.layers.find((l) => l.componentId === masterId); if (found) master = found; });
    if (!master) return;
    const masterRef = master;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (l.masterId !== masterId) return l;
          const overrides = l.overrides || [];
          const updated = { ...l };
          for (const prop of COMPONENT_SYNCABLE_PROPERTIES) {
            if (!overrides.includes(prop)) (updated as any)[prop] = (masterRef as any)[prop];
          }
          return updated;
        }),
      })),
    }));
  },

  markOverride: (instanceId: string, propertyName: string) => {
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (l.id !== instanceId) return l;
          const overrides = l.overrides || [];
          if (overrides.includes(propertyName)) return l;
          return { ...l, overrides: [...overrides, propertyName] };
        }),
      })),
    }));
  },

  updateInstanceLayer: (id: string, partial: Partial<Layer>) => {
    get().saveToHistory?.();
    const state = get();
    let targetLayer: Layer | null = null;
    state.artboards.forEach((a: Artboard) => { const found = a.layers.find((l) => l.id === id); if (found) targetLayer = found; });
    if (!targetLayer || !('masterId' in targetLayer) || !(targetLayer as any).masterId) {
      get().updateLayer(id, partial);
      return;
    }
    const tl = targetLayer as Layer;
    const overrides = new Set<string>(tl.overrides || []);
    for (const key of Object.keys(partial)) {
      if (COMPONENT_SYNCABLE_PROPERTIES.includes(key as any)) overrides.add(key);
    }
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a, layers: a.layers.map((l) => l.id === id ? { ...l, ...partial, overrides: Array.from(overrides) } : l),
      })),
    }));
  },

  resetOverrides: (id) => {
    get().saveToHistory?.();
    const state = get();
    // ⚡ Bolt Optimization: Use nested for loops instead of artboards.flatMap().find()
    // This allows for early termination when searching and avoids the memory overhead of intermediate O(N) array constructions.
    let layer: Layer | undefined;
    for (const artboard of state.artboards) {
      const found = artboard.layers.find((l: Layer) => l.id === id);
      if (found) {
        layer = found;
        break;
      }
    }
    if (!layer?.masterId) return;
    let master: Layer | null = null;
    state.artboards.forEach((a: Artboard) => { const found = a.layers.find((l: Layer) => l.componentId === layer.masterId); if (found) master = found; });
    if (!master) return;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l: Layer) => {
          if (l.id !== id) return l;
          return { ...structuredClone(master), id: l.id, x: l.x, y: l.y, rotation: l.rotation, masterId: master!.id, componentId: undefined, overrides: [] };
        }),
      })),
    }));
  },

  detachInstance: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a, layers: a.layers.map((l) => l.id === id ? { ...l, masterId: undefined, overrides: undefined, componentId: undefined } : l),
      })),
    }));
  },

  swapInstance: (instanceId: string, newMasterId: string) => {
    get().saveToHistory?.();
    const state = get();
    let newMaster: Layer | null = null;
    state.artboards.forEach((a: Artboard) => { const found = a.layers.find((l) => l.componentId === newMasterId); if (found) newMaster = found; });
    if (!newMaster) return;
    let currentInstance: Layer | null = null;
    state.artboards.forEach((a: Artboard) => { const found = a.layers.find((l) => l.id === instanceId); if (found) currentInstance = found; });
    if (!currentInstance) return;
    const ci = currentInstance as Layer;
    const nm = newMaster as Layer;
    const swapped: Layer = {
      ...(structuredClone(nm) as any), id: ci.id, masterId: newMasterId, componentId: undefined,
      overrides: [], x: ci.x, y: ci.y, rotation: ci.rotation,
    } as Layer;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a, layers: a.layers.map((l) => (l.id === instanceId ? swapped : l)),
      })),
    }));
  },

  getComponentInstances: (componentId: string) => {
    const state = get();
    // ⚡ Bolt Optimization: Use an imperative loop instead of artboards.flatMap(a => a.layers.filter(...))
    // This avoids intermediate array allocations and minimizes O(N) array overhead.
    const instances: Layer[] = [];
    for (const artboard of state.artboards) {
      for (const layer of artboard.layers) {
        if (layer.masterId === componentId) {
          instances.push(layer);
        }
      }
    }
    return instances;
  },

  getComponentDefinition: (componentId: string) => {
    const state = get();
    return ((state as any).componentDefinitions as Map<string, ComponentDefinition>)?.get(componentId);
  },

  addVariant: (componentId: string, variantName: string, properties: Record<string, any>) => {
    const state = get();
    const defs = new Map((state as any).componentDefinitions as Map<string, ComponentDefinition> || new Map());
    const def = defs.get(componentId);
    if (!def) return;
    const variant: ComponentVariant = { id: `var_${uuidv4()}`, name: variantName, properties };
    def.variants.push(variant);
    defs.set(componentId, { ...def });
    set({ componentDefinitions: defs } as any);
  },

  applyVariant: (instanceId: string, variantId: string) => {
    const state = get();
    let instance: Layer | null = null;
    state.artboards.forEach((a: Artboard) => { const found = a.layers.find((l: Layer) => l.id === instanceId); if (found) instance = found; });
    if (!instance || !('masterId' in instance) || !(instance as any).masterId) return;
    const def = ((state as any).componentDefinitions as Map<string, ComponentDefinition>)?.get((instance as any).masterId);
    if (!def) return;
    const variant = def.variants.find((v: ComponentVariant) => v.id === variantId);
    if (!variant) return;
    const overrides = new Set<string>((instance as any).overrides || []);
    const partial: Record<string, any> = {};
    for (const [key, value] of Object.entries(variant.properties)) { overrides.add(key); partial[key] = value; }
    const instanceIdFinal = instanceId;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a, layers: a.layers.map((l) => l.id === instanceIdFinal ? { ...l, ...partial, overrides: Array.from(overrides) } : l),
      })),
    }));
  },
});
