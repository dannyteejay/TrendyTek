import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-8 border border-gray-100 dark:border-gray-800 text-center">
            {/* Warning Shield Icon */}
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Friendly Title & Description */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              An unexpected display issue occurred in this section. Don't worry, your cart and session data are safe.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Return Home
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