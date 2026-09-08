import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import { toast } from "react-toastify";

const Orders = () => {
  const { backendUrl, token, currency, bankDetails } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedBankOrder, setExpandedBankOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadOrderData = async () => {
    try {
      if (!token) return null;
      setLoading(true);

      const response = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        let allOrdersItem = [];
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item["status"] = order.status;
            item["payment"] = order.payment;
            item["paymentMethod"] = order.paymentMethod;
            item["date"] = order.date;
            item["orderId"] = order._id;
            item["orderAmount"] = order.amount;
            allOrdersItem.push(item);
          });
        });
        setOrderData(allOrdersItem.reverse());
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info("Account number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t pt-16 pb-20 transition-colors duration-300">
      <div className="text-2xl mb-6">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400 animate-pulse">
          <div className="w-8 h-8 border-3 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading your orders...
        </div>
      ) : orderData.length === 0 ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-base font-semibold">You have not placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderData.map((item, index) => (
            <div
              key={index}
              className="py-5 px-4 sm:px-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs hover:shadow-xs transition-all"
            >
              {/* Left Column: Product Thumbnail + Details */}
              <div className="flex items-start gap-4 sm:gap-6 text-sm">
                <img
                  className="w-16 sm:w-20 object-contain rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 p-1"
                  src={
                    item.image && Array.isArray(item.image)
                      ? item.image[0]
                      : item.image
                  }
                  alt={item.name}
                />
                <div>
                  <p className="sm:text-base font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {currency}
                      {Number(item.price).toLocaleString()}
                    </p>
                    <p>Quantity: {item.quantity}</p>
                    <p className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded font-medium text-xs">
                      Size: {item.size}
                    </p>
                  </div>

                  <p className="mt-1.5 text-xs text-gray-400">
                    Date:{" "}
                    <span className="text-gray-600 dark:text-gray-300">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Payment Method:{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {item.paymentMethod}
                    </span>
                  </p>
                </div>
              </div>

              {/* Middle Column: Payment Status Badge */}
              <div className="flex flex-col gap-1 md:w-1/3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Payment Status
                </span>

                {item.payment ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 font-bold text-xs rounded-full w-fit">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    <span>Paid / Transfer Confirmed ✅</span>
                  </div>
                ) : item.paymentMethod === "Bank Transfer" ? (
                  <div className="flex flex-col gap-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-full w-fit">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Awaiting Transfer Verification ⏳</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBankOrder(
                          expandedBankOrder === item.orderId ? null : item.orderId
                        )
                      }
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold text-left mt-0.5 cursor-pointer"
                    >
                      {expandedBankOrder === item.orderId
                        ? "▲ Hide Bank Account Details"
                        : "▼ View Bank Details to Complete Transfer"}
                    </button>

                    {/* Expandable Bank Details Modal/Box */}
                    {expandedBankOrder === item.orderId && (
                      <div className="p-3 mt-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs flex flex-col gap-1.5 animate-fade-in">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Bank:</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {bankDetails?.bankName || "GTBank"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Account Name:</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {bankDetails?.accountName || "TRENDYTEK LTD"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded border border-blue-100 dark:border-slate-800">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                            {bankDetails?.accountNumber || "0123456789"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(bankDetails?.accountNumber || "0123456789")
                            }
                            className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded cursor-pointer"
                          >
                            {copied ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : item.paymentMethod === "COD" ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-full w-fit">
                    <span>💵 Pay on Delivery</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold text-xs rounded-full w-fit">
                    <span>🟡 Payment Pending</span>
                  </div>
                )}
              </div>

              {/* Right Column: Order Delivery Status & Track Button */}
              <div className="flex items-center justify-between md:justify-end gap-4 md:w-1/3">
                <div className="flex items-center gap-2">
                  <p
                    className={`min-w-2 h-2 rounded-full ${
                      item.status === "Delivered"
                        ? "bg-green-500"
                        : item.status === "Shipped" || item.status === "Out for delivery"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                  ></p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {item.status}
                  </p>
                </div>

                <button
                  onClick={loadOrderData}
                  className="border border-gray-300 dark:border-slate-700 px-4 py-2 text-xs font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-white transition-all cursor-pointer shadow-2xs"
                >
                  Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;