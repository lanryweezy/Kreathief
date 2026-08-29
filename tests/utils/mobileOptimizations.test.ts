import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMobileDevice,
  isIOS,
  isAndroid,
  getDevicePixelRatio,
  requestAnimationFramePolyfill,
  cancelAnimationFramePolyfill,
  chunkArray,
  preventDoubleTapZoom,
  enableMomentumScrolling,
  addOptimizedTouchListener,
  calculateVisibleRange,
  optimizeCanvasForMobile,
  optimizeImageForMobile,
  lazyLoadImage,
  shouldReduceMotion,
  getOptimalAnimationDuration,
  getSafeAreaInsets,
} from '../../utils/mobileOptimizations';

describe('mobileOptimizations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isMobileDevice', () => {
    it('returns false when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(isMobileDevice()).toBe(false);
    });

    it('returns true when window innerWidth is less than 768', () => {
      vi.stubGlobal('window', { innerWidth: 700 });
      vi.stubGlobal('navigator', { userAgent: 'Desktop Browser' });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true for known mobile user agents even if innerWidth >= 768', () => {
      vi.stubGlobal('window', { innerWidth: 800 });
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X)' });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns false for desktop browsers with innerWidth >= 768', () => {
      vi.stubGlobal('window', { innerWidth: 1024 });
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('returns false when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(isIOS()).toBe(false);
    });

    it('returns true for iPhone user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X)' });
      expect(isIOS()).toBe(true);
    });

    it('returns true for iPad user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X)' });
      expect(isIOS()).toBe(true);
    });

    it('returns false for Android user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B)' });
      expect(isIOS()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('returns false when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(isAndroid()).toBe(false);
    });

    it('returns true for Android user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B)' });
      expect(isAndroid()).toBe(true);
    });

    it('returns false for iPhone user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X)' });
      expect(isAndroid()).toBe(false);
    });
  });

  describe('getDevicePixelRatio', () => {
    it('returns 1 when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(getDevicePixelRatio()).toBe(1);
    });

    it('returns window.devicePixelRatio if it exists', () => {
      vi.stubGlobal('window', { devicePixelRatio: 2.5 });
      expect(getDevicePixelRatio()).toBe(2.5);
    });

    it('returns 1 if window.devicePixelRatio is not defined', () => {
      vi.stubGlobal('window', { devicePixelRatio: undefined });
      expect(getDevicePixelRatio()).toBe(1);
    });
  });

  describe('requestAnimationFramePolyfill', () => {
    it('uses window.requestAnimationFrame if available', () => {
      const mockRaf = vi.fn().mockReturnValue(123);
      vi.stubGlobal('window', { requestAnimationFrame: mockRaf });
      const callback = vi.fn();

      const result = requestAnimationFramePolyfill(callback);

      expect(mockRaf).toHaveBeenCalledWith(callback);
      expect(result).toBe(123);
    });

    it('falls back to window.setTimeout if requestAnimationFrame is not available', () => {
      const mockSetTimeout = vi.fn().mockReturnValue(456);
      vi.stubGlobal('window', {
        requestAnimationFrame: undefined,
        setTimeout: mockSetTimeout,
      });
      vi.stubGlobal('setTimeout', mockSetTimeout);
      const callback = vi.fn();

      const result = requestAnimationFramePolyfill(callback);

      expect(mockSetTimeout).toHaveBeenCalledWith(callback, expect.any(Number));
      expect(result).toBe(456);
    });
  });

  describe('cancelAnimationFramePolyfill', () => {
    it('uses window.cancelAnimationFrame if available', () => {
      const mockCaf = vi.fn();
      vi.stubGlobal('window', { cancelAnimationFrame: mockCaf });

      cancelAnimationFramePolyfill(123);

      expect(mockCaf).toHaveBeenCalledWith(123);
    });

    it('falls back to window.clearTimeout if cancelAnimationFrame is not available', () => {
      const mockClearTimeout = vi.fn();
      vi.stubGlobal('window', {
        cancelAnimationFrame: undefined,
        clearTimeout: mockClearTimeout,
      });
      vi.stubGlobal('clearTimeout', mockClearTimeout);

      cancelAnimationFramePolyfill(456);

      expect(mockClearTimeout).toHaveBeenCalledWith(456);
    });
  });

  describe('preventDoubleTapZoom', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('prevents default on touchend if tapped twice within 300ms', () => {
      const element = document.createElement('div');
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

      preventDoubleTapZoom(element);

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });

      // Simulate double tap
      const touchEndHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
      const event1 = new Event('touchend') as any;
      event1.preventDefault = vi.fn();

      // First tap
      vi.useFakeTimers();
      vi.setSystemTime(1000);
      touchEndHandler(event1);
      expect(event1.preventDefault).not.toHaveBeenCalled();

      // Second tap within 300ms
      const event2 = new Event('touchend') as any;
      event2.preventDefault = vi.fn();
      vi.setSystemTime(1200); // 200ms later
      touchEndHandler(event2);
      expect(event2.preventDefault).toHaveBeenCalled();

      // Third tap after 300ms
      const event3 = new Event('touchend') as any;
      event3.preventDefault = vi.fn();
      vi.setSystemTime(1600); // 400ms later
      touchEndHandler(event3);
      expect(event3.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('enableMomentumScrolling', () => {
    it('sets webkitOverflowScrolling to touch and overflowY to auto', () => {
      const element = document.createElement('div');

      enableMomentumScrolling(element);

      expect((element.style as any).webkitOverflowScrolling).toBe('touch');
      expect(element.style.overflowY).toBe('auto');
    });
  });

  describe('addOptimizedTouchListener', () => {
    it('adds event listener with passive true by default', () => {
      const element = document.createElement('div');
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      const handler = vi.fn();

      addOptimizedTouchListener(element, 'touchstart', handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', handler, { passive: true });
    });

    it('merges custom options with passive true', () => {
      const element = document.createElement('div');
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      const handler = vi.fn();

      addOptimizedTouchListener(element, 'touchmove', handler, { capture: true });

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', handler, { passive: true, capture: true });
    });

    it('allows overriding passive to false', () => {
      const element = document.createElement('div');
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      const handler = vi.fn();

      addOptimizedTouchListener(element, 'touchend', handler, { passive: false });

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', handler, { passive: false });
    });
  });

  describe('shouldReduceMotion', () => {
    it('returns false when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(shouldReduceMotion()).toBe(false);
    });

    it('returns matches value from matchMedia', () => {
      const matchMediaMock = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
      }));
      vi.stubGlobal('window', { matchMedia: matchMediaMock });

      expect(shouldReduceMotion()).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('getOptimalAnimationDuration', () => {
    it('returns 0 if shouldReduceMotion is true', () => {
      const matchMediaMock = vi.fn().mockImplementation(() => ({ matches: true }));
      vi.stubGlobal('window', { matchMedia: matchMediaMock });

      expect(getOptimalAnimationDuration(500)).toBe(0);
    });

    it('returns slightly faster duration for mobile devices', () => {
      const matchMediaMock = vi.fn().mockImplementation(() => ({ matches: false }));
      vi.stubGlobal('window', { matchMedia: matchMediaMock, innerWidth: 320 });
      vi.stubGlobal('navigator', { userAgent: 'iPhone' });

      expect(getOptimalAnimationDuration(1000)).toBe(800); // 1000 * 0.8
    });

    it('returns base duration for non-mobile devices', () => {
      const matchMediaMock = vi.fn().mockImplementation(() => ({ matches: false }));
      vi.stubGlobal('window', { matchMedia: matchMediaMock, innerWidth: 1024 });
      vi.stubGlobal('navigator', { userAgent: 'Desktop' });

      expect(getOptimalAnimationDuration(1000)).toBe(1000);
    });
  });

  describe('getSafeAreaInsets', () => {
    it('returns zeros when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(getSafeAreaInsets()).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('parses env variables from computed style', () => {
      const getComputedStyleMock = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockImplementation((prop) => {
          const values: Record<string, string> = {
            'env(safe-area-inset-top)': '44px',
            'env(safe-area-inset-right)': '0px',
            'env(safe-area-inset-bottom)': '34px',
            'env(safe-area-inset-left)': '0px',
          };
          return values[prop];
        }),
      });
      vi.stubGlobal('getComputedStyle', getComputedStyleMock);

      expect(getSafeAreaInsets()).toEqual({ top: 44, right: 0, bottom: 34, left: 0 });
    });

    it('defaults to 0 if env variables are empty', () => {
      const getComputedStyleMock = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue(''),
      });
      vi.stubGlobal('getComputedStyle', getComputedStyleMock);

      expect(getSafeAreaInsets()).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });
  });

  describe('optimizeCanvasForMobile', () => {
    it('scales canvas for non-mobile using raw dpr', () => {
      vi.stubGlobal('window', { devicePixelRatio: 3, innerWidth: 1024 }); // non-mobile
      vi.stubGlobal('navigator', { userAgent: 'Desktop' });

      const canvas = document.createElement('canvas');
      canvas.getBoundingClientRect = vi.fn().mockReturnValue({ width: 100, height: 50 });
      const ctx = { scale: vi.fn() };
      canvas.getContext = vi.fn().mockReturnValue(ctx);

      optimizeCanvasForMobile(canvas);

      expect(canvas.width).toBe(300); // 100 * 3
      expect(canvas.height).toBe(150); // 50 * 3
      expect(ctx.scale).toHaveBeenCalledWith(3, 3);
    });

    it('limits canvas dpr to 2 for mobile to save memory', () => {
      vi.stubGlobal('window', { devicePixelRatio: 3, innerWidth: 320 }); // mobile
      vi.stubGlobal('navigator', { userAgent: 'iPhone' });

      const canvas = document.createElement('canvas');
      canvas.getBoundingClientRect = vi.fn().mockReturnValue({ width: 100, height: 50 });
      const ctx = { scale: vi.fn() };
      canvas.getContext = vi.fn().mockReturnValue(ctx);

      optimizeCanvasForMobile(canvas);

      expect(canvas.width).toBe(200); // 100 * 2 (capped at 2)
      expect(canvas.height).toBe(100); // 50 * 2 (capped at 2)
      expect(ctx.scale).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('optimizeImageForMobile', () => {
    it('returns original url for non-mobile devices', () => {
      vi.stubGlobal('window', { innerWidth: 1024 });
      vi.stubGlobal('navigator', { userAgent: 'Desktop' });

      const url = 'https://example.com/image.jpg';
      expect(optimizeImageForMobile(url)).toBe(url);
    });

    it('appends optimization parameters for mobile devices', () => {
      vi.stubGlobal('window', {
        innerWidth: 320,
        location: { origin: 'https://example.com' },
      });
      vi.stubGlobal('navigator', { userAgent: 'iPhone' });

      const url = 'https://example.com/image.jpg';
      const result = optimizeImageForMobile(url, 500);

      const urlObj = new URL(result);
      expect(urlObj.searchParams.get('w')).toBe('500');
      expect(urlObj.searchParams.get('q')).toBe('80');
      expect(urlObj.searchParams.get('f')).toBe('auto');
    });
  });

  describe('lazyLoadImage', () => {
    let mockObserver: any;

    beforeEach(() => {
      mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
      };
      vi.stubGlobal(
        'IntersectionObserver',
        vi.fn().mockImplementation((callback) => {
          mockObserver.callback = callback;
          return mockObserver;
        })
      );
    });

    it('uses IntersectionObserver when available', () => {
      vi.stubGlobal('window', { IntersectionObserver: vi.fn() });
      const img = document.createElement('img');
      const src = 'test.jpg';

      lazyLoadImage(img, src);

      expect(mockObserver.callback).toBeDefined();
      expect(mockObserver.observe).toHaveBeenCalledWith(img);

      // Simulate intersection
      mockObserver.callback([{ isIntersecting: true }]);

      expect(img.src).toContain('test.jpg');
      expect(mockObserver.unobserve).toHaveBeenCalledWith(img);
    });

    it('falls back to setting src directly if IntersectionObserver is not available', () => {
      vi.stubGlobal('window', {});

      const img = document.createElement('img');
      const src = 'fallback.jpg';

      lazyLoadImage(img, src);

      expect(img.src).toContain('fallback.jpg');
    });
  });

  describe('calculateVisibleRange', () => {
    it('calculates the visible range correctly with default overscan', () => {
      const scrollTop = 100;
      const containerHeight = 500;
      const itemHeight = 50;
      const totalItems = 100;

      // start: floor(100/50) - 3 = 2 - 3 = -1 -> max(0, -1) = 0
      // visibleCount: ceil(500/50) = 10
      // end: min(100, 0 + 10 + 3*2) = 16
      const result = calculateVisibleRange(scrollTop, containerHeight, itemHeight, totalItems);

      expect(result).toEqual({ start: 0, end: 16 });
    });

    it('calculates with custom overscan', () => {
      const scrollTop = 500;
      const containerHeight = 200;
      const itemHeight = 40;
      const totalItems = 50;

      // start: floor(500/40) - 1 = 12 - 1 = 11
      // visibleCount: ceil(200/40) = 5
      // end: min(50, 11 + 5 + 1*2) = 18
      const result = calculateVisibleRange(scrollTop, containerHeight, itemHeight, totalItems, 1);

      expect(result).toEqual({ start: 11, end: 18 });
    });

    it('clamps to totalItems', () => {
      const scrollTop = 480;
      const containerHeight = 100;
      const itemHeight = 50;
      const totalItems = 10;

      // start: floor(480/50) - 3 = 9 - 3 = 6
      // visibleCount: ceil(100/50) = 2
      // end: min(10, 6 + 2 + 6) = 10
      const result = calculateVisibleRange(scrollTop, containerHeight, itemHeight, totalItems);

      expect(result).toEqual({ start: 6, end: 10 });
    });
  });

  describe('chunkArray', () => {
    it('chunks an array correctly', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const result = chunkArray(array, 3);

      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('returns empty array when input is empty', () => {
      const result = chunkArray([], 2);

      expect(result).toEqual([]);
    });
  });
});
