import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';

export function useLamaWorker() {
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  useEffect(() => {
    // Instantiate worker
    workerRef.current = new Worker(new URL('../../workers/lamaWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current.postMessage({ type: 'INIT' });

    workerRef.current.onmessage = (e) => {
      const { type, data, status, error } = e.data;

      if (type === 'STATUS') {
        // useStore.getState().addToast?.(status, 'info');
      } else if (type === 'READY') {
        // useStore.getState().addToast?.('LaMa Inpainting model ready', 'success');
      } else if (type === 'ERROR') {
        useStore.getState().addToast?.(`LaMa Error: ${error}`, 'error');
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

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const inpaint = useCallback(
    (imageCanvas: HTMLCanvasElement, maskCanvas: HTMLCanvasElement): Promise<string | null> => {
      return new Promise((resolve) => {
        if (!workerRef.current) {
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

        workerRef.current.postMessage({
          type: 'INPAINT',
          data: { imageData, maskData },
        });
      });
    },
    []
  );

  return { inpaint };
}
