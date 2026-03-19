import { StateCreator } from 'zustand';
import { Layer, TextLayer, ShapeLayer, ImageLayer, LayerFilters, Artboard } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_LAYER_FILTERS: LayerFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  vignette: 0,
  hueRotate: 0,
};
function applyAutoLayout(layers: Layer[]): Layer[] {
  const containers = layers.filter((l) => l.autoLayout && l.groupId);
  if (containers.length === 0) {return layers;}

  const nextLayers = [...layers];
  containers.forEach((container) => {
    const children = nextLayers.filter((l) => l.groupId === container.groupId && l.id !== container.id);
    if (children.length === 0) {return;}

    if (container.autoLayout!.direction === 'row') {
      children.sort((a, b) => a.x - b.x);
    } else {
      children.sort((a, b) => a.y - b.y);
    }

    const pad = container.autoLayout!.padding;
    const pt = typeof pad === 'number' ? pad : pad.top;
    const pr = typeof pad === 'number' ? pad : pad.right;
    const pb = typeof pad === 'number' ? pad : pad.bottom;
    const pl = typeof pad === 'number' ? pad : pad.left;
    const spacing = container.autoLayout!.spacing;
    const align = container.autoLayout!.alignment;

    if (container.autoLayout!.direction === 'row') {
      let currentX = container.x + pl;
      let maxH = 0;
      children.forEach((c) => {
        const h = (c as any).height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 0);
        if (h > maxH) {maxH = h;}
      });

      const containerHeight = maxH + pt + pb;
      const targetCenterY = container.y + containerHeight / 2;

      children.forEach((c) => {
        const w = (c as any).width || 0;
        const h = (c as any).height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 0);

        let targetY = container.y + pt;
        if (align === 'center') {targetY = targetCenterY - h / 2;}
        else if (align === 'end') {targetY = container.y + containerHeight - pb - h;}

        const idx = nextLayers.findIndex((l) => l.id === c.id);
        if (idx !== -1) {nextLayers[idx] = { ...nextLayers[idx], x: currentX, y: targetY } as any;}
        currentX += w + spacing;
      });

      const cIdx = nextLayers.findIndex((l) => l.id === container.id);
      if (cIdx !== -1) {
        nextLayers[cIdx] = {
          ...nextLayers[cIdx],
          width: currentX - spacing - container.x + pr,
          height: containerHeight,
        } as any;
      }
    } else {
      let currentY = container.y + pt;
      let maxW = 0;
      children.forEach((c) => {
        const w = (c as any).width || 0;
        if (w > maxW) {maxW = w;}
      });

      const containerWidth = maxW + pl + pr;
      const targetCenterX = container.x + containerWidth / 2;

      children.forEach((c) => {
        const h = (c as any).height || (c.type === 'text' ? (c as TextLayer).fontSize * 1.2 : 0);
        const w = (c as any).width || 0;

        let targetX = container.x + pl;
        if (align === 'center') {targetX = targetCenterX - w / 2;}
        else if (align === 'end') {targetX = container.x + containerWidth - pr - w;}

        const idx = nextLayers.findIndex((l) => l.id === c.id);
        if (idx !== -1) {nextLayers[idx] = { ...nextLayers[idx], x: targetX, y: currentY } as any;}
        currentY += h + spacing;
      });

      const cIdx = nextLayers.findIndex((l) => l.id === container.id);
      if (cIdx !== -1) {
        nextLayers[cIdx] = {
          ...nextLayers[cIdx],
          width: containerWidth,
          height: currentY - spacing - container.y + pb,
        } as any;
      }
    }
  });

  return nextLayers;
}

export interface LayerSlice {
  artboards: Artboard[];
  activeArtboardId: string;
  selectedLayerIds: string[];
  clipboardLayer: Layer | null;
  editingPathId: string | null;

  // Artboard Actions
  setArtboards: (artboards: Artboard[]) => void;
  setActiveArtboardId: (id: string) => void;
  addArtboard: (name?: string, width?: number, height?: number) => void;
  deleteArtboard: (id: string) => void;
  updateArtboard: (id: string, partial: Partial<Artboard>) => void;

  // Layer Actions (Now targeting active artboard)
  setLayers: (layers: Layer[] | ((prev: Layer[]) => Layer[])) => void;
  addLayer: (layer: Layer) => void;
  addLayers: (layers: Layer[]) => void;
  addTextLayer: (style?: Partial<TextLayer>) => void;
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
  addImageLayer: (src: string, name?: string) => void;
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
}

