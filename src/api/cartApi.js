import apiClient from "./client";

export const cartApi = {
  // Retrieve authenticated customer cart
  getCart: () => apiClient.post("/api/cart/get"),

  // Add item to cart with size
  addToCart: (itemId, size) => apiClient.post("/api/cart/add", { itemId, size }),

  // Update item quantity
  updateCart: (itemId, size, quantity) =>
    apiClient.post("/api/cart/update", { itemId, size, quantity }),
};