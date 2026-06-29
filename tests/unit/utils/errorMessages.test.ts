import { describe, it, expect } from 'vitest';
import { getErrorDetails, getAIErrorMessage, ErrorCode } from '../../../utils/errorMessages';

describe('errorMessages', () => {
  describe('getErrorDetails', () => {
    it('categorizes quota exceeded errors', () => {
      const result = getErrorDetails(new Error('Local storage quota exceeded'));
      expect(result.code).toBe(ErrorCode.QUOTA_EXCEEDED);
      expect(result.recoverable).toBe(true);
    });

    it('categorizes network errors', () => {
      const result = getErrorDetails(new Error('Failed to fetch'));
      expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('handles string errors', () => {
      const result = getErrorDetails('Operation timed out');
      expect(result.code).toBe(ErrorCode.TIMEOUT);
    });

    it('returns UNKNOWN for unhandled errors', () => {
      const result = getErrorDetails(new Error('Something weird happened'));
      expect(result.code).toBe(ErrorCode.UNKNOWN);
      expect(result.recoverable).toBe(false);
    });

    it('categorizes memory errors', () => {
      const result = getErrorDetails(new Error('out of memory'));
      expect(result.code).toBe(ErrorCode.MEMORY_ERROR);
    });

    it('categorizes file too large errors', () => {
      const result = getErrorDetails(new Error('file is too large'));
      expect(result.code).toBe(ErrorCode.FILE_TOO_LARGE);
    });

    it('categorizes unsupported format errors', () => {
      const result = getErrorDetails(new Error('invalid format'));
      expect(result.code).toBe(ErrorCode.UNSUPPORTED_FORMAT);
    });

    it('categorizes invalid input errors', () => {
      const result = getErrorDetails(new Error('validation failed'));
      expect(result.code).toBe(ErrorCode.INVALID_INPUT);
    });

    it('categorizes permission denied errors', () => {
      const result = getErrorDetails(new Error('access blocked'));
      expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
    });
  });

  describe('getAIErrorMessage', () => {
    it('returns specific message for network errors', () => {
      const msg = getAIErrorMessage(new Error('Network error'));
      expect(msg).toContain('Network error. Check your connection');
    });

    it('returns specific message for timeouts', () => {
      const msg = getAIErrorMessage(new Error('timeout'));
      expect(msg).toContain('timed out');
    });

    it('returns specific message for quota exceeded', () => {
      const msg = getAIErrorMessage(new Error('quota exceeded'));
      expect(msg).toContain('limit reached');
    });

    it('returns generic message with suggestion for unknown errors', () => {
      const msg = getAIErrorMessage(new Error('Random AI failure'));
      expect(msg).toContain('AI generation failed: An unexpected error occurred');
      expect(msg).toContain('If the problem persists');
    });
  });
});
