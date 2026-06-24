import { useEffect, useState } from "react";
import { Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { listTenants, TenantDto } from "@/lib/api/auth-api";
import { tokenStore } from "@/lib/api/token-store";

export function TenantSwitcher() {
  const { isHost, setTenant, tenant } = useAuth();
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const active = tenant?.id ?? tokenStore.getTenant();

  useEffect(() => {
    if (isHost) listTenants().then(setTenants).catch(() => {});
  }, [isHost]);

  if (!isHost) return null;

  const activeName = tenants.find(t => t.id === active)?.name ?? "Host view";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-2 hidden md:inline-flex">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="max-w-[140px] truncate">{activeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel>Switch shop / tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTenant(null)} className="cursor-pointer">
          {!active && <Check className="h-4 w-4 mr-2 text-primary" />}
          <span className={active ? "ml-6" : ""}>Host view (platform owner)</span>
        </DropdownMenuItem>
        {tenants.map(t => (
          <DropdownMenuItem key={t.id} onClick={() => setTenant(t)} className="cursor-pointer">
            {active === t.id && <Check className="h-4 w-4 mr-2 text-primary" />}
            <span className={active === t.id ? "" : "ml-6"}>{t.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}