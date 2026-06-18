import { useCallback, useRef } from 'react';
import { haptics } from '../utils/haptics';

interface LongPressOptions {
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (e: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
  enabled?: boolean;
}

/**
 * Long Press Hook - Detects long press gestures on mobile
 * Triggers haptic feedback and callback after specified delay
 */
export const useLongPress = (options: LongPressOptions) => {
  const { onLongPress, onClick, delay = 500, enabled = true } = options;

  const timeout = useRef<NodeJS.Timeout | null>(null);
  const target = useRef<EventTarget | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!enabled) {
        return;
      }

      isLongPress.current = false;
      target.current = e.target;

      timeout.current = setTimeout(() => {
        isLongPress.current = true;
        haptics.medium();
        onLongPress(e);
      }, delay);
    },
    [enabled, delay, onLongPress]
  );

  const clear = useCallback(
    (e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick(e);
      }

      isLongPress.current = false;
      target.current = null;
    },
    [onClick]
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: start,
    onTouchEnd: clear,
  };
};
