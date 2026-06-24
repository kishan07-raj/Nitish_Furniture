import React from "react";
import { Link, useRouteError } from "react-router-dom";

/**
 * ErrorPage Component
 * Displays a user-friendly error page for route-level errors
 * Used as errorElement in React Router
 */
const ErrorPage = () => {
  const error = useRouteError();
  
  // Determine error status and message
  let status = 404;
  let message = "Page not found";
  let description = "The page you're looking for doesn't exist or has been moved.";

  if (error) {
    if (error.status) {
      status = error.status;
    }
    if (error.statusText) {
      message = error.statusText;
    }
    if (error.message) {
      description = error.message;
    }
  }

  // Custom messages for different status codes
  const getCustomMessage = (status) => {
    switch (status) {
      case 403:
        return {
          title: "Access Forbidden",
          description: "You don't have permission to access this page."
        };
      case 404:
        return {
          title: "Page Not Found",
          description: "The page you're looking for doesn't exist or has been moved."
        };
      case 500:
        return {
          title: "Server Error",
          description: "Something went wrong on our end. Please try again later."
        };
      default:
        return {
          title: "Oops! Something went wrong",
          description: "An unexpected error occurred. Please try again."
        };
    }
  };

  const customError = getCustomMessage(status);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Error Code */}
        <div className="mb-6">
          <span className="text-7xl font-bold text-amber-500">{status}</span>
        </div>

        {/* Error Icon */}
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {status === 404 ? (
            <svg 
              className="w-10 h-10 text-slate-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          ) : status === 403 ? (
            <svg 
              className="w-10 h-10 text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          ) : (
            <svg 
              className="w-10 h-10 text-amber-400" 
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
          )}
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {customError.title}
        </h1>
        
        {/* Error Description */}
        <p className="text-slate-600 mb-6">
          {customError.description}
        </p>

        {/* Development Mode Error Details */}
        {process.env.NODE_ENV === "development" && error && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg text-left overflow-auto max-h-40">
            <p className="text-sm font-medium text-slate-700">
              {message}
            </p>
            {description && (
              <p className="text-xs text-slate-500 mt-1">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Go Back
          </button>
          <Link
            to="/"
            className="flex-1 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Go Home
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-3">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/products" 
              className="text-sm text-amber-500 hover:underline"
            >
              Products
            </Link>
            <Link 
              to="/cart" 
              className="text-sm text-amber-500 hover:underline"
            >
              Cart
            </Link>
            <Link 
              to="/wishlist" 
              className="text-sm text-amber-500 hover:underline"
            >
              Wishlist
            </Link>
            <Link 
              to="/help-center" 
              className="text-sm text-amber-500 hover:underline"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

