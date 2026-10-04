import { v4 as uuidv4 } from 'uuid';
import { Layer } from '../types';
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

/**
 * Traverses the scene tree using depth-first search.
 * If callback returns false, traversal of that subtree stops.
 */
export function walkTree(
  nodes: SceneNode[],
  callback: (node: SceneNode, parent: SceneNode | null, depth: number) => boolean | void,
  parent: SceneNode | null = null,
  depth = 0
): void {
  for (const node of nodes) {
    const shouldContinue = callback(node, parent, depth);
    if (shouldContinue !== false && node.children.length > 0) {
      walkTree(node.children, callback, node, depth + 1);
    }
  }
}

/**
 * Finds a node by ID in the scene graph.
 */
export function findNode(graph: SceneGraph, id: string): SceneNode | undefined {
  return graph.nodeMap.get(id);
}

/**
 * Collects all layer IDs contained within a node's subtree (including self).
 */
export function collectSubtreeIds(node: SceneNode): string[] {
  const ids: string[] = [node.id];
  for (const child of node.children) {
    ids.push(...collectSubtreeIds(child));
  }
  return ids;
}

/**
 * Collects all Layer objects contained within a node's subtree (including self).
 */
export function collectSubtreeLayers(node: SceneNode): Layer[] {
  const layers: Layer[] = [node.layer];
  for (const child of node.children) {
    layers.push(...collectSubtreeLayers(child));
  }
  return layers;
}

/**
 * Calculates the bounding box that tightly wraps all leaf layers within a node.
 */
