import React from 'react';
import { Icons } from '../constants';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
  variant?: 'full' | 'widget';
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary, variant = 'full' }) => {
  if (variant === 'widget') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/20 rounded-lg h-full min-h-[200px]">
        <Icons.AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
        <h3 className="text-white font-medium text-sm mb-1">Component Error</h3>
        <p className="text-red-300/70 text-xs text-center mb-3 max-w-[200px] truncate">
          {error.message || 'Something went wrong'}
        </p>
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#121212] flex flex-col items-center justify-center p-4 z-overlay">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icons.AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          We encountered an unexpected error. Don&apos;t worry, your work is likely safe if you haven&apos;t closed the
          tab.
        </p>

        <div className="bg-surface-dark-3 rounded-lg p-4 border border-gray-800 mb-8 text-left overflow-hidden">
          <p className="font-mono text-red-400 text-xs break-all">{error.message || 'Unknown Error'}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20"
          >
            Reload Application
          </button>
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Try to Recover
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
