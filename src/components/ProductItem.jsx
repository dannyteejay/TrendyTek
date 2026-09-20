import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price }) => {
  const { formatPrice, currency } = useContext(ShopContext);

  const productImage =
    image && Array.isArray(image) && image.length > 0
      ? image[0]
      : image || "";

  // Dynamic automatic currency conversion
  const formattedPrice =
    typeof formatPrice === "function"
      ? formatPrice(price)
      : `${currency || "₦"}${Number(price).toLocaleString()}`;

  return (
    <Link
      to={`/product/${id}`}
      className="text-gray-700 dark:text-gray-200 cursor-pointer block group"
    >
      <div className="overflow-hidden rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-2 aspect-square flex items-center justify-center">
        <img
          className="object-contain w-full h-full group-hover:scale-108 transition-transform duration-300 ease-in-out"
          src={productImage}
          alt={name}
        />
      </div>
      <p className="pt-3 pb-1 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
        {name}
      </p>
      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
        {formattedPrice}
      </p>
    </Link>
  );
};

export default ProductItem;