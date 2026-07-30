import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { ImageLayer } from '../types';
import { generateLayerId } from '../utils/layers/layerUtils';
import { useLamaWorker } from './canvas/useLamaWorker';
import { aiRemoveObject } from '../services/inpaintService';
import { heavyService } from '../services/heavyService';

export function useMagicActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateLayer, addLayer, addToast } = useStore.getState();
  const { inpaint } = useLamaWorker();

  const performLocalInpaint = async (
    imageSrc: string,
    maskPath: string,
    width: number,
    height: number
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = width;
        imgCanvas.height = height;
        const imgCtx = imgCanvas.getContext('2d')!;
        imgCtx.drawImage(img, 0, 0, width, height);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d')!;
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, width, height);
        const p = new Path2D(maskPath);
        maskCtx.fillStyle = 'white';
        maskCtx.fill(p);

        // Call LaMa worker
        const resultUrl512 = await inpaint(imgCanvas, maskCanvas);
        if (!resultUrl512) {
          resolve(null);
          return;
        }

        // Upscale back to original resolution
        const resultImg = new Image();
        resultImg.onload = () => {
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = width;
          finalCanvas.height = height;
          const finalCtx = finalCanvas.getContext('2d')!;

          // Draw original image first
          finalCtx.drawImage(img, 0, 0, width, height);

          // Draw mask on top to see where we need to patch
          // Actually, it's better to just upscale the 512x512 result and paste it over
          // A smarter way would be to only paste the masked region using globalCompositeOperation
          finalCtx.drawImage(resultImg, 0, 0, width, height);

          resolve(finalCanvas.toDataURL('image/png'));
        };
        resultImg.onerror = () => resolve(null);
        resultImg.src = resultUrl512;
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  };

  const handleEraseObject = useCallback(
    async (layer: ImageLayer, maskPath: string) => {
      setIsProcessing(true);
      addToast?.('Removing object using AI inpainting...', 'info');

      try {
        let resultUrl: string | null = null;
        // Try remote AI API first, fall back to local LaMa WASM inpainting if unavailable
        resultUrl = await aiRemoveObject(layer.src, maskPath, layer.width, layer.height);
        if (!resultUrl) {
          resultUrl = await performLocalInpaint(layer.src, maskPath, layer.width, layer.height);
        }

        if (resultUrl) {
          // Create the non-destructive patch
          const patchSrc = await new Promise<string | null>((resolve) => {
            const patchedImg = new Image();
            patchedImg.crossOrigin = 'anonymous';
            patchedImg.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = layer.width;
              canvas.height = layer.height;
              const ctx = canvas.getContext('2d')!;

              // Draw the fully patched image
              ctx.drawImage(patchedImg, 0, 0, layer.width, layer.height);

              // Mask it so ONLY the patched hole remains
              ctx.globalCompositeOperation = 'destination-in';
              const p = new Path2D(maskPath);
              ctx.fillStyle = 'black';
              ctx.fill(p);

              resolve(canvas.toDataURL('image/png'));
            };
            patchedImg.onerror = () => resolve(null);
            patchedImg.src = resultUrl!;
          });

          if (patchSrc) {
            const newNode = {
              id: generateLayerId('patch'),
              patchSrc,
              maskPath,
              opacity: 1,
              enabled: true,
              capturedCrop: layer.crop ? { ...layer.crop } : undefined,
            };

            const currentNodes = layer.inpaintNodes || [];

            updateLayer(layer.id, {
              inpaintNodes: [...currentNodes, newNode],
              maskPath: undefined,
              maskType: undefined,
            });

            addToast?.('Object erased non-destructively!', 'success');
          } else {
            addToast?.('Failed to create inpaint node', 'error');
          }
        } else {
          addToast?.('Failed to remove object', 'error');
        }
      } catch (err) {
        addToast?.('Error during removal', 'error');
      } finally {
        setIsProcessing(false);
      }
    },
    [updateLayer, addToast, inpaint]
  );

  const handleMagicExtract = useCallback(
    async (layer: ImageLayer, maskPath: string) => {
      setIsProcessing(true);
      addToast?.('Extracting object and patching background...', 'info');
      try {
        // 1. Generate the alpha-matted extracted object
        addToast?.('Refining alpha mask...', 'info');

        let transparentImageBase64: string | null = null;
        try {
          transparentImageBase64 = await heavyService.removeBackground(layer.src);
        } catch (e) {
          console.error('Background removal failed', e);
        }

        const mattedSrc = transparentImageBase64
          ? await new Promise<string | null>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = layer.width;
                canvas.height = layer.height;
                const ctx = canvas.getContext('2d')!;

                // Draw the soft alpha matted image
                ctx.drawImage(img, 0, 0, layer.width, layer.height);

                // Apply the dilated SAM mask
                ctx.globalCompositeOperation = 'destination-in';
                const p = new Path2D(maskPath);
                ctx.fillStyle = 'black';
                ctx.fill(p);
                // Dilate to capture soft edges that fall just outside the tight vector path
                ctx.lineWidth = 20;
                ctx.lineJoin = 'round';
                ctx.strokeStyle = 'black';
                ctx.stroke(p);

                resolve(canvas.toDataURL('image/png'));
              };
              img.onerror = () => resolve(null);
              img.src = transparentImageBase64!;
            })
          : null;

        // If matting fails, fallback to keeping the maskPath on the original src
        const extractedLayer: ImageLayer = {
          ...layer,
          id: generateLayerId('image'),
          name: `${layer.name} (Extracted)`,
          src: mattedSrc || layer.src,
          maskPath: mattedSrc ? undefined : maskPath,
          maskType: mattedSrc ? undefined : 'lasso',
        };

        // Try remote AI API first, fall back to local LaMa WASM inpainting
        let resultUrl: string | null = await aiRemoveObject(layer.src, maskPath, layer.width, layer.height);
        if (!resultUrl) {
          resultUrl = await performLocalInpaint(layer.src, maskPath, layer.width, layer.height);
        }

        if (resultUrl) {
          // Create the non-destructive patch for the background
          const patchSrc = await new Promise<string | null>((resolve) => {
            const patchedImg = new Image();
            patchedImg.crossOrigin = 'anonymous';
            patchedImg.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = layer.width;
              canvas.height = layer.height;
              const ctx = canvas.getContext('2d')!;

              // Draw the fully patched image
              ctx.drawImage(patchedImg, 0, 0, layer.width, layer.height);

              // Mask it so ONLY the patched hole remains
              ctx.globalCompositeOperation = 'destination-in';
              const p = new Path2D(maskPath);
              ctx.fillStyle = 'black';
              ctx.fill(p);

              resolve(canvas.toDataURL('image/png'));
            };
            patchedImg.onerror = () => resolve(null);
            patchedImg.src = resultUrl!;
          });

          if (patchSrc) {
            const newNode = {
              id: generateLayerId('patch'),
              patchSrc,
              maskPath,
              opacity: 1,
              enabled: true,
              capturedCrop: layer.crop ? { ...layer.crop } : undefined,
            };

            const currentNodes = layer.inpaintNodes || [];

            // Update the original layer (background) with the non-destructive patch
            updateLayer(layer.id, {
              inpaintNodes: [...currentNodes, newNode],
              maskPath: undefined,
              maskType: undefined,
            });

            // Add the new extracted layer on top
            addLayer(extractedLayer);
            // Select the new layer
            useStore.getState().setSelectedLayerIds([extractedLayer.id]);

            addToast?.('Magic Extract successful!', 'success');
          } else {
            addToast?.('Failed to create background patch', 'error');
          }
        } else {
          addToast?.('Failed to extract object', 'error');
        }
      } catch (err) {
        addToast?.('Error during extraction', 'error');
      } finally {
        setIsProcessing(false);
      }
    },
    [updateLayer, addLayer, addToast, inpaint]
  );

  return {
    isProcessing,
    handleEraseObject,
    handleMagicExtract,
  };
}
