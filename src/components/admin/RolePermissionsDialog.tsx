import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionTree } from "@/components/admin/PermissionTree";
import {
  getPermissionsFor, updatePermissionsFor,
} from "@/lib/api/permissions-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  host?: boolean;
}

export function RolePermissionsDialog({ open, onOpenChange, roleName, host }: Props) {
  const qc = useQueryClient();
  const provider = "R";

  const { data, isLoading } = useQuery({
    queryKey: ["permissions", host ? "host" : "tenant", "role", roleName],
    queryFn: () => getPermissionsFor(provider, roleName, { host }),
    enabled: open && !!roleName,
  });

  const [granted, setGranted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data) {
      const g = new Set<string>();
      data.groups.forEach(grp => grp.permissions.forEach(p => { if (p.isGranted) g.add(p.name); }));
      setGranted(g);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const all = (data?.groups ?? []).flatMap(g => g.permissions);
      const payload = all.map(p => ({ name: p.name, isGranted: granted.has(p.name) }));
      return updatePermissionsFor(provider, roleName, payload, { host });
    },
    onSuccess: () => {
      toast.success("Permissions saved");
      qc.invalidateQueries({ queryKey: ["permissions"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to save permissions"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-3xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Permissions · {roleName}</DialogTitle>
          <DialogDescription>
            Grant or revoke permissions for this role. Changes affect all users assigned to it.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-3 -mr-3">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          )}
          {!isLoading && data && (
            <PermissionTree groups={data.groups} granted={granted} onChange={setGranted} />
          )}
        </ScrollArea>

        <DialogFooter className="border-t border-border/60 pt-4 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !data} className="bg-gradient-primary text-primary-foreground">
            {mutation.isPending ? "Saving…" : "Save permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
