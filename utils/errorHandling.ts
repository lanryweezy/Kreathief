/**
 * Error Handling Utilities
 * Centralized error handling with proper logging and user feedback
 */

import { log } from './log';

type ErrorContext = {
  component?: string;
  action?: string;
  userId?: string;
  projectId?: string;
  [key: string]: any;
};

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface AppError extends Error {
  code?: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
  timestamp: number;
}

/**
 * Creates a standardized error object
 */
export const createError = (
  message: string,
  code?: string,
  severity: ErrorSeverity = 'error',
  context?: ErrorContext
): AppError => {
  const error: AppError = {
    message,
    code,
    severity,
    context,
    timestamp: Date.now(),
    name: 'AppError',
  };

  return Object.assign(new Error(message), error);
};

/**
 * Logs an error with context information
 */
export const logError = (error: unknown, context: ErrorContext = {}): void => {
  const appError = error instanceof Error ? error : new Error(String(error));

  const errorInfo = {
    message: appError.message,
    stack: appError.stack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Always log to console in development
  if (import.meta.env.DEV) {
    log.error('[App Error]', errorInfo);
  }

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // TODO: Integrate with Sentry, LogRocket, or similar
    // Sentry.captureException(appError, { extra: context });

    // For now, log to a service endpoint
    try {
      navigator.sendBeacon('/api/error-log', JSON.stringify(errorInfo));
    } catch (e) {
      // Fallback failed, error is lost
      log.error('[Error Logging Failed]', e);
    }
  }
};

/**
 * Handles API errors with proper user messaging
 */
export const handleApiError = (error: unknown, action: string = 'perform this action'): string => {
  logError(error, { action });

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return 'Please log in to continue.';
    }
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('conflict') || error.message.includes('409')) {
      return 'There is a conflict with the current state. Please refresh and try again.';
    }
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
  }

  return `Failed to ${action}. Please try again.`;
};

/**
 * Validates required parameters and throws if missing
 */
export const validateRequired = <T>(value: T | null | undefined, paramName: string): T => {
  if (value === null || value === undefined) {
    const error = createError(`Required parameter '${paramName}' is missing`, 'MISSING_PARAMETER', 'warning');
    logError(error, { paramName });
    throw error;
  }
  return value;
};

/**
 * Safely executes a function and returns a default value on error
 */
export const safeExecute = <T>(fn: () => T, defaultValue: T, errorMessage?: string): T => {
  try {
    return fn();
  } catch (error) {
    logError(error, { action: errorMessage || 'execute function' });
    return defaultValue;
  }
};

/**
 * Async error handler wrapper
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  action: string,
  fallbackValue?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    logError(error, { action });

    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    throw createError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'ASYNC_OPERATION_FAILED',
      'error',
      { action }
    );
  }
};

/**
 * Error boundary helper for React components
 */
export const getErrorBoundaryFallback = (
  error: Error,
  componentStack?: string
): { title: string; message: string; retryable: boolean } => {
  logError(error, {
    component: 'ErrorBoundary',
    componentStack,
  });

  const retryableErrors = ['NetworkError', 'TimeoutError', 'QuotaExceededError'];

  const isRetryable = retryableErrors.some((name) => error.name === name || error.message.includes(name.toLowerCase()));

  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection.',
      retryable: true,
    };
  }

  if (error.message.includes('Maximum call stack')) {
    return {
      title: 'Internal Error',
      message: 'An infinite loop was detected. Please refresh the page.',
      retryable: false,
    };
  }

  return {
    title: 'Something Went Wrong',
    message: error.message || 'An unexpected error occurred',
    retryable: isRetryable,
  };
};

/**
 * Checks if an error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  if (error instanceof Error) {
    return ['NetworkError', 'TimeoutError', 'AbortError', 'QuotaExceededError'].includes(error.name);
  }

  return false;
};

/**
 * Retry utility with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
