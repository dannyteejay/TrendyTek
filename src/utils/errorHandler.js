import { toast } from "react-toastify";

/**
 * Normalizes any error (AxiosError, JavaScript Error, or Network Drop)
 * into a predictable, clean structure.
 */
export const normalizeApiError = (error) => {
  // 1. If error is already a normalized structure
  if (error && typeof error === "object" && error.success === false && error.message) {
    return {
      success: false,
      message: error.message,
      statusCode: error.statusCode || 400,
      fieldErrors: error.fieldErrors || null,
    };
  }

  // 2. Axios Response Errors
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    let message = data?.message || data?.error || "A server error occurred.";
    let fieldErrors = data?.errors || null;

    if (status === 400) {
      message = message || "Invalid request. Please verify your inputs.";
    } else if (status === 401) {
      message = "Your session has expired. Please log in again.";
    } else if (status === 403) {
      message = "You do not have permission to perform this action.";
    } else if (status === 404) {
      message = message || "The requested resource was not found.";
    } else if (status === 429) {
      message = message || "Too many requests. Please slow down and wait a moment.";
    } else if (status >= 500) {
      message = "Internal server error. Please try again later.";
    }

    return {
      success: false,
      message,
      statusCode: status,
      fieldErrors,
    };
  }

  // 3. Network Offline / Timeout
  if (error?.request && !error?.response) {
    return {
      success: false,
      message: "Network error: Unable to connect to server. Check your internet connection.",
      statusCode: 0,
      fieldErrors: null,
    };
  }

  // 4. General JavaScript Error
  return {
    success: false,
    message: error?.message || "An unexpected error occurred.",
    statusCode: 500,
    fieldErrors: null,
  };
};

/**
 * Global Toast Dispatcher with automatic deduplication
 */
export const handleApiErrorToast = (error) => {
  const normalized = normalizeApiError(error);

  if (normalized.statusCode === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userImage");
  }

  toast.error(normalized.message, {
    toastId: normalized.message, // Prevents duplicate spamming
    position: "top-right",
    autoClose: 4000,
  });

  return normalized;
};