import { Layer } from '../types';

export interface SceneNode {
  id: string;
  type: 'group' | 'frame' | 'shape' | 'text' | 'image';
  name: string;
  children: SceneNode[];
  properties: Record<string, any>;
}

let _counter = 0;
const uid = () => `sn_${Date.now().toString(36)}_${(++_counter).toString(36)}`;

export function createSceneNode(type: SceneNode['type'], name: string, properties: Record<string, any> = {}): SceneNode {
  return { id: uid(), type, name, children: [], properties };
}

export function addChild(parent: SceneNode, child: SceneNode): void { parent.children.push(child); }
export function removeChild(parent: SceneNode, childId: string): void { parent.children = parent.children.filter((c) => c.id !== childId); }

export function findNode(root: SceneNode, id: string): SceneNode | null {
  if (root.id === id) return root;
  for (const child of root.children) { const f = findNode(child, id); if (f) return f; }
  return null;
}

export function traverseTree(root: SceneNode, callback: (node: SceneNode) => void): void {
  callback(root);
  for (const child of root.children) traverseTree(child, callback);
}

function makeNode(id: string, name: string, type: SceneNode['type'], props: Record<string, any>, children: SceneNode[] = []): SceneNode {
  return { id, name, type, children, properties: props };
}

function layerToNode(layer: Layer): SceneNode {
  const p: Record<string, any> = { x: layer.x, y: layer.y, width: layer.width, height: layer.height, rotation: layer.rotation, opacity: layer.opacity };
  if (layer.type === 'text') return makeNode(layer.id, layer.name ?? layer.id, 'text', { ...p, text: layer.text, fontSize: layer.fontSize, fontFamily: layer.fontFamily, color: layer.color, fontWeight: layer.fontWeight, textAlign: layer.textAlign, lineHeight: layer.lineHeight });
  if (layer.type === 'image') return makeNode(layer.id, layer.name ?? layer.id, 'image', { ...p, src: layer.src });
  if (layer.type === 'group') return makeNode(layer.id, layer.name ?? layer.id, 'group', { ...p, childIds: layer.children });
  return makeNode(layer.id, layer.name ?? layer.id, 'shape', { ...p, shapeType: layer.type, color: (layer as any).color, cornerRadius: (layer as any).cornerRadius });
}

export function treeToLayers(root: SceneNode): Layer[] {
  const layers: Layer[] = [];
  const walk = (node: SceneNode) => {
    const { x, y, width, height, rotation, opacity } = node.properties;
    const b: any = { id: node.id, name: node.name, x: x ?? 0, y: y ?? 0, width: width ?? 100, height: height ?? 100, rotation: rotation ?? 0, opacity: opacity ?? 1, locked: false, visible: true };
    if (node.type === 'group') { node.children.forEach(walk); layers.push({ ...b, type: 'group', children: node.children.map((c) => c.id) }); }
    else if (node.type === 'text') layers.push({ ...b, type: 'text', text: node.properties.text ?? '', fontSize: node.properties.fontSize ?? 16, fontWeight: node.properties.fontWeight ?? 'normal', fontStyle: 'normal', textDecoration: 'none', color: node.properties.color ?? '#000', fontFamily: node.properties.fontFamily ?? 'sans-serif', textAlign: node.properties.textAlign ?? 'left', letterSpacing: 0, lineHeight: node.properties.lineHeight ?? 1.2, textTransform: 'none' });
    else if (node.type === 'image') layers.push({ ...b, type: 'image', src: node.properties.src ?? '', flipX: false, flipY: false });
    else layers.push({ ...b, type: node.properties.shapeType ?? 'rectangle', color: node.properties.color ?? '#ccc', cornerRadius: node.properties.cornerRadius ?? 0 });
  };
  walk(root);
  return layers;
}

export function layersToTree(layers: Layer[]): SceneNode {
  const nodeMap = new Map<string, SceneNode>();
  const childOfGroup = new Set<string>();
  for (const layer of layers) {
    nodeMap.set(layer.id, layerToNode(layer));
    if (layer.type === 'group') for (const cid of layer.children) childOfGroup.add(cid);
  }
  for (const layer of layers) {
    if (layer.type === 'group') {
      const node = nodeMap.get(layer.id)!;
      for (const cid of layer.children) { const child = nodeMap.get(cid); if (child) node.children.push(child); }
    }
  }
  const root = createSceneNode('frame', 'Root');
  for (const layer of layers) { if (!childOfGroup.has(layer.id)) root.children.push(nodeMap.get(layer.id)!); }
  return root;
}
