import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldOff } from "lucide-react";

interface Props {
  children: ReactNode;
  requiredPermission?: string;
  requiredFeature?: string;
}

export function ProtectedRoute({ children, requiredPermission, requiredFeature }: Props) {
  const { isAuthenticated, isLoading, hasPermission, isFeatureEnabled } = useAuth();
  const loc = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied />;
  }

  if (requiredFeature && !isFeatureEnabled(requiredFeature)) {
    return <AccessDenied feature />;
  }

  return <>{children}</>;
}

function AccessDenied({ feature }: { feature?: boolean }) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-danger/10 text-danger grid place-items-center mb-4">
          <ShieldOff className="h-7 w-7" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Access denied</h2>
        <p className="text-sm text-muted-foreground">
          {feature
            ? "This feature isn't enabled for your shop. Please contact your administrator."
            : "You don't have permission to view this page."}
        </p>
      </div>
    </div>
  );
}