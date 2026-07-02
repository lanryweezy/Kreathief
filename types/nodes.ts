export type NodeCategory = 'input' | 'ai' | 'edit' | 'layout' | 'mockup' | 'export' | 'composite';

export type PortDataType = 'string' | 'number' | 'image' | 'layer' | 'layers' | 'color' | 'text' | 'any';

export interface NodePort {
  id: string;
  label: string;
  dataType: PortDataType;
  multiple?: boolean;
}

export interface NodeDefinition {
  id: string;
  type: string;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string;
  inputs: NodePort[];
  outputs: NodePort[];
  defaults: Record<string, any>;
  execute: (inputs: Record<string, any>, settings: Record<string, any>) => Promise<Record<string, any>>;
}

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  settings: Record<string, any>;
  width?: number;
  height?: number;
}

export interface GraphWire {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface NodeGraph {
  id: string;
  name: string;
  description: string;
  nodes: GraphNode[];
  wires: GraphWire[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  category: 'kittl' | 'glorify' | 'weave' | 'kreathief';
  icon: string;
  graph: Omit<NodeGraph, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface NodeGraphState {
  graph: NodeGraph;
  selectedNodeId: string | null;
  selectedWireId: string | null;
  isExecuting: boolean;
  executionOrder: string[];
  nodeOutputs: Record<string, Record<string, any>>;
  dragState: {
    isDragging: boolean;
    nodeId: string | null;
    offset: { x: number; y: number };
  };
  wireState: {
    isDrawing: boolean;
    fromNode: string | null;
    fromPort: string | null;
    mousePos: { x: number; y: number };
  };
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}
