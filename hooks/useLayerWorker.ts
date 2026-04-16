/**
 * useLayerWorker Hook
 * Provides async access to heavy layer operations (masking, hit-testing) using a Web Worker.
 */

import { useState, useEffect, useCallback } from 'react';
import { Layer } from '../types';
import { maskWorkerService } from '../services/maskWorkerService';

export const useLayerMask = (layer: Layer | null) => {
  const [maskPath, setMaskPath] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const layerId = layer?.id;
    const layerType = layer?.type;
    const pathData = layer && 'pathData' in layer ? (layer as any).pathData : undefined;

    if (!layer || !layerId || !layerType || layerType === 'text' || layerType === 'image') {
      setMaskPath(undefined);
      return;
    }

    // Safety check for path-based layers
    if (layerType === 'path' && !pathData) {
      setMaskPath(undefined);
      return;
    }

    let isMounted = true;
    setIsProcessing(true);

    maskWorkerService
      .generateMask(layer)
      .then((path) => {
        if (isMounted) {
          setMaskPath(path);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        console.error('Worker Mask Error:', err);
        if (isMounted) {
          setIsProcessing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [layer?.id, layer?.type, (layer as any)?.pathData]);

  return { maskPath, isProcessing };
};

export const useLayerHitTest = () => {
  const hitTest = useCallback(async (x: number, y: number, layer: Layer): Promise<boolean> => {
    try {
      return await maskWorkerService.hitTest(x, y, layer);
    } catch (err) {
      console.error('Worker HitTest Error:', err);
      // Fallback to simple AABB if worker fails
      const width = (layer as any).width || 0;
      const height = (layer as any).height || 0;
      return x >= layer.x && x <= layer.x + width && y >= layer.y && y <= layer.y + height;
    }
  }, []);

  return hitTest;
};