export const createLayerSlice: StateCreator<any, [], [], LayerSlice> = (set, get) => ({
  artboards: [
    {
      id: 'default',
      name: 'Artboard 1',
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      layers: [],
    }
  ],
  activeArtboardId: 'default',
  selectedLayerIds: [],
  clipboardLayer: null,
  editingPathId: null,

  setArtboards: (artboards) => set({ artboards }),
  setActiveArtboardId: (activeArtboardId) => set({ activeArtboardId, selectedLayerIds: [] }),

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
    if (get().artboards.length <= 1) {return;}
    get().saveToHistory?.();
    set((state: any) => {
      const artboards = state.artboards.filter((a: Artboard) => a.id !== id);
      return {
        artboards,
        activeArtboardId: state.activeArtboardId === id ? artboards[0].id : state.activeArtboardId,
      };
    });
  },

  updateArtboard: (id, partial) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => a.id === id ? { ...a, ...partial } : a),
    })),

  setLayers: (input) =>
    set((state: any) => {
      const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
      if (!artboard) {return {};}
      const layers = typeof input === 'function' ? input(artboard.layers) : input;
      return {
        artboards: state.artboards.map((a: Artboard) => a.id === state.activeArtboardId ? { ...a, layers } : a),
      };
    }),

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
    if (!artboard) {return;}

    const textContent = style.text || 'Add your text';
    const autoName = textContent.length > 20 ? textContent.slice(0, 20) + '…' : textContent;
    const newLayer: TextLayer = {
      id: `text_${Date.now()}`,
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

  updateLayer: (id: string, partial: Partial<Layer>) =>
    set((state: any) => {
      let masterComponentId = '';
      
      // Find if we are updating a master
      state.artboards.forEach((a: Artboard) => {
        const l = a.layers.find((ly: Layer) => ly.id === id);
        if (l && l.componentId) {masterComponentId = l.componentId;}
      });

      const nextArtboards = state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l: Layer) => {
          if (l.id === id) {
            const next = { ...l, ...partial } as any;
            
            // Handle lock proportions
            if (l.lockProportions && (partial.width || partial.height)) {
              const ratio = l.width / ((l as any).height || l.width);
              if (partial.width && !partial.height) {next.height = Math.round(partial.width / ratio);}
              else if (partial.height && !partial.width) {next.width = Math.round(partial.height * ratio);}
            }

            // If updating an instance directly, track overrides
            if (l.masterId && !masterComponentId) {
              const newOverrides = [...(l.overrides || [])];
              Object.keys(partial).forEach(key => {
                if (!newOverrides.includes(key)) {newOverrides.push(key);}
              });
              next.overrides = newOverrides;
            }
            
            return next;
          }

          // Sync from Master to Instance
          if (masterComponentId && l.masterId === masterComponentId) {
            const syncUpdates: any = {};
            Object.keys(partial).forEach(key => {
              if (!(l.overrides || []).includes(key)) {
                syncUpdates[key] = (partial as any)[key];
              }
            });
            return { ...l, ...syncUpdates };
          }

          return l;
        }),
      }));
      
      return {
        artboards: nextArtboards.map((a: Artboard) => ({
          ...a,
          layers: applyAutoLayout(a.layers),
        })),
      };
    }),

  updateLayers: (updates: Record<string, Partial<Layer>>) =>
    set((state: any) => {
      // For multi-layer updates, we process each update sequentially to handle syncing
      let currentArtboards = [...state.artboards];
      
      Object.entries(updates).forEach(([id, partial]) => {
        let masterId = '';
        currentArtboards.forEach((a: Artboard) => {
          const l = a.layers.find((ly: Layer) => ly.id === id);
          if (l && l.componentId) {masterId = l.componentId;}
        });

        currentArtboards = currentArtboards.map((a: Artboard) => ({
          ...a,
          layers: a.layers.map((l: Layer) => {
            if (l.id === id) {
              const next = { ...l, ...partial } as any;
              if (l.masterId && !masterId) {
                const newOverrides = [...(l.overrides || [])];
                Object.keys(partial).forEach((k: string) => { if (!newOverrides.includes(k)) {newOverrides.push(k);} });
                next.overrides = newOverrides;
              }
              return next;
            }
            if (masterId && l.masterId === masterId) {
              const sync: any = {};
              Object.keys(partial).forEach((k: string) => { if (!(l.overrides || []).includes(k)) {sync[k] = (partial as any)[k];} });
              return { ...l, ...sync };
            }
            return l;
          })
        }));
      });
      
      return {
        artboards: currentArtboards.map((a: Artboard) => ({
          ...a,
          layers: applyAutoLayout(a.layers),
        })),
      };
    }),

  deleteLayer: (id: string) => {
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
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) {return;}
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.filter((l: Layer) => !state.selectedLayerIds.includes(l.id)),
      })),
      selectedLayerIds: [],
    }));
  },

  duplicateLayer: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const layer = a.layers.find((l: Layer) => l.id === id);
        if (!layer) {return a;}
        const newLayer = {
          ...structuredClone(layer),
          id: `${layer.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          x: layer.x + 20,
          y: layer.y + 20,
          name: (layer.name || 'Layer') + ' Copy',
        };
        return { ...a, layers: [...a.layers, newLayer] };
      }),
      selectedLayerIds: [state.selectedLayerIds[0]], // This is a bit tricky, might need to find the new ID
    }));
  },

  duplicateSelected: () => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) {return;}
    get().saveToHistory?.();
    const newIds: string[] = [];
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const newLayers: Layer[] = [];
        a.layers.forEach((layer) => {
          if (selectedLayerIds.includes(layer.id)) {
            const newLayer = {
              ...structuredClone(layer),
              id: `${layer.type}_${Date.now()}_${Math.random()}`,
              x: layer.x + 20,
              y: layer.y + 20,
            };
            newLayers.push(newLayer);
            newIds.push(newLayer.id);
          }
        });
        return { ...a, layers: [...a.layers, ...newLayers] };
      }),
      selectedLayerIds: newIds,
    }));
  },

  selectLayer: (id) => set({ selectedLayerIds: id ? [id] : [] }),

  multiSelectLayer: (id, shiftKey) =>
    set((state: any) => {
      if (!shiftKey) {
        return { selectedLayerIds: [id] };
      }
      if (state.selectedLayerIds.includes(id)) {
        return { selectedLayerIds: state.selectedLayerIds.filter((i: string) => i !== id) };
      }
      return { selectedLayerIds: [...state.selectedLayerIds, id] };
    }),

  setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),

  reorderLayer: (id, newIndex) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const idx = a.layers.findIndex((l) => l.id === id);
        if (idx === -1) {return a;}
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
        if (idx === -1) {return a;}
        const newLayers = [...a.layers];
        const item = newLayers.splice(idx, 1)[0];
        let newIndex = idx;
        if (direction === 'front') {newIndex = newLayers.length;}
        if (direction === 'back') {newIndex = 0;}
        if (direction === 'forward') {newIndex = Math.min(newLayers.length, idx + 1);}
        if (direction === 'backward') {newIndex = Math.max(0, idx - 1);}
        newLayers.splice(newIndex, 0, item!);
        return { ...a, layers: newLayers };
      }),
    }));
  },

  groupSelected: () => {
    const { selectedLayerIds, activeArtboardId } = get();
    if (selectedLayerIds.length < 2) {return;}
    get().saveToHistory?.();

    const newGroupId = `group_${Date.now()}`;
    const activeArtboard = get().artboards.find((a: Artboard) => a.id === activeArtboardId);
    const groupCount = activeArtboard?.layers.filter((l: Layer) => l.groupId === newGroupId).length ?? 0;
    const groupName = `Group ${groupCount + 1}`;

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        if (a.id !== activeArtboardId) {return a;}
        
        // Find the minimum index among selected layers to position group correctly
        const indices = selectedLayerIds.map((id: string) => a.layers.findIndex((l: Layer) => l.id === id));
        const minIndex = Math.min(...indices);
        
        // Create a group marker layer (folder-style)
        const groupMarker: Layer = {
          id: newGroupId,
          type: 'shape',
          name: groupName,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          groupId: undefined,
          isGroup: true,
          isExpanded: true,
          color: '#7d2ae8',
        } as any;
        
        // Assign groupId to selected layers and remove them from array
        const remainingLayers = a.layers.filter((l: Layer) => !selectedLayerIds.includes(l.id));
        const groupedLayers = a.layers
          .filter((l: Layer) => selectedLayerIds.includes(l.id))
          .map((l: Layer) => ({ ...l, groupId: newGroupId }));
        
        // Insert group marker and its layers at the correct position
        const newLayers = [
          ...remainingLayers.slice(0, minIndex),
          groupMarker,
          ...groupedLayers,
          ...remainingLayers.slice(minIndex),
        ];
        
        return { ...a, layers: newLayers };
      }),
      selectedLayerIds: [newGroupId],
    }));
  },

  ungroupSelected: () => {
    const { selectedLayerIds, activeArtboardId } = get();
    if (selectedLayerIds.length === 0) {return;}
    get().saveToHistory?.();
    
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        if (a.id !== activeArtboardId) {return a;}
        
        const layersToUngroup = a.layers.filter((l: Layer) => selectedLayerIds.includes(l.id) && l.groupId);
        if (layersToUngroup.length === 0) {return a;}
        
        // Get all unique group IDs to ungroup
        const groupIdsToUngroup = [...new Set(layersToUngroup.map((l: Layer) => l.groupId!))];

        // Remove group markers and remove groupId from layers
        const newLayers = a.layers
          .filter((l: Layer) => !groupIdsToUngroup.includes(l.id)) // Remove group markers
          .map((l: Layer) => {
            if (groupIdsToUngroup.includes(l.groupId!)) {
              const { groupId: _groupId, ...rest } = l;
              return rest as Layer;
            }
            return l;
          });

        return { ...a, layers: newLayers };
      }),
      selectedLayerIds: [],
    }));
  },

  nudgeLayer: (id, dx, dy) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => l.id === id ? { ...l, x: l.x + dx, y: l.y + dy } : l),
      })),
    })),

  alignLayers: (type) => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length < 2) {return;}
    get().saveToHistory?.();
    
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const selected = a.layers.filter((l) => selectedLayerIds.includes(l.id));
        if (selected.length < 2) {return a;}

        let value = 0;
        if (type === 'left') {value = Math.min(...selected.map((l) => l.x));}
        if (type === 'right') {value = Math.max(...selected.map((l) => l.x + l.width));}
        if (type === 'top') {value = Math.min(...selected.map((l) => l.y));}
        if (type === 'bottom') {value = Math.max(...selected.map((l) => l.y + ((l as any).height || 0)));}
        if (type === 'center') {value = selected.reduce((acc, l) => acc + l.x + l.width / 2, 0) / selected.length;}
        if (type === 'middle') {value = selected.reduce((acc, l) => acc + l.y + ((l as any).height || 0) / 2, 0) / selected.length;}

        return {
          ...a,
          layers: a.layers.map((l) => {
            if (!selectedLayerIds.includes(l.id)) {return l;}
            if (type === 'left') {return { ...l, x: value };}
            if (type === 'right') {return { ...l, x: value - l.width };}
            if (type === 'top') {return { ...l, y: value };}
            if (type === 'bottom') {return { ...l, y: value - ((l as any).height || 0) };}
            if (type === 'center') {return { ...l, x: value - l.width / 2 };}
            if (type === 'middle') {return { ...l, y: value - ((l as any).height || 0) / 2 };}
            return l;
          }),
        };
      }),
    }));
  },

  distributeLayers: (type) => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length < 3) {return;}
    get().saveToHistory?.();
    
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const selected = [...a.layers.filter((l) => selectedLayerIds.includes(l.id))];
        if (selected.length < 3) {return a;}

        if (type === 'horizontal') {
          const sorted = selected.sort((a, b) => a.x - b.x);
          const totalWidth = sorted.reduce((acc, l) => acc + l.width, 0);
          const span = sorted[sorted.length - 1]!.x + sorted[sorted.length - 1]!.width - sorted[0]!.x;
          const spacing = (span - totalWidth) / (sorted.length - 1);
          let currentX = sorted[0]!.x;
          return {
            ...a,
            layers: a.layers.map((l) => {
              const idx = sorted.findIndex((s) => s.id === l.id);
              if (idx === -1) {return l;}
              const res = { ...l, x: currentX };
              currentX += l.width + spacing;
              return res;
            }),
          };
        } else {
          const sorted = selected.sort((a, b) => a.y - b.y);
          const totalHeight = sorted.reduce((acc, l) => acc + ((l as any).height || 0), 0);
          const span = sorted[sorted.length - 1]!.y + ((sorted[sorted.length - 1] as any).height || 0) - sorted[0]!.y;
          const spacing = (span - totalHeight) / (sorted.length - 1);
          let currentY = sorted[0]!.y;
          return {
            ...a,
            layers: a.layers.map((l) => {
              const idx = sorted.findIndex((s) => s.id === l.id);
              if (idx === -1) {return l;}
              const res = { ...l, y: currentY };
              currentY += ((l as any).height || 0) + spacing;
              return res;
            }),
          };
        }
      }),
    }));
  },

  layoutLayers: (typeOrShapes: 'grid' | 'row' | 'col' | 'golden_v' | 'golden_h' | 'golden_grid' | Partial<ShapeLayer>[]) => {
    get().saveToHistory?.();
    const state = get();
    const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!artboard) {return;}

    const CANVAS_W = artboard.width;
    const CANVAS_H = artboard.height;
    const PADDING = 20;
    const phi = 0.61803398875;

    if (Array.isArray(typeOrShapes)) {
      const templateBaseW = 512;
      const templateBaseH = 512;
      const scaleX = CANVAS_W / templateBaseW;
      const scaleY = CANVAS_H / templateBaseH;

      const newLayers = typeOrShapes.map((shape) => ({
        id: uuidv4(),
        type: 'rectangle',
        x: (shape.x || 0) * scaleX,
        y: (shape.y || 0) * scaleY,
        width: (shape.width || 100) * scaleX,
        height: (shape.height || 100) * scaleY,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        color: shape.color || '#333333',
        ...shape,
      })) as Layer[];

      set((state: any) => ({
        artboards: state.artboards.map((a: Artboard) => 
          a.id === state.activeArtboardId ? { ...a, layers: [...a.layers, ...newLayers] } : a
        )
      }));
      return;
    }

    const type = typeOrShapes;
    const visibleLayers = artboard.layers.filter((l: Layer) => !l.locked && l.visible);
    if (visibleLayers.length === 0 && !type.startsWith('golden')) {return;}

    const newPositions = new Map<string, { x: number; y: number; width?: number; height?: number }>();
    const getHeight = (l: Layer) => (l as any).height || (l.type === 'text' ? (l as TextLayer).fontSize * 1.2 : 100);

    const selectedLayers = artboard.layers.filter((l: Layer) => state.selectedLayerIds.includes(l.id) && !l.locked && l.visible);
    const layersToLayout = selectedLayers.length > 0 ? selectedLayers : visibleLayers;

    if (type === 'golden_v') {
      const splitX = CANVAS_W * phi;
      if (layersToLayout.length >= 2) {
        newPositions.set(layersToLayout[0]!.id, { x: 0, y: 0, width: splitX, height: CANVAS_H });
        newPositions.set(layersToLayout[1]!.id, { x: splitX, y: 0, width: CANVAS_W - splitX, height: CANVAS_H });
      } else if (layersToLayout.length === 1) {
        newPositions.set(layersToLayout[0]!.id, { x: 0, y: 0, width: splitX, height: CANVAS_H });
      }
    } else if (type === 'golden_h') {
      const splitY = CANVAS_H * phi;
      if (layersToLayout.length >= 2) {
        newPositions.set(layersToLayout[0]!.id, { x: 0, y: 0, width: CANVAS_W, height: splitY });
        newPositions.set(layersToLayout[1]!.id, { x: 0, y: splitY, width: CANVAS_W, height: CANVAS_H - splitY });
      } else if (layersToLayout.length === 1) {
        newPositions.set(layersToLayout[0]!.id, { x: 0, y: 0, width: CANVAS_W, height: splitY });
      }
    } else if (type === 'golden_grid') {
      const x1 = CANVAS_W * (1 - phi);
      const x2 = CANVAS_W * phi;
      const y1 = CANVAS_H * (1 - phi);
      const y2 = CANVAS_H * phi;

      const gridCoords = [
        { x: 0, y: 0, w: x1, h: y1 }, { x: x1, y: 0, w: x2 - x1, h: y1 }, { x: x2, y: 0, w: CANVAS_W - x2, h: y1 },
        { x: 0, y: y1, w: x1, h: y2 - y1 }, { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, { x: x2, y: y1, w: CANVAS_W - x2, h: y2 - y1 },
        { x: 0, y: y2, w: x1, h: CANVAS_H - y2 }, { x: x1, y: y2, w: x2 - x1, h: CANVAS_H - y2 }, { x: x2, y: y2, w: CANVAS_W - x2, h: CANVAS_H - y2 },
      ];

      layersToLayout.slice(0, 9).forEach((l: Layer, i: number) => {
        newPositions.set(l.id, { x: gridCoords[i]!.x, y: gridCoords[i]!.y, width: gridCoords[i]!.w, height: gridCoords[i]!.h });
      });
    }

    const sorted = [...visibleLayers].sort((a, b) => a.y - b.y || a.x - b.x);
    const count = sorted.length;

    if (type === 'row') {
      const totalWidth = sorted.reduce((acc, l) => acc + l.width, 0);
      const spacing = (CANVAS_W - 2 * PADDING - totalWidth) / Math.max(1, count - 1);
      let currentX = PADDING;
      sorted.forEach((l) => {
        newPositions.set(l.id, { x: count === 1 ? (CANVAS_W - l.width) / 2 : currentX, y: CANVAS_H / 2 - getHeight(l) / 2 });
        currentX += l.width + Math.max(0, spacing);
      });
    } else if (type === 'col') {
      const totalHeight = sorted.reduce((acc, l) => acc + getHeight(l), 0);
      const spacing = (CANVAS_H - 2 * PADDING - totalHeight) / Math.max(1, count - 1);
      let currentY = PADDING;
      sorted.forEach((l) => {
        newPositions.set(l.id, { x: CANVAS_W / 2 - l.width / 2, y: count === 1 ? (CANVAS_H - getHeight(l)) / 2 : currentY });
        currentY += getHeight(l) + Math.max(0, spacing);
      });
    } else if (type === 'grid') {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = (CANVAS_W - 2 * PADDING) / cols;
      const cellH = (CANVAS_H - 2 * PADDING) / rows;
      sorted.forEach((l, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        newPositions.set(l.id, { x: PADDING + col * cellW + cellW / 2 - l.width / 2, y: PADDING + row * cellH + cellH / 2 - getHeight(l) / 2 });
      });
    }

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          const pos = newPositions.get(l.id);
          return pos ? { ...l, ...pos } : l;
        })
      }))
    }));
  },

  addImageLayer: (src, name) => {
    get().saveToHistory?.();
    const state = get();
    const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!artboard) {return;}

    const newLayer: ImageLayer = {
      id: `image_${Date.now()}`,
      type: 'image',
      name: name || 'Photo',
      src,
      x: artboard.width / 2 - 100,
      y: artboard.height / 2 - 100,
      width: 200,
      height: 200,
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
    if (!artboard) {return;}

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

  copyLayer: (id) => {
    const { artboards } = get();
    artboards.forEach((a: Artboard) => {
      const layer = a.layers.find((l) => l.id === id);
      if (layer) {set({ clipboardLayer: structuredClone(layer) });}
    });
  },

  pasteLayer: (style = {}) => {
    const { clipboardLayer, activeArtboardId } = get();
    if (!clipboardLayer) {return;}
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
        })
      }))
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
        })
      }))
    })),

  setEditingPathId: (id) => set({ editingPathId: id }),

  onUpdatePath: (id, updates) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => l.id === id ? { ...l, ...updates } : l)
      }))
    })),

  applyMask: (targetId, maskId) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => l.id === targetId ? { ...l, maskLayerId: maskId || undefined } : l)
      }))
    })),

  convertToComponent: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => l.id === id ? { ...l, componentId: `comp_${uuidv4()}` } : l)
      }))
    }));
  },

  instantiateComponent: (componentId) => {
    get().saveToHistory?.();
    const state = get();
    let master: Layer | null = null;
    state.artboards.forEach((a: Artboard) => {
      const found = a.layers.find(l => l.componentId === componentId);
      if (found) {master = found;}
    });

    if (!master) {return;}

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
        layers: a.layers.map((l) => l.id === id ? { ...l, masterId: undefined, overrides: undefined } : l)
      }))
    }));
  },

  resetOverrides: (id) => {
    get().saveToHistory?.();
    const currentState = get();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const layer = a.layers.find((l: Layer) => l.id === id);
        if (!layer || !layer.masterId) {return a;}
        
        let master: any = null;
        currentState.artboards.forEach((art: Artboard) => {
          const m = art.layers.find((l: Layer) => l.componentId === layer.masterId);
          if (m) {master = m;}
        });

        if (!master) {return a;}

        return {
          ...a,
          layers: a.layers.map((l: Layer) => {
            if (l.id !== id) {return l;}
            return {
              ...structuredClone(master),
              id: l.id,
              x: l.x,
              y: l.y,
              rotation: l.rotation, // Keep spatial positioning
              masterId: master.componentId,
              componentId: undefined,
              overrides: [],
            };
          })
        };
      })
    }));
  },
});
