import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPerformanceMetrics } from '../../utils/performance';

describe('performance utils', () => {
  let originalSessionStorage: Storage;

  beforeEach(() => {
    // Save original sessionStorage and set up a mock
    originalSessionStorage = global.sessionStorage;
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    vi.stubGlobal('sessionStorage', sessionStorageMock);
  });

  afterEach(() => {
    // Restore original globals
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getPerformanceMetrics', () => {
    it('returns an empty array when sessionStorage is empty', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);
      const metrics = getPerformanceMetrics();
      expect(metrics).toEqual([]);
      expect(sessionStorage.getItem).toHaveBeenCalledWith('perf_metrics');
    });

    it('returns an empty array when perf_metrics is empty array string', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('[]');
      const metrics = getPerformanceMetrics();
      expect(metrics).toEqual([]);
      expect(sessionStorage.getItem).toHaveBeenCalledWith('perf_metrics');
    });

    it('returns parsed metrics when sessionStorage has valid JSON data', () => {
      const mockMetrics = [
        { name: 'test-metric-1', value: 150, rating: 'needs-improvement', timestamp: 1000 },
        { name: 'test-metric-2', value: 50, rating: 'good', timestamp: 2000 },
      ];
      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(mockMetrics));

      const metrics = getPerformanceMetrics();

      expect(metrics).toEqual(mockMetrics);
      expect(sessionStorage.getItem).toHaveBeenCalledWith('perf_metrics');
    });

    it('returns an empty array when JSON parsing fails (fallback behavior)', () => {
      // Mock with invalid JSON string
      vi.mocked(sessionStorage.getItem).mockReturnValue('invalid-json');

      const metrics = getPerformanceMetrics();

      expect(metrics).toEqual([]);
      expect(sessionStorage.getItem).toHaveBeenCalledWith('perf_metrics');
    });
  });
});
