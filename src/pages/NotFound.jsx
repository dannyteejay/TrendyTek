import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Decorative Status Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-widest mb-6">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        Error 404
      </div>

      {/* Main Big 404 Heading */}
      <h1 className="text-7xl sm:text-9xl font-black text-gray-900 dark:text-white tracking-tight mb-4 select-none">
        404
      </h1>

      {/* Subtitle & Description */}
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
        Page Not Found
      </h2>
      <p className="max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md justify-center">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          ← Go Back
        </button>
        <Link
          to="/"
          className="flex-1 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-all text-center shadow-sm"
        >
          Return Home
        </Link>
      </div>

      {/* Quick Helpful Links */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-wrap justify-center gap-6 text-xs text-gray-500 dark:text-gray-400 font-medium">
        <Link to="/collection" className="hover:text-black dark:hover:text-white transition-colors">
          Browse Collections
        </Link>
        <span>•</span>
        <Link to="/contact" className="hover:text-black dark:hover:text-white transition-colors">
          Contact Support
        </Link>
        <span>•</span>
        <Link to="/about" className="hover:text-black dark:hover:text-white transition-colors">
          About TrendyTek
        </Link>
      </div>
    </div>
  );
};

export default NotFound;