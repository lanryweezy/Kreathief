# Critical Fixes Implementation Guide

## Overview
This guide provides step-by-step implementation for the 5 most critical issues that must be fixed immediately.

---

## CRITICAL FIX #1: API Key Security

### Problem
API keys are exposed in client-side code and environment variables, creating security vulnerabilities.

### Current Implementation (INSECURE)
```typescript
// vite.config.ts - EXPOSED
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || '')
}

// services/geminiService.ts - EXPOSED
const getClient = () => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
  return new GoogleGenerativeAI(apiKey);
};
```

### Solution: Server-Side Proxy

#### Step 1: Create Backend Proxy Endpoints
```typescript
// backend/routes/api.ts (Node.js/Express example)
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting middleware
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/api/generate-image', limiter, async (req, res) => {
  try {
    const { prompt, aspectRatio, quality } = req.body;
    
    // Validate input
    if (!prompt || prompt.length > 1000) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }
    
    const model = ai.getGenerativeModel({ 
      model: quality === 'hd' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
    });
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { imageConfig: { aspectRatio } }
    });
    
    const imageData = extractImageFromResponse(response);
    res.json({ imageData });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

export default router;
```

#### Step 2: Update Client Service
```typescript
// services/geminiService.ts - SECURE
export const generateImage = async (
  prompt: string,
  aspectRatio: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio, quality })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const { imageData } = await response.json();
    return imageData;
  } catch (error) {
    console.error("Generation Error:", error);
    throw new Error('Failed to generate image. Please try again.');
  }
};
```

#### Step 3: Update Environment Configuration
```bash
# .env.local - NEVER commit this
VITE_API_BASE_URL=http://localhost:3001
VITE_API_TIMEOUT=30000

# backend/.env - NEVER commit this
GEMINI_API_KEY=your_actual_key_here
NODE_ENV=development
PORT=3001
```

#### Step 4: Update Vite Config
```typescript
// vite.config.ts - SECURE
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:3001'),
      'process.env.API_TIMEOUT': JSON.stringify(env.VITE_API_TIMEOUT || '30000')
    }
  };
});
```

---

## CRITICAL FIX #2: Comprehensive Error Handling

### Problem
Missing error handling causes app crashes and poor user experience.

### Solution: Error Handling Framework

#### Step 1: Create Error Types
```typescript
// services/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public userMessage: string = message,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // API Errors
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_INVALID_INPUT: 'API_INVALID_INPUT',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  
  // Storage Errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_CORRUPTED: 'STORAGE_CORRUPTED',
  
  // Validation Errors
  INVALID_PROJECT_NAME: 'INVALID_PROJECT_NAME',
  INVALID_CANVAS_SIZE: 'INVALID_CANVAS_SIZE',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export const ErrorMessages: Record<string, { user: string; retry: boolean }> = {
  [ErrorCodes.API_TIMEOUT]: {
    user: 'Request timed out. Please check your connection and try again.',
    retry: true
  },
  [ErrorCodes.API_RATE_LIMIT]: {
    user: 'Too many requests. Please wait a moment and try again.',
    retry: true
  },
  [ErrorCodes.API_INVALID_INPUT]: {
    user: 'Invalid input. Please check your data and try again.',
    retry: false
  },
  [ErrorCodes.STORAGE_QUOTA_EXCEEDED]: {
    user: 'Storage quota exceeded. Please delete some projects.',
    retry: false
  }
};
```

#### Step 2: Create Error Handler Hook
```typescript
// hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { AppError, ErrorCodes, ErrorMessages } from '../services/errors';
import { logger } from '../services/logger';

export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown, context?: string) => {
    let appError: AppError;
    
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        ErrorCodes.UNKNOWN_ERROR,
        error.message,
        500,
        'An unexpected error occurred. Please try again.'
      );
    } else {
      appError = new AppError(
        ErrorCodes.UNKNOWN_ERROR,
        String(error),
        500,
        'An unexpected error occurred. Please try again.'
      );
    }
    
    // Log error
    logger.error(`${context || 'Error'}:`, {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode
    });
    
    return appError;
  }, []);
  
  return { handleError };
};
```

