import { memo, useCallback } from 'react';
import { GraphNode } from '../../types/nodes';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { useNodeGraph } from '../../hooks/useNodeGraph';
import NodePort from './NodePort';

interface NodeProps {
  node: GraphNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  input: 'bg-blue-500',
  ai: 'bg-purple-500',
  edit: 'bg-green-500',
  layout: 'bg-orange-500',
  mockup: 'bg-pink-500',
  composite: 'bg-cyan-500',
  export: 'bg-red-500',
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  input: 'border-blue-400/30',
  ai: 'border-purple-400/30',
  edit: 'border-green-400/30',
  layout: 'border-orange-400/30',
  mockup: 'border-pink-400/30',
  composite: 'border-cyan-400/30',
  export: 'border-red-400/30',
};

function Node({ node, isSelected, onMouseDown, onPortMouseDown, onPortMouseUp }: NodeProps) {
  const removeNode = useNodeGraph((s) => s.removeNode);
  const nodeOutputs = useNodeGraph((s) => s.nodeOutputs);
  const def = getNodeDefinition(node.type);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseDown(e, node.id);
    },
    [onMouseDown, node.id]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeNode(node.id);
    },
    [removeNode, node.id]
  );

  if (!def) return null;

  const outputs = nodeOutputs[node.id];
  const hasOutput = outputs && Object.keys(outputs).length > 0;
  const imageOutput = outputs?.image as { src?: string } | undefined;

  const headerColor = CATEGORY_COLORS[def.category] || 'bg-gray-500';
  const borderColor = CATEGORY_BORDER_COLORS[def.category] || 'border-white/10';

  return (
    <div
      className={`absolute select-none cursor-grab active:cursor-grabbing ${
        isSelected ? 'ring-2 ring-brand-600' : ''
      }`}
      style={{ left: node.x, top: node.y, width: node.width || 200 }}
      onMouseDown={handleMouseDown}
    >
      <div className={`bg-surface-dark-3 rounded-lg border ${borderColor} shadow-lg overflow-hidden`}>
        <div className={`${headerColor} px-3 py-2 flex items-center gap-2`}>
          <span className="text-sm">{def.icon}</span>
          <span className="text-xs font-medium text-white truncate flex-1">{def.label}</span>
          {isSelected && (
            <button
              onClick={handleDelete}
              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white/70 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        <div className="relative px-3 py-2">
          <div className="space-y-1">
            {def.inputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                side="input"
                nodeId={node.id}
                color={headerColor}
                onMouseDown={onPortMouseDown}
                onMouseUp={onPortMouseUp}
              />
            ))}
          </div>

          <div className="space-y-1 absolute right-3 top-2">
            {def.outputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                side="output"
                nodeId={node.id}
                color={headerColor}
                onMouseDown={onPortMouseDown}
                onMouseUp={onPortMouseUp}
              />
            ))}
          </div>
        </div>

        {hasOutput && imageOutput?.src && (
          <div className="px-3 pb-2">
            <div className="w-full h-16 rounded bg-surface-dark-2 overflow-hidden">
              <img
                src={imageOutput.src}
                alt=""
                className="w-full h-full object-cover opacity-70"
              />
            </div>
          </div>
        )}

        {hasOutput && !imageOutput?.src && (
          <div className="px-3 pb-2">
            <div className="text-[10px] text-white/40 truncate">
              {Object.keys(outputs)
                .filter((k) => k !== 'image')
                .slice(0, 2)
                .join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Node);
