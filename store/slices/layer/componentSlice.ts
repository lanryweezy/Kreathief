import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

// ─── Component Types ───────────────────────────────────────────────────────────

export interface ComponentVariant {
  id: string;
  name: string; // e.g., "Default", "Hover", "Pressed", "Disabled"
  properties: Record<string, any>; // property overrides for this variant
}

export interface ComponentDefinition {
  id: string; // componentId on the master layer
  name: string;
  description?: string;
  variants: ComponentVariant[];
  defaultVariantId: string;
  category?: string; // for organizing in library
}

export const COMPONENT_SYNCABLE_PROPERTIES = [
  'color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
  'width', 'height', 'cornerRadius', 'opacity', 'visible',
  'stroke', 'shadow', 'blendMode', 'text', 'textAlign',
  'letterSpacing', 'lineHeight', 'gradient',
] as const;

// ─── Component Slice ───────────────────────────────────────────────────────────

export const createComponentSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set, get) => ({
  componentDefinitions: new Map<string, ComponentDefinition>(),

  // ── Convert a layer to a master component ──
  convertToComponent: (id) => {
    get().saveToHistory?.();
    const componentId = `comp_${uuidv4()}`;

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) =>
          l.id === id ? { ...l, componentId } : l
        ),
      })),
    }));

    // Register component definition
    const state = get();
    const layer = state.artboards
      .flatMap((a: Artboard) => a.layers)
      .find((l: Layer) => l.id === id);

    if (layer) {
      const defs = new Map(state.componentDefinitions || new Map());
      defs.set(componentId, {
        id: componentId,
        name: layer.name || 'Component',
        variants: [{
          id: `var_${uuidv4()}`,
          name: 'Default',
          properties: {},
          defaultVariantId: '',
        }],
        defaultVariantId: `var_${uuidv4()}`,
      });
      set({ componentDefinitions: defs } as any);
    }
  },

  // ── Create an instance of a component ──
  instantiateComponent: (componentId) => {
    get().saveToHistory?.();
    const state = get();

    // Find the master layer
    let master: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l) => l.componentId === componentId);
      if (found) master = found;
    });

    if (!master) return;

    // Create instance with empty overrides (all properties inherited)
    const instance: Layer = {
      ...(structuredClone(master) as any),
      id: `${(master as any).type}_instance_${uuidv4()}`,
      masterId: componentId,
      componentId: undefined,
      overrides: [], // Empty = nothing overridden = all inherited from master
      x: (master as any).x + 40,
      y: (master as any).y + 40,
    };

    const activeArtboardId = state.activeArtboardId;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) =>
        a.id === activeArtboardId
          ? { ...a, layers: [...a.layers, instance] }
          : a
      ),
      selectedLayerIds: [instance.id],
    }));
  },

  // ── Sync master changes to all instances ──
  syncComponentInstances: (masterId: string) => {
    const state = get();
    let master: Layer | null = null;

    // Find master
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l) => l.componentId === masterId);
      if (found) master = found;
    });

    if (!master) return;

    const masterRef = master;

    // Update all instances of this master
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (l.masterId !== masterId) return l;

          // For each syncable property, check if instance has override
          const overrides = l.overrides || [];
          const updated = { ...l };

          for (const prop of COMPONENT_SYNCABLE_PROPERTIES) {
            if (!overrides.includes(prop)) {
              // Not overridden — inherit from master
              (updated as any)[prop] = (masterRef as any)[prop];
            }
          }

          return updated;
        }),
      })),
    }));
  },

  // ── Track an override on an instance ──
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

  // ── Update instance layer (auto-detect overrides) ──
  updateInstanceLayer: (id: string, partial: Partial<Layer>) => {
    get().saveToHistory?.();
    const state = get();

    // Find the layer to check if it's an instance
    let targetLayer: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l) => l.id === id);
      if (found) targetLayer = found;
    });

    if (!targetLayer || !('masterId' in targetLayer) || !(targetLayer as any).masterId) {
      // Not an instance — normal update
      get().updateLayer(id, partial);
      return;
    }

    const tl = targetLayer as Layer;
    // Auto-detect which properties are being overridden
    const overrides = new Set<string>(tl.overrides || []);
    for (const key of Object.keys(partial)) {
      if (COMPONENT_SYNCABLE_PROPERTIES.includes(key as any)) {
        overrides.add(key);
      }
    }

    // Apply update with tracked overrides
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) =>
          l.id === id
            ? { ...l, ...partial, overrides: Array.from(overrides) }
            : l
        ),
      })),
    }));
  },

  // ── Reset instance to match master (clear all overrides) ──
  resetOverrides: (id) => {
    get().saveToHistory?.();
    const state = get();

    const layer = state.artboards
      .flatMap((a: Artboard) => a.layers)
      .find((l: Layer) => l.id === id);

    if (!layer?.masterId) return;

    let master: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l: Layer) => l.componentId === layer.masterId);
      if (found) master = found;
    });

    if (!master) return;

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l: Layer) => {
          if (l.id !== id) return l;
          return {
            ...structuredClone(master),
            id: l.id,
            x: l.x,
            y: l.y,
            rotation: l.rotation,
            masterId: master!.id,
            componentId: undefined,
            overrides: [], // All clear — fully inherited
          };
        }),
      })),
    }));
  },

  // ── Detach instance from master ──
  detachInstance: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) =>
          l.id === id
            ? { ...l, masterId: undefined, overrides: undefined, componentId: undefined }
            : l
        ),
      })),
    }));
  },

  // ── Swap instance to a different component ──
  swapInstance: (instanceId: string, newMasterId: string) => {
    get().saveToHistory?.();
    const state = get();

    // Find new master
    let newMaster: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l) => l.componentId === newMasterId);
      if (found) newMaster = found;
    });

    if (!newMaster) return;

    // Find current instance
    let currentInstance: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l) => l.id === instanceId);
      if (found) currentInstance = found;
    });

    if (!currentInstance) return;

    const ci = currentInstance as Layer;
    const nm = newMaster as Layer;

    // Create new instance from new master, preserving position
    const swapped: Layer = {
      ...(structuredClone(nm) as any),
      id: ci.id, // Keep same ID
      masterId: newMasterId,
      componentId: undefined,
      overrides: [], // Fresh — no overrides on swap
      x: ci.x,
      y: ci.y,
      rotation: ci.rotation,
    } as Layer;

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === instanceId ? swapped : l)),
      })),
    }));
  },

  // ── Get all instances of a component ──
  getComponentInstances: (componentId: string) => {
    const state = get();
    return state.artboards.flatMap((a: Artboard) =>
      a.layers.filter((l) => l.masterId === componentId)
    );
  },

  // ── Get component definition ──
  getComponentDefinition: (componentId: string) => {
    const state = get();
    return (state.componentDefinitions as Map<string, ComponentDefinition>)?.get(componentId);
  },

  // ── Add variant to component ──
  addVariant: (componentId: string, variantName: string, properties: Record<string, any>) => {
    const state = get();
    const defs = new Map(state.componentDefinitions as Map<string, ComponentDefinition> || new Map());
    const def = defs.get(componentId);
    if (!def) return;

    const variant: ComponentVariant = {
      id: `var_${uuidv4()}`,
      name: variantName,
      properties,
    };

    def.variants.push(variant);
    defs.set(componentId, { ...def });
    set({ componentDefinitions: defs } as any);
  },

  // ── Apply variant to instance ──
  applyVariant: (instanceId: string, variantId: string) => {
    const state = get();
    let instance: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l: Layer) => l.id === instanceId);
      if (found) instance = found;
    });

    if (!instance || !('masterId' in instance) || !(instance as any).masterId) return;

    const def = (state.componentDefinitions as Map<string, ComponentDefinition>)?.get((instance as any).masterId);
    if (!def) return;

    const variant = def.variants.find((v: ComponentVariant) => v.id === variantId);
    if (!variant) return;

    // Apply variant properties as overrides
    const overrides = new Set<string>((instance as any).overrides || []);
    const partial: Record<string, any> = {};

    for (const [key, value] of Object.entries(variant.properties)) {
      overrides.add(key);
      partial[key] = value;
    }

    const instanceIdFinal = instanceId;
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) =>
          l.id === instanceIdFinal
            ? { ...l, ...partial, overrides: Array.from(overrides) }
            : l
        ),
      })),
    }));
  },
});
