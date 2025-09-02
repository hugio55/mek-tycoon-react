import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <div className="bg-black/50 rounded p-4 mb-4">
              <p className="text-red-300 font-mono text-sm">
                {this.state.error?.toString()}
              </p>
            </div>
            {this.state.errorInfo && (
              <details className="mb-4">
                <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300">
                  Show error details
                </summary>
                <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-64 bg-black/50 rounded p-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;