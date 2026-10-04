import React, { useState, useCallback, Suspense } from 'react';
import { useStore } from '../store/useStore';
import { placeDesignNonDestructively } from '../utils/canvasPlacement';

const NodeGraph = React.lazy(() => import('../components/nodes/NodeGraph').then((m) => ({ default: m.NodeGraph })));
const AIGenerateModal = React.lazy(() =>
  import('../components/modals/AIGenerateModal').then((m) => ({ default: (m as any).AIGenerateModal }))
);

interface AIGenerateResult {
  image?: string;
  text?: string;
  layers?: any[];
}

export const EditorAIPanel = ({
  onAddLayer,
}: {
  onAddLayer?: (layer: any) => void;
}) => {
  const [showNodeGraph, setShowNodeGraph] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);

  const handleAIGenerate = useCallback(
    (result: AIGenerateResult) => {
      if (Array.isArray(result.layers) && result.layers.length > 0) {
        const state = useStore.getState() as any;
        state.saveToHistory?.();
        const placement = placeDesignNonDestructively(
          state.artboards,
          state.activeArtboardId,
          { name: 'AI Design', layers: result.layers, width: canvasSize.width, height: canvasSize.height },
          canvasSize
        );
        useStore.setState({ artboards: placement.artboards, activeArtboardId: placement.activeArtboardId } as any);
        state.addToast?.(
          placement.placedOnNewArtboard
            ? 'Added as a new artboard beside your existing work — nothing was replaced.'
            : 'AI design added to canvas!',
          'success'
        );
        setShowAIGenerate(false);
        return;
      }
      if (result.image) {
        addLayer({
          id: `ai-${Date.now()}`,
          type: 'image',
          name: 'AI Generated',
          src: result.image,
          x: canvasSize.width / 2 - 250,
          y: canvasSize.height / 2 - 250,
          width: 500,
          height: 500,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          flipX: false,
          flipY: false,
          blendMode: 'normal',
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
            blur: 0,
            sepia: 0,
            hueRotate: 0,
            vignette: 0,
            opacity: 1,
          },
          skewX: 0,
          skewY: 0,
        });
      }
      if (result.text) {
        addLayer(({
          id: `ai-text-${Date.now()}`,
          type: 'text',
          name: 'AI Text',
          text: result.text,
          x: canvasSize.width / 2 - 200,
          y: canvasSize.height / 2 - 50,
          width: 400,
          height: 100,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          color: '#FFFFFF',
          fontSize: 48,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.5,
          blendMode: 'normal',
        } as any));
      }
      setShowAIGenerate(false);
    },
    [addLayer, canvasSize]
  );

  return {
    showNodeGraph,
    setShowNodeGraph,
    showAIGenerate,
    setShowAIGenerate,
    handleAIGenerate,
    NodeGraphComponent: showNodeGraph ? (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-[200] bg-surface-dark-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
          </div>
        }
      >
        <NodeGraph onClose={() => setShowNodeGraph(false)} onExportToCanvas={handleAIGenerate} />
      </Suspense>
    ) : null,
    AIGenerateComponent: showAIGenerate ? (
      <Suspense fallback={null}>
        <AIGenerateModal
          {...({ isOpen: showAIGenerate } as any)}
          onClose={() => setShowAIGenerate(false)}
          onGenerate={handleAIGenerate}
        />
      </Suspense>
    ) : null,
  };
};
