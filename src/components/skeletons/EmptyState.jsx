import React from "react";
import { Link } from "react-router-dom";

export const EmptyState = ({
  icon = "🛍️",
  title = "No items found",
  description = "We couldn't find anything matching your request.",
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto">
      <div className="text-5xl mb-4 select-none">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>
      {actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold uppercase tracking-wider rounded shadow-sm hover:opacity-90 transition-all"
        >
          {actionText || "Explore Catalog"}
        </Link>
      )}
      {onAction && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold uppercase tracking-wider rounded shadow-sm hover:opacity-90 transition-all"
        >
          {actionText || "Action"}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = "Something went wrong",
  message = "An error occurred while loading this data.",
  onRetry,
}) => {
  return (
    <div className="py-12 px-4 text-center max-w-md mx-auto">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded hover:opacity-90"
        >
          Retry Request
        </button>
      )}
    </div>
  );
};