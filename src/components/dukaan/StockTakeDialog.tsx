import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { getProducts, stockTake } from "@/lib/api/inventory-api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function StockTakeDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["inventory", "stocktake-products"],
    queryFn: () => getProducts({ maxResultCount: 200 }),
    enabled: open,
  });
  const products = data?.items ?? [];
  const [edits, setEdits] = useState<Record<string, number>>({});
  useEffect(() => { if (open) setEdits({}); }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(edits).filter(([, v]) => Number.isFinite(v));
      for (const [productId, newStockQuantity] of entries) {
        await stockTake({ productId, newStockQuantity, reason: "Stock take" });
      }
    },
    onSuccess: () => {
      toast.success("Stock take completed");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Stock take failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock Take</DialogTitle>
          <DialogDescription>Set the actual counted quantity for each product.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-border">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-muted-foreground">SKU {p.sku} · current {p.stock}</div>
              </div>
              <Input type="number" placeholder={String(p.stock)} className="w-28"
                value={edits[p.id] ?? ""} onChange={e => setEdits({ ...edits, [p.id]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || Object.keys(edits).length === 0}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}