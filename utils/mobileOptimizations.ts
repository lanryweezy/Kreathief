/**
 * Mobile Performance Optimizations
 * Utilities to improve performance on mobile devices
 */

/**
 * Detect if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detect if device is iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Detect if device is Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

/**
 * Get device pixel ratio for high-DPI displays
 */
export const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
};

/**
 * Optimize canvas for mobile performance
 */
export const optimizeCanvasForMobile = (canvas: HTMLCanvasElement): void => {
  const dpr = getDevicePixelRatio();
  const rect = canvas.getBoundingClientRect();
  
  // Limit DPR on mobile to save memory
  const mobileDpr = isMobileDevice() ? Math.min(dpr, 2) : dpr;
  
  canvas.width = rect.width * mobileDpr;
  canvas.height = rect.height * mobileDpr;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(mobileDpr, mobileDpr);
  }
};

/**
 * Throttle function for mobile scroll/touch events
 */
export const throttleForMobile = <T extends (...args: any[]) => any>(
  func: T,
  limit: number = 16 // ~60fps
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Debounce function for mobile input events
 */
export const debounceForMobile = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Request animation frame with fallback
 */
export const requestAnimationFramePolyfill = (callback: FrameRequestCallback): number => {
  return window.requestAnimationFrame?.(callback) || 
         window.setTimeout(callback, 1000 / 60);
};

/**
 * Cancel animation frame with fallback
 */
export const cancelAnimationFramePolyfill = (id: number): void => {
  if (window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    window.clearTimeout(id);
  }
};

/**
 * Optimize image loading for mobile
 */
export const optimizeImageForMobile = (url: string, maxWidth: number = 1024): string => {
  if (!isMobileDevice()) return url;
  
  // If using a CDN with image optimization, append parameters
  // Example: Cloudinary, Imgix, etc.
  const urlObj = new URL(url, window.location.origin);
  urlObj.searchParams.set('w', maxWidth.toString());
  urlObj.searchParams.set('q', '80'); // Quality
  urlObj.searchParams.set('f', 'auto'); // Format
  
  return urlObj.toString();
};

/**
 * Reduce motion for accessibility and performance
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get optimal animation duration based on device
 */
export const getOptimalAnimationDuration = (baseDuration: number): number => {
  if (shouldReduceMotion()) return 0;
  if (isMobileDevice()) return baseDuration * 0.8; // Slightly faster on mobile
  return baseDuration;
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImage = (img: HTMLImageElement, src: string): void => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  } else {
    // Fallback for older browsers
    img.src = src;
  }
};

/**
 * Prevent zoom on double-tap (iOS)
 */
export const preventDoubleTapZoom = (element: HTMLElement): void => {
  let lastTouchEnd = 0;
  element.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
};

/**
 * Enable momentum scrolling on iOS
 */
export const enableMomentumScrolling = (element: HTMLElement): void => {
  element.style.webkitOverflowScrolling = 'touch';
  element.style.overflowY = 'auto';
};

/**
 * Get safe area insets
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
};

/**
 * Optimize touch event listeners
 */
export const addOptimizedTouchListener = (
  element: HTMLElement,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): void => {
  const optimizedOptions = {
    passive: true,
    ...options,
  };
  element.addEventListener(event, handler, optimizedOptions);
};

/**
 * Memory-efficient array chunking for large lists
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Virtual scrolling helper
 */
export const calculateVisibleRange = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } => {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  
  return { start, end };
};
