import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Redirects host users to /host dashboard
 * Tenant users see the regular / dashboard
 */
export const DashboardRedirect = () => {
  const { isHost, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // Host users go to host dashboard, tenants go to regular dashboard
  if (isHost) {
    return <Navigate to="/host" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};
