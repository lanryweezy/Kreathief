import { describe, it, expect } from 'vitest';
import { ErrorCode, getErrorDetails, getAIErrorMessage } from '../../../utils/errorMessages';

describe('getErrorDetails', () => {
  it('returns QUOTA_EXCEEDED when the error message mentions quota', () => {
    const error = new Error('Storage quota exceeded');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.QUOTA_EXCEEDED);
    expect(result.message).toBe('Storage limit reached');
    expect(result.recoverable).toBe(true);
  });

  it('returns FILE_TOO_LARGE when the error message mentions size', () => {
    const error = new Error('File size is too big');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.FILE_TOO_LARGE);
    expect(result.message).toBe('File size too large');
    expect(result.recoverable).toBe(true);
  });

  it('returns NETWORK_ERROR when the error message mentions fetch', () => {
    const error = new Error('Failed to fetch resource');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(result.message).toBe('Network connection error');
    expect(result.recoverable).toBe(true);
  });

  it('returns TIMEOUT when the error message mentions timeout', () => {
    const error = new Error('Operation timed out');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.TIMEOUT);
    expect(result.message).toBe('Operation timed out');
    expect(result.recoverable).toBe(true);
  });

  it('returns MEMORY_ERROR when the error message mentions heap', () => {
    const error = new Error('Out of heap memory');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.MEMORY_ERROR);
    expect(result.message).toBe('Not enough memory');
    expect(result.recoverable).toBe(true);
  });

  it('returns PERMISSION_DENIED when the error message mentions blocked', () => {
    const error = new Error('Access blocked by CORS');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
    expect(result.message).toBe('Permission denied');
    expect(result.recoverable).toBe(true);
  });

  it('returns UNSUPPORTED_FORMAT when the error message mentions format', () => {
    const error = new Error('Unsupported image format');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.UNSUPPORTED_FORMAT);
    expect(result.message).toBe('Unsupported file format');
    expect(result.recoverable).toBe(true);
  });

  it('returns INVALID_INPUT when the error message mentions validation', () => {
    const error = new Error('Input validation failed');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.INVALID_INPUT);
    expect(result.message).toBe('Invalid input');
    expect(result.recoverable).toBe(true);
  });

  it('returns UNKNOWN when the error message does not match any known patterns', () => {
    const error = new Error('Something completely unexpected happened');
    const result = getErrorDetails(error);

    expect(result.code).toBe(ErrorCode.UNKNOWN);
    expect(result.message).toBe('An unexpected error occurred');
    expect(result.recoverable).toBe(false);
  });

  it('handles string inputs instead of Error objects', () => {
    const result = getErrorDetails('network connection lost');

    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(result.message).toBe('Network connection error');
    expect(result.recoverable).toBe(true);
  });

  it('handles unknown input types gracefully', () => {
    const result = getErrorDetails({ some: 'object' });

    expect(result.code).toBe(ErrorCode.UNKNOWN);
    expect(result.recoverable).toBe(false);
  });
});

describe('getAIErrorMessage', () => {
  it('returns a specific AI network error message when a network error occurs', () => {
    const result = getAIErrorMessage(new Error('fetch failed'));
    expect(result).toBe('AI generation failed: Network error. Check your connection and try again.');
  });

  it('returns a specific AI timeout message when a timeout occurs', () => {
    const result = getAIErrorMessage(new Error('timed out'));
    expect(result).toBe('AI generation timed out. Try a simpler prompt or try again later.');
  });

  it('returns a specific AI quota message when the quota is exceeded', () => {
    const result = getAIErrorMessage(new Error('quota exceeded'));
    expect(result).toBe('AI generation limit reached. Please upgrade your plan or try again later.');
  });

  it('combines the generic error details message and suggestion for other error types', () => {
    const result = getAIErrorMessage(new Error('validation error'));
    expect(result).toBe('AI generation failed: Invalid input. Please check your input and try again.');
  });
});