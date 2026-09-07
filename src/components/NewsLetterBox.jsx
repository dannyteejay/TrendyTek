import React, { useContext, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const NewsletterBox = () => {
  const { backendUrl } = useContext(ShopContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/newsletter/subscribe",
        { email: email.trim() }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setDiscountCode("WELCOME20");
        setEmail("");
      } else {
        toast.error(response.data.message || "Failed to subscribe");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyDiscountCode = () => {
    navigator.clipboard.writeText("WELCOME20");
    toast.info("Discount code WELCOME20 copied to clipboard!");
  };

  return (
    <div className="py-12 my-10 text-center">
      <h3 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Unlock 20% Off | Subscribe Today!
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-[500px] mx-auto">
        Don’t miss out—unlock your savings now by subscribing below!
      </p>

      {/* Subscription Form */}
      <form
        onSubmit={onSubmitHandler}
        className="flex items-center w-full sm:max-w-[560px] mx-auto mt-6 border border-gray-300 rounded-lg overflow-hidden shadow-xs focus-within:border-black transition-all bg-white"
      >
        <input
          className="w-full px-4 py-3 text-sm text-gray-700 outline-none sm:flex-1 placeholder:text-gray-400"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 text-xs font-bold tracking-wider text-white uppercase bg-black hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-60 flex-shrink-0"
        >
          {loading ? "SAVING..." : "SUBSCRIBE"}
        </button>
      </form>

      {/* Instant Coupon Code Reveal Box */}
      {discountCode && (
        <div className="inline-flex items-center gap-3 p-3 mt-4 text-xs font-semibold text-green-800 border border-green-300 bg-green-50 rounded-xl shadow-xs">
          <span>🎉 Use code at checkout for 20% OFF:</span>
          <span className="px-2.5 py-1 font-mono font-bold text-black bg-white border border-green-400 rounded-md tracking-wider">
            {discountCode}
          </span>
          <button
            onClick={copyDiscountCode}
            type="button"
            className="px-2.5 py-1 text-[11px] font-bold text-white bg-green-700 rounded hover:bg-green-800 transition-colors"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsletterBox;