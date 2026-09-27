import React from 'react';
import { Skeleton } from './Skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-surface-dark-0 overflow-hidden">
      {/* Header Skeleton */}
      <header className="h-20 bg-surface-dark-1/80 border-b border-white/5 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-32 h-6 rounded" />
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="w-64 h-10 rounded-full hidden md:block" />
          <Skeleton className="w-32 h-10 rounded-full" />
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <Skeleton className="w-20 h-3 rounded" />
              <Skeleton className="w-16 h-2 rounded" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto">
          {/* AI Prompt Skeleton */}
          <div className="max-w-3xl mx-auto mb-16 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-64 h-8 rounded-lg" />
              <Skeleton className="w-48 h-4 rounded" />
            </div>
            <Skeleton className="w-full h-32 rounded-2xl" />
          </div>

          {/* Recent Projects Skeleton */}
          <div className="mb-10">
            <div className="mb-5">
              <Skeleton className="w-24 h-4 rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-surface-dark-2 border border-white/5 rounded-xl overflow-hidden flex flex-col">
                  <Skeleton className="w-full aspect-[16/10] rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="w-3/4 h-4 rounded" />
                    <Skeleton className="w-1/2 h-3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
