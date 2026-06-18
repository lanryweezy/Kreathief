/**
 * useLayerWorker Hook
 * Provides async access to heavy layer operations (masking, hit-testing) using a Web Worker.
 */

import { log } from '../utils/log';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layer, ImageLayer } from '../types';
import { maskWorkerService } from '../services/maskWorkerService';
import { heavyWorkerService } from '../services/heavyWorkerService';

export const useProcessedImage = (layer: ImageLayer | null) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filterKey = useMemo(() => {
    if (!layer?.filters) {
      return '';
    }
    const f = layer.filters;
    // Fast hash of filter values to avoid JSON.stringify overhead
    return `${f.brightness}-${f.contrast}-${f.saturation}-${f.sepia}-${f.grayscale}-${f.blur}-${f.vignette || 0}`;
  }, [layer?.filters]);

  useEffect(() => {
    if (!layer || !layer.src || !layer.filters) {
      setProcessedUrl(null);
      return;
    }

    // Optimization: Skip if no filters are active (all at defaults)
    const f = layer.filters;
    const isDefault =
      f.brightness === 100 &&
      f.contrast === 100 &&
      f.saturation === 100 &&
      f.sepia === 0 &&
      f.grayscale === 0 &&
      f.blur === 0 &&
      (f.vignette || 0) === 0;

    if (isDefault) {
      setProcessedUrl(null);
      return;
    }

    let isMounted = true;
    const timeout = setTimeout(() => {
      setIsProcessing(true);
      heavyWorkerService
        .applyFilters(layer.src, layer.filters!)
        .then((url) => {
          if (isMounted) {
            setProcessedUrl(url);
            setIsProcessing(false);
          }
        })
        .catch((err) => {
          log.error('Filter Worker Error:', err);
          if (isMounted) {
            setIsProcessing(false);
          }
        });
    }, 150); // Debounce to prevent worker flooding during slider moves

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [layer?.src, filterKey]);

  return { processedUrl, isProcessing };
};

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
        log.error('Worker Mask Error:', err);
        if (isMounted) {
          setIsProcessing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [layer?.id, layer?.type, (layer as any)?.pathData, (layer as any)?.width, (layer as any)?.height]);

  return { maskPath, isProcessing };
};

export const useLayerHitTest = () => {
  const hitTest = useCallback(async (x: number, y: number, layer: Layer): Promise<boolean> => {
    try {
      return await maskWorkerService.hitTest(x, y, layer);
    } catch (err) {
      log.error('Worker HitTest Error:', err);
      // Fallback to simple AABB if worker fails
      const width = (layer as any).width || 0;
      const height = (layer as any).height || 0;
      return x >= layer.x && x <= layer.x + width && y >= layer.y && y <= layer.y + height;
    }
  }, []);

  return hitTest;
};
