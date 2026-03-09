/**
 * Haptic feedback utilities for mobile devices
 * Provides tactile feedback for user interactions
 */

export const haptics = {
  /**
   * Light haptic feedback for subtle interactions
   * Use for: hover states, selections, minor actions
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium haptic feedback for standard interactions
   * Use for: button clicks, toggles, confirmations
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy haptic feedback for important interactions
   * Use for: destructive actions, major changes
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },

  /**
   * Success pattern - double tap
   * Use for: successful operations, completions
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern - triple tap
   * Use for: errors, failures, warnings
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 100, 20, 100, 20]);
    }
  },

  /**
   * Selection pattern - single short tap
   * Use for: selecting items, toggling states
   */
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  },

  /**
   * Check if haptics are supported
   */
  isSupported: () => {
    return 'vibrate' in navigator;
  },
};
