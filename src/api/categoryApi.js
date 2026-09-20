import apiClient from "./client";

export const categoryApi = {
  // Fetch active categories list
  getCategories: () => apiClient.get("/api/category/list"),
};