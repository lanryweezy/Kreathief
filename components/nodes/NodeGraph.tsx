import React, { useCallback, useRef, useState } from 'react';
import { useNodeGraph } from '../../hooks/useNodeGraph';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { Node } from './Node';
import { Wire } from './Wire';
import { NodeSidebar } from './NodeSidebar';
import { WorkflowPresets } from './WorkflowPresets';
import { Icons } from '../../constants';
import { v4 as uuidv4 } from 'uuid';

export const NodeGraph: React.FC<{ onClose: () => void; onExportToCanvas: (result: any) => void }> = ({ onClose, onExportToCanvas }) => {
  const {
    graph, selectedNodeId, nodeOutputs, viewport, wireState,
    addNode, removeNode, selectNode, updateNodeSettings,
    startWireDrag, endWireDrag, setViewport, loadPreset, clearGraph, executeGraph, isExecuting,
  } = useNodeGraph();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [showPresets, setShowPresets] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('node-graph-bg')) {
      selectNode(null);
      if (e.button === 1 || e.shiftKey) {
        isPanning.current = true;
        panStart.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
      }
    }
  }, [selectNode, viewport]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      setViewport({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y, zoom: viewport.zoom });
    }
  }, [setViewport, viewport]);

  const handleCanvasMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * delta));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setViewport({
      x: mx - (mx - viewport.x) * (newZoom / viewport.zoom),
      y: my - (my - viewport.y) * (newZoom / viewport.zoom),
      zoom: newZoom,
    });
  }, [viewport, setViewport]);

  const handleAddNode = useCallback((type: string, x: number, y: number) => {
    addNode({ id: uuidv4(), type, x: (x - viewport.x) / viewport.zoom, y: (y - viewport.y) / viewport.zoom, settings: getNodeDefinition(type)?.defaults || {} });
  }, [addNode, viewport]);

  const handleLoadPreset = useCallback((presetId: string) => {
    loadPreset(presetId);
    setShowPresets(false);
  }, [loadPreset]);

  const handlePortMouseUp = useCallback((nodeId: string, portId: string, side: 'input' | 'output') => {
    if (wireState.isDrawing && side === 'input') {
      endWireDrag(nodeId, portId);
    }
  }, [wireState.isDrawing, endWireDrag]);

  const handlePortMouseDown = useCallback((nodeId: string, portId: string, side: 'input' | 'output') => {
    if (side === 'output') {
      startWireDrag(nodeId, portId);
    }
  }, [startWireDrag]);

  const getNodePosition = (nodeId: string) => {
    const node = graph.nodes.find((n) => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const getPortPosition = (nodeId: string, portId: string, side: 'input' | 'output') => {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const def = getNodeDefinition(node.type);
    if (!def) return { x: node.x, y: node.y };
    const ports = side === 'input' ? def.inputs : def.outputs;
    const index = ports.findIndex((p) => p.id === portId);
    const portSpacing = 28;
    const headerHeight = 40;
    return {
      x: side === 'input' ? node.x : node.x + 200,
      y: node.y + headerHeight + (index + 0.5) * portSpacing,
    };
  };

  return (
    <div className="fixed inset-0 z-[200] bg-surface-dark-0 flex flex-col">
      <div className="h-14 bg-surface-dark-1 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Icons.Magic className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Node Workflow</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Build AI pipelines visually</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${showPresets ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            Presets
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${showSidebar ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            Nodes
          </button>
          <button
            onClick={executeGraph}
            disabled={isExecuting}
            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {isExecuting ? 'Running...' : 'Run Graph'}
          </button>
          <button onClick={clearGraph} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-400 rounded-lg hover:text-white transition-colors">
            Clear
          </button>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <NodeSidebar onAddNode={(type) => handleAddNode(type, window.innerWidth / 2, window.innerHeight / 2)} />
        )}

        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden node-graph-bg"
          style={{ cursor: isPanning.current ? 'grabbing' : 'default' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="node-graph-bg absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
              backgroundPosition: `${viewport.x}px ${viewport.y}px`,
            }}
          />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {graph.wires.map((wire) => {
              const from = getPortPosition(wire.fromNode, wire.fromPort, 'output');
              const to = getPortPosition(wire.toNode, wire.toPort, 'input');
              return (
                <g key={wire.id} transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
                  <Wire
                    fromX={from.x}
                    fromY={from.y}
                    toX={to.x}
                    toY={to.y}
                    isActive={isExecuting}
                    onClick={() => selectNode(null)}
                  />
                </g>
              );
            })}
            {wireState.isDrawing && wireState.fromNode && wireState.fromPort && (
              <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
                <line
                  x1={getPortPosition(wireState.fromNode, wireState.fromPort, 'output').x}
                  y1={getPortPosition(wireState.fromNode, wireState.fromPort, 'output').y}
                  x2={(wireState.mousePos.x - viewport.x) / viewport.zoom}
                  y2={(wireState.mousePos.y - viewport.y) / viewport.zoom}
                  stroke="#7D2AE8"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              </g>
            )}
          </svg>

          <div className="absolute inset-0" style={{ zIndex: 2, transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}>
            {graph.nodes.map((node) => (
              <Node
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                output={nodeOutputs[node.id]}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  selectNode(node.id);
                }}
                onPortMouseDown={handlePortMouseDown}
                onPortMouseUp={handlePortMouseUp}
                onDelete={() => removeNode(node.id)}
                onSettingsChange={(key, value) => updateNodeSettings(node.id, key, value)}
              />
            ))}
          </div>

          <div className="absolute bottom-4 left-4 text-[10px] text-zinc-600 font-mono">
            {graph.nodes.length} nodes · {graph.wires.length} connections · {Math.round(viewport.zoom * 100)}%
          </div>
        </div>

        {showPresets && (
          <div className="w-72 border-l border-white/10 bg-surface-dark-1 overflow-y-auto">
            <WorkflowPresets onSelect={handleLoadPreset} />
          </div>
        )}
      </div>
    </div>
  );
};
