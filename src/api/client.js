import axios from "axios";
import { toast } from "react-toastify";

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:4000",
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
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized Error & Session Handling
apiClient.interceptors.response.use(
  (response) => response.data,
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
    } else if (error.response?.status === 429) {
      toast.warning("Too many requests. Please slow down.");
    } else if (error.response) {
      toast.error(message);
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;