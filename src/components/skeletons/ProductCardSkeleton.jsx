import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2.5 animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden"></div>

      {/* Product Title Skeleton */}
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mt-1"></div>

      {/* Price Skeleton */}
      <div className="flex items-center justify-between mt-0.5">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;