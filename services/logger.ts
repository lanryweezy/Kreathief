/**
 * Enhanced Logging Service
 * Provides structured logging with levels, context, and optional remote reporting
 * 
 * @example
 * logger.info('User logged in', { userId: '123' });
 * logger.error('API failed', error, { endpoint: '/users' });
 * const end = logger.time('operation');
 * // ... do work ...
 * end(); // Logs duration
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
  source?: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enableStackTrace: boolean;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig = {
    minLevel: 'info',
    enableConsole: true,
    enableRemote: false,
    enableStackTrace: true,
    prefix: '[Kreathief]',
  };

  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const time = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    return `[${time}] ${level} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      stack: level === 'error' ? new Error().stack : undefined,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output
    if (this.config.enableConsole) {
      const formatted = this.formatMessage(entry);
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';

      switch (level) {
        case 'debug':
          console.debug(formatted + contextStr);
          break;
        case 'info':
          console.info(formatted + contextStr);
          break;
        case 'warn':
          console.warn(formatted + contextStr);
          break;
        case 'error':
          console.error(formatted + contextStr);
          if (entry.stack) {
            console.error(entry.stack);
          }
          break;
      }
    }

    // Remote reporting (for production)
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  private async sendToRemote(entry: LogEntry) {
    try {
      await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      // Silently fail - don't recurse
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  // Log an error object with stack trace
  logError(error: Error, context?: Record<string, unknown>) {
    this.log('error', error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    });
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Performance timing helper
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { durationMs: duration.toFixed(2) });
    };
  }

  // Track user actions for debugging
  action(actionName: string, details?: Record<string, unknown>) {
    this.info(`User action: ${actionName}`, details);
  }
}

// Singleton instance
export const logger = new Logger();

// Configure for development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  logger.configure({ minLevel: 'debug', enableConsole: true });
}