#### Step 3: Update Services with Error Handling
```typescript
// services/geminiService.ts - WITH ERROR HANDLING
export const generateImage = async (
  prompt: string,
  aspectRatio: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  try {
    if (!prompt || prompt.length === 0) {
      throw new AppError(
        ErrorCodes.API_INVALID_INPUT,
        'Prompt cannot be empty',
        400,
        'Please enter a description for your image'
      );
    }
    
    if (prompt.length > 1000) {
      throw new AppError(
        ErrorCodes.API_INVALID_INPUT,
        'Prompt too long',
        400,
        'Description must be less than 1000 characters'
      );
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio, quality }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new AppError(
            ErrorCodes.API_RATE_LIMIT,
            'Rate limited',
            429,
            'Too many requests. Please wait a moment.',
            true
          );
        }
        
        const error = await response.json().catch(() => ({}));
        throw new AppError(
          ErrorCodes.API_SERVER_ERROR,
          error.message || 'API error',
          response.status,
          'Failed to generate image. Please try again.'
        );
      }
      
      const { imageData } = await response.json();
      return imageData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AppError) throw error;
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new AppError(
          ErrorCodes.API_TIMEOUT,
          'Network error',
          0,
          'Network error. Please check your connection.',
          true
        );
      }
      
      throw error;
    }
  } catch (error) {
    logger.error('Image generation failed:', { error });
    throw error;
  }
};
```

#### Step 4: Create Error UI Component
```typescript
// components/ErrorNotification.tsx
import React from 'react';
import { AppError } from '../services/errors';
import { Icons } from '../constants';

interface ErrorNotificationProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onRetry,
  onDismiss
}) => {
  return (
    <div className="fixed bottom-4 right-4 bg-red-900 border border-red-700 rounded-lg p-4 max-w-md shadow-lg z-50">
      <div className="flex items-start gap-3">
        <Icons.AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">Error</h3>
          <p className="text-sm text-red-100 mb-3">{error.userMessage}</p>
          <div className="flex gap-2">
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### Step 5: Use in Components
```typescript
// components/Editor.tsx - UPDATED
const [error, setError] = useState<AppError | null>(null);
const { handleError } = useErrorHandler();

const handleGenerateImage = async () => {
  setIsProcessing(true);
  try {
    const image = await geminiService.generateImage(prompt, aspectRatio, quality);
    setHistory(prev => [...prev, { ...image, id: `img_${Date.now()}` }]);
  } catch (err) {
    const appError = handleError(err, 'Image generation');
    setError(appError);
  } finally {
    setIsProcessing(false);
  }
};

return (
  <>
    {/* ... existing UI ... */}
    {error && (
      <ErrorNotification
        error={error}
        onRetry={error.retryable ? handleGenerateImage : undefined}
        onDismiss={() => setError(null)}
      />
    )}
  </>
);
```

---

## CRITICAL FIX #3: Memory Leak Prevention

### Problem
Event listeners not properly cleaned up, causing memory accumulation.

### Solution: Proper Cleanup

#### Step 1: Fix useKeyboardShortcuts
```typescript
// hooks/useKeyboardShortcuts.ts - FIXED
export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        for (const shortcut of shortcuts) {
            const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatches = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
            const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatches = shortcut.alt ? event.altKey : !event.altKey;

            if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                if (shortcut.preventDefault !== false) {
                    event.preventDefault();
                }
                shortcut.action();
                break;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        if (!enabled) return; // Don't add listener if disabled
        
        window.addEventListener('keydown', handleKeyDown);
        
        // PROPER CLEANUP
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, enabled]); // Include enabled in deps
};
```

#### Step 2: Fix useSwipeGestures
```typescript
// hooks/useSwipeGestures.ts - FIXED
export function useSwipeGestures(
    elementRef: React.RefObject<HTMLElement>,
    options: SwipeGestureOptions
) {
    const {
        threshold = 50,
        timeout = 300,
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
    } = options;

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!touchStartRef.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartRef.current.time;

        if (deltaTime > timeout) {
            touchStartRef.current = null;
            return;
        }

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY && absX > threshold) {
            if (deltaX > 0) {
                onSwipeRight?.();
            } else {
                onSwipeLeft?.();
            }
        } else if (absY > absX && absY > threshold) {
            if (deltaY > 0) {
                onSwipeDown?.();
            } else {
                onSwipeUp?.();
            }
        }

        touchStartRef.current = null;
    }, [threshold, timeout, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        // PROPER CLEANUP
        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [elementRef, handleTouchStart, handleTouchEnd]);
}
```

#### Step 3: Create Memory Leak Detection Hook
```typescript
// hooks/useMemoryMonitor.ts
import { useEffect } from 'react';
import { logger } from '../services/logger';

