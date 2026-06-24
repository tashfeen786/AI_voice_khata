import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, AlertTriangle, ShoppingBag, Edit3, ArrowUpDown, Trash2, BoxSelect } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, getInventoryStats, getCategories, deleteProduct } from "@/lib/api/inventory-api";
import type { InventoryProductDto } from "@/lib/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ProductFormDialog } from "@/components/dukaan/ProductFormDialog";
import { StockAdjustDialog } from "@/components/dukaan/StockAdjustDialog";
import { StockTakeDialog } from "@/components/dukaan/StockTakeDialog";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const fmt = (n: number) => "Rs " + n.toLocaleString("en-PK");

const Inventory = () => {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "instock">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryProductDto | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<InventoryProductDto | null>(null);
  const [takeOpen, setTakeOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryProductDto | null>(null);

  const canCreate = hasPermission("App.Products.Create");
  const canEdit = hasPermission("App.Products.Edit");
  const canDelete = hasPermission("App.Products.Delete");
  const canManageStock = hasPermission("App.Products.ManageStock");

  // Fetch products with filters
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["inventory", "products", q, cat, stockFilter, page, pageSize],
    queryFn: () => getProducts({
      searchQuery: q || undefined,
      categoryId: cat || undefined,
      stockStatus: stockFilter === "all" ? undefined : stockFilter,
      skipCount: (page - 1) * pageSize,
      maxResultCount: pageSize,
    }),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["inventory", "stats"],
    queryFn: getInventoryStats,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["inventory", "categories"],
    queryFn: getCategories,
  });

  const products = productsData?.items || [];
  const totalCount = productsData?.totalCount || 0;
  const categories = categoriesData || [];
  const stats = statsData;

  const catNames = ["All", ...categories.map(c => c.name)];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Delete failed"),
  });

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory</h1>
          <p className="font-urdu text-sm text-muted-foreground mt-1">اسٹاک کا انتظام</p>
        </div>
        <div className="flex gap-2">
          {canManageStock && (
            <Button variant="outline" onClick={() => setTakeOpen(true)} className="rounded-xl gap-2">
              <ArrowUpDown className="h-4 w-4" /> Stock Take
            </Button>
          )}
          {canCreate && (
            <Button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glow gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-2xl p-4 border-border/60 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center"><Package className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Total SKUs</div>
              <div className="font-display text-xl font-bold">{stats?.totalSkus || 0}</div>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl p-4 border-border/60 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 grid place-items-center"><ShoppingBag className="h-5 w-5 text-success" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Stock Value</div>
              <div className="font-display text-xl font-bold tabular-nums">{fmt(stats?.stockValue || 0)}</div>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl p-4 border-border/60 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/15 grid place-items-center"><AlertTriangle className="h-5 w-5 text-warning" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Low Stock</div>
              <div className="font-display text-xl font-bold">{stats?.lowStockCount || 0}</div>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl p-4 border-border/60 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-danger/10 grid place-items-center"><AlertTriangle className="h-5 w-5 text-danger" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Out of Stock</div>
              <div className="font-display text-xl font-bold">{stats?.outOfStockCount || 0}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl p-4 border-border/60 shadow-soft">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or SKU…" className="pl-9 h-11 rounded-xl bg-secondary border-0" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {(["all","low","out"] as const).map(s => (
              <button key={s} onClick={() => setStockFilter(s)}
                className={cn("px-4 h-11 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors",
                  stockFilter === s ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                {s === "all" ? "All Stock" : s === "low" ? "Low Stock" : "Out of Stock"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none mt-3 -mx-1 px-1">
          {catNames.map(c => (
            <button key={c} onClick={() => setCat(c === "All" ? null : c)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
                (c === "All" && !cat) || cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40")}>
              {c}
            </button>
          ))}
        </div>
      </Card>

      {/* Table (desktop) / cards (mobile) */}
      <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
        {productsLoading && (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        )}
        {!productsLoading && products.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display font-bold text-lg">No products found</h3>
            <p className="font-urdu text-sm text-muted-foreground mt-1">کوئی پروڈکٹ نہیں ملا</p>
            {canCreate && (
              <Button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="rounded-xl mt-4 gap-2">
                <Plus className="h-4 w-4" /> Add your first product
              </Button>
            )}
          </div>
        )}
        {!productsLoading && products.length > 0 && (
        <>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-4 font-semibold">Product</th>
                <th className="text-left p-4 font-semibold">SKU</th>
                <th className="text-left p-4 font-semibold">Category</th>
                <th className="text-right p-4 font-semibold">Price</th>
                <th className="text-right p-4 font-semibold">Stock</th>
                <th className="text-right p-4 font-semibold">Value</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-accent grid place-items-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-primary/50" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{p.name}</div>
                        <div className="font-urdu text-[11px] text-muted-foreground">{p.urduName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="p-4"><Badge variant="secondary" className="rounded-full bg-secondary text-foreground border-0">{p.categoryName}</Badge></td>
                  <td className="p-4 text-right font-semibold tabular-nums">{fmt(p.price)}</td>
                  <td className="p-4 text-right">
                    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs tabular-nums",
                      p.stockStatus === "OutOfStock" ? "bg-danger text-danger-foreground" :
                      p.stockStatus === "LowStock" ? "bg-warning/20 text-warning-foreground" :
                      "bg-success/10 text-success")}>
                      {p.stock} pcs
                    </span>
                  </td>
                  <td className="p-4 text-right tabular-nums text-muted-foreground">{fmt(p.stockValue)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button size="icon" variant="ghost" onClick={() => { setEditTarget(p); setFormOpen(true); }} className="h-8 w-8 rounded-lg" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      {canManageStock && (
                        <Button size="icon" variant="ghost" onClick={() => setAdjustTarget(p)} className="h-8 w-8 rounded-lg" title="Adjust stock">
                          <BoxSelect className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(p)} className="h-8 w-8 rounded-lg text-danger" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {products.map(p => (
            <div key={p.id} className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-accent grid place-items-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-sm">{p.name}</div>
                <div className="font-urdu text-[11px] text-muted-foreground truncate">{p.urduName}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold tabular-nums">{fmt(p.price)}</span>
                  <span className="text-[10px] text-muted-foreground">· {p.categoryName}</span>
                </div>
              </div>
              <div className={cn("text-xs font-bold px-2.5 py-1.5 rounded-lg tabular-nums shrink-0",
                p.stockStatus === "OutOfStock" ? "bg-danger text-danger-foreground" :
                p.stockStatus === "LowStock" ? "bg-warning/20 text-warning-foreground" :
                "bg-success/10 text-success")}>
                {p.stock}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <DataTablePagination
            page={page} pageSize={pageSize} totalCount={totalCount}
            onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        </div>
        </>
        )}
      </Card>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editTarget} />
      <StockAdjustDialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)} product={adjustTarget} />
      <StockTakeDialog open={takeOpen} onOpenChange={setTakeOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <b>{deleteTarget?.name}</b>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-danger text-danger-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventory;
