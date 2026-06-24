import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFeaturesFor, type FeatureGroupDto, type FeatureDto } from "@/lib/api/features-api";

function isBoolean(f: FeatureDto) {
  return f.value === "true" || f.value === "false";
}

export default function FeatureStatusPage() {
  const { currentUser, tenant } = useAuth();
  const tenantId = currentUser?.tenantid ?? tenant?.id ?? "";
  const [groups, setGroups] = useState<FeatureGroupDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    if (!tenantId) {
      setLoading(false);
      return;
    }
    getFeaturesFor("T", tenantId)
      .then(d => { if (mounted) setGroups(d.groups ?? []); })
      .catch(() => toast.error("Failed to load features"))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [tenantId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold">Feature Status</h1>
        <p className="text-sm text-muted-foreground">
          Feature status is only available for tenant accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Feature Status</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Features enabled for {tenant?.name ?? "your shop"}
        </p>
      </div>

      {groups.map(group => {
        const enabled = group.features.filter(f => isBoolean(f) && f.value === "true");
        const disabled = group.features.filter(f => isBoolean(f) && f.value === "false");
        const numeric = group.features.filter(f => !isBoolean(f) && f.value != null);

        if (enabled.length + disabled.length + numeric.length === 0) return null;

        return (
          <section key={group.name} className="space-y-4">
            <h2 className="font-display text-lg font-semibold">{group.displayName}</h2>

            {enabled.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Enabled
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {enabled.map(f => (
                    <Card key={f.name} className="border-success/30 bg-success/5">
                      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">{f.displayName}</CardTitle>
                        <div className="h-7 w-7 rounded-full bg-success/15 grid place-items-center">
                          <Check className="h-4 w-4 text-success" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="created">Active</Badge>
                        {f.description && (
                          <p className="text-xs text-muted-foreground mt-2">{f.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {numeric.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Usage limits
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {numeric.map(f => (
                    <Card key={f.name}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{f.displayName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="font-display text-2xl font-bold">{f.value}</div>
                        {f.description && (
                          <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {disabled.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Available with upgrade
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {disabled.map(f => (
                    <Card key={f.name} className="border-dashed">
                      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base text-muted-foreground">{f.displayName}</CardTitle>
                        <div className="h-7 w-7 rounded-full bg-muted grid place-items-center">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {f.description && (
                          <p className="text-xs text-muted-foreground">{f.description}</p>
                        )}
                        <Button size="sm" variant="outline" className="w-full gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Upgrade to unlock
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}

      {groups.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No features available for this tenant.
          </CardContent>
        </Card>
      )}
    </div>
  );
}