import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createError,
  logError,
  handleApiError,
  validateRequired,
  safeExecute,
  withErrorHandling,
  getErrorBoundaryFallback,
  isRetryableError,
  retryWithBackoff,
  safeParseJSON,
} from '../../../utils/errorHandling';
import { log } from '../../../utils/log';

// Mock the logger to avoid polluting test output
vi.mock('../../../utils/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('errorHandling utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent navigator.sendBeacon from failing if running in an environment that has it (or doesn't)
    if (!global.navigator) {
      (global as any).navigator = {} as any;
    }
    if (global.navigator.sendBeacon) {
      vi.spyOn(global.navigator, 'sendBeacon').mockReturnValue(true);
    } else {
      global.navigator.sendBeacon = vi.fn().mockReturnValue(true);
    }

    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'test-agent',
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createError', () => {
    it('creates a standardized error with defaults', () => {
      const error = createError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.severity).toBe('error');
      expect(error.name).toBe('AppError');
      expect(error.timestamp).toBeTypeOf('number');
    });

    it('creates a standardized error with custom properties', () => {
      const context = { userId: '123' };
      const error = createError('Test error', 'TEST_CODE', 'critical', context);
      expect(error.code).toBe('TEST_CODE');
      expect(error.severity).toBe('critical');
      expect(error.context).toEqual(context);
    });
  });

  describe('logError', () => {
    const originalDev = import.meta.env.DEV;
    const originalProd = import.meta.env.PROD;

    afterEach(() => {
      import.meta.env.DEV = originalDev;
      import.meta.env.PROD = originalProd;
    });

    it('logs to console in development', () => {
      import.meta.env.DEV = true;
      import.meta.env.PROD = false;

      const error = new Error('Test error');
      logError(error, { action: 'test' });

      expect(log.error).toHaveBeenCalledWith(
        '[App Error]',
        expect.objectContaining({
          message: 'Test error',
          context: { action: 'test' },
        })
      );
      expect(global.navigator.sendBeacon).not.toHaveBeenCalled();
    });

    it('sends beacon in production', () => {
      import.meta.env.DEV = false;
      import.meta.env.PROD = true;

      const error = new Error('Test error');
      logError(error, { action: 'test' });

      expect(global.navigator.sendBeacon).toHaveBeenCalledWith(
        '/api/error-log',
        expect.any(String)
      );
      const calledArgs = (global.navigator.sendBeacon as any).mock.calls[0];
      const parsedInfo = JSON.parse(calledArgs[1]);
      expect(parsedInfo.message).toBe('Test error');
      expect(parsedInfo.context).toEqual({ action: 'test' });
    });

    it('logs error if sending beacon fails in production', () => {
      import.meta.env.DEV = false;
      import.meta.env.PROD = true;
      (global.navigator.sendBeacon as any).mockImplementationOnce(() => {
        throw new Error('beacon failed');
      });

      const error = new Error('Test error');
      logError(error, { action: 'test' });

      expect(log.error).toHaveBeenCalledWith('[Error Logging Failed]', expect.any(Error));
    });

    it('handles non-Error objects', () => {
      import.meta.env.DEV = true;
      logError('String error');
      expect(log.error).toHaveBeenCalledWith(
        '[App Error]',
        expect.objectContaining({
          message: 'String error',
        })
      );
    });
  });

  describe('handleApiError', () => {
    it('handles TypeError for fetch network errors', () => {
      const error = new TypeError('Failed to fetch');
      const result = handleApiError(error);
      expect(result).toBe('Network error. Please check your connection and try again.');
    });

    it('handles timeout errors', () => {
      const error = new Error('Request timeout exceeded');
      const result = handleApiError(error);
      expect(result).toBe('Request timed out. Please try again.');
    });

    it('handles unauthorized errors', () => {
      const error = new Error('401 unauthorized');
      const result = handleApiError(error);
      expect(result).toBe('Please log in to continue.');
    });

    it('handles forbidden errors', () => {
      const error = new Error('403 forbidden');
      const result = handleApiError(error);
      expect(result).toBe('You do not have permission to perform this action.');
    });

    it('handles not found errors', () => {
      const error = new Error('404 not found');
      const result = handleApiError(error);
      expect(result).toBe('The requested resource was not found.');
    });

    it('handles conflict errors', () => {
      const error = new Error('409 conflict');
      const result = handleApiError(error);
      expect(result).toBe('There is a conflict with the current state. Please refresh and try again.');
    });

    it('handles rate limit errors', () => {
      const error = new Error('429 rate limit exceeded');
      const result = handleApiError(error);
      expect(result).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('provides a default fallback message', () => {
      const error = new Error('Random error');
      const result = handleApiError(error, 'save data');
      expect(result).toBe('Failed to save data. Please try again.');
    });
  });

  describe('validateRequired', () => {
    it('returns the value if present', () => {
      expect(validateRequired('test', 'param')).toBe('test');
      expect(validateRequired(0, 'param')).toBe(0);
      expect(validateRequired(false, 'param')).toBe(false);
    });

    it('throws an error if missing', () => {
      expect(() => validateRequired(null, 'param')).toThrow("Required parameter 'param' is missing");
      expect(() => validateRequired(undefined, 'param')).toThrow("Required parameter 'param' is missing");
    });
  });

  describe('safeExecute', () => {
    it('returns the result of the function if successful', () => {
      const result = safeExecute(() => 'success', 'default');
      expect(result).toBe('success');
    });

    it('returns the default value and logs if function throws', () => {
      import.meta.env.DEV = true;
      const fn = () => { throw new Error('fail'); };
      const result = safeExecute(fn, 'default');
      expect(result).toBe('default');
      expect(log.error).toHaveBeenCalled();
    });
  });

  describe('withErrorHandling', () => {
    it('returns the result of the async function if successful', async () => {
      const fn = async () => 'success';
      const result = await withErrorHandling(fn, 'test action');
      expect(result).toBe('success');
    });

    it('returns the fallback value if provided and function throws', async () => {
      const fn = async () => { throw new Error('fail'); };
      const result = await withErrorHandling(fn, 'test action', 'fallback');
      expect(result).toBe('fallback');
    });

    it('throws a standardized AppError if no fallback provided', async () => {
      const fn = async () => { throw new Error('fail'); };
      await expect(withErrorHandling(fn, 'test action')).rejects.toThrow('fail');
      await expect(withErrorHandling(fn, 'test action')).rejects.toMatchObject({
        name: 'AppError',
        code: 'ASYNC_OPERATION_FAILED',
        severity: 'error'
      });
    });

    it('handles non-Error objects thrown', async () => {
      const fn = async () => { throw 'string error'; };
      await expect(withErrorHandling(fn, 'test action')).rejects.toThrow('Unknown error occurred');
    });
  });

  describe('getErrorBoundaryFallback', () => {
    it('handles network errors', () => {
      const error = new Error('Failed to fetch');
      const result = getErrorBoundaryFallback(error);
      expect(result).toEqual({
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        retryable: true,
      });
    });

    it('handles call stack errors', () => {
      const error = new Error('Maximum call stack size exceeded');
      const result = getErrorBoundaryFallback(error);
      expect(result).toEqual({
        title: 'Internal Error',
        message: 'An infinite loop was detected. Please refresh the page.',
        retryable: false,
      });
    });

    it('handles generic retryable errors', () => {
      const error = new Error('Generic issue');
      error.name = 'TimeoutError';
      const result = getErrorBoundaryFallback(error);
      expect(result).toEqual({
        title: 'Something Went Wrong',
        message: 'Generic issue',
        retryable: true,
      });
    });

    it('handles generic non-retryable errors', () => {
      const error = new Error('Unknown problem');
      const result = getErrorBoundaryFallback(error);
      expect(result).toEqual({
        title: 'Something Went Wrong',
        message: 'Unknown problem',
        retryable: false,
      });
    });
  });

  describe('isRetryableError', () => {
    it('returns true for fetch TypeError', () => {
      expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true);
    });

    it('returns true for specific error names', () => {
      const error = new Error();
      error.name = 'NetworkError';
      expect(isRetryableError(error)).toBe(true);
      error.name = 'TimeoutError';
      expect(isRetryableError(error)).toBe(true);
      error.name = 'AbortError';
      expect(isRetryableError(error)).toBe(true);
      error.name = 'QuotaExceededError';
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isRetryableError(new Error('Normal error'))).toBe(false);
      expect(isRetryableError(new TypeError('Other type error'))).toBe(false);
      expect(isRetryableError('string error')).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns successfully on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable error and succeeds', async () => {
      const error = new Error('timeout');
      error.name = 'TimeoutError';
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(fn, 3, 100);

      // Fast-forward past the delay
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('fails immediately on non-retryable error', async () => {
      const error = new Error('fatal error');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn)).rejects.toThrow('fatal error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('exhausts retries and throws last error', async () => {
      const error = new Error('timeout');
      error.name = 'TimeoutError';
      const fn = vi.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, 3, 100);

      // Fast-forward past all delays
      // Catch it so we don't cause an unhandled rejection warning while advancing timers
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('timeout');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('safeParseJSON', () => {
    it('parses valid JSON string correctly', () => {
      const json = '{"key":"value"}';
      const result = safeParseJSON(json, null);
      expect(result).toEqual({ key: 'value' });
    });

    it('returns fallback value when JSON is invalid', () => {
      const invalidJson = '{bad json}';
      const fallback = { fallback: true };
      const result = safeParseJSON(invalidJson, fallback);
      expect(result).toBe(fallback);
      expect(log.error).toHaveBeenCalled();
    });

    it('returns actual null as fallback value when parsing fails on "null" string representation of LLM outputs', () => {
      const malformedLLMOutput = '```json\n{bad json}\n```';
      // As per instructions, actual null must be used as fallback value, 'null' as fallback text is not applicable as param to safeParseJSON, only the actual fallback value.
      const result = safeParseJSON(malformedLLMOutput, null);
      expect(result).toBeNull();
      expect(log.error).toHaveBeenCalled();
    });
  });
});
