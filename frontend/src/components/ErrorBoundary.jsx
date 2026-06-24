import React, { Component } from "react";
import { Link } from "react-router-dom";

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                className="w-10 h-10 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Oops! Something went wrong
            </h1>
            
            {/* Error Message */}
            <p className="text-slate-600 mb-6">
              We're sorry, but something unexpected happened. 
              Please try again or return to the homepage.
            </p>

            {/* Development Mode Error Details */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                <p className="text-xs text-red-700 font-mono">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <p className="text-sm font-medium text-red-800 mt-2 mb-1">Stack Trace:</p>
                    <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Go Home
              </Link>
            </div>

            {/* Support Link */}
            <p className="mt-6 text-sm text-slate-500">
              If this problem persists, please{" "}
              <Link to="/help-center" className="text-amber-500 hover:underline">
                contact support
              </Link>
            </p>
          </div>
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;

