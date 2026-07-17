import { describe, it, expect } from 'vitest';
import {
  buildSceneGraph,
  flattenSceneGraph,
  getDescendants,
  getAncestors,
  getLeaves,
  moveNode,
  deleteNode,
  insertNode,
  serializeSceneGraph,
  deserializeSceneGraph,
  printSceneTree,
} from '../types/sceneGraph';
import { Layer } from '../types';

function makeLayer(id: string, groupId?: string, name?: string): Layer {
  return {
    id,
    type: 'shape',
    name: name || `Layer ${id}`,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    color: '#ff0000',
    groupId,
    cornerRadius: 0,
  } as Layer;
}

function makeGroup(id: string, name?: string): Layer {
  return {
    ...makeLayer(id, undefined, name),
    isGroup: true,
  } as Layer;
}

describe('SceneGraph', () => {
  it('builds a flat graph from root layers', () => {
    const layers = [makeLayer('a'), makeLayer('b'), makeLayer('c')];
    const graph = buildSceneGraph(layers);

    expect(graph.roots.length).toBe(3);
    expect(graph.nodeMap.size).toBe(3);
    expect(graph.roots[0].layer.id).toBe('a');
    expect(graph.roots[1].layer.id).toBe('b');
    expect(graph.roots[2].layer.id).toBe('c');
  });

  it('builds a nested graph from groupId references', () => {
    const layers = [makeGroup('g1', 'Group'), makeLayer('a', 'g1'), makeLayer('b', 'g1'), makeLayer('c')];
    const graph = buildSceneGraph(layers);

    expect(graph.roots.length).toBe(2); // g1 and c
    const groupNode = graph.nodeMap.get('g1')!;
    expect(groupNode.children.length).toBe(2);
    expect(groupNode.children[0].layer.id).toBe('a');
    expect(groupNode.children[1].layer.id).toBe('b');
    expect(groupNode.depth).toBe(0);
    expect(groupNode.children[0].depth).toBe(1);
  });

  it('flattens back to correct z-order', () => {
    const layers = [makeGroup('g1'), makeLayer('a', 'g1'), makeLayer('b', 'g1'), makeLayer('c')];
    const graph = buildSceneGraph(layers);
    const flat = flattenSceneGraph(graph);

    expect(flat.length).toBe(4);
    expect(flat[0].id).toBe('g1');
    expect(flat[1].id).toBe('a');
    expect(flat[2].id).toBe('b');
    expect(flat[3].id).toBe('c');
  });

  it('getDescendants returns all nested layers', () => {
    const layers = [makeGroup('g1'), makeLayer('a', 'g1'), makeGroup('g2', 'g1'), makeLayer('b', 'g2'), makeLayer('c')];
    const graph = buildSceneGraph(layers);
    const descendants = getDescendants(graph.nodeMap.get('g1')!);

    expect(descendants.length).toBe(3); // a, g2, b
    expect(descendants.map((d) => d.id)).toEqual(['a', 'g2', 'b']);
  });

  it('getAncestors returns parent chain', () => {
    const layers = [makeGroup('g1'), makeGroup('g2', 'g1'), makeLayer('a', 'g2')];
    const graph = buildSceneGraph(layers);
    const ancestors = getAncestors(graph.nodeMap.get('a')!);

    expect(ancestors.length).toBe(2);
    expect(ancestors[0].id).toBe('g2');
    expect(ancestors[1].id).toBe('g1');
  });

  it('getLeaves returns only leaf nodes', () => {
    const layers = [makeGroup('g1'), makeLayer('a', 'g1'), makeGroup('g2', 'g1'), makeLayer('b', 'g2')];
    const graph = buildSceneGraph(layers);
    const leaves = getLeaves(graph.nodeMap.get('g1')!);

    expect(leaves.length).toBe(2);
    expect(leaves.map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('moveNode re-parents correctly', () => {
    const layers = [makeGroup('g1'), makeGroup('g2'), makeLayer('a', 'g1'), makeLayer('b')];
    const graph = buildSceneGraph(layers);

    moveNode(graph, 'b', 'g1');

    const g1 = graph.nodeMap.get('g1')!;
    expect(g1.children.length).toBe(2);
    expect(g1.children[1].layer.id).toBe('b');
    expect(graph.roots.length).toBe(2); // g1, g2
  });

  it('deleteNode removes node and descendants', () => {
    const layers = [makeGroup('g1'), makeLayer('a', 'g1'), makeLayer('b', 'g1'), makeLayer('c')];
    const graph = buildSceneGraph(layers);

    const deleted = deleteNode(graph, 'g1');

    expect(deleted.length).toBe(3); // g1, a, b
    expect(graph.nodeMap.has('g1')).toBe(false);
    expect(graph.nodeMap.has('a')).toBe(false);
    expect(graph.nodeMap.has('c')).toBe(true);
    expect(graph.roots.length).toBe(1);
  });

  it('insertNode adds to graph correctly', () => {
    const layers = [makeLayer('a'), makeLayer('b')];
    const graph = buildSceneGraph(layers);

    const group = makeGroup('g1');
    insertNode(graph, group, null, 1);

    expect(graph.roots.length).toBe(3);
    expect(graph.roots[1].layer.id).toBe('g1');
  });

  it('serializes and deserializes correctly', () => {
    const layers = [makeGroup('g1'), makeLayer('a', 'g1'), makeLayer('b')];
    const graph = buildSceneGraph(layers);

    const json = serializeSceneGraph(graph);
    const restored = deserializeSceneGraph(json);

    expect(restored.roots.length).toBe(2);
    expect(restored.nodeMap.size).toBe(3);
    const g1 = restored.nodeMap.get('g1')!;
    expect(g1.children.length).toBe(1);
  });

  it('printTree produces readable output', () => {
    const layers = [
      makeGroup('g1', 'My Group'),
      makeLayer('a', 'g1', 'Rectangle'),
      makeLayer('b', 'g1', 'Circle'),
      makeLayer('c', undefined, 'Background'),
    ];
    const graph = buildSceneGraph(layers);
    const output = printSceneTree(graph);

    expect(output).toContain('group: My Group');
    expect(output).toContain('shape: Rectangle');
    expect(output).toContain('shape: Circle');
    expect(output).toContain('shape: Background');
  });

  it('finds deep nested node via nodeMap', () => {
    const layers = [makeGroup('g1'), makeGroup('g2', 'inner'), makeLayer('a', 'g2')];
    const graph = buildSceneGraph(layers);
    const node = graph.nodeMap.get('a');
    expect(node).toBeDefined();
    expect(node!.parent!.id).toBe('g2');
    expect(node!.depth).toBe(2);
  });

  it('buildSceneGraph → flattenSceneGraph roundtrip preserves all layers', () => {
    const layers = [makeGroup('g1'), makeLayer('a', 'g1'), makeGroup('g2', 'g1'), makeLayer('b', 'g2'), makeLayer('c')];
    const graph = buildSceneGraph(layers);
    const flat = flattenSceneGraph(graph);
    expect(flat.map((l) => l.id)).toEqual(['g1', 'a', 'g2', 'b', 'c']);
  });

  it('getDescendants of a leaf returns empty', () => {
    const layers = [makeLayer('leaf')];
    const graph = buildSceneGraph(layers);
    const desc = getDescendants(graph.nodeMap.get('leaf')!);
    expect(desc.length).toBe(0);
  });

  it('getAncestors of a root returns empty', () => {
    const layers = [makeLayer('root')];
    const graph = buildSceneGraph(layers);
    const anc = getAncestors(graph.nodeMap.get('root')!);
    expect(anc.length).toBe(0);
  });

  it('deleteNode on non-existent node returns empty', () => {
    const graph = buildSceneGraph([makeLayer('a')]);
    const deleted = deleteNode(graph, 'zzz');
    expect(deleted.length).toBe(0);
  });

  it('moveNode back to root from group', () => {
    const layers = [makeGroup('g1'), makeLayer('a', 'g1')];
    const graph = buildSceneGraph(layers);
    moveNode(graph, 'a', null);
    expect(graph.roots.length).toBe(2);
    expect(graph.nodeMap.get('a')!.parent).toBeNull();
    expect(graph.nodeMap.get('a')!.depth).toBe(0);
  });

  it('insertNode into a group', () => {
    const layers = [makeGroup('g1')];
    const graph = buildSceneGraph(layers);
    const child = makeLayer('child');
    insertNode(graph, child, 'g1');
    const g1 = graph.nodeMap.get('g1')!;
    expect(g1.children.length).toBe(1);
    expect(graph.nodeMap.get('child')!.parent!.id).toBe('g1');
  });

  it('identifies text layer node type', () => {
    const textLayer = { ...makeLayer('t'), type: 'text' } as Layer;
    const graph = buildSceneGraph([textLayer]);
    expect(graph.nodeMap.get('t')!.type).toBe('text');
  });

  it('identifies image layer node type', () => {
    const imgLayer = { ...makeLayer('img'), type: 'image', src: '' } as Layer;
    const graph = buildSceneGraph([imgLayer]);
    expect(graph.nodeMap.get('img')!.type).toBe('image');
  });

  it('deeper nesting sets correct depths', () => {
    const layers = [makeGroup('g1'), makeGroup('g2', 'g1'), makeGroup('g3', 'g2'), makeLayer('leaf', 'g3')];
    const graph = buildSceneGraph(layers);
    expect(graph.nodeMap.get('g1')!.depth).toBe(0);
    expect(graph.nodeMap.get('g2')!.depth).toBe(1);
    expect(graph.nodeMap.get('g3')!.depth).toBe(2);
    expect(graph.nodeMap.get('leaf')!.depth).toBe(3);
  });

  it('serialize/deserialize preserves deep nesting', () => {
    const layers = [makeGroup('g1'), makeGroup('g2', 'g1'), makeLayer('a', 'g2')];
    const graph = buildSceneGraph(layers);
    const json = serializeSceneGraph(graph);
    const restored = deserializeSceneGraph(json);
    const aNode = restored.nodeMap.get('a')!;
    expect(aNode.depth).toBe(2);
    expect(aNode.parent!.id).toBe('g2');
  });
});
