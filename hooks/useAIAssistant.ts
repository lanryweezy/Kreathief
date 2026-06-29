import { useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { debounce } from '../utils/debounce';

/**
 * Hook to handle AI Assistant interactions and real-time analysis
 */
export const useAIAssistant = () => {
  // ⚡ Bolt Optimization: Use useShallow with specific selectors to prevent the hook from
  // unnecessarily re-rendering any calling components on unrelated global state updates.
  // Impact: Eliminates wasteful re-renders on components using this hook (like AIDesignAssistant) when unrelated state changes.
  const { isActive, autoSuggest, triggerRealtimeAnalysis, artboards, activeArtboardId } = useStore(
    useShallow((state) => ({
      isActive: state.isActive,
      autoSuggest: state.autoSuggest,
      triggerRealtimeAnalysis: state.triggerRealtimeAnalysis,
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
    }))
  );

  // Debounced analysis trigger to avoid excessive API calls
  const debouncedAnalysis = useCallback(
    debounce((changeType: string, layerId?: string) => {
      if (isActive && autoSuggest) {
        triggerRealtimeAnalysis(changeType, layerId);
      }
    }, 1500),
    [isActive, autoSuggest, triggerRealtimeAnalysis]
  );

  // Monitor layer changes for real-time suggestions
  const handleLayerChange = useCallback(
    (changeType: string, layerId?: string) => {
      debouncedAnalysis(changeType, layerId);
    },
    [debouncedAnalysis]
  );

  // Monitor artboard changes to trigger analysis
  useEffect(() => {
    const activeArtboard = artboards?.find((a: any) => a.id === activeArtboardId);
    if (activeArtboard && isActive && autoSuggest) {
      // Trigger analysis when artboard content changes
      handleLayerChange('artboard_change');
    }
  }, [artboards, activeArtboardId, handleLayerChange, isActive, autoSuggest]);

  return {
    handleLayerChange,
    isAnalysisEnabled: isActive && autoSuggest,
  };
};

/**
 * Hook for layer-specific AI assistance
 */
export const useLayerAIAssistance = (layerId: string) => {
  const { handleLayerChange } = useAIAssistant();

  const notifyLayerChange = useCallback(
    (changeType: string) => {
      handleLayerChange(changeType, layerId);
    },
    [handleLayerChange, layerId]
  );

  return {
    notifyChange: notifyLayerChange,
  };
};
