import { StateCreator } from 'zustand';
import { Layer, TextLayer, ShapeLayer, ImageLayer, LayerFilters } from '../../types';
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

export interface LayerSlice {
  layers: Layer[];
  selectedLayerIds: string[];
  textLayers: TextLayer[];
  shapeLayers: ShapeLayer[];
  imageLayers: ImageLayer[];
  clipboardLayer: Layer | null;
  editingPathId: string | null;

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
}

export const createLayerSlice: StateCreator<any, [], [], LayerSlice> = (set, get) => ({
  layers: [],
  selectedLayerIds: [],
  textLayers: [],
  shapeLayers: [],
  imageLayers: [],
  clipboardLayer: null,
  editingPathId: null,

  setLayers: (input) =>
    set((state: any) => {
      const layers = typeof input === 'function' ? input(state.layers) : input;
      return {
        layers,
        textLayers: layers.filter((l: Layer) => l.type === 'text') as TextLayer[],
        shapeLayers: layers.filter((l: Layer) => l.type !== 'text' && l.type !== 'image') as ShapeLayer[],
        imageLayers: layers.filter((l: Layer) => l.type === 'image') as ImageLayer[],
      };
    }),

  addLayer: (layer) => {
    get().saveToHistory?.();
    set((state: any) => ({
      layers: [...state.layers, layer],
      selectedLayerIds: [layer.id],
    }));
  },

  addLayers: (newLayers) => {
    get().saveToHistory?.();
    set((state: any) => ({
      layers: [...state.layers, ...newLayers],
      selectedLayerIds: newLayers.map((l) => l.id),
    }));
  },

  addTextLayer: (style = {}) => {
    get().saveToHistory?.();
    const state = get();
    const textContent = style.text || 'Add your text';
    const autoName = textContent.length > 20 ? textContent.slice(0, 20) + '…' : textContent;
    const newLayer: TextLayer = {
      id: `text_${Date.now()}`,
      type: 'text',
      name: autoName,
      text: textContent,
      x: (state.canvasSize?.width || 1080) / 2 - 100,
      y: (state.canvasSize?.height || 1080) / 2 - 25,
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
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newLayer.id],
    }));
  },

  updateLayer: (id: string, partial: Partial<Layer>) =>
    set((state: any) => ({
      layers: state.layers.map((l: Layer) => (l.id === id ? ({ ...l, ...partial } as Layer) : l)),
    })),

  updateLayers: (updates: Record<string, Partial<Layer>>) =>
    set((state: any) => ({
      layers: state.layers.map((l: Layer) => (updates[l.id] ? ({ ...l, ...updates[l.id] } as Layer) : l)),
    })),

  deleteLayer: (id: string) => {
    get().saveToHistory?.();
    set((state: any) => ({
      layers: state.layers.filter((l: Layer) => l.id !== id),
      selectedLayerIds: state.selectedLayerIds.filter((sid: string) => sid !== id),
    }));
  },

  deleteSelected: () => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) {
      return;
    }
    get().saveToHistory?.();
    set((state: any) => ({
      layers: state.layers.filter((l: Layer) => !state.selectedLayerIds.includes(l.id)),
      selectedLayerIds: [],
    }));
  },

  duplicateLayer: (id) => {
    const { layers } = get();
    const layer = layers.find((l: Layer) => l.id === id);
    if (!layer) {
      return;
    }
    get().saveToHistory?.();
    const newLayer = {
      ...layer,
      id: `${layer.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      x: layer.x + 20,
      y: layer.y + 20,
      name: (layer.name || 'Layer') + ' Copy',
    };
    set((state: any) => ({
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newLayer.id],
    }));
  },

  duplicateSelected: () => {
    const { selectedLayerIds, layers } = get();
    if (selectedLayerIds.length === 0) {
      return;
    }
    get().saveToHistory?.();
    const newLayers: Layer[] = [];
    const newIds: string[] = [];
    selectedLayerIds.forEach((id: string) => {
      const layer = layers.find((l: Layer) => l.id === id);
      if (layer) {
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
    set((state: any) => ({
      layers: [...state.layers, ...newLayers],
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
    const { layers } = get();
    const oldIndex = layers.findIndex((l: Layer) => l.id === id);
    if (oldIndex === -1 || newIndex < 0 || newIndex >= layers.length || oldIndex === newIndex) {
      return;
    }

    get().saveToHistory?.();
    const newLayers = [...layers];
    const [removed] = newLayers.splice(oldIndex, 1);
    newLayers.splice(newIndex, 0, removed!);

    set({ layers: newLayers });
  },

  moveLayer: (id, direction) => {
    get().saveToHistory?.();
    set((state: any) => {
      const idx = state.layers.findIndex((l: Layer) => l.id === id);
      if (idx === -1) {
        return {};
      }
      const newLayers = [...state.layers];
      const item = newLayers.splice(idx, 1)[0];
      let newIndex = idx;
      if (direction === 'front') {
        newIndex = newLayers.length;
      }
      if (direction === 'back') {
        newIndex = 0;
      }
      if (direction === 'forward') {
        newIndex = Math.min(newLayers.length, idx + 1);
      }
      if (direction === 'backward') {
        newIndex = Math.max(0, idx - 1);
      }
      newLayers.splice(newIndex, 0, item!);
      return { layers: newLayers };
    });
  },

  groupSelected: () => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length < 2) {
      return;
    }
    get().saveToHistory?.();
    const newGroupId = `group_${Date.now()}`;
    set((state: any) => ({
      layers: state.layers.map((l: Layer) =>
        state.selectedLayerIds.includes(l.id) ? { ...l, groupId: newGroupId } : l
      ),
    }));
  },

  ungroupSelected: () => {
    const { selectedLayerIds, layers } = get();
    if (selectedLayerIds.length === 0) {
      return;
    }
    const selectedItems = layers.filter((l: Layer) => selectedLayerIds.includes(l.id));
    const targetGroupId = selectedItems.find((l: Layer) => l.groupId)?.groupId;
    if (!targetGroupId) {
      return;
    }

    get().saveToHistory?.();
    set((state: any) => ({
      layers: state.layers.map((l: Layer) => (l.groupId === targetGroupId ? { ...l, groupId: undefined } : l)),
    }));
  },

  nudgeLayer: (id, dx, dy) =>
    set((state: any) => ({
      layers: state.layers.map((l: Layer) => (l.id === id ? { ...l, x: l.x + dx, y: l.y + dy } : l)),
    })),

  alignLayers: (type) => {
    const { selectedLayerIds, layers } = get();
    if (selectedLayerIds.length < 2) {
      return;
    }
    get().saveToHistory?.();
    const selected = layers.filter((l: Layer) => selectedLayerIds.includes(l.id));
    let value = 0;
    if (type === 'left') {
      value = Math.min(...selected.map((l: Layer) => l.x));
    }
    if (type === 'right') {
      value = Math.max(...selected.map((l: Layer) => l.x + l.width));
    }
    if (type === 'top') {
      value = Math.min(...selected.map((l: Layer) => l.y));
    }
    if (type === 'bottom') {
      value = Math.max(...selected.map((l: Layer) => l.y + ((l as any).height || 0)));
    }
    if (type === 'center') {
      value = selected.reduce((acc: number, l: Layer) => acc + l.x + l.width / 2, 0) / selected.length;
    }
    if (type === 'middle') {
      value = selected.reduce((acc: number, l: Layer) => acc + l.y + ((l as any).height || 0) / 2, 0) / selected.length;
    }

    set((state: any) => ({
      layers: state.layers.map((l: Layer) => {
        if (!selectedLayerIds.includes(l.id)) {
          return l;
        }
        if (type === 'left') {
          return { ...l, x: value };
        }
        if (type === 'right') {
          return { ...l, x: value - l.width };
        }
        if (type === 'top') {
          return { ...l, y: value };
        }
        if (type === 'bottom') {
          return { ...l, y: value - ((l as any).height || 0) };
        }
        if (type === 'center') {
          return { ...l, x: value - l.width / 2 };
        }
        if (type === 'middle') {
          return { ...l, y: value - ((l as any).height || 0) / 2 };
        }
        return l;
      }),
    }));
  },

  distributeLayers: (type) => {
    const { selectedLayerIds, layers } = get();
    if (selectedLayerIds.length < 3) {
      return;
    }
    get().saveToHistory?.();
    const selected = [...layers.filter((l: Layer) => selectedLayerIds.includes(l.id))];
    if (type === 'horizontal') {
      const sorted = selected.sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((acc, l) => acc + l.width, 0);
      const span = sorted[sorted.length - 1]!.x + sorted[sorted.length - 1]!.width - sorted[0]!.x;
      const spacing = (span - totalWidth) / (sorted.length - 1);
      let currentX = sorted[0]!.x;
      set((state: any) => ({
        layers: state.layers.map((l: Layer) => {
          const idx = sorted.findIndex((s) => s.id === l.id);
          if (idx === -1) {
            return l;
          }
          const res = { ...l, x: currentX };
          currentX += l.width + spacing;
          return res;
        }),
      }));
    } else {
      const sorted = selected.sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((acc, l) => acc + ((l as any).height || 0), 0);
      const span = sorted[sorted.length - 1]!.y + ((sorted[sorted.length - 1] as any).height || 0) - sorted[0]!.y;
      const spacing = (span - totalHeight) / (sorted.length - 1);
      let currentY = sorted[0]!.y;
      set((state: any) => ({
        layers: state.layers.map((l: Layer) => {
          const idx = sorted.findIndex((s) => s.id === l.id);
          if (idx === -1) {
            return l;
          }
          const res = { ...l, y: currentY };
          currentY += ((l as any).height || 0) + spacing;
          return res;
        }),
      }));
    }
  },

  layoutLayers: (typeOrShapes) => {
    const { layers, selectedLayerIds, canvasSize } = get();
    const CANVAS_W = canvasSize?.width || 1080;
    const CANVAS_H = canvasSize?.height || 1080;
    const PADDING = 20;
    const phi = 0.61803398875;

    get().saveToHistory?.();

    if (Array.isArray(typeOrShapes)) {
      const templateBaseW = 512;
      const templateBaseH = 512;
      const scaleX = CANVAS_W / templateBaseW;
      const scaleY = CANVAS_H / templateBaseH;

      const newLayers = typeOrShapes.map(
        (shape) =>
          ({
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
          }) as Layer
      );

      set((state: any) => ({ layers: [...state.layers, ...newLayers] }));
      return;
    }

    const type = typeOrShapes;
    const visibleLayers = layers.filter((l: Layer) => !l.locked && l.visible);
    if (visibleLayers.length === 0 && !type.startsWith('golden')) {
      return;
    }

    const newPositions = new Map<string, { x: number; y: number; width?: number; height?: number }>();
    const getHeight = (l: Layer) => (l as any).height || (l.type === 'text' ? (l as TextLayer).fontSize * 1.2 : 100);

    const selectedLayers = layers.filter((l: Layer) => selectedLayerIds.includes(l.id) && !l.locked && l.visible);
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
        { x: 0, y: 0, w: x1, h: y1 },
        { x: x1, y: 0, w: x2 - x1, h: y1 },
        { x: x2, y: 0, w: CANVAS_W - x2, h: y1 },
        { x: 0, y: y1, w: x1, h: y2 - y1 },
        { x: x1, y: y1, w: x2 - x1, h: y2 - y1 },
        { x: x2, y: y1, w: CANVAS_W - x2, h: y2 - y1 },
        { x: 0, y: y2, w: x1, h: CANVAS_H - y2 },
        { x: x1, y: y2, w: x2 - x1, h: CANVAS_H - y2 },
        { x: x2, y: y2, w: CANVAS_W - x2, h: CANVAS_H - y2 },
      ];

      layersToLayout.slice(0, 9).forEach((l: Layer, i: number) => {
        newPositions.set(l.id, {
          x: gridCoords[i]!.x,
          y: gridCoords[i]!.y,
          width: gridCoords[i]!.w,
          height: gridCoords[i]!.h,
        });
      });
    }

    const sorted = [...visibleLayers].sort((a, b) => a.y - b.y || a.x - b.x);
    const count = sorted.length;

    if (type === 'row') {
      const totalWidth = sorted.reduce((acc: number, l: Layer) => acc + l.width, 0);
      const spacing = (CANVAS_W - 2 * PADDING - totalWidth) / Math.max(1, count - 1);
      let currentX = PADDING;
      const centerY = CANVAS_H / 2;
      sorted.forEach((l: Layer) => {
        newPositions.set(l.id, { x: count === 1 ? (CANVAS_W - l.width) / 2 : currentX, y: centerY - getHeight(l) / 2 });
        currentX += l.width + Math.max(0, spacing);
      });
    } else if (type === 'col') {
      const totalHeight = sorted.reduce((acc: number, l: Layer) => acc + getHeight(l), 0);
      const spacing = (CANVAS_H - 2 * PADDING - totalHeight) / Math.max(1, count - 1);
      let currentY = PADDING;
      const centerX = CANVAS_W / 2;
      sorted.forEach((l: Layer) => {
        newPositions.set(l.id, { x: centerX - l.width / 2, y: count === 1 ? (CANVAS_H - getHeight(l)) / 2 : currentY });
        currentY += getHeight(l) + Math.max(0, spacing);
      });
    } else if (type === 'grid') {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = (CANVAS_W - 2 * PADDING) / cols;
      const cellH = (CANVAS_H - 2 * PADDING) / rows;
      sorted.forEach((l: Layer, i: number) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        newPositions.set(l.id, {
          x: PADDING + col * cellW + cellW / 2 - l.width / 2,
          y: PADDING + row * cellH + cellH / 2 - getHeight(l) / 2,
        });
      });
    }

    set((state: any) => ({
      layers: state.layers.map((l: Layer) => {
        const pos = newPositions.get(l.id);
        return pos ? { ...l, ...pos } : l;
      }),
    }));
  },

  addImageLayer: (src: string, name?: string) => {
    get().saveToHistory?.();
    const state = get();
    const imageCount = state.layers.filter((l: Layer) => l.type === 'image').length;
    const autoName = name || `Photo ${imageCount + 1}`;
    const newLayer: ImageLayer = {
      id: `image_${Date.now()}`,
      type: 'image',
      name: autoName,
      src,
      x: (state.canvasSize?.width || 1080) / 2 - 100,
      y: (state.canvasSize?.height || 1080) / 2 - 100,
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
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newLayer.id],
      imageLayers: [...state.imageLayers, newLayer],
    }));
  },

  addShapeLayer: (type: ShapeLayer['type'], style: Partial<ShapeLayer> = {}) => {
    get().saveToHistory?.();
    const state = get();
    const newLayer: ShapeLayer = {
      id: `${type}_${Date.now()}`,
      type: type as any,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      x: (state.canvasSize?.width || 1080) / 2 - 50,
      y: (state.canvasSize?.height || 1080) / 2 - 50,
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
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newLayer.id],
      shapeLayers: [...state.shapeLayers, newLayer],
    }));
  },

  copyLayer: (id: string) => {
    const layer = get().layers.find((l: Layer) => l.id === id);
    if (layer) {
      set({ clipboardLayer: structuredClone(layer) });
    }
  },

  pasteLayer: (style: Partial<Layer> = {}) => {
    const { clipboardLayer } = get();
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
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newLayer.id],
    }));
  },

  applyTexture: (textureUrl: string, intensity?: number) =>
    set((state: any) => {
      const { selectedLayerIds, layers } = state;

      if (intensity !== undefined && state.setTextureIntensity) {
        state.setTextureIntensity(intensity);
      }

      if (selectedLayerIds.length === 0) {
        return state;
      }

      const newLayers = layers.map((l: Layer) => {
        if (selectedLayerIds.includes(l.id) && l.type === 'text') {
          return {
            ...l,
            decorations: {
              ...(l as TextLayer).decorations,
              textures: [textureUrl],
            },
          } as TextLayer;
        }
        return l;
      });

      return { layers: newLayers };
    }),

  removeTexture: () =>
    set((state: any) => {
      const { selectedLayerIds, layers } = state;
      if (selectedLayerIds.length === 0) {
        return state;
      }

      const newLayers = layers.map((l: Layer) => {
        if (selectedLayerIds.includes(l.id) && l.type === 'text') {
          const { textures: _textures, ...remainingDecorations } = (l as TextLayer).decorations || {};
          return {
            ...l,
            decorations: remainingDecorations,
          } as TextLayer;
        }
        return l;
      });

      return { layers: newLayers };
    }),

  setEditingPathId: (editingPathId) => set({ editingPathId }),

  onUpdatePath: (id, updates) =>
    set((state: any) => ({
      layers: state.layers.map((l: Layer) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  applyMask: (targetId, maskId) =>
    set((state: any) => ({
      layers: state.layers.map((l: Layer) => (l.id === targetId ? { ...l, maskLayerId: maskId || undefined } : l)),
    })),
});
