import apiClient from "./client";

export const orderApi = {
  // Cash on delivery
  placeCodOrder: (orderData) => apiClient.post("/api/order/place", orderData),

  // Bank transfer order placement
  placeBankTransfer: (orderData) => apiClient.post("/api/order/bank-transfer", orderData),

  // Submit "I Have Paid" bank transfer claim
  markBankTransferPaid: (payload) => apiClient.post("/api/order/mark-paid", payload),

  // Initialize Paystack checkout
  placePaystack: (orderData) => apiClient.post("/api/order/paystack", orderData),

  // Verify Paystack reference server-side
  verifyPaystack: (reference) => apiClient.post("/api/order/verifyPaystack", { reference }),

  // Initialize Stripe Checkout session
  placeStripe: (orderData) => apiClient.post("/api/order/stripe", orderData),

  // Verify Stripe checkout session server-side
  verifyStripe: (sessionId) => apiClient.post("/api/order/verifyStripe", { sessionId }),

  // Initialize Crypto invoice
  placeCrypto: (orderData) => apiClient.post("/api/order/crypto", orderData),

  // Fetch customer orders
  getUserOrders: () => apiClient.post("/api/order/userorders"),
};