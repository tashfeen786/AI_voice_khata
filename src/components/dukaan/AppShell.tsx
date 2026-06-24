import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Mic, Users, BarChart3, Bell, Search, Plus, Building2,
  CreditCard, Shield, UserCog, ChevronDown, Settings, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { TenantSwitcher } from "./TenantSwitcher";
import { useEffect, useState } from "react";
import { getKpis } from "@/lib/api/dashboard-api";
import type { DashboardKpisDto } from "@/lib/api/types";
import { useAuth } from "@/contexts/AuthContext";

const tenantNav = [
  { to: "/", icon: Home, label: "Ledger Summary", urdu: "لینجر", permission: undefined },
  { to: "/voice-inbox", icon: Mic, label: "Voice Inbox", urdu: "آواز", permission: "App.Sales.Create" },   // ✅ added back
  { to: "/customers", icon: Users, label: "Debtors", urdu: "ادھار دار", permission: "App.Customers" },
  { to: "/reports", icon: BarChart3, label: "Reports", urdu: "رپورٹس", permission: "App.Reports" },
];

const hostTopNav = [
  { to: "/host", icon: Building2, label: "Host Dashboard", urdu: "ہوسٹ ڈیش بورڈ" },
];

const hostSaaSNav = [
  { to: "/host/tenants", icon: Building2, label: "Tenants" },
  { to: "/host/editions", icon: CreditCard, label: "Editions" },
  { to: "/host/users", icon: UserCog, label: "Host Users" },
  { to: "/host/roles", icon: Shield, label: "Host Roles" },
  { to: "/host/settings", icon: Settings, label: "Settings" },
];

const tenantAdminNav = [
  { to: "/admin/users", icon: UserCog, label: "Users", permission: "App.MultiUser" as const },
  { to: "/admin/roles", icon: Shield, label: "Roles", permission: "App.MultiUser" as const },
  { to: "/admin/settings", icon: Settings, label: "Settings", permission: "App.Settings" as const },
  { to: "/admin/features", icon: Sparkles, label: "Features" },
];

function formatCurrency(amount: number): string {
  return "Rs " + amount.toLocaleString("en-IN");
}

export const AppShell = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isHost, hasPermission } = useAuth();
  
  const baseNav = isHost ? hostTopNav : tenantNav;
  const mainNav = baseNav.filter((n: any) => !n.permission || hasPermission(n.permission));
  const allItems = [...mainNav, ...hostSaaSNav, ...tenantAdminNav];
  const current = allItems.find(n => n.to === loc.pathname) ?? mainNav[0];
  
  const [kpis, setKpis] = useState<DashboardKpisDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saasOpen, setSaasOpen] = useState(loc.pathname.startsWith("/host") && loc.pathname !== "/host");
  const [adminOpen, setAdminOpen] = useState(loc.pathname.startsWith("/admin"));

  const visibleAdminNav = tenantAdminNav.filter(n => !n.permission || hasPermission(n.permission));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getKpis()
      .then(data => { if (mounted) setKpis(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-5 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
            <Mic className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none text-white">Voice Khata</div>
            <div className="text-[11px] text-sidebar-foreground/60 mt-1">AI · WhatsApp Ledger</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {mainNav.map(n => (
            <NavLink key={n.to} to={n.to} end
              className={({isActive}) => cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
              )}>
              <n.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{n.label}</span>
              <span className="font-urdu text-xs opacity-70">{n.urdu}</span>
            </NavLink>
          ))}

          {isHost && (
            <div className="mt-4 pt-4 border-t border-sidebar-border/60">
              <button
                type="button"
                onClick={() => setSaasOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
              >
                <span className="flex-1 text-left">SaaS Management</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !saasOpen && "-rotate-90")} />
              </button>
              {saasOpen && (
                <div className="flex flex-col gap-1 mt-1">
                  {hostSaaSNav.map(n => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end
                      className={({ isActive }) => cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                      )}
                    >
                      <n.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{n.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isHost && visibleAdminNav.length > 0 && (
            <div className="mt-4 pt-4 border-t border-sidebar-border/60">
              <button
                type="button"
                onClick={() => setAdminOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
              >
                <span className="flex-1 text-left">Admin</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !adminOpen && "-rotate-90")} />
              </button>
              {adminOpen && (
                <div className="flex flex-col gap-1 mt-1">
                  {visibleAdminNav.map(n => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end
                      className={({ isActive }) => cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                      )}
                    >
                      <n.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{n.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {!isHost && (
          <div className="rounded-2xl bg-sidebar-accent p-4 mt-4">
            <div className="text-xs text-sidebar-foreground/70">Today's voice entries</div>
            {loading ? (
              <Skeleton className="h-7 w-28 mt-1 bg-sidebar-foreground/20" />
            ) : (
              <div className="font-display text-xl font-bold text-white mt-1">
                {formatCurrency(kpis?.todaySales ?? 0)}
              </div>
            )}
            {loading ? (
              <Skeleton className="h-3 w-20 mt-1 bg-sidebar-foreground/10" />
            ) : (
              <div className={cn("text-[11px] mt-1", (kpis?.todaySalesChangePct ?? 0) >= 0 ? "text-primary-glow" : "text-red-400")}>
                {(kpis?.todaySalesChangePct ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(kpis?.todaySalesChangePct ?? 0).toFixed(1)}% vs yesterday
              </div>
            )}
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <div className="lg:hidden flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center">
                <Mic className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">Voice Khata</span>
            </div>

            <div className="hidden lg:flex flex-col">
              <h1 className="font-display text-xl font-bold leading-none">{current.label}</h1>
              {("urdu" in current) && (current as { urdu?: string }).urdu && (
                <span className="font-urdu text-xs text-muted-foreground mt-1">
                  {(current as { urdu?: string }).urdu}
                </span>
              )}
            </div>

            <div className="flex-1 max-w-md mx-auto hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search debtors, transactions…" className="pl-9 h-10 rounded-xl bg-secondary border-0" />
              </div>
            </div>

            {/* New Voice Entry button – only for tenants */}
            {!isHost && (
              <Button
                size="sm"
                onClick={() => navigate("/voice-inbox")}
                className="hidden sm:inline-flex rounded-xl gap-1.5 bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-glow">
                <Plus className="h-4 w-4" /> New Voice Entry
              </Button>
            )}

            <TenantSwitcher />
            <Button size="icon" variant="ghost" className="rounded-xl relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger animate-pulse-ring" />
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border">
          <div className="flex items-stretch justify-around px-2 py-1.5 safe-bottom">
            {mainNav.map(n => (
              <NavLink key={n.to} to={n.to} end
                className={({isActive}) => cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl min-w-[58px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                {({isActive}) => (
                  <>
                    <div className={cn("h-6 w-6 grid place-items-center rounded-lg transition-all", isActive && "bg-primary/15")}>
                      <n.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium">{n.label.split(" ")[0]}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};