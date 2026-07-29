import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { v4 as uuidv4 } from 'uuid';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createLayoutSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, get) => ({
  nudgeLayer: (id, dx, dy) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === id ? { ...l, x: l.x + dx, y: l.y + dy } : l)),
      })),
    })),

  alignLayers: (type) => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length < 2) return;
    get().saveToHistory?.();

    const selectedSet = new Set(selectedLayerIds);

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const selected = a.layers.filter((l) => selectedSet.has(l.id));
        if (selected.length < 2) return a;

        let value = 0;
        if (type === 'left' || type === 'right' || type === 'top' || type === 'bottom') {
          let minX = Infinity;
          let maxX = -Infinity;
          let minY = Infinity;
          let maxY = -Infinity;
          for (const l of selected) {
            const w = (l as any).width || 0;
            const h = (l as any).height || 0;
            if (l.x < minX) minX = l.x;
            if (l.x + w > maxX) maxX = l.x + w;
            if (l.y < minY) minY = l.y;
            if (l.y + h > maxY) maxY = l.y + h;
          }
          if (type === 'left') value = minX;
          if (type === 'right') value = maxX;
          if (type === 'top') value = minY;
          if (type === 'bottom') value = maxY;
        } else if (type === 'center' || type === 'middle') {
          let sumX = 0;
          let sumY = 0;
          for (const l of selected) {
            sumX += l.x + ((l as any).width || 0) / 2;
            sumY += l.y + ((l as any).height || 0) / 2;
          }
          if (type === 'center') value = sumX / selected.length;
          if (type === 'middle') value = sumY / selected.length;
        }

        return {
          ...a,
          layers: a.layers.map((l) => {
            if (!selectedSet.has(l.id)) return l;
            if (type === 'left') return { ...l, x: value };
            if (type === 'right') return { ...l, x: value - (l as any).width };
            if (type === 'top') return { ...l, y: value };
            if (type === 'bottom') return { ...l, y: value - ((l as any).height || 0) };
            if (type === 'center') return { ...l, x: value - (l as any).width / 2 };
            if (type === 'middle') return { ...l, y: value - ((l as any).height || 0) / 2 };
            return l;
          }),
        };
      }),
    }));
  },

  distributeLayers: (type) => {
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length < 3) return;
    get().saveToHistory?.();

    const selectedSet = new Set(selectedLayerIds);

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const selected = [...a.layers.filter((l) => selectedSet.has(l.id))];
        if (selected.length < 3) return a;

        if (type === 'horizontal') {
          const sorted = selected.sort((a, b) => a.x - b.x);
          const totalWidth = sorted.reduce((acc, l) => acc + (l as any).width, 0);
          const span = sorted[sorted.length - 1]!.x + (sorted[sorted.length - 1] as any).width - sorted[0]!.x;
          const spacing = (span - totalWidth) / (sorted.length - 1);

          const newPositions = new Map<string, number>();
          let currentX = sorted[0]!.x;
          for (const s of sorted) {
            newPositions.set(s.id, currentX);
            currentX += (s as any).width + spacing;
          }

          return {
            ...a,
            layers: a.layers.map((l) => {
              const newX = newPositions.get(l.id);
              if (newX === undefined) return l;
              return { ...l, x: newX };
            }),
          };
        } else {
          const sorted = selected.sort((a, b) => a.y - b.y);
          const totalHeight = sorted.reduce((acc, l) => acc + ((l as any).height || 0), 0);
          const span = sorted[sorted.length - 1]!.y + ((sorted[sorted.length - 1] as any).height || 0) - sorted[0]!.y;
          const spacing = (span - totalHeight) / (sorted.length - 1);

          const newPositions = new Map<string, number>();
          let currentY = sorted[0]!.y;
          for (const s of sorted) {
            newPositions.set(s.id, currentY);
            currentY += ((s as any).height || 0) + spacing;
          }

          return {
            ...a,
            layers: a.layers.map((l) => {
              const newY = newPositions.get(l.id);
              if (newY === undefined) return l;
              return { ...l, y: newY };
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
    if (!artboard) return;

    const CANVAS_W = state.canvasSize?.width || artboard.width || 512;
    const CANVAS_H = state.canvasSize?.height || artboard.height || 512;
    const phi = 0.61803398875;

    if (Array.isArray(typeOrShapes)) {
      const templateBaseW = 512;
      const templateBaseH = 512;
      const scaleX = CANVAS_W / templateBaseW;
      const scaleY = CANVAS_H / templateBaseH;
      const newLayers = typeOrShapes.map((shape) => ({
        id: uuidv4(), type: 'rectangle', ...shape,
        x: (shape.x || 0) * scaleX, y: (shape.y || 0) * scaleY,
        width: (shape.width || 100) * scaleX, height: (shape.height || 100) * scaleY,
        rotation: shape.rotation || 0, opacity: shape.opacity ?? 1,
        visible: shape.visible ?? true, locked: shape.locked ?? false,
        color: shape.color || '#333333',
      })) as Layer[];
      set((state: any) => ({
        artboards: state.artboards.map((a: Artboard) => a.id === state.activeArtboardId ? { ...a, layers: [...a.layers, ...newLayers] } : a),
      }));
      return;
    }

    const type = typeOrShapes;
    const visibleLayers = artboard.layers.filter((l: Layer) => !l.locked && l.visible);
    if (visibleLayers.length === 0 && !type.startsWith('golden')) return;

    const newPositions = new Map<string, { x: number; y: number; width?: number; height?: number }>();
    const selectedSet = new Set(state.selectedLayerIds);
    const selectedLayers = artboard.layers.filter((l: Layer) => selectedSet.has(l.id) && !l.locked && l.visible);
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

    if (newPositions.size > 0) {
      set((state: any) => ({
        artboards: state.artboards.map((a: Artboard) => {
          if (a.id !== state.activeArtboardId) return a;
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
