/**
 * Haptic feedback utilities for mobile devices
 * Provides tactile feedback for user interactions
 */

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
};

export const haptics = {
  /**
   * Light haptic feedback for subtle interactions
   * Use for: hover states, selections, minor actions
   */
  light: () => vibrate(10),

  /**
   * Medium haptic feedback for standard interactions
   * Use for: button clicks, toggles, confirmations
   */
  medium: () => vibrate(20),

  /**
   * Heavy haptic feedback for important interactions
   * Use for: destructive actions, major changes
   */
  heavy: () => vibrate(30),

  /**
   * Success pattern - double tap
   * Use for: successful operations, completions
   */
  success: () => vibrate([10, 50, 10]),

  /**
   * Error pattern - triple tap
   * Use for: errors, failures, warnings
   */
  error: () => vibrate([20, 100, 20, 100, 20]),

  /**
   * Selection pattern - single short tap
   * Use for: selecting items, toggling states
   */
  selection: () => vibrate(15),

  /**
   * Snap pattern - micro tap when aligning to guides
   * Use for: snapping to center guides, edges, grid
   */
  snap: () => vibrate(5),

  /**
   * Check if haptics are supported
   */
  isSupported: () => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  },
};
