import React from "react";

const OrderSkeleton = () => {
  return (
    <div className="py-5 border-t border-b border-gray-100 dark:border-gray-800 text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pulse">
      <div className="flex items-start gap-6 text-sm">
        <div className="w-16 sm:w-20 aspect-square bg-gray-200 dark:bg-gray-800 rounded shrink-0"></div>
        <div className="space-y-2.5 flex-1 min-w-[200px]">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
        </div>
      </div>

      <div className="md:w-1/2 flex justify-between items-center gap-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
      </div>
    </div>
  );
};

export const OrderListSkeleton = ({ count = 4 }) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderSkeleton key={i} />
      ))}
    </div>
  );
};

export default OrderSkeleton;