import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MessageCircle, Phone, Wallet, ArrowDownLeft, ArrowUpRight, UserPlus, ChevronRight, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getCustomers, getCustomer, getCustomerStats, getCustomerLedger } from "@/lib/api/customers-api";
import { useAuth } from "@/contexts/AuthContext";
import { CustomerFormDialog } from "@/components/dukaan/CustomerFormDialog";
import { AddPaymentDialog } from "@/components/dukaan/AddPaymentDialog";
import { buildWhatsAppUrl, templates } from "@/lib/api/whatsapp-api";

const fmt = (n: number) => "Rs " + n.toLocaleString("en-PK");

const Debtors = () => {
  const { hasPermission } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"payment" | "udhaar" | null>(null);

  const canCreate = hasPermission("App.Customers.Create");
  const canPay = hasPermission("App.Customers.ManagePayments");

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", "list", searchQuery],
    queryFn: () => getCustomers({ filter: searchQuery, maxResultCount: 100 }),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["customers", "stats"],
    queryFn: getCustomerStats,
  });

  const { data: selectedCustomer, isLoading: customerLoading } = useQuery({
    queryKey: ["customers", "detail", selectedId],
    queryFn: () => getCustomer(selectedId!),
    enabled: !!selectedId,
  });

  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ["customers", "ledger", selectedId],
    queryFn: () => getCustomerLedger(selectedId!, 10),
    enabled: !!selectedId,
  });

  const customers = customersData?.items || [];
  const selected = customers.find(c => c.id === selectedId) || customers[0] || null;
  const totalDue = useMemo(() => customers.reduce((a, c) => a + (c.outstandingBalance || 0), 0), [customers]);

  useEffect(() => {
    if (!selectedId && customers.length > 0) {
      setSelectedId(customers[0].id);
    }
  }, [customers, selectedId]);

  if (customersLoading || statsLoading) {
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
          <h1 className="font-display text-2xl font-bold">Debtors & Ledger</h1>
          <p className="font-urdu text-sm text-muted-foreground mt-1">ادھار دار اور کھاتہ</p>
        </div>
        {canCreate && (
          <Button onClick={() => setFormOpen(true)} className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glow gap-2 self-start">
            <UserPlus className="h-4 w-4" /> Add Debtor
          </Button>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Udhaar", urdu: "کل اُدھار", v: fmt(statsData?.totalOutstanding || 0), tone: "danger" },
          { label: "Debtors", urdu: "ادھار دار", v: statsData?.totalCustomers || 0, tone: "primary" },
          { label: "Received Today", urdu: "آج وصول", v: fmt(statsData?.paidToday || 0), tone: "success" },
          { label: "Avg Outstanding", urdu: "اوسط بقایا", v: fmt(Math.round(statsData?.averageOutstanding || 0)), tone: "warning" },
        ].map((k, i) => (
          <Card key={i} className="rounded-2xl p-4 border-border/60 shadow-soft">
            <div className="text-xs text-muted-foreground">{k.label} <span className="font-urdu">· {k.urdu}</span></div>
            <div className={cn("font-display text-xl lg:text-2xl font-bold mt-2 tabular-nums",
              k.tone === "danger" && "text-danger", k.tone === "success" && "text-success")}>{k.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        {/* List */}
        <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden flex flex-col max-h-[700px]">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search debtor…" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-secondary border-0" 
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-border">
            {customers.map(c => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={cn("w-full text-left p-4 flex items-center gap-3 transition-colors hover:bg-secondary/60",
                  selectedId === c.id && "bg-primary/5 border-l-4 border-l-primary")}>
                <div className="h-11 w-11 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0">
                  {c.name.split(" ").map(s=>s[0]).slice(0,2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-sm">{c.name}</div>
                  <div className="font-urdu text-[11px] text-muted-foreground truncate">{c.urduName}</div>
                </div>
                <div className="text-right shrink-0">
                  {c.outstandingBalance > 0 ? (
                    <div className="text-sm font-bold text-danger tabular-nums">{fmt(c.outstandingBalance)}</div>
                  ) : (
                    <Badge className="bg-success/10 text-success border-0 rounded-full text-[10px]">Cleared</Badge>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-0.5">{c.lastPaidDisplay}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Profile */}
        <div className="space-y-4">
          {selected ? (
          <>
          <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
            <div className="bg-gradient-hero p-6 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-xl shadow-glow shrink-0">
                  {selected.name.split(" ").map(s=>s[0]).slice(0,2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-bold">{selected.name}</h2>
                  <div className="font-urdu text-sm text-muted-foreground">{selected.urduName}</div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {selected.phone}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-card p-4 shadow-soft">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due Amount</div>
                  <div className="font-urdu text-[10px] text-muted-foreground">بقایا رقم</div>
                  <div className={cn("font-display text-2xl lg:text-3xl font-bold mt-2 tabular-nums",
                    selected.outstandingBalance > 0 ? "text-danger" : "text-success")}>
                    {fmt(selected.outstandingBalance || 0)}
                  </div>
                </div>
                <div className="rounded-2xl bg-card p-4 shadow-soft">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lifetime Value</div>
                  <div className="font-urdu text-[10px] text-muted-foreground">کل خریداری</div>
                  <div className="font-display text-2xl lg:text-3xl font-bold mt-2 tabular-nums">
                    {fmt(selectedCustomer?.lifetimeValue ?? 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {canPay && (
                <Button onClick={() => setPaymentMode("payment")} className="rounded-xl bg-gradient-primary text-primary-foreground shadow-soft gap-2 h-11">
                  <ArrowDownLeft className="h-4 w-4" /> Record Payment
                </Button>
              )}
              {canPay && (
                <Button onClick={() => setPaymentMode("udhaar")} variant="outline" className="rounded-xl gap-2 h-11 border-warning/40 text-warning-foreground hover:bg-warning/10">
                  <Plus className="h-4 w-4" /> Add Udhaar
                </Button>
              )}
              <Button variant="outline"
                onClick={() => {
                  if (!selected?.phone) return;
                  const msg = templates.paymentReminder({
                    name: selected.name,
                    balance: selected.outstandingBalance || 0,
                    shop: "Voice Khata",
                  });
                  window.open(buildWhatsAppUrl(selected.phone, msg), "_blank");
                }}
                className="rounded-xl gap-2 h-11 border-success/30 text-success hover:bg-success/5">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button variant="outline" className="rounded-xl gap-2 h-11">
                <Phone className="h-4 w-4" /> Call
              </Button>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold">Voice Ledger History</h3>
                <p className="font-urdu text-[11px] text-muted-foreground">آواز کھاتہ</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg text-primary">View all <ChevronRight className="h-4 w-4 ml-0.5" /></Button>
            </div>
            <div className="divide-y divide-border">
              {ledgerData?.map((e, i) => (
                <div key={e.id} className="p-4 flex items-center gap-3 hover:bg-secondary/40">
                  <div className={cn("h-10 w-10 rounded-xl grid place-items-center shrink-0",
                    e.type === "credit" ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>
                    {e.type === "credit" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.description}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(e.date).toLocaleDateString()} · {e.type === "credit" ? "Udhaar added" : "Payment received"}</div>
                  </div>
                  <div className={cn("font-bold tabular-nums",
                    e.type === "credit" ? "text-danger" : "text-success")}>
                    {e.type === "credit" ? "+" : "−"} {fmt(e.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {customers.length === 0 ? (
                <>
                  <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div>No debtors yet</div>
                  <div className="font-urdu text-sm">کوئی ادھار دار نہیں</div>
                </>
              ) : "No debtor selected"}
            </div>
          )}
        </div>
      </div>

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <AddPaymentDialog
        open={!!paymentMode}
        onOpenChange={(o) => !o && setPaymentMode(null)}
        customer={selectedCustomer ?? null}
        mode={paymentMode ?? "payment"}
      />
    </div>
  );
};

export default Debtors;