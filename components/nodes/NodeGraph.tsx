import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useNodeGraph } from '../../hooks/useNodeGraph';
import { useNodeDrag } from '../../hooks/useNodeDrag';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { Node } from './Node';
import { Wire } from './Wire';
import { NodeSidebar } from './NodeSidebar';
import { WorkflowPresets } from './WorkflowPresets';
import { Icons } from '../../constants';

export const NodeGraph: React.FC<{ onClose: () => void; onExportToCanvas: (result: any) => void }> = ({ onClose, onExportToCanvas }) => {
  const {
    graph, selectedNodeId, nodeOutputs, viewport, wireState,
    addNode, selectNode, updateNodeSettings,
    endWireDrag, loadPreset, clearGraph, executeGraph, isExecuting,
  } = useNodeGraph();

  const { handlers } = useNodeDrag();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [showPresets, setShowPresets] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    window.addEventListener('keydown', handlers.onKeyDown);
    window.addEventListener('keyup', handlers.onKeyUp);
    return () => {
      window.removeEventListener('keydown', handlers.onKeyDown);
      window.removeEventListener('keyup', handlers.onKeyUp);
    };
  }, [handlers.onKeyDown, handlers.onKeyUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handlers.onWheel(e);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handlers.onWheel]);

  const findFinalOutput = useCallback(() => {
    const exportNodes = graph.nodes.filter((n) => {
      const def = getNodeDefinition(n.type);
      return def && (def.category === 'export' || n.type === 'export-canvas');
    });
    if (exportNodes.length > 0) {
      const lastExport = exportNodes[exportNodes.length - 1];
      return nodeOutputs[lastExport.id];
    }
    const allOutputs = Object.values(nodeOutputs);
    if (allOutputs.length > 0) {
      return allOutputs[allOutputs.length - 1];
    }
    return null;
  }, [graph.nodes, nodeOutputs]);

  const handleRunGraph = useCallback(async () => {
    await executeGraph();
    const result = findFinalOutput();
    if (result && !result.error) {
      setLastResult(result);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [executeGraph, findFinalOutput]);

  const handleSendToCanvas = useCallback(() => {
    if (lastResult) {
      onExportToCanvas(lastResult);
      setLastResult(null);
    }
  }, [lastResult, onExportToCanvas]);

  const handleAddNode = useCallback((type: string, x: number, y: number) => {
    addNode(type, (x - viewport.x) / viewport.zoom, (y - viewport.y) / viewport.zoom);
  }, [addNode, viewport]);

  const handleLoadPreset = useCallback((presetId: string) => {
    loadPreset(presetId);
    setShowPresets(false);
  }, [loadPreset]);

  const handlePortMouseUp = useCallback((_e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => {
    if (wireState.isDrawing && side === 'input') {
      endWireDrag(nodeId, portId);
    }
  }, [wireState.isDrawing, endWireDrag]);

  const handlePortMouseDown = useCallback((_e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => {
    if (side === 'output') {
      handlers.startWireDraw(nodeId, portId, _e);
    }
  }, [handlers.startWireDraw]);


  const getPortPosition = (nodeId: string, portId: string, side: 'input' | 'output') => {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) {
      return { x: 0, y: 0 };
    }
    const def = getNodeDefinition(node.type);
    if (!def) {
      return { x: node.x, y: node.y };
    }
    const ports = side === 'input' ? def.inputs : def.outputs;
    const index = ports.findIndex((p) => p.id === portId);
    const portSpacing = 28;
    const headerHeight = 40;
    const nodeWidth = node.width || 220;
    return {
      x: side === 'input' ? node.x : node.x + nodeWidth,
      y: node.y + headerHeight + (index + 0.5) * portSpacing,
    };
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('node-graph-bg')) {
      handlers.onCanvasMouseDown(e);
    }
  }, [handlers.onCanvasMouseDown]);

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
            onClick={handleRunGraph}
            disabled={isExecuting || graph.nodes.length === 0}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              isExecuting
                ? 'bg-green-600/50 text-white/50 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-500 hover:scale-105 active:scale-95 shadow-lg shadow-green-600/20'
            } rounded-lg`}
          >
            {isExecuting ? (
              <Icons.Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Icons.Play className="w-3.5 h-3.5 fill-current" />
            )}
            {isExecuting ? 'Running...' : 'Run Graph'}
          </button>
          {lastResult && (
            <button
              onClick={handleSendToCanvas}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors animate-pulse"
            >
              Send to Canvas
            </button>
          )}
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
          onMouseDown={handleCanvasClick}
          onMouseMove={handlers.onCanvasMouseMove}
          onMouseUp={handlers.onCanvasMouseUp}
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
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
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
                onMouseDown={handlers.onNodeMouseDown}
                onPortMouseDown={handlePortMouseDown}
                onPortMouseUp={handlePortMouseUp}
                onSettingsChange={(key, value) => updateNodeSettings(node.id, { [key]: value })}
              />
            ))}
          </div>

          <div className="absolute bottom-4 left-4 text-[10px] text-zinc-600 font-mono">
            {graph.nodes.length} nodes · {graph.wires.length} connections · {Math.round(viewport.zoom * 100)}%
          </div>

          {showSuccess && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600/90 text-white text-[11px] font-bold rounded-lg shadow-lg z-50 backdrop-blur-sm">
              Graph executed successfully — Click "Send to Canvas" to add result
            </div>
          )}

          {lastResult && lastResult.image && (
            <div className="absolute bottom-4 right-4 z-50 animate-fade-in">
              <div className="bg-surface-dark-3/80 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Output Preview</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="relative group overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={lastResult.image.src || lastResult.image}
                    alt="Node output"
                    className="w-40 h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/128x128/1a1a2e/7d2ae8?text=Preview';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-[10px] text-white font-medium">Ready to export</p>
                  </div>
                </div>
                <button
                  onClick={handleSendToCanvas}
                  className="mt-4 w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
                >
                  Add to Canvas
                </button>
              </div>
            </div>
          )}
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
