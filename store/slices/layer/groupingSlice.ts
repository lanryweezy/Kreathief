import { StateCreator } from 'zustand';
import { Layer, Artboard } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createGroupingSlice: StateCreator<any, [], [], Partial<LayerSlice>> = (set, get) => ({
  groupSelected: () => {
    const { selectedLayerIds, activeArtboardId } = get();
    if (selectedLayerIds.length < 2) {
      return;
    }
    get().saveToHistory?.();

    const newGroupId = `group_${Date.now()}`;
    const activeArtboard = get().artboards.find((a: Artboard) => a.id === activeArtboardId);
    const groupCount = activeArtboard?.layers.filter((l: Layer) => l.groupId === newGroupId).length ?? 0;
    const groupName = `Group ${groupCount + 1}`;

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        if (a.id !== activeArtboardId) {
          return a;
        }

        const indices = selectedLayerIds.map((id: string) => a.layers.findIndex((l: Layer) => l.id === id));
        const minIndex = Math.min(...indices);

        const groupMarker: Layer = {
          id: newGroupId,
          type: 'shape',
          name: groupName,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          groupId: undefined,
          isGroup: true,
          isExpanded: true,
          color: '#7d2ae8',
        } as any;

        const remainingLayers = a.layers.filter((l: Layer) => !selectedLayerIds.includes(l.id));
        const groupedLayers = a.layers
          .filter((l: Layer) => selectedLayerIds.includes(l.id))
          .map((l: Layer) => ({ ...l, groupId: newGroupId }));

        const newLayers = [
          ...remainingLayers.slice(0, minIndex),
          groupMarker,
          ...groupedLayers,
          ...remainingLayers.slice(minIndex),
        ];

        return { ...a, layers: newLayers };
      }),
      selectedLayerIds: [newGroupId],
    }));
  },

  ungroupSelected: () => {
    const { selectedLayerIds, activeArtboardId } = get();
    if (selectedLayerIds.length === 0) {
      return;
    }
    get().saveToHistory?.();

    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => {
        if (a.id !== activeArtboardId) {
          return a;
        }

        const layersToUngroup = a.layers.filter((l: Layer) => selectedLayerIds.includes(l.id) && l.groupId);
        if (layersToUngroup.length === 0) {
          return a;
        }

        const groupIdsToUngroup = [...new Set(layersToUngroup.map((l: Layer) => l.groupId!))];

        const newLayers = a.layers
          .filter((l: Layer) => !groupIdsToUngroup.includes(l.id))
          .map((l: Layer) => {
            if (groupIdsToUngroup.includes(l.groupId!)) {
              const { groupId: _groupId, ...rest } = l;
              return rest as Layer;
            }
            return l;
          });

        return { ...a, layers: newLayers };
      }),
      selectedLayerIds: [],
    }));
  },
});
