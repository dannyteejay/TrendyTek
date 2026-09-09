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

  const orderId = searchParams.get("orderId");
  const paymentMethod = searchParams.get("paymentMethod");
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const sessionId = searchParams.get("sessionId") || searchParams.get("session_id");
  const paymentId = searchParams.get("paymentId") || searchParams.get("payment_id");
  const cancelled = searchParams.get("cancelled") === "true";

  const verifyPayment = async () => {
    try {
      if (!token) {
        return null;
      }

      if (cancelled) {
        toast.error("Payment was cancelled.");
        actualNavigate("/cart");
        return;
      }

      // 1. Verify Paystack Payment (Server Queries Paystack API)
      if (paymentMethod === "paystack") {
        if (!reference) {
          toast.error("Missing Paystack transaction reference.");
          actualNavigate("/cart");
          return;
        }

        const response = await axios.post(
          backendUrl + "/api/order/verifyPaystack",
          { orderId, reference },
          { headers: { token } }
        );

        if (response.data.success) {
          setCartItems({});
          toast.success("💳 Paystack Payment Confirmed! Order placed.");
          actualNavigate("/orders");
        } else {
          toast.error(response.data.message || "Paystack payment verification failed.");
          actualNavigate("/cart");
        }
        return;
      }

      // 2. Verify Stripe Payment (Server Queries Stripe API via Session ID)
      if (paymentMethod === "stripe") {
        if (!sessionId) {
          toast.error("Missing Stripe session identifier.");
          actualNavigate("/cart");
          return;
        }

        const response = await axios.post(
          backendUrl + "/api/order/verifyStripe",
          { orderId, sessionId },
          { headers: { token } }
        );

        if (response.data.success) {
          setCartItems({});
          toast.success("💳 Stripe Payment Successfully Verified! Order placed.");
          actualNavigate("/orders");
        } else {
          toast.error(response.data.message || "Stripe payment failed or was not completed.");
          actualNavigate("/cart");
        }
        return;
      }

      // 3. Verify NOWPayments Crypto Payment
      if (paymentMethod === "crypto") {
        const response = await axios.post(
          backendUrl + "/api/order/verifyCrypto",
          { orderId, paymentId },
          { headers: { token } }
        );

        if (response.data.success) {
          setCartItems({});
          toast.success("🪙 Cryptocurrency payment confirmed! Order placed.");
          actualNavigate("/orders");
        } else {
          toast.info("Crypto transaction submitted. Awaiting blockchain confirmation.");
          actualNavigate("/orders");
        }
        return;
      }

      // Default fallback
      actualNavigate("/orders");
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error(error.response?.data?.message || error.message || "Payment verification failed");
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
        Verifying your payment with gateway, please wait...
      </p>
    </div>
  );
};

export default Verify;