import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageLayer } from '../types';
import { aiRemoveObjectWithCanvas } from '../services/inpaintService';
import { useLamaWorker } from '../hooks/canvas/useLamaWorker';

export const MagicEraserOverlay = () => {
  const artboards = useStore((state) => state.artboards);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const deleteLayer = useStore((state) => state.deleteLayer);
  const updateLayer = useStore((state) => state.updateLayer);
  const addToast = useStore((state) => (state as any).addToast);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Erasing...');
  const { inpaint: localInpaint } = useLamaWorker();

  const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
  if (!activeArtboard) return null;

  const eraserMasks = activeArtboard.layers.filter(
    (l) => (l as { brushType?: string }).brushType === 'magic_eraser'
  );

  if (eraserMasks.length === 0) return null;

  const handleErase = async () => {
    if (!useStore.getState().deductCredit?.(1)) {
      return;
    }
    setIsProcessing(true);
    setProcessingStatus('Analyzing mask...');

    try {
      // 1. Calculate combined bounding box of all eraser masks
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      eraserMasks.forEach((m) => {
        minX = Math.min(minX, m.x);
        minY = Math.min(minY, m.y);
        maxX = Math.max(maxX, m.x + (m.width || 0));
        maxY = Math.max(maxY, m.y + (m.height || 0));
      });

      // 2. Locate target ImageLayer (either selected or overlapping the mask)
      const selectedImage = activeArtboard.layers.find(
        (l) => l.type === 'image' && selectedLayerIds.includes(l.id)
      ) as ImageLayer | undefined;

      const overlappingImage = activeArtboard.layers
        .slice()
        .reverse()
        .find((l) => {
          if (l.type !== 'image') return false;
          const imgRight = l.x + l.width;
          const imgBottom = l.y + l.height;
          return !(l.x > maxX || imgRight < minX || l.y > maxY || imgBottom < minY);
        }) as ImageLayer | undefined;

      const targetImage = selectedImage || overlappingImage;

      if (!targetImage || !targetImage.src) {
        addToast?.(
          'Please draw over or select an image layer to erase objects from it.',
          'warning'
        );
        setIsProcessing(false);
        return;
      }

      setProcessingStatus('Generating inpaint mask...');

      // 3. Build binary mask canvas in target image coordinates
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = targetImage.width;
      maskCanvas.height = targetImage.height;
      const maskCtx = maskCanvas.getContext('2d')!;

      // Black background = untouched
      maskCtx.fillStyle = '#000000';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      // White strokes = area to erase & inpaint
      eraserMasks.forEach((mask) => {
        const dx = mask.x - targetImage.x;
        const dy = mask.y - targetImage.y;
        maskCtx.save();
        maskCtx.translate(dx, dy);
        maskCtx.lineWidth = (mask as any).stroke?.width || 28;
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';
        maskCtx.strokeStyle = '#ffffff';
        maskCtx.fillStyle = '#ffffff';

        const pathData = (mask as any).pathData;
        if (pathData) {
          try {
            const p = new Path2D(pathData);
            maskCtx.stroke(p);
            maskCtx.fill(p);
          } catch {
            // Fallback: simple rectangle if Path2D parsing fails
            maskCtx.fillRect(0, 0, mask.width || 20, mask.height || 20);
          }
        }
        maskCtx.restore();
      });

      setProcessingStatus('Removing object with AI...');
      addToast?.('Running AI inpainting...', 'info');

      let resultUrl: string | null = null;

      // Try Cloud Fast SDXL Inpainting first
      try {
        resultUrl = await aiRemoveObjectWithCanvas(
          targetImage.src,
          maskCanvas,
          targetImage.width,
          targetImage.height
        );
      } catch (cloudErr) {
        console.warn('[MagicEraser] Cloud inpainting failed, attempting local inpainting:', cloudErr);
      }

      // If cloud inpainting failed or API key not present, try local LaMa worker
      if (!resultUrl) {
        setProcessingStatus('Running on-device AI...');
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const imgLoaded = await new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = targetImage.src;
          });

          if (imgLoaded) {
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = targetImage.width;
            imgCanvas.height = targetImage.height;
            const imgCtx = imgCanvas.getContext('2d')!;
            imgCtx.drawImage(img, 0, 0, targetImage.width, targetImage.height);

            resultUrl = await localInpaint(imgCanvas, maskCanvas);
          }
        } catch (localErr) {
          console.warn('[MagicEraser] Local inpainting fallback failed:', localErr);
        }
      }

      if (resultUrl) {
        // 4. Update image layer with inpainted result
        updateLayer(targetImage.id, { src: resultUrl });

        // 5. Clean up mask strokes
        eraserMasks.forEach((layer) => {
          deleteLayer(layer.id);
        });

        addToast?.('✨ Object erased successfully!', 'success');
      } else {
        // If all AI fails, clean up mask and notify user
        addToast?.(
          'Could not inpaint image. Ensure an AI provider (Fal.ai / SDXL) is configured.',
          'error'
        );
      }
    } catch (err: any) {
      console.error('[MagicEraserOverlay] Erase error:', err);
      addToast?.(err.message || 'Error occurred while erasing object.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    eraserMasks.forEach((layer) => {
      deleteLayer(layer.id);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex items-center bg-surface-dark-2/95 backdrop-blur-xl border border-brand-500/40 p-2 pr-4 pl-3 rounded-full shadow-[0_8px_32px_rgba(125,42,232,0.35)] gap-4"
      >
        <div className="flex items-center gap-2 text-brand-300 font-semibold text-sm pl-2">
          <Icons.Sparkles className="w-4 h-4 animate-pulse text-brand-400" />
          <span>
            {eraserMasks.length} Mask{eraserMasks.length > 1 ? 's' : ''} Drawn
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleErase}
            disabled={isProcessing}
            className="px-5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isProcessing ? (
              <>
                <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{processingStatus}</span>
              </>
            ) : (
              <>
                <Icons.Wand className="w-3.5 h-3.5" />
                <span>Erase Object</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
