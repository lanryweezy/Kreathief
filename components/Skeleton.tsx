import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-white/5 rounded ${className}`}
    />
  );
};

export const ElementSkeleton = () => (
  <div className="aspect-square bg-[#1e1e1e] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 p-2">
    <Skeleton className="w-10 h-10 rounded-lg" />
    <Skeleton className="w-12 h-2" />
  </div>
);

export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-4 p-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-2/3 h-3 rounded" />
          <Skeleton className="w-1/3 h-2 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const GridSkeleton = ({ items = 6 }) => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="aspect-square bg-[#1e1e1e] border border-white/5 rounded-xl p-3 space-y-3">
        <Skeleton className="w-full h-2/3 rounded-lg" />
        <Skeleton className="w-3/4 h-2 rounded" />
        <Skeleton className="w-1/2 h-2 rounded" />
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 space-y-4 mx-4 my-2">
    <Skeleton className="w-full aspect-video rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="w-3/4 h-4 rounded" />
      <Skeleton className="w-1/2 h-3 rounded" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="flex-1 h-10 rounded-xl" />
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
  </div>
);

