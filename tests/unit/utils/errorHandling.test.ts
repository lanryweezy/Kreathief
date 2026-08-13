import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isRetryableError,
  safeParseJSON,
} from '../../../utils/errorHandling';

describe('errorHandling utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isRetryableError', () => {
    it('returns true for fetch TypeError', () => {
      expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true);
    });

    it('returns true for NetworkError', () => {
      const error = new Error('net');
      error.name = 'NetworkError';
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for TimeoutError', () => {
      const error = new Error('timeout');
      error.name = 'TimeoutError';
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns false for generic errors', () => {
      expect(isRetryableError(new Error('bad input'))).toBe(false);
    });

    it('returns false for non-Error values', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
    });
  });

  describe('safeParseJSON', () => {
    it('parses valid JSON', () => {
      expect(safeParseJSON('{"a":1}', {})).toEqual({ a: 1 });
    });

    it('returns fallback for invalid JSON', () => {
      expect(safeParseJSON('not json', { default: true })).toEqual({ default: true });
    });

    it('returns fallback for empty string', () => {
      expect(safeParseJSON('', null)).toBe(null);
    });
  });
});
