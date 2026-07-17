import { memo, useState, useCallback } from 'react';
import { NodePort as NodePortDefinition } from '../../types/nodes';
import { useNodeGraph } from '../../hooks/useNodeGraph';
import { getNodeDefinition } from '../../data/nodeDefinitions';

interface NodePortProps {
  port: NodePortDefinition;
  side: 'input' | 'output';
  nodeId: string;
  color: string;
  onMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
}

function NodePort({ port, side, nodeId, color, onMouseDown, onMouseUp }: NodePortProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wireState = useNodeGraph((s) => s.wireState);
  const graph = useNodeGraph((s) => s.graph);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseDown(e, nodeId, port.id, side);
    },
    [nodeId, port.id, side, onMouseDown]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseUp(e, nodeId, port.id, side);
    },
    [nodeId, port.id, side, onMouseUp]
  );

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

  const isInput = side === 'input';

  const getHighlightClass = () => {
    if (!wireState || !graph) return '';
    const isDrawing = wireState.isDrawing;
    const isTargetNode = nodeId !== wireState.fromNode;
    const showMatchIndicator = isDrawing && side === 'input' && isTargetNode;

    if (!showMatchIndicator) return '';
    const fromNode = graph.nodes?.find((n) => n.id === wireState.fromNode);
    const fromPortDef = fromNode
      ? getNodeDefinition(fromNode.type)?.outputs.find((p) => p.id === wireState.fromPort)
      : null;
    const activeDataType = fromPortDef?.dataType;
    const isCompatible = activeDataType === 'any' || port.dataType === 'any' || port.dataType === activeDataType;

    return isCompatible
      ? 'ring-4 ring-green-400/40 border-green-400 scale-110 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
      : 'opacity-25 scale-75 cursor-not-allowed pointer-events-none';
  };

  return (
    <div
      className={`relative flex items-center ${isInput ? 'justify-start' : 'justify-end'}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative group">
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 border-surface-dark-1 ${color} cursor-crosshair hover:scale-125 transition-all shadow-lg group-hover:ring-4 group-hover:ring-white/10 ${getHighlightClass()}`}
        />
        {showTooltip && (
          <div
            className={`absolute z-50 px-2 py-1 rounded bg-surface-dark-1 text-white text-[10px] whitespace-nowrap pointer-events-none ${
              isInput ? 'left-5 top-1/2 -translate-y-1/2' : 'right-5 top-1/2 -translate-y-1/2'
            }`}
          >
            {port.label}
            <span className="ml-1 text-white/40">{port.dataType}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(NodePort);
