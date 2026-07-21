import { createSelector } from 'reselect';

// Current store: nodes is Map<string, DesignNode>, selectedIds is Set<string>
const getNodes = (state: any) => state.nodes || new Map();
const getSelectedIds = (state: any) => state.selectedIds || new Set();

export const selectedNodeSelector = createSelector(
  [getNodes, getSelectedIds],
  (nodes, selectedIds) => {
    if (!selectedIds || selectedIds.size === 0) return null;
    const firstId = Array.from(selectedIds)[0];
    return nodes.get(firstId) || null;
  }
);

export const selectedNodesSelector = createSelector(
  [getNodes, getSelectedIds],
  (nodes, selectedIds) => {
    if (!selectedIds || selectedIds.size === 0) return [];
    return Array.from(selectedIds).map((id: string) => nodes.get(id)).filter(Boolean);
  }
);
