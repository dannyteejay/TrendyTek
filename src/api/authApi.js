import apiClient from "./client";

export const authApi = {
  // Register a new customer
  register: (data) => apiClient.post("/api/user/register", data),

  // Customer login
  login: (data) => apiClient.post("/api/user/login", data),

  // Request password reset OTP
  forgotPassword: (email) => apiClient.post("/api/user/forgot-password", { email }),

  // Reset password with OTP
  resetPassword: (data) => apiClient.post("/api/user/reset-password", data),

  // Fetch authenticated customer profile
  getProfile: () => apiClient.post("/api/user/get-profile"),

  // Update customer profile
  updateProfile: (data) => apiClient.post("/api/user/update-profile", data),
};