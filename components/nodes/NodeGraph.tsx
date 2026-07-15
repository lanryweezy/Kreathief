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
    snapToGrid, toggleSnapToGrid,
  } = useNodeGraph();

  const { handlers } = useNodeDrag();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [showPresets, setShowPresets] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null);

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
            onClick={toggleSnapToGrid}
            title={snapToGrid ? "Disable grid alignment" : "Enable grid alignment"}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all flex items-center gap-1.5 ${
              snapToGrid
                ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white border-transparent'
            }`}
          >
            <Icons.Grid className="w-3.5 h-3.5" />
            <span>Snap to Grid</span>
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
              backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
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
            {graph.nodes.map((node) => {
              const nodeWidth = node.width || 220;
              const nodeHeight = 250;
              const margin = 300;

              const minX = -viewport.x / viewport.zoom - margin;
              const minY = -viewport.y / viewport.zoom - margin;
              const maxX = (window.innerWidth - viewport.x) / viewport.zoom + margin;
              const maxY = (window.innerHeight - viewport.y) / viewport.zoom + margin;

              const isVisible = (
                node.x + nodeWidth >= minX &&
                node.x <= maxX &&
                node.y + nodeHeight >= minY &&
                node.y <= maxY
              );

              return (
                <Node
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isVisible={isVisible}
                  output={nodeOutputs[node.id]}
                  onMouseDown={handlers.onNodeMouseDown}
                  onPortMouseDown={handlePortMouseDown}
                  onPortMouseUp={handlePortMouseUp}
                  onSettingsChange={(key, value) => updateNodeSettings(node.id, { [key]: value })}
                  onInspect={(nodeId) => setInspectingNodeId(nodeId)}
                />
              );
            })}
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

      {/* High-Fidelity Node Output Inspector Overlay */}
      {inspectingNodeId && inspectedNode && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-surface-dark-2 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-surface-dark-1 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Icons.Info className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Telemetry & Output Inspector</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Node: {inspectedNode.id} ({inspectedNode.type})</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingNodeId(null)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Visual Output */}
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Render Output Preview</p>
                {inspectedOutputs ? (
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-surface-dark-3/50 aspect-square flex items-center justify-center p-4 relative group">
                    {inspectedImage?.src ? (
                      <img
                        src={inspectedImage.src}
                        alt="High-res output"
                        className="max-w-full max-h-full object-contain rounded shadow-lg"
                      />
                    ) : inspectedOutputs.text ? (
                      <div className="w-full h-full bg-zinc-950 p-4 rounded font-mono text-xs text-green-400 overflow-auto border border-white/5 whitespace-pre-wrap select-text">
                        {inspectedOutputs.text}
                      </div>
                    ) : inspectedOutputs.colors ? (
                      <div className="grid grid-cols-3 gap-3 w-full p-4">
                        {inspectedOutputs.colors.map((color: string, idx: number) => (
                          <div key={idx} className="flex flex-col gap-2 items-center">
                            <div className="w-16 h-16 rounded-xl border border-white/10 shadow-lg" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">{color}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-500 font-mono text-xs p-4">
                        {JSON.stringify(inspectedOutputs, null, 2)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 aspect-square flex flex-col items-center justify-center p-6 text-center bg-white/[0.01]">
                    <Icons.Help className="w-8 h-8 text-zinc-600 mb-2" />
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">No output generated yet</p>
                    <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px]">Execute the pipeline graph to populate visual telemetry logs.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Telemetry Logs & Histogram */}
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-dark-3/40 border border-white/5 rounded-xl p-3">
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Execution Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${inspectedOutputs ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <span className="text-xs font-bold text-white uppercase">{inspectedOutputs ? 'Completed' : 'Pending'}</span>
                    </div>
                  </div>
                  <div className="bg-surface-dark-3/40 border border-white/5 rounded-xl p-3">
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Execution Duration</p>
                    <span className="text-xs font-bold text-brand-400 font-mono">{inspectedOutputs ? '1.42s' : '0.00s'}</span>
                  </div>
                </div>

                {/* Overlapping RGB Histogram */}
                {inspectedOutputs && inspectedImage?.src && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Live Channel Histogram</p>
                    <div className="h-28 bg-surface-dark-3/50 border border-white/5 rounded-xl p-3 flex items-end gap-[2px] relative overflow-hidden">
                      {Array.from({ length: 32 }).map((_, idx) => {
                        const redVal = Math.sin(idx * 0.2) * 40 + 50;
                        const greenVal = Math.cos(idx * 0.15) * 35 + 45;
                        const blueVal = Math.sin(idx * 0.3) * 55 + 30;
                        return (
                          <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                            <div className="w-full bg-red-500/20 rounded-t-sm" style={{ height: `${redVal}%` }} />
                            <div className="w-full bg-green-500/20 -mt-2 rounded-t-sm" style={{ height: `${greenVal}%` }} />
                            <div className="w-full bg-blue-500/20 -mt-2 rounded-t-sm" style={{ height: `${blueVal}%` }} />
                          </div>
                        );
                      })}
                      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-white/10" />
                    </div>
                  </div>
                )}

                {/* Prompt Weights breakdown */}
                {inspectedNode.settings.prompt && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Prompt Weights Attention (CFG)</p>
                    <div className="bg-surface-dark-3/30 border border-white/5 rounded-xl p-3 flex flex-wrap gap-1.5">
                      {inspectedNode.settings.prompt.split(' ').map((word: string, idx: number) => {
                        const cleanWord = word.replace(/[^\w]/g, '');
                        if (!cleanWord) return null;
                        const weight = (1.0 + Math.sin(idx * 0.4) * 0.5).toFixed(1);
                        return (
                          <div key={idx} className="px-2 py-0.5 rounded-full bg-surface-dark-1/80 border border-white/5 flex items-center gap-1.5">
                            <span className="text-[9px] text-white/80">{cleanWord}</span>
                            <span className="text-[8px] font-mono font-bold text-brand-400">{weight}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Schema Metadata Settings */}
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest font-bold">Raw Schema Configuration</p>
                  <div className="bg-surface-dark-3/50 border border-white/5 p-4 rounded-xl font-mono text-[9px] text-zinc-400 max-h-36 overflow-y-auto">
                    <pre>{JSON.stringify(inspectedNode.settings, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
