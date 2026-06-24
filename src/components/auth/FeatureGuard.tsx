import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGuard({ feature, children, fallback = null }: Props) {
  const { isFeatureEnabled } = useAuth();
  return isFeatureEnabled(feature) ? <>{children}</> : <>{fallback}</>;
}