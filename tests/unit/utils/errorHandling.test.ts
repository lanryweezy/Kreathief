import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createError,
  handleApiError,
  validateRequired,
  safeExecute,
  withErrorHandling,
  getErrorBoundaryFallback,
  isRetryableError,
  safeParseJSON,
} from '../../../utils/errorHandling';

describe('errorHandling utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createError', () => {
    it('creates an AppError with message and defaults', () => {
      const error = createError('Something failed');
      expect(error.message).toBe('Something failed');
      expect(error.severity).toBe('error');
      expect(error.timestamp).toBeTypeOf('number');
      expect(error.name).toBe('AppError');
    });

    it('creates error with custom code and severity', () => {
      const error = createError('Auth failed', 'AUTH_ERROR', 'critical', { userId: '123' });
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.severity).toBe('critical');
      expect(error.context?.userId).toBe('123');
    });

    it('is an instance of Error', () => {
      const error = createError('test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('handleApiError', () => {
    it('returns network error message for fetch TypeError', () => {
      const error = new TypeError('Failed to fetch');
      const msg = handleApiError(error, 'load data');
      expect(msg).toBe('Network error. Please check your connection and try again.');
    });

    it('returns timeout message', () => {
      const error = new Error('request timeout');
      const msg = handleApiError(error);
      expect(msg).toBe('Request timed out. Please try again.');
    });

    it('returns unauthorized message', () => {
      const error = new Error('unauthorized access');
      const msg = handleApiError(error);
      expect(msg).toBe('Please log in to continue.');
    });

    it('returns forbidden message', () => {
      const error = new Error('403 forbidden');
      const msg = handleApiError(error);
      expect(msg).toBe('You do not have permission to perform this action.');
    });

    it('returns not found message', () => {
      const error = new Error('404 not found');
      const msg = handleApiError(error);
      expect(msg).toBe('The requested resource was not found.');
    });

    it('returns conflict message', () => {
      const error = new Error('409 conflict');
      const msg = handleApiError(error);
      expect(msg).toBe('There is a conflict with the current state. Please refresh and try again.');
    });

    it('returns rate limit message', () => {
      const error = new Error('429 rate limit');
      const msg = handleApiError(error);
      expect(msg).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('returns generic message for unknown errors', () => {
      const error = new Error('something weird');
      const msg = handleApiError(error, 'upload file');
      expect(msg).toBe('Failed to upload file. Please try again.');
    });
  });

  describe('validateRequired', () => {
    it('returns value when present', () => {
      expect(validateRequired('hello', 'name')).toBe('hello');
      expect(validateRequired(42, 'count')).toBe(42);
      expect(validateRequired(false, 'flag')).toBe(false);
    });

    it('throws for null', () => {
      expect(() => validateRequired(null, 'name')).toThrow("Required parameter 'name' is missing");
    });

    it('throws for undefined', () => {
      expect(() => validateRequired(undefined, 'id')).toThrow("Required parameter 'id' is missing");
    });
  });

  describe('safeExecute', () => {
    it('returns function result on success', () => {
      const result = safeExecute(() => 42, 0);
      expect(result).toBe(42);
    });

    it('returns default value on error', () => {
      const result = safeExecute(() => {
        throw new Error('boom');
      }, 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('withErrorHandling', () => {
    it('returns result on success', async () => {
      const result = await withErrorHandling(async () => 'ok', 'test action');
      expect(result).toBe('ok');
    });

    it('returns fallback on error', async () => {
      const result = await withErrorHandling(
        async () => {
          throw new Error('fail');
        },
        'test',
        'fallback'
      );
      expect(result).toBe('fallback');
    });

    it('throws AppError when no fallback', async () => {
      await expect(
        withErrorHandling(async () => {
          throw new Error('fail');
        }, 'test')
      ).rejects.toThrow();
    });
  });

  describe('getErrorBoundaryFallback', () => {
    it('returns connection problem for network errors', () => {
      const result = getErrorBoundaryFallback(new Error('Failed to fetch'));
      expect(result.title).toBe('Connection Problem');
      expect(result.retryable).toBe(true);
    });

    it('returns internal error for stack overflow', () => {
      const result = getErrorBoundaryFallback(new Error('Maximum call stack size exceeded'));
      expect(result.title).toBe('Internal Error');
      expect(result.retryable).toBe(false);
    });

    it('returns generic error for unknown errors', () => {
      const result = getErrorBoundaryFallback(new Error('random crash'));
      expect(result.title).toBe('Something Went Wrong');
    });

    it('marks NetworkError as retryable', () => {
      const error = new Error('connection failed');
      error.name = 'NetworkError';
      const result = getErrorBoundaryFallback(error);
      expect(result.retryable).toBe(true);
    });
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
