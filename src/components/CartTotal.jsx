import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const CartTotal = () => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);
  const cartAmount = getCartAmount();
  const totalWithShipping = cartAmount === 0 ? 0 : cartAmount + delivery_fee;

  return (
    <div className="w-full">
      <div className="text-2xl mb-4">
        <Title text1={"CART"} text2={"TOTAL"} />
      </div>

      <div className="flex flex-col gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
        <div className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-800">
          <p>Sub Total</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {currency}
            {cartAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-800">
          <p>Shipping Fee</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {currency}
            {delivery_fee.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="flex justify-between py-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
          <b>Total Amount</b>
          <b className="text-base sm:text-lg">
            {currency}
            {totalWithShipping.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;