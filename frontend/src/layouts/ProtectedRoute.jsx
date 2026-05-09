import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

