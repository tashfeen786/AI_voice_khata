import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, Trash2, Receipt, MessageCircle, Wallet, Banknote, Percent, X, ShoppingBag, Loader2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { searchProducts, getProductBySku, getPosCategories, getQuickCustomers, createSale } from "@/lib/api/pos-api";
import type { POSProductDto, POSCategoryDto, POSCustomerDto, CreatePOSSaleDto } from "@/lib/api/types";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesHistoryPanel } from "@/components/dukaan/SalesHistoryPanel";
import { InvoiceReceiptDialog } from "@/components/dukaan/InvoiceReceiptDialog";
import { useAuth } from "@/contexts/AuthContext";
import type { POSSaleResultDto } from "@/lib/api/types";

const fmt = (n: number) => "Rs " + n.toLocaleString("en-PK");

type Line = { id: string; qty: number };

const ManualEntry = () => {
  const { isFeatureEnabled } = useAuth();
  const udhaarEnabled = !isFeatureEnabled("App.UdhaarSales.disabled");
  const discountsEnabled = !isFeatureEnabled("App.Discounts.disabled");

  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [type, setType] = useState<"cash" | "udhaar">("cash");
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [receipt, setReceipt] = useState<POSSaleResultDto | null>(null);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["pos", "products", q],
    queryFn: () => searchProducts(q),
    enabled: q.length >= 2 || q.length === 0,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["pos", "categories"],
    queryFn: getPosCategories,
  });

  const { data: customersData } = useQuery({
    queryKey: ["pos", "quick-customers"],
    queryFn: () => getQuickCustomers(10),
  });

  const saleMutation = useMutation({
    mutationFn: (data: CreatePOSSaleDto) => createSale(data),
    onSuccess: (result) => {
      toast.success(`Entry saved! Invoice: ${result.invoiceNumber}`);
      setReceipt(result);
      setLines([]);
      setDiscount(0);
      setCustomerId(null);
      setType("cash");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to save entry");
    },
  });

  const products = productsData?.items || [];
  const categories = categoriesData || [];
  const customers = customersData || [];

  const filtered = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const cart = useMemo(() => {
    return lines.map(l => {
      const product = products.find(p => p.id === l.id);
      return product ? { ...l, p: product } : null;
    }).filter((l): l is { id: string; qty: number; p: POSProductDto } => l !== null);
  }, [lines, products]);

  const subtotal = cart.reduce((a, l) => a + l.p.price * l.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && q.trim()) {
      e.preventDefault();
      try {
        const product = await getProductBySku(q.trim());
        if (product) {
          add(product.id);
          setQ("");
          toast.success(`Added ${product.name}`);
          return;
        }
      } catch {
        // not found
      }
    }
  };

  const add = (id: string) => setLines(prev => {
    const e = prev.find(l => l.id === id);
    const product = products.find(p => p.id === id);
    const existingQty = e?.qty ?? 0;
    if (product && existingQty + 1 > product.stock) {
      toast.error(`Only ${product.stock} ${product.name} in stock`);
      return prev;
    }
    return e ? prev.map(l => l.id === id ? { ...l, qty: l.qty + 1 } : l) : [...prev, { id, qty: 1 }];
  });
  const setQty = (id: string, qty: number) => setLines(prev => {
    if (qty <= 0) return prev.filter(l => l.id !== id);
    const product = products.find(p => p.id === id);
    if (product && qty > product.stock) {
      toast.error(`Only ${product.stock} ${product.name} in stock`);
      return prev;
    }
    return prev.map(l => l.id === id ? { ...l, qty } : l);
  });

  const handleGenerateInvoice = () => {
    if (cart.length === 0) {
      toast.error("Entry is empty");
      return;
    }
    const saleData: CreatePOSSaleDto = {
      customerId: customerId || null,
      paymentType: type,
      discountAmount: discount,
      notes: null,
      items: cart.map(l => ({
        productId: l.p.id,
        quantity: l.qty,
        unitPrice: l.p.price,
      })),
    };
    saleMutation.mutate(saleData);
  };

  const cartCount = cart.reduce((a, l) => a + l.qty, 0);

  return (
    <div className="-mx-4 lg:-mx-8 -my-6 lg:-my-6 px-4 lg:px-8 py-6 lg:py-6 bg-gradient-soft min-h-[calc(100vh-4rem)]">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="new" className="rounded-lg">Manual Entry</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">Entry History</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "history" ? <SalesHistoryPanel /> : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 lg:gap-6">
          {/* Products side */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                  <Mic className="h-6 w-6 text-primary" /> Manual Entry
                </h1>
                <p className="font-urdu text-xs text-muted-foreground mt-0.5">ٹائپنگ سے اندراج (جب آواز کام نہ کرے)</p>
              </div>
              <Badge className="rounded-full bg-success/10 text-success border-0 hidden sm:inline-flex">● Backup method</Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={e => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search product by name or SKU…  /  بارکوڈ یا نام ڈالیں"
                className="h-14 pl-12 pr-4 text-base rounded-2xl bg-card border-border shadow-soft focus-visible:ring-primary" 
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex text-[10px] font-mono px-2 py-1 rounded bg-secondary text-muted-foreground">Enter</kbd>
            </div>
            {productsLoading && (
              <div className="absolute right-16 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === null ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-foreground hover:bg-secondary border border-border")}>
                All
              </button>
              {categories.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedCategory(c.name)}
                  className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    selectedCategory === c.name ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-foreground hover:bg-secondary border border-border")}>
                  {c.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(p => {
                const inCart = lines.find(l => l.id === p.id);
                return (
                  <Card key={p.id} onClick={() => !p.isOutOfStock && add(p.id)}
                    className={cn("relative rounded-2xl p-4 cursor-pointer transition-all border-border/60 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 group",
                      inCart && "ring-2 ring-primary border-primary/40",
                      p.isOutOfStock && "opacity-50 cursor-not-allowed")}>
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-secondary to-accent grid place-items-center mb-3 relative overflow-hidden">
                      <ShoppingBag className="h-10 w-10 text-primary/40" strokeWidth={1.5} />
                      {(p.isOutOfStock || p.isLowStock) && (
                        <span className={cn("absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          p.isOutOfStock ? "bg-danger text-danger-foreground" : "bg-warning text-warning-foreground")}>
                          {p.isOutOfStock ? "Out" : `${p.stock} left`}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold leading-tight line-clamp-1">{p.name}</div>
                    <div className="font-urdu text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{p.urduName}</div>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="font-display font-bold tabular-nums">{fmt(p.price)}</div>
                      <div className={cn("h-8 w-8 rounded-xl grid place-items-center transition-all",
                        inCart ? "bg-primary text-primary-foreground" : "bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                        p.isOutOfStock && "opacity-50")}>
                        {inCart ? <span className="text-xs font-bold">{inCart.qty}</span> : <Plus className="h-4 w-4" />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Cart */}
          <Card className={cn(
            "rounded-2xl border-border/60 shadow-elevated flex flex-col bg-card",
            "lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]",
            "fixed inset-x-0 bottom-0 z-50 lg:static lg:z-auto h-[85vh] lg:h-auto rounded-b-none lg:rounded-2xl",
            "transition-transform lg:transition-none",
            cartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
          )}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  Current Entry
                  <Badge className="bg-primary/10 text-primary border-0 rounded-full">{cartCount} items</Badge>
                </h3>
                <p className="font-urdu text-[11px] text-muted-foreground mt-0.5">موجودہ اندراج</p>
              </div>
              <Button size="icon" variant="ghost" className="lg:hidden rounded-xl" onClick={() => setCartOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 border-b border-border">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Debtor / گاہک</div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                <button onClick={() => { setCustomerId(null); setType("cash"); }}
                  className={cn("shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border",
                    !customerId ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
                  Walk-in
                </button>
                {customers.map(c => (
                  <button key={c.id} onClick={() => { setCustomerId(c.id); setType("udhaar"); }}
                    className={cn("shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap",
                      customerId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40")}>
                    {c.name}
                    {c.outstandingBalance > 0 && <span className="ml-1 text-[9px] text-danger">({fmt(c.outstandingBalance)})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[180px]">
              {cart.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Entry is empty<br/><span className="font-urdu">اندراج خالی ہے</span>
                </div>
              )}
              {cart.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary to-accent grid place-items-center shrink-0">
                    <ShoppingBag className="h-5 w-5 text-primary/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{l.p.name}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">{fmt(l.p.price)} × {l.qty}</div>
                  </div>
                  <div className="flex items-center gap-1 bg-secondary rounded-xl p-0.5">
                    <button onClick={() => setQty(l.id, l.qty - 1)} className="h-7 w-7 rounded-lg bg-card grid place-items-center hover:bg-danger hover:text-danger-foreground transition-colors">
                      {l.qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                    <button onClick={() => setQty(l.id, l.qty + 1)} className="h-7 w-7 rounded-lg bg-card grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-bold tabular-nums w-20 text-right shrink-0">{fmt(l.p.price * l.qty)}</div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-secondary/40 space-y-3 rounded-b-2xl">
              {discountsEnabled && (
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <Input type="number" value={discount || ""} onChange={e => setDiscount(Number(e.target.value) || 0)}
                    placeholder="Discount (Rs)" className="h-10 rounded-xl bg-card" />
                </div>
              )}

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{fmt(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-danger"><span>Discount</span><span className="tabular-nums">- {fmt(discount)}</span></div>}
                <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">Total / کل</div>
                    <div className="font-display text-2xl font-bold">{fmt(total)}</div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">Tax included</div>
                </div>
              </div>

              <div className={cn("grid gap-2 p-1 bg-card rounded-2xl border border-border", udhaarEnabled ? "grid-cols-2" : "grid-cols-1")}>
                <button onClick={() => setType("cash")}
                  className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                    type === "cash" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary")}>
                  <Banknote className="h-4 w-4" /> Cash <span className="font-urdu text-xs">نقد</span>
                </button>
                {udhaarEnabled && (
                  <button onClick={() => setType("udhaar")}
                    className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                      type === "udhaar" ? "bg-warning text-warning-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary")}>
                    <Wallet className="h-4 w-4" /> Udhaar <span className="font-urdu text-xs">اُدھار</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Button 
                  onClick={handleGenerateInvoice}
                  disabled={saleMutation.isPending || cart.length === 0}
                  className="h-12 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow font-bold gap-2">
                  {saleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                  Save Entry
                </Button>
                <Button size="icon" variant="outline"
                  onClick={() => {
                    const cust = customers.find(c => c.id === customerId);
                    if (!cust?.phone) { toast.error("Select a debtor with a phone number"); return; }
                    const lines = cart.map(l => `${l.p.name} x${l.qty}`).join(", ");
                    const msg = `New entry from Voice Khata: ${lines}. Total Rs ${total.toLocaleString("en-PK")}.`;
                    const url = `https://wa.me/${cust.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}`;
                    window.open(url, "_blank");
                  }}
                  className="h-12 w-12 rounded-2xl border-success/30 text-success hover:bg-success/5">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          {!cartOpen && cart.length > 0 && (
            <button onClick={() => setCartOpen(true)}
              className="lg:hidden fixed bottom-20 right-4 z-40 h-14 px-5 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow flex items-center gap-3 font-bold animate-slide-up">
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-warning text-warning-foreground text-[10px] grid place-items-center font-bold">{cartCount}</span>
              </div>
              <span className="tabular-nums">{fmt(total)}</span>
            </button>
          )}
        </div>
      )}
      <InvoiceReceiptDialog
        open={!!receipt}
        onOpenChange={(o) => !o && setReceipt(null)}
        sale={receipt}
        customerName={customers.find(c => c.id === customerId)?.name}
        customerPhone={customers.find(c => c.id === customerId)?.phone}
        shopName="Voice Khata"
      />
    </div>
  );
};

export default ManualEntry;