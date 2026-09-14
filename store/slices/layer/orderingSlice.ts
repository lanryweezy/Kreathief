import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';
import { buildSceneGraph, flattenSceneGraph } from '../../../types/sceneGraph';
import { reorderSiblingNode } from '../../../utils/sceneGraph';

export const createOrderingSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, get) => ({
  reorderLayer: (id, newIndex) => {
    get().saveToHistory?.();
    set((state) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const graph = buildSceneGraph(a.layers);
        const node = graph.nodeMap.get(id);
        if (!node) return a;

        const siblings = node.parent ? node.parent.children : graph.roots;
        const currentIdx = siblings.indexOf(node);
        if (currentIdx !== -1) {
          const newLayers = reorderSiblingNode(graph, id, newIndex);
          return { ...a, layers: newLayers };
        }

        const idx = a.layers.findIndex((l) => l.id === id);
        if (idx === -1) return a;
        const newLayers = [...a.layers];
        const [removed] = newLayers.splice(idx, 1);
        newLayers.splice(newIndex, 0, removed!);
        return { ...a, layers: newLayers };
      }),
    }));
  },

  moveLayer: (id, direction) => {
    get().saveToHistory?.();
    set((state) => ({
      artboards: state.artboards.map((a: Artboard) => {
        const graph = buildSceneGraph(a.layers);
        const node = graph.nodeMap.get(id);
        if (!node) return a;

        const siblings = node.parent ? node.parent.children : graph.roots;
        const currentIdx = siblings.indexOf(node);
        if (currentIdx === -1) return a;

        let targetIdx = currentIdx;
        if (direction === 'front') targetIdx = siblings.length - 1;
        if (direction === 'back') targetIdx = 0;
        if (direction === 'forward') targetIdx = Math.min(siblings.length - 1, currentIdx + 1);
        if (direction === 'backward') targetIdx = Math.max(0, currentIdx - 1);

        const newLayers = reorderSiblingNode(graph, id, targetIdx);
        return { ...a, layers: newLayers };
      }),
    }));
  },
});
