import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { v4 as uuidv4 } from 'uuid';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createGroupingSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set, get) => ({
  groupSelected: () => {
    const { selectedLayerIds, activeArtboardId } = get();
    if (selectedLayerIds.length < 2) return;
    get().saveToHistory?.();

    const newGroupId = `group_${uuidv4()}`;
    const activeArtboard = get().artboards.find((a: Artboard) => a.id === activeArtboardId);
    const groupCount = activeArtboard?.layers.filter((l: Layer) => l.groupId === newGroupId).length ?? 0;
    const groupName = `Group ${groupCount + 1}`;

    const selectedIdsSet = new Set(selectedLayerIds);

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        if (a.id !== activeArtboardId) return a;

        let minIndex = Infinity;
        let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
        const groupedLayers: Layer[] = [];
        const remainingLayers: Layer[] = [];

        a.layers.forEach((l: Layer, idx: number) => {
          if (selectedIdsSet.has(l.id)) {
            if (idx < minIndex) minIndex = idx;
            groupedLayers.push({ ...l, groupId: newGroupId });

            const lw = (l as any).width || 0;
            const lh = (l as any).height || 0;
            if (l.x < minX) minX = l.x;
            if (l.y < minY) minY = l.y;
            if (l.x + lw > maxX) maxX = l.x + lw;
            if (l.y + lh > maxY) maxY = l.y + lh;
          } else {
            remainingLayers.push(l);
          }
        });

        if (minIndex === Infinity) return a;

        const groupMarker: Layer = {
          id: newGroupId, type: 'shape', name: groupName, x: minX, y: minY,
          width: maxX - minX, height: maxY - minY, rotation: 0, opacity: 1,
          locked: false, visible: true, groupId: undefined, isGroup: true,
          isExpanded: true, color: 'transparent',
        } as any;

        const newLayers = [
          ...remainingLayers.slice(0, minIndex),
          groupMarker,
          ...groupedLayers,
          ...remainingLayers.slice(minIndex)
        ];
        return { ...a, layers: newLayers };
      }),
      selectedLayerIds: [newGroupId],
    }));
  },

  ungroupSelected: () => {
    const { selectedLayerIds, activeArtboardId } = get();
    if (selectedLayerIds.length === 0) return;
    get().saveToHistory?.();
    const selectedIdsSet = new Set(selectedLayerIds);

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        if (a.id !== activeArtboardId) return a;

        const groupIdsToUngroup = new Set<string>();
        a.layers.forEach((l: Layer) => {
          if (selectedIdsSet.has(l.id) && l.groupId) {
            groupIdsToUngroup.add(l.groupId);
          }
        });

        if (groupIdsToUngroup.size === 0) return a;

        const newLayers: Layer[] = [];
        a.layers.forEach((l: Layer) => {
          if (groupIdsToUngroup.has(l.id)) {
            // Drop group markers entirely
            return;
          }

          if (l.groupId && groupIdsToUngroup.has(l.groupId)) {
             const { groupId: _groupId, ...rest } = l;
             newLayers.push(rest as Layer);
          } else {
             newLayers.push(l);
          }
        });

        return { ...a, layers: newLayers };
      }),
      selectedLayerIds: [],
    }));
  },
});
