import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Mail, MoreHorizontal, Pencil, Plus, Search, Trash2, UserCircle } from "lucide-react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { useDebounce } from "@/hooks/use-debounce";
import { deleteUser, getUsers, IdentityUserDto } from "@/lib/api/identity-api";

interface Props {
  host?: boolean;
  title: string;
  subtitle: string;
}

export function UsersListPage({ host, title, subtitle }: Props) {
  const qc = useQueryClient();
  const queryKey = ["identity", host ? "host" : "tenant", "users"];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState("userName");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IdentityUserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IdentityUserDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, page, pageSize, sorting, direction, debounced],
    queryFn: () => getUsers({
      skipCount: (page - 1) * pageSize,
      maxResultCount: pageSize,
      sorting: `${sorting} ${direction}`,
      searchQuery: debounced || undefined,
    }, { host }),
  });

  const handleSort = (field: string) => {
    if (sorting === field) setDirection(d => (d === "asc" ? "desc" : "asc"));
    else { setSorting(field); setDirection("asc"); }
    setPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id, { host }),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to delete user"),
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
          <Plus className="h-4 w-4" /> Create User
        </Button>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users…"
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
                <SortableHeader field="userName" currentField={sorting} direction={direction} onSort={handleSort}>Username</SortableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <SortableHeader field="creationTime" currentField={sorting} direction={direction} onSort={handleSort}>Created</SortableHeader>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>
              ))}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">No users found</TableCell>
                </TableRow>
              )}
              {!isLoading && items.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-primary">
                        <UserCircle className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{u.userName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{[u.name, u.surname].filter(Boolean).join(" ") || "—"}</TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3 w-3" /> {u.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge variant="default" className="rounded-full">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.creationTime ? new Date(u.creationTime).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">
                        <DropdownMenuItem onClick={() => setEditTarget(u)} className="cursor-pointer gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="gap-2 opacity-60">
                          <Lock className="h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(u)}
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

      <UserFormDialog
        open={createOpen || !!editTarget}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditTarget(null); } }}
        host={host}
        user={editTarget}
        invalidateKey={queryKey}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.userName}</strong> will lose access immediately. This cannot be undone.
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
