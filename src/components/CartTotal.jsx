import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const CartTotal = () => {
  const {
    currency,
    delivery_fee,
    freeShippingThreshold,
    shippingStatus,
    estimatedDelivery,
    getCartAmount,
    getDeliveryFee,
  } = useContext(ShopContext);

  const cartAmount = getCartAmount();

  // Dynamic shipping fee calculation
  const currentShippingFee =
    typeof getDeliveryFee === "function"
      ? getDeliveryFee(cartAmount)
      : cartAmount === 0 || shippingStatus === false
      ? 0
      : Number(delivery_fee) || 0;

  // Exact total amount adding cart subtotal + active shipping fee
  const totalWithShipping =
    cartAmount === 0 ? 0 : cartAmount + currentShippingFee;

  const threshold = Number(freeShippingThreshold) || 0;
  const qualifiesForThreshold = threshold > 0 && cartAmount >= threshold;
  const isFree =
    cartAmount > 0 &&
    (shippingStatus === false ||
      Number(delivery_fee) === 0 ||
      qualifiesForThreshold);

  const amountNeeded =
    threshold > 0 ? Math.max(0, threshold - cartAmount) : 0;
  const progressPercent =
    threshold > 0 ? Math.min(100, (cartAmount / threshold) * 100) : 100;

  return (
    <div className="w-full">
      <div className="text-2xl mb-4">
        <Title text1={"CART"} text2={"TOTAL"} />
      </div>

      {/* Free Shipping Progress bar (Only when admin sets a threshold > 0) */}
      {threshold > 0 && cartAmount > 0 && (
        <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-teal-900 dark:text-teal-200">
              {qualifiesForThreshold ? (
                <span>🎉 You qualify for <b>FREE Shipping!</b></span>
              ) : (
                <span>
                  Add <b>{currency}{amountNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b> more for <b>FREE Shipping!</b>
                </span>
              )}
            </span>
            <span className="font-bold text-teal-700 dark:text-teal-400 text-[11px]">
              {qualifiesForThreshold
                ? "100%"
                : `${Math.round(progressPercent)}%`}
            </span>
          </div>
          <div className="w-full bg-teal-200/60 dark:bg-teal-900/60 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 dark:bg-teal-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
        {/* Subtotal */}
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

        {/* Shipping Fee */}
        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-800">
          <div>
            <p>Shipping Fee</p>
            {estimatedDelivery && (
              <span className="block text-[10px] text-gray-400">
                {estimatedDelivery}
              </span>
            )}
          </div>

          <div className="text-right">
            {cartAmount === 0 ? (
              <p className="font-semibold text-gray-900 dark:text-white">
                {currency}0.00
              </p>
            ) : isFree ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300">
                FREE
              </span>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                {currency}
                {currentShippingFee.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
          </div>
        </div>

        {/* Total Amount */}
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