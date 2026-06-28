import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { applyRotation3D, fillEmptyRegionsCanvas, Rotation3DResult } from '../utils/rotation3d';
import { log } from '../utils/log';

interface Use3DRotationReturn {
  /** Start 3D rotation mode for an image layer */
  start3DRotation: (layerId: string) => void;
  /** Update rotation angles during drag */
  updateRotation: (rotateX: number, rotateY: number) => void;
  /** Finish rotation and trigger AI fill */
  finishRotation: () => void;
  /** Cancel 3D rotation */
  cancelRotation: () => void;
  /** Current 3D transform result (for rendering preview) */
  currentResult: Rotation3DResult | null;
  /** Whether AI fill is in progress */
  isFilling: boolean;
  /** Fill progress 0-100 */
  fillProgress: number;
  /** Whether we're in 3D rotation mode */
  is3DRotating: boolean;
}

/**
 * Hook for 3D rotation with AI auto-fill.
 * When a user rotates an image in 3D, this hook:
 * 1. Shows instant perspective preview while dragging
 * 2. On release, detects empty regions
 * 3. Calls AI to fill the empty regions
 * 4. Replaces the image layer with the filled version
 */
export function use3DRotation(): Use3DRotationReturn {
  const [is3DRotating, setIs3DRotating] = useState(false);
  const [currentResult, setCurrentResult] = useState<Rotation3DResult | null>(null);
  const [isFilling, setIsFilling] = useState(false);
  const [fillProgress, setFillProgress] = useState(0);

  const layerIdRef = useRef<string | null>(null);
  const rotateXRef = useRef(0);
  const rotateYRef = useRef(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { updateLayer, addToast } = useStore();

  /**
   * Load the image from a layer's src and prepare for 3D rotation.
   */
  const start3DRotation = useCallback(
    (layerId: string) => {
      const state = useStore.getState();
      let targetLayer: any = null;
      for (const ab of state.artboards) {
        const found = ab.layers.find((l) => l.id === layerId);
        if (found) {
          targetLayer = found;
          break;
        }
      }

      if (!targetLayer || targetLayer.type !== 'image') {
        addToast('3D rotation only works on image layers', 'warning');
        return;
      }

      const src = targetLayer.src;
      if (!src) {
        addToast('Image has no source', 'warning');
        return;
      }

      layerIdRef.current = layerId;
      rotateXRef.current = 0;
      rotateYRef.current = 0;

      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setIs3DRotating(true);

        // Create a working canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetLayer.width || img.naturalWidth;
        canvas.height = targetLayer.height || img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvasRef.current = canvas;

        log.info('[3DRotation] Started for layer', { layerId, width: canvas.width, height: canvas.height });
      };
      img.onerror = () => {
        addToast('Failed to load image for 3D rotation', 'error');
      };
      img.src = src;
    },
    [addToast]
  );

  /**
   * Update rotation angles during drag — shows instant perspective preview.
   */
  const updateRotation = useCallback(
    (rotateX: number, rotateY: number) => {
      if (!is3DRotating || !canvasRef.current) {
        return;
      }

      rotateXRef.current = rotateX;
      rotateYRef.current = rotateY;

      // Apply perspective transform (instant, no AI)
      const result = applyRotation3D({
        image: canvasRef.current,
        rotateX,
        rotateY,
        rotateZ: 0,
        perspective: 800,
        centerX: canvasRef.current.width / 2,
        centerY: canvasRef.current.height / 2,
      });

      setCurrentResult(result);
    },
    [is3DRotating]
  );

  /**
   * Finish rotation — apply AI fill to empty regions and update the layer.
   */
  const finishRotation = useCallback(async () => {
    if (!currentResult || !layerIdRef.current) {
      return;
    }

    // Check if there are significant empty regions
    if (!currentResult.hasEmptyPixels) {
      // No empty pixels — just apply the transform directly
      applyTransformedImage(currentResult.transformedCanvas);
      return;
    }

    setIsFilling(true);
    setFillProgress(10);

    try {
      // Phase 1: Canvas-based fill (instant)
      const canvasFilled = fillEmptyRegionsCanvas(currentResult.transformedCanvas, currentResult.maskCanvas, 30);
      setFillProgress(40);

      // Phase 2: AI-enhanced fill (if significant empty area)
      const emptyRatio =
        currentResult.emptyPixelCount /
        (currentResult.transformedCanvas.width * currentResult.transformedCanvas.height);

      if (emptyRatio > 0.05) {
        // More than 5% empty — use AI for better quality
        setFillProgress(50);
        try {
          const aiFilled = await aiInpaint(
            currentResult.transformedCanvas,
            currentResult.maskCanvas,
            rotateXRef.current,
            rotateYRef.current
          );
          if (aiFilled) {
            setFillProgress(90);
            applyTransformedImage(aiFilled);
          } else {
            // AI failed — use canvas fallback
            applyTransformedImage(canvasFilled);
          }
        } catch (err) {
          log.warn('[3DRotation] AI fill failed, using canvas fallback', { error: err });
          applyTransformedImage(canvasFilled);
        }
      } else {
        // Small empty area — canvas fill is sufficient
        applyTransformedImage(canvasFilled);
      }

      setFillProgress(100);
      addToast('3D rotation applied with auto-fill!', 'success');
    } catch (err) {
      log.error('[3DRotation] Fill failed', err);
      addToast('3D rotation fill failed', 'error');
    } finally {
      setIsFilling(false);
      setFillProgress(0);
      setIs3DRotating(false);
      setCurrentResult(null);
      layerIdRef.current = null;
      imageRef.current = null;
      canvasRef.current = null;
    }
  }, [currentResult, addToast]);

  const cancelRotation = useCallback(() => {
    setIs3DRotating(false);
    setCurrentResult(null);
    layerIdRef.current = null;
    imageRef.current = null;
    canvasRef.current = null;
  }, []);

  // Apply the filled image back to the layer
  const applyTransformedImage = useCallback(
    (filledCanvas: HTMLCanvasElement) => {
      if (!layerIdRef.current) {
        return;
      }

      const dataUrl = filledCanvas.toDataURL('image/png');
      updateLayer(layerIdRef.current, {
        src: dataUrl,
        width: filledCanvas.width,
        height: filledCanvas.height,
      } as any);
    },
    [updateLayer]
  );

  // Keyboard shortcuts for 3D rotation mode
  useEffect(() => {
    if (!is3DRotating) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelRotation();
      } else if (e.key === 'Enter') {
        finishRotation();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newY = Math.max(-60, rotateYRef.current - 5);
        rotateYRef.current = newY;
        updateRotation(rotateXRef.current, newY);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newY = Math.min(60, rotateYRef.current + 5);
        rotateYRef.current = newY;
        updateRotation(rotateXRef.current, newY);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newX = Math.max(-60, rotateXRef.current - 5);
        rotateXRef.current = newX;
        updateRotation(newX, rotateYRef.current);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newX = Math.min(60, rotateXRef.current + 5);
        rotateXRef.current = newX;
        updateRotation(newX, rotateYRef.current);
      } else if (e.key === '0') {
        rotateXRef.current = 0;
        rotateYRef.current = 0;
        updateRotation(0, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [is3DRotating, cancelRotation, finishRotation, updateRotation]);

  return {
    start3DRotation,
    updateRotation,
    finishRotation,
    cancelRotation,
    currentResult,
    isFilling,
    fillProgress,
    is3DRotating,
  };
}

/**
 * Call AI inpainting API to fill empty regions.
 */
async function aiInpaint(
  transformedCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  rotateX: number,
  rotateY: number
): Promise<HTMLCanvasElement | null> {
  // Convert canvases to data URLs
  const imageDataUrl = transformedCanvas.toDataURL('image/png');
  const maskDataUrl = maskCanvas.toDataURL('image/png');

  // Determine which edges need filling based on rotation direction
  const emptyRegion =
    Math.abs(rotateY) > Math.abs(rotateX) ? (rotateY > 0 ? 'right' : 'left') : rotateX > 0 ? 'bottom' : 'top';

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'inpaint',
        image: imageDataUrl,
        mask: maskDataUrl,
        prompt: `Fill in the transparent areas of this image that became visible after a ${Math.round(Math.sqrt(rotateX * rotateX + rotateY * rotateY))}-degree 3D rotation. The empty ${emptyRegion} areas should be filled with content that matches the style, lighting, colors, and context of the original image. Make it look natural and continuous.`,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI inpaint failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.image || result.url) {
      const imgUrl = result.image || result.url;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = transformedCanvas.width;
          canvas.height = transformedCanvas.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas);
        };
        img.onerror = () => resolve(null);
        img.src = imgUrl;
      });
    }
    return null;
  } catch (err) {
    log.warn('[3DRotation] AI inpaint request failed', { error: err });
    return null;
  }
}
