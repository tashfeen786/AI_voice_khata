import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createUser, updateUser, getAllRoles,
  IdentityUserDto, IdentityUserCreateDto, IdentityUserUpdateDto,
} from "@/lib/api/identity-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  host?: boolean;
  /** When provided, dialog is in edit mode */
  user?: IdentityUserDto | null;
  invalidateKey: unknown[];
}

export function UserFormDialog({ open, onOpenChange, host, user, invalidateKey }: Props) {
  const qc = useQueryClient();
  const isEdit = !!user;

  const [form, setForm] = useState({
    userName: "", name: "", surname: "", email: "", phoneNumber: "", password: "",
    isActive: true, lockoutEnabled: true,
  });
  const [roleNames, setRoleNames] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setForm({
        userName: user.userName,
        name: user.name ?? "",
        surname: user.surname ?? "",
        email: user.email,
        phoneNumber: user.phoneNumber ?? "",
        password: "",
        isActive: user.isActive,
        lockoutEnabled: user.lockoutEnabled,
      });
      setRoleNames(user.roleNames ?? []);
    } else {
      setForm({ userName: "", name: "", surname: "", email: "", phoneNumber: "", password: "", isActive: true, lockoutEnabled: true });
      setRoleNames([]);
    }
  }, [user, open]);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["identity", host ? "host" : "tenant", "roles", "all"],
    queryFn: () => getAllRoles({ host }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && user) {
        const payload: IdentityUserUpdateDto = {
          ...form,
          roleNames,
          concurrencyStamp: user.concurrencyStamp,
          password: form.password || undefined,
        };
        return updateUser(user.id, payload, { host });
      }
      const payload: IdentityUserCreateDto = { ...form, roleNames };
      return createUser(payload, { host });
    },
    onSuccess: () => {
      toast.success(isEdit ? "User updated" : "User created");
      qc.invalidateQueries({ queryKey: invalidateKey });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to save user"),
  });

  const toggleRole = (name: string) => {
    setRoleNames(rn => rn.includes(name) ? rn.filter(r => r !== name) : [...rn, name]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {host ? "Host (SaaS administrator) account." : "Tenant user (shop staff)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Username *</Label>
              <Input value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} disabled={isEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{isEdit ? "New password (optional)" : "Password *"}</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="rounded-xl border border-border/60 p-3 max-h-44 overflow-y-auto space-y-1.5">
              {rolesLoading && <Skeleton className="h-20" />}
              {!rolesLoading && roles?.length === 0 && (
                <div className="text-xs text-muted-foreground">No roles available</div>
              )}
              {!rolesLoading && roles?.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <Checkbox checked={roleNames.includes(r.name)} onCheckedChange={() => toggleRole(r.name)} />
                  <span>{r.name}</span>
                  {r.isDefault && <span className="text-[10px] text-muted-foreground">(default)</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <Label className="cursor-pointer">Active</Label>
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <Label className="cursor-pointer">Lockout enabled</Label>
              <Switch checked={form.lockoutEnabled} onCheckedChange={v => setForm({ ...form, lockoutEnabled: v })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!form.userName || !form.email || (!isEdit && !form.password) || mutation.isPending}
            className="bg-gradient-primary text-primary-foreground"
          >
            {mutation.isPending ? "Saving…" : (isEdit ? "Save changes" : "Create user")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
