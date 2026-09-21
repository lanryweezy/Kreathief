import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { haptics } from '../../../utils/haptics';

describe('haptics utility', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // Reset vi mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  const setupMockNavigator = (vibrateMock?: any) => {
    Object.defineProperty(global, 'navigator', {
      value: vibrateMock ? { vibrate: vibrateMock } : {},
      writable: true,
      configurable: true,
    });
  };

  it('isSupported returns true if vibrate is in navigator', () => {
    setupMockNavigator(vi.fn());
    expect(haptics.isSupported()).toBe(true);
  });

  it('isSupported returns false if vibrate is not in navigator', () => {
    setupMockNavigator();
    expect(haptics.isSupported()).toBe(false);
  });

  it('light vibrate calls navigator.vibrate with 10', () => {
    const vibrateMock = vi.fn();
    setupMockNavigator(vibrateMock);
    haptics.light();
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it('medium vibrate calls navigator.vibrate with 20', () => {
    const vibrateMock = vi.fn();
    setupMockNavigator(vibrateMock);
    haptics.medium();
    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it('heavy vibrate calls navigator.vibrate with 30', () => {
    const vibrateMock = vi.fn();
    setupMockNavigator(vibrateMock);
    haptics.heavy();
    expect(vibrateMock).toHaveBeenCalledWith(30);
  });

  it('success vibrate calls navigator.vibrate with pattern', () => {
    const vibrateMock = vi.fn();
    setupMockNavigator(vibrateMock);
    haptics.success();
    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('error vibrate calls navigator.vibrate with pattern', () => {
    const vibrateMock = vi.fn();
    setupMockNavigator(vibrateMock);
    haptics.error();
    expect(vibrateMock).toHaveBeenCalledWith([20, 100, 20, 100, 20]);
  });

  it('selection vibrate calls navigator.vibrate with 15', () => {
    const vibrateMock = vi.fn();
    setupMockNavigator(vibrateMock);
    haptics.selection();
    expect(vibrateMock).toHaveBeenCalledWith(15);
  });

  it('snap vibrate calls navigator.vibrate with 5', () => {
    const vibrateMock = vi.fn();
    setupMockNavigator(vibrateMock);
    haptics.snap();
    expect(vibrateMock).toHaveBeenCalledWith(5);
  });

  it('does nothing if vibrate is missing in navigator', () => {
    setupMockNavigator();
    expect(() => {
      haptics.light();
      haptics.medium();
      haptics.heavy();
      haptics.success();
      haptics.error();
      haptics.selection();
      haptics.snap();
    }).not.toThrow();
  });
});
