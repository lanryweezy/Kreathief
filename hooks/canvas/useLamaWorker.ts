import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';

export function useLamaWorker() {
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  // Lazy worker initialization: only instantiate and download WASM when actively invoked
  const getOrCreateWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../../workers/lamaWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current.postMessage({ type: 'INIT' });

      workerRef.current.onmessage = (e) => {
        const { type, data, error } = e.data;

        if (type === 'ERROR') {
          console.warn('[useLamaWorker] Background inpainting engine notice:', error);
          if (resolveRef.current) {
            resolveRef.current(null);
            resolveRef.current = null;
          }
        } else if (type === 'INPAINT_RESULT') {
          // Output is ImageData of 512x512
          const resultImageData = data as ImageData;

          // Convert ImageData to Data URL
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.putImageData(resultImageData, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');

            if (resolveRef.current) {
              resolveRef.current(dataUrl);
              resolveRef.current = null;
            }
          } else {
            if (resolveRef.current) {
              resolveRef.current(null);
              resolveRef.current = null;
            }
          }
        }
      };
    }
    return workerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const inpaint = useCallback(
    (imageCanvas: HTMLCanvasElement, maskCanvas: HTMLCanvasElement): Promise<string | null> => {
      return new Promise((resolve) => {
        const worker = getOrCreateWorker();
        if (!worker) {
          resolve(null);
          return;
        }

        resolveRef.current = resolve;

        // Resize image and mask to 512x512
        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = 512;
        resizeCanvas.height = 512;
        const ctx = resizeCanvas.getContext('2d')!;

        // Image
        ctx.drawImage(imageCanvas, 0, 0, 512, 512);
        const imageData = ctx.getImageData(0, 0, 512, 512);

        // Mask
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(maskCanvas, 0, 0, 512, 512);
        const maskData = ctx.getImageData(0, 0, 512, 512);

        worker.postMessage({
          type: 'INPAINT',
          data: { imageData, maskData },
        });
      });
    },
    []
  );

  return { inpaint };
}
