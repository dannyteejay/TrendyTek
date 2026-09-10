import React from "react";

const ProductDetailsSkeleton = () => {
  return (
    <div className="border-t-2 pt-10 animate-pulse">
      <div className="flex gap-12 flex-col sm:flex-row">
        {/* Images Left Column */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:w-[18.7%] w-full gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="w-[24%] sm:w-full sm:mb-3 aspect-square bg-gray-200 dark:bg-gray-800 rounded shrink-0"
              ></div>
            ))}
          </div>
          <div className="w-full sm:w-[80%] aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        </div>

        {/* Product Details Right Column */}
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-4/5"></div>
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mt-4"></div>

          <div className="space-y-2 mt-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
          </div>

          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-44 mt-6"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;