import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, CreditCard, Sparkles, TrendingUp, Users, Plus, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getTenants } from "@/lib/api/host-tenants-api";
import { getAllEditions } from "@/lib/api/editions-api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const PALETTE = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--primary-glow))", "hsl(var(--destructive))"];

export default function HostDashboard() {
  const { profile } = useAuth();
  const { data: tenants, isLoading: t1 } = useQuery({
    queryKey: ["host", "tenants", "all"],
    queryFn: () => getTenants({ maxResultCount: 1000 }),
  });
  const { data: editions, isLoading: t2 } = useQuery({
    queryKey: ["host", "editions", "all"],
    queryFn: getAllEditions,
  });

  const isLoading = t1 || t2;
  const total = tenants?.totalCount ?? 0;
  const items = tenants?.items ?? [];
  const active = items.filter(t => t.isActive !== false).length;

  const editionPriceMap: Record<string, number> = {
    Free: 0, Standard: 999, Premium: 2499,
  };

  const byEdition: Record<string, number> = {};
  items.forEach(t => {
    const key = t.editionName ?? "No edition";
    byEdition[key] = (byEdition[key] ?? 0) + 1;
  });

  const pieData = Object.entries(byEdition).map(([name, value]) => ({ name, value }));
  const mrr = items.reduce((sum, t) => sum + (editionPriceMap[t.editionName ?? ""] ?? 0), 0);

  const thisMonth = items.filter(t => {
    if (!t.creationTime) return false;
    const d = new Date(t.creationTime);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ✅ Host KPIs – no voice entries, only tenant management stats
  const kpis = [
    { label: "Total Tenants", value: total, icon: Building2, accent: "from-primary to-primary-deep" },
    { label: "Active Tenants", value: active, icon: TrendingUp, accent: "from-emerald-500 to-emerald-700" },
    { label: "Estimated MRR", value: `Rs ${mrr.toLocaleString("en-PK")}`, icon: CreditCard, accent: "from-info to-blue-700" },
    { label: "New this month", value: thisMonth, icon: Sparkles, accent: "from-warning to-orange-600" },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="rounded-3xl bg-gradient-hero border border-border/60 p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-0 mb-3">
              SaaS Platform · Host
            </Badge>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">
              Assalam-o-Alaikum, {profile?.name ?? "Admin"} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage tenants, editions and platform features.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glow gap-2">
              <Link to="/host/tenants"><Plus className="h-4 w-4" /> Create Tenant</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <Link to="/host/editions"><CreditCard className="h-4 w-4" /> Manage Editions</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Grid - Host only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="rounded-2xl p-4 lg:p-5 border-border/60 shadow-soft hover:shadow-elevated transition-all relative overflow-hidden">
            <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.accent)} />
            <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br grid place-items-center text-white shadow-soft", k.accent)}>
              <k.icon className="h-5 w-5" />
            </div>
            <div className="mt-4">
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="font-display text-2xl lg:text-3xl font-bold tracking-tight">{k.value}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 rounded-2xl p-5 lg:p-6 border-border/60 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg">Recent Tenants</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest signups on the platform</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/host/tenants" className="gap-1">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            {!isLoading && items.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.editionName ?? "No edition"} ·{" "}
                    {t.creationTime ? new Date(t.creationTime).toLocaleDateString() : "—"}
                  </div>
                </div>
                <Badge variant={t.isActive === false ? "secondary" : "default"} className="rounded-full">
                  {t.isActive === false ? "Inactive" : "Active"}
                </Badge>
              </div>
            ))}
            {!isLoading && items.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">No tenants yet</div>
            )}
          </div>
        </Card>

        <Card className="rounded-2xl p-5 lg:p-6 border-border/60 shadow-soft">
          <h3 className="font-display font-semibold text-lg">By Edition</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">Tenants per edition</p>
          <div className="h-56">
            {pieData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} innerRadius={40}>
                    {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-xs text-muted-foreground pt-3">
            {editions?.length ?? 0} edition{editions?.length === 1 ? "" : "s"} configured
          </div>
        </Card>
      </div>
    </div>
  );
}