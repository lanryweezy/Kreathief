import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isMobileDevice, isIOS, isAndroid, getDevicePixelRatio } from './mobileOptimizations';

describe('mobileOptimizations', () => {
  let originalWindow: typeof window | undefined;
  let originalNavigator: typeof navigator | undefined;

  beforeEach(() => {
    // Save original globals
    originalWindow = global.window;
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    // Restore original globals
    if (originalWindow !== undefined) {
      global.window = originalWindow;
    } else {
      // @ts-expect-error - testing undefined environment
      delete global.window;
    }

    if (originalNavigator !== undefined) {
      global.navigator = originalNavigator;
    } else {
      // @ts-expect-error - testing undefined environment
      delete global.navigator;
    }

    vi.restoreAllMocks();
  });

  describe('isMobileDevice', () => {
    it('returns false when window is undefined', () => {
      // @ts-expect-error - testing undefined environment
      delete global.window;
      expect(isMobileDevice()).toBe(false);
    });

    it('returns true when window.innerWidth is less than 768', () => {
      global.window = { innerWidth: 700 } as any;
      global.navigator = { userAgent: 'Desktop Browser' } as any;
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true when userAgent matches mobile devices', () => {
      global.window = { innerWidth: 1024 } as any;

      const mobileAgents = [
        'Mozilla/5.0 (Linux; Android 10)',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)',
        'Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X)',
        'Opera Mini/7.1.32052/29.3417; U; en',
      ];

      mobileAgents.forEach((agent) => {
        global.navigator = { userAgent: agent } as any;
        expect(isMobileDevice()).toBe(true);
      });
    });

    it('returns false when window is wide and userAgent is not mobile', () => {
      global.window = { innerWidth: 1024 } as any;
      global.navigator = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0' } as any;
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('returns false when window is undefined', () => {
      // @ts-expect-error - testing undefined environment
      delete global.window;
      expect(isIOS()).toBe(false);
    });

    it('returns true for iOS user agents', () => {
      global.window = {} as any; // window just needs to be defined

      const iosAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)',
        'Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X)',
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0 like Mac OS X)',
      ];

      iosAgents.forEach((agent) => {
        global.navigator = {} as any;
        Object.defineProperty(global.navigator, 'userAgent', { value: agent, configurable: true });
        expect(isIOS()).toBe(true);
      });
    });

    it('returns false for non-iOS user agents', () => {
      global.window = {} as any;
      global.navigator = {} as any;
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        configurable: true,
      });
      expect(isIOS()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('returns false when window is undefined', () => {
      // @ts-expect-error - testing undefined environment
      delete global.window;
      expect(isAndroid()).toBe(false);
    });

    it('returns true for Android user agents', () => {
      global.window = {} as any;
      global.navigator = {} as any;
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        configurable: true,
      });
      expect(isAndroid()).toBe(true);
    });

    it('returns false for non-Android user agents', () => {
      global.window = {} as any;
      global.navigator = {} as any;
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)',
        configurable: true,
      });
      expect(isAndroid()).toBe(false);
    });
  });

  describe('getDevicePixelRatio', () => {
    it('returns 1 when window is undefined', () => {
      // @ts-expect-error - testing undefined environment
      delete global.window;
      expect(getDevicePixelRatio()).toBe(1);
    });

    it('returns window.devicePixelRatio when defined', () => {
      global.window = { devicePixelRatio: 2 } as any;
      expect(getDevicePixelRatio()).toBe(2);
    });

    it('returns 1 when window.devicePixelRatio is undefined', () => {
      global.window = {} as any;
      expect(getDevicePixelRatio()).toBe(1);
    });
  });
});
