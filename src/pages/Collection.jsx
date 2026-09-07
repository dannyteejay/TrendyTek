import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import axios from "axios";

const Collection = () => {
  const { products, search, showSearch, backendUrl, categories: contextCategories } =
    useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [sortType, setSortType] = useState("relavent");

  // Dynamic store categories array from API
  const [categoryList, setCategoryList] = useState([]);

  // Fetch live categories directly on load
  const fetchLiveCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category/list");
      if (
        response &&
        response.data &&
        response.data.success &&
        Array.isArray(response.data.categories)
      ) {
        setCategoryList(response.data.categories);
      } else if (contextCategories && contextCategories.length > 0) {
        setCategoryList(contextCategories);
      }
    } catch (error) {
      console.error("Categories fetch error in Collection:", error);
      if (contextCategories && contextCategories.length > 0) {
        setCategoryList(contextCategories);
      }
    }
  };

  useEffect(() => {
    fetchLiveCategories();
  }, [backendUrl, contextCategories]);

  // Combine database categories + any categories found on products (e.g. vehicle, bags)
  const allAvailableCategories = React.useMemo(() => {
    const map = new Map();

    // 1. Add categories from database
    categoryList.forEach((cat) => {
      if (cat && cat.name) {
        const key = cat.name.trim().toLowerCase();
        map.set(key, {
          name: cat.name.trim(),
          subCategories: Array.isArray(cat.subCategories) ? cat.subCategories : [],
        });
      }
    });

    // 2. Add categories found on products in case they aren't in categories table
    products.forEach((p) => {
      if (p && p.category) {
        const key = p.category.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: p.category.trim(),
            subCategories: p.subCategory ? [p.subCategory.trim()] : [],
          });
        } else if (p.subCategory) {
          const existing = map.get(key);
          if (!existing.subCategories.includes(p.subCategory.trim())) {
            existing.subCategories.push(p.subCategory.trim());
          }
        }
      }
    });

    return Array.from(map.values());
  }, [categoryList, products]);

  // Toggle Category Checkbox (case-insensitive tracking)
  const toggleCategory = (catName) => {
    const lower = catName.toLowerCase();
    setSelectedCategories((prev) =>
      prev.includes(lower)
        ? prev.filter((item) => item !== lower)
        : [...prev, lower]
    );
  };

  // Toggle SubCategory Checkbox (case-insensitive tracking)
  const toggleSubCategory = (subName) => {
    const lower = subName.toLowerCase();
    setSelectedSubCategories((prev) =>
      prev.includes(lower)
        ? prev.filter((item) => item !== lower)
        : [...prev, lower]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSortType("relavent");
  };

  // Compute visible subcategories based on selected category or all categories
  const visibleSubcategories = React.useMemo(() => {
    const subSet = new Set();

    if (selectedCategories.length > 0) {
      allAvailableCategories.forEach((cat) => {
        if (selectedCategories.includes(cat.name.toLowerCase())) {
          cat.subCategories.forEach((sub) => subSet.add(sub));
        }
      });
    } else {
      allAvailableCategories.forEach((cat) => {
        cat.subCategories.forEach((sub) => subSet.add(sub));
      });
    }

    return Array.from(subSet);
  }, [allAvailableCategories, selectedCategories]);

  // Apply Filter Logic (Search + Category + SubCategory)
  const applyFilter = () => {
    let productsCopy = products.slice();

    // 1. Search Query Filter
    if (showSearch && search) {
      const q = search.toLowerCase().trim();
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter (Case-insensitive)
    if (selectedCategories.length > 0) {
      productsCopy = productsCopy.filter(
        (item) =>
          item.category &&
          selectedCategories.includes(item.category.toLowerCase().trim())
      );
    }

    // 3. Sub-Category Filter (Case-insensitive)
    if (selectedSubCategories.length > 0) {
      productsCopy = productsCopy.filter(
        (item) =>
          item.subCategory &&
          selectedSubCategories.includes(item.subCategory.toLowerCase().trim())
      );
    }

    setFilterProducts(productsCopy);
  };

  // Sort Filtered Products
  const sortProduct = () => {
    let fpCopy = filterProducts.slice();

    switch (sortType) {
      case "low-high":
        setFilterProducts(fpCopy.sort((a, b) => a.price - b.price));
        break;
      case "high-low":
        setFilterProducts(fpCopy.sort((a, b) => b.price - a.price));
        break;
      default:
        applyFilter();
        break;
    }
  };

  useEffect(() => {
    applyFilter();
  }, [selectedCategories, selectedSubCategories, search, showSearch, products]);

  useEffect(() => {
    sortProduct();
  }, [sortType]);

  return (
    <div className="flex flex-col gap-1 pt-10 border-t sm:flex-row sm:gap-10">
      {/* Left Filter Options Sidebar */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 my-2 text-xl font-semibold cursor-pointer"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden transition-transform ${
              showFilter ? "rotate-90" : ""
            }`}
            src={assets.dropdown_icon}
            alt="Dropdown"
          />
        </p>

        {/* Filters Container */}
        <div className={`${showFilter ? "" : "hidden"} sm:block flex flex-col gap-4`}>
          {/* 1. Dynamic Category Filter Box */}
          <div className="py-4 pl-5 bg-white border border-gray-300 rounded-xl shadow-xs">
            <p className="mb-3 text-sm font-bold tracking-wide text-gray-800 uppercase">
              CATEGORIES ({allAvailableCategories.length})
            </p>
            <div className="flex flex-col gap-2.5 text-sm font-medium text-gray-700 max-h-64 overflow-y-auto pr-3">
              {allAvailableCategories.map((cat) => {
                const isChecked = selectedCategories.includes(
                  cat.name.toLowerCase()
                );
                return (
                  <label
                    key={cat.name}
                    className="flex items-center gap-2.5 cursor-pointer hover:text-black transition-colors"
                  >
                    <input
                      className="w-4 h-4 rounded cursor-pointer accent-black"
                      type="checkbox"
                      value={cat.name}
                      checked={isChecked}
                      onChange={() => toggleCategory(cat.name)}
                    />
                    <span className="capitalize">{cat.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Dynamic Sub-Category Filter Box */}
          {visibleSubcategories.length > 0 && (
            <div className="py-4 pl-5 bg-white border border-gray-300 rounded-xl shadow-xs">
              <p className="mb-3 text-sm font-bold tracking-wide text-gray-800 uppercase">
                SUB-CATEGORIES / TYPES
              </p>
              <div className="flex flex-col gap-2.5 text-sm font-medium text-gray-700 max-h-64 overflow-y-auto pr-3">
                {visibleSubcategories.map((subName) => {
                  const isChecked = selectedSubCategories.includes(
                    subName.toLowerCase()
                  );
                  return (
                    <label
                      key={subName}
                      className="flex items-center gap-2.5 cursor-pointer hover:text-black transition-colors"
                    >
                      <input
                        className="w-4 h-4 rounded cursor-pointer accent-black"
                        type="checkbox"
                        value={subName}
                        checked={isChecked}
                        onChange={() => toggleSubCategory(subName)}
                      />
                      <span className="capitalize">{subName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          {(selectedCategories.length > 0 ||
            selectedSubCategories.length > 0 ||
            sortType !== "relavent") && (
            <button
              onClick={clearFilters}
              className="w-full py-2.5 text-xs font-bold text-white transition-all bg-black rounded-lg shadow-sm hover:bg-gray-800 active:scale-95 cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Right Side: Collections Products Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4 text-base sm:text-2xl">
          <Title text1={"ALL"} text2={"COLLECTIONS"} />

          {/* Sort Dropdown */}
          <select
            onChange={(e) => setSortType(e.target.value)}
            value={sortType}
            className="px-3 py-2 text-xs font-medium transition-colors bg-white border-2 border-gray-300 rounded-lg outline-none cursor-pointer sm:text-sm hover:border-black"
          >
            <option value="relavent">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {/* Product Cards Grid */}
        {filterProducts.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-lg font-bold text-gray-800">
              No products found matching your filters.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try selecting a different category or clearing your active filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 mt-4 text-xs font-bold text-white bg-black rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 gap-y-6">
            {filterProducts.map((item, index) => (
              <ProductItem
                key={index}
                name={item.name}
                id={item._id}
                price={item.price}
                image={item.image}
                category={item.category}
                bestSeller={item.bestSeller}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;