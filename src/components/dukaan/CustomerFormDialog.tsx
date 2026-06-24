import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { createCustomer, updateCustomer } from "@/lib/api/customers-api";
import type { CustomerDto } from "@/lib/api/types";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; customer?: CustomerDto | null; }

export function CustomerFormDialog({ open, onOpenChange, customer }: Props) {
  const qc = useQueryClient();
  const isEdit = !!customer;
  const [form, setForm] = useState({ name: "", urduName: "", phone: "", address: "", notes: "", isActive: true });

  useEffect(() => {
    if (customer) setForm({
      name: customer.name, urduName: customer.urduName ?? "", phone: customer.phone ?? "",
      address: customer.address ?? "", notes: customer.notes ?? "", isActive: customer.isActive,
    });
    else setForm({ name: "", urduName: "", phone: "", address: "", notes: "", isActive: true });
  }, [customer, open]);

  const mutation = useMutation({
    mutationFn: () => isEdit && customer ? updateCustomer(customer.id, form) : createCustomer(form),
    onSuccess: () => {
      toast.success(isEdit ? "Customer updated" : "Customer created");
      qc.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Customer" : "New Customer"}</DialogTitle>
          <DialogDescription>گاہک کی تفصیلات</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Urdu Name</Label><Input dir="rtl" className="font-urdu" value={form.urduName} onChange={e => setForm({ ...form, urduName: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="03xxxxxxxxx" /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}