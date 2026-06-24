import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  permission?: string;
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, feature, children, fallback = null }: Props) {
  const { hasPermission, isFeatureEnabled } = useAuth();
  if (permission && !hasPermission(permission)) return <>{fallback}</>;
  if (feature && !isFeatureEnabled(feature)) return <>{fallback}</>;
  return <>{children}</>;
}