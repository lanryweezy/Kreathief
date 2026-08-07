import { describe, it, expect } from 'vitest';
import { getErrorDetails, getAIErrorMessage, ErrorCode } from '../../utils/errorMessages';

describe('errorMessages', () => {
  describe('getErrorDetails', () => {
    it('handles Error objects and extracts lowercase message', () => {
      const error = new Error('Some UNKNOWN Error');
      const details = getErrorDetails(error);
      expect(details.code).toBe(ErrorCode.UNKNOWN);
      expect(details.message).toBe('An unexpected error occurred');
      expect(details.suggestion).toBe('Please try again. If the problem persists, contact support.');
      expect(details.recoverable).toBe(false);
    });

    it('handles string errors', () => {
      const details = getErrorDetails('some unknown error');
      expect(details.code).toBe(ErrorCode.UNKNOWN);
    });

    it('handles non-string, non-error objects gracefully', () => {
      const details = getErrorDetails({ foo: 'bar' });
      expect(details.code).toBe(ErrorCode.UNKNOWN);
    });

    it('returns QUOTA_EXCEEDED for quota/storage errors', () => {
      expect(getErrorDetails(new Error('Quota exceeded')).code).toBe(ErrorCode.QUOTA_EXCEEDED);
      expect(getErrorDetails('out of storage').code).toBe(ErrorCode.QUOTA_EXCEEDED);
    });

    it('returns FILE_TOO_LARGE for size errors', () => {
      expect(getErrorDetails(new Error('File is too large')).code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(getErrorDetails('exceeds max size').code).toBe(ErrorCode.FILE_TOO_LARGE);
    });

    it('returns NETWORK_ERROR for network errors', () => {
      expect(getErrorDetails(new Error('Network failure')).code).toBe(ErrorCode.NETWORK_ERROR);
      expect(getErrorDetails('fetch failed').code).toBe(ErrorCode.NETWORK_ERROR);
      expect(getErrorDetails('connection reset').code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('returns TIMEOUT for timeout errors', () => {
      expect(getErrorDetails(new Error('Operation timeout')).code).toBe(ErrorCode.TIMEOUT);
      expect(getErrorDetails('request timed out').code).toBe(ErrorCode.TIMEOUT);
    });

    it('returns MEMORY_ERROR for memory errors', () => {
      expect(getErrorDetails(new Error('Out of memory')).code).toBe(ErrorCode.MEMORY_ERROR);
      expect(getErrorDetails('heap exhausted').code).toBe(ErrorCode.MEMORY_ERROR);
    });

    it('returns PERMISSION_DENIED for permission errors', () => {
      expect(getErrorDetails(new Error('Permission denied')).code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(getErrorDetails('access blocked').code).toBe(ErrorCode.PERMISSION_DENIED);
    });

    it('returns UNSUPPORTED_FORMAT for format errors', () => {
      expect(getErrorDetails(new Error('Unsupported format')).code).toBe(ErrorCode.UNSUPPORTED_FORMAT);
    });

    it('returns INVALID_INPUT for validation errors', () => {
      expect(getErrorDetails(new Error('Invalid arguments')).code).toBe(ErrorCode.INVALID_INPUT);
      expect(getErrorDetails('failed validation').code).toBe(ErrorCode.INVALID_INPUT);
    });

    it('returns RATE_LIMIT for rate limit errors', () => {
      expect(getErrorDetails(new Error('API returned 429')).code).toBe(ErrorCode.RATE_LIMIT);
      expect(getErrorDetails('too many requests').code).toBe(ErrorCode.RATE_LIMIT);
      expect(getErrorDetails('rate limit exceeded').code).toBe(ErrorCode.RATE_LIMIT);
    });

    it('returns CONTENT_POLICY for safety errors', () => {
      expect(getErrorDetails(new Error('safety violation')).code).toBe(ErrorCode.CONTENT_POLICY);
      expect(getErrorDetails('content policy violation').code).toBe(ErrorCode.CONTENT_POLICY);
      expect(getErrorDetails('nsfw content detected').code).toBe(ErrorCode.CONTENT_POLICY);
    });
  });

  describe('getAIErrorMessage', () => {
    it('returns custom message for NETWORK_ERROR', () => {
      expect(getAIErrorMessage(new Error('network error'))).toBe(
        'AI generation failed: Network error. Check your connection and try again.'
      );
    });

    it('returns custom message for TIMEOUT', () => {
      expect(getAIErrorMessage(new Error('timeout'))).toBe(
        'AI generation timed out. Try a simpler prompt or try again later.'
      );
    });

    it('returns custom message for QUOTA_EXCEEDED', () => {
      expect(getAIErrorMessage(new Error('quota exceeded'))).toBe(
        'AI generation limit reached. Please upgrade your plan or try again later.'
      );
    });

    it('returns custom message for RATE_LIMIT', () => {
      expect(getAIErrorMessage(new Error('too many requests'))).toBe(
        'AI generation failed: Too many requests. Please wait a moment and try again.'
      );
    });

    it('returns custom message for CONTENT_POLICY', () => {
      expect(getAIErrorMessage(new Error('safety policy violation'))).toBe(
        'AI generation blocked: Your prompt or image triggered the safety filter. Please modify it and try again.'
      );
    });

    it('returns fallback message for other errors', () => {
      expect(getAIErrorMessage(new Error('invalid parameters'))).toBe(
        'AI generation failed: Invalid input. Please check your input and try again.'
      );

      expect(getAIErrorMessage(new Error('something unknown'))).toBe(
        'AI generation failed: An unexpected error occurred. Please try again. If the problem persists, contact support.'
      );
    });
  });
});
