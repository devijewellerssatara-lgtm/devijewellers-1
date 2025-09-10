import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console so we can see the exact issue
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-lg p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-700 mb-4">
              The page encountered an error and couldn't render. Please check the browser console for details.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-red-50 p-3 rounded border border-red-100 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}