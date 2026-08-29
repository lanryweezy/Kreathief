import React from 'react';

/**
 * Skeleton loading components — 2026 UX standard.
 * Uses shimmer animation that degrades gracefully for users
 * with prefers-reduced-motion: uses static opacity pulse instead.
 */

interface SkeletonProps {
  className?: string;
  /** Override shimmer with a static pulse for reduced-motion preference */
  'aria-label'?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', 'aria-label': ariaLabel }) => {
  return (
    <div
      role="status"
      aria-label={ariaLabel || 'Loading...'}
      aria-busy="true"
      className={`
        relative overflow-hidden rounded bg-white/[0.06]
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent
        before:-translate-x-full
        motion-safe:before:animate-[skeleton-shimmer_1.6s_ease-in-out_infinite]
        motion-reduce:before:hidden
        motion-reduce:animate-pulse
        ${className}
      `}
    />
  );
};

// Layer row skeleton — matches LayerItem height
export const LayerRowSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03]" aria-hidden="true">
    <Skeleton className="w-8 h-8 rounded shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-2.5 w-2/3 rounded" />
      <Skeleton className="h-2 w-1/3 rounded opacity-60" />
    </div>
    <Skeleton className="w-5 h-5 rounded opacity-40" />
  </div>
);

// Element grid skeleton — matches asset / template grid items
export const ElementSkeleton = () => (
  <div className="aspect-square bg-surface-dark-3 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 p-2">
    <Skeleton className="w-10 h-10 rounded-lg" />
    <Skeleton className="w-12 h-2" />
  </div>
);

// List skeleton — generic vertically-stacked list
export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-0 p-0" role="status" aria-label="Loading list..." aria-busy="true">
    {Array.from({ length: items }).map((_, i) => (
      <LayerRowSkeleton key={i} />
    ))}
  </div>
);

// Grid skeleton — 2-column asset/template grid
export const GridSkeleton = ({ items = 6 }: { items?: number }) => (
  <div className="grid grid-cols-2 gap-3 p-4" role="status" aria-label="Loading items..." aria-busy="true">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="aspect-square bg-surface-dark-3 border border-white/5 rounded-xl p-3 space-y-3">
        <Skeleton className="w-full h-2/3 rounded-lg" />
        <Skeleton className="w-3/4 h-2 rounded" />
        <Skeleton className="w-1/2 h-2 rounded opacity-60" />
      </div>
    ))}
  </div>
);

// Card skeleton — single project/design card
export const CardSkeleton = () => (
  <div
    className="bg-surface-dark-3 border border-white/5 rounded-2xl p-4 space-y-4 mx-4 my-2"
    role="status"
    aria-label="Loading..."
    aria-busy="true"
  >
    <Skeleton className="w-full aspect-video rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="w-3/4 h-4 rounded" />
      <Skeleton className="w-1/2 h-3 rounded opacity-70" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="flex-1 h-10 rounded-xl" />
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
  </div>
);

// Panel header skeleton — side panel section loading
export const PanelSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="p-4 space-y-4" role="status" aria-label="Loading panel..." aria-busy="true">
    <Skeleton className="w-1/3 h-3 rounded mb-2 opacity-50" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between gap-4">
        <Skeleton className="flex-1 h-9 rounded-lg" />
        <Skeleton className="w-16 h-9 rounded-lg shrink-0" />
      </div>
    ))}
  </div>
);

// Dashboard project grid skeleton
export const DashboardSkeleton = ({ items = 8 }: { items?: number }) => (
  <div
    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6"
    role="status"
    aria-label="Loading projects..."
    aria-busy="true"
  >
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-white/5 bg-surface-dark-3 overflow-hidden">
        <Skeleton className="w-full aspect-video" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-3 w-2/3 rounded" />
          <Skeleton className="h-2.5 w-1/2 rounded opacity-60" />
        </div>
      </div>
    ))}
  </div>
);
