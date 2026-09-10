import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

export const AdminProtectedRoute = ({ requiredPermission }) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decoded = parseJwt(token);

  // Check if token is expired
  if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
    localStorage.removeItem("adminToken");
    return <Navigate to="/login" replace />;
  }

  // Check granular permission for UI display
  if (requiredPermission && decoded.permissions) {
    const hasAccess =
      decoded.permissions.includes("*") ||
      decoded.permissions.includes(requiredPermission);

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};