export const useMemoryMonitor = (componentName: string) => {
  useEffect(() => {
    if (!('memory' in performance)) return;
    
    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      const limitMB = memory.jsHeapSizeLimit / 1048576;
      const percentage = (usedMB / limitMB) * 100;
      
      if (percentage > 90) {
        logger.warn(`High memory usage in ${componentName}`, {
          usedMB: usedMB.toFixed(2),
          limitMB: limitMB.toFixed(2),
          percentage: percentage.toFixed(1)
        });
      }
    };
    
    const interval = setInterval(checkMemory, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, [componentName]);
};
```

---

## CRITICAL FIX #4: Input Validation

### Problem
No validation of user inputs, leading to XSS and data corruption.

### Solution: Validation Framework

#### Step 1: Create Validation Utilities
```typescript
// utils/validation.ts
export const validateProjectName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' };
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Project name must be less than 100 characters' };
  }
  
  // Prevent XSS
  if (/<[^>]*>/g.test(name)) {
    return { valid: false, error: 'Project name cannot contain HTML' };
  }
  
  return { valid: true };
};

export const validateCanvasSize = (width: number, height: number): { valid: boolean; error?: string } => {
  const MIN_SIZE = 100;
  const MAX_SIZE = 10000;
  
  if (width < MIN_SIZE || width > MAX_SIZE) {
    return { valid: false, error: `Width must be between ${MIN_SIZE} and ${MAX_SIZE}` };
  }
  
  if (height < MIN_SIZE || height > MAX_SIZE) {
    return { valid: false, error: `Height must be between ${MIN_SIZE} and ${MAX_SIZE}` };
  }
  
  return { valid: true };
};

export const validateColor = (color: string): { valid: boolean; error?: string } => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  
  if (!hexRegex.test(color) && !rgbRegex.test(color)) {
    return { valid: false, error: 'Invalid color format' };
  }
  
  return { valid: true };
};

export const validateFontSize = (size: number): { valid: boolean; error?: string } => {
  const MIN_SIZE = 8;
  const MAX_SIZE = 200;
  
  if (size < MIN_SIZE || size > MAX_SIZE) {
    return { valid: false, error: `Font size must be between ${MIN_SIZE} and ${MAX_SIZE}` };
  }
  
  return { valid: true };
};

export const sanitizeText = (text: string): string => {
  // Remove HTML tags
  return text.replace(/<[^>]*>/g, '');
};
```

#### Step 2: Use Validation in Components
```typescript
// components/Editor.tsx - UPDATED
const handleUpdateProjectTitle = (newTitle: string) => {
  const validation = validateProjectName(newTitle);
  
  if (!validation.valid) {
    setError(new AppError(
      ErrorCodes.INVALID_PROJECT_NAME,
      validation.error || 'Invalid project name',
      400,
      validation.error
    ));
    return;
  }
  
  setProjectTitle(newTitle);
};

