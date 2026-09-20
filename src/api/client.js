import axios from "axios";
import { toast } from "react-toastify";

// Production backend URL fallback
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://fullstackbackend-wwiu.onrender.com";

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically inject customer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.token = token;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Clean Session & Network Handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected network error occurred.";

    // Handle 401 Unauthorized (Expired or Invalid Token)
    if (error.response?.status === 401) {
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
      }
    }

    // Prevents spamming warning popups on page loads
    return Promise.reject(new Error(message));
  }
);

export default apiClient;