import { describe, it, expect } from 'vitest';
import { Layer } from '../../types';
import { buildSceneGraph, flattenSceneGraph } from '../../types/sceneGraph';
import {
  walkTree,
  findNode,
  collectSubtreeIds,
  collectSubtreeLayers,
  calculateGroupBounds,
  duplicateSubtree,
  reorderSiblingNode,
  isNodeEffectivelyVisible,
  isNodeEffectivelyLocked,
  getCompoundOpacity,
  groupLayersWithSceneGraph,
  ungroupLayerWithSceneGraph,
} from '../../utils/sceneGraph';

const createMockLayer = (id: string, overrides: Partial<Layer> = {}): Layer => ({
  id,
  type: 'shape',
  name: `Layer ${id}`,
  x: 10,
  y: 20,
  width: 100,
  height: 80,
  rotation: 0,
  opacity: 1,
  locked: false,
  visible: true,
  ...overrides,
} as Layer);

describe('Scene Graph Utilities', () => {
  it('builds a hierarchy correctly and walks the tree', () => {
    const parent = createMockLayer('group-1', { isGroup: true } as any);
    const child1 = createMockLayer('child-1', { groupId: 'group-1' });
    const child2 = createMockLayer('child-2', { groupId: 'group-1' });
    const orphan = createMockLayer('orphan');

    const graph = buildSceneGraph([parent, child1, child2, orphan]);
    expect(graph.roots.length).toBe(2); // group-1 and orphan
    expect(graph.nodeMap.get('group-1')?.children.length).toBe(2);

    const visited: string[] = [];
    walkTree(graph.roots, (node) => {
      visited.push(node.id);
    });

    expect(visited).toEqual(['group-1', 'child-1', 'child-2', 'orphan']);
  });

  it('calculates group bounds accurately from leaf nodes', () => {
    const parent = createMockLayer('group-1', { isGroup: true } as any);
    const child1 = createMockLayer('child-1', { groupId: 'group-1', x: 50, y: 50, width: 100, height: 100 });
    const child2 = createMockLayer('child-2', { groupId: 'group-1', x: 200, y: 150, width: 50, height: 50 });

    const graph = buildSceneGraph([parent, child1, child2]);
    const groupNode = findNode(graph, 'group-1')!;

    const bounds = calculateGroupBounds(groupNode);
    expect(bounds.x).toBe(50);
    expect(bounds.y).toBe(50);
    expect(bounds.width).toBe(200); // 250 - 50
    expect(bounds.height).toBe(150); // 200 - 50
  });

  it('duplicates subtree with re-mapped IDs and preserves parent relationships', () => {
    const parent = createMockLayer('group-1', { isGroup: true } as any);
    const child1 = createMockLayer('child-1', { groupId: 'group-1', x: 10, y: 10 });
    const child2 = createMockLayer('child-2', { groupId: 'group-1', x: 20, y: 20 });

    const graph = buildSceneGraph([parent, child1, child2]);
    const { newLayers, clonedRootId } = duplicateSubtree(graph, 'group-1', { x: 30, y: 30 });

    expect(newLayers.length).toBe(3);
    const clonedParent = newLayers.find((l) => l.id === clonedRootId)!;
    expect(clonedParent.name).toContain('Copy');

    const clonedChildren = newLayers.filter((l) => l.id !== clonedRootId);
    expect(clonedChildren.length).toBe(2);
    expect(clonedChildren[0].groupId).toBe(clonedRootId);
    expect(clonedChildren[1].groupId).toBe(clonedRootId);
    expect(clonedChildren[0].x).toBe(40);
  });

  it('reorders siblings without affecting tree hierarchy', () => {
    const parent = createMockLayer('group-1', { isGroup: true } as any);
    const child1 = createMockLayer('child-1', { groupId: 'group-1' });
    const child2 = createMockLayer('child-2', { groupId: 'group-1' });
    const child3 = createMockLayer('child-3', { groupId: 'group-1' });

    const graph = buildSceneGraph([parent, child1, child2, child3]);
    const reordered = reorderSiblingNode(graph, 'child-1', 2);

    expect(reordered.map((l) => l.id)).toEqual(['group-1', 'child-2', 'child-3', 'child-1']);
  });

  it('computes compound opacity and visibility through ancestor tree', () => {
    const grandParent = createMockLayer('gp', { opacity: 0.5, visible: true });
    const parent = createMockLayer('p', { groupId: 'gp', opacity: 0.5, visible: true });
    const child = createMockLayer('c', { groupId: 'p', opacity: 0.8, visible: true });

    const graph = buildSceneGraph([grandParent, parent, child]);
    const childNode = findNode(graph, 'c')!;

    expect(getCompoundOpacity(childNode)).toBeCloseTo(0.2); // 0.5 * 0.5 * 0.8
    expect(isNodeEffectivelyVisible(childNode)).toBe(true);

    grandParent.visible = false;
    expect(isNodeEffectivelyVisible(childNode)).toBe(false);
  });

  it('groups and ungroups layers cleanly using Scene Graph', () => {
    const layerA = createMockLayer('a', { x: 10, y: 10, width: 50, height: 50 });
    const layerB = createMockLayer('b', { x: 70, y: 70, width: 50, height: 50 });

    const { newLayers, groupId } = groupLayersWithSceneGraph([layerA, layerB], ['a', 'b'], 'My Group');

    expect(newLayers.length).toBe(3);
    const group = newLayers.find((l) => l.id === groupId)!;
    expect(group.name).toBe('My Group');
    expect(newLayers.find((l) => l.id === 'a')?.groupId).toBe(groupId);

    const ungrouped = ungroupLayerWithSceneGraph(newLayers, groupId);
    expect(ungrouped.length).toBe(2);
    expect(ungrouped.find((l) => l.id === 'a')?.groupId).toBeUndefined();
  });
});
