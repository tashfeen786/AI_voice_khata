import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createRole, updateRole, IdentityRoleDto } from "@/lib/api/identity-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: IdentityRoleDto | null;
  host?: boolean;
  invalidateKey: unknown[];
}

export function RoleFormDialog({ open, onOpenChange, role, host, invalidateKey }: Props) {
  const qc = useQueryClient();
  const isEdit = !!role;
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setIsDefault(role.isDefault);
      setIsPublic(role.isPublic);
    } else {
      setName(""); setIsDefault(false); setIsPublic(true);
    }
  }, [role, open]);

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? updateRole(role!.id, { name, isDefault, isPublic, concurrencyStamp: role!.concurrencyStamp }, { host })
      : createRole({ name, isDefault, isPublic }, { host }),
    onSuccess: () => {
      toast.success(isEdit ? "Role updated" : "Role created");
      qc.invalidateQueries({ queryKey: invalidateKey });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to save role"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "Create role"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="cashier" disabled={isEdit && role?.isStatic} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <Label className="cursor-pointer">Default role</Label>
              <div className="text-xs text-muted-foreground">Auto-assigned to new users</div>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <Label className="cursor-pointer">Public</Label>
              <div className="text-xs text-muted-foreground">Visible in user profile</div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending} className="bg-gradient-primary text-primary-foreground">
            {mutation.isPending ? "Saving…" : (isEdit ? "Save" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
