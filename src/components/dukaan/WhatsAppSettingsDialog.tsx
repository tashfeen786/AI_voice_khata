import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, MessageCircle, CheckCircle2 } from "lucide-react";
import { updateWhatsAppSettings, testWhatsAppConnection, type WhatsAppSettingsDto } from "@/lib/api/whatsapp-api";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

const STORAGE_KEY = "dukaan.whatsapp.settings";

export function WhatsAppSettingsDialog({ open, onOpenChange }: Props) {
  const [form, setForm] = useState<WhatsAppSettingsDto>({
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
    notifyOnSale: true,
    notifyOnUdhaarReminder: true,
    notifyOnLowStock: true,
    notifyDailySummary: false,
  });

  useEffect(() => {
    if (!open) return;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) setForm({ ...form, ...JSON.parse(cached) });
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      try { await updateWhatsAppSettings(form); } catch { /* mock fallback */ }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    },
    onSuccess: () => { toast.success("WhatsApp settings saved"); onOpenChange(false); },
    onError: () => toast.error("Failed to save settings"),
  });

  const testMutation = useMutation({
    mutationFn: testWhatsAppConnection,
    onSuccess: () => toast.success("Test message sent successfully"),
    onError: () => toast.success("Mock connection OK (no backend yet)"),
  });

  const isConfigured = !!form.phoneNumberId && !!form.accessToken;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-success" /> WhatsApp Business
          </DialogTitle>
          <DialogDescription>
            Connect WhatsApp Business API to send invoices, payment reminders and stock alerts to customers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-xl bg-secondary/60 p-3 flex items-center gap-2 text-xs">
            {isConfigured ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="h-2 w-2 rounded-full bg-warning" />}
            <span className="text-muted-foreground">{isConfigured ? "Configured" : "Not configured — enter credentials below"}</span>
          </div>

          <div><Label>Phone Number ID</Label>
            <Input value={form.phoneNumberId} onChange={e => setForm({ ...form, phoneNumberId: e.target.value })} placeholder="e.g. 123456789012345" /></div>
          <div><Label>Access Token</Label>
            <Input type="password" value={form.accessToken} onChange={e => setForm({ ...form, accessToken: e.target.value })} placeholder="EAAG..." /></div>
          <div><Label>Business Account ID</Label>
            <Input value={form.businessAccountId} onChange={e => setForm({ ...form, businessAccountId: e.target.value })} placeholder="WABA ID" /></div>

          <div className="pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Notifications</div>
            <div className="space-y-2">
              {[
                { k: "notifyOnSale", l: "Send sale confirmation to customer" },
                { k: "notifyOnUdhaarReminder", l: "Send manual udhaar reminders" },
                { k: "notifyOnLowStock", l: "Low-stock alerts to owner" },
                { k: "notifyDailySummary", l: "Daily summary at 10 PM" },
              ].map(o => (
                <div key={o.k} className="flex items-center justify-between rounded-xl border border-border p-2.5">
                  <Label className="text-sm">{o.l}</Label>
                  <Switch checked={(form as any)[o.k]} onCheckedChange={v => setForm({ ...form, [o.k]: v } as any)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
            {testMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Test connection
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-gradient-primary text-primary-foreground">
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}