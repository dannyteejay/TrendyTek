import React from "react";
import { assets } from "../assets/assets";

const OurPolicy = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-around gap-10 sm:gap-4 text-center py-16 my-8 transition-colors duration-300">
      {/* 1. Easy Return & Exchange */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 mb-4 transition-all border border-gray-200 shadow-xs rounded-2xl bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
          <img
            src={assets.exchange_icon}
            className="w-7 h-7 transition-all dark:brightness-0 dark:invert"
            alt="Exchange Policy"
          />
        </div>
        <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
          Easy Return & Exchange Policy
        </p>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Easy Returns/exchanges within 10 days.
        </p>
      </div>

      {/* 2. Quality Policy */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 mb-4 transition-all border border-gray-200 shadow-xs rounded-2xl bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
          <img
            src={assets.quality_icon}
            className="w-7 h-7 transition-all dark:brightness-0 dark:invert"
            alt="Quality Guarantee"
          />
        </div>
        <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
          Our Quality Policy
        </p>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Trendify ensures top-quality products.
        </p>
      </div>

      {/* 3. Customer Support */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 mb-4 transition-all border border-gray-200 shadow-xs rounded-2xl bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
          <img
            src={assets.support_img}
            className="w-7 h-7 transition-all dark:brightness-0 dark:invert"
            alt="Customer Support"
          />
        </div>
        <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
          Best Customer Support
        </p>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          We support via email, phone, or chat.
        </p>
      </div>
    </div>
  );
};

export default OurPolicy;