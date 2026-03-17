/**
 * Logger Utility Wrapper
 * Drop-in replacement for console.log with structured logging
 * 
 * @example
 * // Instead of:
 * console.log('User logged in', user);
 * 
 * // Use:
 * log.info('User logged in', { user });
 * log.error('Failed to save', error, { projectId });
 */

import { logger } from '../services/logger';

/**
 * Logging utilities for different scenarios
 */
export const log = {
  /**
   * Debug level logging - only shown in development
   */
  debug: (message: string, context?: Record<string, unknown>) => {
    logger.debug(message, context);
  },

  /**
   * Info level logging - general informational messages
   */
  info: (message: string, context?: Record<string, unknown>) => {
    logger.info(message, context);
  },

  /**
   * Warning level logging - something unexpected happened
   */
  warn: (message: string, context?: Record<string, unknown>) => {
    logger.warn(message, context);
  },

  /**
   * Error level logging - something went wrong
   */
  error: (
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ) => {
    if (error instanceof Error) {
      logger.logError(error, context);
    } else {
      logger.error(message, { error, ...context });
    }
  },

  /**
   * Performance timing - measure how long operations take
   * 
   * @example
   * const end = log.timer('fetchData');
   * await fetchData();
   * end(); // Logs: "fetchData completed" with duration
   */
  timer: (label: string) => {
    return logger.time(label);
  },

  /**
   * Track user actions for analytics/debugging
   */
  action: (actionName: string, details?: Record<string, unknown>) => {
    logger.action(actionName, details);
  },

  /**
   * Group related logs together
   */
  group: (label: string, callback: () => void) => {
    logger.info(`[${label}] Starting...`);
    try {
      callback();
      logger.info(`[${label}] Completed`);
    } catch (error) {
      logger.error(`[${label}] Failed`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },
};

/**
 * Higher-order function to automatically log function execution
 * 
 * @example
 * const loggedFunction = log.wrap('myFunction', async (x, y) => {
 *   return x + y;
 * });
 */
export function wrap<T extends (...args: any[]) => any>(
  label: string,
  fn: T
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    logger.debug(`[${label}] Called`, { args: args.slice(0, 3) }); // Log first 3 args max
    const start = performance.now();
    
    try {
      const result = fn(...args);
      const duration = performance.now() - start;
      logger.debug(`[${label}] Completed`, { durationMs: duration.toFixed(2) });
      return result as ReturnType<T>;
    } catch (error) {
      logger.error(`[${label}] Failed`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }) as T;
}

/**
 * Async function wrapper with automatic logging
 * 
 * @example
 * const loggedAsync = log.wrapAsync('fetchData', async (id) => {
 *   return await fetch(`/api/data/${id}`);
 * });
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  label: string,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    logger.debug(`[${label}] Called`, { args: args.slice(0, 3) });
    const start = performance.now();

    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      logger.debug(`[${label}] Completed`, { durationMs: duration.toFixed(2) });
      return result as ReturnType<T>;
    } catch (error) {
      logger.error(`[${label}] Failed`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }) as T;
}
