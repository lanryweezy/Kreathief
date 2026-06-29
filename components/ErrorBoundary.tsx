import React, { Component, ErrorInfo, ReactNode } from 'react';
import { log } from '../utils/log';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  variant?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('[ErrorBoundary] Caught error', error, { componentStack: errorInfo.componentStack });
    try {
      localStorage.setItem('kreathief_crash', JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack?.slice(0, 1000),
        componentStack: errorInfo.componentStack?.slice(0, 1000),
        time: new Date().toISOString()
      }));
    } catch {}
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.reset);
      }
      if (fallback) {
        return fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/20 rounded-lg min-h-[200px]">
          <p className="text-red-400 text-sm font-medium mb-1">Something went wrong</p>
          <p className="text-red-300/60 text-xs text-center mb-4 max-w-[260px] truncate">
            {this.state.error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.reset}
            className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
