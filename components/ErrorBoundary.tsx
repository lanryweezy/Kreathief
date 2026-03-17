import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
    variant?: 'full' | 'widget';
    onReset?: () => void;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the
 * child component tree and displays a fallback UI instead of crashing.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null, errorCount: 0 };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`ErrorBoundary caught an error in ${this.props.componentName || 'Unknown Component'}:`, error, errorInfo);
        this.props.onError?.(error, errorInfo);
        
        this.setState(prev => {
            const newCount = prev.errorCount + 1;
            // Optionally auto-recover for the first few errors
            if (newCount < 3) {
                setTimeout(() => this.resetErrorBoundary(), 100);
            }
            return {
                errorInfo,
                errorCount: newCount
            };
        });
    }

    resetErrorBoundary = () => {
        this.props.onReset?.();
        this.setState(prev => ({ 
            hasError: false, 
            error: null, 
            errorInfo: null, 
            errorCount: prev.errorCount < 3 ? prev.errorCount : 0 
        }));
    };

    render() {
        if (this.state.hasError && this.state.error && this.state.errorCount >= 3) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    resetErrorBoundary={this.resetErrorBoundary}
                    variant={this.props.variant}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * HOC to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
