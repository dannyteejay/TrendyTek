import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, token } =
    useContext(ShopContext);
  const navigate = useNavigate();
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item],
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  // 🔒 Secure Checkout Gate: Requires user to login before checkout
  const handleProceedToCheckout = () => {
    if (cartData.length === 0) {
      toast.error("Your cart is empty! Add products first.");
      return;
    }

    if (!token) {
      toast.info("🔐 Please sign in or create an account to proceed to checkout", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login?redirect=place-order");
      return;
    }

    navigate("/place-order");
  };

  return (
    <div className="border-t pt-14 pb-20 transition-colors duration-300">
      <div className="text-2xl mb-6">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      {cartData.length === 0 ? (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-lg font-medium mb-4">Your cart is currently empty</p>
          <button
            onClick={() => navigate("/collection")}
            className="px-6 py-2.5 text-xs font-bold text-white bg-black dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
          >
            START SHOPPING &rarr;
          </button>
        </div>
      ) : (
        <div>
          {/* Cart Items List */}
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {cartData.map((item, index) => {
              const productData = products.find(
                (product) => product._id === item._id
              );

              if (!productData) return null;

              const productImage =
                productData.image && Array.isArray(productData.image)
                  ? productData.image[0]
                  : productData.image || assets.upload_area;

              return (
                <div
                  key={index}
                  className="py-5 text-gray-700 dark:text-gray-200 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    <img
                      className="w-16 sm:w-20 object-contain rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1"
                      src={productImage}
                      alt={productData.name}
                    />
                    <div>
                      <p className="text-xs sm:text-base font-bold text-gray-900 dark:text-white">
                        {productData.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                          {currency}
                          {Number(productData.price).toLocaleString()}
                        </p>
                        <p className="px-2.5 sm:px-3 sm:py-1 text-xs border border-gray-300 dark:border-slate-700 rounded bg-gray-50 dark:bg-slate-800">
                          {item.size}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <input
                    onChange={(e) =>
                      e.target.value === "" || e.target.value === "0"
                        ? null
                        : updateQuantity(
                            item._id,
                            item.size,
                            Number(e.target.value)
                          )
                    }
                    className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white max-w-12 sm:max-w-20 px-2 py-1 text-center rounded outline-none font-medium"
                    type="number"
                    min={1}
                    defaultValue={item.quantity}
                  />

                  {/* Delete Trash Icon */}
                  <img
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    className="w-4 sm:w-5 cursor-pointer dark:invert hover:opacity-75 transition-opacity justify-self-end"
                    src={assets.bin_icon}
                    alt="Delete Item"
                    title="Remove from cart"
                  />
                </div>
              );
            })}
          </div>

          {/* Cart Total Summary & Checkout Button */}
          <div className="flex justify-end my-16">
            <div className="w-full sm:w-[450px]">
              <CartTotal />
              <div className="w-full text-end mt-6">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full sm:w-auto px-8 py-3.5 text-xs sm:text-sm font-bold tracking-wider text-white uppercase transition-all bg-black dark:bg-white dark:text-black rounded-lg shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 cursor-pointer"
                >
                  PROCEED TO CHECKOUT &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;