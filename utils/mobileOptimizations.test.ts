import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMobileDevice,
  isIOS,
  isAndroid,
  getDevicePixelRatio
} from './mobileOptimizations';

describe('mobileOptimizations', () => {
  let originalWindow: typeof window | undefined;
  let originalNavigator: typeof navigator | undefined;

  beforeEach(() => {
    // Store original window if we need to modify it
    originalWindow = globalThis.window;
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.window = originalWindow as any;
    globalThis.navigator = originalNavigator as any;
  });

  describe('isMobileDevice', () => {
    it('returns false when window is undefined', () => {
      const tempWindow = globalThis.window;
      // @ts-ignore
      delete globalThis.window;

      expect(isMobileDevice()).toBe(false);

      globalThis.window = tempWindow;
    });

    it('returns true when window.innerWidth < 768', () => {
      vi.stubGlobal('window', { innerWidth: 500 });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true when userAgent matches a mobile device', () => {
      vi.stubGlobal('window', { innerWidth: 1024 });
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X)' });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns false for desktop user agent and wide window', () => {
      vi.stubGlobal('window', { innerWidth: 1024 });
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('returns false when window is undefined', () => {
      const tempWindow = globalThis.window;
      // @ts-ignore
      delete globalThis.window;

      expect(isIOS()).toBe(false);

      globalThis.window = tempWindow;
    });

    it('returns true for iPad', () => {
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X)' });
      expect(isIOS()).toBe(true);
    });

    it('returns true for iPhone', () => {
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X)' });
      expect(isIOS()).toBe(true);
    });

    it('returns false for Android', () => {
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-A205U)' });
      expect(isIOS()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('returns false when window is undefined', () => {
      const tempWindow = globalThis.window;
      // @ts-ignore
      delete globalThis.window;

      expect(isAndroid()).toBe(false);

      globalThis.window = tempWindow;
    });

    it('returns true when userAgent contains Android', () => {
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36' });
      expect(isAndroid()).toBe(true);
    });

    it('returns false when userAgent does not contain Android', () => {
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1' });
      expect(isAndroid()).toBe(false);
    });
  });

  describe('getDevicePixelRatio', () => {
    it('returns 1 when window is undefined', () => {
      const tempWindow = globalThis.window;
      // @ts-ignore
      delete globalThis.window;

      expect(getDevicePixelRatio()).toBe(1);

      globalThis.window = tempWindow;
    });

    it('returns window.devicePixelRatio if defined', () => {
      vi.stubGlobal('window', { devicePixelRatio: 2 });
      expect(getDevicePixelRatio()).toBe(2);
    });

    it('returns 1 if window.devicePixelRatio is undefined', () => {
      vi.stubGlobal('window', {});
      expect(getDevicePixelRatio()).toBe(1);
    });
  });
});
