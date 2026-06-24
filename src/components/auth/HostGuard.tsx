import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldOff } from "lucide-react";

interface Props {
  children: ReactNode;
  requiredPermission?: string;
}

/**
 * Restricts a route to HOST users (currentUser.tenantId === null).
 * Optionally also checks a specific Host.* permission.
 * Must be wrapped inside <ProtectedRoute> for authentication.
 */
export function HostGuard({ children, requiredPermission }: Props) {
  const { isHost, hasPermission } = useAuth();

  if (!isHost) return <Denied reason="host" />;
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Denied reason="permission" />;
  }
  return <>{children}</>;
}

function Denied({ reason }: { reason: "host" | "permission" }) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-danger/10 text-danger grid place-items-center mb-4">
          <ShieldOff className="h-7 w-7" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Host access only</h2>
        <p className="text-sm text-muted-foreground">
          {reason === "host"
            ? "This area is reserved for SaaS platform administrators."
            : "You don't have the required host permission to view this page."}
        </p>
      </div>
    </div>
  );
}
