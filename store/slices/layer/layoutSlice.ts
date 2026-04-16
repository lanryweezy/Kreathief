import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createLayoutSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set, get) => ({
  nudgeLayer: (id, dx, dy) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === id ? { ...l, x: l.x + dx, y: l.y + dy } : l)),
      })),
    })),

  alignLayers: (type) => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length < 2) {
      return;
    }
    get().saveToHistory?.();

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const selected = a.layers.filter((l) => selectedLayerIds.includes(l.id));
        if (selected.length < 2) {
          return a;
        }

        let value = 0;
        if (type === 'left') {
          value = Math.min(...selected.map((l) => l.x));
        }
        if (type === 'right') {
          value = Math.max(...selected.map((l) => l.x + (l as any).width));
        }
        if (type === 'top') {
          value = Math.min(...selected.map((l) => l.y));
        }
        if (type === 'bottom') {
          value = Math.max(...selected.map((l) => l.y + ((l as any).height || 0)));
        }
        if (type === 'center') {
          value = selected.reduce((acc, l) => acc + l.x + (l as any).width / 2, 0) / selected.length;
        }
        if (type === 'middle') {
          value = selected.reduce((acc, l) => acc + l.y + ((l as any).height || 0) / 2, 0) / selected.length;
        }

        return {
          ...a,
          layers: a.layers.map((l) => {
            if (!selectedLayerIds.includes(l.id)) {
              return l;
            }
            if (type === 'left') {
              return { ...l, x: value };
            }
            if (type === 'right') {
              return { ...l, x: value - (l as any).width };
            }
            if (type === 'top') {
              return { ...l, y: value };
            }
            if (type === 'bottom') {
              return { ...l, y: value - ((l as any).height || 0) };
            }
            if (type === 'center') {
              return { ...l, x: value - (l as any).width / 2 };
            }
            if (type === 'middle') {
              return { ...l, y: value - ((l as any).height || 0) / 2 };
            }
            return l;
          }),
        };
      }),
    }));
  },

  distributeLayers: (type) => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length < 3) {
      return;
    }
    get().saveToHistory?.();

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const selected = [...a.layers.filter((l) => selectedLayerIds.includes(l.id))];
        if (selected.length < 3) {
          return a;
        }

        if (type === 'horizontal') {
          const sorted = selected.sort((a, b) => a.x - b.x);
          const totalWidth = sorted.reduce((acc, l) => acc + (l as any).width, 0);
          const span = sorted[sorted.length - 1]!.x + (sorted[sorted.length - 1] as any).width - sorted[0]!.x;
          const spacing = (span - totalWidth) / (sorted.length - 1);
          let currentX = sorted[0]!.x;
          return {
            ...a,
            layers: a.layers.map((l) => {
              const idx = sorted.findIndex((s) => s.id === l.id);
              if (idx === -1) {
                return l;
              }
              const res = { ...l, x: currentX };
              currentX += (l as any).width + spacing;
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
              if (idx === -1) {
                return l;
              }
              const res = { ...l, y: currentY };
              currentY += ((l as any).height || 0) + spacing;
              return res;
            }),
          };
        }
      }),
    }));
  },

  layoutLayers: (typeOrShapes) => {
    get().saveToHistory?.();
    const state = get();
    const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!artboard) {
      return;
    }

    const CANVAS_W = artboard.width;
    const CANVAS_H = artboard.height;
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
        ),
      }));
      return;
    }

    const type = typeOrShapes;
    const visibleLayers = artboard.layers.filter((l: Layer) => !l.locked && l.visible);
    if (visibleLayers.length === 0 && !type.startsWith('golden')) {
      return;
    }

    const newPositions = new Map<string, { x: number; y: number; width?: number; height?: number }>();
    const selectedLayers = artboard.layers.filter(
      (l: Layer) => state.selectedLayerIds.includes(l.id) && !l.locked && l.visible
    );
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
    }
    // ... other layout logic could be added here from the source if needed

    if (newPositions.size > 0) {
      set((state: any) => ({
        artboards: state.artboards.map((a: Artboard) => {
          if (a.id !== state.activeArtboardId) {
            return a;
          }
          return {
            ...a,
            layers: a.layers.map((l) => {
              const pos = newPositions.get(l.id);
              return pos ? { ...l, ...pos } : l;
            }),
          };
        }),
      }));
    }
  },
});
