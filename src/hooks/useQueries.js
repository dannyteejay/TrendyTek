import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productApi,
  categoryApi,
  contentApi,
  authApi,
  orderApi,
  cartApi,
} from "../api";

export const QUERY_KEYS = {
  products: ["products"],
  product: (id) => ["product", id],
  categories: ["categories"],
  settings: ["settings"],
  profile: ["profile"],
  orders: ["orders"],
  cart: ["cart"],
};

// 1. Products Query
export const useProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: async () => {
      const res = await productApi.getProducts();
      return res.products ? res.products.slice().reverse() : [];
    },
  });
};

// 2. Settings Query
export const useSettings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: async () => {
      const res = await contentApi.getSettings();
      return res.settings || {};
    },
  });
};

// 3. Categories Query
export const useCategories = () => {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      const res = await categoryApi.getCategories();
      return res.categories || [];
    },
  });
};

// 4. User Profile Query
export const useUserProfile = (token) => {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      const res = await authApi.getProfile();
      return res.user || null;
    },
    enabled: Boolean(token),
  });
};

// 5. Orders Query
export const useUserOrders = (token) => {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: async () => {
      const res = await orderApi.getUserOrders();
      return res.orders ? res.orders.slice().reverse() : [];
    },
    enabled: Boolean(token),
  });
};