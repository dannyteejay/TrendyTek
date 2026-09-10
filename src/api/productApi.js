import apiClient from "./client";

export const productApi = {
  // Fetch full active product catalog
  getProducts: () => apiClient.get("/api/product/list"),

  // Fetch single product details
  getProductById: (productId) => apiClient.post("/api/product/single", { productId }),
};