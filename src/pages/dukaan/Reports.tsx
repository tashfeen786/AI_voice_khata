import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, FileSpreadsheet, TrendingUp, Wallet, Calendar as CalendarIcon, ArrowUpRight, MessageCircle, Loader2, Mic } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getReportKpis, getMonthlySales, getCategorySales, getPendingPayments, getDailySalesReport, exportSalesDownload } from "@/lib/api/reports-api";
import type { ReportKpiDto, MonthlyReportDto, CategoryReportDto, PendingPaymentsDto, DailySalesReportDto } from "@/lib/api/types";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

const fmt = (n: number) => "Rs " + n.toLocaleString("en-PK");

const Reports = () => {
  const { isFeatureEnabled, hasPermission } = useAuth();
  const exportEnabled = isFeatureEnabled("App.DataExport") && hasPermission("App.Reports.Export");
  const [exportOpen, setExportOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please pick a start and end date");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be after start date");
      return;
    }
    setExporting(true);
    try {
      const blob = await exportSalesDownload({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        format: "xlsx",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger-${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
      setExportOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: ["reports", "kpis"],
    queryFn: getReportKpis,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["reports", "monthly-sales"],
    queryFn: () => getMonthlySales(6),
  });

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["reports", "category-sales"],
    queryFn: () => getCategorySales(),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["reports", "pending-payments"],
    queryFn: getPendingPayments,
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["reports", "daily-sales"],
    queryFn: getDailySalesReport,
  });

  const monthly = monthlyData || [];
  const catShare = categoryData || [];
  const kpis = kpisData;
  const pending = pendingData;
  const daily = dailyData;

  if (kpisLoading || monthlyLoading || categoryLoading || pendingLoading || dailyLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Ledger Reports & Insights</h1>
          <p className="font-urdu text-sm text-muted-foreground mt-1">رپورٹس اور تجزیہ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl gap-2"><CalendarIcon className="h-4 w-4" /> This Month</Button>
          <Button variant="outline" className="rounded-xl gap-2 border-danger/30 text-danger hover:bg-danger/5"><FileText className="h-4 w-4" /> PDF</Button>
          {exportEnabled && (
            <Button
              onClick={() => setExportOpen(true)}
              className="rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export to Excel
            </Button>
          )}
        </div>
      </div>

      {exportEnabled && (
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Export Ledger to Excel</DialogTitle>
              <DialogDescription>Pick a date range to export voice ledger data as an .xlsx file.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>Start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start rounded-xl font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-2">
                <Label>End date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start rounded-xl font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setExportOpen(false)} disabled={exporting}>Cancel</Button>
              <Button className="rounded-xl gap-2" onClick={handleExport} disabled={exporting || !startDate || !endDate}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Monthly Debits", urdu: "ماہانہ ادھار", v: fmt(kpis?.monthlySales || 0), change: `+${(kpis?.monthlySalesChange || 0).toFixed(1)}%`, up: true, icon: TrendingUp, accent: "from-primary to-primary-deep" },
          { label: "Monthly Collections", urdu: "ماہانہ وصولی", v: fmt(kpis?.monthlyProfit || 0), change: `+${(kpis?.monthlyProfitChange || 0).toFixed(1)}%`, up: true, icon: ArrowUpRight, accent: "from-emerald-500 to-emerald-700" },
          { label: "Pending Udhaar", urdu: "بقایا رقم", v: fmt(kpis?.pendingPayments || 0), change: `${kpis?.pendingCustomers || 0} debtors`, up: false, icon: Wallet, accent: "from-warning to-orange-600" },
          { label: "Avg Voice Entries", urdu: "روزانہ اوسط", v: fmt(kpis?.averageDailySales || 0), change: `+${(kpis?.dailySalesChange || 0).toFixed(1)}%`, up: true, icon: Mic, accent: "from-info to-blue-700" },
        ].map((k, i) => (
          <Card key={i} className="rounded-2xl p-5 border-border/60 shadow-soft relative overflow-hidden">
            <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-15 blur-xl", k.accent)} />
            <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br grid place-items-center text-white shadow-soft", k.accent)}>
              <k.icon className="h-5 w-5" />
            </div>
            <div className="font-display text-2xl font-bold mt-4 tabular-nums">{k.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label} <span className="font-urdu">· {k.urdu}</span></div>
            <Badge variant="secondary" className={cn("rounded-full text-[10px] mt-2 border-0",
              k.up ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground")}>
              {k.change}
            </Badge>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Debits vs Collections */}
        <Card className="lg:col-span-2 rounded-2xl p-5 lg:p-6 border-border/60 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Debits vs Collections</h3>
              <p className="font-urdu text-[11px] text-muted-foreground">ادھار بمقابلہ وصولی</p>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Debits</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Collections</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly.map(m => ({ m: m.month.slice(0, 3), sales: m.sales, profit: m.profit }))} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="s2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, boxShadow: "var(--shadow-elevated)" }}
                  formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#s1)" />
                <Area type="monotone" dataKey="profit" stroke="hsl(var(--warning))" strokeWidth={2.5} fill="url(#s2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category share (optional, can keep) */}
        <Card className="rounded-2xl p-5 lg:p-6 border-border/60 shadow-soft">
          <div className="mb-4">
            <h3 className="font-display font-bold text-lg">Debt Category Mix</h3>
            <p className="font-urdu text-[11px] text-muted-foreground">قسم کے حساب سے</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catShare.map(c => ({ name: c.name, v: c.percentage, color: c.color }))} dataKey="v" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="hsl(var(--card))" strokeWidth={3}>
                  {catShare.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v:number)=>v+"%"} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {catShare.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="font-bold tabular-nums">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending payments + Daily report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">Pending Udhaar Summary</h3>
              <p className="font-urdu text-[11px] text-muted-foreground">بقایا ادھار کی تفصیل</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5 border-success/30 text-success">
              <MessageCircle className="h-3.5 w-3.5" /> Remind All
            </Button>
          </div>
          <div className="divide-y divide-border">
            {pending?.customers.map(c => (
              <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-secondary/40">
                <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold shrink-0">
                  {c.name.split(" ").map(s=>s[0]).slice(0,2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.phone} · {c.lastPaid}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-danger tabular-nums">{fmt(c.due)}</div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-success hover:bg-success/10 rounded-lg">Send reminder</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">Daily Voice Entries Report</h3>
              <p className="font-urdu text-[11px] text-muted-foreground">روزانہ آواز اندراجات</p>
            </div>
            <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 text-primary"><Download className="h-3.5 w-3.5" /> Export</Button>
          </div>
          <div className="p-5 space-y-3">
            {daily?.dailyData.map((d, i) => {
              const max = Math.max(...(daily?.dailyData.map(x => x.sales) || [1]));
              const w = (d.sales / max) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold">{d.day}</span>
                    <span className="tabular-nums font-bold">{fmt(d.sales)}</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-5 border-t border-border bg-secondary/40 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Entries</div>
              <div className="font-display text-lg font-bold mt-1">{daily?.totalBills || 0}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Amount</div>
              <div className="font-display text-lg font-bold mt-1 tabular-nums">{fmt(Math.round(daily?.averageBill || 0))}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Cash %</div>
              <div className="font-display text-lg font-bold mt-1">{Math.round(daily?.cashPercentage || 0)}%</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;