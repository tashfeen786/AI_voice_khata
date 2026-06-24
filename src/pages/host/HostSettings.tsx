import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api/api-client";

interface HostSettings {
  defaultCurrency: string;
  defaultTimeZone: string;
  smtpServer?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

const TIMEZONES = ["Asia/Karachi", "Asia/Dubai", "UTC"];
const CURRENCIES = ["PKR", "USD", "INR", "GBP", "EUR"];

export default function HostSettings() {
  const { isHost } = useAuth();
  const [settings, setSettings] = useState<HostSettings>({
    defaultCurrency: "PKR",
    defaultTimeZone: "Asia/Karachi",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get("/api/host/settings");
        setSettings(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    if (isHost) fetchSettings();
  }, [isHost]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put("/api/host/settings", settings);
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isHost) return <div>Access denied</div>;

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Host Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform‑wide configuration</p>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Currency, timezone and other global defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default currency</Label>
              <Select
                value={settings.defaultCurrency}
                onValueChange={(v) => setSettings({ ...settings, defaultCurrency: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Default time zone</Label>
              <Select
                value={settings.defaultTimeZone}
                onValueChange={(v) => setSettings({ ...settings, defaultTimeZone: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 bg-gradient-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Email (SMTP)</CardTitle>
          <CardDescription>Optional – for system notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpServer">SMTP server</Label>
              <Input
                value={settings.smtpServer || ""}
                onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Port</Label>
              <Input
                type="number"
                value={settings.smtpPort || ""}
                onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Username</Label>
              <Input
                value={settings.smtpUser || ""}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Password</Label>
              <Input
                type="password"
                value={settings.smtpPassword || ""}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 bg-gradient-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save SMTP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}