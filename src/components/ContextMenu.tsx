import React, { useEffect, useRef } from 'react';
import { Copy, Trash2, Lock, Unlock, Eye, EyeOff, ArrowUp, ArrowDown, Layers, Copy as CopyIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useKreathiefStore } from '../store/useStore';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Ignore right-clicks — let context menu handle them
      if (e.button === 2) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-2xl py-1 min-w-[180px] animate-fade-in"
      style={{ left: x, top: y }}
      role="menu"
      aria-label="Context menu"
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.divider && <div className="my-1 border-t border-neutral-700" />}
          <button
            onClick={() => {
              item.action();
              onClose();
            }}
            disabled={item.disabled}
            className={`w-full flex items-center gap-2 px-3 py-1 text-xs transition-colors focus:outline-none focus:bg-neutral-700 ${
              item.danger
                ? 'text-neutral-300 hover:bg-neutral-1000/10'
                : item.disabled
                  ? 'text-neutral-500 cursor-not-allowed'
                  : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
            role="menuitem"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export const CanvasContextMenu: React.FC<{ x: number; y: number; onClose: () => void }> = ({ x, y, onClose }) => {
  // ⚡ Bolt Optimization: Use useShallow to prevent unnecessary re-renders when unrelated store state changes.
  const { selectedIds, nodes, removeNode, updateNode, addToast } = useKreathiefStore(
    useShallow((state) => ({
      selectedIds: state.selectedIds,
      nodes: state.nodes,
      removeNode: state.removeNode,
      updateNode: state.updateNode,
      addToast: state.addToast,
    }))
  );
  const selectedCount = selectedIds.size;

  const items: MenuItem[] = [];

  if (selectedCount === 1) {
    // Single selection — show full menu
    const selectedNode = nodes.get(Array.from(selectedIds)[0]);
    if (selectedNode) {
      items.push(
        {
          label: 'Duplicate',
          icon: <Copy size={14} />,
          action: () => {
            const { addNode } = useKreathiefStore.getState();
            const copy = {
              ...selectedNode,
              id: `${selectedNode.id}_copy_${Date.now()}`,
              x: selectedNode.x + 20,
              y: selectedNode.y + 20,
              name: `${selectedNode.name} copy`,
            };
            addNode(copy);
            addToast('success', 'Duplicated');
          },
        },
        {
          label: 'Delete',
          icon: <Trash2 size={14} />,
          action: () => {
            removeNode(selectedNode.id);
            addToast('info', `Deleted "${selectedNode.name}"`);
          },
          danger: true,
        },
        { divider: true, label: '', icon: null, action: () => {} },
        {
          label: selectedNode.locked ? 'Unlock' : 'Lock',
          icon: selectedNode.locked ? <Unlock size={14} /> : <Lock size={14} />,
          action: () => {
            updateNode(selectedNode.id, { locked: !selectedNode.locked });
            addToast('info', selectedNode.locked ? 'Unlocked' : 'Locked');
          },
        },
        {
          label: selectedNode.visible ? 'Hide' : 'Show',
          icon: selectedNode.visible ? <EyeOff size={14} /> : <Eye size={14} />,
          action: () => {
            updateNode(selectedNode.id, { visible: !selectedNode.visible });
            addToast('info', selectedNode.visible ? 'Hidden' : 'Shown');
          },
        }
      );
    }
  } else if (selectedCount > 1) {
    // Multi-selection — show batch actions
    items.push(
      { label: `${selectedCount} elements selected`, icon: <Layers size={14} />, action: () => {}, disabled: true },
      { divider: true, label: '', icon: null, action: () => {} },
      {
        label: 'Delete All',
        icon: <Trash2 size={14} />,
        action: () => {
          const { removeNode: rm } = useKreathiefStore.getState();
          Array.from(selectedIds).forEach((id) => rm(id));
          addToast('info', `Deleted ${selectedCount} elements`);
        },
        danger: true,
      },
      {
        label: 'Lock All',
        icon: <Lock size={14} />,
        action: () => {
          const state = useKreathiefStore.getState();
          Array.from(selectedIds).forEach((id) => state.updateNode(id, { locked: true }));
          addToast('info', `Locked ${selectedCount} elements`);
        },
      },
      {
        label: 'Hide All',
        icon: <EyeOff size={14} />,
        action: () => {
          const state = useKreathiefStore.getState();
          Array.from(selectedIds).forEach((id) => state.updateNode(id, { visible: false }));
          addToast('info', `Hidden ${selectedCount} elements`);
        },
      }
    );
  } else {
    items.push({ label: 'No selection', icon: <Layers size={14} />, action: () => {}, disabled: true });
  }

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
};
