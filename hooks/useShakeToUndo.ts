import { useEffect, useRef } from 'react';
import { haptics } from '../utils/haptics';

interface ShakeToUndoOptions {
  onShake: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Shake to Undo - Mobile gesture for quick undo
 * Detects device shake motion and triggers undo action
 */
export const useShakeToUndo = (options: ShakeToUndoOptions) => {
  const { onShake, threshold = 15, enabled = true } = options;
  
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastZ = useRef(0);
  const lastTime = useRef(Date.now());
  const shakeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.DeviceMotionEvent) {
      return;
    }

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime.current;

      if (timeDiff > 100) {
        const x = acceleration.x || 0;
        const y = acceleration.y || 0;
        const z = acceleration.z || 0;

        const deltaX = Math.abs(x - lastX.current);
        const deltaY = Math.abs(y - lastY.current);
        const deltaZ = Math.abs(z - lastZ.current);

        // Detect shake motion
        if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
          // Debounce shake detection
          if (shakeTimeout.current) {
            clearTimeout(shakeTimeout.current);
          }

          shakeTimeout.current = setTimeout(() => {
            haptics.heavy();
            onShake();
          }, 100);
        }

        lastX.current = x;
        lastY.current = y;
        lastZ.current = z;
        lastTime.current = currentTime;
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      if (shakeTimeout.current) {
        clearTimeout(shakeTimeout.current);
      }
    };
  }, [enabled, onShake, threshold]);
};
