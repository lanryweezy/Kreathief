import React, { memo, useCallback } from 'react';
import { GraphNode } from '../../types/nodes';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { useNodeGraph } from '../../hooks/useNodeGraph';
import NodePort from './NodePort';
import * as Icons from '../icons';

interface NodeProps {
  node: GraphNode;
  isSelected: boolean;
  output?: Record<string, any>;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onDelete?: () => void;
  onSettingsChange?: (key: string, value: any) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  input: 'from-blue-600 to-blue-500',
  ai: 'from-purple-600 to-purple-500',
  edit: 'from-green-600 to-green-500',
  layout: 'from-orange-600 to-orange-500',
  mockup: 'from-pink-600 to-pink-500',
  composite: 'from-cyan-600 to-cyan-500',
  export: 'from-red-600 to-red-500',
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  input: 'border-blue-500/50',
  ai: 'border-purple-500/50',
  edit: 'border-green-500/50',
  layout: 'border-orange-500/50',
  mockup: 'border-pink-500/50',
  composite: 'border-cyan-500/50',
  export: 'border-red-500/50',
};

const CATEGORY_GLOWS: Record<string, string> = {
  input: 'shadow-blue-500/20',
  ai: 'shadow-purple-500/20',
  edit: 'shadow-green-500/20',
  layout: 'shadow-orange-500/20',
  mockup: 'shadow-pink-500/20',
  composite: 'shadow-cyan-500/20',
  export: 'shadow-red-500/20',
};

/**
 * Quality Gap: The node workflow UI felt detached from the main app's high-fidelity aesthetic,
 * using static emojis and flat designs. Improved with glassmorphism, category-specific
 * gradients, and professional SVG iconography to match 'Pro' creative tool standards.
 */
export function Node({ node, isSelected, output, onMouseDown, onPortMouseDown, onPortMouseUp, onDelete }: NodeProps) {
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

  if (!def) {
    return null;
  }

  const outputs = nodeOutputs[node.id];
  const hasOutput = outputs && Object.keys(outputs).length > 0;
  const imageOutput = outputs?.image as { src?: string } | undefined;

  const headerGradient = CATEGORY_COLORS[def.category] || 'from-gray-600 to-gray-500';
  const borderColor = CATEGORY_BORDER_COLORS[def.category] || 'border-white/10';
  const glowColor = CATEGORY_GLOWS[def.category] || 'shadow-white/5';

  return (
    <div
      className={`absolute select-none cursor-grab active:cursor-grabbing transition-shadow duration-200 ${
        isSelected ? `ring-2 ring-brand-500 shadow-2xl ${glowColor}` : 'shadow-xl'
      }`}
      style={{ left: node.x, top: node.y, width: node.width || 200 }}
      onMouseDown={handleMouseDown}
    >
      <div className={`bg-surface-dark-3/90 backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden flex flex-col`}>
        <div className={`bg-gradient-to-r ${headerGradient} px-3 py-2 flex items-center gap-2 border-b border-white/10`}>
          {(() => {
            const NodeIcon = (Icons as any)[def.icon] || Icons.Box;
            return <NodeIcon className="w-3.5 h-3.5 text-white/90" />;
          })()}
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
          <div className="space-y-2">
            {def.inputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                side="input"
                nodeId={node.id}
                color={headerGradient.split(' ')[0].replace('from-', 'bg-')}
                onMouseDown={onPortMouseDown}
                onMouseUp={onPortMouseUp}
              />
            ))}
          </div>

          <div className="space-y-2 absolute right-3 top-2">
            {def.outputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                side="output"
                nodeId={node.id}
                color={headerGradient.split(' ')[0].replace('from-', 'bg-')}
                onMouseDown={onPortMouseDown}
                onMouseUp={onPortMouseUp}
              />
            ))}
          </div>
        </div>

        {hasOutput && imageOutput?.src && (
          <div className="px-3 pb-3">
            <div className="w-full h-24 rounded-lg bg-surface-dark-2 border border-white/5 overflow-hidden">
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
