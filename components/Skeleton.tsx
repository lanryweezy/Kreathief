import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-700/50 rounded ${className}`}
    />
  );
};

export const ElementSkeleton = () => (
  <div className="aspect-square bg-[#1e1e1e] border border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 p-2">
    <Skeleton className="w-10 h-10 rounded-lg" />
    <Skeleton className="w-12 h-2" />
  </div>
);
