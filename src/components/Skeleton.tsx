import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, rounded = 'md' }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-800 ${roundedMap[rounded]} ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="12px" width={i === lines - 1 ? '60%' : '100%'} rounded="sm" />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 space-y-3 ${className}`}>
    <Skeleton height="120px" rounded="lg" />
    <Skeleton height="14px" width="70%" />
    <Skeleton height="10px" width="50%" />
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <Skeleton width={size} height={size} rounded="full" className={className} />
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton height="36px" width="80px" rounded="lg" className={className} />
);
