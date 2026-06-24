import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, TrendingUp, Wallet, Users, Mic, AlertTriangle, MessageCircle, Sparkles, ChevronRight, ArrowDownRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  getKpis,
  getHourlySalesTrend,
  getDailySalesTrend,
  getLowStockAlerts,
  getTopDebtors,
  getRecentSales,
} from "@/lib/api/dashboard-api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) => "Rs " + n.toLocaleString("en-PK");

const Dashboard = () => {
  const { profile, hasPermission, isFeatureEnabled } = useAuth();
  const navigate = useNavigate();
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: getKpis,
    refetchInterval: 60000,
  });

  const { data: hourlyTrend, isLoading: hourlyLoading } = useQuery({
    queryKey: ["dashboard", "hourly-trend"],
    queryFn: getHourlySalesTrend,
  });

  const { data: dailyTrend, isLoading: dailyLoading } = useQuery({
    queryKey: ["dashboard", "daily-trend"],
    queryFn: getDailySalesTrend,
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: getLowStockAlerts,
  });

  const { data: topDebtorsData, isLoading: debtorsLoading } = useQuery({
    queryKey: ["dashboard", "top-debtors"],
    queryFn: getTopDebtors,
  });

  const { data: recentSalesData, isLoading: salesLoading } = useQuery({
    queryKey: ["dashboard", "recent-sales"],
    queryFn: getRecentSales,
  });

  const kpis = kpisData ? [
    { label: "Today's Debits", urdu: "آج کے اُدھار", value: kpisData.todaySales, change: `+${kpisData.todaySalesChangePct?.toFixed(1) || 0}%`, up: true, icon: TrendingUp, accent: "from-primary to-primary-deep" },
    { label: "Pending Udhaar", urdu: "بقایا اُدھار", value: kpisData.pendingUdhaar, change: `${kpisData.pendingUdhaarCustomerCount || 0} debtors`, up: false, icon: Wallet, accent: "from-warning to-orange-600" },
    { label: "Voice Entries Today", urdu: "آج کی آوازیں", value: kpisData.todayOrders || 0, change: `+${(kpisData.todaySalesChangePct || 0).toFixed(1)}%`, up: true, icon: Mic, accent: "from-emerald-500 to-emerald-700" },
    { label: "New Debtors", urdu: "نئے ادھار دار", value: kpisData.newCustomersToday || 0, change: "+today", up: true, icon: Users, accent: "from-info to-blue-700", isCount: true },
  ] : [];

  const todaySalesChart = hourlyTrend?.map(p => ({ h: p.hour, v: p.value })) || [];
  const weekSalesChart = dailyTrend?.map(p => ({ d: p.day.slice(0, 3), v: p.value })) || [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero greeting */}
      <div className="rounded-3xl bg-gradient-hero border border-border/60 p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              LIVE · {dateStr}
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-balance">
              Assalam-o-Alaikum, {profile?.name?.split(" ")[0] || "User"} 👋
            </h1>
            <p className="font-urdu text-base text-muted-foreground mt-1">آواز سے کھاتہ اپ ڈیٹ کریں</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/voice-inbox")} className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glow gap-2">
              <Mic className="h-4 w-4" /> New Voice Entry
            </Button>
            {isFeatureEnabled("App.WhatsAppNotifications") && (
              <Button variant="outline" onClick={() => navigate("/customers")}
                className="rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <MessageCircle className="h-4 w-4" /> Send Reminders
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpisLoading && Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
        {!kpisLoading && kpis.map((k, i) => (
          <Card key={i} className="rounded-2xl p-4 lg:p-5 border-border/60 shadow-soft hover:shadow-elevated transition-all relative overflow-hidden group">
            <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.accent)} />
            <div className="flex items-start justify-between relative">
              <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br grid place-items-center text-white shadow-soft", k.accent)}>
                <k.icon className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className={cn("rounded-full text-[10px] gap-0.5 font-semibold border-0",
                k.up ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground")}>
                {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.change}
              </Badge>
            </div>
            <div className="mt-4 relative">
              <div className="font-display text-2xl lg:text-3xl font-bold tracking-tight">
                {k.isCount ? k.value : fmt(k.value)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>{k.label}</span>
                <span className="font-urdu text-[11px]">· {k.urdu}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 rounded-2xl p-5 lg:p-6 border-border/60 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg">Today's Voice Debits Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-urdu">آج کے ادھار کا رجحان</p>
            </div>
            <div className="flex gap-1 p-1 bg-secondary rounded-xl text-xs">
              <button className="px-3 py-1.5 rounded-lg bg-card font-semibold shadow-soft">Today</button>
              <button className="px-3 py-1.5 rounded-lg text-muted-foreground">Week</button>
              <button className="px-3 py-1.5 rounded-lg text-muted-foreground">Month</button>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={todaySalesChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="h" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, boxShadow: "var(--shadow-elevated)" }}
                  formatter={(v: number) => [fmt(v), "Debit"]}
                />
                <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 lg:p-6 border-border/60 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg">This Week</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-urdu">اِس ہفتے</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekSalesChart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                  formatter={(v: number) => [fmt(v), "Debit"]}
                  cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                />
                <Bar dataKey="v" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Three columns: low stock / top debtors / recent voice entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Low stock (optional) */}
        {hasPermission("App.Products.ManageStock") && (
        <Card className="rounded-2xl p-5 border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-danger/10 grid place-items-center">
                <AlertTriangle className="h-4 w-4 text-danger" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Low Stock</h3>
                <p className="text-[11px] text-muted-foreground font-urdu">اسٹاک کم ہے</p>
              </div>
            </div>
            <Badge className="bg-danger/10 text-danger hover:bg-danger/15 border-0 rounded-full">{lowStockData?.length || 0}</Badge>
          </div>
          <div className="space-y-2.5">
            {lowStockLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            {!lowStockLoading && lowStockData?.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">All stocked up! 🎉</div>
            )}
            {lowStockData?.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/60 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="font-urdu text-[11px] text-muted-foreground truncate">{p.urduName}</div>
                </div>
                <div className={cn("text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg",
                  p.stock === 0 ? "bg-danger text-danger-foreground" : "bg-warning/15 text-warning-foreground")}>
                  {p.stock} left
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate("/inventory")} variant="ghost" className="w-full mt-3 rounded-xl text-primary hover:bg-primary/5 justify-between">
            Reorder all <ChevronRight className="h-4 w-4" />
          </Button>
        </Card>
        )}

        {/* Top debtors */}
        <Card className="rounded-2xl p-5 border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-warning/15 grid place-items-center">
                <Wallet className="h-4 w-4 text-warning" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Top Debtors</h3>
                <p className="text-[11px] text-muted-foreground font-urdu">سب سے زیادہ اُدھار</p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {topDebtorsData?.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors">
                <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold shrink-0">
                  {c.name.split(" ").map(s=>s[0]).slice(0,2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-danger tabular-nums">{fmt(c.due)}</div>
                  <div className="text-[10px] text-muted-foreground">{c.lastPaid || "-"}</div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={() => navigate("/customers")}
            className="w-full mt-3 rounded-xl text-primary hover:bg-primary/5 justify-between">
            Send WhatsApp reminder <MessageCircle className="h-4 w-4" />
          </Button>
        </Card>

        {/* Recent voice entries (sales) */}
        <Card className="rounded-2xl p-5 border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center">
                <Mic className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Recent Voice Entries</h3>
                <p className="text-[11px] text-muted-foreground font-urdu">حالیہ آواز اندراجات</p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {salesLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            {!salesLoading && recentSalesData?.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">No voice entries yet</div>
            )}
            {recentSalesData?.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/60 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {s.customerName}
                    {s.paymentType === "udhaar" && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground">Udhaar</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{s.invoiceNumber} · {s.itemCount} items · {new Date(s.saleTime).toLocaleTimeString()}</div>
                </div>
                <div className="text-sm font-bold tabular-nums">{fmt(s.total)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI insight strip */}
      {isFeatureEnabled("App.AIInsights") && (
      <Card className="rounded-2xl p-5 lg:p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-soft relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex items-start gap-4 relative">
          <div className="h-11 w-11 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Insight</span>
              <span className="font-urdu text-[11px] text-muted-foreground">· مشورہ</span>
            </div>
            <p className="text-sm lg:text-base font-medium text-balance">
              Most voice debits come between 6–8 PM. Remind top debtors before Eid.
              <span className="block font-urdu text-sm text-muted-foreground mt-1.5">زیادہ تر ادھار شام کو ہوتا ہے۔</span>
            </p>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5 shrink-0 hidden sm:inline-flex">
            View all <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </Card>
      )}
    </div>
  );
};

export default Dashboard;