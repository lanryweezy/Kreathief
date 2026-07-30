import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string; // Low-quality image placeholder (LQIP)
  onLoad?: () => void;
  onError?: () => void;
  showSkeleton?: boolean;
}

/**
 * Skeleton loader component for image placeholders
 */
export const ImageSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full h-full bg-[#1a1d21] animate-pulse overflow-hidden relative ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
    <style>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
      .animate-shimmer {
        animation: shimmer 2s infinite linear;
      }
    `}</style>
  </div>
);

/**
 * Enhanced Lazy-loading image component with intersection observer
 * Features: Skeletons, LQIP support, and smooth transitions
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  showSkeleton = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Basic Intersection Observer to start loading when near viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Load 100px before visibility
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton / Placeholder state */}
      {(!isLoaded || !isVisible) && !hasError && (
        <div className="absolute inset-0 z-10">
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover blur-md scale-110 opacity-50" />
          ) : showSkeleton ? (
            <ImageSkeleton />
          ) : null}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1d21] text-gray-600 gap-2 p-4 text-center">
          <svg className="w-6 h-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Failed to load</span>
        </div>
      )}

      <img
        ref={imgRef}
        src={isVisible ? src : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ease-out animate-fade-in-tile ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${hasError ? 'hidden' : ''}`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

/**
 * Enhanced Lazy-loading background image component
 */
export const LazyBackgroundImage: React.FC<{
  src: string;
  className?: string;
  children?: React.ReactNode;
  showSkeleton?: boolean;
}> = ({ src, className = '', children, showSkeleton = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isVisible && !isLoaded) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [isVisible, src, isLoaded]);

  return (
    <div
      ref={divRef}
      className={`relative overflow-hidden transition-all duration-700 ${className}`}
      style={
        isLoaded
          ? {
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {!isLoaded && showSkeleton && <ImageSkeleton className="absolute inset-0 z-0" />}
      <div
        className={`relative z-10 w-full h-full transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
};
