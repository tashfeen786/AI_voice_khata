import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { adjustStock } from "@/lib/api/inventory-api";
import type { InventoryProductDto } from "@/lib/api/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: InventoryProductDto | null;
}

export function StockAdjustDialog({ open, onOpenChange, product }: Props) {
  const qc = useQueryClient();
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) { setQty(0); setReason(""); } }, [open]);

  const mutation = useMutation({
    mutationFn: () => adjustStock({ productId: product!.id, quantity: qty, reason }),
    onSuccess: () => {
      toast.success("Stock adjusted");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Failed to adjust"),
  });

  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>{product.name} · current stock: <b>{product.stock}</b></DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Adjustment (use negative to remove)</Label>
            <Input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} /></div>
          <div><Label>Reason (optional)</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} /></div>
          <div className="text-sm text-muted-foreground">New stock will be: <b>{product.stock + qty}</b></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || qty === 0}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}