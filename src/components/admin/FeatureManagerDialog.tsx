import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getFeaturesFor, updateFeaturesFor, resetFeaturesFor, FeatureDto,
} from "@/lib/api/features-api";

// ABP Feature Management provider codes: E=Edition, T=Tenant, D=Default
type ProviderCode = "E" | "T" | "D";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: ProviderCode;
  providerKey: string;
  title: string;
  subtitle?: string;
}

export function FeatureManagerDialog({ open, onOpenChange, providerName, providerKey, title, subtitle }: Props) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["features", providerName, providerKey],
    queryFn: () => getFeaturesFor(providerName, providerKey),
    enabled: open && !!providerKey,
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const v: Record<string, string> = {};
      data.groups.forEach(g => g.features.forEach(f => { v[f.name] = f.value ?? ""; }));
      setValues(v);
    }
  }, [data]);

  const isBoolean = (f: FeatureDto) => {
    const t = f.valueType?.name?.toLowerCase() ?? "";
    return t.includes("toggle") || t.includes("bool");
  };

  const setVal = (name: string, val: string) => setValues(s => ({ ...s, [name]: val }));

  const saveMutation = useMutation({
    mutationFn: () => updateFeaturesFor(providerName, providerKey, Object.entries(values).map(([name, value]) => ({ name, value }))),
    onSuccess: () => {
      toast.success("Features saved");
      qc.invalidateQueries({ queryKey: ["features", providerName, providerKey] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to save features"),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetFeaturesFor(providerName, providerKey),
    onSuccess: () => {
      toast.success("Reset to defaults");
      qc.invalidateQueries({ queryKey: ["features", providerName, providerKey] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to reset"),
  });

  const groups = data?.groups ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-3 -mr-3 max-h-[50vh]">
          <div className="space-y-4 pb-2">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}

            {!isLoading && groups.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                No features configured
              </div>
            )}

            {!isLoading && groups.map(g => (
              <div key={g.name} className="rounded-xl border border-border/60 overflow-hidden">
                <div className="p-3 bg-secondary/50 border-b border-border/60">
                  <div className="font-semibold text-sm">{g.displayName}</div>
                </div>
                <div className="divide-y divide-border/60">
                  {g.features.map(f => (
                    <div key={f.name} className="flex items-center gap-3 p-3" style={{ paddingLeft: 12 + (f.depth ?? 0) * 16 }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{f.displayName}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{f.name}</div>
                      </div>
                      {isBoolean(f) ? (
                        <Switch
                          checked={String(values[f.name]).toLowerCase() === "true"}
                          onCheckedChange={v => setVal(f.name, v ? "true" : "false")}
                        />
                      ) : (
                        <Input
                          className="w-32 h-8 text-sm rounded-lg"
                          value={values[f.name] ?? ""}
                          onChange={e => setVal(f.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 pt-4 mt-2 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="mr-auto text-muted-foreground"
          >
            Reset to defaults
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-gradient-primary text-primary-foreground">
            {saveMutation.isPending ? "Saving…" : "Save features"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
