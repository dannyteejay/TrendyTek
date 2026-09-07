import React, { useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Verify = () => {
  const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext);
  const [searchParams] = useSearchParams();
  const localNavigate = useNavigate();
  const actualNavigate = navigate || localNavigate;

  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const paymentMethod = searchParams.get("paymentMethod");
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const verifyPayment = async () => {
    try {
      if (!token) {
        return null;
      }

      // 1. Verify Paystack
      if (paymentMethod === "paystack") {
        const response = await axios.post(
          backendUrl + "/api/order/verifyPaystack",
          { success, orderId, reference },
          { headers: { token } }
        );

        if (response.data.success) {
          setCartItems({});
          toast.success("💳 Paystack Payment Confirmed! Order placed.");
          actualNavigate("/orders");
        } else {
          toast.error("Paystack payment was not successful.");
          actualNavigate("/cart");
        }
        return;
      }

      // 2. Verify Crypto
      if (paymentMethod === "crypto") {
        const response = await axios.post(
          backendUrl + "/api/order/verifyCrypto",
          { success, orderId },
          { headers: { token } }
        );

        if (response.data.success) {
          setCartItems({});
          toast.success("🪙 Cryptocurrency payment confirmed! Order placed.");
          actualNavigate("/orders");
        } else {
          toast.warning("Crypto payment pending. You can check status in Orders.");
          actualNavigate("/orders");
        }
        return;
      }

      // 3. Verify Stripe
      if (paymentMethod === "stripe") {
        const response = await axios.post(
          backendUrl + "/api/order/verifyStripe",
          { success, orderId },
          { headers: { token } }
        );

        if (response.data.success) {
          setCartItems({});
          toast.success("💳 Stripe Payment Successful! Order placed.");
          actualNavigate("/orders");
        } else {
          toast.error("Stripe Payment Failed.");
          actualNavigate("/cart");
        }
        return;
      }

      actualNavigate("/orders");
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Payment verification failed");
      actualNavigate("/cart");
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [token]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-14 h-14 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
        Verifying your payment, please do not close this window...
      </p>
    </div>
  );
};

export default Verify;