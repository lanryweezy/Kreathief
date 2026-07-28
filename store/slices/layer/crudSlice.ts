import { generateLayerId } from '../../../utils/layers/layerUtils';
import { log } from '../../../utils/log';

import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { v4 as uuidv4 } from 'uuid';
import * as geminiService from '../../../services/geminiService';
import { Layer, TextLayer, ShapeLayer, Artboard, ImageLayer } from '../../../types';
import { LayerSlice } from './baseSlice';
import { DEFAULT_LAYER_FILTERS } from './utils';
import { DEFAULT_CORNER_RADIUS } from '../../../constants';

export const createCRUDSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, get) => ({
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

  magicResize: (newWidth: number, newHeight: number, newName?: string) => {
    if (!isFinite(newWidth) || !isFinite(newHeight) || newWidth < 1 || newHeight < 1) {
      log.warn('magicResize called with invalid dimensions', { newWidth, newHeight });
      return;
    }
    get().saveToHistory?.();
    const state = get();
    const currentArtboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!currentArtboard) {
      return;
    }

    const oldWidth = currentArtboard.width;
    const oldHeight = currentArtboard.height;

    const id = uuidv4();
    const lastArtboard = state.artboards[state.artboards.length - 1];
    const x = lastArtboard ? lastArtboard.x + lastArtboard.width + 100 : 0;

    const newLayers = currentArtboard.layers.map((l: Layer) => {
      const cloned = structuredClone(l);
      cloned.id = uuidv4();

      const constraints = l.constraints || { horizontal: 'scale', vertical: 'scale' };
      let lx = l.x;
      let ly = l.y;
      let lw = (l as any).width || 0;
      let lh = (l as any).height || 0;

      switch (constraints.horizontal) {
        case 'start':
          break;
        case 'end': {
          const rightDist = oldWidth - (lx + lw);
          lx = newWidth - lw - rightDist;
          break;
        }
        case 'center': {
          const centerX = lx + lw / 2;
          const relCenterX = centerX / oldWidth;
          lx = relCenterX * newWidth - lw / 2;
          break;
        }
        case 'both': {
          const leftDistBoth = lx;
          const rightDistBoth = oldWidth - (lx + lw);
          lx = leftDistBoth;
          lw = newWidth - leftDistBoth - rightDistBoth;
          break;
        }
        case 'scale':
        default: {
          const relX = lx / oldWidth;
          const relW = lw / oldWidth;
          lx = relX * newWidth;
          lw = relW * newWidth;
          break;
        }
      }

      switch (constraints.vertical) {
        case 'start':
          break;
        case 'end': {
          const bottomDist = oldHeight - (ly + lh);
          ly = newHeight - lh - bottomDist;
          break;
        }
        case 'center': {
          const centerY = ly + lh / 2;
          const relCenterY = centerY / oldHeight;
          ly = relCenterY * newHeight - lh / 2;
          break;
        }
        case 'both': {
          const topDistBoth = ly;
          const bottomDistBoth = oldHeight - (ly + lh);
          ly = topDistBoth;
          lh = newHeight - topDistBoth - bottomDistBoth;
          break;
        }
        case 'scale':
        default: {
          const relY = ly / oldHeight;
          const relH = lh / oldHeight;
          ly = relY * newHeight;
          lh = relH * newHeight;
          break;
        }
      }

      cloned.x = lx;
      cloned.y = ly;
      if ((cloned as any).width !== undefined) {
        (cloned as any).width = Math.max(1, lw);
      }
      if ((cloned as any).height !== undefined) {
        (cloned as any).height = Math.max(1, lh);
      }

      if (cloned.type === 'text') {
        const textLayer = cloned as TextLayer;
        const scale = Math.min(newWidth / oldWidth, newHeight / oldHeight);
        textLayer.fontSize *= scale;
      }
      return cloned;
    });

    set((state: any) => ({
      artboards: [
        ...state.artboards,
        {
          id,
          name: newName || `${currentArtboard.name} (Resized)`,
          x,
          y: 0,
          width: newWidth,
          height: newHeight,
          layers: newLayers,
          backgroundColor: currentArtboard.backgroundColor,
        },
      ],
      activeArtboardId: id,
      selectedLayerIds: [],
    }));
  },

  deleteArtboard: (id) => {
    if (get().artboards.length <= 1) {
      return;
    }
    get().saveToHistory?.();
    set((state: any) => {
      const artboards = state.artboards.filter((a: Artboard) => a.id !== id);
      return { artboards, activeArtboardId: state.activeArtboardId === id ? artboards[0].id : state.activeArtboardId };
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
    let autoName = textContent.length > 20 ? textContent.slice(0, 20) + '…' : textContent;
    const fontSize = style.fontSize || 40;
    const estimatedWidth = Math.max(200, textContent.length * (fontSize * 0.6));
    const width = style.width || estimatedWidth;

    let exactMatchCount = 0;
    const existingTextCount = artboard.layers.filter((l: any) => l.type === 'text').length;
    // Check existing layers to prevent exact name overlaps and generate unique names
    artboard.layers.forEach((l: any) => {
      if (l.type === 'text' && l.text === textContent) {
        exactMatchCount++;
      }
    });

    if (exactMatchCount > 0) {
      autoName = `${autoName} ${exactMatchCount + 1}`;
    }

    // True bounding-box collision detection: intelligently find empty space
    let targetX = Math.max(20, artboard.width / 2 - width / 2);
    let targetY = Math.max(20, artboard.height / 2 - fontSize / 2);
    const padding = 20;

    let hasCollision = true;
    let attempts = 0;
    while (hasCollision && attempts < 15) {
      hasCollision = artboard.layers.some((l: any) => {
        if (!l.visible) {
          return false;
        }
        const lRight = l.x + (l.width || 100) + padding;
        const lBottom = l.y + (l.height || 50) + padding;
        const tRight = targetX + width + padding;
        const tBottom = targetY + fontSize + padding;
        return !(targetX >= lRight || tRight <= l.x - padding || targetY >= lBottom || tBottom <= l.y - padding);
      });

      if (hasCollision) {
        targetY += fontSize + 24;
        if (targetY + fontSize > artboard.height - 40) {
          targetY = 40;
          targetX += 40;
        }
        attempts++;
      }
    }

    const newLayer: TextLayer = {
      id: uuidv4(),
      type: 'text',
      name: autoName,
      text: textContent,
      x: targetX,
      y: targetY,
      width: width,
      height: fontSize,
      rotation: 0,
      fontSize: fontSize,
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

  addAdjustmentLayer: () => {
    get().saveToHistory?.();
    const state = get();
    const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!artboard) {
      return;
    }
    const newLayer = {
      id: `adj_${Date.now()}`,
      type: 'adjustment' as const,
      name: 'Adjustment Layer',
      x: 0,
      y: 0,
      width: artboard.width,
      height: artboard.height,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      adjustmentFilters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        hueRotate: 0,
        sepia: 0,
        invert: 0,
      },
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
      id: generateLayerId('image'),
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
      id: `${type}_${uuidv4().substring(0, 8)}`,
      type: type as any,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      x: artboard.width / 2 - 50,
      y: artboard.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      color: '#334155',
      cornerRadius: DEFAULT_CORNER_RADIUS,
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
      stroke: { color: '#94a3b8', width: 1 },
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
      const MAX_SAFE_VAL = 10000;
      const MIN_SAFE_VAL = -10000;
      const sanitizedPartial = { ...partial };
      if (partial.x !== undefined) {
        sanitizedPartial.x = Math.max(MIN_SAFE_VAL, Math.min(MAX_SAFE_VAL, partial.x));
      }
      if (partial.y !== undefined) {
        sanitizedPartial.y = Math.max(MIN_SAFE_VAL, Math.min(MAX_SAFE_VAL, partial.y));
      }
      if ((partial as any).width !== undefined) {
        (sanitizedPartial as any).width = Math.max(1, Math.min(MAX_SAFE_VAL, (partial as any).width));
      }
      if ((partial as any).height !== undefined) {
        (sanitizedPartial as any).height = Math.max(1, Math.min(MAX_SAFE_VAL, (partial as any).height));
      }
      if (partial.opacity !== undefined) {
        sanitizedPartial.opacity =
          typeof partial.opacity === 'number' && !isNaN(partial.opacity)
            ? Math.max(0, Math.min(1, partial.opacity))
            : 1;
      }

      let masterComponentId = '';
      for (const a of state.artboards) {
        const l = a.layers.find((ly: Layer) => ly.id === id);
        if (l?.componentId) {
          masterComponentId = l.componentId;
          break;
        }
      }

      return {
        artboards: state.artboards.map((a: Artboard) => ({
          ...a,
          layers: a.layers.map((l: Layer) => {
            if (l.id === id) {
              if (
                l.locked &&
                sanitizedPartial.locked !== false &&
                !('locked' in sanitizedPartial && Object.keys(sanitizedPartial).length === 1)
              ) {
                return l;
              }
              const overrides = l.masterId ? [...(l.overrides || []), ...Object.keys(sanitizedPartial)] : l.overrides;
              return { ...l, ...sanitizedPartial, overrides, dirty: true };
            }
            if (masterComponentId && l.masterId === masterComponentId) {
              const overrides = l.overrides || [];
              const syncPartial = { ...sanitizedPartial };
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

  deleteLayer: (id) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers
          .filter((l: Layer) => l.id !== id)
          .map((l: Layer) => {
            const cleaned = { ...l };
            if (cleaned.maskLayerId === id) {
              cleaned.maskLayerId = undefined;
            }
            if (cleaned.groupId === id) {
              cleaned.groupId = undefined;
            }
            if (cleaned.masterId === id) {
              cleaned.masterId = undefined;
              cleaned.overrides = [];
            }
            return cleaned;
          }),
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

  autoNameLayer: async (id: string) => {
    const { artboards, updateLayer } = get();
    let layer: Layer | undefined;
    artboards.forEach((a: Artboard) => {
      const found = a.layers.find((l) => l.id === id);
      if (found) {
        layer = found;
      }
    });
    if (!layer) {
      return;
    }
    const description = `Type: ${layer.type}, Pos: ${layer.x},${layer.y}, Size: ${(layer as any).width}x${(layer as any).height}`;
    try {
      const newName = await geminiService.generateLayerName(description);
      updateLayer(id, { name: newName });
    } catch (error) {
      log.error('Auto-naming failed', error, { layerId: id, description });
    }
  },
});
