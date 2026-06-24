import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MoreHorizontal, Pencil, Plus, Search, Settings2, Trash2, UserCog, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { FeatureManagerDialog } from "@/components/admin/FeatureManagerDialog";
import { useAuth } from "@/contexts/AuthContext";
import { tokenStore } from "@/lib/api/token-store";
import {
  createTenant, deleteTenant, getTenants, updateTenant,
  TenantListItemDto, CreateTenantDto,
} from "@/lib/api/host-tenants-api";
import { getAllEditions } from "@/lib/api/editions-api";
import { useDebounce } from "@/hooks/use-debounce";

export default function HostTenants() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState("creationTime");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantListItemDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantListItemDto | null>(null);
  const [featuresFor, setFeaturesFor] = useState<TenantListItemDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["host", "tenants", page, pageSize, sorting, direction, debounced],
    queryFn: () => getTenants({
      skipCount: (page - 1) * pageSize,
      maxResultCount: pageSize,
      sorting: `${sorting} ${direction}`,
      searchQuery: debounced || undefined,
    }),
  });

  const { data: editions } = useQuery({
    queryKey: ["host", "editions", "all"],
    queryFn: getAllEditions,
  });

  const handleSort = (field: string) => {
    if (sorting === field) setDirection(d => (d === "asc" ? "desc" : "asc"));
    else { setSorting(field); setDirection("asc"); }
    setPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      toast.success("Tenant deleted");
      qc.invalidateQueries({ queryKey: ["host", "tenants"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to delete tenant"),
  });

  const impersonate = (t: TenantListItemDto) => {
    tokenStore.setTenant(t.id);
    toast.success(`Switched context to ${t.name}. Reloading…`);
    setTimeout(() => window.location.assign("/"), 600);
  };

  const totalCount = data?.totalCount ?? 0;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all tenants on the SmartDukaan platform.
          </p>
        </div>
        {hasPermission("AbpTenantManagement.Tenants.Create") || hasPermission("Host.Tenants.Create") ? (
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 bg-gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4" /> Create Tenant
          </Button>
        ) : null}
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <SortableHeader field="name" currentField={sorting} direction={direction} onSort={handleSort}>Name</SortableHeader>
                <TableHead>Edition</TableHead>
                <TableHead>Status</TableHead>
                <SortableHeader field="creationTime" currentField={sorting} direction={direction} onSort={handleSort}>Created</SortableHeader>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-8" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">
                    No tenants found
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{t.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{t.editionName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <Badge variant={t.isActive === false ? "secondary" : "default"} className="rounded-full">
                      {t.isActive === false ? "Inactive" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.creationTime ? new Date(t.creationTime).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => setEditTenant(t)} className="cursor-pointer gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => impersonate(t)} className="cursor-pointer gap-2">
                          <LogIn className="h-4 w-4" /> Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFeaturesFor(t)} className="cursor-pointer gap-2">
                          <Settings2 className="h-4 w-4" /> Manage Features
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(t)}
                          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
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

        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </Card>

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        editions={editions ?? []}
        onCreated={() => qc.invalidateQueries({ queryKey: ["host", "tenants"] })}
      />

      <EditTenantDialog
        tenant={editTenant}
        onOpenChange={() => setEditTenant(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["host", "tenants"] })}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete tenant <strong>{deleteTarget?.name}</strong> and all of its data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {featuresFor && (
        <FeatureManagerDialog
          open={!!featuresFor}
          onOpenChange={(o) => !o && setFeaturesFor(null)}
          providerName="T"
          providerKey={featuresFor.id}
          title={`Features · ${featuresFor.name}`}
          subtitle="Manage features for this tenant."
        />
      )}
    </div>
  );
}

function CreateTenantDialog({
  open, onOpenChange, editions, onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editions: { id: string; displayName: string }[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateTenantDto>({
    name: "",
    adminEmailAddress: "",
    adminPassword: "",
    editionId: null,
    activationState: 0,
  });
  const [active, setActive] = useState(true);

  const reset = () => setForm({ name: "", adminEmailAddress: "", adminPassword: "", editionId: null, activationState: 0 });

  const mutation = useMutation({
    mutationFn: () => createTenant({ ...form, activationState: active ? 0 : 1 }),
    onSuccess: () => {
      toast.success("Tenant created");
      onCreated();
      reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to create tenant"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new tenant</DialogTitle>
          <DialogDescription>Spin up a new shop on the platform.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tenant name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="rashid-kiryana" />
          </div>
          <div className="space-y-2">
            <Label>Admin email *</Label>
            <Input type="email" value={form.adminEmailAddress} onChange={e => setForm({ ...form, adminEmailAddress: e.target.value })} placeholder="admin@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Admin password *</Label>
            <Input type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} placeholder="Min 6 characters" />
          </div>
          <div className="space-y-2">
            <Label>Edition</Label>
            <Select
              value={form.editionId ?? "_none"}
              onValueChange={v => setForm({ ...form, editionId: v === "_none" ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="No edition" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No edition</SelectItem>
                {editions.map(e => <SelectItem key={e.id} value={e.id}>{e.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">Inactive tenants cannot sign in</div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.adminEmailAddress || !form.adminPassword || mutation.isPending}
            className="bg-gradient-primary text-primary-foreground"
          >
            {mutation.isPending ? "Creating…" : "Create tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTenantDialog({
  tenant, onOpenChange, onSaved,
}: {
  tenant: TenantListItemDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tenant?.name ?? "");
  const id = tenant?.id;

  // sync when tenant changes
  useMemo(() => { setName(tenant?.name ?? ""); }, [tenant]);

  const mutation = useMutation({
    mutationFn: () => updateTenant(id!, { name, concurrencyStamp: tenant?.concurrencyStamp }),
    onSuccess: () => {
      toast.success("Tenant updated");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to update tenant"),
  });

  return (
    <Dialog open={!!tenant} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Edit tenant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tenant name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending} className="bg-gradient-primary text-primary-foreground">
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
