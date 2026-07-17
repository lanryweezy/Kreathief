import { useMemo, useCallback } from 'react';
import { Layer, Artboard } from '../types';
import {
  SceneGraph,
  SceneNode,
  buildSceneGraph,
  flattenSceneGraph,
  moveNode,
  deleteNode,
  insertNode,
  getDescendants,
  getAncestors,
  getLeaves,
} from '../types/sceneGraph';

interface UseSceneGraphReturn {
  graph: SceneGraph;
  getNode: (id: string) => SceneNode | undefined;
  getChildren: (id: string) => SceneNode[];
  getDescendants: (id: string) => SceneNode[];
  getAncestors: (id: string) => SceneNode[];
  getLeaves: (id: string) => SceneNode[];
  getSiblings: (id: string) => SceneNode[];
  isDescendant: (ancestorId: string, descendantId: string) => boolean;
  getDepth: (id: string) => number;
  moveLayer: (layerId: string, newParentId: string | null, index?: number) => Layer[];
  removeLayer: (layerId: string) => Layer[];
  addLayerToGraph: (layer: Layer, parentId: string | null, index?: number) => void;
  toFlatLayers: () => Layer[];
  printTree: () => string;
}

/**
 * Hook that manages a SceneGraph alongside the flat layers[] array.
 * Provides tree operations while maintaining backwards compatibility.
 */
export function useSceneGraph(layers: Layer[]): UseSceneGraphReturn {
  const graph = useMemo(() => buildSceneGraph(layers), [layers]);

  const getNode = useCallback((id: string) => graph.nodeMap.get(id), [graph]);

  const getChildren = useCallback(
    (id: string) => {
      const node = graph.nodeMap.get(id);
      return node ? node.children : [];
    },
    [graph]
  );

  const getDescendantsOf = useCallback(
    (id: string) => {
      const node = graph.nodeMap.get(id);
      return node ? getDescendants(node) : [];
    },
    [graph]
  );

  const getAncestorsOf = useCallback(
    (id: string) => {
      const node = graph.nodeMap.get(id);
      return node ? getAncestors(node) : [];
    },
    [graph]
  );

  const getLeavesOf = useCallback(
    (id: string) => {
      const node = graph.nodeMap.get(id);
      return node ? getLeaves(node) : [];
    },
    [graph]
  );

  const getSiblings = useCallback(
    (id: string) => {
      const node = graph.nodeMap.get(id);
      if (!node) return [];
      const parent = node.parent;
      return parent ? parent.children : graph.roots;
    },
    [graph]
  );

  const isDescendant = useCallback(
    (ancestorId: string, descendantId: string) => {
      const descendant = graph.nodeMap.get(descendantId);
      if (!descendant) return false;
      let current = descendant.parent;
      while (current) {
        if (current.id === ancestorId) return true;
        current = current.parent;
      }
      return false;
    },
    [graph]
  );

  const getDepth = useCallback(
    (id: string) => {
      const node = graph.nodeMap.get(id);
      return node ? node.depth : 0;
    },
    [graph]
  );

  return {
    graph,
    getNode,
    getChildren,
    getDescendants: getDescendantsOf,
    getAncestors: getAncestorsOf,
    getLeaves: getLeavesOf,
    getSiblings,
    isDescendant,
    getDepth,
    // These modify the graph — return updated flat layers
    moveLayer: (layerId, newParentId, index) => {
      moveNode(graph, layerId, newParentId, index);
      return flattenSceneGraph(graph);
    },
    removeLayer: (layerId) => {
      deleteNode(graph, layerId);
      return flattenSceneGraph(graph);
    },
    addLayerToGraph: (layer, parentId, index) => {
      insertNode(graph, layer, parentId, index);
    },
    toFlatLayers: () => flattenSceneGraph(graph),
    printTree: () => {
      const lines: string[] = [];
      function walk(nodes: SceneNode[], depth: number) {
        for (const node of nodes) {
          const prefix = '  '.repeat(depth);
          lines.push(`${prefix}${node.type}: ${node.layer.name || node.layer.id.slice(0, 6)}`);
          if (node.children.length > 0) walk(node.children, depth + 1);
        }
      }
      walk(graph.roots, 0);
      return lines.join('\n');
    },
  };
}

/**
 * Non-hook version for use outside React components.
 */
export function createSceneGraph(layers: Layer[]): SceneGraph {
  return buildSceneGraph(layers);
}
