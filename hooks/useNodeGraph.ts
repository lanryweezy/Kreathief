import { create } from 'zustand';
import { GraphNode, GraphWire, NodeGraph, NodeGraphState } from '../types/nodes';
import { getNodeDefinition } from '../data/nodeDefinitions';
import { WORKFLOW_PRESETS } from '../data/workflowPresets';
import { log } from '../utils/log';

let nodeIdCounter = 0;
let wireIdCounter = 0;

const genNodeId = () => `node-${++nodeIdCounter}`;
const genWireId = () => `wire-${++wireIdCounter}`;

const buildAdjacencyList = (nodes: GraphNode[], wires: GraphWire[]): Map<string, string[]> => {
  const adj = new Map<string, string[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const wire of wires) {
    const list = adj.get(wire.fromNode);
    if (list) {
      list.push(wire.toNode);
    }
  }
  return adj;
};

const topologicalSort = (nodes: GraphNode[], wires: GraphWire[]): string[] => {
  const adj = buildAdjacencyList(nodes, wires);
  const inDegree = new Map<string, number>();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
  }
  for (const wire of wires) {
    inDegree.set(wire.toNode, (inDegree.get(wire.toNode) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adj.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  return sorted;
};

const collectInputs = (
  nodeId: string,
  wires: GraphWire[],
  nodeOutputs: Record<string, Record<string, any>>
): Record<string, any> => {
  const inputs: Record<string, any> = {};
  const incomingWires = wires.filter((w) => w.toNode === nodeId);
  for (const wire of incomingWires) {
    const output = nodeOutputs[wire.fromNode]?.[wire.fromPort];
    if (output !== undefined) {
      inputs[wire.toPort] = output;
    }
  }
  return inputs;
};

interface NodeGraphActions {
  addNode: (type: string, x?: number, y?: number) => string;
  removeNode: (nodeId: string) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  addWire: (fromNode: string, fromPort: string, toNode: string, toPort: string) => void;
  removeWire: (wireId: string) => void;
  selectNode: (nodeId: string | null) => void;
  selectWire: (wireId: string | null) => void;
  updateNodeSettings: (nodeId: string, settings: Record<string, any>) => void;
  executeGraph: () => Promise<void>;
  loadPreset: (presetId: string) => void;
  clearGraph: () => void;
  setViewport: (viewport: Partial<NodeGraphState['viewport']>) => void;
  startWireDrag: (fromNode: string, fromPort: string, x: number, y: number) => void;
  updateWireDrag: (x: number, y: number) => void;
  endWireDrag: (toNode: string | null, toPort: string | null) => void;
  toggleSnapToGrid: () => void;
}

type NodeGraphStore = NodeGraphState & NodeGraphActions;

const initialGraph: NodeGraph = {
  id: 'default',
  name: 'Untitled Graph',
  description: '',
  nodes: [],
  wires: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useNodeGraph = create<NodeGraphStore>((set, get) => ({
  graph: initialGraph,
  selectedNodeId: null,
  selectedWireId: null,
  isExecuting: false,
  executionOrder: [],
  nodeOutputs: {},
  dragState: {
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 },
  },
  wireState: {
    isDrawing: false,
    fromNode: null,
    fromPort: null,
    mousePos: { x: 0, y: 0 },
  },
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  executingNodeId: null,
  snapToGrid: true,
  nodeProgress: {},
  nodeProgressStep: {},

  addNode: (type, x = 100, y = 100) => {
    const id = genNodeId();
    const def = getNodeDefinition(type);
    const newNode: GraphNode = {
      id,
      type,
      x,
      y,
      settings: def ? { ...def.defaults } : {},
    };
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: [...state.graph.nodes, newNode],
        updatedAt: Date.now(),
      },
    }));
    return id;
  },

  removeNode: (nodeId) => {
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.filter((n) => n.id !== nodeId),
        wires: state.graph.wires.filter((w) => w.fromNode !== nodeId && w.toNode !== nodeId),
        updatedAt: Date.now(),
      },
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  moveNode: (nodeId, x, y) => {
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
        updatedAt: Date.now(),
      },
    }));
  },

  addWire: (fromNode, fromPort, toNode, toPort) => {
    const { graph } = get();
    const exists = graph.wires.some(
      (w) => w.fromNode === fromNode && w.fromPort === fromPort && w.toNode === toNode && w.toPort === toPort
    );
    if (exists || fromNode === toNode) return;

    const dominated = graph.wires.some((w) => w.toNode === toNode && w.toPort === toPort);

    const newWire: GraphWire = {
      id: genWireId(),
      fromNode,
      fromPort,
      toNode,
      toPort,
    };

    set((state) => ({
      graph: {
        ...state.graph,
        wires: dominated
          ? [...state.graph.wires.filter((w) => !(w.toNode === toNode && w.toPort === toPort)), newWire]
          : [...state.graph.wires, newWire],
        updatedAt: Date.now(),
      },
    }));
  },

  removeWire: (wireId) => {
    set((state) => ({
      graph: {
        ...state.graph,
        wires: state.graph.wires.filter((w) => w.id !== wireId),
        updatedAt: Date.now(),
      },
      selectedWireId: state.selectedWireId === wireId ? null : state.selectedWireId,
    }));
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedWireId: null });
  },

  selectWire: (wireId) => {
    set({ selectedWireId: wireId, selectedNodeId: null });
  },

  updateNodeSettings: (nodeId, settings) => {
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map((n) => (n.id === nodeId ? { ...n, settings: { ...n.settings, ...settings } } : n)),
        updatedAt: Date.now(),
      },
    }));
  },

  executeGraph: async () => {
    const { graph } = get();
    if (graph.nodes.length === 0) return;

    set({ isExecuting: true, executingNodeId: null, nodeProgress: {}, nodeProgressStep: {} });

    try {
      const order = topologicalSort(graph.nodes, graph.wires);
      const outputs: Record<string, Record<string, any>> = {};

      for (const nodeId of order) {
        const node = graph.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        const def = getNodeDefinition(node.type);
        if (!def) continue;

        const inputs = collectInputs(nodeId, graph.wires, outputs);

        set({ executingNodeId: nodeId });

        if (def.category === 'ai') {
          const maxSteps = 20;
          for (let step = 1; step <= maxSteps; step++) {
            set((state) => ({
              nodeProgress: { ...state.nodeProgress, [nodeId]: Math.round((step / maxSteps) * 100) },
              nodeProgressStep: { ...state.nodeProgressStep, [nodeId]: `Step ${step} / ${maxSteps}` },
            }));

            // Set progressive blurry low-res previews at milestones!
            if (step === 5) {
              set((state) => ({
                nodeOutputs: {
                  ...state.nodeOutputs,
                  [nodeId]: {
                    image: {
                      src: `https://placehold.co/512x512/1a1a2e/7d2ae8?text=Generating+Step+5...`,
                      width: 512,
                      height: 512,
                      isBlur: true,
                    },
                  },
                },
              }));
            } else if (step === 12) {
              set((state) => ({
                nodeOutputs: {
                  ...state.nodeOutputs,
                  [nodeId]: {
                    image: {
                      src: `https://placehold.co/512x512/1a1a2e/00c4cc?text=Generating+Step+12...`,
                      width: 512,
                      height: 512,
                      isBlur: true,
                    },
                  },
                },
              }));
            }
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
        }

        try {
          const result = await def.execute(inputs, node.settings);
          outputs[nodeId] = result;
          // Clear progress metrics once fully loaded
          set((state) => ({
            nodeProgress: { ...state.nodeProgress, [nodeId]: 100 },
            nodeProgressStep: { ...state.nodeProgressStep, [nodeId]: 'Completed' },
          }));
        } catch (err) {
          log.error(`[NodeGraph] Node ${node.type} (${nodeId}) failed:`, err);
          outputs[nodeId] = { error: String(err) };
        }
      }

      set({ nodeOutputs: outputs, executionOrder: order });
    } finally {
      set({ isExecuting: false, executingNodeId: null });
    }
  },

  loadPreset: (presetId) => {
    const preset = WORKFLOW_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const maxNodeId = preset.graph.nodes.reduce((max, n) => {
      const num = parseInt(n.id.replace(/\D/g, ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    nodeIdCounter = Math.max(nodeIdCounter, maxNodeId);

    const maxWireId = preset.graph.wires.reduce((max, w) => {
      const num = parseInt(w.id.replace(/\D/g, ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    wireIdCounter = Math.max(wireIdCounter, maxWireId);

    set({
      graph: {
        id: `graph-${Date.now()}`,
        name: preset.graph.name,
        description: preset.graph.description,
        nodes: [...preset.graph.nodes],
        wires: [...preset.graph.wires],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      nodeOutputs: {},
      executionOrder: [],
      selectedNodeId: null,
      selectedWireId: null,
    });
  },

  clearGraph: () => {
    set({
      graph: {
        ...get().graph,
        nodes: [],
        wires: [],
        updatedAt: Date.now(),
      },
      nodeOutputs: {},
      executionOrder: [],
      selectedNodeId: null,
      selectedWireId: null,
    });
  },

  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },

  startWireDrag: (fromNode, fromPort, x = 0, y = 0) => {
    set({
      wireState: {
        isDrawing: true,
        fromNode,
        fromPort,
        mousePos: { x, y },
      },
    });
  },

  updateWireDrag: (x, y) => {
    set((state) => ({
      wireState: { ...state.wireState, mousePos: { x, y } },
    }));
  },

  endWireDrag: (toNode, toPort) => {
    const { wireState, addWire } = get();
    if (wireState.isDrawing && toNode && toPort) {
      addWire(wireState.fromNode!, wireState.fromPort!, toNode, toPort);
    }
    set({
      wireState: {
        isDrawing: false,
        fromNode: null,
        fromPort: null,
        mousePos: { x: 0, y: 0 },
      },
    });
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },
}));
