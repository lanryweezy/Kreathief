import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface PanelErrorBoundaryProps {
  children: React.ReactNode;
  panelName?: string;
}

export const PanelErrorBoundary: React.FC<PanelErrorBoundaryProps> = ({ children, panelName }) => {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="flex flex-col items-center justify-center p-6 bg-[#1e1e1e] rounded-lg min-h-[180px]">
          <p className="text-red-400 text-xs font-medium mb-1">{panelName ? `${panelName} failed` : 'Panel error'}</p>
          <p className="text-red-300/50 text-[11px] text-center mb-3 max-w-[220px] truncate">
            {error.message || 'Something went wrong'}
          </p>
          <button
            onClick={reset}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-[11px] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
