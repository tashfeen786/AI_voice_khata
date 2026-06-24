import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, MoreHorizontal, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { RoleFormDialog } from "@/components/admin/RoleFormDialog";
import { RolePermissionsDialog } from "@/components/admin/RolePermissionsDialog";
import { deleteRole, getRoles, IdentityRoleDto } from "@/lib/api/identity-api";

interface Props {
  host?: boolean;
  title: string;
  subtitle: string;
}

export function RolesListPage({ host, title, subtitle }: Props) {
  const qc = useQueryClient();
  const queryKey = ["identity", host ? "host" : "tenant", "roles"];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IdentityRoleDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IdentityRoleDto | null>(null);
  const [permissionsFor, setPermissionsFor] = useState<IdentityRoleDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, page, pageSize, sorting, direction],
    queryFn: () => getRoles({
      skipCount: (page - 1) * pageSize,
      maxResultCount: pageSize,
      sorting: `${sorting} ${direction}`,
    }, { host }),
  });

  const handleSort = (field: string) => {
    if (sorting === field) setDirection(d => (d === "asc" ? "desc" : "asc"));
    else { setSorting(field); setDirection("asc"); }
    setPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id, { host }),
    onSuccess: () => {
      toast.success("Role deleted");
      qc.invalidateQueries({ queryKey });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to delete role"),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 bg-gradient-primary text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> Create Role
        </Button>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft p-4 lg:p-5">
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <SortableHeader field="name" currentField={sorting} direction={direction} onSort={handleSort}>Name</SortableHeader>
                <TableHead>Default</TableHead>
                <TableHead>Public</TableHead>
                <TableHead>System</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>
              ))}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">No roles found</TableCell>
                </TableRow>
              )}
              {!isLoading && items.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{r.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{r.isDefault ? <Badge className="rounded-full">Yes</Badge> : <span className="text-muted-foreground text-sm">No</span>}</TableCell>
                  <TableCell>{r.isPublic ? <span className="text-sm">Yes</span> : <span className="text-muted-foreground text-sm">No</span>}</TableCell>
                  <TableCell>{r.isStatic ? <Badge variant="secondary" className="rounded-full">System</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => setPermissionsFor(r)} className="cursor-pointer gap-2">
                          <KeyRound className="h-4 w-4" /> Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditTarget(r)} className="cursor-pointer gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(r)}
                          disabled={r.isStatic}
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
          totalCount={data?.totalCount ?? 0}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        />
      </Card>

      <RoleFormDialog
        open={createOpen || !!editTarget}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditTarget(null); } }}
        role={editTarget}
        host={host}
        invalidateKey={queryKey}
      />

      {permissionsFor && (
        <RolePermissionsDialog
          open={!!permissionsFor}
          onOpenChange={(o) => !o && setPermissionsFor(null)}
          roleName={permissionsFor.name}
          host={host}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              Users currently assigned to <strong>{deleteTarget?.name}</strong> will lose those permissions.
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
    </div>
  );
}
