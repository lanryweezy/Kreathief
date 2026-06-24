import React from 'react';
import { Skeleton } from './Skeleton';

export const EditorSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-surface-dark-2 overflow-hidden">
      {/* Header Skeleton */}
      <div className="h-14 bg-surface-dark-1 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-4 rounded hidden lg:block" />
          <div className="w-px h-4 bg-gray-800 mx-2 hidden md:block" />
          <div className="flex gap-2">
            <Skeleton className="w-16 h-7 rounded-md" />
            <Skeleton className="w-16 h-7 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-32 h-8 rounded-full" />
          <Skeleton className="w-20 h-9 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-[72px] bg-surface-dark-2 border-r border-[#1f1f1f] flex flex-col items-center py-4 gap-4 shrink-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 w-full px-2">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-6 h-1.5 rounded mt-1" />
            </div>
          ))}
          <div className="mt-auto flex flex-col gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-surface-dark-3 relative overflow-hidden">
          {/* Toolbar Skeleton */}
          <div className="h-12 bg-[#1a1d21] border-b border-white/5 flex items-center px-4 gap-4 shrink-0">
            <Skeleton className="w-32 h-6 rounded-lg" />
            <div className="w-px h-4 bg-gray-800" />
            <Skeleton className="w-48 h-6 rounded-lg" />
          </div>

          {/* Canvas Area Skeleton */}
          <div className="flex-1 p-12 flex items-center justify-center relative">
            {/* Virtual Artboard Skeleton */}
            <div className="w-[600px] h-[600px] bg-white/5 border border-white/10 rounded-lg shadow-2xl relative overflow-hidden animate-pulse">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50" />
            </div>

            {/* Floating Zoom (Optional) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center px-4" />
          </div>
        </div>

        {/* Properties Panel Skeleton (If expanded) */}
        <div className="w-[320px] bg-surface-dark-2 border-l border-[#1f1f1f] hidden xl:flex flex-col p-6 gap-6">
          <div className="space-y-2">
            <Skeleton className="w-24 h-3 rounded uppercase tracking-widest opacity-50" />
            <Skeleton className="w-full h-10 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="w-full h-32 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="mt-auto">
            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
