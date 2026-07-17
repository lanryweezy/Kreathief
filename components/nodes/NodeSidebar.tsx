import React, { useState, useMemo, useCallback } from 'react';
import { NodeCategory } from '../../types/nodes';
import { NODE_DEFINITIONS, getNodesByCategory } from '../../data/nodeDefinitions';
import * as Icons from '../icons';
import { fuzzyMatch } from '../../utils/search';

interface NodeSidebarProps {
  onAddNode: (type: string, x: number, y: number) => void;
}

const CATEGORIES: { id: NodeCategory; label: string; icon: string }[] = [
  { id: 'input', label: 'Input', icon: 'Upload' },
  { id: 'ai', label: 'AI Models', icon: 'Zap' },
  { id: 'edit', label: 'Edit', icon: 'Edit' },
  { id: 'mockup', label: 'Mockup', icon: 'Box' },
  { id: 'layout', label: 'Layout', icon: 'Layout' },
  { id: 'composite', label: 'Composite', icon: 'Layers' },
  { id: 'export', label: 'Export', icon: 'Download' },
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

export function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<NodeCategory | null>(null);

  const filteredNodes = useMemo(() => {
    const nodes = activeCategory ? getNodesByCategory(activeCategory) : NODE_DEFINITIONS;
    if (!search) return nodes;
    return nodes.filter(
      (n) => fuzzyMatch(search, n.label) || fuzzyMatch(search, n.description) || fuzzyMatch(search, n.type)
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
            activeCategory === null ? 'bg-brand-600 text-white' : 'bg-surface-dark-3 text-white/60 hover:text-white'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = (Icons as any)[cat.icon] || Icons.Box;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-dark-3 text-white/60 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredNodes.map((nodeDef) => {
          const NodeIcon = (Icons as any)[nodeDef.icon] || Icons.Box;
          return (
            <button
              key={nodeDef.id}
              onClick={() => handleAddNode(nodeDef.type)}
              className={`w-full text-left p-2 rounded-md bg-surface-dark-3 border border-white/5 hover:border-white/20 transition-colors border-l-2 ${CATEGORY_COLORS[nodeDef.category]}`}
            >
              <div className="flex items-center gap-2">
                <NodeIcon className="w-4 h-4 text-white/70" />
                <span className="text-xs font-medium text-white">{nodeDef.label}</span>
              </div>
              <p className="text-[10px] text-white/40 mt-0.5 ml-6 line-clamp-1">{nodeDef.description}</p>
            </button>
          );
        })}
        {filteredNodes.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-3">
              <Icons.Search className="w-8 h-8 text-zinc-800" />
            </div>
            <div className="text-white/30 text-xs font-bold uppercase tracking-widest">No nodes found</div>
            <p className="text-[10px] text-white/10 mt-1 uppercase">Try a different keyword</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NodeSidebar;
