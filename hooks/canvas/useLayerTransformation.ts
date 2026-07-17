import { useState, useRef, useCallback, useEffect } from 'react';
import { Layer, ResizeHandle } from '../../types';

interface TransformationState {
  type: 'resize' | 'rotate';
  handle?: ResizeHandle;
  layerId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  initialRotation: number;
  aspectRatio: number;
  // For rotation: angle from layer center to initial mouse position
  initialAngle?: number;
}

interface UseLayerTransformationProps {
  layers: Layer[];
  zoom: number;
  onUpdateLayers: (updates: Record<string, Partial<Layer>>) => void;
}

export const useLayerTransformation = ({ layers, zoom, onUpdateLayers }: UseLayerTransformationProps) => {
  const [transformState, setTransformState] = useState<TransformationState | null>(null);
  const transformStateRef = useRef(transformState);
  const layersRef = useRef(layers);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    transformStateRef.current = transformState;
    layersRef.current = layers;
    zoomRef.current = zoom;
  }, [transformState, layers, zoom]);

  const handleResizeStart = useCallback((e: React.MouseEvent, layer: Layer, handle: ResizeHandle) => {
    e.stopPropagation();
    setTransformState({
      type: 'resize',
      handle,
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: layer.x,
      initialY: layer.y,
      initialWidth: (layer as any).width || 0,
      initialHeight: (layer as any).height || 0,
      initialRotation: layer.rotation || 0,
      aspectRatio: ((layer as any).width || 1) / ((layer as any).height || 1),
    });
  }, []);

  const handleRotateStart = useCallback((e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    const width = (layer as any).width || 0;
    const height = (layer as any).height || 0;
    // Calculate center of layer in screen coordinates
    const centerX = layer.x + width / 2;
    const centerY = layer.y + height / 2;
    // Calculate angle from center to initial mouse position (in canvas coords)
    const mouseCanvasX = e.clientX / zoomRef.current;
    const mouseCanvasY = e.clientY / zoomRef.current;
    const initialAngle = Math.atan2(mouseCanvasY - centerY, mouseCanvasX - centerX);
    setTransformState({
      type: 'rotate',
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: layer.x,
      initialY: layer.y,
      initialWidth: width,
      initialHeight: height,
      initialRotation: layer.rotation || 0,
      aspectRatio: 1,
      initialAngle,
    });
  }, []);

  const updateTransformation = useCallback(
    (e: MouseEvent) => {
      const state = transformStateRef.current;
      if (!state) {
        return;
      }

      const dx = (e.clientX - state.startX) / zoomRef.current;
      const dy = (e.clientY - state.startY) / zoomRef.current;

      const updates: Record<string, Partial<Layer>> = {};
      const partial: any = {};

      if (state.type === 'resize' && state.handle) {
        const { initialX, initialY, initialWidth, initialHeight, aspectRatio } = state;
        const isShift = e.shiftKey;

        // Rotate dx/dy to match layer rotation
        const rad = (-state.initialRotation * Math.PI) / 180;
        const rdx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const rdy = dx * Math.sin(rad) + dy * Math.cos(rad);

        let newWidth = initialWidth;
        let newHeight = initialHeight;

        const handle = state.handle;

        if (handle.includes('e')) {
          newWidth = initialWidth + rdx;
        }
        if (handle.includes('w')) {
          newWidth = initialWidth - rdx;
        }
        if (handle.includes('s')) {
          newHeight = initialHeight + rdy;
        }
        if (handle.includes('n')) {
          newHeight = initialHeight - rdy;
        }

        // Constrain minimum size
        newWidth = Math.max(1, newWidth);
        newHeight = Math.max(1, newHeight);

        // Proportional resizing: Always for certain shapes, or when Shift is held
        const layer = layersRef.current.find((l) => l.id === state.layerId);
        const isProportional = isShift || layer?.type === 'circle' || layer?.type === 'star';

        if (isProportional && handle.length === 2) {
          // Corners
          if (newWidth / newHeight > aspectRatio) {
            newWidth = newHeight * aspectRatio;
          } else {
            newHeight = newWidth / aspectRatio;
          }
        }

        partial.width = newWidth;
        partial.height = newHeight;

        // Update X/Y for top/left handles with rotation awareness
        const dw = newWidth - initialWidth;
        const dh = newHeight - initialHeight;

        let moveX = 0;
        let moveY = 0;

        if (handle.includes('w')) {
          moveX = -dw;
        }
        if (handle.includes('n')) {
          moveY = -dh;
        }

        if (moveX !== 0 || moveY !== 0) {
          const trad = (state.initialRotation * Math.PI) / 180;
          partial.x = initialX + (moveX * Math.cos(trad) - moveY * Math.sin(trad));
          partial.y = initialY + (moveX * Math.sin(trad) + moveY * Math.cos(trad));
        }
      } else if (state.type === 'rotate') {
        const layer = layersRef.current.find((l) => l.id === state.layerId);
        if (!layer) {
          return;
        }

        // Calculate center of layer in screen coordinates
        const width = state.initialWidth;
        const height = state.initialHeight;
        const centerX = state.initialX + width / 2;
        const centerY = state.initialY + height / 2;

        // Current mouse position in canvas coordinates
        const mouseCanvasX = e.clientX / zoomRef.current;
        const mouseCanvasY = e.clientY / zoomRef.current;

        // Calculate angle from center to current mouse position
        const currentAngle = Math.atan2(mouseCanvasY - centerY, mouseCanvasX - centerX);

        // Calculate angle delta from initial angle
        const angleDelta = currentAngle - (state.initialAngle || 0);

        // Convert to degrees and add to initial rotation
        const angleDeltaDeg = (angleDelta * 180) / Math.PI;
        const newRotation = state.initialRotation + angleDeltaDeg;

        // Normalize to 0-360 range
        partial.rotation = ((newRotation % 360) + 360) % 360;
      }

      updates[state.layerId] = partial;

      // Handle Group Children Transformations (Scaling & Rotation)
      const layer = layersRef.current.find((l) => l.id === state.layerId);
      if (layer?.isGroup) {
        const gInitialCenterX = state.initialX + state.initialWidth / 2;
        const gInitialCenterY = state.initialY + state.initialHeight / 2;
        const gCurrentX = partial.x ?? state.initialX;
        const gCurrentY = partial.y ?? state.initialY;
        const gCurrentW = partial.width ?? state.initialWidth;
        const gCurrentH = partial.height ?? state.initialHeight;
        const gCurrentRot = partial.rotation ?? state.initialRotation;

        const scaleX = gCurrentW / state.initialWidth;
        const scaleY = gCurrentH / state.initialHeight;
        const dRot = gCurrentRot - state.initialRotation;

        layersRef.current.forEach((child) => {
          if (child.groupId === state.layerId) {
            const childUpdate: any = {};

            if (state.type === 'resize') {
              const relX = child.x - state.initialX;
              const relY = child.y - state.initialY;
              childUpdate.x = gCurrentX + relX * scaleX;
              childUpdate.y = gCurrentY + relY * scaleY;
              childUpdate.width = ((child as any).width || 0) * scaleX;
              childUpdate.height = ((child as any).height || 0) * scaleY;
            } else if (state.type === 'rotate') {
              const trad = (dRot * Math.PI) / 180;
              const relX = child.x + ((child as any).width || 0) / 2 - gInitialCenterX;
              const relY = child.y + ((child as any).height || 0) / 2 - gInitialCenterY;

              // Rotate center position — use initial group center for consistent orbit
              const rx = relX * Math.cos(trad) - relY * Math.sin(trad);
              const ry = relX * Math.sin(trad) + relY * Math.cos(trad);

              childUpdate.x = state.initialX + state.initialWidth / 2 + rx - ((child as any).width || 0) / 2;
              childUpdate.y = state.initialY + state.initialHeight / 2 + ry - ((child as any).height || 0) / 2;
              childUpdate.rotation = (child.rotation || 0) + dRot;
            }

            updates[child.id] = { ...(updates[child.id] || {}), ...childUpdate };
          }
        });
      }

      onUpdateLayers(updates);
    },
    [onUpdateLayers]
  );

  const finalizeTransformation = useCallback(() => {
    setTransformState(null);
  }, []);

  return {
    transformState,
    handleResizeStart,
    handleRotateStart,
    updateTransformation,
    finalizeTransformation,
  };
};
