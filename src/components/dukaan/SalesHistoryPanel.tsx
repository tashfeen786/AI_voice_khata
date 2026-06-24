import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSales, cancelSale, markSaleAsPaid } from "@/lib/api/pos-api";
import { useAuth } from "@/contexts/AuthContext";

const fmt = (n: number) => "Rs " + n.toLocaleString("en-PK");

export function SalesHistoryPanel() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canCancel = hasPermission("App.Sales.Cancel");

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<{ id: string; amount: number } | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["pos", "sales", page],
    queryFn: () => getSales({ skipCount: (page - 1) * pageSize, maxResultCount: pageSize }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelSale(id),
    onSuccess: () => { toast.success("Sale cancelled"); qc.invalidateQueries({ queryKey: ["pos", "sales"] }); setCancelTarget(null); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Failed to cancel"),
  });

  const payMut = useMutation({
    mutationFn: () => markSaleAsPaid(payTarget!.id, paidAmount),
    onSuccess: () => { toast.success("Marked as paid"); qc.invalidateQueries({ queryKey: ["pos", "sales"] }); setPayTarget(null); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Failed to mark paid"),
  });

  const sales = data?.items ?? [];

  return (
    <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold">Sales History</h3>
          <p className="text-[11px] text-muted-foreground font-urdu">فروخت کی تاریخ</p>
        </div>
        <Badge className="bg-secondary text-foreground border-0 rounded-full">{data?.totalCount ?? 0} sales</Badge>
      </div>

      {isLoading && (
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      )}

      {!isLoading && sales.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No sales yet</div>
        </div>
      )}

      {!isLoading && sales.length > 0 && (
        <div className="divide-y divide-border">
          {sales.map(s => {
            const isUdhaar = s.paymentType === "udhaar";
            const isCancelled = s.status?.toLowerCase() === "cancelled";
            return (
              <div key={s.id} className={cn("p-4 flex flex-wrap items-center gap-3", isCancelled && "opacity-60")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{s.invoiceNumber}</span>
                    <Badge className={cn("rounded-full border-0 text-[10px]",
                      isUdhaar ? "bg-warning/15 text-warning-foreground" : "bg-success/15 text-success")}>
                      {s.paymentTypeDisplay}
                    </Badge>
                    {isCancelled && <Badge className="rounded-full bg-danger/15 text-danger border-0 text-[10px]">Cancelled</Badge>}
                  </div>
                  <div className="text-sm font-medium mt-0.5 truncate">{s.customerName || "Walk-in"}</div>
                  <div className="text-[11px] text-muted-foreground">{s.itemCount} items · {s.timeDisplay || new Date(s.saleDate).toLocaleString("en-PK")}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold tabular-nums">{fmt(s.totalAmount)}</div>
                </div>
                <div className="flex gap-1.5 w-full sm:w-auto">
                  {isUdhaar && !isCancelled && (
                    <Button size="sm" variant="outline" onClick={() => { setPayTarget({ id: s.id, amount: s.totalAmount }); setPaidAmount(s.totalAmount); }}
                      className="rounded-lg gap-1.5 border-success/30 text-success hover:bg-success/5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
                    </Button>
                  )}
                  {canCancel && !isCancelled && (
                    <Button size="sm" variant="outline" onClick={() => setCancelTarget(s.id)}
                      className="rounded-lg gap-1.5 text-danger border-danger/30 hover:bg-danger/5">
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this sale?</AlertDialogTitle>
            <AlertDialogDescription>The invoice will be marked as cancelled. Stock will be restored.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep sale</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelTarget && cancelMut.mutate(cancelTarget)} className="bg-danger text-danger-foreground">
              {cancelMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Cancel sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Mark as paid</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Paid amount</Label>
            <Input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
            <div className="text-xs text-muted-foreground">Total due: {fmt(payTarget?.amount ?? 0)}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button onClick={() => payMut.mutate()} disabled={payMut.isPending || paidAmount <= 0} className="bg-gradient-primary text-primary-foreground">
              {payMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}