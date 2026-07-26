import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';

export function useSmartMaskWorker() {
  const workerRef = useRef<Worker | null>(null);
  const isSmartMaskMode = useStore((state) => state.isSmartMaskMode);
  const setHoveredMaskBoundary = useStore((state) => state.setHoveredMaskBoundary);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isProcessingRef = useRef(false);
  const selectedLayerId = useStore((state) => state.selectedLayerIds[0]);

  useEffect(() => {
    // Only instantiate worker if we enter the mode, to save resources
    if (isSmartMaskMode && !workerRef.current) {
      workerRef.current = new Worker(new URL('../../workers/samWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current.postMessage({ type: 'INIT' });

      workerRef.current.onmessage = (e) => {
        const { type, data, status } = e.data;

        if (type === 'STATUS') {
          // Temporarily disable toasts for status to prevent spam, or use a non-intrusive status bar
        } else if (type === 'MASK_RESULT') {
          setHoveredMaskBoundary?.(data);
          isProcessingRef.current = false;
        } else if (type === 'READY') {
          useStore.getState().addToast?.('Smart Mask Ready. Hover over the image to extract parts!', 'success');
        } else if (type === 'ERROR') {
          useStore.getState().addToast?.(`Smart Mask Error: ${e.data.error}`, 'error');
          isProcessingRef.current = false;
        }
      };
    }
  }, [isSmartMaskMode, setHoveredMaskBoundary]);

  // When smart mask mode is activated, process the currently selected image automatically
  useEffect(() => {
    if (isSmartMaskMode && selectedLayerId && workerRef.current) {
      const state = useStore.getState();
      const artboard = state.artboards.find((a) => a.id === state.activeArtboardId);
      const layer = artboard?.layers.find((l) => l.id === selectedLayerId);

      if (layer && layer.type === 'image') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = (layer as any).src;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            workerRef.current?.postMessage({
              type: 'PROCESS_IMAGE',
              data: { imageData, width: img.width, height: img.height },
            });
          }
        };
      }
    }
  }, [isSmartMaskMode, selectedLayerId]);

  const processImage = useCallback((imageData: ImageData, width: number, height: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'PROCESS_IMAGE',
        data: { imageData, width, height },
      });
    }
  }, []);

  const inferMask = useCallback((x: number, y: number) => {
    if (!workerRef.current || isProcessingRef.current) return;

    // Throttle checks
    const dist = Math.hypot(lastMousePos.current.x - x, lastMousePos.current.y - y);
    if (dist < 5) return; // Don't re-infer if mouse barely moved

    lastMousePos.current = { x, y };
    isProcessingRef.current = true;

    workerRef.current.postMessage({
      type: 'INFER_MASK',
      data: { x, y },
    });
  }, []);

  return { processImage, inferMask };
}
