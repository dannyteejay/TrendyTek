import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price, category, bestSeller }) => {
  const { currency } = useContext(ShopContext);

  const productImage =
    image && Array.isArray(image) && image.length > 0
      ? image[0]
      : image || "";

  return (
    <Link
      to={`/product/${id}`}
      className="flex flex-col justify-between overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-xs group rounded-2xl hover:shadow-xl hover:-translate-y-1 hover:border-gray-300"
    >
      {/* 1. Image Container with Badge */}
      <div className="relative flex items-center justify-center w-full p-4 overflow-hidden aspect-square bg-gray-50">
        {/* Hot Badge */}
        {bestSeller && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase bg-red-600 rounded-full shadow-xs">
            HOT
          </span>
        )}

        <img
          className="object-contain w-full h-full transition-transform duration-500 ease-out group-hover:scale-108"
          src={productImage}
          alt={name}
          loading="lazy"
        />
      </div>

      {/* 2. Card Details */}
      <div className="flex flex-col justify-between flex-1 p-3.5 sm:p-4 bg-white">
        <div>
          {category && (
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase mb-0.5">
              {category}
            </p>
          )}

          <h3 className="text-xs font-semibold text-gray-800 transition-colors sm:text-sm line-clamp-1 group-hover:text-black">
            {name}
          </h3>
        </div>

        {/* 3. Price & Action Row */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400 block -mb-0.5 font-medium">Price</span>
            <p className="text-sm font-bold text-gray-900 sm:text-base">
              {currency}
              {Number(price).toLocaleString()}
            </p>
          </div>

          {/* Quick View Circle Arrow */}
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-gray-700 transition-all bg-gray-100 rounded-full group-hover:bg-black group-hover:text-white group-hover:scale-105 shadow-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductItem;