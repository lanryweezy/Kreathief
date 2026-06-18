import { useEffect, useRef } from 'react';
import { haptics } from '../utils/haptics';

interface TouchGestureOptions {
  onPinchZoom?: (scale: number, center: { x: number; y: number }) => void;
  onRotate?: (angle: number, center: { x: number; y: number }) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  minZoom?: number;
  maxZoom?: number;
  enabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
}

/**
 * Custom hook for handling touch gestures on mobile
 * Supports: pinch to zoom, two-finger rotate, pan
 */
export const useTouchGestures = (elementRef: React.RefObject<HTMLElement>, options: TouchGestureOptions = {}) => {
  const { onPinchZoom, onRotate, onPan, minZoom = 0.1, maxZoom = 10, enabled = true } = options;

  const initialDistance = useRef<number>(0);
  const initialAngle = useRef<number>(0);
  const lastTouchPoints = useRef<TouchPoint[]>([]);
  const isGesturing = useRef(false);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touch1: Touch, touch2: Touch): TouchPoint => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  useEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    const element = elementRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isGesturing.current = true;

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        initialDistance.current = getDistance(touch1, touch2);
        initialAngle.current = getAngle(touch1, touch2);

        lastTouchPoints.current = [
          { x: touch1.clientX, y: touch1.clientY },
          { x: touch2.clientX, y: touch2.clientY },
        ];

        haptics.light();
      } else if (e.touches.length === 1) {
        lastTouchPoints.current = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isGesturing.current) {
        e.preventDefault();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Pinch to zoom
        if (onPinchZoom) {
          const currentDistance = getDistance(touch1, touch2);
          const scale = currentDistance / initialDistance.current;
          const center = getCenter(touch1, touch2);

          // Clamp scale
          const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale));
          onPinchZoom(clampedScale, center);
        }

        // Two-finger rotate
        if (onRotate) {
          const currentAngle = getAngle(touch1, touch2);
          const angleDelta = currentAngle - initialAngle.current;
          const center = getCenter(touch1, touch2);

          onRotate(angleDelta, center);
        }
      } else if (e.touches.length === 1 && onPan && lastTouchPoints.current.length === 1) {
        const touch = e.touches[0];
        const lastTouch = lastTouchPoints.current[0];

        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;

        onPan(deltaX, deltaY);

        lastTouchPoints.current = [{ x: touch.clientX, y: touch.clientY }];
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isGesturing.current = false;
        initialDistance.current = 0;
        initialAngle.current = 0;
      }

      if (e.touches.length === 0) {
        lastTouchPoints.current = [];
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, onPinchZoom, onRotate, onPan, minZoom, maxZoom, elementRef]);

  return { isGesturing: isGesturing.current };
};
