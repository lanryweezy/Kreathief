import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { NavTab } from '../types';

export interface DynamicTool {
  id: NavTab;
  label: string;
  isPinned?: boolean;
}

export const useContextualPanels = () => {
  const selectedLayerIds = useStore((state) => state.selectedLayerIds) || [];
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const isPenMode = useStore((state) => state.isPenMode);

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
