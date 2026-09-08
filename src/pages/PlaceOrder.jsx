import React, { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const navigate = useNavigate();

  const {
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
    bankDetails,
    paymentGateways,
  } = useContext(ShopContext);

  const [method, setMethod] = useState("paystack");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  // 🔒 Route Guard: Redirect guest to login and Auto-populate customer details
  useEffect(() => {
    if (!token) {
      toast.info("🔐 Please sign in or create an account to proceed to checkout", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login?redirect=place-order");
      return;
    }

    // Auto-populate customer profile details if available
    const savedName = localStorage.getItem("userName") || "";
    const savedEmail = localStorage.getItem("userEmail") || "";
    if (savedName || savedEmail) {
      const parts = savedName.trim().split(" ");
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || parts[0] || "",
        lastName: prev.lastName || parts.slice(1).join(" ") || "",
        email: prev.email || savedEmail || "",
      }));
    }
  }, [token, navigate]);

  // ⚡ Auto-Fallback: Automatically select first active gateway if current method is disabled
  useEffect(() => {
    if (paymentGateways) {
      const orderOfPreference = [
        "paystack",
        "stripe",
        "bank_transfer",
        "crypto",
        "cod",
      ];
      // If currently selected method is turned off in admin, switch to first active one
      if (paymentGateways[method] === false) {
        const firstAvailable = orderOfPreference.find(
          (m) => paymentGateways[m] !== false
        );
        if (firstAvailable) {
          setMethod(firstAvailable);
        }
      }
    }
  }, [paymentGateways, method]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const handleCopyAccount = (accountNo) => {
    if (!accountNo) return;
    navigator.clipboard.writeText(accountNo);
    setCopied(true);
    toast.info("Account number copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Please login to complete your order");
      navigate("/login?redirect=place-order");
      return;
    }

    try {
      let orderItems = [];

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items)
            );
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      if (orderItems.length === 0) {
        toast.error("Your cart is empty! Add products first.");
        return;
      }

      let orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + (delivery_fee || 10),
      };

      setLoading(true);

      switch (method) {
        // 1. PAYSTACK (Cards, Bank Transfer, USSD, Apple Pay)
        case "paystack": {
          const responsePaystack = await axios.post(
            backendUrl + "/api/order/paystack",
            orderData,
            { headers: { token } }
          );

          if (responsePaystack.data.success && responsePaystack.data.authorization_url) {
            toast.info("Redirecting to Paystack secure checkout...");
            window.location.replace(responsePaystack.data.authorization_url);
          } else {
            toast.error(
              responsePaystack.data.message ||
                "Paystack payment failed. Check PAYSTACK_SECRET_KEY in backend .env"
            );
          }
          break;
        }

        // 2. STRIPE (Credit / Debit Cards)
        case "stripe": {
          const responseStripe = await axios.post(
            backendUrl + "/api/order/stripe",
            orderData,
            { headers: { token } }
          );

          if (responseStripe.data.success && responseStripe.data.session_url) {
            toast.info("Redirecting to Stripe checkout...");
            window.location.replace(responseStripe.data.session_url);
          } else {
            toast.error(
              responseStripe.data.message ||
                "Stripe payment failed. Check STRIPE_SECRET_KEY in backend .env"
            );
          }
          break;
        }

        // 3. DIRECT BANK TRANSFER
        case "bank_transfer": {
          const responseBank = await axios.post(
            backendUrl + "/api/order/bank-transfer",
            orderData,
            { headers: { token } }
          );

          if (responseBank.data.success) {
            setCartItems({});
            toast.success("Order Placed! Please transfer payment to complete processing.");
            navigate("/orders");
          } else {
            toast.error(responseBank.data.message || "Failed to place order.");
          }
          break;
        }

        // 4. CRYPTOCURRENCY (NOWPayments)
        case "crypto": {
          const responseCrypto = await axios.post(
            backendUrl + "/api/order/crypto",
            orderData,
            { headers: { token } }
          );

          if (responseCrypto.data.success && responseCrypto.data.invoice_url) {
            toast.info("Redirecting to secure Cryptocurrency payment portal...");
            window.location.replace(responseCrypto.data.invoice_url);
          } else {
            toast.error(
              responseCrypto.data.message ||
                "Failed to generate crypto invoice. Check NOWPAYMENTS_API_KEY in backend .env"
            );
          }
          break;
        }

        // 5. CASH ON DELIVERY (COD)
        case "cod": {
          const responseCod = await axios.post(
            backendUrl + "/api/order/place",
            orderData,
            { headers: { token } }
          );

          if (responseCod.data.success) {
            setCartItems({});
            toast.success("Order Placed Successfully!");
            navigate("/orders");
          } else {
            toast.error(responseCod.data.message);
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Determine active states for each gateway
  const isPaystackActive = paymentGateways?.paystack !== false;
  const isStripeActive = paymentGateways?.stripe !== false;
  const isBankActive = paymentGateways?.bank_transfer !== false;
  const isCryptoActive = paymentGateways?.crypto !== false;
  const isCodActive = paymentGateways?.cod !== false;

  const anyGatewayActive =
    isPaystackActive ||
    isStripeActive ||
    isBankActive ||
    isCryptoActive ||
    isCodActive;

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col justify-between gap-8 pt-6 pb-20 border-t sm:flex-row min-h-[80vh] transition-colors duration-300"
    >
      {/* ---------- LEFT SIDE: DELIVERY INFORMATION ---------- */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="my-3 text-xl sm:text-2xl">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
            type="text"
            placeholder="First name"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
            type="text"
            placeholder="Last name"
          />
        </div>

        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
          type="email"
          placeholder="Email address"
        />

        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
          type="text"
          placeholder="Street address"
        />

        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
            type="text"
            placeholder="City"
          />
          <input
            required
            onChange={onChangeHandler}
            name="state"
            value={formData.state}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
            type="text"
            placeholder="State / Province"
          />
        </div>

        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="zipcode"
            value={formData.zipcode}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
            type="text"
            placeholder="Zipcode / Postal code"
          />
          <input
            required
            onChange={onChangeHandler}
            name="country"
            value={formData.country}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
            type="text"
            placeholder="Country"
          />
        </div>

        <input
          required
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white text-sm"
          type="tel"
          placeholder="Phone number"
        />
      </div>

      {/* ---------- RIGHT SIDE: TOTAL & PAYMENT METHOD ---------- */}
      <div className="mt-8 sm:mt-0 w-full sm:max-w-[480px]">
        <div className="mt-2 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />

          {!anyGatewayActive ? (
            <div className="p-4 mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-xl text-xs">
              ⚠️ Payment processing is temporarily undergoing maintenance. Please check back shortly.
            </div>
          ) : (
            /* Dynamic Payment Gateway Selection Cards */
            <div className="flex flex-col gap-3 mt-4">
              {/* 1. PAYSTACK */}
              {isPaystackActive && (
                <div
                  onClick={() => setMethod("paystack")}
                  className={`p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all ${
                    method === "paystack"
                      ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/20 shadow-sm"
                      : "border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          method === "paystack"
                            ? "border-teal-500 bg-teal-500"
                            : "border-gray-300 dark:border-slate-600"
                        }`}
                      >
                        {method === "paystack" && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        )}
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>💳</span> Paystack (Cards / Transfer / USSD)
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Mastercard, Visa, Verve, Bank Transfer & Apple Pay
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded">
                      Popular
                    </span>
                  </div>
                </div>
              )}

              {/* 2. STRIPE */}
              {isStripeActive && (
                <div
                  onClick={() => setMethod("stripe")}
                  className={`p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all ${
                    method === "stripe"
                      ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/20 shadow-sm"
                      : "border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          method === "stripe"
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-300 dark:border-slate-600"
                        }`}
                      >
                        {method === "stripe" && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        )}
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>💳</span> Stripe (Credit / Debit Card)
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          International Visa, Mastercard & Amex
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                      Global
                    </span>
                  </div>
                </div>
              )}

              {/* 3. DIRECT BANK TRANSFER */}
              {isBankActive && (
                <div
                  onClick={() => setMethod("bank_transfer")}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    method === "bank_transfer"
                      ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/20 shadow-sm"
                      : "border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          method === "bank_transfer"
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300 dark:border-slate-600"
                        }`}
                      >
                        {method === "bank_transfer" && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        )}
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>🏛️</span> Direct Bank Transfer
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Transfer directly to our store bank account
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      Instant Details
                    </span>
                  </div>

                  {/* Bank Details Box */}
                  {method === "bank_transfer" && (
                    <div className="mt-3.5 p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-900/50 text-xs flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Bank Name:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {bankDetails?.bankName || "Guaranty Trust Bank (GTBank)"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Account Name:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {bankDetails?.accountName || "TRENDYTEK ENTERPRISES LIMITED"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-2 rounded-md">
                        <div>
                          <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                            Account Number:
                          </span>
                          <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                            {bankDetails?.accountNumber || "0123456789"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAccount(bankDetails?.accountNumber || "0123456789");
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded transition-all cursor-pointer"
                        >
                          {copied ? "✓ Copied" : "📋 Copy"}
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mt-0.5">
                        💡 {bankDetails?.bankInstructions || "Please use your Order Name as payment reference."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. CRYPTOCURRENCY */}
              {isCryptoActive && (
                <div
                  onClick={() => setMethod("crypto")}
                  className={`flex items-center justify-between p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all ${
                    method === "crypto"
                      ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/20 shadow-sm"
                      : "border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        method === "crypto"
                          ? "border-amber-500 bg-amber-500"
                          : "border-gray-300 dark:border-slate-600"
                      }`}
                    >
                      {method === "crypto" && (
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      )}
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>🪙</span> Cryptocurrency (USDT, BTC, ETH)
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Instant checkout with 300+ coins
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      USDT
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded">
                      BTC
                    </span>
                  </div>
                </div>
              )}

              {/* 5. CASH ON DELIVERY */}
              {isCodActive && (
                <div
                  onClick={() => setMethod("cod")}
                  className={`flex items-center justify-between p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all ${
                    method === "cod"
                      ? "border-black dark:border-white bg-gray-100 dark:bg-slate-800 shadow-sm"
                      : "border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        method === "cod"
                          ? "border-black dark:border-white bg-black dark:bg-white"
                          : "border-gray-300 dark:border-slate-600"
                      }`}
                    >
                      {method === "cod" && (
                        <span className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full"></span>
                      )}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      💵 CASH ON DELIVERY
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Place Order CTA Button */}
          <div className="w-full text-end mt-8">
            <button
              type="submit"
              disabled={loading || !anyGatewayActive}
              className={`w-full sm:w-auto px-10 py-3.5 text-xs sm:text-sm font-bold tracking-wider text-white uppercase transition-all bg-black dark:bg-white dark:text-black rounded-xl shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 cursor-pointer ${
                loading || !anyGatewayActive ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Processing Order..." : "PLACE ORDER &rarr;"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;