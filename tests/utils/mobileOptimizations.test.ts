import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMobileDevice,
  isIOS,
  isAndroid,
  getDevicePixelRatio,
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
});
