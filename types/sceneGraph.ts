import { Layer, Artboard, TextLayer, ShapeLayer, ImageLayer, AdjustmentLayer, GroupLayer } from '../types';

// ─── Scene Graph Node Types ────────────────────────────────────────────────────

export type SceneNodeType = 'artboard' | 'group' | 'text' | 'shape' | 'image' | 'adjustment' | 'unknown';

export interface SceneNode {
  id: string;
  type: SceneNodeType;
  layer: Layer;
  children: SceneNode[];
  parent: SceneNode | null;
  depth: number;
  index: number; // Sibling index within parent
}

export interface SceneGraph {
  roots: SceneNode[]; // Top-level nodes (artboard children)
  nodeMap: Map<string, SceneNode>; // Quick lookup by ID
  flatLayers: Layer[]; // Backwards-compatible flat array
}

// ─── Build Scene Graph from Flat Layers ────────────────────────────────────────

/**
 * Convert a flat layers[] array into a tree-based SceneGraph.
 * O(n) — single pass with parent lookup.
 */
export function buildSceneGraph(layers: Layer[]): SceneGraph {
  const nodeMap = new Map<string, SceneNode>();
  const roots: SceneNode[] = [];

  // First pass: create all nodes
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    nodeMap.set(layer.id, {
      id: layer.id,
      type: getLayerNodeType(layer),
      layer,
      children: [],
      parent: null,
      depth: 0,
      index: i,
    });
  }

  // Second pass: wire parent-child relationships
  for (const layer of layers) {
    const node = nodeMap.get(layer.id)!;
    const parentId = layer.groupId;

    if (parentId && nodeMap.has(parentId)) {
      const parent = nodeMap.get(parentId)!;
      node.parent = parent;
      node.depth = parent.depth + 1;
      node.index = parent.children.length;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return { roots, nodeMap, flatLayers: layers };
}

// ─── Flatten Scene Graph Back to Layers ────────────────────────────────────────

/**
 * Convert a SceneGraph back to a flat layers[] array.
 * Traverses tree depth-first, maintaining z-order.
 */
export function flattenSceneGraph(graph: SceneGraph): Layer[] {
  const result: Layer[] = [];

  function walk(nodes: SceneNode[]) {
    for (const node of nodes) {
      result.push(node.layer);
      if (node.children.length > 0) {
        walk(node.children);
      }
    }
  }

  walk(graph.roots);
  return result;
}

// ─── Tree Operations ───────────────────────────────────────────────────────────

/**
 * Get all descendants of a node (recursive).
 */
export function getDescendants(node: SceneNode): SceneNode[] {
  const result: SceneNode[] = [];
  for (const child of node.children) {
    result.push(child);
    result.push(...getDescendants(child));
  }
  return result;
}

/**
 * Get the ancestor chain from a node up to root.
 */
export function getAncestors(node: SceneNode): SceneNode[] {
  const chain: SceneNode[] = [];
  let current = node.parent;
  while (current) {
    chain.push(current);
    current = current.parent;
  }
  return chain;
}

/**
 * Get all leaf nodes (no children) in a subtree.
 */
export function getLeaves(node: SceneNode): SceneNode[] {
  if (node.children.length === 0) return [node];
  const leaves: SceneNode[] = [];
  for (const child of node.children) {
    leaves.push(...getLeaves(child));
  }
  return leaves;
}

/**
 * Move a node to a new parent (or root if newParent is null).
 */
export function moveNode(graph: SceneGraph, nodeId: string, newParentId: string | null, index?: number): void {
  const node = graph.nodeMap.get(nodeId);
  if (!node) return;

  // Remove from old parent
  if (node.parent) {
    const siblings = node.parent.children;
    const idx = siblings.indexOf(node);
    if (idx !== -1) siblings.splice(idx, 1);
  } else {
    const idx = graph.roots.indexOf(node);
    if (idx !== -1) graph.roots.splice(idx, 1);
  }

  // Add to new parent
  if (newParentId) {
    const newParent = graph.nodeMap.get(newParentId);
    if (newParent) {
      node.parent = newParent;
      node.depth = newParent.depth + 1;
      const insertIdx = index !== undefined ? Math.min(index, newParent.children.length) : newParent.children.length;
      newParent.children.splice(insertIdx, 0, node);
    }
  } else {
    node.parent = null;
    node.depth = 0;
    const insertIdx = index !== undefined ? Math.min(index, graph.roots.length) : graph.roots.length;
    graph.roots.splice(insertIdx, 0, node);
  }

  // Update depths recursively
  updateDepths(node);
}

/**
 * Delete a node and all its descendants from the graph.
 */
export function deleteNode(graph: SceneGraph, nodeId: string): Layer[] {
  const node = graph.nodeMap.get(nodeId);
  if (!node) return [];

  const deleted = getDescendants(node);
  deleted.push(node);
  const deletedIds = new Set(deleted.map((n) => n.id));

  // Remove from parent
  if (node.parent) {
    node.parent.children = node.parent.children.filter((c) => c.id !== nodeId);
  } else {
    graph.roots = graph.roots.filter((r) => r.id !== nodeId);
  }

  // Clean up map
  for (const d of deleted) {
    graph.nodeMap.delete(d.id);
  }

  return deleted.map((n) => n.layer);
}

/**
 * Insert a layer into the graph.
 */
export function insertNode(graph: SceneGraph, layer: Layer, parentId: string | null, index?: number): SceneNode {
  const node: SceneNode = {
    id: layer.id,
    type: getLayerNodeType(layer),
    layer,
    children: [],
    parent: null,
    depth: 0,
    index: index || 0,
  };

  graph.nodeMap.set(layer.id, node);

  if (parentId) {
    const parent = graph.nodeMap.get(parentId);
    if (parent) {
      node.parent = parent;
      node.depth = parent.depth + 1;
      const insertIdx = index !== undefined ? Math.min(index, parent.children.length) : parent.children.length;
      parent.children.splice(insertIdx, 0, node);
    }
  } else {
    const insertIdx = index !== undefined ? Math.min(index, graph.roots.length) : graph.roots.length;
    graph.roots.splice(insertIdx, 0, node);
  }

  return node;
}

// ─── Serialization ─────────────────────────────────────────────────────────────

/**
 * Serialize SceneGraph to JSON (for persistence).
 */
export function serializeSceneGraph(graph: SceneGraph): string {
  const data = {
    roots: graph.roots.map(serializeNode),
    version: 1,
  };
  return JSON.stringify(data);
}

function serializeNode(node: SceneNode): any {
  return {
    id: node.id,
    type: node.type,
    layer: node.layer,
    children: node.children.map(serializeNode),
  };
}

/**
 * Deserialize SceneGraph from JSON.
 */
export function deserializeSceneGraph(json: string): SceneGraph {
  const data = JSON.parse(json);
  const layers: Layer[] = [];

  function collectLayers(node: any) {
    layers.push(node.layer);
    for (const child of node.children || []) {
      collectLayers(child);
    }
  }

  for (const root of data.roots || []) {
    collectLayers(root);
  }

  return buildSceneGraph(layers);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getLayerNodeType(layer: Layer): SceneNodeType {
  if ((layer as any).isGroup) return 'group';
  switch (layer.type) {
    case 'text':
      return 'text';
    case 'image':
      return 'image';
    case 'adjustment':
      return 'adjustment';
    default:
      return 'shape';
  }
}

function updateDepths(node: SceneNode): void {
  for (const child of node.children) {
    child.depth = node.depth + 1;
    updateDepths(child);
  }
}

/**
 * Print the scene tree for debugging.
 */
export function printSceneTree(graph: SceneGraph, indent = 0): string {
  const lines: string[] = [];
  function walk(nodes: SceneNode[], depth: number) {
    for (const node of nodes) {
      const prefix = '  '.repeat(depth);
      const name = node.layer.name || node.layer.id;
      const type = node.type;
      lines.push(`${prefix}${type}: ${name} (${node.layer.id.slice(0, 6)})`);
      if (node.children.length > 0) {
        walk(node.children, depth + 1);
      }
    }
  }
  walk(graph.roots, 0);
  return lines.join('\n');
}
