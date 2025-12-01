import { Navigate } from "react-router";
import { isAuthenticated } from "../helpers/storage";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}