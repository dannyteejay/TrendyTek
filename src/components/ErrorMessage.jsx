import React from "react";

export const ErrorMessage = ({
  title,
  message = "An error occurred. Please try again.",
  onRetry,
  fieldErrors,
  className = "",
}) => {
  if (!message && !fieldErrors) return null;

  return (
    <div
      role="alert"
      className={`p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <div className="flex-1 text-sm">
          {title && <h4 className="font-semibold text-red-900 dark:text-red-200 mb-0.5">{title}</h4>}
          <p>{message}</p>

          {fieldErrors && typeof fieldErrors === "object" && (
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-red-700 dark:text-red-400">
              {Object.entries(fieldErrors).map(([field, err]) => (
                <li key={field}>
                  <strong className="capitalize">{field}:</strong> {err}
                </li>
              ))}
            </ul>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-xs font-semibold underline text-red-900 dark:text-red-200 hover:text-red-700"
            >
              Try Again ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;