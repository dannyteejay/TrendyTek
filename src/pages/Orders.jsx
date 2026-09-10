import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { useUserOrders } from "../hooks/useQueries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "../api";
import { toast } from "react-toastify";

const Orders = () => {
  const { token, currency } = useContext(ShopContext);
  const queryClient = useQueryClient();

  // 1. Fetch Orders with TanStack Query (Zero boilerplate!)
  const { data: orders = [], isLoading, isError, refetch } = useUserOrders(token);

  // Bank Transfer "I Have Paid" modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [senderName, setSenderName] = useState("");
  const [narration, setNarration] = useState("");

  // 2. TanStack Query Mutation: Automatically invalidates & refetches orders on success!
  const markPaidMutation = useMutation({
    mutationFn: (payload) => orderApi.markBankTransferPaid(payload),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Payment notification submitted! Admin will verify shortly.");
        setSelectedOrder(null);
        setSenderName("");
        setNarration("");
        // Instantly refresh orders in cache
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.error(data.message || "Failed to update payment status.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Submission failed. Please try again.");
    },
  });

  const handleBankTransferSubmit = (e) => {
    e.preventDefault();
    if (!senderName.trim()) {
      toast.error("Please enter the sender's account name");
      return;
    }
    markPaidMutation.mutate({
      orderId: selectedOrder._id,
      senderName: senderName.trim(),
      narration: narration.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="border-t pt-16 min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-t pt-16 text-center">
        <p className="text-red-500 font-medium">Failed to load orders.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="border-t pt-16">
      <div className="text-2xl mb-3">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-start gap-6 text-sm">
                <img
                  className="w-16 sm:w-20 rounded"
                  src={order.items[0]?.image[0] || ""}
                  alt={order.items[0]?.name || "Product"}
                />
                <div>
                  <p className="sm:text-base font-semibold text-gray-900">
                    {order.items[0]?.name}{" "}
                    {order.items.length > 1 && `+ ${order.items.length - 1} more item(s)`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-base text-gray-700">
                    <p className="font-medium">
                      {currency}
                      {order.amount}
                    </p>
                    <p>Quantity: {order.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
                    <p>Method: <span className="font-medium uppercase">{order.paymentMethod}</span></p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Date: <span className="text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Order ID: <span className="font-mono text-gray-600">#{order._id.slice(-8)}</span>
                  </p>
                </div>
              </div>

              <div className="md:w-1/2 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`min-w-2.5 h-2.5 rounded-full ${
                      order.status === "Delivered"
                        ? "bg-green-500"
                        : order.status === "Shipped"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                  ></span>
                  <p className="text-sm md:text-base font-medium">{order.status}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  {/* Bank Transfer "I Have Paid" Action */}
                  {order.paymentMethod === "Bank Transfer" && !order.payment && (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="border px-3 py-1.5 text-xs font-semibold rounded bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      {order.transferDetails?.submitted ? "Update Payment Info" : "I Have Paid"}
                    </button>
                  )}

                  <button
                    onClick={() => refetch()}
                    className="border px-4 py-2 text-sm font-medium rounded-sm hover:bg-gray-50"
                  >
                    Track Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bank Transfer Proof Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Bank Transfer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order <span className="font-mono font-bold">#{selectedOrder._id.slice(-8)}</span> • Total:{" "}
              <span className="font-bold text-gray-900">
                {currency}
                {selectedOrder.amount}
              </span>
            </p>

            <form onSubmit={handleBankTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Sender Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Payment Narration / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TR-98234 or your phone number"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markPaidMutation.isPending}
                  className="flex-1 py-2 bg-black text-white rounded text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {markPaidMutation.isPending ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;