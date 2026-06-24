import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createProduct, updateProduct, getCategories } from "@/lib/api/inventory-api";
import type { InventoryProductDto } from "@/lib/api/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product?: InventoryProductDto | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const qc = useQueryClient();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: "", urduName: "", sku: "", price: 0, costPrice: 0,
    stockQuantity: 0, lowStockThreshold: 5, categoryId: "", isActive: true,
  });

  const { data: categories } = useQuery({ queryKey: ["inventory", "categories"], queryFn: getCategories, enabled: open });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, urduName: product.urduName ?? "", sku: product.sku,
        price: product.price, costPrice: 0, stockQuantity: product.stock,
        lowStockThreshold: 5, categoryId: product.categoryId, isActive: true,
      });
    } else {
      setForm({ name: "", urduName: "", sku: "", price: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 5, categoryId: "", isActive: true });
    }
  }, [product, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, urduName: form.urduName || null };
      if (isEdit && product) return updateProduct(product.id, payload);
      return createProduct(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      onOpenChange(false);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error?.message || (e?.response?.status === 409 ? "SKU already exists" : "Failed to save");
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update product details" : "Create a new product"}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2"><Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="col-span-2"><Label>Urdu Name</Label>
            <Input dir="rtl" className="font-urdu" value={form.urduName} onChange={e => setForm({ ...form, urduName: e.target.value })} /></div>
          <div><Label>SKU</Label>
            <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
          <div><Label>Category</Label>
            <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select></div>
          <div><Label>Price</Label>
            <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div><Label>Cost Price</Label>
            <Input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} /></div>
          <div><Label>Stock</Label>
            <Input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: Number(e.target.value) })} /></div>
          <div><Label>Low Stock Threshold</Label>
            <Input type="number" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.sku || !form.categoryId}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}