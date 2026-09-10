import React, { useState } from "react";
import { getOptimizedImageUrl, IMAGE_PRESETS } from "../utils/imageOptimizer";

const OptimizedImage = ({
  src,
  alt = "Product image",
  preset,
  width,
  height,
  crop = "fill",
  className = "",
  aspectRatio = "aspect-square",
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const options = preset
    ? IMAGE_PRESETS[preset] || {}
    : { width, height, crop };

  const optimizedSrc = getOptimizedImageUrl(src, options);

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      {/* Shimmer Placeholder while downloading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}

      {/* Fallback Display if image fails */}
      {hasError ? (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
          <svg className="w-8 h-8 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium">Image unavailable</span>
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          onClick={onClick}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${onClick ? "cursor-pointer" : ""}`}
        />
      )}
    </div>
  );
};

export default OptimizedImage;