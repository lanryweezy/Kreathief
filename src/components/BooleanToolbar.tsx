import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKreathiefStore } from '../store/useStore';
import { content } from '../lib/tokens';

const UnionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="5" cy="7" r="4" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

const SubtractIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="5" cy="7" r="4" />
    <circle cx="9" cy="7" r="4" fill="currentColor" />
  </svg>
);

const IntersectIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="5" cy="7" r="4" />
    <circle cx="9" cy="7" r="4" />
    <circle cx="7" cy="7" r="2" fill="currentColor" />
  </svg>
);

const ExcludeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="5" cy="7" r="4" />
    <circle cx="9" cy="7" r="4" />
    <circle cx="7" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

const BOOLEAN_OPS = [
  { id: 'union' as const, icon: <UnionIcon />, label: 'Union', shortcut: 'Ctrl+Alt+U' },
  { id: 'subtract' as const, icon: <SubtractIcon />, label: 'Subtract', shortcut: 'Ctrl+Alt+S' },
  { id: 'intersect' as const, icon: <IntersectIcon />, label: 'Intersect', shortcut: 'Ctrl+Alt+I' },
  { id: 'exclude' as const, icon: <ExcludeIcon />, label: 'Exclude', shortcut: 'Ctrl+Alt+X' },
];

export const BooleanToolbar: React.FC = () => {
  const { selectedIds, nodes, updateNode, addToast } = useKreathiefStore(
    useShallow((state) => ({
      selectedIds: state.selectedIds,
      nodes: state.nodes,
      updateNode: state.updateNode,
      addToast: state.addToast,
    }))
  );

  if (selectedIds.size < 2) return null;

  const selectedNodes = Array.from(selectedIds)
    .map((id) => nodes.get(id))
    .filter(Boolean);
  const allShapes = selectedNodes.every((n) => n && ['rect', 'ellipse', 'path'].includes(n.type));

  if (!allShapes) return null;

  const applyBoolean = (op: 'union' | 'subtract' | 'intersect' | 'exclude') => {
    const [first, ...rest] = selectedNodes;
    if (!first) return;

    // Simplified boolean: combine into a group with booleanOp property
    // For a full implementation, this would use polygon clipping algorithms
    const combinedId = `bool_${Date.now()}`;
    const minX = Math.min(...selectedNodes.map((n) => n!.x));
    const minY = Math.min(...selectedNodes.map((n) => n!.y));
    const maxX = Math.max(...selectedNodes.map((n) => n!.x + n!.width));
    const maxY = Math.max(...selectedNodes.map((n) => n!.y + n!.height));

    const { addNode, removeNode } = useKreathiefStore.getState();

    // Create boolean result node
    addNode({
      id: combinedId,
      type: 'rect',
      name: `Boolean ${op}`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      blendMode: 'normal',
      fill: first!.fill || content.primary,
      stroke: first!.stroke,
      strokeWidth: first!.strokeWidth,
      cornerRadius: first!.cornerRadius,
      effects: [],
      children: Array.from(selectedIds),
      parentId: null,
      booleanOp: op,
      booleanChildren: Array.from(selectedIds),
    });

    // Remove original nodes
    selectedIds.forEach((id) => removeNode(id));

    addToast('success', `Applied ${op}`);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-neutral-900/95 backdrop-blur-sm rounded-xl border border-neutral-700 shadow-2xl px-2 py-1 flex items-center gap-1">
        <span className="text-[9px] text-neutral-500 px-1 font-bold uppercase">Boolean</span>
        <div className="w-px h-5 bg-neutral-700 mx-0.5" />
        {BOOLEAN_OPS.map((op) => (
          <button
            key={op.id}
            onClick={() => applyBoolean(op.id)}
            className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors btn-subtle focus:outline-none focus:ring-1 focus:ring-neutral-500"
            title={`${op.label} (${op.shortcut})`}
            aria-label={op.label}
          >
            {op.icon}
          </button>
        ))}
      </div>
    </div>
  );
};
