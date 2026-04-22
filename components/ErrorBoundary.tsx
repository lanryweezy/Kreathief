import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  variant?: 'full' | 'widget';
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxAutoRecoveryAttempts?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
}

/**
 * Intelligent Error Boundary with Auto-Recovery and Scoped Logging
 */
export class ErrorBoundary extends Component<Props, State> {
  private recoveryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName = 'Unknown', onError, maxAutoRecoveryAttempts = 3 } = this.props;
    const { recoveryAttempts } = this.state;

    // Scoped Logging
    console.error(`[ErrorBoundary:${componentName}] Caught error:`, {
      message: error.message,
      componentStack: errorInfo.componentStack,
      attempt: recoveryAttempts + 1,
    });

    onError?.(error, errorInfo);

    this.setState({ errorInfo });

    // Exponential Backoff Auto-Recovery
    if (recoveryAttempts < maxAutoRecoveryAttempts) {
      const delay = Math.pow(2, recoveryAttempts) * 100; // 100ms, 200ms, 400ms...

      if (this.recoveryTimeout) {
        clearTimeout(this.recoveryTimeout);
      }

      this.recoveryTimeout = setTimeout(() => {
        console.log(
          `[ErrorBoundary:${componentName}] Attempting auto-recovery (${recoveryAttempts + 1}/${maxAutoRecoveryAttempts})...`
        );
        this.resetErrorBoundary();
      }, delay);

      this.setState((prev) => ({ recoveryAttempts: prev.recoveryAttempts + 1 }));
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
  }

  resetErrorBoundary = () => {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, recoveryAttempts } = this.state;
    const { children, fallback, variant, maxAutoRecoveryAttempts = 3 } = this.props;

    // If there's an error, don't render children.
    if (hasError && error) {
      // If we've exhausted recovery attempts, show the full fallback
      if (recoveryAttempts >= maxAutoRecoveryAttempts) {
        if (fallback) {
          return fallback;
        }

        return (
          <ErrorFallback
            error={error}
            resetErrorBoundary={() => {
              this.setState({ recoveryAttempts: 0 });
              this.resetErrorBoundary();
            }}
            variant={variant}
          />
        );
      }

      // During recovery attempts, show a subtle loading or blank state to prevent loops
      return (
        <div className="flex items-center justify-center w-full h-full bg-[#1e1e1e]/50 backdrop-blur-sm animate-pulse">
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
            Recovering {recoveryAttempts}/{maxAutoRecoveryAttempts}...
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC to wrap a component with an Intelligent ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...options}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
