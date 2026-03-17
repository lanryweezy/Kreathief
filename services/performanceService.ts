/**
 * Performance Service
 * Tracks Web Vitals and other performance metrics
 */

export const performanceService = {
  /**
   * Initialize performance tracking
   */
  init: () => {
    if (typeof window === 'undefined') {return;}

    // Track Web Vitals (simulation)
    // performanceService.reportWebVitals(); // Temporarily disabled for QA subagent stability
    
    // Log initial load time
    const loadTime = window.performance.now();
    performanceService.logMetric('initial_load', loadTime);
    
    console.log('[PerformanceService] Initialized', { loadTime });
  },

  /**
   * Log a specific metric
   */
  logMetric: (name: string, value: number, extra?: any) => {
    // In a real app, this would send to Sentry, Google Analytics, or a custom ELK stack
    console.log(`[Metric] ${name}: ${value.toFixed(2)}ms`, extra || '');
    
    // Mock sending to analytics
    // analyticsService.track('perf_metric', { name, value, ...extra });
  },

  /**
   * Report basic Web Vitals
   */
  reportWebVitals: () => {
    // Simple mock of Web Vitals reporting
    // In a real app, use the 'web-vitals' npm package
    if ('PerformanceObserver' in window) {
      try {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          performanceService.logMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as any) {
            performanceService.logMetric('FID', entry.processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as any) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          performanceService.logMetric('CLS', clsValue);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('PerformanceObserver not supported for some metrics', e);
      }
    }
  },

  /**
   * Start 
   */
  startMeasure: (label: string) => {
    performance.mark(`${label}-start`);
  },

  /**
   * End and log measure
   */
  endMeasure: (label: string) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const entries = performance.getEntriesByName(label);
    if (entries.length > 0) {
      performanceService.logMetric(label, entries[entries.length - 1].duration);
    }
  }
};
