import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard, MoreHorizontal, Pencil, Plus, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Check, X
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  createEdition, deleteEdition, getEditions, updateEdition, type EditionDto, type EditionFilterDto,
} from "@/lib/api/editions-api";
import { FeatureManagerDialog } from "@/components/admin/FeatureManagerDialog";

const PAGE_SIZES = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

type SortField = "name" | "displayName" | "monthlyPrice" | "annualPrice" | "displayOrder" | "isActive" | "creationTime";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export default function HostEditions() {
  const qc = useQueryClient();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  
  // Sorting state
  const [sort, setSort] = useState<SortState>({ field: "displayOrder", direction: "asc" });
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  
  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditionDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditionDto | null>(null);

  // Build sorting string for API
  const sortingString = `${sort.field} ${sort.direction}`;

  // Fetch data with pagination, sorting, and filtering
  const { data, isLoading } = useQuery({
    queryKey: ["host", "editions", "list", currentPage, pageSize, sortingString, searchQuery, activeFilter],
    queryFn: () => getEditions({
      skipCount: (currentPage - 1) * pageSize,
      maxResultCount: pageSize,
      sorting: sortingString,
      searchQuery: searchQuery || undefined,
      isActive: activeFilter,
    }),
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEdition(id),
    onSuccess: () => {
      toast.success("Edition deleted");
      qc.invalidateQueries({ queryKey: ["host", "editions"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to delete edition"),
  });

  const handleSort = useCallback((field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleActiveFilterChange = useCallback((value: boolean | undefined) => {
    setActiveFilter(value);
    setCurrentPage(1);
  }, []);

  const getSortIcon = (field: SortField) => {
    if (sort.field !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sort.direction === "asc" 
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> 
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount).replace("PKR", "Rs");
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Editions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            SaaS pricing plans and bundled features. ({totalCount} total)
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 bg-gradient-primary text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> Create Edition
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-border/60 shadow-soft p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={activeFilter?.toString() ?? "all"} onValueChange={(v) => {
              handleActiveFilterChange(v === "all" ? undefined : v === "true");
            }}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-border/60 shadow-soft p-4 lg:p-5">
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("displayName")}
                >
                  <div className="flex items-center gap-1">Name {getSortIcon("displayName")}</div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors text-right"
                  onClick={() => handleSort("monthlyPrice")}
                >
                  <div className="flex items-center justify-end gap-1">Monthly {getSortIcon("monthlyPrice")}</div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors text-right"
                  onClick={() => handleSort("annualPrice")}
                >
                  <div className="flex items-center justify-end gap-1">Annual {getSortIcon("annualPrice")}</div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors w-[100px]"
                  onClick={() => handleSort("isActive")}
                >
                  <div className="flex items-center gap-1">Status {getSortIcon("isActive")}</div>
                </TableHead>
                <TableHead className="text-center w-[100px]">Tenants</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-10" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                    No editions found. {searchQuery && "Try adjusting your search."}
                    {!searchQuery && "Create one to get started."}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items.map((e, idx) => (
                <TableRow key={e.id} className={cn(!e.isActive && "opacity-60")}>
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-info/10 grid place-items-center text-info">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{e.displayName}</div>
                        <div className="text-xs text-muted-foreground">{e.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {e.monthlyPrice > 0 ? formatCurrency(e.monthlyPrice) : "Free"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {e.annualPrice > 0 ? formatCurrency(e.annualPrice) : "Free"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.isActive ? "default" : "secondary"} className="rounded-lg">
                      {e.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">{e.tenantCount ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">
                        <DropdownMenuItem onClick={() => setEditTarget(e)} className="cursor-pointer gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(e)}
                          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          disabled={(e.tenantCount ?? 0) > 0}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Page {currentPage} of {totalPages}</span>
              <span className="text-border">|</span>
              <span>{totalCount} items</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[100px] h-8 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map(size => (
                    <SelectItem key={size} value={size.toString()}>{size} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <EditionFormDialog
        open={createOpen || !!editTarget}
        edition={editTarget}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditTarget(null); } }}
        onSaved={() => qc.invalidateQueries({ queryKey: ["host", "editions"] })}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete edition?</AlertDialogTitle>
            <AlertDialogDescription>
              {(deleteTarget?.tenantCount ?? 0) > 0 ? (
                <>
                  <strong>{deleteTarget?.displayName}</strong> has <strong>{deleteTarget?.tenantCount}</strong> tenants.
                  You must move these tenants to another edition before deleting.
                </>
              ) : (
                <>Are you sure you want to delete <strong>{deleteTarget?.displayName}</strong>?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={(deleteTarget?.tenantCount ?? 0) > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edition feature management not available - requires ABP SaaS module */}
    </div>
  );
}

interface FormData {
  name: string;
  displayName: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
}

function EditionFormDialog({
  open, edition, onOpenChange, onSaved,
}: {
  open: boolean;
  edition: EditionDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!edition;
  
  const [form, setForm] = useState<FormData>({
    name: "",
    displayName: "",
    monthlyPrice: "0",
    annualPrice: "0",
    description: "",
    displayOrder: "0",
    isActive: true,
  });

  // Initialize form when edition changes
  useEffect(() => {
    if (edition) {
      setForm({
        name: edition.name,
        displayName: edition.displayName,
        monthlyPrice: edition.monthlyPrice.toString(),
        annualPrice: edition.annualPrice.toString(),
        description: edition.description ?? "",
        displayOrder: edition.displayOrder.toString(),
        isActive: edition.isActive,
      });
    } else {
      setForm({
        name: "",
        displayName: "",
        monthlyPrice: "0",
        annualPrice: "0",
        description: "",
        displayOrder: "0",
        isActive: true,
      });
    }
  }, [edition, open]);

  const handleClose = (o: boolean) => {
    if (!o) {
      setForm({
        name: "",
        displayName: "",
        monthlyPrice: "0",
        annualPrice: "0",
        description: "",
        displayOrder: "0",
        isActive: true,
      });
    }
    onOpenChange(o);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const mutation = useMutation({
    mutationFn: () => {
      const monthlyPrice = parseFloat(form.monthlyPrice) || 0;
      const annualPrice = parseFloat(form.annualPrice) || 0;
      const displayOrder = parseInt(form.displayOrder, 10) || 0;
      
      if (isEdit) {
        return updateEdition(edition!.id, {
          displayName: form.displayName,
          monthlyPrice,
          annualPrice,
          description: form.description || undefined,
          displayOrder,
          isActive: form.isActive,
          concurrencyStamp: edition!.concurrencyStamp,
        });
      } else {
        return createEdition({
          name: form.name,
          displayName: form.displayName,
          monthlyPrice,
          annualPrice,
          description: form.description || undefined,
          displayOrder,
          isActive: form.isActive,
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Edition updated" : "Edition created");
      onSaved();
      handleClose(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to save edition"),
  });

  const isValid = form.name.trim() && form.displayName.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit edition" : "Create edition"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update edition details and pricing." 
              : "Create a new SaaS edition with pricing and features."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Name field (create only) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="edition-name">Edition code *</Label>
              <Input 
                id="edition-name"
                value={form.name} 
                onChange={e => updateField("name", e.target.value)} 
                placeholder="standard"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Unique identifier (e.g., standard, premium)</p>
            </div>
          )}
          
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="edition-display">Display name *</Label>
            <Input 
              id="edition-display"
              value={form.displayName} 
              onChange={e => updateField("displayName", e.target.value)} 
              placeholder="Standard Plan"
              className="rounded-xl"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edition-monthly">Monthly price</Label>
              <Input 
                id="edition-monthly"
                type="number"
                min="0"
                step="0.01"
                value={form.monthlyPrice} 
                onChange={e => updateField("monthlyPrice", e.target.value)} 
                placeholder="0"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edition-annual">Annual price</Label>
              <Input 
                id="edition-annual"
                type="number"
                min="0"
                step="0.01"
                value={form.annualPrice} 
                onChange={e => updateField("annualPrice", e.target.value)} 
                placeholder="0"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="edition-order">Display order</Label>
            <Input 
              id="edition-order"
              type="number"
              min="0"
              value={form.displayOrder} 
              onChange={e => updateField("displayOrder", e.target.value)} 
              placeholder="0"
              className="rounded-xl w-32"
            />
            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edition-desc">Description</Label>
            <Input 
              id="edition-desc"
              value={form.description} 
              onChange={e => updateField("description", e.target.value)} 
              placeholder="For small businesses..."
              className="rounded-xl"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 py-2">
            <Switch 
              id="edition-active"
              checked={form.isActive}
              onCheckedChange={v => updateField("isActive", v)}
            />
            <Label htmlFor="edition-active" className="cursor-pointer">
              Active edition
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={!isValid || mutation.isPending} 
            className="bg-gradient-primary text-primary-foreground"
          >
            {mutation.isPending ? "Saving…" : (isEdit ? "Save" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
