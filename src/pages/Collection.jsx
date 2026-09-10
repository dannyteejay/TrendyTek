import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import { ProductGridSkeleton, EmptyState, ErrorState } from "../components/skeletons";

const Collection = () => {
  const {
    products,
    search,
    showSearch,
    categories,
    isProductsLoading,
    isProductsError,
    refetchProducts,
  } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relevant");

  // Toggle Category selection
  const toggleCategory = (e) => {
    const value = e.target.value.toLowerCase();
    if (category.includes(value)) {
      setCategory((prev) => prev.filter((item) => item !== value));
    } else {
      setCategory((prev) => [...prev, value]);
    }
  };

  // Toggle SubCategory selection
  const toggleSubCategory = (e) => {
    const value = e.target.value.toLowerCase();
    if (subCategory.includes(value)) {
      setSubCategory((prev) => prev.filter((item) => item !== value));
    } else {
      setSubCategory((prev) => [...prev, value]);
    }
  };

  // Reset all active filters
  const resetFilters = () => {
    setCategory([]);
    setSubCategory([]);
    setSortType("relevant");
  };

  // Filter & Search Engine
  useEffect(() => {
    let productsCopy = products.slice();

    // 1. Search Query Filter
    if (showSearch && search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // 2. Dynamic Category Filter (Case-Insensitive)
    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.includes((item.category || "").toLowerCase())
      );
    }

    // 3. SubCategory Filter (Case-Insensitive)
    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subCategory.includes((item.subCategory || "").toLowerCase())
      );
    }

    // 4. Sort Strategy
    switch (sortType) {
      case "low-high":
        productsCopy.sort((a, b) => a.price - b.price);
        break;
      case "high-low":
        productsCopy.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    setFilterProducts(productsCopy);
  }, [category, subCategory, search, showSearch, products, sortType]);

  // Derived unique categories from DB
  const displayCategories = categories.length > 0
    ? categories.map((c) => (typeof c === "string" ? c : c.name))
    : Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const displaySubCategories = ["Topwear", "Bottomwear", "Winterwear"];

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* ---------------- FILTER SIDEBAR ---------------- */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2 font-medium"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden transition-transform ${showFilter ? "rotate-90" : ""}`}
            src={assets.dropdown_icon}
            alt="Toggle"
          />
        </p>

        {/* Category Filter Box */}
        <div className={`border border-gray-300 dark:border-gray-800 pl-5 py-3 mt-4 ${showFilter ? "" : "hidden"} sm:block rounded-sm`}>
          <div className="flex justify-between items-center pr-4">
            <p className="mb-3 text-sm font-semibold tracking-wider uppercase text-gray-700 dark:text-gray-200">
              Categories
            </p>
            {category.length > 0 && (
              <button
                onClick={() => setCategory([])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-3"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2.5 text-sm font-light text-gray-700 dark:text-gray-300">
            {displayCategories.map((catName) => (
              <label key={catName} className="flex gap-2.5 items-center cursor-pointer">
                <input
                  className="w-3.5 h-3.5 accent-black dark:accent-white"
                  type="checkbox"
                  value={catName}
                  checked={category.includes(catName.toLowerCase())}
                  onChange={toggleCategory}
                />
                <span className="capitalize">{catName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SubCategory Filter Box */}
        <div className={`border border-gray-300 dark:border-gray-800 pl-5 py-3 my-5 ${showFilter ? "" : "hidden"} sm:block rounded-sm`}>
          <div className="flex justify-between items-center pr-4">
            <p className="mb-3 text-sm font-semibold tracking-wider uppercase text-gray-700 dark:text-gray-200">
              Type
            </p>
            {subCategory.length > 0 && (
              <button
                onClick={() => setSubCategory([])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-3"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2.5 text-sm font-light text-gray-700 dark:text-gray-300">
            {displaySubCategories.map((subName) => (
              <label key={subName} className="flex gap-2.5 items-center cursor-pointer">
                <input
                  className="w-3.5 h-3.5 accent-black dark:accent-white"
                  type="checkbox"
                  value={subName}
                  checked={subCategory.includes(subName.toLowerCase())}
                  onChange={toggleSubCategory}
                />
                <span className="capitalize">{subName}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- PRODUCTS RIGHT SECTION ---------------- */}
      <div className="flex-1">
        <div className="flex justify-between items-center text-base sm:text-2xl mb-4">
          <Title text1={"ALL"} text2={"COLLECTIONS"} />

          {/* Product Sort Select */}
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 dark:border-gray-700 text-sm px-2.5 py-1.5 rounded-sm bg-transparent outline-none text-gray-800 dark:text-gray-200"
          >
            <option value="relevant" className="dark:bg-gray-900">Sort by: Relevant</option>
            <option value="low-high" className="dark:bg-gray-900">Price: Low to High</option>
            <option value="high-low" className="dark:bg-gray-900">Price: High to Low</option>
          </select>
        </div>

        {/* 1. LOADING STATE */}
        {isProductsLoading && <ProductGridSkeleton count={10} />}

        {/* 2. ERROR STATE */}
        {!isProductsLoading && isProductsError && (
          <ErrorState
            title="Unable to load catalog"
            message="We had trouble connecting to the server. Please verify your connection."
            onRetry={refetchProducts}
          />
        )}

        {/* 3. EMPTY STATE */}
        {!isProductsLoading && !isProductsError && filterProducts.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No matching products found"
            description="Try adjusting your filter options or clearing search keywords."
            actionText="Reset All Filters"
            onAction={resetFilters}
          />
        )}

        {/* 4. SUCCESS STATE (Product Grid) */}
        {!isProductsLoading && !isProductsError && filterProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {filterProducts.map((item) => (
              <ProductItem
                key={item._id}
                name={item.name}
                id={item._id}
                price={item.price}
                image={item.image}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;