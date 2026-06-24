import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { addPayment, addUdhaarEntry } from "@/lib/api/customers-api";
import type { CustomerDto } from "@/lib/api/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer: CustomerDto | null;
  mode: "payment" | "udhaar";
}

export function AddPaymentDialog({ open, onOpenChange, customer, mode }: Props) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  useEffect(() => { if (open) { setAmount(0); setDescription(""); } }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "payment") {
        await addPayment({ customerId: customer!.id, amount, description });
      } else {
        await addUdhaarEntry(customer!.id, amount, description || "Udhaar");
      }
    },
    onSuccess: () => {
      toast.success(mode === "payment" ? "Payment recorded" : "Udhaar added");
      qc.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Failed"),
  });

  if (!customer) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "payment" ? "Add Payment" : "New Udhaar"}</DialogTitle>
          <DialogDescription>{customer.name} · Outstanding: <b>Rs {customer.outstandingBalance.toLocaleString()}</b></DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Amount (Rs)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
          <div><Label>Notes</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || amount <= 0}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}