const handleAddText = (style: Partial<TextLayer>) => {
  const fontSizeValidation = validateFontSize(style.fontSize || 24);
  if (!fontSizeValidation.valid) {
    setError(new AppError(
      ErrorCodes.INVALID_INPUT,
      fontSizeValidation.error || 'Invalid font size',
      400,
      fontSizeValidation.error
    ));
    return;
  }
  
  const colorValidation = validateColor(style.color || '#000000');
  if (!colorValidation.valid) {
    setError(new AppError(
      ErrorCodes.INVALID_INPUT,
      colorValidation.error || 'Invalid color',
      400,
      colorValidation.error
    ));
    return;
  }
  
  // Sanitize text
  const sanitizedText = sanitizeText(style.text || 'New Text');
  
  // ... rest of function
};
```

---

## CRITICAL FIX #5: Enhanced Error Boundaries

### Problem
Error boundaries only catch render errors, not event handlers or async errors.

### Solution: Comprehensive Error Boundary

#### Step 1: Create Enhanced Error Boundary
```typescript
// components/ErrorBoundary.tsx - ENHANCED
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { logger } from '../services/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
    variant?: 'full' | 'widget';
    onReset?: () => void;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
    private resetTimeout: NodeJS.Timeout | null = null;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorCount: 0 };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const { errorCount } = this.state;
        const newCount = errorCount + 1;
        
        this.setState({ errorCount: newCount });
        
        // Log error with context
        logger.error(`ErrorBoundary caught error in ${this.props.componentName || 'Unknown Component'}`, {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorCount: newCount
        });
        
        // Call custom error handler
        this.props.onError?.(error, errorInfo);
        
        // Auto-reset after 5 errors (prevent infinite loops)
        if (newCount >= 5) {
            logger.error('Too many errors, auto-resetting', { errorCount: newCount });
            this.resetErrorBoundary();
        }
    }

    resetErrorBoundary = () => {
        if (this.resetTimeout) clearTimeout(this.resetTimeout);
        
        this.props.onReset?.();
        this.setState({ hasError: false, error: null, errorCount: 0 });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    resetErrorBoundary={this.resetErrorBoundary}
                    variant={this.props.variant}
                    errorCount={this.state.errorCount}
                />
            );
        }

        return this.props.children;
    }
}

// HOC with error boundary
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode,
    componentName?: string
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback} componentName={componentName}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
```

#### Step 2: Create Global Error Handler
```typescript
// services/globalErrorHandler.ts
import { logger } from './logger';
import { AppError } from './errors';

export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
      promise: event.promise
    });
    
    // Prevent default browser behavior
    event.preventDefault();
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    logger.error('Global error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
};
```

#### Step 3: Initialize in App
```typescript
// App.tsx - UPDATED
import { setupGlobalErrorHandlers } from './services/globalErrorHandler';

useEffect(() => {
  setupGlobalErrorHandlers();
}, []);
```

---

## Testing the Fixes

### Test Error Handling
```typescript
// __tests__/errorHandling.test.ts
import { describe, it, expect } from 'vitest';
import { AppError, ErrorCodes } from '../services/errors';

describe('Error Handling', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError(
      ErrorCodes.API_TIMEOUT,
      'Request timed out',
      408,
      'Your request took too long',
      true
    );
    
    expect(error.code).toBe(ErrorCodes.API_TIMEOUT);
    expect(error.retryable).toBe(true);
  });
});
```

### Test Input Validation
```typescript
// __tests__/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateProjectName, validateCanvasSize } from '../utils/validation';

describe('Input Validation', () => {
  it('should reject empty project names', () => {
    const result = validateProjectName('');
    expect(result.valid).toBe(false);
  });
  
  it('should reject HTML in project names', () => {
    const result = validateProjectName('<script>alert("xss")</script>');
    expect(result.valid).toBe(false);
  });
  
  it('should validate canvas size', () => {
    const result = validateCanvasSize(1080, 1080);
    expect(result.valid).toBe(true);
  });
});
```

---

## Deployment Checklist

- [ ] API keys moved to backend
- [ ] Error handling implemented in all services
- [ ] Memory leaks fixed in hooks
- [ ] Input validation added
- [ ] Error boundaries enhanced
- [ ] Global error handlers set up
- [ ] Tests passing
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] Security headers added

---

## Monitoring & Maintenance

1. Monitor error logs daily
2. Track error frequency and patterns
3. Set up alerts for critical errors
4. Review and update error messages based on user feedback
5. Regularly audit for new security vulnerabilities
