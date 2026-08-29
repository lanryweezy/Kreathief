import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { NavTab } from '../types';

export interface DynamicTool {
  id: NavTab;
  label: string;
  isPinned?: boolean;
}

export const useContextualPanels = () => {
  // ⚡ Bolt Optimization: Consolidate 4 separate `useStore` subscriptions into a
  // single useShallow call. This reduces overhead and prevents independent renders.
  const {
    selectedLayerIds: rawSelectedLayerIds,
    artboards: rawArtboards,
    activeArtboardId,
    isPenMode,
  } = useStore(
    useShallow((state) => ({
      selectedLayerIds: state.selectedLayerIds,
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      isPenMode: state.isPenMode,
    }))
  );
  const selectedLayerIds = rawSelectedLayerIds || [];
  const artboards = rawArtboards || [];

  const selectedLayer = useMemo(() => {
    if (selectedLayerIds.length === 0) {
      return null;
    }
    const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
    if (!activeArtboard) {
      return null;
    }
    return activeArtboard.layers.find((l) => l.id === selectedLayerIds[selectedLayerIds.length - 1]);
  }, [selectedLayerIds, artboards, activeArtboardId]);

  const contextualTabs = useMemo((): NavTab[] => {
    // 1. Pen Mode / Vector Context
    if (isPenMode || selectedLayer?.type === 'path') {
      return [NavTab.DRAW, NavTab.VECTORIZER, NavTab.MEDIA];
    }

    // 2. Text Context
    if (selectedLayer?.type === 'text') {
      return [NavTab.TEXT, NavTab.TEXTURES, NavTab.MEDIA];
    }

    // 3. Image Context
    if (selectedLayer?.type === 'image') {
      return [NavTab.TEMPLATES, NavTab.MOCKUP, NavTab.VECTORIZER, NavTab.MEDIA];
    }

    // 4. Shape Context
    if (
      selectedLayer?.type === 'rectangle' ||
      selectedLayer?.type === 'circle' ||
      (selectedLayer as any)?.type === 'star'
    ) {
      return [NavTab.MEDIA, NavTab.TEXTURES, NavTab.MEDIA];
    }

    // 5. Default / Empty Context
    return [NavTab.ASSISTANT, NavTab.TEMPLATES, NavTab.LAYERS];
  }, [selectedLayer, isPenMode]);

  return contextualTabs;
};
