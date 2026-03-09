/**
 * Performance monitoring utilities
 * Tracks Web Vitals and custom performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

/**
 * Measure and log an async operation's performance
 */
export const measureOperation = async <T,>(
  name: string,
  operation: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    logPerformance(name, duration);
    
    // Warn about slow operations
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

/**
 * Measure a synchronous operation's performance
 */
export const measureSync = <T,>(
  name: string,
  operation: () => T
): T => {
  const start = performance.now();
  
  try {
    const result = operation();
    const duration = performance.now() - start;
    
    logPerformance(name, duration);
    
    if (duration > 100) {
      console.warn(`⚠️ Slow sync operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

/**
 * Log performance metric
 */
function logPerformance(name: string, duration: number) {
  const rating = getRating(duration);
  
  const metric: PerformanceMetric = {
    name,
    value: duration,
    rating,
    timestamp: Date.now(),
  };
  
  // Log to console in development
  if (import.meta.env.DEV) {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${name}: ${duration.toFixed(2)}ms (${rating})`);
  }
  
  // Send to analytics in production
  if (import.meta.env.PROD) {
    sendToAnalytics(metric);
  }
}

/**
 * Get performance rating based on duration
 */
function getRating(duration: number): 'good' | 'needs-improvement' | 'poor' {
  if (duration < 100) return 'good';
  if (duration < 300) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics service
 */
function sendToAnalytics(metric: PerformanceMetric) {
  // TODO: Integrate with your analytics service
  // Example: Plausible, Mixpanel, Google Analytics, etc.
  
  try {
    // For now, just store in sessionStorage for debugging
    const metrics = JSON.parse(sessionStorage.getItem('perf_metrics') || '[]');
    metrics.push(metric);
    
    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    sessionStorage.setItem('perf_metrics', JSON.stringify(metrics));
  } catch (error) {
    // Silently fail - don't break the app for analytics
    console.error('Failed to store performance metric:', error);
  }
}

/**
 * Get all stored performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetric[] {
  try {
    return JSON.parse(sessionStorage.getItem('perf_metrics') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored performance metrics
 */
export function clearPerformanceMetrics() {
  sessionStorage.removeItem('perf_metrics');
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  const metrics = getPerformanceMetrics();
  
  if (metrics.length === 0) {
    return null;
  }
  
  const summary = {
    total: metrics.length,
    good: metrics.filter(m => m.rating === 'good').length,
    needsImprovement: metrics.filter(m => m.rating === 'needs-improvement').length,
    poor: metrics.filter(m => m.rating === 'poor').length,
    averageDuration: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
    slowest: metrics.reduce((max, m) => m.value > max.value ? m : max, metrics[0]!),
  };
  
  return summary;
}

/**
 * Mark a custom performance point
 */
export function mark(name: string) {
  performance.mark(name);
}

/**
 * Measure between two marks
 */
export function measure(name: string, startMark: string, endMark: string) {
  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      logPerformance(name, measure.duration);
    }
  } catch (error) {
    console.error('Failed to measure performance:', error);
  }
}

/**
 * Initialize Web Vitals monitoring (requires web-vitals package)
 * Install: npm install web-vitals
 * 
 * Note: This function is optional and will gracefully fail if web-vitals is not installed
 */
export function initWebVitals() {
  if (import.meta.env.PROD) {
    // Dynamically import web-vitals to avoid bundling in development
    // @ts-ignore - web-vitals is optional
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }: any) => {
      onCLS((metric: any) => {
        console.log('CLS:', metric);
        sendToAnalytics({
          name: 'CLS',
          value: metric.value,
          rating: metric.rating as any,
          timestamp: Date.now(),
        });
      });
      
      onFID((metric: any) => {
        console.log('FID:', metric);
        sendToAnalytics({
          name: 'FID',
          value: metric.value,
          rating: metric.rating as any,
          timestamp: Date.now(),
        });
      });
      
      onFCP((metric: any) => {
        console.log('FCP:', metric);
        sendToAnalytics({
          name: 'FCP',
          value: metric.value,
          rating: metric.rating as any,
          timestamp: Date.now(),
        });
      });
      
      onLCP((metric: any) => {
        console.log('LCP:', metric);
        sendToAnalytics({
          name: 'LCP',
          value: metric.value,
          rating: metric.rating as any,
          timestamp: Date.now(),
        });
      });
      
      onTTFB((metric: any) => {
        console.log('TTFB:', metric);
        sendToAnalytics({
          name: 'TTFB',
          value: metric.value,
          rating: metric.rating as any,
          timestamp: Date.now(),
        });
      });
    }).catch(() => {
      // web-vitals not installed, skip silently
    });
  }
}
