/**
 * Enhanced error message utilities
 * Provides specific, actionable error messages for better UX
 */

export enum ErrorCode {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

interface ErrorDetails {
  code: ErrorCode;
  message: string;
  suggestion: string;
  recoverable: boolean;
}

/**
 * Parse error and return user-friendly message with actionable suggestions
 */
export function getErrorDetails(error: Error | unknown): ErrorDetails {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Quota/Size errors
  if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
    return {
      code: ErrorCode.QUOTA_EXCEEDED,
      message: 'Storage limit reached',
      suggestion: 'Try deleting old projects or reducing canvas size.',
      recoverable: true,
    };
  }

  if (errorMessage.includes('too large') || errorMessage.includes('size')) {
    return {
      code: ErrorCode.FILE_TOO_LARGE,
      message: 'File size too large',
      suggestion: 'Try reducing canvas size, quality, or use a different format.',
      recoverable: true,
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network connection error',
      suggestion: 'Check your internet connection and try again.',
      recoverable: true,
    };
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      code: ErrorCode.TIMEOUT,
      message: 'Operation timed out',
      suggestion: 'The operation took too long. Try again or reduce complexity.',
      recoverable: true,
    };
  }

  // Memory errors
  if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
    return {
      code: ErrorCode.MEMORY_ERROR,
      message: 'Not enough memory',
      suggestion: 'Try closing other tabs, reducing canvas size, or using fewer layers.',
      recoverable: true,
    };
  }

  // Permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('denied') || errorMessage.includes('blocked')) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      message: 'Permission denied',
      suggestion: 'Please grant the necessary permissions in your browser settings.',
      recoverable: true,
    };
  }

  // Format errors
  if (errorMessage.includes('format') || errorMessage.includes('unsupported') || errorMessage.includes('invalid')) {
    return {
      code: ErrorCode.UNSUPPORTED_FORMAT,
      message: 'Unsupported file format',
      suggestion: 'Try using PNG, JPEG, or WEBP format instead.',
      recoverable: true,
    };
  }

  // Input validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return {
      code: ErrorCode.INVALID_INPUT,
      message: 'Invalid input',
      suggestion: 'Please check your input and try again.',
      recoverable: true,
    };
  }

  // Unknown error
  return {
    code: ErrorCode.UNKNOWN,
    message: 'An unexpected error occurred',
    suggestion: 'Please try again. If the problem persists, contact support.',
    recoverable: false,
  };
}

/**
 * Get error message for AI generation operations
 */
export function getAIErrorMessage(error: Error | unknown): string {
  const details = getErrorDetails(error);

  if (details.code === ErrorCode.NETWORK_ERROR) {
    return 'AI generation failed: Network error. Check your connection and try again.';
  }

  if (details.code === ErrorCode.TIMEOUT) {
    return 'AI generation timed out. Try a simpler prompt or try again later.';
  }

  if (details.code === ErrorCode.QUOTA_EXCEEDED) {
    return 'AI generation limit reached. Please upgrade your plan or try again later.';
  }

  return `AI generation failed: ${details.message}. ${details.suggestion}`;
}
