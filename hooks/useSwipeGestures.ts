import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
    threshold?: number;
    timeout?: number;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

/**
 * Hook for detecting swipe gestures on touch devices
 * Useful for undo/redo, panel navigation, and other gestures
 */
export function useSwipeGestures(
    elementRef: React.RefObject<HTMLElement>,
    options: SwipeGestureOptions
) {
    const {
        threshold = 50,
        timeout = 300,
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
    } = options;

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!touchStartRef.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartRef.current.time;

        // Check if it was a quick swipe
        if (deltaTime > timeout) {
            touchStartRef.current = null;
            return;
        }

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Determine if horizontal or vertical swipe
        if (absX > absY && absX > threshold) {
            // Horizontal swipe
            if (deltaX > 0) {
                onSwipeRight?.();
            } else {
                onSwipeLeft?.();
            }
        } else if (absY > absX && absY > threshold) {
            // Vertical swipe
            if (deltaY > 0) {
                onSwipeDown?.();
            } else {
                onSwipeUp?.();
            }
        }

        touchStartRef.current = null;
    }, [threshold, timeout, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [elementRef, handleTouchStart, handleTouchEnd]);
}

/**
 * Hook for detecting pinch-to-zoom gestures
 */
export function usePinchZoom(
    elementRef: React.RefObject<HTMLElement>,
    options: {
        onZoom: (scale: number, centerX: number, centerY: number) => void;
        minScale?: number;
        maxScale?: number;
    }
) {
    const { onZoom, minScale = 0.1, maxScale = 5 } = options;
    const lastDistanceRef = useRef<number | null>(null);

    const getDistance = (touches: TouchList) => {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    };

    const getCenter = (touches: TouchList) => {
        const [touch1, touch2] = [touches[0], touches[1]];
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (e.touches.length !== 2) {
            lastDistanceRef.current = null;
            return;
        }

        const distance = getDistance(e.touches);
        const center = getCenter(e.touches);

        if (lastDistanceRef.current !== null) {
            const scale = distance / lastDistanceRef.current;
            const clampedScale = Math.min(maxScale, Math.max(minScale, scale));
            onZoom(clampedScale, center.x, center.y);
        }

        lastDistanceRef.current = distance;
    }, [onZoom, minScale, maxScale]);

    const handleTouchEnd = useCallback(() => {
        lastDistanceRef.current = null;
    }, []);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [elementRef, handleTouchMove, handleTouchEnd]);
}

/**
 * Hook for detecting two-finger rotation gestures
 */
export function useRotationGesture(
    elementRef: React.RefObject<HTMLElement>,
    options: {
        onRotate: (angle: number, centerX: number, centerY: number) => void;
        sensitivity?: number;
    }
) {
    const { onRotate, sensitivity = 1 } = options;
    const lastAngleRef = useRef<number | null>(null);

    const getAngle = (touches: TouchList) => {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        ) * (180 / Math.PI);
    };

    const getCenter = (touches: TouchList) => {
        const [touch1, touch2] = [touches[0], touches[1]];
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (e.touches.length !== 2) {
            lastAngleRef.current = null;
            return;
        }

        const angle = getAngle(e.touches);
        const center = getCenter(e.touches);

        if (lastAngleRef.current !== null) {
            let deltaAngle = angle - lastAngleRef.current;

            // Handle wraparound
            if (deltaAngle > 180) deltaAngle -= 360;
            if (deltaAngle < -180) deltaAngle += 360;

            onRotate(deltaAngle * sensitivity, center.x, center.y);
        }

        lastAngleRef.current = angle;
    }, [onRotate, sensitivity]);

    const handleTouchEnd = useCallback(() => {
        lastAngleRef.current = null;
    }, []);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [elementRef, handleTouchMove, handleTouchEnd]);
}

export default useSwipeGestures;
