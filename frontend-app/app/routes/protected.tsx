import { Navigate, Outlet } from "react-router";
import { isAuthenticated } from "../helpers/storage";

export default function ProtectedLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Outlet renders the child routes (like chat)
  return <Outlet />;
}