import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);
  const firstImage = Array.isArray(image) && image.length > 0 ? image[0] : image;

  return (
    <Link
      to={`/product/${id}`}
      className="text-gray-700 dark:text-gray-300 cursor-pointer group flex flex-col"
    >
      <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        <OptimizedImage
          src={firstImage}
          alt={name}
          preset="PRODUCT_CARD"
          aspectRatio="aspect-square"
          className="group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
      </div>

      <p className="pt-3 pb-1 text-sm font-medium line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
        {name}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {currency}
        {price}
      </p>
    </Link>
  );
};

export default ProductItem;