import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export const CustomerProtectedRoute = () => {
  const token = localStorage.getItem("token");

  // Redirect to login if unauthenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};