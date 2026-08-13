/**
 * Error Handling Utilities
 * Centralized error handling with proper logging and user feedback
 */

import * as Sentry from '@sentry/react';
import { log } from './log';

type ErrorContext = {
  component?: string;
  action?: string;
  userId?: string;
  projectId?: string;
  [key: string]: any;
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
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(appError, { extra: context });
    } else {
      // Fallback to basic logging endpoint if Sentry is not configured
      try {
        navigator.sendBeacon('/api/error-log', JSON.stringify(errorInfo));
      } catch (e) {
        // Fallback failed, error is lost
        log.error('[Error Logging Failed]', e);
      }
    }
  }
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

/**
 * Safely parses a JSON string, returning a fallback value if parsing fails.
 * Useful for handling raw LLM outputs which may occasionally be malformed.
 */
export const safeParseJSON = <T>(text: string, fallback: T): T => {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    logError(error, { action: 'parse JSON output', text: text.substring(0, 100) });
    return fallback;
  }
};
