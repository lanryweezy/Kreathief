import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { v4 as uuidv4 } from 'uuid';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';
import { findLayerById, findLayerByComponentId } from './utils';

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
  'color',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'width',
  'height',
  'cornerRadius',
  'opacity',
  'visible',
  'stroke',
  'shadow',
  'blendMode',
  'text',
  'textAlign',
  'letterSpacing',
  'lineHeight',
  'gradient',
] as const;

export const createComponentSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, get) => ({
  componentDefinitions: new Map<string, ComponentDefinition>(),

  convertToComponent: (id) => {
    get().saveToHistory?.();
    const state = get();
    const foundInfo = findLayerById(state.artboards, id);
    if (!foundInfo) {
      return;
    }

    const componentId = `comp_${uuidv4()}`;
    const layer = foundInfo.layer;
    const defaultVarId = `var_${uuidv4()}`;
    const defs = new Map(((state as any).componentDefinitions as Map<string, ComponentDefinition>) || new Map());
    defs.set(componentId, {
      id: componentId,
      name: layer.name || 'Component',
      variants: [{ id: defaultVarId, name: 'Default', properties: {} }],
      defaultVariantId: defaultVarId,
    });
    set({ componentDefinitions: defs } as any);
    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) =>
        a.id === foundInfo.artboard.id
          ? { ...a, layers: a.layers.map((l: Layer) => (l.id === id ? { ...l, componentId } : l)) }
          : a
      ),
    }));
  },

  instantiateComponent: (componentId) => {
    get().saveToHistory?.();
    const state = get();
    const master = findLayerByComponentId(state.artboards, componentId);
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
    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) =>
        a.id === activeArtboardId ? { ...a, layers: [...a.layers, instance] } : a
      ),
      selectedLayerIds: [instance.id],
    }));
  },

  syncComponentInstances: (masterId: string) => {
    const state = get();
    const master = findLayerByComponentId(state.artboards, masterId);
    if (!master) {
      return;
    }

    const masterRef = master;
    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (l.masterId !== masterId) {
            return l;
          }
          const overrides = l.overrides || [];
          const updated = { ...l };
          for (const prop of COMPONENT_SYNCABLE_PROPERTIES) {
            if (!overrides.includes(prop)) {
              (updated as any)[prop] = (masterRef as any)[prop];
            }
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
          if (l.id !== instanceId) {
            return l;
          }
          const overrides = l.overrides || [];
          if (overrides.includes(propertyName)) {
            return l;
          }
          return { ...l, overrides: [...overrides, propertyName] };
        }),
      })),
    }));
  },

  updateInstanceLayer: (id: string, partial: Partial<Layer>) => {
    get().saveToHistory?.();
    const state = get();
    const foundInfo = findLayerById(state.artboards, id);
    if (!foundInfo || !('masterId' in foundInfo.layer) || !(foundInfo.layer as any).masterId) {
      get().updateLayer(id, partial);
      return;
    }

    const tl = foundInfo.layer as Layer;
    const overrides = new Set<string>(tl.overrides || []);
    for (const key of Object.keys(partial)) {
      if (COMPONENT_SYNCABLE_PROPERTIES.includes(key as any)) {
        overrides.add(key);
      }
    }
    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) =>
        a.id === foundInfo.artboard.id
          ? {
              ...a,
              layers: a.layers.map((l) => (l.id === id ? { ...l, ...partial, overrides: Array.from(overrides) } : l)),
            }
          : a
      ),
    }));
  },

  resetOverrides: (id) => {
    get().saveToHistory?.();
    const state = get();
    const foundInfo = findLayerById(state.artboards, id);
    if (!foundInfo || !foundInfo.layer.masterId) {
      return;
    }

    const master = findLayerByComponentId(state.artboards, foundInfo.layer.masterId);
    if (!master) {
      return;
    }

    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) =>
        a.id === foundInfo.artboard.id
          ? {
              ...a,
              layers: a.layers.map((l) => {
                if (l.id !== id) {
                  return l;
                }
                return {
                  ...structuredClone(master),
                  id: l.id,
                  x: l.x,
                  y: l.y,
                  rotation: l.rotation,
                  masterId: master!.id,
                  componentId: undefined,
                  overrides: [],
                };
              }),
            }
          : a
      ),
    }));
  },

  detachInstance: (id) => {
    get().saveToHistory?.();
    const state = get();
    const foundInfo = findLayerById(state.artboards, id);
    if (!foundInfo) {
      return;
    }

    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) =>
        a.id === foundInfo.artboard.id
          ? {
              ...a,
              layers: a.layers.map((l) =>
                l.id === id ? { ...l, masterId: undefined, overrides: undefined, componentId: undefined } : l
              ),
            }
          : a
      ),
    }));
  },

  swapInstance: (instanceId: string, newMasterId: string) => {
    get().saveToHistory?.();
    const state = get();
    const newMaster = findLayerByComponentId(state.artboards, newMasterId);
    if (!newMaster) {
      return;
    }

    const foundInstance = findLayerById(state.artboards, instanceId);
    if (!foundInstance) {
      return;
    }

    const ci = foundInstance.layer;
    const nm = newMaster as Layer;
    const swapped: Layer = {
      ...(structuredClone(nm) as any),
      id: ci.id,
      masterId: newMasterId,
      componentId: undefined,
      overrides: [],
      x: ci.x,
      y: ci.y,
      rotation: ci.rotation,
    } as Layer;
    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) =>
        a.id === foundInstance.artboard.id
          ? { ...a, layers: a.layers.map((l) => (l.id === instanceId ? swapped : l)) }
          : a
      ),
    }));
  },

  getComponentInstances: (componentId: string) => {
    const state = get();
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
    const defs = new Map(((state as any).componentDefinitions as Map<string, ComponentDefinition>) || new Map());
    const def = defs.get(componentId);
    if (!def) {
      return;
    }
    const variant: ComponentVariant = { id: `var_${uuidv4()}`, name: variantName, properties };
    def.variants.push(variant);
    defs.set(componentId, { ...def });
    set({ componentDefinitions: defs } as any);
  },

  applyVariant: (instanceId: string, variantId: string) => {
    const state = get();
    const foundInfo = findLayerById(state.artboards, instanceId);
    if (!foundInfo || !('masterId' in foundInfo.layer) || !(foundInfo.layer as any).masterId) {
      return;
    }

    const def = ((state as any).componentDefinitions as Map<string, ComponentDefinition>)?.get(
      (foundInfo.layer as any).masterId
    );
    if (!def) {
      return;
    }
    const variant = def.variants.find((v: ComponentVariant) => v.id === variantId);
    if (!variant) {
      return;
    }

    const overrides = new Set<string>((foundInfo.layer as any).overrides || []);
    const partial: Record<string, any> = {};
    for (const [key, value] of Object.entries(variant.properties)) {
      overrides.add(key);
      partial[key] = value;
    }
    set((s: any) => ({
      artboards: s.artboards.map((a: Artboard) =>
        a.id === foundInfo.artboard.id
          ? {
              ...a,
              layers: a.layers.map((l) =>
                l.id === instanceId ? { ...l, ...partial, overrides: Array.from(overrides) } : l
              ),
            }
          : a
      ),
    }));
  },
});