export function calculateGroupBounds(node: SceneNode): { x: number; y: number; width: number; height: number } {
  const leaves = getLeaves(node);
  if (leaves.length === 0) {
    return {
      x: node.layer.x || 0,
      y: node.layer.y || 0,
      width: node.layer.width || 0,
      height: node.layer.height || 0,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const leaf of leaves) {
    const lx = leaf.layer.x ?? 0;
    const ly = leaf.layer.y ?? 0;
    const lw = leaf.layer.width ?? 0;
    const lh = leaf.layer.height ?? 0;

    minX = Math.min(minX, lx);
    minY = Math.min(minY, ly);
    maxX = Math.max(maxX, lx + lw);
    maxY = Math.max(maxY, ly + lh);
  }

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Duplicates a node and all of its descendants recursively.
 * Generates fresh UUIDs and updates internal parent/groupId relationships so the new subtree
 * is completely self-contained.
 */
export function duplicateSubtree(
  graph: SceneGraph,
  nodeId: string,
  offset: { x: number; y: number } = { x: 20, y: 20 }
): { newLayers: Layer[]; clonedRootId: string; clonedIds: string[] } {
  const rootNode = graph.nodeMap.get(nodeId);
  if (!rootNode) {
    return { newLayers: [], clonedRootId: '', clonedIds: [] };
  }

  const idMap = new Map<string, string>();
  const clonedLayers: Layer[] = [];
  const clonedIds: string[] = [];

  // First pass: generate new IDs for all nodes in subtree
  function mapIds(node: SceneNode) {
    const newId = uuidv4();
    idMap.set(node.id, newId);
    clonedIds.push(newId);
    for (const child of node.children) {
      mapIds(child);
    }
  }
  mapIds(rootNode);

  // Second pass: clone layers with updated coordinates and parent links
  function cloneNodes(node: SceneNode, isRoot: boolean) {
    const newId = idMap.get(node.id)!;
    const cloned = structuredClone(node.layer);
    cloned.id = newId;

    // Apply offset
    cloned.x = (cloned.x ?? 0) + offset.x;
    cloned.y = (cloned.y ?? 0) + offset.y;

    if (isRoot) {
      cloned.name = (cloned.name || 'Layer') + ' Copy';
      // Retain root's existing parent group if any
      cloned.groupId = node.parent ? node.parent.id : undefined;
    } else {
      // Internal children point to the newly cloned parent
      if (node.parent && idMap.has(node.parent.id)) {
        cloned.groupId = idMap.get(node.parent.id);
      }
    }

    clonedLayers.push(cloned);

    for (const child of node.children) {
      cloneNodes(child, false);
    }
  }
  cloneNodes(rootNode, true);

  return {
    newLayers: clonedLayers,
    clonedRootId: idMap.get(rootNode.id)!,
    clonedIds,
  };
}

/**
 * Reorders a node within its siblings.
 */
export function reorderSiblingNode(
  graph: SceneGraph,
  nodeId: string,
  newSiblingIndex: number
): Layer[] {
  const node = graph.nodeMap.get(nodeId);
  if (!node) return flattenSceneGraph(graph);

  const siblings = node.parent ? node.parent.children : graph.roots;
  const currentIdx = siblings.indexOf(node);
  if (currentIdx === -1) return flattenSceneGraph(graph);

  siblings.splice(currentIdx, 1);
  const targetIdx = Math.max(0, Math.min(newSiblingIndex, siblings.length));
  siblings.splice(targetIdx, 0, node);

  // Update sibling indices
  siblings.forEach((s, i) => {
    s.index = i;
  });

  return flattenSceneGraph(graph);
}

/**
 * Checks if a node is effectively visible by walking up the ancestor hierarchy.
 */
export function isNodeEffectivelyVisible(node: SceneNode): boolean {
  let current: SceneNode | null = node;
  while (current) {
    if (current.layer.visible === false) {
      return false;
    }
    current = current.parent;
  }
  return true;
}

/**
 * Checks if a node is effectively locked by walking up the ancestor hierarchy.
 */
export function isNodeEffectivelyLocked(node: SceneNode): boolean {
  let current: SceneNode | null = node;
  while (current) {
    if (current.layer.locked === true) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Computes compound opacity through the ancestor chain.
 */
export function getCompoundOpacity(node: SceneNode): number {
  let opacity = 1;
  let current: SceneNode | null = node;
  while (current) {
    const layerOpacity = current.layer.opacity ?? 1;
    opacity *= layerOpacity;
    current = current.parent;
  }
  return opacity;
}

/**
 * Creates a new group from selected layers and returns the updated flat layers.
 */
export function groupLayersWithSceneGraph(
  layers: Layer[],
  selectedIds: string[],
  groupName?: string
): { newLayers: Layer[]; groupId: string } {
  const selectedSet = new Set(selectedIds);
  if (selectedSet.size === 0) return { newLayers: layers, groupId: '' };

  const graph = buildSceneGraph(layers);
  const selectedNodes = selectedIds
    .map((id) => graph.nodeMap.get(id))
    .filter((n): n is SceneNode => !!n);

  if (selectedNodes.length === 0) return { newLayers: layers, groupId: '' };

  const newGroupId = `group_${uuidv4()}`;

  let minLayerIndex = Infinity;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    if (selectedSet.has(l.id)) {
      minLayerIndex = Math.min(minLayerIndex, i);
      const lx = l.x ?? 0;
      const ly = l.y ?? 0;
      const lw = l.width ?? 0;
      const lh = l.height ?? 0;
      minX = Math.min(minX, lx);
      minY = Math.min(minY, ly);
      maxX = Math.max(maxX, lx + lw);
      maxY = Math.max(maxY, ly + lh);
    }
  }

  const groupLayer: Layer = {
    id: newGroupId,
    type: 'shape',
    name: groupName || `Group`,
    x: minX === Infinity ? 0 : minX,
    y: minY === Infinity ? 0 : minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    groupId: undefined,
    isGroup: true,
    isExpanded: true,
    color: 'transparent',
  } as any;

  insertNode(graph, groupLayer, null);
  for (const node of selectedNodes) {
    node.layer.groupId = newGroupId;
    moveNode(graph, node.id, newGroupId);
  }

  return {
    newLayers: flattenSceneGraph(graph),
    groupId: newGroupId,
  };
}

/**
 * Ungroups a group and elevates its children to the group's parent level.
 */
export function ungroupLayerWithSceneGraph(layers: Layer[], groupLayerId: string): Layer[] {
  const graph = buildSceneGraph(layers);
  const groupNode = graph.nodeMap.get(groupLayerId);
  if (!groupNode) return layers;

  const parentId = groupNode.parent ? groupNode.parent.id : null;
  const children = [...groupNode.children];

  for (const child of children) {
    child.layer.groupId = parentId || undefined;
    moveNode(graph, child.id, parentId);
  }

  deleteNode(graph, groupLayerId);

  return flattenSceneGraph(graph);
}
