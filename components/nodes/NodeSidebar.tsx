import { useState, useMemo, useCallback } from 'react';
import { NodeCategory } from '../../types/nodes';
import { NODE_DEFINITIONS, getNodesByCategory } from '../../data/nodeDefinitions';

interface NodeSidebarProps {
  onAddNode: (type: string, x: number, y: number) => void;
}

const CATEGORIES: { id: NodeCategory; label: string; icon: string }[] = [
  { id: 'input', label: 'Input', icon: '📥' },
  { id: 'ai', label: 'AI Models', icon: '⚡' },
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'mockup', label: 'Mockup', icon: '📦' },
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'composite', label: 'Composite', icon: '🔀' },
  { id: 'export', label: 'Export', icon: '💾' },
];

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  input: 'border-l-blue-500',
  ai: 'border-l-purple-500',
  edit: 'border-l-green-500',
  layout: 'border-l-orange-500',
  mockup: 'border-l-pink-500',
  composite: 'border-l-cyan-500',
  export: 'border-l-red-500',
};

function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<NodeCategory | null>(null);

  const filteredNodes = useMemo(() => {
    const nodes = activeCategory ? getNodesByCategory(activeCategory) : NODE_DEFINITIONS;
    if (!search) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
    );
  }, [search, activeCategory]);

  const handleAddNode = useCallback(
    (type: string) => {
      onAddNode(type, 400, 300);
    },
    [onAddNode]
  );

  return (
    <div className="w-64 bg-surface-dark-2 border-r border-white/10 flex flex-col h-full">
      <div className="p-3 border-b border-white/10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes..."
          className="w-full bg-surface-dark-3 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-600"
        />
      </div>

      <div className="flex gap-1 px-3 py-2 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${
            activeCategory === null
              ? 'bg-brand-600 text-white'
              : 'bg-surface-dark-3 text-white/60 hover:text-white'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-brand-600 text-white'
                : 'bg-surface-dark-3 text-white/60 hover:text-white'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredNodes.map((nodeDef) => (
          <button
            key={nodeDef.id}
            onClick={() => handleAddNode(nodeDef.type)}
            className={`w-full text-left p-2 rounded-md bg-surface-dark-3 border border-white/5 hover:border-white/20 transition-colors border-l-2 ${CATEGORY_COLORS[nodeDef.category]}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{nodeDef.icon}</span>
              <span className="text-xs font-medium text-white">{nodeDef.label}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5 ml-6 line-clamp-1">
              {nodeDef.description}
            </p>
          </button>
        ))}
        {filteredNodes.length === 0 && (
          <div className="text-center text-white/30 text-xs py-8">No nodes found</div>
        )}
      </div>
    </div>
  );
}

export default NodeSidebar;
